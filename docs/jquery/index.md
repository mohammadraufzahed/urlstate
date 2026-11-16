# jQuery

Supports **jQuery 3.6.0 → 4.x**, both full and slim builds.

## Install

::: code-group
```html [script tags]
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<!-- core + plugin; installs on window.jQuery -->
<script src="https://unpkg.com/urlstate/dist/urlstate.jquery.iife.min.js"></script>
<!-- optional: Select2 + flatpickr drivers -->
<script src="https://unpkg.com/urlstate/dist/urlstate.jquery-drivers.iife.min.js"></script>
```
```js [bundler]
import $ from 'jquery'
import { installUrlState } from 'urlstate/jquery'
installUrlState($) // only needed when jQuery is not on window
```
:::

## API at a glance

| API | Purpose |
| --- | --- |
| `$.urlState(key, parser?, options?)` | create a [state](/vanilla/state) |
| `$.urlStates(schema, options?)` | create a group |
| `$.urlState.parsers` | all parsers (`parseAsInteger`, …) |
| `$.urlState.configure(config)` / `.instance()` / `.flush()` | default instance |
| `$.urlState.throttle(ms)` / `.debounce(ms)` | rate limits |
| `$.urlState.drivers.register(driver)` | [custom drivers](/vanilla/drivers) |
| `$.urlState.autoBind(root?, options?)` | [declarative bindings](/vanilla/auto-bind) with jQuery events |
| `$(el).urlState(key, parser?, options?)` | [bind elements](./binding) |
| `$(form).urlStateForm(schema?, options?)` | [bind a whole form](./forms) |
| `$(el).urlStateValue()` | current value (an object for forms) |
| `$(el).urlStateUnbind()` | remove bindings and `.urlstate` handlers |

```js
$(function () {
  var P = $.urlState.parsers
  $('#q').urlState('q', { debounce: 300 })
  $('#page').urlState('page', P.parseAsInteger.withDefault(1))
  $(document).on('urlstate:change', function (e, detail) { reload(detail.key) })
})
```
