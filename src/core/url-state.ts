import { browserAdapter } from '@/adapters/browser'
import { memoryAdapter } from '@/adapters/memory'
import type { UrlAdapter } from '@/adapters/types'
import { QueryStateImpl, type QueryState } from '@/core/query-state'
import { QueryStatesImpl, type QueryStates, type QueryStatesOptions } from '@/core/query-states'
import { UrlStore, type StoreConfig } from '@/core/store'
import { logger } from '@/debug/logger'
import { parseAsString } from '@/parsers/built-ins'
import type { AnyParser, ParserMap, inferParserType } from '@/parsers/types'
import type { QueryStateOptions } from '@/types'

export interface UrlStateConfig extends Partial<StoreConfig> {
  /** Where state is stored. Default: the browser address bar, or memory outside the browser. */
  readonly adapter?: UrlAdapter
}

/**
 * An isolated urlstate instance with its own adapter, queue and defaults.
 */
export interface UrlStateInstance {
  readonly adapter: UrlAdapter
  queryState(key: string): QueryState<string | null>
  queryState<P extends AnyParser>(key: string, parser: P, options?: QueryStateOptions): QueryState<inferParserType<P>>
  queryStates<S extends ParserMap>(parsers: S, options?: QueryStatesOptions<S>): QueryStates<S>
  /** Current search params, including updates not yet written to the URL. */
  getSearch(): URLSearchParams
  /** Write pending updates immediately (skips throttle/debounce). */
  flush(): Promise<URLSearchParams>
  destroy(): void
}

function defaultAdapter(): UrlAdapter {
  return typeof window !== 'undefined' && typeof history !== 'undefined' ? browserAdapter() : memoryAdapter()
}

/** Creates an isolated instance, e.g. one per embedded widget or per test. */
export function createUrlState(config: UrlStateConfig = {}): UrlStateInstance {
  const store = new UrlStore({ ...config, adapter: config.adapter ?? defaultAdapter() })
  function queryState(key: string, parser: AnyParser = parseAsString, options?: QueryStateOptions): QueryState<unknown> {
    return new QueryStateImpl(store, key, key, parser, [parser.options, options])
  }
  return {
    adapter: store.adapter,
    queryState: queryState as UrlStateInstance['queryState'],
    queryStates: (parsers, options) => new QueryStatesImpl(store, parsers, options),
    getSearch: () => store.getSearch(),
    flush: () => store.flush(),
    destroy: () => store.destroy()
  }
}

let defaultInstance: UrlStateInstance | null = null
let defaultConfig: UrlStateConfig = {}

/** The shared default instance, created lazily on first use. */
export function getUrlState(): UrlStateInstance {
  return (defaultInstance ??= createUrlState(defaultConfig))
}

/** Configures the default instance. Call before creating states; existing states are detached. */
export function configure(config: UrlStateConfig): void {
  defaultConfig = config
  if (defaultInstance) {
    logger.warn('configure() called after states were created; existing states are detached from the URL.')
    defaultInstance.destroy()
    defaultInstance = null
  }
}

/**
 * A typed value bound to one query key on the default instance.
 * @example const page = queryState('page', parseAsInteger.withDefault(1))
 */
export function queryState(key: string): QueryState<string | null>
export function queryState<P extends AnyParser>(key: string, parser: P, options?: QueryStateOptions): QueryState<inferParserType<P>>
export function queryState(key: string, parser?: AnyParser, options?: QueryStateOptions): unknown {
  return getUrlState().queryState(key, parser ?? parseAsString, options)
}

/**
 * Several keys managed together on the default instance.
 * @example const coords = queryStates({ lat: parseAsFloat.withDefault(0), lng: parseAsFloat.withDefault(0) })
 */
export function queryStates<S extends ParserMap>(parsers: S, options?: QueryStatesOptions<S>): QueryStates<S> {
  return getUrlState().queryStates(parsers, options)
}
