import { drivers } from '@/dom/drivers/registry'
import { toList, type ElementDriver } from '@/dom/drivers/types'
import type { JQueryFactory } from '@/jquery/types'

/**
 * Select2: reads with `.val()` and writes with `.val(v).trigger('change.select2')` so only Select2 is notified.
 * @see https://select2.org/programmatic-control/events
 */
export function select2Driver($: JQueryFactory): ElementDriver {
  return {
    name: 'select2',
    events: ['change'],
    matches: els => els.length === 1 && els[0] instanceof HTMLSelectElement && els[0].classList.contains('select2-hidden-accessible'),
    read(els) {
      const value = $(els as Element[]).val()
      if (value === null || value === undefined) return null
      return Array.isArray(value) ? value.map(String) : String(value)
    },
    write(els, value) {
      const select = els[0] as HTMLSelectElement
      $(select)
        .val(select.multiple ? toList(value) : (toList(value)[0] ?? null))
        .trigger('change.select2')
    }
  }
}

interface FlatpickrInstance {
  setDate(date: string | readonly string[], triggerChange?: boolean): void
  clear(triggerChange?: boolean): void
}

/**
 * flatpickr: reads the input value (in `dateFormat`) and writes with `setDate(value, false)`.
 * @see https://flatpickr.js.org/instance-methods-properties-elements/
 */
export const flatpickrDriver: ElementDriver = {
  name: 'flatpickr',
  events: ['change'],
  matches: els => els.length === 1 && '_flatpickr' in (els[0] as object),
  read: els => (els[0] as HTMLInputElement).value,
  write(els, value) {
    const instance = (els[0] as HTMLInputElement & { _flatpickr: FlatpickrInstance })._flatpickr
    const list = toList(value)
    if (list.length === 0 || list[0] === '') instance.clear(false)
    else instance.setDate(typeof value === 'string' ? value : list, false)
  }
}

/** Registers the widget drivers on the shared registry. Returns a function that removes them. */
export function registerWidgetDrivers($: JQueryFactory): () => void {
  const offs = [drivers.register(flatpickrDriver), drivers.register(select2Driver($))]
  return () => {
    for (const off of offs) off()
  }
}
