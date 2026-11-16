import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), '@tests': fileURLToPath(new URL('./tests/unit', import.meta.url)) }
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    restoreMocks: true
  }
})
