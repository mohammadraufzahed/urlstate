/**
 * Opt-in debug logger. Enable with `localStorage.debug = 'urlstate'` (browser) or `DEBUG=urlstate` (Node).
 */
export interface Logger {
  readonly enabled: () => boolean
  debug(message: string, ...args: readonly unknown[]): void
  warn(message: string, ...args: readonly unknown[]): void
  error(message: string, ...args: readonly unknown[]): void
  mark(name: string): void
}

const PREFIX = '[urlstate]'

function isDebugEnabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const flag = localStorage.getItem('debug')
      if (flag?.includes('urlstate')) return true
    }
  } catch {
    return false
  }
  if (typeof process !== 'undefined' && typeof process.env === 'object') {
    return (process.env.DEBUG ?? '').includes('urlstate')
  }
  return false
}

/** The shared logger instance. */
export const logger: Logger = {
  enabled: isDebugEnabled,
  debug(message, ...args) {
    if (isDebugEnabled()) console.log(`${PREFIX} ${message}`, ...args)
  },
  warn(message, ...args) {
    if (isDebugEnabled()) console.warn(`${PREFIX} ${message}`, ...args)
  },
  error(message, ...args) {
    console.error(`${PREFIX} ${message}`, ...args)
  },
  mark(name) {
    if (!isDebugEnabled() || typeof performance === 'undefined' || typeof performance.mark !== 'function') return
    try {
      performance.mark(`urlstate:${name}`)
    } catch {
      return
    }
  }
}
