# PLAN: Guard lint/CI against i18n locale key drift

## Summary

Add one shared, dependency-free ESM module that flattens and diffs the key sets of
`src/messages/{fr,en,de}.json`, then wire it into three independent entry points (vitest test,
custom ESLint rule, standalone CI script). Fix the two confirmed drift instances: add
`appointments.types.laboratoire` to `de.json`, remove the dead `nav.acts` from `fr.json` and
`en.json`. Touches: `src/lib/` (new module + test), `eslint-rules/` (new), `scripts/` (new),
`eslint.config.mjs`, `package.json`, `.github/workflows/ci.yml`, and the three locale JSON files.

## Conventions and overrides

**Conventions**

- Colocated tests as `*.test.ts` next to the module they test, matching all 20 existing
  `src/lib/*.test.ts` files (e.g. `src/lib/theme.test.ts`).
- New shared module and everything that consumes it directly via Node (the ESLint rule file, the
  standalone script) are plain ESM `.mjs` — no TypeScript, no new dev dependency, no Node flags.
  This matches the project's existing root-level convention for plain tooling files
  (`postcss.config.mjs`, `eslint.config.mjs` are both bare `.mjs`; there is no CJS `.js` precedent
  in the repo root). It also sidesteps two fragility points: Node 22 requires the
  `--experimental-strip-types` flag to run `.ts` directly (CI pins `node-version: 22` via
  `.github/actions/setup/action.yml`, so this can't be assumed stable/default), and adding a
  TS-execution dev dependency (`tsx`/`ts-node`) is unjustified scope for a ~15-line utility.
- The shared module lives inside `src/lib/` but as `.mjs`, so it is _not_ picked up by
  `vitest.config.ts`'s coverage `include: ['src/lib/**/*.ts']` (literal `.ts` suffix). This is
  deliberately neutral per the requirements' own verified fact ("neither helps nor hurts the 60%
  threshold") — confirmed here as the safer of the two neutral outcomes, since it removes any risk
  of the new file's lines dragging down the 60% ratio.
- CLI-style `console.error`/`console.log` output in `scripts/check-locale-keys.mjs` is intentional
  and expected — it's a CI-facing script whose entire job is to report status, not application code.
  This is a deliberate, scoped exception to the general "no console.log" guideline for app code.
- JSON edits preserve exact existing indentation (2 spaces per nesting level) and prettier's
  no-trailing-comma-on-last-key style.

**Overrides**

- The requirements' three listed options for the shared-module/script language ("plain `.mjs` vs a
  new TS-execution dev dependency vs Node's native TS-stripping flag") were left as a Plan-phase
  decision. This plan picks **plain `.mjs`** — see Conventions above for why. No user confirmation
  needed: this was explicitly pre-delegated to the Plan phase in the requirements' Open questions.
- The `lint-staged` glob extension question (requirements Open questions, 3rd bullet) is explicitly
  non-blocking there. This plan makes **no change** to `lint-staged` in `package.json` — the new CI
  script step and the existing `pnpm run lint`/`pnpm run test:run` invocations already catch drift;
  only local pre-commit-time earliness is affected, which is out of scope.

## Steps

### Step 1 — Write the test file for the shared locale-key-diff module (RED)

**What:** Create `src/lib/locale-keys.test.ts` exercising a module that doesn't exist yet.

**Where:** `src/lib/locale-keys.test.ts` (new file).

**How:** Follow the existing colocated-test convention (see `src/lib/theme.test.ts:1-9` for the
import/describe/it shape). Two tests:

1. `flattenKeys` turns a small nested fixture object into dotted-path keys (covers the recursion
   the whole guard depends on — e.g. `{ a: { b: 1, c: { d: 2 } } }` → `['a.b', 'a.c.d']`, order
   doesn't matter, assert via `.toEqual(expect.arrayContaining(...))` or a sorted comparison).
2. `diffLocaleKeys()` called with no arguments against the real `src/messages/{fr,en,de}.json`
   returns `{ inSync: true, missingByLocale: { fr: [], en: [], de: [] } }`. At this point in the
   sequence the real files still have the two drift instances, so this test is expected to fail —
   that failure is the reproduction of the bug this plan fixes (Requirements 6/7), not a mistake.

Import from `./locale-keys.mjs` (the file Step 2 creates).

**Depends on:** none.

### Step 2 — Implement the shared flatten/diff module (GREEN for test 1, still RED for test 2)

**What:** Create the single shared check module both tests import.

**Where:** `src/lib/locale-keys.mjs` (new file).

**How:** Three exports: `LOCALES` (the three locale codes), `flattenKeys` (recursive
object-to-dotted-paths), `diffLocaleKeys` (loads all three locale JSON files via `node:fs`, computes
symmetric drift). Resolve `src/messages/<locale>.json` relative to this module's own location with
`new URL(..., import.meta.url)` — works identically whether the module is imported by vitest
(Node process), by ESLint's rule loader (Node process), or run directly by the standalone script
(Node process) — no bundler-specific JSON-import syntax needed, avoiding the Node import-attribute
(`with { type: 'json' }`) version-sensitivity entirely.

`diffLocaleKeys` computes, per locale, the keys present in the union of all locales but absent from
that locale's own set. This single "missing relative to union" computation is sufficient to catch
drift in every direction (a key extra in one locale is definitionally "missing" in the others) — no
separate extra-keys computation needed.

```js
export function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? flattenKeys(value, path)
      : [path]
  })
}

export function diffLocaleKeys(locales = LOCALES) {
  // returns { inSync: boolean, missingByLocale: Record<string, string[]> }
}
```

Load each locale file with `fs.readFileSync(new URL(\`../messages/${locale}.json\`, import.meta.url), 'utf-8')`then`JSON.parse`, then `new Set(flattenKeys(parsed))`. `missingByLocale[locale]`is the sorted array`[...unionOfAllKeys].filter(k => !ownKeys.has(k))`. `inSync`is`true` iff every array is empty.

After this step, Step 1's test 1 (flattenKeys) passes; test 1 (diffLocaleKeys) still fails because
`de.json` is still missing `appointments.types.laboratoire` and `fr.json`/`en.json` still have the
dead `nav.acts` — fixed in Step 3.

**Depends on:** Step 1 (test file must exist to confirm RED→GREEN transition, though this module
is what Step 1 imports).

### Step 3 — Fix the two confirmed drift instances (GREEN)

**What:** Edit the three locale JSON files so Step 1's `diffLocaleKeys` test passes.

**Where:** `src/messages/de.json`, `src/messages/fr.json`, `src/messages/en.json`.

**How:**

- `src/messages/de.json`: in the `appointments.types` object (currently lines 1353-1368, ending
  `"other": "Sonstige"` on line 1367 immediately before the closing `},` on line 1368), add a
  trailing comma to the `"other"` line and append a new last entry:
  `"laboratoire": "Labor"` — 6-space indent, matching the sibling entries exactly (see
  `src/messages/de.json:1354-1367` for the exact key style, e.g. `"tattoo": "Tätowierer·in"`).
  `"Labor"` is the tentative German translation carried over from the requirements' Open
  questions — flag it for native-speaker confirmation before merge; it is not code-verifiable.
- `src/messages/fr.json`: in the `nav` object, delete line 33 (`    "acts": "Actes"`) and remove
  the now-trailing comma from the new last entry, line 32
  (`"resources": "Ressources",` → `"resources": "Ressources"`).
- `src/messages/en.json`: same edit, deleting line 33 (`    "acts": "Acts"`) and de-commaing line 32
  (`"resources": "Resources",` → `"resources": "Resources"`).
- `src/messages/de.json`'s `nav` object already has no `acts` key (confirmed) — no change needed
  there.

After this step, both tests in `src/lib/locale-keys.test.ts` pass. Run `pnpm run test:run` to
confirm before continuing.

**Depends on:** Steps 1, 2.

### Step 4 — Add the custom ESLint rule

**What:** Create a local (no-package) ESLint flat-config rule that reports when the three locale
key sets diverge, and register it.

**Where:** `eslint-rules/locale-keys-match.mjs` (new file), `eslint.config.mjs` (edit).

**How:** The rule imports `diffLocaleKeys` from the Step 2 module and reports once per lint run.
Anchor it to `files: ['src/lib/locale-keys.mjs']` — i.e. the shared module's own file — rather than
to any of the four protected `next-intl` runtime files (`src/i18n/config.ts`, `request.ts`,
`date-locale.ts`, `use-locale-switch.ts`, which Requirement 8 / AC forbids changing) or to a
broad glob like `**/*.ts` (which would fire the (cheap but non-zero) fs-read-and-diff check once per
linted file and report the same drift once per file — noisy and wasteful). Anchoring to a single
real, already-lint-eligible file gives exactly one report per lint run.

```js
// eslint-rules/locale-keys-match.mjs
import { diffLocaleKeys } from '../src/lib/locale-keys.mjs'

export default {
  meta: {
    type: 'problem',
    docs: { description: 'fr/en/de locale files must share the same key set' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const { inSync, missingByLocale } = diffLocaleKeys()
        if (inSync) return
        const detail = Object.entries(missingByLocale)
          .filter(([, keys]) => keys.length > 0)
          .map(([locale, keys]) => `${locale} missing: ${keys.join(', ')}`)
          .join(' | ')
        context.report({ node, message: `Locale key drift between fr/en/de: ${detail}` })
      },
    }
  },
}
```

In `eslint.config.mjs`, add the import and a new config object in the array (after the existing
`...nextVitals, ...nextTs` spreads, before `globalIgnores(...)`):

```js
import localeKeysMatch from './eslint-rules/locale-keys-match.mjs'
// ...
{
  files: ['src/lib/locale-keys.mjs'],
  plugins: { local: { rules: { 'locale-keys-match': localeKeysMatch } } },
  rules: { 'local/locale-keys-match': 'error' },
},
```

Confirmed compatible: `eslint-config-next/core-web-vitals`'s base rule block matches
`**/*.{js,jsx,mjs,ts,tsx,mts,cts}` (includes `.mjs`), so the three new `.mjs` files (module, rule,
script from Step 5) are linted as plain JS with no TypeScript-specific rules applied (the
typescript preset's rule block only matches `.ts/.tsx/.mts/.cts`) — no conflicts expected, but run
`pnpm run lint` after this step to confirm the new files themselves lint clean and that the rule
fires (temporarily break a locale file to see the error, then revert, or trust Step 3's already-fixed
state and just confirm no error appears).

**Depends on:** Step 2 (module must exist to import).

### Step 5 — Add the standalone CI script

**What:** Create a Node-executable script that exits non-zero on drift, and a package.json script
entry to run it.

**Where:** `scripts/check-locale-keys.mjs` (new file — no `scripts/` directory exists yet in the
repo root), `package.json` (edit).

**How:**

```js
// scripts/check-locale-keys.mjs
import { diffLocaleKeys } from '../src/lib/locale-keys.mjs'

const { inSync, missingByLocale } = diffLocaleKeys()

if (!inSync) {
  console.error('Locale key drift detected between fr/en/de:')
  for (const [locale, keys] of Object.entries(missingByLocale)) {
    if (keys.length > 0) console.error(`  ${locale} missing: ${keys.join(', ')}`)
  }
  process.exit(1)
}

console.log('Locale keys in sync (fr/en/de).')
```

In `package.json`'s `"scripts"` block, add (alongside the existing `"test:run"` entry, alphabetical
position doesn't matter — match existing ordering style):

```json
"check:locale-keys": "node scripts/check-locale-keys.mjs"
```

Run `pnpm run check:locale-keys` locally to confirm exit code 0 after Step 3's fixes.

**Depends on:** Step 2 (module must exist to import).

### Step 6 — Wire the script into CI

**What:** Add a new, distinct step to the `quality` job.

**Where:** `.github/workflows/ci.yml`.

**How:** Insert a new step immediately after the existing `- name: Lint` step (`ci.yml:21-22`) and
before `- name: Type check`:

```yaml
- name: Locale key parity
  run: pnpm run check:locale-keys
```

This is intentionally a separate step from `- name: Tests` (`ci.yml:27-28`, which runs
`pnpm run test:run` — already covers the same check via Step 1/3's vitest test) per Requirement 4:
the two entry points must be distinct CI-visible steps, not one folded into the other.

**Depends on:** Step 5 (the `check:locale-keys` package.json script must exist).

### Step 7 — Full verification pass

**What:** Run every check the AC requires, in order, and fix anything unexpected.

**Where:** repo root.

**How:** Run in sequence: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:run`,
`pnpm run check:locale-keys`, `pnpm run build`. All five must exit 0. Then confirm the four
protected files are byte-identical to `git show 8dac708:<path>` for each of `src/i18n/config.ts`,
`src/i18n/request.ts`, `src/i18n/date-locale.ts`, `src/i18n/use-locale-switch.ts` (Requirement 8 /
AC) — this plan's steps never touch them, this is a final sanity confirmation, not new work.

**Depends on:** Steps 1-6.

## Acceptance criteria

- [ ] AC-1 — A shared check module flattens `src/messages/{fr,en,de}.json` to dotted-path key sets
      and diffs them. → Step 2.
- [ ] AC-2 — A vitest test using that module fails when the three key sets differ and passes when
      they match; runs under existing `pnpm run test:run` / CI `quality` job with no CI-step change
      for this entry point. → Steps 1, 3.
- [ ] AC-3 — A custom ESLint rule using that module is registered in `eslint.config.mjs`, fires
      under `pnpm run lint`, and reports an error when the three key sets differ. → Step 4.
- [ ] AC-4 — A standalone script using that module exits non-zero when the three key sets differ;
      wired into `.github/workflows/ci.yml`'s `quality` job as its own step. → Steps 5, 6.
- [ ] AC-5 — All three entry points share one flatten/diff implementation — no duplicated logic. →
      Steps 2, 4, 5 (all import `src/lib/locale-keys.mjs`).
- [ ] AC-6 — `de.json` contains `appointments.types.laboratoire` with a non-empty German
      translation. → Step 3.
- [ ] AC-7 — `nav.acts` no longer exists in `fr.json` or `en.json`. → Step 3.
- [ ] AC-8 — Flattening and diffing all three locale files after the fix yields identical key sets
      (0 missing, 0 extra, in every direction). → Step 3, verified by Step 1's test.
- [ ] AC-9 — `src/i18n/config.ts`, `src/i18n/request.ts`, `src/i18n/date-locale.ts`,
      `src/i18n/use-locale-switch.ts` are unchanged. → Step 7 (no step touches them; Step 7 is the
      explicit confirmation).
- [ ] AC-10 — `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:run`, and `pnpm run build` all
      still pass. → Step 7.
