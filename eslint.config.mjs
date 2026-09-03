import js from '@eslint/js'
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import localeKeysMatch from './eslint-rules/locale-keys-match.mjs'

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // adapter-static + plain hrefs, not opting into SvelteKit's typed-routes resolve() helper
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    files: ['src/lib/locale-keys.mjs'],
    plugins: { local: { rules: { 'locale-keys-match': localeKeysMatch } } },
    rules: { 'local/locale-keys-match': 'error' },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'dist/', 'coverage/', 'static/', '.remember/'],
  }
)
