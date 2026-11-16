import { renderQueryString } from '@/encoding/render-query-string'
import { getUrlKey, type UrlKeys } from '@/lib/url-keys'
import { writeRaw } from '@/lib/search-params'
import type { ParserMap, Values } from '@/parsers/types'
import type { ProcessUrlSearchParams } from '@/types'

export interface SerializerOptions<S> {
  readonly clearOnDefault?: boolean
  readonly urlKeys?: UrlKeys<S>
  readonly processUrlSearchParams?: ProcessUrlSearchParams
}

export type SerializerBase = string | URL | URLSearchParams

export type SerializerValues<S extends ParserMap> = { [K in keyof S]?: Values<S>[K] | null }

export interface Serializer<S extends ParserMap> {
  (values: SerializerValues<S> | null): string
  (base: SerializerBase, values: SerializerValues<S> | null): string
}

function splitBase(base: SerializerBase): [string, URLSearchParams, string] {
  if (base instanceof URLSearchParams) return ['', new URLSearchParams(base), '']
  if (base instanceof URL) return [base.origin + base.pathname, new URLSearchParams(base.search), base.hash]
  const hashAt = base.indexOf('#')
  const path = hashAt === -1 ? base : base.slice(0, hashAt)
  const hash = hashAt === -1 ? '' : base.slice(hashAt)
  const queryAt = path.indexOf('?')
  const pathname = queryAt === -1 ? path : path.slice(0, queryAt)
  return [pathname, new URLSearchParams(queryAt === -1 ? '' : path.slice(queryAt + 1)), hash.length > 1 ? hash : '']
}

const isBase = (value: unknown): value is SerializerBase => typeof value === 'string' || value instanceof URL || value instanceof URLSearchParams

/**
 * Creates a function that renders typed values to a query string, optionally merged into a base URL.
 * @example const href = createSerializer({ page: parseAsInteger })('/products', { page: 2 }) // '/products?page=2'
 */
export function createSerializer<S extends ParserMap>(parsers: S, { clearOnDefault = true, urlKeys, processUrlSearchParams }: SerializerOptions<S> = {}): Serializer<S> {
  function serialize(baseOrValues: SerializerBase | SerializerValues<S> | null, maybeValues: SerializerValues<S> | null = {}): string {
    const [base, initialSearch, hash] = isBase(baseOrValues) ? splitBase(baseOrValues) : ['', new URLSearchParams(), '']
    let search = initialSearch
    const values = isBase(baseOrValues) ? maybeValues : baseOrValues
    for (const key of Object.keys(parsers)) {
      const parser = parsers[key]
      if (!parser) continue
      const urlKey = getUrlKey(urlKeys, key)
      if (values === null) {
        search.delete(urlKey)
        continue
      }
      if (!Object.hasOwn(values, key)) continue
      const value: unknown = values[key]
      if (value === undefined) continue
      const isDefault = parser.defaultValue !== undefined && value !== null && parser.eq(value, parser.defaultValue)
      if (value === null || ((parser.options.clearOnDefault ?? clearOnDefault) && isDefault)) search.delete(urlKey)
      else writeRaw(search, urlKey, (parser.serialize as (v: unknown) => string | readonly string[])(value))
    }
    if (processUrlSearchParams) search = processUrlSearchParams(search)
    return base + renderQueryString(search) + hash
  }
  return serialize as Serializer<S>
}
