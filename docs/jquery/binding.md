# Binding elements

```js
$(selector).urlState(key, parser?, options?)
$(selector).urlState(key, options?)            // parseAsString
```

- Several checkboxes or radios in one collection form a **group**: an array of checked values, or the selected radio.
- Any other collection binds each element to the **same** state, so two inputs with the same key mirror each other.
- Options are the [bind options](/vanilla/dom) without `listen`, `dispatch` and `instance`.

```js
var P = $.urlState.parsers
$('input[name=size]').urlState('size', P.parseAsArrayOf(P.parseAsInteger).withDefault([]))
$('#sort').urlState('sort', { history: 'push' })
$('#in-stock').urlState('stock', P.parseAsBoolean.withDefault(false))
$('#q').urlState('q', { debounce: 300, event: 'input change' })
```

User changes are caught through jQuery `.on()`, so changes made by code with `.val(x).trigger('change')` also update the URL. URL-driven updates fire `urlstate:sync` and never your `change` handlers.

`$(el).urlStateValue()` returns the value of the first binding. `$(el).urlStateUnbind()` removes every binding and `.urlstate` handler.
