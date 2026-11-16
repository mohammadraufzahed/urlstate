# Forms

```js
$(form).urlStateForm(schema?, options?)
```

Binds every named, enabled control (buttons and file inputs are skipped). Without a `schema`, parsers are inferred:

| Control | Parser |
| --- | --- |
| name ending in `[]`, checkbox group, `<select multiple>` | `parseAsNativeArrayOf(parseAsString)` → `brands[]=a&brands[]=b` |
| lone checkbox without `value` | `parseAsBoolean.withDefault(false)` |
| everything else | `parseAsString` |

With a `schema`, only the listed names are bound, using your parsers:

```js
var P = $.urlState.parsers
$('#filters').urlStateForm({
  q: P.parseAsString.withDefault(''),
  min_price: P.parseAsInteger,
  'brands[]': P.parseAsNativeArrayOf(P.parseAsString)
}, { urlKeys: { min_price: 'min' }, history: 'push' })
```

| Option | Default | Meaning |
| --- | --- | --- |
| `live` | `true` | write while editing; `false` writes only on submit |
| `submit` | `'intercept'` | prevent the reload and write the URL; `'native'` lets the browser submit |
| `debounce` | `300` | debounce for text inputs when `live` |
| `urlKeys` | `{}` | control name → URL key |
| + [query options](/reference/options) | | `history`, `scroll`, `shallow`, … |

Events: `urlstate:submit` (`(event, URLSearchParams)`) fires after the submit write. `reset` re-syncs the URL.

**Laravel / PHP:** `brands[]` stays repeated, so `$request->input('brands')` is an array and `paginate()` links keep working. To have the server re-render on every change, combine with `shallow: false`.
