import { describe, expect, it } from 'vitest'
import { createAdapter } from '@/adapters/types'

describe('createAdapter', () => {
  it('returns valid adapters and rejects incomplete ones', () => {
    const adapter = { name: 'x', read: () => new URLSearchParams(), write: () => undefined, subscribe: () => () => undefined }
    expect(createAdapter(adapter)).toBe(adapter)
    expect(() => createAdapter({ ...adapter, write: undefined } as unknown as typeof adapter)).toThrow(/write/)
  })
})
