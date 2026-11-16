import type { RawValue } from '@/dom/drivers/types'
import { safeParse } from '@/parsers/create-parser'
import type { AnyParser } from '@/parsers/types'

type Parse = (value: string | readonly string[]) => unknown
type Serialize = (value: unknown) => string | readonly string[]

export type EmptyAs = 'null' | 'value'

/** Converts a raw element value to typed state using the parser. */
export function rawToValue(raw: RawValue, parser: AnyParser, emptyAs: EmptyAs = 'null'): unknown {
  if (raw === null) return null
  const parse = parser.parse as Parse
  if (parser.type === 'multi') return safeParse(parse, typeof raw === 'string' ? [raw] : raw)
  if (typeof raw !== 'string') {
    if (parser.items) {
      const itemParser = parser.items.parser
      return raw.map(item => safeParse(v => itemParser.parse(v), item)).filter(v => v !== null && v !== undefined)
    }
    const first = raw[0]
    return first === undefined ? null : rawToValue(first, parser, emptyAs)
  }
  if (raw === '' && emptyAs === 'null') return null
  return safeParse(parse, raw)
}

/** Converts typed state to a raw element value using the parser. */
export function valueToRaw(value: unknown, parser: AnyParser): RawValue {
  if (value === null || value === undefined) return null
  if (parser.type !== 'multi' && parser.items && Array.isArray(value)) {
    const itemParser = parser.items.parser
    return value.map(item => itemParser.serialize(item))
  }
  return (parser.serialize as Serialize)(value)
}

/** Null-safe equality using the parser's `eq`. */
export function sameValue(a: unknown, b: unknown, parser: AnyParser): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return (a ?? null) === (b ?? null)
  return parser.eq(a, b)
}
