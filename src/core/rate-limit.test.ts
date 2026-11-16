import { describe, expect, it } from 'vitest'
import { debounce, defaultRateLimit, getDefaultThrottle, throttle } from '@/core/rate-limit'

describe('rate limit helpers', () => {
  it('creates rate limit descriptors', () => {
    expect(throttle(100)).toEqual({ method: 'throttle', timeMs: 100 })
    expect(debounce(300)).toEqual({ method: 'debounce', timeMs: 300 })
    expect(defaultRateLimit.method).toBe('throttle')
  })

  it('defaults to 50ms outside Safari', () => {
    expect(getDefaultThrottle()).toBe(50)
  })
})
