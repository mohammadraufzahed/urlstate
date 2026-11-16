# Vanilla JS

urlstate is plain JavaScript. It needs no framework, works in any bundler and in a `<script>` tag (`window.UrlState`).

```js
import { queryStates, parseAsString, parseAsInteger, parseAsArrayOf } from 'urlstate'
import { bind } from 'urlstate/dom'

const filters = queryStates({
  q: parseAsString.withDefault(''),
  sizes: parseAsArrayOf(parseAsInteger).withDefault([]),
  page: parseAsInteger.withDefault(1)
})

bind('#search', 'q', parseAsString.withDefault(''), { debounce: 300 })
filters.subscribe(values => fetchResults(values))
```

- [queryState & queryStates](./state): reading, writing and subscribing
- [DOM bindings](./dom): two-way binding for inputs, selects, checkboxes and radios
- [Declarative autoBind](./auto-bind): attribute-only setup
- [Custom drivers](./drivers): bind any widget
- [Adapters](./adapters): History API, hash, memory, custom
- [Testing](./testing): unit-test URL logic without a browser
