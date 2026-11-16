import { getUrlKey, type UrlKeys } from '@/lib/url-keys'
import { readRaw, toSearchParams } from '@/lib/search-params'
import type { ParserMap, Values } from '@/parsers/types'

export type LoaderInput = string | URL | URLSearchParams | Request | Record<string, string | readonly string[] | undefined>

export interface LoaderOptions<S> {
  readonly urlKeys?: UrlKeys<S>
}

export interface LoadOptions {
  /** Throw instead of falling back to the default when a value is present but invalid. */
  readonly strict?: boolean
}

export interface Loader<S extends ParserMap> {
  (input: LoaderInput, options?: LoadOptions): Values<S>
  (input: Promise<LoaderInput>, options?: LoadOptions): Promise<Values<S>>
}

/**
 * Creates a function that reads typed values from a URL, Request, query string or record (Node, workers, SSR).
 * @example const load = createLoader({ page: parseAsInteger.withDefault(1) }); load(req.url).page
 */
export function createLoader<S extends ParserMap>(parsers: S, { urlKeys }: LoaderOptions<S> = {}): Loader<S> {
  function load(input: LoaderInput | Promise<LoaderInput>, { strict = false }: LoadOptions = {}): Values<S> | Promise<Values<S>> {
    if (input instanceof Promise) return input.then(resolved => load(resolved, { strict }))
    const search = toSearchParams(input)
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(parsers)) {
      const parser = parsers[key]
      if (!parser) continue
      const urlKey = getUrlKey(urlKeys, key)
      const raw = readRaw(search, urlKey, parser.type)
      if (raw === null) {
        result[key] = parser.defaultValue ?? null
        continue
      }
      let parsed: unknown
      try {
        parsed = (parser.parse as (value: string | readonly string[]) => unknown)(raw)
      } catch (error) {
        if (strict) throw new Error(`[urlstate] Error while parsing query \`${String(raw)}\` for key \`${key}\`: ${String(error)}`, { cause: error })
        parsed = null
      }
      if (strict && (parsed === null || parsed === undefined)) throw new Error(`[urlstate] Failed to parse query \`${String(raw)}\` for key \`${key}\` (got null)`)
      result[key] = parsed ?? parser.defaultValue ?? null
    }
    return result as Values<S>
  }
  return load as Loader<S>
}
