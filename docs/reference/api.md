# API

## `urlstate`

| Export | Description |
| --- | --- |
| `queryState(key, parser?, options?)` | [single state](/vanilla/state#querystate) on the default instance |
| `queryStates(schema, options?)` | [grouped state](/vanilla/state#querystates) on the default instance |
| `configure(config)` | set the adapter and default options of the default instance |
| `getUrlState()` | the default instance |
| `createUrlState(config)` | an isolated instance: `{ queryState, queryStates, flush(), destroy(), adapter }` |
| `throttle(ms)`, `debounce(ms)`, `defaultRateLimit`, `getDefaultThrottle()` | rate limits for `limitUrlUpdates` |
| `browserAdapter`, `hashAdapter`, `memoryAdapter`, `createAdapter` | [adapters](/vanilla/adapters) |
| `createLoader`, `createSerializer`, `createStandardSchemaV1` | [server helpers](/server/) |
| `renderQueryString(search)` | nuqs-compatible `?a=b` rendering |
| `logger` | [debug logger](/guide/debugging) |
| `parseAs*`, `createParser`, `createMultiParser` | [parsers](/reference/parsers) |

## `urlstate/dom`

`bind`, `autoBind`, `unbindAll`, `getBindings`, `drivers`, `createDriverRegistry`, `builtInDrivers`, `parsers` (named parser registry), `rawToValue`, `valueToRaw`. See [DOM bindings](/vanilla/dom).

## `urlstate/jquery`

`installUrlState($)` plus the `$.urlState` / `$.fn.urlState*` API ([jQuery](/jquery/)). Importing it auto-installs on `globalThis.jQuery` when present.

## `urlstate/jquery/drivers`

`select2Driver($)`, `flatpickrDriver`, `registerWidgetDrivers($, registry?)`.

## `urlstate/server`

Parsers, `createLoader`, `createSerializer`, `createStandardSchemaV1`, `renderQueryString`, with no DOM access.
