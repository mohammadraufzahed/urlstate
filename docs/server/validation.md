# Validation

`parseAsJson(validator)` accepts any [Standard Schema](https://standardschema.dev) validator (Zod, Valibot, ArkType) or a function returning the value or `null`.

```js
import { z } from 'zod'
const filters = parseAsJson(z.object({ min: z.number(), max: z.number() })).withDefault({ min: 0, max: 100 })
```

`createStandardSchemaV1(schema, { partialOutput })` turns a parser map into a Standard Schema validator, for example to validate route params in tRPC or Hono:

```js
const validator = createStandardSchemaV1({ page: parseAsInteger.withDefault(1) })
```
