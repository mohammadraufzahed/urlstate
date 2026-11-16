import { installUrlState } from '@/jquery/plugin'
import type { JQueryFactory } from '@/jquery/types'

export { installUrlState } from '@/jquery/plugin'
export type { JQueryBindOptions, JQueryCollection, JQueryFactory, UrlStateFormOptions, UrlStateStatic, UrlStatesStatic } from '@/jquery/types'

const globalJQuery = (globalThis as { jQuery?: JQueryFactory }).jQuery
if (globalJQuery && typeof globalJQuery.fn === 'object') installUrlState(globalJQuery)
