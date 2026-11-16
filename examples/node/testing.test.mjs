// Unit-test code that reads/writes URL state without a browser, using the memory adapter.
// Run: node --test examples/node/*.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createUrlState, parseAsInteger } from 'urlstate'
import { memoryAdapter } from 'urlstate/adapters/memory'

function nextPage(state) {
  return state.set(page => page + 1, { history: 'push' })
}

test('nextPage pushes ?page=n+1', async () => {
  const urls = []
  const adapter = memoryAdapter({ search: '?page=2&ref=mail', onUrlUpdate: event => urls.push(event.queryString) })
  const instance = createUrlState({ adapter })
  const page = instance.queryState('page', parseAsInteger.withDefault(1))

  await nextPage(page)

  assert.equal(page.get(), 3)
  assert.deepEqual(urls, ['?page=3&ref=mail'])
  assert.equal(adapter.entries.length, 2)
  instance.destroy()
})
