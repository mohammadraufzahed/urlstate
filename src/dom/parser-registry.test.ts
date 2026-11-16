import { describe, expect, it } from 'vitest'
import { createParserRegistry } from '@/dom/parser-registry'
import { createParser } from '@/parsers/index'

describe('parser registry', () => {
  it('resolves names, array specs and custom parsers', () => {
    const registry = createParserRegistry()
    expect(registry.resolve('integer').parse('4' as never)).toBe(4)
    expect(registry.resolve('array:integer', ';').parse('1;2' as never)).toEqual([1, 2])
    expect(registry.resolve('native-array:float').type).toBe('multi')
    registry.register('upper', createParser({ parse: v => v.toUpperCase(), serialize: v => String(v).toLowerCase() }))
    expect(registry.resolve('upper').parse('a' as never)).toBe('A')
    expect(() => registry.resolve('nope')).toThrow(/Unknown parser/)
  })
})
