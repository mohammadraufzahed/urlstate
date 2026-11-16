import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '@/debug/logger'

afterEach(() => localStorage.removeItem('debug'))

describe('logger', () => {
  it('is silent unless enabled', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    logger.debug('hidden')
    expect(log).not.toHaveBeenCalled()
    localStorage.setItem('debug', 'urlstate')
    expect(logger.enabled()).toBe(true)
    logger.debug('shown')
    expect(log).toHaveBeenCalledWith('[urlstate] shown')
  })

  it('always prints errors and marks performance when enabled', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    logger.error('boom')
    expect(error).toHaveBeenCalled()
    localStorage.setItem('debug', 'urlstate')
    const mark = vi.spyOn(performance, 'mark')
    logger.mark('x')
    expect(mark).toHaveBeenCalledWith('urlstate:x')
  })
})
