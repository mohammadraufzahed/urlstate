import { afterEach, describe, expect, it, vi } from 'vitest'
import { memoryAdapter } from '@/adapters/memory'
import { debounce, throttle } from '@/core/rate-limit'
import { createUrlState, type UrlStateInstance } from '@/core/url-state'
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsNativeArrayOf, parseAsString } from '@/parsers/index'

let instance: UrlStateInstance | null = null
const setup = (search = '') => {
  const adapter = memoryAdapter({ search })
  instance = createUrlState({ adapter, events: false })
  return { adapter, url: instance }
}

afterEach(() => {
  instance?.destroy()
  vi.useRealTimers()
})

describe('queryState', () => {
  it('reads the initial value, falling back to defaults', () => {
    const { url } = setup('?count=3&bad=x')
    expect(url.queryState('count', parseAsInteger).get()).toBe(3)
    expect(url.queryState('missing', parseAsInteger).get()).toBeNull()
    expect(url.queryState('bad', parseAsInteger.withDefault(7)).get()).toBe(7)
    expect(url.queryState('q').get()).toBeNull()
  })

  it('updates state synchronously and writes the URL once per tick', async () => {
    const onUrlUpdate = vi.fn()
    const adapter = memoryAdapter({ onUrlUpdate })
    instance = createUrlState({ adapter, events: false })
    const a = instance.queryState('a', parseAsInteger)
    const b = instance.queryState('b')
    void a.set(1)
    const promise = b.set('x')
    expect(a.get()).toBe(1)
    expect(adapter.getQueryString()).toBe('')
    const search = await promise
    expect(search.toString()).toBe('a=1&b=x')
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    expect(adapter.getQueryString()).toBe('?a=1&b=x')
  })

  it('supports functional updates, null removal and reset', async () => {
    const { adapter, url } = setup('?count=1&keep=1')
    const count = url.queryState('count', parseAsInteger.withDefault(0))
    await count.set(c => c + 1)
    expect(adapter.getQueryString()).toBe('?count=2&keep=1')
    await count.set(null)
    expect(count.get()).toBe(0)
    expect(adapter.getQueryString()).toBe('?keep=1')
    await count.set(5)
    await count.reset()
    expect(adapter.getQueryString()).toBe('?keep=1')
  })

  it('clears the key when set to the default unless clearOnDefault is false', async () => {
    const { adapter, url } = setup()
    const flag = url.queryState('flag', parseAsBoolean.withDefault(false))
    await flag.set(false)
    expect(adapter.getQueryString()).toBe('')
    await flag.set(false, { clearOnDefault: false })
    expect(adapter.getQueryString()).toBe('?flag=false')
  })

  it('notifies subscribers only on change, with meta', async () => {
    const { url } = setup()
    const q = url.queryState('q')
    const listener = vi.fn()
    const off = q.subscribe(listener, { immediate: true })
    expect(listener).toHaveBeenLastCalledWith(null, { source: 'init', previous: null })
    await q.set('a')
    await q.set('a')
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith('a', { source: 'set', previous: null })
    off()
    await q.set('b')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('syncs instances bound to the same key', async () => {
    const { url } = setup()
    const a = url.queryState('tags', parseAsArrayOf(parseAsString).withDefault([]))
    const b = url.queryState('tags', parseAsString)
    const listener = vi.fn()
    b.subscribe(listener)
    void a.set(['x', 'y'])
    expect(b.get()).toBe('x,y')
    expect(listener).toHaveBeenCalledWith('x,y', { source: 'set', previous: null })
  })

  it('reacts to external navigation and back/forward', async () => {
    const { adapter, url } = setup('?page=1')
    const page = url.queryState('page', parseAsInteger.withDefault(1))
    const listener = vi.fn()
    page.subscribe(listener)
    adapter.setSearch('?page=2')
    expect(page.get()).toBe(2)
    expect(listener).toHaveBeenLastCalledWith(2, { source: 'external', previous: 1 })
    adapter.back()
    expect(page.get()).toBe(1)
    expect(listener).toHaveBeenLastCalledWith(1, { source: 'popstate', previous: 2 })
  })

  it('uses push history when any batched update asks for it', async () => {
    const onUrlUpdate = vi.fn()
    const adapter = memoryAdapter({ onUrlUpdate })
    instance = createUrlState({ adapter, events: false })
    void instance.queryState('a').set('1')
    await instance.queryState('b').set('2', { history: 'push', scroll: true })
    expect(onUrlUpdate.mock.calls[0]?.[0].options).toEqual({ history: 'push', scroll: true, shallow: true })
    expect(adapter.entries).toEqual(['', '?a=1&b=2'])
  })

  it('throttles URL updates while state stays instant', async () => {
    vi.useFakeTimers()
    const onUrlUpdate = vi.fn()
    instance = createUrlState({ adapter: memoryAdapter({ onUrlUpdate }), events: false })
    const q = instance.queryState('q', parseAsString.withOptions({ limitUrlUpdates: throttle(200) }))
    void q.set('a')
    await vi.advanceTimersByTimeAsync(0)
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    void q.set('ab')
    void q.set('abc')
    expect(q.get()).toBe('abc')
    await vi.advanceTimersByTimeAsync(100)
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(100)
    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
    expect(onUrlUpdate.mock.calls[1]?.[0].queryString).toBe('?q=abc')
  })

  it('debounces per key and a non-debounced update cancels the debounce', async () => {
    vi.useFakeTimers()
    const onUrlUpdate = vi.fn()
    instance = createUrlState({ adapter: memoryAdapter({ onUrlUpdate }), events: false })
    const q = instance.queryState('q')
    const first = q.set('a', { limitUrlUpdates: debounce(300) })
    void q.set('ab', { limitUrlUpdates: debounce(300) })
    await vi.advanceTimersByTimeAsync(299)
    expect(onUrlUpdate).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2)
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    expect((await first).get('q')).toBe('ab')
    void q.set('x', { limitUrlUpdates: debounce(300) })
    const last = q.set('y')
    await vi.advanceTimersByTimeAsync(400)
    await last
    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
    expect(onUrlUpdate.mock.calls[1]?.[0].queryString).toBe('?q=y')
  })

  it('never writes the URL with an infinite throttle', async () => {
    const onUrlUpdate = vi.fn()
    instance = createUrlState({ adapter: memoryAdapter({ onUrlUpdate }), events: false })
    const q = instance.queryState('q')
    await q.set('local', { limitUrlUpdates: throttle(Infinity) })
    expect(q.get()).toBe('local')
    expect(onUrlUpdate).not.toHaveBeenCalled()
  })

  it('flush() writes debounced updates immediately', async () => {
    const onUrlUpdate = vi.fn()
    instance = createUrlState({ adapter: memoryAdapter({ onUrlUpdate }), events: false })
    const pending = instance.queryState('q').set('a', { limitUrlUpdates: debounce(10_000) })
    await instance.flush()
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    expect((await pending).get('q')).toBe('a')
  })

  it('applies processUrlSearchParams and default options', async () => {
    const adapter = memoryAdapter({ search: '?z=1' })
    instance = createUrlState({ adapter, events: false, defaultOptions: { history: 'push' }, processUrlSearchParams: s => { s.sort(); return s } })
    await instance.queryState('a').set('1')
    expect(adapter.getQueryString()).toBe('?a=1&z=1')
    expect(adapter.entries).toHaveLength(2)
  })

  it('handles native arrays', async () => {
    const { adapter, url } = setup('?b[]=x&b[]=y')
    const brands = url.queryState('b[]', parseAsNativeArrayOf(parseAsString))
    expect(brands.get()).toEqual(['x', 'y'])
    await brands.set(['z'])
    expect(adapter.getQueryString()).toBe('?b[]=z')
    await brands.set([])
    expect(adapter.getQueryString()).toBe('')
  })

  it('dispatches DOM events once per change', async () => {
    const target = new EventTarget()
    instance = createUrlState({ adapter: memoryAdapter(), events: target })
    const changes = vi.fn()
    const flushes = vi.fn()
    target.addEventListener('urlstate:change', e => changes((e as CustomEvent).detail))
    target.addEventListener('urlstate:flush', e => flushes((e as CustomEvent).detail))
    instance.queryState('q')
    await instance.queryState('q').set('a')
    expect(changes).toHaveBeenCalledTimes(1)
    expect(changes).toHaveBeenCalledWith({ key: 'q', value: 'a', previous: null, source: 'set' })
    expect(flushes).toHaveBeenCalledTimes(1)
    expect(flushes.mock.calls[0]?.[0].url).toBe('?q=a')
  })

  it('stops listening after destroy', () => {
    const { adapter, url } = setup()
    const q = url.queryState('q')
    const listener = vi.fn()
    q.subscribe(listener)
    q.destroy()
    adapter.setSearch('?q=1')
    expect(listener).not.toHaveBeenCalled()
  })
})
