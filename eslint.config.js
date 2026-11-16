import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'examples/**/vendor', 'playwright-report', 'test-results', 'docs/.vitepress/dist', 'docs/.vitepress/cache', 'release'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-imports': ['error', { patterns: [{ group: ['./*', '../*'], message: 'Use the @/ alias for internal imports.' }] }]
    }
  },
  {
    files: ['**/*.test.ts', 'tests/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  },
  {
    files: ['**/*.js', '**/*.mjs', 'examples/**', 'tests/e2e/**', '*.config.ts'],
    rules: { 'no-restricted-imports': 'off' },
    languageOptions: { globals: { window: 'readonly', document: 'readonly', location: 'readonly', console: 'readonly', process: 'readonly', URL: 'readonly', URLSearchParams: 'readonly' } }
  }
)
