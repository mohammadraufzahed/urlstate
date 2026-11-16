import { toList, type ElementDriver } from '@/dom/drivers/types'

const isInput = (el: Element, ...types: string[]): el is HTMLInputElement => el instanceof HTMLInputElement && (types.length === 0 || types.includes(el.type))
const hasValueAttribute = (el: HTMLInputElement): boolean => el.hasAttribute('value')

/** Several checkboxes sharing one key → list of checked values. */
export const checkboxGroupDriver: ElementDriver = {
  name: 'checkbox-group',
  events: ['change'],
  matches: els => els.length > 1 && els.every(el => isInput(el, 'checkbox')),
  read: els => (els as HTMLInputElement[]).filter(el => el.checked).map(el => el.value),
  write(els, value) {
    const list = toList(value)
    for (const el of els as HTMLInputElement[]) el.checked = list.includes(el.value)
  }
}

/** Radio buttons sharing one key → the checked value. */
export const radioDriver: ElementDriver = {
  name: 'radio',
  events: ['change'],
  matches: els => els.length > 0 && els.every(el => isInput(el, 'radio')),
  read: els => (els as HTMLInputElement[]).find(el => el.checked)?.value ?? null,
  write(els, value) {
    const selected = toList(value)[0]
    for (const el of els as HTMLInputElement[]) el.checked = selected !== undefined && el.value === selected
  }
}

/**
 * One checkbox. Without a `value` attribute it maps to `'true'`/`'false'`; with one it maps to that value or null.
 */
export const checkboxDriver: ElementDriver = {
  name: 'checkbox',
  events: ['change'],
  matches: els => els.length === 1 && isInput(els[0] as Element, 'checkbox'),
  read(els) {
    const el = els[0] as HTMLInputElement
    if (hasValueAttribute(el)) return el.checked ? el.value : null
    return el.checked ? 'true' : 'false'
  },
  write(els, value) {
    const el = els[0] as HTMLInputElement
    const current = toList(value)
    el.checked = hasValueAttribute(el) ? current.includes(el.value) : current[0] === 'true'
  }
}

/** `<select multiple>` → list of selected option values. */
export const selectMultipleDriver: ElementDriver = {
  name: 'select-multiple',
  events: ['change'],
  matches: els => els.length === 1 && els[0] instanceof HTMLSelectElement && els[0].multiple,
  read: els => Array.from((els[0] as HTMLSelectElement).options).filter(o => o.selected).map(o => o.value),
  write(els, value) {
    const list = toList(value)
    for (const option of Array.from((els[0] as HTMLSelectElement).options)) option.selected = list.includes(option.value)
  }
}

/** `<select>` → selected value (empty string means "no value"). */
export const selectDriver: ElementDriver = {
  name: 'select',
  events: ['change'],
  matches: els => els.length === 1 && els[0] instanceof HTMLSelectElement,
  read: els => (els[0] as HTMLSelectElement).value,
  write(els, value) {
    const select = els[0] as HTMLSelectElement
    const next = toList(value)[0] ?? ''
    const hasOption = Array.from(select.options).some(o => o.value === next)
    select.value = hasOption ? next : (Array.from(select.options).find(o => o.value === '')?.value ?? '')
    if (!hasOption && !Array.from(select.options).some(o => o.value === '')) select.selectedIndex = -1
  }
}

const TEXT_EVENTS = ['input']
const CHANGE_EVENTS = ['change']

const NON_TEXT_TYPES = ['checkbox', 'radio', 'file', 'button', 'submit', 'reset', 'image']
const isTextControl = (el: Element): boolean => el instanceof HTMLTextAreaElement || (isInput(el) && !NON_TEXT_TYPES.includes(el.type))

/** Text-like inputs and textareas → their value; several fields (e.g. `tags[]`) map to an array by position. */
export const inputDriver: ElementDriver = {
  name: 'input',
  events: TEXT_EVENTS,
  matches: els => els.length > 0 && els.every(isTextControl),
  read(els) {
    const values = els.map(el => (el as HTMLInputElement | HTMLTextAreaElement).value)
    if (els.length === 1) return values[0] ?? ''
    while (values.length > 0 && values[values.length - 1] === '') values.pop()
    return values
  },
  write(els, value) {
    const list = toList(value)
    els.forEach((el, index) => {
      const field = el as HTMLInputElement | HTMLTextAreaElement
      const next = list[els.length === 1 ? 0 : index] ?? ''
      if (field.value !== next) field.value = next
    })
  }
}

/** Fallback for any element: reads/writes `textContent`, never emits user changes. */
export const textContentDriver: ElementDriver = {
  name: 'text',
  events: [],
  matches: els => els.length === 1,
  read: els => (els[0] as Element).textContent ?? '',
  write(els, value) {
    ;(els[0] as Element).textContent = toList(value).join(', ')
  }
}

/** Built-in drivers in resolution order. */
export const builtInDrivers: readonly ElementDriver[] = [checkboxGroupDriver, radioDriver, checkboxDriver, selectMultipleDriver, selectDriver, inputDriver, textContentDriver]

export { CHANGE_EVENTS }
