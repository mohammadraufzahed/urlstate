// Parse the same query string on the server (Express/Fastify/Laravel proxy/edge) that the browser writes.
// Run: node examples/node/loader.mjs
import { createLoader, parseAsArrayOf, parseAsIndex, parseAsInteger, parseAsString, parseAsStringLiteral } from 'urlstate/server'

const filters = {
  q: parseAsString.withDefault(''),
  page: parseAsIndex.withDefault(0),
  minPrice: parseAsInteger,
  sizes: parseAsArrayOf(parseAsInteger).withDefault([]),
  sort: parseAsStringLiteral(['relevance', 'price', 'rating']).withDefault('relevance')
}
const loadFilters = createLoader(filters, { urlKeys: { minPrice: 'min', sizes: 's' } })

console.log(loadFilters('https://shop.example/tires?q=pilot&page=3&min=80&s=17,18&sort=price'))
console.log(loadFilters(new URLSearchParams('sort=nope&page=abc')))
console.log(loadFilters({ q: 'from a record', s: '16,17' }))

try {
  loadFilters('?page=abc', { strict: true })
} catch (error) {
  console.log('strict mode:', error.message)
}
