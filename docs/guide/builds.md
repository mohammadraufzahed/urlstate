# Builds & CDN

## npm entry points (ESM + CJS + types)

`urlstate`, `urlstate/dom`, `urlstate/jquery`, `urlstate/jquery/drivers`, `urlstate/server`, `urlstate/adapters/browser`, `urlstate/adapters/hash`, `urlstate/adapters/memory`. Each has `.mjs`, `.cjs`, `.d.mts` / `.d.cts` and a source map.

## Browser bundles (`dist/`)

Every target comes in four files, each with a `.map`:

| Suffix | Format | Use |
| --- | --- | --- |
| `.iife.js` / `.iife.min.js` | classic script | sets `window.UrlState` and registers itself (see below) |
| `.esm.js` / `.esm.min.js` | ES module, all dependencies inlined | `<script type="module">`, `import` from a CDN, Deno |

| Target | Contains | Registers on load |
| --- | --- | --- |
| `urlstate` | core: parsers, state, adapters, serializer | `window.UrlState` |
| `urlstate.dom` | core + DOM bindings / autoBind | `window.UrlState`; runs `autoBind()` when the tag has `data-auto-bind` |
| `urlstate.jquery` | core + DOM + jQuery plugin | also installs `$.urlState` / `$.fn.urlState*` on `window.jQuery` |
| `urlstate.jquery.full` | jQuery + Select2/flatpickr drivers | also registers the widget drivers |

```html
<!-- zero JS: bind every [data-urlstate] element -->
<script src="https://unpkg.com/urlstate/dist/urlstate.dom.iife.min.js" data-auto-bind></script>

<!-- jQuery 3.6+: load jQuery first -->
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<script src="https://unpkg.com/urlstate/dist/urlstate.jquery.full.iife.min.js"></script>

<!-- ES module -->
<script type="module">
  import { queryState, parseAsInteger } from 'https://cdn.jsdelivr.net/npm/urlstate/dist/urlstate.esm.min.js'
</script>
```

In the jQuery ESM builds, call `installUrlState($)` (and `registerWidgetDrivers($)`) yourself when jQuery is not on `window`.

## GitHub release assets

Each [release](https://github.com/mohammadraufzahed/urlstate/releases) attaches:

| Asset | Contents |
| --- | --- |
| `<target>.iife.min.js`, `<target>.esm.min.js` | the minified bundles, for direct download |
| `<target>-<v>.zip` | all four builds of the target + maps, README, LICENSE |
| `urlstate-node-<v>.zip` | npm entry points: ESM, CJS, `.d.ts`, maps |
| `urlstate-<v>.tgz` | the npm tarball |
| `SHA256SUMS.txt` | checksums of every asset |
