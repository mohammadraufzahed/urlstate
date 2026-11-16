import { describe, expect, it } from 'vitest'
import { createSerializer, parseAsString } from 'nuqs/server'
import { renderQueryString } from '@/encoding/render-query-string'

describe('renderQueryString', () => {
  it('returns empty string for empty params', () => {
    expect(renderQueryString(new URLSearchParams())).toBe('')
  })

  it('matches nuqs encoding byte for byte', () => {
    const samples: Record<string, string>[] = [
      { q: 'hello world', 'a&b': '1=2', tags: 'a,b' },
      { x: '100% + "quoted" <tag> `tick` \'s #hash' },
      { 'k?ey': 'é ü 中文', ctl: '\u0001\u001f' }
    ]
    for (const sample of samples) {
      const search = new URLSearchParams(sample)
      const serialize = createSerializer(Object.fromEntries(Object.keys(sample).map(k => [k, parseAsString])))
      expect(renderQueryString(search)).toBe(serialize(sample))
    }
  })

  it('keeps repeated keys', () => {
    const search = new URLSearchParams([['b[]', 'x'], ['b[]', 'y']])
    expect(renderQueryString(search)).toBe('?b[]=x&b[]=y')
  })
})
