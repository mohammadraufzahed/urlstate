import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryAdapter, type MemoryAdapter } from '@/adapters/memory'
import { configure, getUrlState } from '@/core/url-state'
import { installUrlState } from '@/jquery/plugin'
import type { UrlStateStatic, UrlStatesStatic } from '@/jquery/types'
import { parseAsInteger, parseAsNativeArrayOf, parseAsString } from '@/parsers/index'
import { JQUERY_BUILDS, JQUERY_VERSIONS, loadJQuery } from '@tests/load-jquery'

type Plugin = {
  urlState(key: string, parser?: unknown, options?: unknown): Plugin
  urlStateForm(schema?: unknown, options?: unknown): Plugin
  urlStateUnbind(): Plugin
  urlStateValue(): unknown
  on(event: string, handler: (...args: unknown[]) => void): Plugin
  trigger(event: string): Plugin
  val(value?: unknown): unknown
  prop(name: string, value?: unknown): unknown
  length: number
}
type Static = ((selector: unknown) => Plugin) & { urlState: UrlStateStatic; urlStates: UrlStatesStatic; fn: { jquery: string } }

let adapter: MemoryAdapter
const setup = (search: string, html: string) => {
  document.body.innerHTML = html
  adapter = memoryAdapter({ search })
  configure({ adapter })
}

afterEach(() => configure({}))

for (const version of JQUERY_VERSIONS) {
  for (const build of JQUERY_BUILDS) {
    describe(`jQuery ${version} (${build})`, () => {
      let $: Static
      beforeEach(() => {
        $ = installUrlState(loadJQuery(version, build)) as unknown as Static
      })

      it('loads the requested version and installs once', () => {
        expect($.fn.jquery.startsWith(version)).toBe(true)
        expect(installUrlState($ as never)).toBe($)
        expect(typeof $.urlState.parsers.parseAsInteger.parse).toBe('function')
      })

      it('$.urlState / $.urlStates manage typed state', async () => {
        setup('?page=2', '')
        const page = $.urlState('page', parseAsInteger.withDefault(1))
        expect(page.get()).toBe(2)
        await $.urlStates({ page: parseAsInteger.withDefault(1), q: parseAsString }).set({ page: 3, q: 'tv' })
        expect(adapter.getQueryString()).toBe('?page=3&q=tv')
        expect(page.get()).toBe(3)
      })

      it('$(input).urlState binds both ways and triggers jQuery events', async () => {
        setup('?q=tv', '<input id="q">')
        const onSync = vi.fn()
        $('#q').on('urlstate:sync', (_event, detail) => onSync(detail)).urlState('q')
        expect($('#q').val()).toBe('tv')
        $('#q').val('radio')
        $('#q').trigger('input')
        expect($('#q').urlStateValue()).toBe('radio')
        await getUrlState().flush()
        expect(adapter.getQueryString()).toBe('?q=radio')
        adapter.setSearch('?q=back')
        expect($('#q').val()).toBe('back')
        expect(onSync).toHaveBeenCalledWith({ key: 'q', value: 'back', source: 'external' })
      })

      it('catches jQuery-triggered change events and groups checkboxes', async () => {
        setup('', '<input type="checkbox" name="b" value="x"><input type="checkbox" name="b" value="y">')
        $('input[name=b]').urlState('b', parseAsNativeArrayOf(parseAsString))
        $('input[value=y]').prop('checked', true)
        $('input[value=y]').trigger('change')
        await getUrlState().flush()
        expect(adapter.getQueryString()).toBe('?b=y')
        $('input[name=b]').urlStateUnbind()
        $('input[value=x]').prop('checked', true)
        $('input[value=x]').trigger('change')
        await getUrlState().flush()
        expect(adapter.getQueryString()).toBe('?b=y')
      })

      it('$(form).urlStateForm syncs a Laravel-style form and intercepts submit', async () => {
        setup('?category=tires&brands[]=michelin', `
          <form id="f">
            <input name="q" type="search">
            <select name="category"><option value="">All</option><option value="tires">Tires</option><option value="rims">Rims</option></select>
            <input type="checkbox" name="brands[]" value="michelin"><input type="checkbox" name="brands[]" value="pirelli">
            <input type="checkbox" name="in_stock">
            <button type="submit">Go</button>
          </form>`)
        const submitted = vi.fn()
        $('#f').on('urlstate:submit', submitted).urlStateForm(undefined, { live: false })
        expect($('select').val()).toBe('tires')
        expect($('input[value=michelin]').prop('checked')).toBe(true)
        $('input[name=q]').val('summer tyre')
        $('input[value=pirelli]').prop('checked', true)
        $('input[name=in_stock]').prop('checked', true)
        $('input[name=q]').trigger('input')
        await getUrlState().flush()
        expect(adapter.getQueryString()).toBe('?category=tires&brands[]=michelin')
        $('#f').trigger('submit')
        await vi.waitFor(() => expect(submitted).toHaveBeenCalled())
        const params = new URLSearchParams(adapter.getQueryString())
        expect(Object.fromEntries(params)).toEqual({ q: 'summer tyre', category: 'tires', 'brands[]': 'pirelli', in_stock: 'true' })
        expect(params.getAll('brands[]')).toEqual(['michelin', 'pirelli'])
        expect($('#f').urlStateValue()).toEqual({ q: 'summer tyre', category: 'tires', 'brands[]': ['michelin', 'pirelli'], in_stock: true })
        $('#f').urlStateUnbind()
      })

      it('re-triggers urlstate:change on document', async () => {
        document.body.innerHTML = ''
        configure({ adapter: memoryAdapter() })
        const onChange = vi.fn()
        $(document).on('urlstate:change', (_event, detail) => onChange(detail))
        await $.urlState('q').set('x')
        expect(onChange).toHaveBeenCalledWith({ key: 'q', value: 'x', previous: null, source: 'set' })
      })
    })
  }
}
