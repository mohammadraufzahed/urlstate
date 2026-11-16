import { createAdapter, type UrlAdapter } from '@/adapters/types'
import { renderQueryString } from '@/encoding/render-query-string'
import { toSearchParams } from '@/lib/search-params'
import type { ChangeSource, WriteOptions } from '@/types'

export interface UrlUpdateEvent {
  readonly searchParams: URLSearchParams
  readonly queryString: string
  readonly options: WriteOptions
}

export interface MemoryAdapterOptions {
  /** Initial query (`'?q=1'`, URLSearchParams or a record). */
  readonly search?: string | URLSearchParams | Record<string, string | readonly string[]>
  /** Called after every URL write; handy for assertions in tests. */
  readonly onUrlUpdate?: (event: UrlUpdateEvent) => void
  /** Default throttle in ms. Default: 0 (flush on the next macrotask). */
  readonly throttleMs?: number
}

export interface MemoryAdapter extends UrlAdapter {
  /** Query strings of each history entry. */
  readonly entries: readonly string[]
  /** Index of the current entry. */
  readonly index: number
  /** Current query string, e.g. `?q=1`. */
  getQueryString(): string
  /** Simulates a navigation made outside urlstate. */
  setSearch(search: string | URLSearchParams | Record<string, string | readonly string[]>, options?: { history?: 'push' | 'replace'; source?: ChangeSource }): void
  /** Simulates the Back button. */
  back(): void
  /** Simulates the Forward button. */
  forward(): void
}

/**
 * Keeps state in memory. Use it in tests, Node scripts, or embedded widgets that must not touch the address bar.
 */
export function memoryAdapter(options: MemoryAdapterOptions = {}): MemoryAdapter {
  const entries: string[] = [renderQueryString(toSearchParams(options.search))]
  let index = 0
  const listeners = new Set<(search: URLSearchParams, source: ChangeSource) => void>()
  const current = (): string => entries[index] ?? ''
  const notify = (source: ChangeSource): void => {
    for (const listener of listeners) listener(new URLSearchParams(current()), source)
  }
  const commit = (queryString: string, mode: 'push' | 'replace'): void => {
    if (mode === 'push') {
      entries.splice(index + 1)
      entries.push(queryString)
      index = entries.length - 1
    } else {
      entries[index] = queryString
    }
  }

  return createAdapter({
    name: 'memory',
    defaultThrottleMs: options.throttleMs ?? 0,
    minThrottleMs: 0,
    get entries() {
      return [...entries]
    },
    get index() {
      return index
    },
    getUrl: search => renderQueryString(search),
    getQueryString: current,
    read: () => new URLSearchParams(current()),
    write(search, writeOptions) {
      const queryString = renderQueryString(search)
      commit(queryString, writeOptions.history)
      options.onUrlUpdate?.({ searchParams: new URLSearchParams(search), queryString, options: writeOptions })
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setSearch(search, { history = 'push', source = 'external' } = {}) {
      commit(renderQueryString(toSearchParams(search)), history)
      notify(source)
    },
    back() {
      if (index === 0) return
      index--
      notify('popstate')
    },
    forward() {
      if (index >= entries.length - 1) return
      index++
      notify('popstate')
    }
  })
}
