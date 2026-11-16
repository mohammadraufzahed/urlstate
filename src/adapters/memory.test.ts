import { describe, expect, it, vi } from 'vitest'
import { memoryAdapter } from '@/adapters/memory'

describe('memoryAdapter', () => {
  it('keeps a history stack', () => {
    const adapter = memoryAdapter({ search: { a: '1', b: ['x', 'y'] } })
    expect(adapter.getQueryString()).toBe('?a=1&b=x&b=y')
    adapter.write(new URLSearchParams('a=2'), { history: 'push', scroll: false, shallow: true })
    adapter.write(new URLSearchParams('a=3'), { history: 'replace', scroll: false, shallow: true })
    expect(adapter.entries).toEqual(['?a=1&b=x&b=y', '?a=3'])
    expect(adapter.index).toBe(1)
  })

  it('notifies subscribers on simulated navigation', () => {
    const adapter = memoryAdapter({ search: '?a=1' })
    const listener = vi.fn()
    const off = adapter.subscribe(listener)
    adapter.setSearch('?a=2')
    expect(listener).toHaveBeenLastCalledWith(new URLSearchParams('a=2'), 'external')
    adapter.back()
    expect(listener).toHaveBeenLastCalledWith(new URLSearchParams('a=1'), 'popstate')
    adapter.forward()
    expect(adapter.read().get('a')).toBe('2')
    off()
    adapter.back()
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('reports writes through onUrlUpdate', () => {
    const onUrlUpdate = vi.fn()
    const adapter = memoryAdapter({ onUrlUpdate })
    adapter.write(new URLSearchParams('q=a b'), { history: 'replace', scroll: false, shallow: true })
    expect(onUrlUpdate.mock.calls[0]?.[0].queryString).toBe('?q=a+b')
  })
})
