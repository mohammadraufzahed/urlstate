import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsIndex,
  parseAsInteger,
  parseAsIsoDate,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString,
  parseAsTimestamp
} from '@/parsers/built-ins'
import type { AnyParser, SingleParser } from '@/parsers/types'

/**
 * Named parsers for declarative bindings (`data-urlstate-parser="integer"`, `"array:integer"`, `"native-array"`).
 */
export interface ParserRegistry {
  register(name: string, parser: SingleParser<unknown>): void
  resolve(spec: string, separator?: string): AnyParser
}

const builtIns: Record<string, SingleParser<unknown>> = {
  string: parseAsString,
  integer: parseAsInteger,
  float: parseAsFloat,
  hex: parseAsHex,
  index: parseAsIndex,
  boolean: parseAsBoolean,
  isodate: parseAsIsoDate,
  isodatetime: parseAsIsoDateTime,
  timestamp: parseAsTimestamp,
  json: parseAsJson(value => value)
}

/** Creates a registry with the built-in names. */
export function createParserRegistry(): ParserRegistry {
  const parsers = new Map(Object.entries(builtIns))
  const single = (name: string): SingleParser<unknown> => {
    const parser = parsers.get(name.trim().toLowerCase())
    if (!parser) throw new Error(`[urlstate] Unknown parser "${name}". Register it with parsers.register().`)
    return parser
  }
  return {
    register: (name, parser) => void parsers.set(name.toLowerCase(), parser),
    resolve(spec, separator) {
      const [kind = 'string', item = 'string'] = spec.split(':')
      const normalized = kind.trim().toLowerCase()
      if (normalized === 'array') return parseAsArrayOf(single(item), separator)
      if (normalized === 'native-array') return parseAsNativeArrayOf(single(item))
      return single(normalized)
    }
  }
}

/** The shared registry used by `autoBind`. */
export const parsers: ParserRegistry = createParserRegistry()
