import { debounce } from '@/core/rate-limit'
import type { QueryState } from '@/core/query-state'
import { getUrlState, type UrlStateInstance } from '@/core/url-state'
import { rawToValue, sameValue, valueToRaw, type EmptyAs } from '@/dom/convert'
import { drivers as defaultDrivers, type DriverRegistry } from '@/dom/drivers/registry'
import type { ElementDriver } from '@/dom/drivers/types'
import { parseAsString } from '@/parsers/built-ins'
import type { AnyParser } from '@/parsers/types'
import type { ChangeSource, QueryStateOptions } from '@/types'

export interface SyncDetail {
  readonly key: string
  readonly value: unknown
  readonly source: ChangeSource
}

export type Listen = (element: Element, events: readonly string[], handler: () => void) => () => void
export type Dispatch = (element: Element, detail: SyncDetail) => void

export interface BindOptions extends QueryStateOptions {
  /** DOM event(s) that trigger a URL update. Default: the driver's events (`input` for text, `change` otherwise). */
  readonly event?: string | readonly string[]
  /** Debounce URL writes by this many ms (state still updates instantly). */
  readonly debounce?: number
  /** Force a driver by name or instance. */
  readonly driver?: string | ElementDriver
  /** Treat an empty text value as `null` (removes the key, default) or as an empty string. */
  readonly emptyAs?: EmptyAs
  /** Driver registry. Default: the shared one. */
  readonly drivers?: DriverRegistry
  /** Instance used when binding by key. Default: the shared default instance. */
  readonly instance?: UrlStateInstance
  /** Custom event subscription (the jQuery adapter uses `.on`). */
  readonly listen?: Listen
  /** Custom sync notification (the jQuery adapter uses `.trigger`). */
  readonly dispatch?: Dispatch
}

export interface Binding {
  readonly elements: readonly Element[]
  readonly state: QueryState<unknown>
  readonly driver: ElementDriver
  /** Push the current URL value to the elements. */
  sync(): void
  /** Write the current element value to the URL. */
  commit(options?: QueryStateOptions): Promise<URLSearchParams>
  unbind(): void
}

export type BindTarget = Element | ArrayLike<Element> | Iterable<Element> | string

const registry = new WeakMap<Element, Set<Binding>>()

const defaultListen: Listen = (element, events, handler) => {
  for (const event of events) element.addEventListener(event, handler)
  return () => {
    for (const event of events) element.removeEventListener(event, handler)
  }
}

const defaultDispatch: Dispatch = (element, detail) => {
  element.dispatchEvent(new CustomEvent('urlstate:sync', { detail, bubbles: true }))
}

/** Resolves a selector, element or collection to an element array. */
export function toElements(target: BindTarget): Element[] {
  if (typeof target === 'string') return Array.from(document.querySelectorAll(target))
  if (target instanceof Element) return [target]
  return Array.from(target as ArrayLike<Element>)
}

/** Bindings attached to an element. */
export function getBindings(element: Element): readonly Binding[] {
  return [...(registry.get(element) ?? [])]
}

/** Removes every binding attached to the element(s). */
export function unbindAll(target: BindTarget): void {
  for (const element of toElements(target)) for (const binding of getBindings(element)) binding.unbind()
}

/**
 * Two-way binds form controls to URL state: user input updates the URL, URL changes (Back/Forward, code) update the controls.
 * @example bind('#search', 'q', parseAsString, { debounce: 300 })
 * @example bind(document.querySelectorAll('input[name=size]'), sizeState)
 */
export function bind(target: BindTarget, state: QueryState<unknown>, options?: BindOptions): Binding
export function bind(target: BindTarget, key: string, parser?: AnyParser, options?: BindOptions): Binding
export function bind(target: BindTarget, stateOrKey: QueryState<unknown> | string, parserOrOptions?: AnyParser | BindOptions, maybeOptions?: BindOptions): Binding {
  const ownsState = typeof stateOrKey === 'string'
  const options: BindOptions = (ownsState ? maybeOptions : (parserOrOptions as BindOptions | undefined)) ?? {}
  const state: QueryState<unknown> = ownsState
    ? (options.instance ?? getUrlState()).queryState(stateOrKey, (parserOrOptions as AnyParser | undefined) ?? parseAsString)
    : stateOrKey
  const elements = toElements(target)
  if (elements.length === 0) throw new Error(`[urlstate] bind("${state.key}"): no elements to bind`)
  const registryToUse = options.drivers ?? defaultDrivers
  const driver = typeof options.driver === 'object' ? options.driver : registryToUse.resolve(elements, options.driver)
  const events = options.event === undefined ? driver.events : typeof options.event === 'string' ? options.event.split(/\s+/).filter(Boolean) : options.event
  const listen = options.listen ?? defaultListen
  const dispatch = options.dispatch ?? defaultDispatch
  const parser = state.parser
  const emptyAs = options.emptyAs ?? 'null'
  const { history, scroll, shallow, clearOnDefault, limitUrlUpdates } = options
  const writeOptions: QueryStateOptions = Object.fromEntries(
    Object.entries({ history, scroll, shallow, clearOnDefault, limitUrlUpdates: options.debounce ? debounce(options.debounce) : limitUrlUpdates }).filter(([, v]) => v !== undefined)
  )
  let writing = false

  const readElements = (): unknown => rawToValue(driver.read(elements), parser, emptyAs)
  const writeElements = (value: unknown, source: ChangeSource): void => {
    if (sameValue(readElements(), value, parser)) return
    writing = true
    try {
      driver.write(elements, valueToRaw(value, parser))
    } finally {
      writing = false
    }
    for (const element of elements) dispatch(element, { key: state.key, value, source })
  }

  const commit = (overrides?: QueryStateOptions): Promise<URLSearchParams> => state.set(readElements(), { ...writeOptions, ...overrides })
  const onUserChange = (): void => {
    if (!writing) void commit()
  }
  const offs = elements.map(element => listen(element, events, onUserChange))
  offs.push(state.subscribe((value, meta) => writeElements(value, meta.source)))
  writeElements(state.get(), 'init')

  const binding: Binding = {
    elements,
    state,
    driver,
    sync: () => writeElements(state.get(), 'init'),
    commit,
    unbind() {
      for (const off of offs.splice(0)) off()
      for (const element of elements) registry.get(element)?.delete(binding)
      if (ownsState) state.destroy()
    }
  }
  for (const element of elements) {
    let set = registry.get(element)
    if (!set) registry.set(element, (set = new Set()))
    set.add(binding)
  }
  return binding
}
