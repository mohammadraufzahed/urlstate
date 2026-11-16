# Builds & CDN

## npm entry points (ESM + CJS + types)

`urlstate`, `urlstate/dom`, `urlstate/jquery`, `urlstate/jquery/drivers`, `urlstate/server`, `urlstate/adapters/browser`, `urlstate/adapters/hash`, `urlstate/adapters/memory`. Each has `.mjs`, `.cjs`, `.d.mts` / `.d.cts` and a source map.

## Script-tag bundles (`dist/`)

| File | Contains | Global |
| --- | --- | --- |
| `urlstate.iife.js` | core: parsers, state, adapters, serializer | `UrlState` |
| `urlstate.dom.iife.js` | core + DOM bindings / autoBind | `UrlState` |
| `urlstate.jquery.iife.js` | core + DOM + jQuery plugin (auto-installs on `window.jQuery`) | `UrlState` |
| `urlstate.jquery-plugin.iife.js` | jQuery plugin only; load after `urlstate.dom.iife.js` | extends `UrlState` |
| `urlstate.jquery-drivers.iife.js` | Select2 + flatpickr drivers (auto-register when jQuery is present) | extends `UrlState` |
| `urlstate.full.iife.js` | everything above | `UrlState` |

Every file also ships as `.min.js` with a `.map`.

```html
<script src="https://unpkg.com/urlstate@1/dist/urlstate.jquery.iife.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/urlstate@1/dist/urlstate.dom.iife.min.js"></script>
```

## GitHub release assets

Each [release](https://github.com/mohammadraufzahed/urlstate/releases) attaches one zip per target with its README, LICENSE, types and bundles:

| Asset | For |
| --- | --- |
| `urlstate-vanilla-<v>.zip` | core + DOM: ESM, CJS, types, IIFE |
| `urlstate-jquery-<v>.zip` | jQuery bundle, plugin-only, drivers: IIFE + ESM/CJS |
| `urlstate-server-<v>.zip` | `urlstate/server`: ESM, CJS, types |
| `urlstate-cdn-<v>.zip` | every `dist/*.iife*.js` and its map |
| `urlstate-<v>.tgz` | the npm tarball |
| `SHA256SUMS.txt` | checksums of everything above |
