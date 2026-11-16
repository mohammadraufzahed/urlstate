import type { UrlAdapter } from '@/adapters/types'
import { throttle } from '@/core/rate-limit'
import { logger } from '@/debug/logger'
import { readRaw, writeRaw } from '@/lib/search-params'
import type { AnyParser } from '@/parsers/types'
import type { ChangeSource, ProcessUrlSearchParams, QueryStateOptions, RateLimit, RawQuery, WriteOptions } from '@/types'

export interface StoreConfig {
  readonly adapter: UrlAdapter
  readonly defaultOptions?: QueryStateOptions
  readonly processUrlSearchParams?: ProcessUrlSearchParams
  /** Where `urlstate:change` / `urlstate:flush` DOM events are dispatched. Default: `window`; `false` disables. */
  readonly events?: EventTarget | false
}

export interface ResolvedOptions extends WriteOptions {
  readonly clearOnDefault: boolean
  readonly limitUrlUpdates: RateLimit
}

export interface KeyEvent {
  readonly value: unknown
  readonly query: RawQuery
  readonly parser: AnyParser | null
  readonly source: ChangeSource
  readonly origin: unknown
}

export interface ChangeEventDetail {
  readonly key: string
  readonly value: unknown
  readonly previous: unknown
  readonly source: ChangeSource
}

export interface FlushEventDetail {
  readonly search: URLSearchParams
  readonly url: string
  readonly options: WriteOptions
}

type KeyListener = (event: KeyEvent) => void

interface Deferred {
  readonly promise: Promise<URLSearchParams>
  resolve(value: URLSearchParams): void
  reject(error: unknown): void
}

interface PendingEntry {
  readonly query: RawQuery
  readonly options: ResolvedOptions
}

interface DebouncedEntry extends PendingEntry {
  readonly timer: ReturnType<typeof setTimeout>
  readonly deferred: Deferred
}

function createDeferred(): Deferred {
  let resolve: (value: URLSearchParams) => void = () => undefined
  let reject: (error: unknown) => void = () => undefined
  const promise = new Promise<URLSearchParams>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/**
 * Owns the optimistic search params, key subscriptions and the batched, rate-limited URL update queue.
 */
export class UrlStore {
  readonly adapter: UrlAdapter
  private readonly config: StoreConfig
  private optimistic: URLSearchParams
  private readonly listeners = new Map<string, Map<unknown, KeyListener>>()
  private pending = new Map<string, PendingEntry>()
  private readonly debounced = new Map<string, DebouncedEntry>()
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private flushDeferred: Deferred | null = null
  private lastFlushAt = Number.NEGATIVE_INFINITY
  private throttleMs = 0
  private readonly unsubscribe: () => void
  private destroyed = false

  constructor(config: StoreConfig) {
    this.config = config
    this.adapter = config.adapter
    this.optimistic = this.adapter.read()
    this.unsubscribe = this.adapter.subscribe((search, source) => this.handleExternalChange(search, source))
  }

  /** Current (optimistic) query, including updates not yet flushed to the URL. */
  getSearch(): URLSearchParams {
    return new URLSearchParams(this.optimistic)
  }

  getQuery(key: string, type: 'single' | 'multi'): RawQuery {
    return readRaw(this.optimistic, key, type)
  }

  resolveOptions(...layers: readonly (QueryStateOptions | undefined)[]): ResolvedOptions {
    const merged: QueryStateOptions = Object.assign({}, this.config.defaultOptions, ...layers.filter(Boolean))
    return {
      history: merged.history ?? 'replace',
      scroll: merged.scroll ?? false,
      shallow: merged.shallow ?? true,
      clearOnDefault: merged.clearOnDefault ?? true,
      limitUrlUpdates: merged.limitUrlUpdates ?? throttle(this.adapter.defaultThrottleMs ?? 50)
    }
  }

  on(key: string, owner: unknown, listener: KeyListener): () => void {
    let owners = this.listeners.get(key)
    if (!owners) {
      owners = new Map()
      this.listeners.set(key, owners)
    }
    owners.set(owner, listener)
    return () => {
      owners.delete(owner)
      if (owners.size === 0) this.listeners.delete(key)
    }
  }

  /** The first registered owner of a key dispatches DOM change events, so each change is reported once. */
  isPrimary(key: string, owner: unknown): boolean {
    const owners = this.listeners.get(key)
    return owners?.keys().next().value === owner
  }

  dispatch(name: 'urlstate:change', detail: ChangeEventDetail): void
  dispatch(name: 'urlstate:flush', detail: FlushEventDetail): void
  dispatch(name: string, detail: ChangeEventDetail | FlushEventDetail): void {
    const target = this.config.events === undefined ? (typeof window === 'undefined' ? null : window) : this.config.events || null
    if (!target || typeof CustomEvent === 'undefined') return
    target.dispatchEvent(new CustomEvent(name, { detail }))
  }

  /** Applies an update to the optimistic state, notifies other owners of the key and schedules a URL write. */
  enqueue(key: string, query: RawQuery, options: ResolvedOptions, event: KeyEvent): Promise<URLSearchParams> {
    writeRaw(this.optimistic, key, query)
    this.emit(key, event)
    logger.debug(`queue [${key}] = ${JSON.stringify(query)}`, options)
    const limit = options.limitUrlUpdates
    const existing = this.debounced.get(key)
    if (existing) {
      clearTimeout(existing.timer)
      this.debounced.delete(key)
    }
    if (limit.method === 'debounce') {
      const deferred = existing?.deferred ?? createDeferred()
      const timer = setTimeout(() => {
        this.debounced.delete(key)
        this.schedule(key, { query, options: { ...options, limitUrlUpdates: throttle(this.adapter.defaultThrottleMs ?? 50) } }).then(deferred.resolve, deferred.reject)
      }, limit.timeMs)
      this.debounced.set(key, { query, options, timer, deferred })
      return deferred.promise
    }
    const promise = this.schedule(key, { query, options })
    if (existing) promise.then(existing.deferred.resolve, existing.deferred.reject)
    return promise
  }

  /** Writes every pending update (including debounced ones) right now. */
  flush(): Promise<URLSearchParams> {
    for (const [key, entry] of this.debounced) {
      clearTimeout(entry.timer)
      this.pending.set(key, { query: entry.query, options: entry.options })
      this.debounced.delete(key)
      const deferred = this.flushDeferred ?? (this.flushDeferred = createDeferred())
      deferred.promise.then(entry.deferred.resolve, entry.deferred.reject)
    }
    if (this.flushTimer !== null) clearTimeout(this.flushTimer)
    this.flushTimer = null
    return this.runFlush()
  }

  destroy(): void {
    this.destroyed = true
    this.unsubscribe()
    if (this.flushTimer !== null) clearTimeout(this.flushTimer)
    const search = this.getSearch()
    this.flushDeferred?.resolve(new URLSearchParams(search))
    this.flushDeferred = null
    for (const entry of this.debounced.values()) {
      clearTimeout(entry.timer)
      entry.deferred.resolve(new URLSearchParams(search))
    }
    this.debounced.clear()
    this.pending.clear()
    this.listeners.clear()
  }

  private emit(key: string, event: KeyEvent): void {
    const owners = this.listeners.get(key)
    if (!owners) return
    for (const [owner, listener] of [...owners]) {
      if (owner !== event.origin) listener(event)
    }
  }

  private schedule(key: string, entry: PendingEntry): Promise<URLSearchParams> {
    const timeMs = entry.options.limitUrlUpdates.timeMs
    if (!Number.isFinite(timeMs)) return Promise.resolve(this.getSearch())
    this.pending.set(key, entry)
    this.throttleMs = Math.max(this.throttleMs, timeMs, this.adapter.minThrottleMs ?? 0)
    const deferred = this.flushDeferred ?? (this.flushDeferred = createDeferred())
    if (this.flushTimer === null) {
      const delay = Math.max(0, this.lastFlushAt + this.throttleMs - now())
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null
        this.runFlush().catch(() => undefined)
      }, delay)
    }
    return deferred.promise
  }

  private inFlight: Promise<unknown> = Promise.resolve()

  private async runFlush(): Promise<URLSearchParams> {
    const deferred = this.flushDeferred ?? createDeferred()
    this.flushDeferred = null
    const entries = this.pending
    this.pending = new Map()
    this.throttleMs = 0
    const previous = this.inFlight
    let release = (): void => undefined
    this.inFlight = new Promise<void>(resolve => {
      release = resolve
    })
    try {
      await previous
      if (this.destroyed || entries.size === 0) {
        deferred.resolve(this.getSearch())
        return await deferred.promise
      }
      let search = this.adapter.read()
      let history: 'push' | 'replace' = 'replace'
      let scroll = false
      let shallow = true
      for (const [key, { query, options }] of entries) {
        writeRaw(search, key, query)
        if (options.history === 'push') history = 'push'
        if (options.scroll) scroll = true
        if (!options.shallow) shallow = false
      }
      const options: WriteOptions = { history, scroll, shallow }
      this.lastFlushAt = now()
      logger.mark('flush')
      try {
        if (this.config.processUrlSearchParams) search = this.config.processUrlSearchParams(search)
        await this.adapter.write(search, options)
        this.optimistic = this.adapter.read()
        for (const [key, entry] of [...this.pending, ...this.debounced]) writeRaw(this.optimistic, key, entry.query)
        logger.debug(`flush ${this.adapter.getUrl?.(search) ?? search.toString()}`, options)
        this.dispatch('urlstate:flush', { search: new URLSearchParams(search), url: this.adapter.getUrl?.(search) ?? '', options })
        deferred.resolve(new URLSearchParams(search))
      } catch (error) {
        logger.error('Failed to update the URL', error)
        deferred.reject(error)
      }
    } finally {
      release()
    }
    return deferred.promise
  }

  private handleExternalChange(search: URLSearchParams, source: ChangeSource): void {
    logger.debug(`external change (${source}) ${search.toString()}`)
    if (this.flushTimer !== null) clearTimeout(this.flushTimer)
    this.flushTimer = null
    this.flushDeferred?.resolve(new URLSearchParams(search))
    this.flushDeferred = null
    for (const entry of this.debounced.values()) {
      clearTimeout(entry.timer)
      entry.deferred.resolve(new URLSearchParams(search))
    }
    this.debounced.clear()
    this.pending.clear()
    this.optimistic = new URLSearchParams(search)
    for (const key of [...this.listeners.keys()]) {
      this.emit(key, { value: undefined, query: this.getQuery(key, 'multi'), parser: null, source, origin: null })
    }
  }
}
