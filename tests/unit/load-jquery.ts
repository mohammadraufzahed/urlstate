import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { JQueryFactory } from '@/jquery/types'

export const JQUERY_VERSIONS = ['3.6.0', '3.6.4', '3.7.1', '4.0.0'] as const
export const JQUERY_BUILDS = ['jquery', 'jquery.slim'] as const

/** Evaluates a specific jQuery build in the current DOM and returns an isolated copy. */
export function loadJQuery(version: string, build: string): JQueryFactory {
  const file = resolve(process.cwd(), `node_modules/jquery-${version}/dist/${build}.js`)
  const scope = globalThis as { jQuery?: JQueryFactory & { noConflict(all: boolean): JQueryFactory } }
  new Function(readFileSync(file, 'utf8')).call(globalThis)
  const $ = scope.jQuery
  if (!$) throw new Error(`jQuery ${version} (${build}) did not load`)
  return $.noConflict(true)
}

/** Evaluates a browser script with `jQuery` exposed as a global. */
export function loadScriptWith$(path: string, $: JQueryFactory): void {
  const scope = globalThis as { jQuery?: JQueryFactory; $?: JQueryFactory }
  scope.jQuery = $
  scope.$ = $
  new Function(readFileSync(resolve(process.cwd(), path), 'utf8')).call(globalThis)
}
