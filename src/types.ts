/**
 * Shared public types for urlstate.
 */
export type HistoryMode = 'push' | 'replace'

export interface RateLimit {
  readonly method: 'throttle' | 'debounce'
  readonly timeMs: number
}

export interface QueryStateOptions {
  readonly history?: HistoryMode
  readonly scroll?: boolean
  readonly shallow?: boolean
  readonly clearOnDefault?: boolean
  readonly limitUrlUpdates?: RateLimit
}

export interface WriteOptions {
  readonly history: HistoryMode
  readonly scroll: boolean
  readonly shallow: boolean
}

export type ChangeSource = 'init' | 'set' | 'popstate' | 'external' | 'navigate'

export type ProcessUrlSearchParams = (search: URLSearchParams) => URLSearchParams

export type RawQuery = string | readonly string[] | null
