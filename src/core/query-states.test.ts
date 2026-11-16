import { afterEach, describe, expect, it, vi } from 'vitest'
import { memoryAdapter } from '@/adapters/memory'
import { createUrlState, type UrlStateInstance } from '@/core/url-state'
import { parseAsFloat, parseAsInteger, parseAsString } from '@/parsers/index'

let instance: UrlStateInstance | null = null
afterEach(() => instance?.destroy())

const schema = { lat: parseAsFloat.withDefault(0), lng: parseAsFloat.withDefault(0), q: parseAsString }

describe('queryStates', () => {
  it('reads all keys with url key mapping', () => {
    instance = createUrlState({ adapter: memoryAdapter({ search: '?la=1.5&q=x' }), events: false })
    const coords = instance.queryStates(schema, { urlKeys: { lat: 'la' } })
    expect(coords.get()).toEqual({ lat: 1.5, lng: 0, q: 'x' })
    expect(coords.keys).toEqual(['lat', 'lng', 'q'])
  })

  it('batches partial updates into one URL write and one notification', async () => {
    const onUrlUpdate = vi.fn()
    const adapter = memoryAdapter({ onUrlUpdate })
    instance = createUrlState({ adapter, events: false })
    const coords = instance.queryStates(schema, { history: 'push' })
    const listener = vi.fn()
    coords.subscribe(listener)
    await coords.set({ lat: 1, lng: 2 })
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    expect(adapter.getQueryString()).toBe('?lat=1&lng=2')
    expect(adapter.entries).toHaveLength(2)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0]?.[1]).toEqual({ source: 'set', changedKeys: ['lat', 'lng'], previous: { lat: 0, lng: 0, q: null } })
  })

  it('supports functional updates and clearing everything', async () => {
    const adapter = memoryAdapter({ search: '?lat=1&other=1' })
    instance = createUrlState({ adapter, events: false })
    const coords = instance.queryStates(schema)
    await coords.set(prev => ({ lat: prev.lat + 1 }))
    expect(adapter.getQueryString()).toBe('?lat=2&other=1')
    await coords.set(null)
    expect(adapter.getQueryString()).toBe('?other=1')
    expect(coords.get()).toEqual({ lat: 0, lng: 0, q: null })
  })

  it('notifies on external change and respects per-parser options', async () => {
    const onUrlUpdate = vi.fn()
    const adapter = memoryAdapter({ onUrlUpdate })
    instance = createUrlState({ adapter, events: false })
    const group = instance.queryStates({ page: parseAsInteger.withDefault(1).withOptions({ history: 'push' }), q: parseAsString })
    const listener = vi.fn()
    group.subscribe(listener)
    adapter.setSearch('?page=3')
    await Promise.resolve()
    expect(listener).toHaveBeenCalledWith({ page: 3, q: null }, expect.objectContaining({ source: 'external', changedKeys: ['page'] }))
    await group.set({ page: 4 })
    expect(onUrlUpdate.mock.calls[0]?.[0].options.history).toBe('push')
    group.destroy()
  })
})
