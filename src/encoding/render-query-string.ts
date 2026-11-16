import { logger } from '@/debug/logger'

/**
 * Renders URLSearchParams to a query string with readable encoding.
 * Output is byte-for-byte identical to nuqs' renderQueryString so both libraries produce the same URLs.
 */
export function renderQueryString(search: URLSearchParams): string {
  const parts: string[] = []
  for (const [key, value] of search.entries()) {
    parts.push(`${encodeQueryKey(key)}=${encodeQueryValue(value)}`)
  }
  if (parts.length === 0) return ''
  const queryString = '?' + parts.join('&')
  warnIfTooLong(queryString)
  return queryString
}

/** Encodes a query key, escaping only characters that would break parsing. */
export function encodeQueryKey(key: string): string {
  return key.replace(/#/g, '%23').replace(/&/g, '%26').replace(/\+/g, '%2B').replace(/=/g, '%3D').replace(/\?/g, '%3F')
}

/** Encodes a query value, keeping it as readable as possible. */
export function encodeQueryValue(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\+/g, '%2B')
    .replace(/ /g, '+')
    .replace(/#/g, '%23')
    .replace(/&/g, '%26')
    .replace(/"/g, '%22')
    .replace(/'/g, '%27')
    .replace(/`/g, '%60')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F]/g, char => encodeURIComponent(char))
}

/** Maximum URL length before a warning is printed. */
export const URL_MAX_LENGTH = 2000

function warnIfTooLong(queryString: string): void {
  if (typeof location === 'undefined') return
  const length = location.origin.length + location.pathname.length + queryString.length + location.hash.length
  if (length > URL_MAX_LENGTH) logger.warn(`URL is ${length} characters long (> ${URL_MAX_LENGTH}); it may be truncated when shared.`)
}
