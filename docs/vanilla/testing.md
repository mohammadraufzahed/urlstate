# Testing

Use `memoryAdapter` to test URL logic in Vitest, Jest or `node:test` without a browser.

```js
import { createUrlState, parseAsInteger } from 'urlstate'
import { memoryAdapter } from 'urlstate/adapters/memory'

test('next page pushes ?page=n+1', async () => {
  const urls = []
  const adapter = memoryAdapter({ search: '?page=2', onUrlUpdate: e => urls.push(e.queryString) })
  const { queryState } = createUrlState({ adapter })
  const page = queryState('page', parseAsInteger.withDefault(1))

  await page.set(p => p + 1, { history: 'push' })

  expect(urls).toEqual(['?page=3'])
  adapter.back()
  expect(page.get()).toBe(2)
})
```

`memoryAdapter` exposes `entries`, `index`, `getQueryString()`, `setSearch(search)` (simulates an external change), `back()` and `forward()`.
