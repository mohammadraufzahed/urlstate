import type { ChangeSource, WriteOptions } from '@/types'

/**
 * A URL adapter decides where state is stored (address bar, hash, memory…).
 */
export interface UrlAdapter {
  readonly name: string
  read(): URLSearchParams
  write(search: URLSearchParams, options: WriteOptions): void | Promise<void>
  subscribe(onExternalChange: (search: URLSearchParams, source: ChangeSource) => void): () => void
  getUrl?(search: URLSearchParams): string
  readonly defaultThrottleMs?: number
  readonly minThrottleMs?: number
}

/** Validates and returns a custom adapter. */
export function createAdapter<A extends UrlAdapter>(adapter: A): A {
  for (const method of ['read', 'write', 'subscribe'] as const) {
    if (typeof adapter[method] !== 'function') throw new TypeError(`[urlstate] Adapter "${adapter.name}" must implement ${method}()`)
  }
  return adapter
}
