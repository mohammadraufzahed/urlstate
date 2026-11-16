import type { RawQuery } from '@/types'

/**
 * Low level helpers to read and write raw query values.
 */
export function readRaw(search: URLSearchParams, key: string, type: 'single' | 'multi'): RawQuery {
  if (type === 'multi') {
    const all = search.getAll(key)
    return all.length === 0 ? null : all
  }
  return search.get(key)
}

/** Writes a raw value (or removes it when null) into the search params, in place. */
export function writeRaw(search: URLSearchParams, key: string, value: RawQuery): URLSearchParams {
  if (value === null) {
    search.delete(key)
  } else if (typeof value === 'string') {
    search.set(key, value)
  } else {
    search.delete(key)
    for (const item of value) search.append(key, item)
    if (!search.has(key)) search.set(key, '')
  }
  return search
}

/** Converts anything URL-like into URLSearchParams. */
export function toSearchParams(input: string | URL | URLSearchParams | Request | Record<string, string | readonly string[] | undefined> | null | undefined): URLSearchParams {
  try {
    if (input === null || input === undefined) return new URLSearchParams()
    if (typeof Request !== 'undefined' && input instanceof Request) return input.url ? new URL(input.url).searchParams : new URLSearchParams()
    if (input instanceof URL) return new URLSearchParams(input.searchParams)
    if (input instanceof URLSearchParams) return new URLSearchParams(input)
    if (typeof input === 'string') {
      if (/^[a-z][a-z\d+\-.]*:\/\//i.test(input)) return new URL(input).searchParams
      const queryIndex = input.indexOf('?')
      const query = queryIndex === -1 ? input : input.slice(queryIndex + 1)
      return new URLSearchParams(query.split('#')[0] ?? '')
    }
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue
      if (typeof value === 'string') search.set(key, value)
      else for (const item of value) search.append(key, item)
    }
    return search
  } catch {
    return new URLSearchParams()
  }
}
