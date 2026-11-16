# Options

Options can be set per instance (`defaultOptions` in `configure` / `createUrlState`), per state (`queryState(key, parser, options)` or `parser.withOptions()`), and per call (`set(value, options)`). The most specific one wins.

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `history` | `'replace' \| 'push'` | `'replace'` | `push` creates a Back-button entry |
| `scroll` | `boolean` | `false` | scroll to top after the write |
| `shallow` | `boolean` | `true` | `false` performs a full page load so the server re-renders |
| `clearOnDefault` | `boolean` | `true` | writing the default removes the key |
| `limitUrlUpdates` | `throttle(ms) \| debounce(ms)` | `throttle(50)` (Safari: 120/320) | URL write rate; state updates instantly either way |
| `urlKeys` | `{ [stateKey]: urlKey }` | `{}` | short URL names (`queryStates` / loaders / serializers) |

When one flush merges several calls, `push` wins over `replace`.

## Instance config

```ts
createUrlState({
  adapter?: UrlAdapter,
  defaultOptions?: QueryStateOptions,
  events?: EventTarget | false,           // where urlstate:change / urlstate:flush are dispatched (default window)
  processUrlSearchParams?: (search: URLSearchParams) => URLSearchParams  // e.g. sort keys before every write
})
```
