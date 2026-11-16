# Server / Node

`urlstate/server` has no DOM dependency. It runs in Node 20+, Deno, Bun, Cloudflare Workers and other edge runtimes.

## createLoader

```js
import { createLoader, parseAsInteger, parseAsString } from 'urlstate/server'

const load = createLoader({ q: parseAsString.withDefault(''), page: parseAsInteger.withDefault(1) }, { urlKeys: { page: 'p' } })

load('https://shop.example/?q=pilot&p=3')    // { q: 'pilot', page: 3 }
load(request)                                 // Request, URL, URLSearchParams, '?a=b', record, or a Promise of them
load('?p=abc', { strict: true })              // throws on invalid values instead of falling back
```

## createSerializer

```js
import { createSerializer } from 'urlstate/server'
const serialize = createSerializer(schema, { clearOnDefault: true })

serialize({ q: 'winter', page: 2 })                 // '?q=winter&page=2'
serialize('/tires?ref=nav', { page: 1 })            // '/tires?ref=nav' (default removed)
serialize(new URL(req.url), { page: null })         // removes page and keeps other params
```

The output is byte-identical to what the browser writes, so you can use it for server-rendered pagination links, emails and sitemaps.
