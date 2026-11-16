# urlstate

Type-safe URL query-string state for **vanilla JavaScript**, with a **jQuery 3.6+** adapter. It uses the same model as [nuqs](https://nuqs.dev) but needs no React, and it writes the same URL format, so a nuqs React island and a jQuery page can share links.

- Typed parsers (`parseAsInteger`, `parseAsArrayOf`, `parseAsJson`, …) with nuqs-compatible serialization
- `queryState` / `queryStates`: `get` / `set` / `subscribe`, optimistic updates, same-tick batching, throttle and debounce
- History options: `history` (`replace` | `push`), `scroll`, `shallow`, `clearOnDefault`, `urlKeys`, `processUrlSearchParams`
- Adapters: History API (default), hash, in-memory (tests and Node), or your own
- DOM bindings: `bind()` and attribute-only `autoBind()` (`data-urlstate="q"`)
- jQuery plugin: `$.urlState`, `$(el).urlState()`, `$(form).urlStateForm()`, Select2 and flatpickr drivers
- Server helpers: `createLoader`, `createSerializer`, Standard Schema validators
- No runtime dependencies. About 5.8 kB brotli for the full ESM build and 8.4 kB for the script-tag build (`pnpm size`).

## Install

```bash
npm i urlstate      # or: pnpm add urlstate / yarn add urlstate
```

Script tag (no bundler). It exposes `window.UrlState`:

```html
<script src="https://unpkg.com/urlstate/dist/urlstate.iife.min.js"></script>
<!-- or the jQuery build, which installs the plugin on window.jQuery -->
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<script src="https://unpkg.com/urlstate/dist/urlstate.jquery.iife.min.js"></script>
```

## Vanilla JS

```js
import { queryState, queryStates, parseAsInteger, parseAsString, parseAsArrayOf } from 'urlstate'

const page = queryState('page', parseAsInteger.withDefault(1))
page.get()                          // 1 for ?page missing, 3 for ?page=3
page.set(p => p + 1, { history: 'push' })
page.subscribe((value, meta) => render(value, meta.source)) // 'set' | 'popstate' (Back/Forward) | 'external' (other code)

const filters = queryStates(
  { q: parseAsString.withDefault(''), sizes: parseAsArrayOf(parseAsInteger).withDefault([]), page: parseAsInteger.withDefault(1) },
  { urlKeys: { sizes: 's' } }
)
filters.set({ q: 'winter', page: 1 }) // one URL update: ?q=winter
filters.set(null)                     // clears every key in the group
```

Updates within the same tick are batched into a single `history.replaceState` call, which is throttled to 50 ms by default. To debounce a busy input, pass `{ limitUrlUpdates: debounce(300) }`; the state still updates on every keystroke.

### DOM bindings

```js
import { bind, autoBind } from 'urlstate/dom'

bind('#search', 'q', parseAsString.withDefault(''), { debounce: 300 })
bind(document.querySelectorAll('input[name=size]'), sizesState) // checkbox group -> array
```

You can also bind with attributes only:

```html
<input data-urlstate="q" data-urlstate-debounce="300">
<input type="number" data-urlstate="page" data-urlstate-parser="integer" data-urlstate-default="1">
<input type="checkbox" data-urlstate="brand" value="michelin">
<input type="checkbox" data-urlstate="brand" value="pirelli">
<script>UrlState.autoBind()</script>
```

| Attribute | Meaning |
| --- | --- |
| `data-urlstate` | URL key (required) |
| `data-urlstate-parser` | `string`, `integer`, `float`, `boolean`, `index`, `hex`, `isodate`, `isodatetime`, `timestamp`, `json`, `array:<item>`, `native-array:<item>`, or one you add with `parsers.register()` |
| `data-urlstate-default` | Default value. It is removed from the URL when `clearOnDefault` is on (the default). |
| `data-urlstate-separator` | Separator for `array:` (default `,`) |
| `data-urlstate-debounce` / `-history` / `-shallow` / `-scroll` / `-clear-on-default` | Per-element options |
| `data-urlstate-event` / `-driver` | Override the DOM event, or force a driver |

Bound elements fire `urlstate:sync` when the URL changes them. The window also receives `urlstate:change` (one per key) and `urlstate:flush` (one per URL write).

Custom widgets implement `ElementDriver` (`matches` / `read` / `write` / `events`) and register it with `drivers.register()`.

## jQuery (3.6.0 – 4.x)

```js
import $ from 'jquery'
import { installUrlState } from 'urlstate/jquery' // auto-installs on window.jQuery when present
installUrlState($)

const page = $.urlState('page', $.urlState.parsers.parseAsInteger.withDefault(1))

$('#q').urlState('q', { debounce: 300 })
  .on('urlstate:sync', (event, detail) => console.log(detail.source, detail.value))

// Laravel/PHP-style form: brands[]=a&brands[]=b, URL written on submit without reload
$('#filters').urlStateForm(null, { live: false, history: 'push' })
  .on('urlstate:submit', (event, search) => loadResults(search.toString()))
$('#filters').urlStateValue()   // { q: 'winter', 'brands[]': ['michelin'], in_stock: true }
$('#filters').urlStateUnbind()  // removes handlers (all namespaced .urlstate)

$(document).on('urlstate:change', (event, detail) => {})
```

Widget drivers:

```js
import { registerWidgetDrivers } from 'urlstate/jquery/drivers'
registerWidgetDrivers($)           // Select2 (writes via .trigger('change.select2')) + flatpickr
$('#tags').select2().urlState('tags', $.urlState.parsers.parseAsArrayOf($.urlState.parsers.parseAsString).withDefault([]))
```

**Compatibility:** the plugin only uses `.on`, `.off`, `.trigger`, `.val`, `.toArray` and `$.fn.extend`. None of the helpers removed in jQuery 4 (`$.isArray`, `$.trim`, …) are used. CI runs the unit suite on jQuery **3.6.0, 3.6.4, 3.7.1 and 4.0.0**, each in the full and slim builds, and runs the browser tests on all four versions.

## Server / Node

```js
import { createLoader, createSerializer, parseAsInteger, parseAsString } from 'urlstate/server'

const schema = { q: parseAsString.withDefault(''), page: parseAsInteger.withDefault(1) }
const load = createLoader(schema)
load('https://shop.example/tires?q=pilot&page=3')       // { q: 'pilot', page: 3 }
load(request)                                          // Request, URL, URLSearchParams, record, or a Promise of them
load('?page=abc', { strict: true })                    // throws instead of falling back

const serialize = createSerializer(schema)
serialize('/tires?ref=nav', { page: 2 })               // '/tires?ref=nav&page=2'
```

## Adapters

```js
import { configure, createUrlState } from 'urlstate'
import { hashAdapter } from 'urlstate/adapters/hash'
import { memoryAdapter } from 'urlstate/adapters/memory'

configure({ adapter: hashAdapter() })                  // #?view=grid
const test = createUrlState({ adapter: memoryAdapter({ search: '?page=2' }) }) // tests / SSR
```

The browser adapter also picks up `history.pushState`/`replaceState` calls made by other code, such as routers, Turbo or htmx. `shallow: false` does a full navigation (`location.assign`), so server-rendered pages re-render.

## Development

Requires Node 20+ and pnpm (`corepack enable` sets up the pinned version).

| | Linux / macOS | Windows (PowerShell) |
| --- | --- | --- |
| Install | `pnpm install` | `pnpm install` |
| All checks | `pnpm check` | `pnpm check` |
| Unit tests | `pnpm test` | `pnpm test` |
| Browser tests | `pnpm exec playwright install --with-deps chromium && pnpm test:e2e` | `pnpm exec playwright install chromium; pnpm test:e2e` |
| Examples | `pnpm build && pnpm examples` → http://localhost:4173 | same; set the port with `$env:PORT=5000; pnpm examples` |
| Debug logs | `localStorage.debug = 'urlstate'` in the browser, `DEBUG=urlstate node app.js` | `$env:DEBUG='urlstate'; node app.js` |

The examples live in [`examples/`](examples). They cover vanilla JS (counter, debounced search, filters with pagination, tabs, declarative bindings, the hash adapter), jQuery (an input, a Laravel form, Select2, DataTables) and Node (loader, serializer, testing).

## License

MIT
