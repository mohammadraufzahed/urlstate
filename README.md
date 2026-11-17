<div align="center">

# 🔗 urlstate

**Put your UI state in the URL. Typed, batched and shareable, without a framework.**

nuqs-style query-string state for **vanilla JS**, the **DOM** and **jQuery 3.6 → 4.x**, with helpers for the **server**.

[![CI](https://github.com/mohammadraufzahed/urlstate/actions/workflows/ci.yml/badge.svg)](https://github.com/mohammadraufzahed/urlstate/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/urlstate?color=cb3837&logo=npm)](https://www.npmjs.com/package/urlstate)
[![jQuery](https://img.shields.io/badge/jQuery-3.6%20→%204.x-0769ad?logo=jquery&logoColor=white)](#-jquery)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[**Docs**](https://mohammadraufzahed.github.io/urlstate/) · [Quick start](#-quick-start) · [Vanilla](#-vanilla-js) · [DOM](#-dom-bindings) · [jQuery](#-jquery) · [Server](#-server--node) · [Builds](#-builds--cdn) · [Examples](examples)

</div>

---

```js
const page = queryState('page', parseAsInteger.withDefault(1))

page.set(p => p + 1)   // → ?page=2   (typed, batched, throttled)
page.subscribe(render) // Back/Forward just work
```

## ✨ Why urlstate?

|  |  |
| --- | --- |
| 🧩 **No framework needed** | Plain functions: `get`, `set`, `subscribe`. Works in a `<script>` tag, a bundler, or Node. |
| 🔤 **Typed parsers** | `parseAsInteger`, `parseAsBoolean`, `parseAsArrayOf`, `parseAsIsoDate`, `parseAsJson`, … Bad input falls back to your default. |
| 🔁 **Same URLs as nuqs** | Byte-for-byte compatible, so a nuqs React island and a jQuery page can share links. |
| ⚡ **Fast and polite** | Optimistic state, one URL write per tick, throttle or debounce, unknown params kept. |
| 🏷️ **Zero-JS binding** | `<input data-urlstate="q">` plus one script tag. |
| 💲 **jQuery, old and new** | Tested on 3.6.0, 3.6.4, 3.7.1 and 4.0.0, full and slim. Includes Select2 and flatpickr drivers. |
| 🖥️ **Server ready** | `createLoader` and `createSerializer` for any Node framework, with Standard Schema validation. |
| 🪶 **Small** | No dependencies. About 4.4 kB brotli for core, 8.7 kB for the whole DOM script build. |

## 🚀 Quick start

<table>
<tr><th>📦 Bundler</th><th>🏷️ Script tag</th></tr>
<tr><td>

```bash
npm i urlstate
# pnpm add urlstate · yarn add urlstate
```

```js
import { queryState, parseAsString } from 'urlstate'

const q = queryState('q', parseAsString.withDefault(''))
q.set('winter tires') // ?q=winter+tires
```

</td><td>

```html
<input data-urlstate="q" placeholder="Search…">

<script
  src="https://unpkg.com/urlstate/dist/urlstate.dom.iife.min.js"
  data-auto-bind></script>
```

That's it. Type and the URL follows; reload and the input is filled in again.

</td></tr>
</table>

## 🍦 Vanilla JS

```js
import { queryState, queryStates, parseAsInteger, parseAsString, parseAsArrayOf, debounce } from 'urlstate'

// one key
const page = queryState('page', parseAsInteger.withDefault(1))
page.get()                                  // 1 when ?page is missing
page.set(p => p + 1, { history: 'push' })   // new history entry
page.set(null)                              // remove from the URL
page.subscribe((value, meta) => render(value, meta.source)) // 'set' | 'popstate' | 'external'

// a group of keys, written as one URL update
const filters = queryStates(
  {
    q: parseAsString.withDefault(''),
    sizes: parseAsArrayOf(parseAsInteger).withDefault([]),
    page: parseAsInteger.withDefault(1)
  },
  { urlKeys: { sizes: 's' } }               // short URL key: ?s=16,17
)
filters.set({ q: 'winter', page: 1 })

// a busy input: state updates on every keystroke, the URL after 300 ms of quiet
queryState('q').set(value, { limitUrlUpdates: debounce(300) })
```

<details>
<summary><b>⚙️ Options</b> (per state or per <code>set()</code> call)</summary>

| Option | Default | What it does |
| --- | --- | --- |
| `history` | `'replace'` | `'push'` adds a Back-button entry |
| `scroll` | `false` | Scroll to top after the update |
| `shallow` | `true` | `false` does a full navigation so server-rendered pages re-render |
| `clearOnDefault` | `true` | Remove the key when the value equals the default |
| `limitUrlUpdates` | throttle 50 ms | `throttle(ms)` or `debounce(ms)` |
| `urlKeys` | — | Map state names to shorter URL keys |
| `processUrlSearchParams` | — | Last-chance hook to rewrite the query before writing |

</details>

## 🧷 DOM bindings

```js
import { bind, autoBind } from 'urlstate/dom'

bind('#search', 'q', parseAsString.withDefault(''), { debounce: 300 })
bind(document.querySelectorAll('input[name=size]'), sizes) // checkbox group → array
autoBind(document, { observe: true })                      // every [data-urlstate], including ones added later
```

```html
<input data-urlstate="q" data-urlstate-debounce="300">
<input type="number" data-urlstate="page" data-urlstate-parser="integer" data-urlstate-default="1">
<label><input type="checkbox" data-urlstate="brand" value="michelin"> Michelin</label>
<label><input type="checkbox" data-urlstate="brand" value="pirelli"> Pirelli</label>
```

<details>
<summary><b>🏷️ All <code>data-urlstate-*</code> attributes</b></summary>

| Attribute | Meaning |
| --- | --- |
| `data-urlstate` | URL key (required) |
| `data-urlstate-parser` | `string` `integer` `float` `boolean` `index` `hex` `isodate` `isodatetime` `timestamp` `json` `array:<item>` `native-array:<item>`, or your own via `parsers.register()` |
| `data-urlstate-default` | Default value, kept out of the URL |
| `data-urlstate-separator` | Separator for `array:` (default `,`) |
| `data-urlstate-debounce` · `-history` · `-shallow` · `-scroll` · `-clear-on-default` | Per-element options |
| `data-urlstate-event` · `-driver` | Override the DOM event, or force a driver |

</details>

Supports text inputs, textareas, selects (single and multiple), checkboxes, checkbox groups and radios, and repeated `name[]` fields. For any other widget, write an `ElementDriver` (`matches` / `read` / `write` / `events`) and register it.

Events: `urlstate:sync` on the element when the URL changes it, plus `urlstate:change` (per key) and `urlstate:flush` (per URL write) on `window`.

## 💲 jQuery

> Works with **jQuery 3.6.0 → 4.x**, full and slim. It uses only APIs that exist in both versions and none that jQuery 4 removed (`$.isArray`, `$.trim`, …).

```html
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<script src="https://unpkg.com/urlstate/dist/urlstate.jquery.full.iife.min.js"></script>
<!-- installs $.urlState + $.fn.urlState* and registers the Select2/flatpickr drivers -->
```

```js
const { parseAsInteger, parseAsArrayOf, parseAsString } = $.urlState.parsers

$('#q').urlState('q', { debounce: 300 })
$('#tags').select2().urlState('tags', parseAsArrayOf(parseAsString).withDefault([]))

// Laravel / PHP style: ?brands[]=michelin&brands[]=pirelli, written on submit without a reload
$('#filters')
  .urlStateForm(null, { live: false, history: 'push' })
  .on('urlstate:submit', (e, search) => loadResults(search.toString()))

$('#filters').urlStateValue()  // { q: 'winter', 'brands[]': ['michelin'], in_stock: true }
$('#filters').urlStateUnbind() // all handlers are namespaced .urlstate
```

Password fields are never written to the URL.

Using a bundler instead? `import { installUrlState } from 'urlstate/jquery'` and `import { registerWidgetDrivers } from 'urlstate/jquery/drivers'`.

## 🖥️ Server / Node

```js
import { createLoader, createSerializer, parseAsInteger, parseAsString } from 'urlstate/server'

const schema = { q: parseAsString.withDefault(''), page: parseAsInteger.withDefault(1) }

const load = createLoader(schema)
load('https://shop.example/tires?q=pilot&page=3') // { q: 'pilot', page: 3 }
load(request)                                    // Request · URL · URLSearchParams · record
load('?page=abc', { strict: true })              // throws instead of falling back

const href = createSerializer(schema)
href('/tires?ref=nav', { page: 2 })              // '/tires?ref=nav&page=2'
```

## 🔌 Adapters

```js
import { configure, createUrlState } from 'urlstate'
import { hashAdapter } from 'urlstate/adapters/hash'
import { memoryAdapter } from 'urlstate/adapters/memory'

configure({ adapter: hashAdapter() })                                       // #?view=grid
const test = createUrlState({ adapter: memoryAdapter({ search: '?page=2' }) }) // tests / SSR
```

The default History API adapter also notices `pushState`/`replaceState` calls from routers, Turbo or htmx. You can write your own adapter with `createAdapter({ name, read, write, subscribe })`.

## 📦 Builds & CDN

| Target | Contains | When loaded as a script |
| --- | --- | --- |
| `urlstate` | core | `window.UrlState` |
| `urlstate.dom` | core + DOM | also runs `autoBind()` with `data-auto-bind` |
| `urlstate.jquery` | core + DOM + plugin | also installs on `window.jQuery` |
| `urlstate.jquery.full` | the jQuery build + widget drivers | also registers Select2 / flatpickr |

Each target comes as `.iife.js`, `.iife.min.js`, `.esm.js` and `.esm.min.js`, each with a source map. npm entry points (`urlstate`, `/dom`, `/jquery`, `/jquery/drivers`, `/server`, `/adapters/*`) ship ESM, CJS and types. Every [GitHub release](https://github.com/mohammadraufzahed/urlstate/releases) also attaches the minified files, a zip per target, a Node zip, the npm tarball and `SHA256SUMS.txt`.

```html
<script type="module">
  import { queryState, parseAsInteger } from 'https://cdn.jsdelivr.net/npm/urlstate/dist/urlstate.esm.min.js'
</script>
```

## 🧪 Examples

Run `pnpm build && pnpm examples`, then open http://localhost:4173.

- **Vanilla:** counter · debounced search · filters + pagination · tabs · declarative · hash adapter
- **jQuery** (choose the version with `?jq=3.6.0|3.6.4|3.7.1|4.0.0`): input · Laravel form · Select2 · DataTables
- **Node:** loader · serializer · tests

## 🛠️ Contributing

The package runs on Node 20+. Developing it needs **Node 22.13+** and pnpm (`corepack enable`).

| Task | Linux / macOS | Windows (PowerShell) |
| --- | --- | --- |
| Install | `pnpm install` | `pnpm install` |
| Everything | `pnpm check` | `pnpm check` |
| Unit tests | `pnpm test` | `pnpm test` |
| Browser tests | `pnpm exec playwright install --with-deps chromium && pnpm test:e2e` | `pnpm exec playwright install chromium; pnpm test:e2e` |
| Docs | `pnpm docs:dev` | `pnpm docs:dev` |
| Release assets | `pnpm build && pnpm release:pack` → `release/` | same (needs `zip` on PATH) |
| Debug logs | `localStorage.debug = 'urlstate'` · `DEBUG=urlstate node app.js` | `$env:DEBUG='urlstate'; node app.js` |

## 📄 License

[MIT](LICENSE). Inspired by [nuqs](https://nuqs.dev) by François Best.
