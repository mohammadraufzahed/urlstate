import { afterEach, describe, expect, it } from 'vitest'
import flatpickr from 'flatpickr'
import { memoryAdapter, type MemoryAdapter } from '@/adapters/memory'
import { configure, getUrlState } from '@/core/url-state'
import { flatpickrDriver, registerWidgetDrivers, select2Driver } from '@/jquery/drivers/index'
import { installUrlState } from '@/jquery/plugin'
import type { JQueryFactory } from '@/jquery/types'
import { parseAsNativeArrayOf, parseAsString } from '@/parsers/index'
import { loadJQuery, loadScriptWith$ } from '@tests/load-jquery'

let adapter: MemoryAdapter
afterEach(() => configure({}))

type Select2$ = JQueryFactory & ((s: unknown) => { select2(): void; urlState(k: string, p?: unknown): void; val(v?: unknown): unknown; trigger(e: string): void })

describe('widget drivers', () => {
  it('select2 driver syncs a Select2 multi-select (jQuery 3.6.0)', async () => {
    const $ = installUrlState(loadJQuery('3.6.0', 'jquery')) as Select2$
    loadScriptWith$('node_modules/select2/dist/js/select2.full.js', $)
    const off = registerWidgetDrivers($)
    adapter = memoryAdapter({ search: '?tags=b' })
    configure({ adapter })
    document.body.innerHTML = '<select id="s" multiple><option>a</option><option>b</option><option>c</option></select>'
    $('#s').select2()
    $('#s').urlState('tags', parseAsNativeArrayOf(parseAsString))
    const selected = () => [...document.querySelector<HTMLSelectElement>('#s')!.options].filter(o => o.selected).map(o => o.value)
    expect(selected()).toEqual(['b'])
    $('#s').val(['a', 'c'])
    $('#s').trigger('change')
    await getUrlState().flush()
    expect(adapter.getQueryString()).toBe('?tags=a&tags=c')
    adapter.setSearch('?tags=c')
    expect(selected()).toEqual(['c'])
    off()
    expect(select2Driver($).name).toBe('select2')
  })

  it('flatpickr driver reads and writes through the instance', async () => {
    adapter = memoryAdapter({ search: '?from=2024-05-01' })
    configure({ adapter })
    document.body.innerHTML = '<input id="d">'
    const input = document.querySelector<HTMLInputElement>('#d')!
    const picker = flatpickr(input, { dateFormat: 'Y-m-d' })
    expect(flatpickrDriver.matches([input])).toBe(true)
    const { bind } = await import('@/dom/bind')
    bind(input, 'from', parseAsString, { driver: flatpickrDriver })
    expect(input.value).toBe('2024-05-01')
    picker.setDate('2024-06-02', true)
    await getUrlState().flush()
    expect(adapter.getQueryString()).toBe('?from=2024-06-02')
    adapter.setSearch('')
    expect(input.value).toBe('')
  })
})
