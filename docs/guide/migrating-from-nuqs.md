# Migrating from nuqs

urlstate uses the nuqs parser names, option names and URL encoding, so a React page using nuqs and a jQuery page using urlstate can share links.

| nuqs (React) | urlstate |
| --- | --- |
| `const [q, setQ] = useQueryState('q')` | `const q = queryState('q'); q.get(); q.set(v)` |
| `useQueryStates({ ... })` | `queryStates({ ... })` |
| re-render on change | `state.subscribe(listener)` |
| `<NuqsAdapter>` | `configure({ adapter })` (browser adapter by default) |
| `createLoader`, `createSerializer` | same names, from `urlstate/server` |
| `throttle(ms)`, `debounce(ms)` in `limitUrlUpdates` | same |
| `shallow: false` (re-runs server components) | full page load (`location.assign`) |
| `startTransition` option | not applicable |

```js
// nuqs
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions({ history: 'push' }))
setPage(p => p + 1)

// urlstate
const page = queryState('page', parseAsInteger.withDefault(1).withOptions({ history: 'push' }))
page.set(p => p + 1)
```
