# Events

| Event | Target | Handler args |
| --- | --- | --- |
| `urlstate:sync` | bound element | `(event, { key, value, source })`, fired when the URL changes the element |
| `urlstate:change` | `document` | `(event, { key, value, previous, source })`, fired per key |
| `urlstate:flush` | `document` | `(event, { search, url, options })`, fired after each URL write |
| `urlstate:submit` | form | `(event, URLSearchParams)` |

The native `CustomEvent`s are also dispatched on `window` for non-jQuery code. All handlers the plugin attaches use the `.urlstate` namespace, so `$(el).off('.urlstate')` is safe.
