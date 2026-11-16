import { createAdapter, type UrlAdapter } from '@/adapters/types'
import { onHistoryChange } from '@/adapters/patch-history'
import { getDefaultThrottle } from '@/core/rate-limit'
import { renderQueryString } from '@/encoding/render-query-string'
import type { ChangeSource } from '@/types'

export interface BrowserAdapterOptions {
  /** Detect `history.pushState/replaceState` calls made by other code. Default: true. */
  readonly patchHistory?: boolean
  /** Use the Navigation API (when available) to detect URL changes. Default: true. */
  readonly useNavigationApi?: boolean
  /** With `shallow: false`, perform a full page navigation so the server re-renders. Default: true. */
  readonly fullPageNavigationOnShallowFalse?: boolean
}

interface NavigationLike extends EventTarget {
  readonly transition?: { readonly navigationType?: string } | null
}

/**
 * Stores state in the address bar query string using the History API.
 */
export function browserAdapter(options: BrowserAdapterOptions = {}): UrlAdapter {
  const { patchHistory = true, useNavigationApi = true, fullPageNavigationOnShallowFalse = true } = options
  let lastSeen = typeof location === 'undefined' ? '' : location.search
  let writing = false

  const getUrl = (search: URLSearchParams): string => location.pathname + renderQueryString(search) + location.hash

  return createAdapter({
    name: 'browser',
    defaultThrottleMs: getDefaultThrottle(),
    minThrottleMs: 50,
    getUrl,
    read: () => new URLSearchParams(location.search),
    write(search, { history: mode, scroll, shallow }) {
      const url = getUrl(search)
      if (!shallow && fullPageNavigationOnShallowFalse) {
        if (mode === 'push') location.assign(url)
        else location.replace(url)
        return
      }
      writing = true
      try {
        if (mode === 'push') history.pushState(history.state, '', url)
        else history.replaceState(history.state, '', url)
      } finally {
        writing = false
      }
      lastSeen = location.search
      if (scroll) window.scrollTo({ top: 0 })
    },
    subscribe(notify) {
      const check = (source: ChangeSource): void => {
        if (writing || location.search === lastSeen) return
        lastSeen = location.search
        notify(new URLSearchParams(location.search), source)
      }
      const cleanups: (() => void)[] = []
      const onPopState = (): void => check('popstate')
      window.addEventListener('popstate', onPopState)
      cleanups.push(() => window.removeEventListener('popstate', onPopState))
      if (patchHistory) cleanups.push(onHistoryChange(() => check('external')))
      const navigation = (window as unknown as { navigation?: NavigationLike }).navigation
      if (useNavigationApi && navigation && typeof navigation.addEventListener === 'function') {
        const onEntryChange = (event: Event): void => {
          const type = (event as Event & { navigationType?: string }).navigationType
          check(type === 'traverse' ? 'popstate' : 'navigate')
        }
        navigation.addEventListener('currententrychange', onEntryChange)
        cleanups.push(() => navigation.removeEventListener('currententrychange', onEntryChange))
      }
      return () => {
        for (const cleanup of cleanups) cleanup()
      }
    }
  })
}
