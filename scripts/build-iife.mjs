import { build } from 'esbuild'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'src')

const aliasPlugin = {
  name: 'urlstate-alias',
  setup(context) {
    context.onResolve({ filter: /^@\// }, args => {
      const base = resolve(src, args.path.slice(2))
      const path = [`${base}.ts`, resolve(base, 'index.ts')].find(existsSync)
      if (!path) throw new Error(`Cannot resolve ${args.path}`)
      return { path }
    })
  }
}

const autoBindOnLoad = `
import { autoBind as __autoBind } from '@/dom/index'
const __script = typeof document !== 'undefined' ? document.currentScript : null
if (__script && __script.hasAttribute('data-auto-bind')) {
  const __run = () => __autoBind(document, { observe: true })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __run, { once: true })
  else __run()
}
`
const core = `export * from '@/index'\n`
const dom = `${core}export * from '@/dom/index'\n`
const jquery = `${dom}export { installUrlState } from '@/jquery/index'\n`
const drivers = `export { flatpickrDriver, registerWidgetDrivers, select2Driver } from '@/jquery/drivers/index'
import { registerWidgetDrivers as __registerWidgetDrivers } from '@/jquery/drivers/index'
const __jQuery = globalThis.jQuery
if (__jQuery && __jQuery.fn) __registerWidgetDrivers(__jQuery)
`

/** Every target ships as a self-registering IIFE (window.UrlState) and a browser ESM build, each plain + minified. */
export const targets = [
  { name: 'urlstate', contents: core },
  { name: 'urlstate.dom', contents: dom + autoBindOnLoad },
  { name: 'urlstate.jquery', contents: jquery + autoBindOnLoad },
  { name: 'urlstate.jquery.full', contents: jquery + drivers + autoBindOnLoad }
]

for (const target of targets) {
  for (const format of ['iife', 'esm']) {
    for (const minify of [false, true]) {
      await build({
        stdin: { contents: target.contents, resolveDir: src, loader: 'ts' },
        bundle: true,
        format,
        globalName: format === 'iife' ? 'UrlState' : undefined,
        target: 'es2018',
        platform: 'browser',
        minify,
        sourcemap: true,
        legalComments: 'none',
        plugins: [aliasPlugin],
        outfile: resolve(root, 'dist', `${target.name}.${format}${minify ? '.min' : ''}.js`)
      })
    }
  }
}
console.log(`Browser bundles: ${targets.map(t => t.name).join(', ')} (iife + esm, plain + min)`)
