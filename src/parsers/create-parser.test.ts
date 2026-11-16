import { describe, expect, it } from 'vitest'
import { createMultiParser, createParser, safeParse } from '@/parsers/create-parser'

const stars = createParser({ parse: v => v.length, serialize: n => '*'.repeat(n) })

describe('createParser', () => {
  it('builds a single parser with defaults and options', () => {
    expect(stars.type).toBe('single')
    expect(stars.defaultValue).toBeUndefined()
    const withDefault = stars.withDefault(3)
    expect(withDefault.defaultValue).toBe(3)
    expect(stars.defaultValue).toBeUndefined()
    const withOptions = withDefault.withOptions({ history: 'push' }).withOptions({ scroll: true })
    expect(withOptions.options).toEqual({ history: 'push', scroll: true })
    expect(withOptions.defaultValue).toBe(3)
  })

  it('parses server-side values', () => {
    expect(stars.parseServerSide(undefined)).toBeNull()
    expect(stars.parseServerSide(['**', '***'])).toBe(2)
    expect(stars.withDefault(1).parseServerSide(undefined)).toBe(1)
  })

  it('uses strict equality unless eq is given', () => {
    expect(stars.eq(1, 1)).toBe(true)
    const custom = createParser({ parse: v => ({ v }), serialize: o => o.v, eq: (a, b) => a.v === b.v })
    expect(custom.eq({ v: 'a' }, { v: 'a' })).toBe(true)
  })

  it('creates multi parsers', () => {
    const multi = createMultiParser({ parse: v => v.join('|'), serialize: v => v.split('|') })
    expect(multi.type).toBe('multi')
    expect(multi.parseServerSide('a')).toBe('a')
    expect(multi.parseServerSide(['a', 'b'])).toBe('a|b')
  })

  it('safeParse returns null on throw', () => {
    expect(safeParse(() => { throw new Error('x') }, 'v')).toBeNull()
  })
})
