# Widget drivers

```js
import { registerWidgetDrivers } from 'urlstate/jquery/drivers'
registerWidgetDrivers($)   // script tag: UrlState.registerWidgetDrivers(jQuery)
```

| Driver | Matches | Read | Write |
| --- | --- | --- | --- |
| `select2` | `<select>` with Select2 initialized | selected options | `.val(v).trigger('change.select2')`, which notifies only Select2 ([docs](https://select2.org/programmatic-control/events)) |
| `flatpickr` | input with `_flatpickr` | input value in `dateFormat` | `setDate(v, false)` / `clear(false)` ([docs](https://flatpickr.js.org/instance-methods-properties-elements/)) |

```js
$('#tags').select2().urlState('tags', P.parseAsArrayOf(P.parseAsString).withDefault([]))
flatpickr('#from', { dateFormat: 'Y-m-d' }); $('#from').urlState('from', P.parseAsIsoDate)
```

Initialize the widget **before** binding. For other widgets (ionRangeSlider, Chosen, bootstrap-datepicker), register a [custom driver](/vanilla/drivers) with `$.urlState.drivers.register()`.
