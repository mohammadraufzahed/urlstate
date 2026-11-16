import { expect, test } from '@playwright/test'

interface BundleWindow {
  UrlState: { queryState: unknown }
  jQuery: { fn: Record<string, unknown>; urlState: { drivers: { list(): readonly { name: string }[] } } }
  __esm?: string
}

test('jQuery IIFE self-registers on window and window.jQuery, with widget drivers', async ({ page }) => {
  await page.goto('/examples/index.html')
  await page.addScriptTag({ url: '/node_modules/jquery-3.6.0/dist/jquery.min.js' })
  await page.addScriptTag({ url: '/dist/urlstate.jquery.full.iife.min.js' })
  const result = await page.evaluate(() => {
    const w = window as unknown as BundleWindow
    return { state: typeof w.UrlState.queryState, plugin: typeof w.jQuery.fn.urlState, form: typeof w.jQuery.fn.urlStateForm, drivers: w.jQuery.urlState.drivers.list().map(d => d.name) }
  })
  expect(result).toMatchObject({ state: 'function', plugin: 'function', form: 'function' })
  expect(result.drivers).toEqual(expect.arrayContaining(['select2', 'flatpickr']))
})

test('data-auto-bind binds declarative elements on load', async ({ page }) => {
  await page.goto('/examples/index.html')
  await page.setContent('<input id="q" data-urlstate="q"><script src="/dist/urlstate.dom.iife.min.js" data-auto-bind></script>')
  await page.fill('#q', 'hello')
  await expect(page).toHaveURL(/[?&]q=hello/)
})

test('browser ESM builds import directly', async ({ page }) => {
  await page.goto('/examples/index.html')
  await page.addScriptTag({ type: 'module', content: "import { queryState, bind } from '/dist/urlstate.dom.esm.min.js'; window.__esm = typeof queryState + typeof bind" })
  await expect.poll(() => page.evaluate(() => (window as unknown as BundleWindow).__esm)).toBe('functionfunction')
})
