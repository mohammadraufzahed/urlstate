import { describe, expect, it } from 'vitest'
import * as nuqs from 'nuqs/server'
import { createSerializer } from '@/server/serializer'
import { parseAsBoolean, parseAsInteger, parseAsNativeArrayOf, parseAsString } from '@/parsers/index'

const serialize = createSerializer({ page: parseAsInteger.withDefault(1), q: parseAsString, b: parseAsNativeArrayOf(parseAsString), f: parseAsBoolean.withDefault(false) }, { urlKeys: { b: 'b[]' } })
const nuqsSerialize = nuqs.createSerializer({ page: nuqs.parseAsInteger.withDefault(1), q: nuqs.parseAsString, b: nuqs.parseAsNativeArrayOf(nuqs.parseAsString), f: nuqs.parseAsBoolean.withDefault(false) }, { urlKeys: { b: 'b[]' } })

describe('createSerializer', () => {
  it('produces the same URLs as nuqs', () => {
    const cases = [
      [{ page: 2, q: 'a b' }],
      [{ page: 1, f: false }],
      ['/products?keep=1#top', { q: 'tv', b: ['x', 'y'] }],
      ['/products?q=old', { q: null }],
      ['/p?page=3&q=x', null],
      [new URLSearchParams('z=1'), { page: 5 }]
    ] as const
    for (const args of cases) {
      const ours = (serialize as (...a: unknown[]) => string)(...args)
      const theirs = (nuqsSerialize as (...a: unknown[]) => string)(...args)
      expect(ours).toBe(theirs)
    }
  })

  it('honours clearOnDefault and processUrlSearchParams', () => {
    const s = createSerializer({ page: parseAsInteger.withDefault(1) }, { clearOnDefault: false, processUrlSearchParams: p => { p.sort(); return p } })
    expect(s('/x?z=1', { page: 1 })).toBe('/x?page=1&z=1')
    expect(s(new URL('https://a.dev/x#h'), { page: 2 })).toBe('https://a.dev/x?page=2#h')
  })
})
