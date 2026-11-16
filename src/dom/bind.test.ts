import { afterEach, describe, expect, it, vi } from 'vitest'
import { memoryAdapter, type MemoryAdapter } from '@/adapters/memory'
import { createUrlState, type UrlStateInstance } from '@/core/url-state'
import { bind, getBindings, unbindAll } from '@/dom/bind'
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsNativeArrayOf, parseAsString } from '@/parsers/index'

let instance: UrlStateInstance
let adapter: MemoryAdapter
const setup = (search: string, html: string) => {
  document.body.innerHTML = html
  adapter = memoryAdapter({ search })
  instance = createUrlState({ adapter, events: false })
}
const fire = (el: Element, type: string) => el.dispatchEvent(new Event(type, { bubbles: true }))

afterEach(() => instance.destroy())

describe('bind', () => {
  it('binds a text input both ways', async () => {
    setup('?q=tv', '<input id="q">')
    const input = document.querySelector<HTMLInputElement>('#q')!
    const binding = bind(input, 'q', parseAsString, { instance })
    expect(input.value).toBe('tv')
    input.value = 'radio'
    fire(input, 'input')
    expect(binding.state.get()).toBe('radio')
    await instance.flush()
    expect(adapter.getQueryString()).toBe('?q=radio')
    input.value = ''
    fire(input, 'input')
    await instance.flush()
    expect(adapter.getQueryString()).toBe('')
    adapter.setSearch('?q=back')
    expect(input.value).toBe('back')
  })

  it('emits urlstate:sync on URL-driven changes only', () => {
    setup('', '<input id="q">')
    const input = document.querySelector<HTMLInputElement>('#q')!
    const onSync = vi.fn()
    input.addEventListener('urlstate:sync', e => onSync((e as CustomEvent).detail))
    bind(input, instance.queryState('q'))
    input.value = 'typed'
    fire(input, 'input')
    expect(onSync).not.toHaveBeenCalled()
    adapter.setSearch('?q=nav')
    expect(onSync).toHaveBeenCalledWith({ key: 'q', value: 'nav', source: 'external' })
  })

  it('binds checkbox groups to arrays (comma and native)', async () => {
    setup('?sizes=s,m&b[]=x', `
      <input type="checkbox" name="s" value="s"><input type="checkbox" name="s" value="m"><input type="checkbox" name="s" value="l">
      <input type="checkbox" name="b" value="x"><input type="checkbox" name="b" value="y">`)
    const sizes = document.querySelectorAll<HTMLInputElement>('[name=s]')
    const brands = document.querySelectorAll<HTMLInputElement>('[name=b]')
    bind(sizes, instance.queryState('sizes', parseAsArrayOf(parseAsString).withDefault([])))
    bind(brands, instance.queryState('b[]', parseAsNativeArrayOf(parseAsString)))
    expect([...sizes].map(c => c.checked)).toEqual([true, true, false])
    expect([...brands].map(c => c.checked)).toEqual([true, false])
    sizes[2]!.checked = true
    fire(sizes[2]!, 'change')
    brands[1]!.checked = true
    fire(brands[1]!, 'change')
    await instance.flush()
    expect(adapter.getQueryString()).toBe('?sizes=s,m,l&b[]=x&b[]=y')
  })

  it('binds radios, selects and a boolean checkbox', async () => {
    setup('?sort=price&page=2', `
      <input type="radio" name="sort" value="name"><input type="radio" name="sort" value="price">
      <select id="page"><option value="1">1</option><option value="2">2</option></select>
      <select id="tags" multiple><option>a</option><option>b</option></select>
      <input type="checkbox" id="stock">`)
    const radios = document.querySelectorAll<HTMLInputElement>('[name=sort]')
    const page = document.querySelector<HTMLSelectElement>('#page')!
    const tags = document.querySelector<HTMLSelectElement>('#tags')!
    const stock = document.querySelector<HTMLInputElement>('#stock')!
    bind(radios, 'sort', parseAsString.withDefault('name'), { instance, history: 'push' })
    bind(page, 'page', parseAsInteger.withDefault(1), { instance })
    bind(tags, 'tags', parseAsNativeArrayOf(parseAsString), { instance })
    bind(stock, 'stock', parseAsBoolean.withDefault(false), { instance })
    expect(radios[1]!.checked).toBe(true)
    expect(page.value).toBe('2')
    radios[0]!.checked = true
    fire(radios[0]!, 'change')
    page.value = '1'
    fire(page, 'change')
    tags.options[1]!.selected = true
    fire(tags, 'change')
    stock.checked = true
    fire(stock, 'change')
    await instance.flush()
    expect(adapter.getQueryString()).toBe('?tags=b&stock=true')
    expect(adapter.entries).toHaveLength(2)
  })

  it('accepts custom events, debounce and selectors, and unbinds', async () => {
    vi.useFakeTimers()
    setup('', '<input class="q"><input class="q">')
    const bindings = [...document.querySelectorAll('.q')].map(el => bind(el, 'q', parseAsString, { instance, event: 'change', debounce: 200 }))
    const [a, b] = document.querySelectorAll<HTMLInputElement>('.q')
    a!.value = 'x'
    fire(a!, 'input')
    expect(bindings[0]!.state.get()).toBeNull()
    fire(a!, 'change')
    expect(b!.value).toBe('x')
    expect(bindings[0]!.state.get()).toBe('x')
    await vi.advanceTimersByTimeAsync(250)
    expect(adapter.getQueryString()).toBe('?q=x')
    expect(getBindings(a!)).toHaveLength(1)
    unbindAll('.q')
    expect(getBindings(a!)).toHaveLength(0)
    vi.useRealTimers()
  })

  it('throws when nothing matches', () => {
    setup('', '')
    expect(() => bind('.missing', 'q', parseAsString, { instance })).toThrow(/no elements/)
  })
})
