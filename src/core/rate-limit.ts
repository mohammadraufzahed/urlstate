import type { RateLimit } from '@/types'

/** Limit URL updates to at most one every `timeMs` milliseconds. State still updates instantly. */
export function throttle(timeMs: number): RateLimit {
  return { method: 'throttle', timeMs }
}

/** Wait until no update happened for `timeMs` milliseconds before writing the URL. */
export function debounce(timeMs: number): RateLimit {
  return { method: 'debounce', timeMs }
}

/** Browser-safe default throttle: 50ms, or more on Safari which rate-limits the History API. */
export function getDefaultThrottle(): number {
  if (typeof window === 'undefined') return 50
  if (!('GestureEvent' in window)) return 50
  try {
    const match = navigator.userAgent.match(/version\/([\d.]+) safari/i)
    return match?.[1] && parseFloat(match[1]) >= 17 ? 120 : 320
  } catch {
    return 320
  }
}

/** The default rate limit used when none is configured. */
export const defaultRateLimit: RateLimit = throttle(getDefaultThrottle())
