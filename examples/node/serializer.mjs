// Build links (server-rendered pagination, emails, sitemaps) in the exact format the browser reads.
// Run: node examples/node/serializer.mjs
import { createSerializer, parseAsArrayOf, parseAsIndex, parseAsString } from 'urlstate/server'

const serialize = createSerializer({
  q: parseAsString.withDefault(''),
  page: parseAsIndex.withDefault(0),
  brands: parseAsArrayOf(parseAsString).withDefault([])
})

console.log(serialize({ q: 'winter tyres', page: 1, brands: ['michelin', 'pirelli'] }))
console.log(serialize('/tires?utm_source=mail', { page: 0, q: 'all season' }))
console.log(serialize(new URL('https://shop.example/tires?page=5&ref=nav'), { page: null }))
