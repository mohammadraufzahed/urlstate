import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/server.ts',
    dom: 'src/dom/index.ts',
    jquery: 'src/jquery/index.ts',
    'jquery-drivers': 'src/jquery/drivers/index.ts',
    'adapters/browser': 'src/adapters/browser.ts',
    'adapters/hash': 'src/adapters/hash.ts',
    'adapters/memory': 'src/adapters/memory.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  platform: 'neutral',
  target: 'es2022',
  deps: { neverBundle: ['jquery'] }
})
