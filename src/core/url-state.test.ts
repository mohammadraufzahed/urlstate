import { afterEach, describe, expect, it } from 'vitest'
import { memoryAdapter } from '@/adapters/memory'
import { configure, getUrlState, queryState, queryStates } from '@/core/url-state'
import { parseAsInteger } from '@/parsers/index'

afterEach(() => configure({}))

describe('default instance', () => {
  it('uses the browser adapter by default in a DOM environment', () => {
    expect(getUrlState().adapter.name).toBe('browser')
  })

  it('can be configured with another adapter', async () => {
    const adapter = memoryAdapter({ search: '?n=2' })
    configure({ adapter, events: false })
    const n = queryState('n', parseAsInteger)
    expect(n.get()).toBe(2)
    await queryStates({ n: parseAsInteger }).set({ n: 3 })
    expect(adapter.getQueryString()).toBe('?n=3')
    expect(queryState('missing').get()).toBeNull()
  })
})
