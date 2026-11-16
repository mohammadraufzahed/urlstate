import { QueryStateImpl, type SubscribeOptions } from '@/core/query-state'
import type { UrlStore } from '@/core/store'
import { getUrlKey, type UrlKeys } from '@/lib/url-keys'
import type { ParserMap, Values } from '@/parsers/types'
import type { ChangeSource, QueryStateOptions } from '@/types'

export interface QueryStatesOptions<S> extends QueryStateOptions {
  /** Map variable names to (shorter) URL keys, e.g. `{ latitude: 'lat' }`. */
  readonly urlKeys?: UrlKeys<S>
}

export interface GroupChangeMeta<S extends ParserMap> {
  readonly source: ChangeSource
  readonly changedKeys: readonly (keyof S & string)[]
  readonly previous: Values<S>
}

export type GroupListener<S extends ParserMap> = (values: Values<S>, meta: GroupChangeMeta<S>) => void

export type SetValues<S extends ParserMap> = Partial<Values<S>> | null | ((previous: Values<S>) => Partial<Values<S>> | null)

/**
 * Several related query keys managed as one object; updates are batched into a single URL change.
 */
export interface QueryStates<S extends ParserMap> {
  readonly keys: readonly (keyof S & string)[]
  get(): Values<S>
  set(next: SetValues<S>, options?: QueryStateOptions): Promise<URLSearchParams>
  subscribe(listener: GroupListener<S>, options?: SubscribeOptions): () => void
  destroy(): void
}

/** Internal implementation of {@link QueryStates}. */
export class QueryStatesImpl<S extends ParserMap> implements QueryStates<S> {
  readonly keys: readonly (keyof S & string)[]
  private readonly store: UrlStore
  private readonly children = new Map<keyof S & string, QueryStateImpl>()
  private readonly listeners = new Set<GroupListener<S>>()
  private readonly offs: (() => void)[] = []
  private snapshot: Values<S>
  private batch: { keys: Set<keyof S & string>; source: ChangeSource } | null = null

  constructor(store: UrlStore, parsers: S, { urlKeys, ...options }: QueryStatesOptions<S> = {}) {
    this.store = store
    this.keys = Object.keys(parsers)
    for (const key of this.keys) {
      const parser = parsers[key]
      if (!parser) continue
      const child = new QueryStateImpl(store, key, getUrlKey(urlKeys, key), parser, [options, parser.options])
      this.children.set(key, child)
      this.offs.push(child.subscribe((_value, meta) => this.queueNotify(key, meta.source)))
    }
    this.snapshot = this.get()
  }

  get(): Values<S> {
    const values: Record<string, unknown> = {}
    for (const [key, child] of this.children) values[key] = child.get()
    return values as Values<S>
  }

  set(next: SetValues<S>, options?: QueryStateOptions): Promise<URLSearchParams> {
    const resolved = typeof next === 'function' ? next(this.get()) : next
    let promise: Promise<URLSearchParams> | null = null
    for (const [key, child] of this.children) {
      if (resolved === null) promise = child.set(null, options)
      else if (Object.hasOwn(resolved, key) && resolved[key] !== undefined) promise = child.set(resolved[key], options)
    }
    return promise ?? Promise.resolve(this.store.getSearch())
  }

  subscribe(listener: GroupListener<S>, { immediate = false }: SubscribeOptions = {}): () => void {
    this.listeners.add(listener)
    if (immediate) listener(this.get(), { source: 'init', changedKeys: [], previous: this.get() })
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy(): void {
    for (const off of this.offs) off()
    for (const child of this.children.values()) child.destroy()
    this.listeners.clear()
  }

  private queueNotify(key: keyof S & string, source: ChangeSource): void {
    if (this.batch) {
      this.batch.keys.add(key)
      return
    }
    this.batch = { keys: new Set([key]), source }
    queueMicrotask(() => {
      const batch = this.batch
      this.batch = null
      if (!batch) return
      const previous = this.snapshot
      const values = this.get()
      this.snapshot = values
      for (const listener of [...this.listeners]) listener(values, { source: batch.source, changedKeys: [...batch.keys], previous })
    })
  }
}
