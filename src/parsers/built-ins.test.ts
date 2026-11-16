import { describe, expect, it } from 'vitest'
import * as nuqs from 'nuqs/server'
import { z } from 'zod'
import * as ours from '@/parsers/index'

type Case = { name: string; ours: { parse(v: string): unknown; serialize(v: never): string }; nuqs: { parse(v: string): unknown; serialize(v: never): string }; inputs: string[] }

const cases: Case[] = [
  { name: 'string', ours: ours.parseAsString, nuqs: nuqs.parseAsString, inputs: ['', 'a b', 'é&#'] },
  { name: 'integer', ours: ours.parseAsInteger, nuqs: nuqs.parseAsInteger, inputs: ['1', '-3', '2.7', 'x', '12px'] },
  { name: 'index', ours: ours.parseAsIndex, nuqs: nuqs.parseAsIndex, inputs: ['1', '0', '10', 'x'] },
  { name: 'hex', ours: ours.parseAsHex, nuqs: nuqs.parseAsHex, inputs: ['ff', '0a', 'f', 'zz'] },
  { name: 'float', ours: ours.parseAsFloat, nuqs: nuqs.parseAsFloat, inputs: ['1.5', '-0.25', 'NaN', 'x'] },
  { name: 'boolean', ours: ours.parseAsBoolean, nuqs: nuqs.parseAsBoolean, inputs: ['true', 'TRUE', 'false', 'x'] },
  { name: 'isoDate', ours: ours.parseAsIsoDate, nuqs: nuqs.parseAsIsoDate, inputs: ['2024-02-29', '2021-02-29', '2024-1-1', 'x'] },
  { name: 'isoDateTime', ours: ours.parseAsIsoDateTime, nuqs: nuqs.parseAsIsoDateTime, inputs: ['2024-02-29T10:00:00.000Z', '2021-02-29T00:00:00Z', 'x'] },
  { name: 'timestamp', ours: ours.parseAsTimestamp, nuqs: nuqs.parseAsTimestamp, inputs: ['0', '1700000000000', 'x'] },
  { name: 'stringLiteral', ours: ours.parseAsStringLiteral(['asc', 'desc']), nuqs: nuqs.parseAsStringLiteral(['asc', 'desc'] as const), inputs: ['asc', 'desc', 'x'] },
  { name: 'numberLiteral', ours: ours.parseAsNumberLiteral([10, 25, 50]), nuqs: nuqs.parseAsNumberLiteral([10, 25, 50] as const), inputs: ['10', '25.0', '11'] },
  { name: 'arrayOf', ours: ours.parseAsArrayOf(ours.parseAsInteger), nuqs: nuqs.parseAsArrayOf(nuqs.parseAsInteger), inputs: ['', '1,2,3', '1,x,3'] },
  { name: 'arrayOf string sep', ours: ours.parseAsArrayOf(ours.parseAsString, ';'), nuqs: nuqs.parseAsArrayOf(nuqs.parseAsString, ';'), inputs: ['a;b', 'a%3Bb;c'] }
]

describe('built-in parsers match nuqs', () => {
  for (const c of cases) {
    it(`${c.name}: parse and round-trip`, () => {
      for (const input of c.inputs) {
        const a = c.ours.parse(input)
        const b = c.nuqs.parse(input)
        expect(a).toEqual(b)
        if (a !== null) expect(c.ours.serialize(a as never)).toBe(c.nuqs.serialize(b as never))
      }
    })
  }

  it('serializes values identically', () => {
    expect(ours.parseAsInteger.serialize(2.6)).toBe(nuqs.parseAsInteger.serialize(2.6))
    expect(ours.parseAsHex.serialize(10)).toBe(nuqs.parseAsHex.serialize(10))
    expect(ours.parseAsHex.serialize(255)).toBe(nuqs.parseAsHex.serialize(255))
    expect(ours.parseAsIndex.serialize(0)).toBe('1')
    expect(ours.parseAsArrayOf(ours.parseAsString).serialize(['a,b', 'c'])).toBe(nuqs.parseAsArrayOf(nuqs.parseAsString).serialize(['a,b', 'c']))
  })

  it('native arrays match nuqs', () => {
    const a = ours.parseAsNativeArrayOf(ours.parseAsInteger)
    const b = nuqs.parseAsNativeArrayOf(nuqs.parseAsInteger)
    for (const input of [['1', '2'], ['x'], ['']]) expect(a.parse(input)).toEqual(b.parse(input))
    expect(a.defaultValue).toEqual([])
    expect(a.type).toBe('multi')
    expect(a.serialize([1, 2])).toEqual(['1', '2'])
  })

  it('json validates with standard schema and functions', () => {
    const schema = z.object({ a: z.number() })
    const p = ours.parseAsJson(schema)
    expect(p.parse('{"a":1}')).toEqual({ a: 1 })
    expect(p.parse('{"a":"x"}')).toBeNull()
    expect(p.parse('nope')).toBeNull()
    expect(p.eq({ a: 1 }, { a: 1 })).toBe(true)
    const fn = ours.parseAsJson(v => (typeof v === 'number' ? v : null))
    expect(fn.parse('3')).toBe(3)
    expect(fn.parse('"3"')).toBeNull()
  })

  it('dates compare by time value', () => {
    expect(ours.parseAsIsoDate.eq(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(true)
  })
})
