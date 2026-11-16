import { expect, test } from '@playwright/test'

const search = (page: import('@playwright/test').Page) => page.evaluate(() => location.search)

test('counter pushes history and restores on Back/Forward', async ({ page }) => {
  await page.goto('/examples/vanilla/counter.html')
  await page.click('#inc')
  await page.click('#inc')
  await expect(page.getByTestId('count')).toHaveText('2')
  await expect.poll(() => search(page)).toBe('?count=2')
  await page.goBack()
  await expect(page.getByTestId('count')).toHaveText('1')
  await page.goBack()
  await expect(page.getByTestId('count')).toHaveText('0')
  await expect.poll(() => search(page)).toBe('')
  await page.goForward()
  await expect(page.getByTestId('count')).toHaveText('1')
})

test('search input is debounced and survives reload', async ({ page }) => {
  await page.goto('/examples/vanilla/search.html')
  await page.getByTestId('q').pressSequentially('pirelli', { delay: 20 })
  await expect(page.locator('#results li')).toHaveCount(1)
  await expect.poll(() => search(page)).toBe('?q=pirelli')
  await page.reload()
  await expect(page.getByTestId('q')).toHaveValue('pirelli')
  await expect(page.locator('#results li')).toHaveText(['Pirelli P Zero'])
})

test('filters reset the page and keep unknown params', async ({ page }) => {
  await page.goto('/examples/vanilla/filters.html?utm=x&page=3')
  await expect(page.getByTestId('page')).toHaveText('3')
  await page.selectOption('#category', 'tires')
  await page.check('input[name=size][value="17"]')
  await expect(page.getByTestId('page')).toHaveText('1')
  await expect.poll(() => search(page)).toBe('?utm=x&cat=tires&s=17')
  await page.click('#next')
  await expect.poll(() => search(page)).toBe('?utm=x&cat=tires&s=17&page=2')
})

test('tabs follow the Back button and reject invalid values', async ({ page }) => {
  await page.goto('/examples/vanilla/tabs.html?tab=nope')
  await expect(page.getByTestId('panel')).toHaveText('Panel: overview')
  await page.click('[data-tab=specs]')
  await expect.poll(() => search(page)).toBe('?tab=specs')
  await page.click('[data-tab=reviews]')
  await expect.poll(() => search(page)).toBe('?tab=reviews')
  await page.goBack()
  await expect(page.getByTestId('panel')).toHaveText('Panel: specs')
})

test('declarative autoBind syncs attributes-only markup', async ({ page }) => {
  await page.goto('/examples/vanilla/declarative.html?page=4&brand=pirelli')
  await expect(page.getByTestId('page')).toHaveValue('4')
  await expect(page.getByTestId('page-text')).toHaveText('4')
  await expect(page.locator('[value=pirelli]')).toBeChecked()
  await page.check('[value=michelin]')
  await page.getByTestId('page').fill('1')
  await page.check('[data-urlstate=stock]')
  await expect.poll(() => search(page)).toBe('?brand=michelin&brand=pirelli&stock=true')
  await expect(page.getByTestId('page-text')).toHaveText('1')
})

test('hash adapter writes into location.hash only', async ({ page }) => {
  await page.goto('/examples/vanilla/hash.html?keep=1')
  await page.check('input[value=grid]')
  await expect(page.getByTestId('hash')).toHaveText('hash: #?view=grid')
  expect(await search(page)).toBe('?keep=1')
})
