import { debounce, throttle } from '@/core/rate-limit'
import type { QueryState } from '@/core/query-state'
import { configure, getUrlState, queryStates } from '@/core/url-state'
import { autoBind } from '@/dom/auto-bind'
import { bind, getBindings, unbindAll, type Binding, type Dispatch, type Listen } from '@/dom/bind'
import { drivers } from '@/dom/drivers/registry'
import * as parsers from '@/parsers/index'
import type { AnyParser, ParserMap } from '@/parsers/types'
import type { JQueryBindOptions, JQueryCollection, JQueryFactory, UrlStateFormOptions, UrlStateStatic } from '@/jquery/types'

const INSTALLED = Symbol.for('urlstate.jquery')
const VERSION = '0.1.0'
const TEXT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number', 'textarea'])
const IGNORED_TYPES = new Set(['button', 'submit', 'reset', 'image', 'file', 'password'])

interface FormRecord {
  readonly bindings: Binding[]
  readonly form: HTMLFormElement
}

const forms = new WeakMap<Element, FormRecord>()
let sequence = 0

const isToggle = (el: Element): boolean => el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')
const isParser = (value: unknown): value is AnyParser => typeof value === 'object' && value !== null && typeof (value as { parse?: unknown }).parse === 'function'

function inferFormParser(name: string, elements: readonly Element[]): AnyParser {
  const first = elements[0]
  const checkboxes = elements.every(el => el instanceof HTMLInputElement && el.type === 'checkbox')
  if (name.endsWith('[]') || (checkboxes && elements.length > 1) || (first instanceof HTMLSelectElement && first.multiple)) return parsers.parseAsNativeArrayOf(parsers.parseAsString)
  if (checkboxes && first instanceof HTMLInputElement && !first.hasAttribute('value')) return parsers.parseAsBoolean.withDefault(false)
  return parsers.parseAsString
}

function controlType(el: Element): string {
  if (el instanceof HTMLTextAreaElement) return 'textarea'
  if (el instanceof HTMLInputElement) return el.type
  return el.tagName.toLowerCase()
}

/**
 * Installs `$.urlState`, `$.urlStates` and the `$.fn.urlState*` methods on a jQuery instance (3.6+). Safe to call twice.
 */
export function installUrlState<J extends JQueryFactory>($: J): J {
  const marked = $ as J & { [INSTALLED]?: boolean }
  if (marked[INSTALLED]) return $
  marked[INSTALLED] = true

  const listen: Listen = (element, events, handler) => {
    const namespace = `.urlstate.urlstate${++sequence}`
    if (events.length > 0) $(element).on(events.map(event => event + namespace).join(' '), handler)
    return () => {
      $(element).off(namespace)
    }
  }
  const dispatch: Dispatch = (element, detail) => {
    $(element).trigger('urlstate:sync', [detail])
  }
  const shared = { listen, dispatch }

  const urlState = ((key: string, parser?: AnyParser, options?: parsers.Parser<unknown>['options']) => getUrlState().queryState(key, parser ?? parsers.parseAsString, options)) as UrlStateStatic
  Object.assign(urlState, {
    parsers,
    drivers: { register: drivers.register, list: drivers.list },
    configure,
    instance: getUrlState,
    flush: () => getUrlState().flush(),
    throttle,
    debounce,
    autoBind: (root?: ParentNode, options = {}) => autoBind(root, { ...shared, ...options }),
    version: VERSION
  })
  Object.assign($, { urlState, urlStates: queryStates })

  function bindCollection(elements: Element[], state: QueryState<unknown>, options: JQueryBindOptions): Binding[] {
    const groups = elements.length > 1 && elements.every(isToggle) ? [elements] : elements.map(el => [el])
    return groups.map(group => bind(group, state, { ...options, ...shared }))
  }

  $.fn.extend({
    urlState(this: JQueryCollection, key: string, parserOrOptions?: AnyParser | JQueryBindOptions, maybeOptions?: JQueryBindOptions) {
      const parser = isParser(parserOrOptions) ? parserOrOptions : parsers.parseAsString
      const options = (isParser(parserOrOptions) ? maybeOptions : parserOrOptions) ?? {}
      const elements = this.toArray()
      if (elements.length === 0) return this
      const state = getUrlState().queryState(key, parser)
      const bindings = bindCollection(elements, state, options)
      let alive = bindings.length
      for (const binding of bindings) {
        const unbind = binding.unbind
        Object.assign(binding, {
          unbind() {
            unbind()
            if (--alive === 0) state.destroy()
          }
        })
      }
      return this
    },

    urlStateForm(this: JQueryCollection, schema?: ParserMap, options: UrlStateFormOptions = {}) {
      const { urlKeys = {}, submit = 'intercept', live = true, debounce: debounceMs = 300, ...queryOptions } = options
      for (const form of this.toArray()) {
        if (!(form instanceof HTMLFormElement) || forms.has(form)) continue
        const byName = new Map<string, Element[]>()
        for (const el of Array.from(form.elements)) {
          const name = el.getAttribute('name')
          if (!name || (el as HTMLInputElement).disabled || IGNORED_TYPES.has(controlType(el))) continue
          if (schema && !Object.hasOwn(schema, name)) continue
          byName.set(name, [...(byName.get(name) ?? []), el])
        }
        const record: FormRecord = { bindings: [], form }
        for (const [name, elements] of byName) {
          const parser = schema?.[name] ?? inferFormParser(name, elements)
          const state = getUrlState().queryState(urlKeys[name] ?? name, parser, queryOptions)
          const text = elements.length === 1 && TEXT_TYPES.has(controlType(elements[0] as Element))
          const bindOptions: JQueryBindOptions = live ? (text && debounceMs > 0 ? { debounce: debounceMs } : {}) : { event: [] }
          record.bindings.push(...bindCollection(elements, state, bindOptions))
        }
        forms.set(form, record)
        if (submit === 'intercept') {
          $(form).on('submit.urlstate', event => {
            event.preventDefault()
            for (const binding of record.bindings) void binding.commit({ limitUrlUpdates: throttle(0) })
            void getUrlState()
              .flush()
              .then(search => $(form).trigger('urlstate:submit', [search]))
          })
        }
        $(form).on('reset.urlstate', () => {
          setTimeout(() => {
            for (const binding of record.bindings) void binding.commit()
          }, 0)
        })
      }
      return this
    },

    urlStateUnbind(this: JQueryCollection) {
      for (const el of this.toArray()) {
        const record = forms.get(el)
        if (record) {
          for (const binding of record.bindings) {
            binding.unbind()
            binding.state.destroy()
          }
          $(el).off('.urlstate')
          forms.delete(el)
        }
        unbindAll(el)
      }
      return this
    },

    urlStateValue(this: JQueryCollection): unknown {
      const el = this.toArray()[0]
      if (!el) return undefined
      const record = forms.get(el)
      if (record) {
        const values: Record<string, unknown> = {}
        for (const binding of record.bindings) values[binding.state.key] = binding.state.get()
        return values
      }
      return getBindings(el)[0]?.state.get()
    }
  })

  if (typeof window !== 'undefined') {
    for (const name of ['urlstate:change', 'urlstate:flush'] as const) {
      window.addEventListener(name, event => {
        $(document).trigger(name, [(event as CustomEvent<unknown>).detail])
      })
    }
  }
  return $
}
