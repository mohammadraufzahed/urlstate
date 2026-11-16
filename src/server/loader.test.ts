import { describe, expect, it } from 'vitest'
import * as nuqs from 'nuqs/server'
import { createLoader } from '@/server/loader'
import { parseAsArrayOf, parseAsInteger, parseAsNativeArrayOf, parseAsString } from '@/parsers/index'

const load = createLoader({ page: parseAsInteger.withDefault(1), q: parseAsString, tags: parseAsArrayOf(parseAsString), b: parseAsNativeArrayOf(parseAsString) }, { urlKeys: { b: 'b[]' } })
const nuqsLoad = nuqs.createLoader({ page: nuqs.parseAsInteger.withDefault(1), q: nuqs.parseAsString, tags: nuqs.parseAsArrayOf(nuqs.parseAsString), b: nuqs.parseAsNativeArrayOf(nuqs.parseAsString) }, { urlKeys: { b: 'b[]' } })

describe('createLoader', () => {
  it('loads from many input types like nuqs', () => {
    const inputs = ['?page=2&q=tv&tags=a,b&b[]=x&b[]=y', 'https://x.dev/p?page=x', new URLSearchParams('q=1'), new URL('https://x.dev/?b[]=z')]
    for (const input of inputs) expect(load(input)).toEqual(nuqsLoad(input))
    expect(load({ page: '3', b: undefined, 'b[]': ['m'] })).toEqual({ page: 3, q: null, tags: null, b: ['m'] })
    expect(load(new Request('https://x.dev/?q=req')).q).toBe('req')
  })

  it('supports promises and strict mode', async () => {
    expect((await load(Promise.resolve('?page=4'))).page).toBe(4)
    expect(() => load('?page=x', { strict: true })).toThrow(/page/)
    const throwing = createLoader({ n: parseAsInteger.withOptions({}) })
    expect(throwing('?n=1', { strict: true }).n).toBe(1)
  })
})
