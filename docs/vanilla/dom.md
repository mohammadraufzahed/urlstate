# DOM bindings

```ts
import { bind } from 'urlstate/dom'
bind(target, key, parser?, options?): Binding
bind(target, state, options?): Binding
```

`target` is a selector, an element, a `NodeList` or an array. User input writes the URL, and URL changes (Back/Forward or code) update the elements.

| Element | Value |
| --- | --- |
| `<input>` text-like, `<textarea>` | `.value` (empty → `null` unless `emptyAs: 'value'`) |
| several checkboxes | array of checked values |
| single checkbox without `value` | `'true'` / `'false'` (use `parseAsBoolean`) |
| single checkbox with `value` | that value or `null` |
| radios | checked value |
| `<select>` / `<select multiple>` | value / array of values |
| anything else | `textContent` (read-only display) |

```js
bind('#q', 'q', parseAsString.withDefault(''), { debounce: 300 })
bind('input[name=size]', 'size', parseAsNativeArrayOf(parseAsInteger))   // ?size=16&size=17
bind('#sort', sortState, { history: 'push' })
```

Options: all [query options](/reference/options) plus `event`, `debounce`, `driver`, `emptyAs` and `drivers`.

`Binding` exposes `elements`, `state`, `driver`, `sync()`, `commit()` and `unbind()`. Elements fire a bubbling `urlstate:sync` CustomEvent (`detail: { key, value, source }`) when the URL changes them. Use `unbindAll(target)` to remove every binding on the elements.
