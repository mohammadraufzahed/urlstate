# Core concepts

**Parser:** converts between a URL string and a typed value (`parse`, `serialize`, `eq`). `withDefault(v)` makes `get()` return `v` instead of `null`. See the [parsers reference](/reference/parsers).

**State:** `queryState(key, parser)` holds one key; `queryStates({...})` holds a group. Both share one store per [instance](/reference/api#createurlstate).

**Optimistic updates:** `set()` changes the value at once and notifies subscribers synchronously. The URL write happens afterwards. `set()` returns a promise that resolves with the written `URLSearchParams`.

**Batching and rate limits:** all `set()` calls in the same tick are merged into one URL update. Writes are throttled (50 ms by default; 120 ms on Safari 17+ and 320 ms on older Safari, which rate-limits the History API) or debounced per call with `limitUrlUpdates: debounce(ms)`.

**Adapter:** decides where the query string lives: the History API (default in browsers), the hash, or memory (default in Node). See [Adapters](/vanilla/adapters).

**Sources:** subscribers get `meta.source`:

| Source | Cause |
| --- | --- |
| `set` | your code called `set()` |
| `popstate` | Back/Forward |
| `external` | other code called `pushState`/`replaceState` (routers, Turbo, htmx) |
| `navigate` | Navigation API event |
| `init` | first sync of a binding |

**Unknown params are preserved:** keys you have not declared (`utm_source`, …) are never touched.

**clearOnDefault** (on by default): writing the default removes the key, so URLs stay short.
