# Parsers

Every parser has `parse(string)`, `serialize(value)`, `eq(a, b)`, `.withDefault(v)` and `.withOptions(opts)`. The encodings match nuqs byte for byte.

| Parser | Type | URL example |
| --- | --- | --- |
| `parseAsString` | `string` | `?q=winter tires` → `q=winter+tires` |
| `parseAsInteger` | `number` | `?page=3` (parsed with `parseInt`, rounded when serialized) |
| `parseAsFloat` | `number` | `?ratio=0.75` |
| `parseAsHex` | `number` | `?color=ff00aa` (even-length hex) |
| `parseAsIndex` | `number` | state `0` ↔ `?page=1` |
| `parseAsBoolean` | `boolean` | `?stock=true` (case-insensitive) |
| `parseAsStringLiteral(['a','b'])` | `'a' \| 'b'` | invalid → default |
| `parseAsNumberLiteral([1,2,3])` | `1 \| 2 \| 3` | |
| `parseAsStringEnum(Object.values(Enum))` | enum | |
| `parseAsIsoDate` | `Date` | `?from=2026-11-16` |
| `parseAsIsoDateTime` | `Date` | `?at=2026-11-16T08:30:00.000Z` |
| `parseAsTimestamp` | `Date` | `?t=1794819363000` (epoch ms) |
| `parseAsArrayOf(p, sep = ',')` | `T[]` | `?sizes=16,17` (separator inside items is escaped) |
| `parseAsNativeArrayOf(p)` | `T[]` | `?size=16&size=17` |
| `parseAsJson(validator)` | `T` | `?f={"min":0}`; [validation](/server/validation) |

## Custom parsers

```js
import { createParser, createMultiParser } from 'urlstate'

const parseAsRange = createParser({
  parse: v => { const [a, b] = v.split('-').map(Number); return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null },
  serialize: ([a, b]) => `${a}-${b}`,
  eq: (x, y) => x[0] === y[0] && x[1] === y[1]
})

const parseAsTags = createMultiParser({            // reads every value of a repeated key
  parse: values => values.map(v => v.toLowerCase()),
  serialize: tags => tags
})
```

`parse` returns `null` for invalid input, which makes the state fall back to its default.
