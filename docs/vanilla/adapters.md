# Adapters

```js
import { configure, createUrlState } from 'urlstate'
import { browserAdapter } from 'urlstate/adapters/browser'
import { hashAdapter } from 'urlstate/adapters/hash'
import { memoryAdapter } from 'urlstate/adapters/memory'
```

| Adapter | Where state lives | Default throttle |
| --- | --- | --- |
| `browserAdapter()` (default in browsers) | `location.search` via `history.pushState/replaceState` | 50 ms (Safari 17+: 120 ms, older Safari: 320 ms) |
| `hashAdapter()` | `location.hash` (`#?view=grid`, `#/list?page=2`) | 50 ms |
| `memoryAdapter({ search, onUrlUpdate })` (default in Node) | in-memory history with `back()`/`forward()` | 0 |

`browserAdapter({ patchHistory, useNavigationApi, fullPageNavigationOnShallowFalse })` (all default `true`): it patches `pushState`/`replaceState` once, so URL changes made by routers, Turbo or htmx sync into state with `source: 'external'`. With `shallow: false`, writes use `location.assign/replace`, causing a full page load so server-rendered pages re-render.

Use `configure({ adapter })` to change the default instance. Use `createUrlState({ adapter })` for an isolated instance with its own `queryState`, `queryStates`, `flush()` and `destroy()`.

## Custom adapter

```js
import { createAdapter } from 'urlstate'

const turboAdapter = createAdapter({
  name: 'turbo',
  read: () => new URLSearchParams(location.search),
  write: (search, { history }) => Turbo.visit(location.pathname + search, { action: history === 'push' ? 'advance' : 'replace' }),
  subscribe: notify => {
    const onLoad = () => notify(new URLSearchParams(location.search), 'external')
    document.addEventListener('turbo:load', onLoad)
    return () => document.removeEventListener('turbo:load', onLoad)
  }
})
```
