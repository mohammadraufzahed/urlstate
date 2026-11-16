import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { browserAdapter } from '@/adapters/browser'
import { createUrlState, type UrlStateInstance } from '@/core/url-state'
import { parseAsInteger } from '@/parsers/index'

let instance: UrlStateInstance | null = null
beforeEach(() => history.replaceState(null, '', '/products?keep=1#top'))
afterEach(() => {
  instance?.destroy()
  instance = null
})

describe('browserAdapter', () => {
  it('reads and writes location.search, keeping path, hash and unknown keys', async () => {
    instance = createUrlState({ adapter: browserAdapter(), events: false })
    const page = instance.queryState('page', parseAsInteger.withDefault(1))
    await page.set(2)
    expect(location.pathname + location.search + location.hash).toBe('/products?keep=1&page=2#top')
    const length = history.length
    await page.set(3, { history: 'push' })
    expect(history.length).toBe(length + 1)
  })

  it('detects popstate and external pushState calls', async () => {
    instance = createUrlState({ adapter: browserAdapter(), events: false })
    const page = instance.queryState('page', parseAsInteger.withDefault(1))
    const listener = vi.fn()
    page.subscribe(listener)
    history.pushState(null, '', '/products?page=5')
    expect(page.get()).toBe(5)
    expect(listener).toHaveBeenLastCalledWith(5, { source: 'external', previous: 1 })
    history.replaceState(null, '', '/products?page=6')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(page.get()).toBe(6)
  })

  it('does not report its own writes as external changes', async () => {
    instance = createUrlState({ adapter: browserAdapter(), events: false })
    const page = instance.queryState('page', parseAsInteger.withDefault(1))
    const listener = vi.fn()
    page.subscribe(listener)
    await page.set(4)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith(4, { source: 'set', previous: 1 })
  })

  it('performs a full navigation with shallow: false', async () => {
    const assign = vi.spyOn(location, 'assign').mockImplementation(() => undefined)
    const replace = vi.spyOn(location, 'replace').mockImplementation(() => undefined)
    instance = createUrlState({ adapter: browserAdapter(), events: false })
    await instance.queryState('q').set('tv', { shallow: false })
    expect(replace).toHaveBeenCalledWith('/products?keep=1&q=tv#top')
    await instance.queryState('q').set('pc', { shallow: false, history: 'push' })
    expect(assign).toHaveBeenCalledWith('/products?keep=1&q=pc#top')
  })

  it('scrolls to top when asked', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    instance = createUrlState({ adapter: browserAdapter(), events: false })
    await instance.queryState('q').set('x', { scroll: true })
    expect(scrollTo).toHaveBeenCalled()
  })

  it('syncs separate instances through the history patch', async () => {
    instance = createUrlState({ adapter: browserAdapter(), events: false })
    const other = createUrlState({ adapter: browserAdapter(), events: false })
    const a = instance.queryState('q')
    const b = other.queryState('q')
    await a.set('shared')
    expect(b.get()).toBe('shared')
    other.destroy()
  })
})
