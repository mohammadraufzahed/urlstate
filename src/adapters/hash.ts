import { createAdapter, type UrlAdapter } from '@/adapters/types'
import { onHistoryChange } from '@/adapters/patch-history'
import { getDefaultThrottle } from '@/core/rate-limit'
import { renderQueryString } from '@/encoding/render-query-string'
import type { ChangeSource } from '@/types'

export interface HashAdapterOptions {
  /** Detect `history.pushState/replaceState` calls made by other code. Default: true. */
  readonly patchHistory?: boolean
}

function splitHash(): { path: string; query: string } {
  const hash = location.hash.slice(1)
  const index = hash.indexOf('?')
  return index === -1 ? { path: hash, query: '' } : { path: hash.slice(0, index), query: hash.slice(index + 1) }
}

/**
 * Stores state inside the URL hash (`/page#/route?q=1`), for static hosting or hash routers.
 */
export function hashAdapter(options: HashAdapterOptions = {}): UrlAdapter {
  const { patchHistory = true } = options
  let lastSeen = typeof location === 'undefined' ? '' : location.hash

  const getUrl = (search: URLSearchParams): string => {
    const hash = splitHash().path + renderQueryString(search)
    return location.pathname + location.search + (hash ? '#' + hash : '')
  }

  return createAdapter({
    name: 'hash',
    defaultThrottleMs: getDefaultThrottle(),
    minThrottleMs: 50,
    getUrl,
    read: () => new URLSearchParams(splitHash().query),
    write(search, { history: mode, scroll }) {
      const url = getUrl(search)
      const index = url.indexOf('#')
      lastSeen = index === -1 ? '' : url.slice(index)
      if (mode === 'push') history.pushState(history.state, '', url)
      else history.replaceState(history.state, '', url)
      lastSeen = location.hash
      if (scroll) window.scrollTo({ top: 0 })
    },
    subscribe(notify) {
      const check = (source: ChangeSource): void => {
        if (location.hash === lastSeen) return
        lastSeen = location.hash
        notify(new URLSearchParams(splitHash().query), source)
      }
      const onPop = (): void => check('popstate')
      const onHash = (): void => check('navigate')
      window.addEventListener('popstate', onPop)
      window.addEventListener('hashchange', onHash)
      const unpatch = patchHistory ? onHistoryChange(() => check('external')) : () => undefined
      return () => {
        window.removeEventListener('popstate', onPop)
        window.removeEventListener('hashchange', onHash)
        unpatch()
      }
    }
  })
}
