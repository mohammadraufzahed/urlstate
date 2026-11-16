# Declarative autoBind

```html
<input data-urlstate="q" data-urlstate-debounce="300">
<input type="number" data-urlstate="page" data-urlstate-parser="integer" data-urlstate-default="1">
<input type="checkbox" data-urlstate="brand" value="michelin">
<input type="checkbox" data-urlstate="brand" value="pirelli">
<select multiple data-urlstate="tags" data-urlstate-parser="array" data-urlstate-separator=";">…</select>
<span data-urlstate="page" data-urlstate-parser="integer"></span> <!-- live display -->

<script src="https://unpkg.com/urlstate/dist/urlstate.dom.iife.min.js"></script>
<script>UrlState.autoBind()</script>
```

`autoBind(root = document, { observe, instance, parsers, drivers })` returns `{ bindings, refresh(), unbind() }`. With `observe: true`, a `MutationObserver` binds elements added later and unbinds removed ones.

| Attribute | Meaning |
| --- | --- |
| `data-urlstate` | URL key (required); checkboxes/radios with the same key form one group |
| `data-urlstate-parser` | `string` (default), `integer`, `float`, `boolean`, `index`, `hex`, `isodate`, `isodatetime`, `timestamp`, `json`, `array[:item]`, `native-array[:item]` |
| `data-urlstate-default` | default value (comma-separated for native arrays) |
| `data-urlstate-separator` | separator for `array` |
| `data-urlstate-debounce` | debounce ms |
| `data-urlstate-history` | `push` or `replace` |
| `data-urlstate-shallow`, `-scroll`, `-clear-on-default` | `true` / `false` |
| `data-urlstate-event` | events that trigger a write, space-separated |
| `data-urlstate-driver` | force a registered driver |
| `data-urlstate-empty="value"` | keep empty strings instead of removing the key |

Parsers are inferred when not given: a checkbox group or `<select multiple>` uses `native-array`, and a lone checkbox without a value uses `boolean`. Register your own parser with `parsers.register('upper', createParser({...}))`.
