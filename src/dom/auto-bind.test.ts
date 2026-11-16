import { afterEach, describe, expect, it } from 'vitest'
import { memoryAdapter, type MemoryAdapter } from '@/adapters/memory'
import { createUrlState, type UrlStateInstance } from '@/core/url-state'
import { autoBind } from '@/dom/auto-bind'

let instance: UrlStateInstance
let adapter: MemoryAdapter
afterEach(() => instance.destroy())
const setup = (search: string, html: string) => {
  document.body.innerHTML = html
  adapter = memoryAdapter({ search })
  instance = createUrlState({ adapter, events: false })
}
const fire = (el: Element, type: string) => el.dispatchEvent(new Event(type, { bubbles: true }))

describe('autoBind', () => {
  it('binds declarative elements with parsers and defaults', async () => {
    setup('?page=3&brand=a', `
      <input id="q" data-urlstate="q">
      <input id="page" type="number" data-urlstate="page" data-urlstate-parser="integer" data-urlstate-default="1">
      <input type="checkbox" data-urlstate="brand" value="a"><input type="checkbox" data-urlstate="brand" value="b">
      <input id="stock" type="checkbox" data-urlstate="stock">
      <span id="out" data-urlstate="page" data-urlstate-parser="integer"></span>`)
    const auto = autoBind(document, { instance })
    const page = document.querySelector<HTMLInputElement>('#page')!
    expect(page.value).toBe('3')
    expect(document.querySelector('#out')!.textContent).toBe('3')
    page.value = '1'
    fire(page, 'input')
    const b = document.querySelectorAll<HTMLInputElement>('[data-urlstate=brand]')[1]!
    b.checked = true
    fire(b, 'change')
    const stock = document.querySelector<HTMLInputElement>('#stock')!
    stock.checked = true
    fire(stock, 'change')
    await instance.flush()
    expect(adapter.getQueryString()).toBe('?brand=a&brand=b&stock=true')
    expect(document.querySelector('#out')!.textContent).toBe('1')
    auto.unbind()
  })

  it('supports array parser specs and observes added elements', async () => {
    setup('?tags=x;y', '<div id="root"></div>')
    const root = document.querySelector('#root')!
    const auto = autoBind(root, { instance, observe: true })
    root.innerHTML = '<select multiple data-urlstate="tags" data-urlstate-parser="array" data-urlstate-separator=";"><option>x</option><option>y</option><option>z</option></select>'
    await new Promise(resolve => setTimeout(resolve, 0))
    const select = root.querySelector('select')!
    expect([...select.options].map(o => o.selected)).toEqual([true, true, false])
    expect(auto.bindings).toHaveLength(1)
    root.innerHTML = ''
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(auto.bindings).toHaveLength(0)
    auto.unbind()
  })

  it('rejects unknown parsers', () => {
    setup('', '<input data-urlstate="q" data-urlstate-parser="nope">')
    expect(() => autoBind(document, { instance })).toThrow(/Unknown parser/)
  })
})
