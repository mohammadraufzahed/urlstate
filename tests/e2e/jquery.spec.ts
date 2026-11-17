import { expect, test, type Page } from '@playwright/test'

const search = (page: Page) => page.evaluate(() => location.search)
const versions = ['3.6.0', '3.6.4', '3.7.1', '4.0.0']

for (const version of versions) {
  test(`jQuery ${version}: input binding with push history`, async ({ page }) => {
    await page.goto(`/examples/jquery/input.html?jq=${version}`)
    await expect(page.getByTestId('version')).toHaveText(version)
    await page.getByTestId('q').fill('michelin')
    await expect.poll(() => search(page)).toBe(`?jq=${version}&q=michelin`)
    await page.goBack()
    await expect(page.getByTestId('q')).toHaveValue('')
    await expect(page.getByTestId('log')).toHaveText('popstate: null')
  })

  test(`jQuery ${version}: Laravel-style form writes on submit`, async ({ page }) => {
    await page.goto(`/examples/jquery/form.html?jq=${version}&brands[]=pirelli`)
    await expect(page.locator('[value=pirelli]')).toBeChecked()
    await page.getByTestId('q').fill('winter')
    await page.check('[value=michelin]')
    await page.selectOption('select[name=category]', 'tires')
    expect(await search(page)).toBe(`?jq=${version}&brands[]=pirelli`)
    await page.click('button[type=submit]')
    await expect.poll(() => search(page)).toBe(`?jq=${version}&q=winter&category=tires&brands[]=michelin&brands[]=pirelli`)
    await page.goBack()
    await expect(page.getByTestId('q')).toHaveValue('')
    await expect(page.locator('[value=michelin]')).not.toBeChecked()
  })
}

test('Select2 driver syncs tags both ways', async ({ page }) => {
  await page.goto('/examples/jquery/select2.html?tags=winter')
  await expect(page.locator('.select2-selection__choice')).toHaveCount(1)
  await page.evaluate(() => {
    const $ = (window as unknown as { jQuery: (s: string) => { val(v: string[]): { trigger(e: string): void } } }).jQuery
    $('#tags').val(['winter', 'runflat']).trigger('change')
  })
  await expect.poll(() => search(page)).toBe('?tags=winter,runflat')
  await page.goBack()
  await expect(page.locator('.select2-selection__choice')).toHaveCount(1)
})

test('DataTables page/search/sort round-trip through the URL', async ({ page }) => {
  await page.goto('/examples/jquery/datatables.html?page=2&sort=1.desc')
  await expect(page.locator('.dt-paging-button.current')).toHaveText('2')
  await page.locator('.dt-search input').fill('pirelli')
  await expect.poll(() => search(page)).toBe('?sort=1.desc&q=pirelli')
  await page.reload()
  await expect(page.locator('.dt-search input')).toHaveValue('pirelli')
  await expect(page.locator('#tires tbody tr').first()).toContainText('Pirelli')
})

test('DataTables page follows browser Back/Forward', async ({ page }) => {
  await page.goto('/examples/jquery/datatables.html')
  await page.locator('.dt-paging-button', { hasText: /^2$/ }).click()
  await expect.poll(() => search(page)).toContain('page=2')
  await page.locator('.dt-paging-button', { hasText: /^3$/ }).click()
  await expect.poll(() => search(page)).toContain('page=3')
  await page.goBack()
  await expect.poll(() => search(page)).toContain('page=2')
  await expect(page.locator('.dt-paging-button.current')).toHaveText('2')
  await page.goForward()
  await expect(page.locator('.dt-paging-button.current')).toHaveText('3')
})
