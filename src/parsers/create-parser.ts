import { isEqual } from '@/lib/compare'
import { logger } from '@/debug/logger'
import type { ArrayItems, MultiParser, Parser, ParserDefinition, ParserInput, SingleParser } from '@/parsers/types'
import type { QueryStateOptions } from '@/types'

/** Runs a parse function, turning thrown errors into `null` (logged in debug mode). */
export function safeParse<T, I>(parse: (value: I) => T | null, value: I, key?: string): T | null {
  try {
    return parse(value)
  } catch (error) {
    logger.warn(`Error while parsing value ${JSON.stringify(value)}${key ? ` for key "${key}"` : ''}`, error)
    return null
  }
}

interface BuildConfig<T, I extends ParserInput> {
  readonly type: 'single' | 'multi'
  readonly definition: Required<ParserDefinition<T, I>>
  readonly defaultValue: T | undefined
  readonly options: QueryStateOptions
  readonly items: ArrayItems | undefined
}

function build<T, I extends ParserInput>(config: BuildConfig<T, I>): Parser<T, I> {
  const { type, definition, defaultValue, options, items } = config
  const toInput = (raw: string | readonly string[] | undefined): I | undefined => {
    if (raw === undefined) return undefined
    if (type === 'multi') return (typeof raw === 'string' ? [raw] : raw) as I
    return (typeof raw === 'string' ? raw : raw[0]) as I | undefined
  }
  const parser = {
    type,
    defaultValue,
    options,
    items,
    parse: (value: I) => definition.parse(value),
    serialize: (value: T) => definition.serialize(value),
    eq: (a: T, b: T) => definition.eq(a, b),
    parseServerSide(raw: string | readonly string[] | undefined): T | null {
      const input = toInput(raw)
      if (input === undefined) return defaultValue ?? null
      return safeParse(definition.parse, input) ?? defaultValue ?? null
    },
    withDefault(value: T) {
      return build({ ...config, defaultValue: value })
    },
    withOptions(next: QueryStateOptions) {
      return build({ ...config, options: { ...options, ...next } })
    }
  }
  return parser as unknown as Parser<T, I>
}

/**
 * Creates a parser for a single query value (`?key=value`).
 * @example createParser({ parse: v => v.split('★').length - 1, serialize: n => '★'.repeat(n) })
 */
export function createParser<T>(definition: ParserDefinition<T, string>, items?: ArrayItems): SingleParser<T> {
  return build<T, string>({
    type: 'single',
    definition: { eq: isEqual, ...definition },
    defaultValue: undefined,
    options: {},
    items
  })
}

/**
 * Creates a parser that operates on every occurrence of a key (`?tag=a&tag=b`).
 */
export function createMultiParser<T>(definition: ParserDefinition<T, readonly string[]>): MultiParser<T> {
  return build<T, readonly string[]>({
    type: 'multi',
    definition: { eq: isEqual, ...definition },
    defaultValue: undefined,
    options: {},
    items: undefined
  })
}
