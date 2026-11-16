import { describe, expect, it } from 'vitest'
import { rawToValue, sameValue, valueToRaw } from '@/dom/convert'
import { parseAsArrayOf, parseAsInteger, parseAsNativeArrayOf, parseAsString } from '@/parsers/index'

describe('convert', () => {
  it('converts raw element values to typed values', () => {
    expect(rawToValue('', parseAsString)).toBeNull()
    expect(rawToValue('', parseAsString, 'value')).toBe('')
    expect(rawToValue(['1', 'x', '3'], parseAsArrayOf(parseAsInteger))).toEqual([1, 3])
    expect(rawToValue('2', parseAsNativeArrayOf(parseAsInteger))).toEqual([2])
    expect(rawToValue(['4', '5'], parseAsInteger)).toBe(4)
    expect(rawToValue([], parseAsInteger)).toBeNull()
  })

  it('converts typed values to raw values and compares', () => {
    expect(valueToRaw([1, 2], parseAsArrayOf(parseAsInteger))).toEqual(['1', '2'])
    expect(valueToRaw(null, parseAsInteger)).toBeNull()
    expect(valueToRaw(3, parseAsInteger)).toBe('3')
    expect(sameValue(null, undefined, parseAsInteger)).toBe(true)
    expect(sameValue([1], [1], parseAsArrayOf(parseAsInteger))).toBe(true)
  })
})
