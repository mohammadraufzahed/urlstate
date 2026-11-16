# queryState & queryStates

## queryState

```ts
queryState(key: string): QueryState<string | null>
queryState<P>(key: string, parser: P, options?: QueryStateOptions): QueryState<inferParserType<P>>
```

| Member | Description |
| --- | --- |
| `key` / `urlKey` | state key / key used in the URL |
| `get()` | current value (default or `null` when missing/invalid) |
| `set(value \| null \| (prev) => next, options?)` | update; `null` removes the key; returns `Promise<URLSearchParams>` |
| `reset(options?)` | same as `set(null)` |
| `subscribe(listener, { immediate? })` | `listener(value, { previous, source })`; returns an unsubscribe function |
| `options(overrides)` | returns a new state with different default options |
| `destroy()` | stops listening |

```js
const tab = queryState('tab', parseAsStringLiteral(['info', 'specs']).withDefault('info'), { history: 'push' })
tab.set('specs')                         // pushes a history entry
tab.set('info', { history: 'replace' })  // per-call override
```

## queryStates

Groups keys so they update in one URL write and notify once.

```js
const table = queryStates(
  { page: parseAsIndex.withDefault(0), sort: parseAsString, dir: parseAsStringLiteral(['asc', 'desc']).withDefault('asc') },
  { urlKeys: { page: 'p' }, history: 'push' }
)
table.set({ sort: 'price', page: 0 })      // ?sort=price  (page 0 is default)
table.set(prev => ({ page: prev.page + 1 }))
table.set(null)                            // clear all keys in the group
table.subscribe((values, { changedKeys, source }) => render(values))
```

## Options

See [Options](/reference/options) for `history`, `scroll`, `shallow`, `clearOnDefault`, `limitUrlUpdates`, `urlKeys` and `processUrlSearchParams`.
