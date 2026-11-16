import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hashAdapter } from '@/adapters/hash'
import { createUrlState, type UrlStateInstance } from '@/core/url-state'
import { parseAsInteger } from '@/parsers/index'

let instance: UrlStateInstance | null = null
beforeEach(() => history.replaceState(null, '', '/app?server=1#/list?page=2'))
afterEach(() => instance?.destroy())

describe('hashAdapter', () => {
  it('reads and writes the query inside the hash', async () => {
    instance = createUrlState({ adapter: hashAdapter(), events: false })
    const page = instance.queryState('page', parseAsInteger.withDefault(1))
    expect(page.get()).toBe(2)
    await page.set(3)
    expect(location.search).toBe('?server=1')
    expect(location.hash).toBe('#/list?page=3')
    await page.set(1)
    expect(location.hash).toBe('#/list')
  })

  it('reacts to hash changes', () => {
    instance = createUrlState({ adapter: hashAdapter(), events: false })
    const page = instance.queryState('page', parseAsInteger.withDefault(1))
    history.replaceState(null, '', '/app#/list?page=9')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(page.get()).toBe(9)
  })
})
