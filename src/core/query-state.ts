import type { ResolvedOptions, UrlStore } from '@/core/store'
import { safeParse } from '@/parsers/create-parser'
import type { AnyParser } from '@/parsers/types'
import type { ChangeSource, QueryStateOptions } from '@/types'

export interface ChangeMeta<T> {
  readonly source: ChangeSource
  readonly previous: T
}

export type StateListener<T> = (value: T, meta: ChangeMeta<T>) => void

export interface SubscribeOptions {
  /** Call the listener right away with the current value. */
  readonly immediate?: boolean
}

export type SetValue<T> = T | null | ((previous: T) => T | null)

/**
 * A typed, observable value bound to one URL query key.
 */
export interface QueryState<T> {
  readonly key: string
  readonly urlKey: string
  readonly parser: AnyParser
  get(): T
  set(next: SetValue<T>, options?: QueryStateOptions): Promise<URLSearchParams>
  reset(options?: QueryStateOptions): Promise<URLSearchParams>
  subscribe(listener: StateListener<T>, options?: SubscribeOptions): () => void
  /** Resolved options for this state (useful for bindings). */
  options(overrides?: QueryStateOptions): ResolvedOptions
  destroy(): void
}

type Serialize = (value: unknown) => string | readonly string[]
type Parse = (value: string | readonly string[]) => unknown

/** Internal implementation; values are `unknown` here and typed at the factory boundary. */
export class QueryStateImpl implements QueryState<unknown> {
  readonly key: string
  readonly urlKey: string
  readonly parser: AnyParser
  private readonly store: UrlStore
  private readonly layers: readonly (QueryStateOptions | undefined)[]
  private value: unknown
  private readonly listeners = new Set<StateListener<unknown>>()
  private readonly off: () => void

  constructor(store: UrlStore, key: string, urlKey: string, parser: AnyParser, layers: readonly (QueryStateOptions | undefined)[]) {
    this.store = store
    this.key = key
    this.urlKey = urlKey
    this.parser = parser
    this.layers = layers
    this.value = this.readFromStore()
    this.off = store.on(urlKey, this, event => {
      this.update(event.parser === this.parser && event.source === 'set' ? event.value : this.readFromStore(), event.source)
    })
  }

  get(): unknown {
    return this.value
  }

  options(overrides?: QueryStateOptions): ResolvedOptions {
    return this.store.resolveOptions(...this.layers, overrides)
  }

  set(next: SetValue<unknown>, overrides?: QueryStateOptions): Promise<URLSearchParams> {
    const resolved = typeof next === 'function' ? (next as (previous: unknown) => unknown)(this.value) : next
    const options = this.options(overrides)
    const defaultValue = this.parser.defaultValue
    const isDefault = resolved !== null && resolved !== undefined && defaultValue !== undefined && this.parser.eq(resolved, defaultValue)
    const query = resolved === null || resolved === undefined || (options.clearOnDefault && isDefault) ? null : (this.parser.serialize as Serialize)(resolved)
    const value = resolved ?? defaultValue ?? null
    this.update(value, 'set')
    return this.store.enqueue(this.urlKey, query, options, { value, query, parser: this.parser, source: 'set', origin: this })
  }

  reset(overrides?: QueryStateOptions): Promise<URLSearchParams> {
    return this.set(null, overrides)
  }

  subscribe(listener: StateListener<unknown>, { immediate = false }: SubscribeOptions = {}): () => void {
    this.listeners.add(listener)
    if (immediate) listener(this.value, { source: 'init', previous: this.value })
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy(): void {
    this.off()
    this.listeners.clear()
  }

  private readFromStore(): unknown {
    const raw = this.store.getQuery(this.urlKey, this.parser.type)
    const fallback = this.parser.defaultValue ?? null
    if (raw === null) return fallback
    return safeParse(this.parser.parse as Parse, raw, this.key) ?? fallback
  }

  private update(value: unknown, source: ChangeSource): void {
    const previous = this.value
    const same = previous !== null && value !== null ? this.parser.eq(previous, value) : previous === value
    if (same) return
    this.value = value
    for (const listener of [...this.listeners]) listener(value, { source, previous })
    if (this.store.isPrimary(this.urlKey, this)) this.store.dispatch('urlstate:change', { key: this.urlKey, value, previous, source })
  }
}
