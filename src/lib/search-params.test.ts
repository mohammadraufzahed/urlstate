import { describe, expect, it } from 'vitest'
import { readRaw, toSearchParams, writeRaw } from '@/lib/search-params'
import { getUrlKey } from '@/lib/url-keys'
import { compareQuery } from '@/lib/compare'

describe('search params helpers', () => {
  it('reads and writes single and multi values', () => {
    const s = new URLSearchParams('a=1&b=x&b=y')
    expect(readRaw(s, 'b', 'multi')).toEqual(['x', 'y'])
    expect(readRaw(s, 'c', 'multi')).toBeNull()
    writeRaw(s, 'b', ['z'])
    writeRaw(s, 'a', null)
    writeRaw(s, 'e', [])
    expect(s.toString()).toBe('b=z&e=')
  })

  it('converts inputs', () => {
    expect(toSearchParams('/p?a=1#h').get('a')).toBe('1')
    expect(toSearchParams('a=2').get('a')).toBe('2')
    expect(toSearchParams(null).size).toBe(0)
    expect(toSearchParams({ a: ['1', '2'] }).getAll('a')).toEqual(['1', '2'])
  })

  it('maps url keys and compares raw queries', () => {
    expect(getUrlKey({ lat: 'la' }, 'lat')).toBe('la')
    expect(getUrlKey<{ lng: unknown }>(undefined, 'lng')).toBe('lng')
    expect(compareQuery(['a'], ['a'])).toBe(true)
    expect(compareQuery('a', ['a'])).toBe(false)
  })
})
