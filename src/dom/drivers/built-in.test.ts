import { describe, expect, it } from 'vitest'
import { checkboxDriver, selectDriver, textContentDriver } from '@/dom/drivers/built-in'

describe('built-in drivers', () => {
  it('handles single checkboxes with and without value', () => {
    const plain = document.createElement('input')
    plain.type = 'checkbox'
    checkboxDriver.write([plain], 'true')
    expect(checkboxDriver.read([plain])).toBe('true')
    const valued = document.createElement('input')
    valued.type = 'checkbox'
    valued.setAttribute('value', 'yes')
    expect(checkboxDriver.read([valued])).toBeNull()
    checkboxDriver.write([valued], 'yes')
    expect(checkboxDriver.read([valued])).toBe('yes')
  })

  it('falls back to the empty option for unknown select values', () => {
    const select = document.createElement('select')
    select.innerHTML = '<option value="">Any</option><option value="a">A</option>'
    selectDriver.write([select], 'zzz')
    expect(select.value).toBe('')
    selectDriver.write([select], 'a')
    expect(selectDriver.read([select])).toBe('a')
  })

  it('renders text content', () => {
    const span = document.createElement('span')
    textContentDriver.write([span], ['a', 'b'])
    expect(textContentDriver.read([span])).toBe('a, b')
  })
})
