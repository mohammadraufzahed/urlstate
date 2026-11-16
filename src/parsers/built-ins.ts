import { compareArrays, isEqual } from '@/lib/compare'
import { createMultiParser, createParser, safeParse } from '@/parsers/create-parser'
import type { MultiParser, ParserWithDefault, SingleParser } from '@/parsers/types'

/** Plain string, stored as-is. */
export const parseAsString: SingleParser<string> = createParser({ parse: v => v, serialize: String })

/** Integer (`parseInt`), serialized after rounding. */
export const parseAsInteger: SingleParser<number> = createParser({
  parse: v => {
    const int = parseInt(v)
    return int === int ? int : null
  },
  serialize: v => '' + Math.round(v)
})

/** Zero-based index in state, one-based in the URL (`?page=1` → 0). */
export const parseAsIndex: SingleParser<number> = createParser({
  parse: v => {
    const int = parseInt(v)
    return int === int ? int - 1 : null
  },
  serialize: v => '' + Math.round(v + 1)
})

/** Integer encoded as hexadecimal, zero-padded to an even length. */
export const parseAsHex: SingleParser<number> = createParser({
  parse: v => {
    const int = parseInt(v, 16)
    return int === int ? int : null
  },
  serialize: v => {
    const hex = Math.round(v).toString(16)
    return hex < '0' || !(hex.length & 1) ? hex : '0' + hex
  }
})

/** Floating point number (`parseFloat`). */
export const parseAsFloat: SingleParser<number> = createParser({
  parse: v => {
    const float = parseFloat(v)
    return float === float ? float : null
  },
  serialize: String
})

/** Boolean: `true` (case-insensitive) is true, anything else is false. */
export const parseAsBoolean: SingleParser<boolean> = createParser({
  parse: v => v.toLowerCase() === 'true',
  serialize: String
})

function compareDates(a: Date, b: Date): boolean {
  return a.valueOf() === b.valueOf()
}

/** Date stored as `YYYY-MM-DD` (UTC midnight). Impossible calendar dates parse to null. */
export const parseAsIsoDate: SingleParser<Date> = createParser({
  parse: v => {
    const date = new Date(v.slice(0, 10))
    return +date === +date && date.toISOString().slice(0, 10) === v.slice(0, 10) ? date : null
  },
  serialize: v => v.toISOString().slice(0, 10),
  eq: compareDates
})

/** Date stored as a full ISO-8601 string. */
export const parseAsIsoDateTime: SingleParser<Date> = createParser({
  parse: v => {
    const date = new Date(v)
    return +date === +date && parseAsIsoDate.parse(v) ? date : null
  },
  serialize: v => v.toISOString(),
  eq: compareDates
})

/** Date stored as milliseconds since epoch. */
export const parseAsTimestamp: SingleParser<Date> = createParser({
  parse: v => {
    const date = new Date(parseInt(v))
    return +date === +date ? date : null
  },
  serialize: v => '' + v.valueOf(),
  eq: compareDates
})

/** One of a fixed list of strings. */
export function parseAsStringLiteral<const T extends string>(validValues: readonly T[]): SingleParser<T> {
  return createParser({
    parse: query => ((validValues as readonly string[]).includes(query) ? (query as T) : null),
    serialize: String
  })
}

/** Alias of {@link parseAsStringLiteral} for TypeScript string enums. */
export function parseAsStringEnum<T extends string>(validValues: readonly T[]): SingleParser<T> {
  return parseAsStringLiteral(validValues)
}

/** One of a fixed list of numbers. */
export function parseAsNumberLiteral<const T extends number>(validValues: readonly T[]): SingleParser<T> {
  return createParser({
    parse: query => {
      const value = parseFloat(query)
      return (validValues as readonly number[]).includes(value) ? (value as T) : null
    },
    serialize: String
  })
}

/** Minimal Standard Schema v1 shape accepted by {@link parseAsJson}. */
export interface StandardSchemaLike<T> {
  readonly '~standard': {
    validate(value: unknown): { readonly value: T; readonly issues?: undefined } | { readonly issues: readonly unknown[] } | Promise<unknown>
  }
}

export type JsonValidator<T> = StandardSchemaLike<T> | ((value: unknown) => T | null)

/** JSON value, validated with a Standard Schema (zod, valibot, arktype…) or a function. */
export function parseAsJson<T>(validator: JsonValidator<T>): SingleParser<T> {
  return createParser<T>({
    parse: query => {
      try {
        const value: unknown = JSON.parse(query)
        if (typeof validator === 'function') return validator(value)
        const result = validator['~standard'].validate(value)
        if (result instanceof Promise) throw new Error('Only synchronous Standard Schemas are supported in parseAsJson.')
        return result.issues ? null : (result as { value: T }).value
      } catch {
        return null
      }
    },
    serialize: value => JSON.stringify(value),
    eq: (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b)
  })
}

/** Array stored in a single key, joined with a separator (`?tags=a,b`). */
export function parseAsArrayOf<T>(itemParser: SingleParser<T>, separator = ','): SingleParser<T[]> {
  const encodedSeparator = encodeURIComponent(separator)
  return createParser<T[]>(
    {
      parse: query => {
        if (query === '') return []
        return query
          .split(separator)
          .map((item, index) => safeParse(v => itemParser.parse(v), item.replaceAll(encodedSeparator, separator), `[${index}]`))
          .filter((value): value is T => value !== null && value !== undefined)
      },
      serialize: values => values.map(value => itemParser.serialize(value).replaceAll(separator, encodedSeparator)).join(separator),
      eq: (a, b) => compareArrays(a, b, (x, y) => itemParser.eq(x, y))
    },
    { parser: itemParser as SingleParser<unknown>, separator }
  )
}

/** Array stored as repeated keys (`?tag=a&tag=b`). Defaults to `[]`. */
export function parseAsNativeArrayOf<T>(itemParser: SingleParser<T>): ParserWithDefault<T[], readonly string[]> {
  const parser: MultiParser<T[]> = createMultiParser<T[]>({
    parse: query => {
      const parsed = query
        .map((item, index) => safeParse(v => itemParser.parse(v), item, `[${index}]`))
        .filter((value): value is T => value !== null && value !== undefined)
      if (parsed.length > 0) return parsed
      return query.length === 1 && query[0] === '' ? [] : null
    },
    serialize: values => values.map(value => itemParser.serialize(value)),
    eq: (a, b) => compareArrays(a, b, (x, y) => (itemParser.eq ?? isEqual)(x, y))
  })
  return parser.withDefault([])
}
