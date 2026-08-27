import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import localeKeysMatch from './eslint-rules/locale-keys-match.mjs'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/lib/locale-keys.mjs'],
    plugins: { local: { rules: { 'locale-keys-match': localeKeysMatch } } },
    rules: { 'local/locale-keys-match': 'error' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Git worktrees
    '.worktrees/**',
  ]),
])

export default eslintConfig
