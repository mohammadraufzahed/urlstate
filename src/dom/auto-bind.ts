import type { QueryState } from '@/core/query-state'
import { getUrlState, type UrlStateInstance } from '@/core/url-state'
import { bind, type Binding, type BindOptions } from '@/dom/bind'
import { parsers as defaultParsers, type ParserRegistry } from '@/dom/parser-registry'
import { safeParse } from '@/parsers/create-parser'
import type { AnyParser } from '@/parsers/types'
import type { HistoryMode } from '@/types'

export interface AutoBindOptions extends Pick<BindOptions, 'drivers' | 'listen' | 'dispatch'> {
  /** Bind elements added later (uses MutationObserver). Default: false. */
  readonly observe?: boolean
  readonly instance?: UrlStateInstance
  readonly parsers?: ParserRegistry
}

export interface AutoBinding {
  readonly bindings: readonly Binding[]
  /** Scan again for new `[data-urlstate]` elements. */
  refresh(): void
  unbind(): void
}

const SELECTOR = '[data-urlstate]'

const isToggle = (el: Element): boolean => el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')

function inferParserSpec(elements: readonly Element[]): string {
  const first = elements[0]
  if (elements.length > 1 && elements.every(el => el instanceof HTMLInputElement && el.type === 'checkbox')) return 'native-array'
  if (first instanceof HTMLSelectElement && first.multiple) return 'native-array'
  if (elements.length === 1 && first instanceof HTMLInputElement && first.type === 'checkbox' && !first.hasAttribute('value')) return 'boolean'
  return 'string'
}

function readParser(elements: readonly Element[], registry: ParserRegistry): AnyParser {
  const el = elements[0] as HTMLElement
  const spec = el.dataset.urlstateParser ?? inferParserSpec(elements)
  let parser = registry.resolve(spec, el.dataset.urlstateSeparator)
  const fallback = el.dataset.urlstateDefault
  if (fallback !== undefined) {
    const value = parser.type === 'multi' ? safeParse(v => parser.parse(v as never), fallback.split(',')) : safeParse(v => parser.parse(v as never), fallback)
    if (value !== null) parser = (parser.withDefault as (v: unknown) => AnyParser)(value)
  } else if (spec === 'boolean') {
    parser = (parser.withDefault as (v: unknown) => AnyParser)(false)
  }
  return parser
}

function readOptions(el: HTMLElement): BindOptions {
  const { urlstateDebounce, urlstateHistory, urlstateShallow, urlstateScroll, urlstateEvent, urlstateDriver, urlstateClearOnDefault, urlstateEmpty } = el.dataset
  const bool = (v: string | undefined): boolean | undefined => (v === undefined ? undefined : v !== 'false')
  return Object.fromEntries(
    Object.entries({
      debounce: urlstateDebounce ? Number(urlstateDebounce) : undefined,
      history: urlstateHistory as HistoryMode | undefined,
      shallow: bool(urlstateShallow),
      scroll: bool(urlstateScroll),
      clearOnDefault: bool(urlstateClearOnDefault),
      event: urlstateEvent,
      driver: urlstateDriver,
      emptyAs: urlstateEmpty === 'value' ? 'value' : undefined
    }).filter(([, v]) => v !== undefined)
  )
}

/**
 * Binds every `[data-urlstate="key"]` element inside `root`. Radios/checkboxes with the same key become one group.
 * @example <input data-urlstate="q" data-urlstate-debounce="300"> + autoBind()
 */
export function autoBind(root: ParentNode = document, options: AutoBindOptions = {}): AutoBinding {
  const instance = options.instance ?? getUrlState()
  const registry = options.parsers ?? defaultParsers
  const bindings: Binding[] = []
  const bound = new WeakSet<Element>()
  const states = new Map<string, QueryState<unknown>>()

  const scan = (): void => {
    const found = [...(root instanceof Element && root.matches(SELECTOR) ? [root] : []), ...Array.from(root.querySelectorAll(SELECTOR))].filter(el => !bound.has(el))
    const groups = new Map<string, Element[]>()
    for (const el of found) {
      const key = (el as HTMLElement).dataset.urlstate ?? ''
      if (!key) continue
      const group = groups.get(key) ?? []
      group.push(el)
      groups.set(key, group)
    }
    for (const [key, elements] of groups) {
      const toggles = elements.every(isToggle)
      const sets = toggles ? [elements] : elements.map(el => [el])
      const state = states.get(key) ?? instance.queryState(key, readParser(toggles ? elements : [elements[0] as Element], registry))
      states.set(key, state)
      for (const set of sets) {
        bindings.push(bind(set, state, { ...readOptions(set[0] as HTMLElement), drivers: options.drivers, listen: options.listen, dispatch: options.dispatch }))
        for (const el of set) bound.add(el)
      }
    }
  }

  scan()
  let observer: MutationObserver | null = null
  if (options.observe && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      for (let i = bindings.length - 1; i >= 0; i--) {
        const binding = bindings[i] as Binding
        if (binding.elements.every(el => !el.isConnected)) {
          binding.unbind()
          bindings.splice(i, 1)
        }
      }
      scan()
    })
    observer.observe(root as Node, { childList: true, subtree: true })
  }

  return {
    bindings,
    refresh: scan,
    unbind() {
      observer?.disconnect()
      for (const binding of bindings.splice(0)) binding.unbind()
      for (const state of states.values()) state.destroy()
      states.clear()
    }
  }
}
