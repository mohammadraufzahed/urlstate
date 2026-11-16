import type { QueryState } from '@/core/query-state'
import type { QueryStates, QueryStatesOptions } from '@/core/query-states'
import type { UrlStateConfig, UrlStateInstance } from '@/core/url-state'
import type { AutoBinding, AutoBindOptions } from '@/dom/auto-bind'
import type { BindOptions } from '@/dom/bind'
import type { ElementDriver } from '@/dom/drivers/types'
import type * as parsers from '@/parsers/index'
import type { AnyParser, ParserMap, inferParserType } from '@/parsers/types'
import type { QueryStateOptions, RateLimit } from '@/types'

/** Options for `$(el).urlState()`. */
export type JQueryBindOptions = Omit<BindOptions, 'listen' | 'dispatch' | 'instance'>

/** Options for `$(form).urlStateForm()`. */
export interface UrlStateFormOptions extends QueryStateOptions {
  /** Map control names to URL keys. */
  readonly urlKeys?: Readonly<Record<string, string>>
  /** `'intercept'` (default) writes the URL on submit without reloading; `'native'` lets the browser submit. */
  readonly submit?: 'intercept' | 'native'
  /** Update the URL while the user edits (default true). `false` only updates on submit. */
  readonly live?: boolean
  /** Debounce text-like inputs by this many ms when live (default 300). */
  readonly debounce?: number
}

export interface UrlStateStatic {
  (key: string): QueryState<string | null>
  <P extends AnyParser>(key: string, parser: P, options?: QueryStateOptions): QueryState<inferParserType<P>>
  readonly parsers: typeof parsers
  readonly drivers: { register(driver: ElementDriver): () => void; list(): readonly ElementDriver[] }
  configure(config: UrlStateConfig): void
  instance(): UrlStateInstance
  flush(): Promise<URLSearchParams>
  throttle(timeMs: number): RateLimit
  debounce(timeMs: number): RateLimit
  autoBind(root?: ParentNode, options?: AutoBindOptions): AutoBinding
  readonly version: string
}

export type UrlStatesStatic = <S extends ParserMap>(parsers: S, options?: QueryStatesOptions<S>) => QueryStates<S>

/** Minimal jQuery surface used by the plugin; present in jQuery 3.6 through 4.x. */
export interface JQueryCollection extends ArrayLike<Element> {
  toArray(): Element[]
  on(events: string, handler: (event: Event) => void): JQueryCollection
  off(events: string): JQueryCollection
  trigger(event: string, extra?: readonly unknown[]): JQueryCollection
  val(): unknown
  val(value: string | readonly string[] | null): JQueryCollection
}

export interface JQueryFactory {
  (target: Element | Document | Window | ArrayLike<Element>): JQueryCollection
  fn: Record<string, unknown> & { extend(methods: Record<string, unknown>): unknown; jquery?: string }
  [key: string]: unknown
}
