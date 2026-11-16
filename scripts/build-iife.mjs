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

const core = `export * from '@/index'\nexport * from '@/dom/index'\n`
const bundles = [
  { name: 'urlstate', contents: core },
  {
    name: 'urlstate.jquery',
    contents: `${core}export { installUrlState } from '@/jquery/index'\nexport { flatpickrDriver, registerWidgetDrivers, select2Driver } from '@/jquery/drivers/index'\n`
  }
]

for (const bundle of bundles) {
  for (const minify of [false, true]) {
    await build({
      stdin: { contents: bundle.contents, resolveDir: src, loader: 'ts' },
      bundle: true,
      format: 'iife',
      globalName: 'UrlState',
      target: 'es2018',
      platform: 'browser',
      minify,
      sourcemap: true,
      legalComments: 'none',
      plugins: [aliasPlugin],
      outfile: resolve(root, 'dist', `${bundle.name}.iife${minify ? '.min' : ''}.js`)
    })
  }
}
console.log('IIFE bundles: urlstate, urlstate.jquery')
