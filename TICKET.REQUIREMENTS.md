# REQUIREMENTS: Guard lint/CI against i18n locale key drift

## Context

`next-intl` serves 3 static locale JSON files — `src/messages/{fr,en,de}.json` (fr default) —
loaded dynamically per request by `src/i18n/request.ts`. Nothing today enforces that the three
files carry the same key set. This work adds a guard that fails when they diverge, and fixes the
two drift instances already found in `de.json`. Out of scope: translation-quality issues beyond
key-set parity, any other behavior/UX change, and the other chantiers mentioned in the ticket
(db.ts, notification-scheduler.ts, accessibility audit).

## Verified codebase facts

_Verified at commit `8dac708`, 2026-08-27, clean working tree. Re-verify specifics if the tree has
moved since._

- **Confirmed drift** (independently re-flattened and diffed all three JSON files): `fr` and `en`
  are identical key sets, 991 keys each. `de.json` has 989 keys, missing exactly:
  `appointments.types.laboratoire` and `nav.acts`. No other divergence exists (no extra keys in
  `de`, no other missing keys) — the ticket's diff claim is accurate and complete.
- **`appointments.types.laboratoire` is a live, actively-consumed key.** Confirmed 8 call sites
  doing dynamic `t('types.' + <value>)` / ``t(`types.${<value>}`)`` lookups against the
  `appointments` namespace: `src/app/appointments/[id]/page.tsx` (x2), `calendar/page.tsx`,
  `new/page.tsx`, `page.tsx` (x2), `src/components/appointments/practitioner-input.tsx`,
  `year-calendar.tsx`, `src/components/appointments/AppointmentFormFields.tsx`. `fr.json` /
  `en.json` values: `"Laboratoire"` / `"Laboratory"`.
- **`nav.acts` is confirmed dead, not merely unreferenced.** Git history shows it was
  _deliberately_ orphaned: commit `c346746` ("redirect /acts/\* to /objectives/\*, remove acts from
  bottom nav") explicitly removed the `acts` entry from `src/components/layout/bottom-nav.tsx`'s
  nav-item arrays because acts became reachable via `/objectives` instead. `src/app/acts/**`
  still exists but only as 4 pure `redirect()` shims to `/objectives` equivalents (no UI, no
  `t(...)` calls). No remaining reference to `nav.acts` (or `'acts'`/`"acts"` as a nav labelKey)
  anywhere in `src/`. This overrides the ticket's more tentative framing (see Overrides).
- **Guard mechanism (user-confirmed):** one shared, importable check module doing the flatten+diff
  of the three locale files' key sets, invoked from three independent entry points: a vitest test,
  a custom ESLint rule, and a standalone CI script step. Not three redundant re-implementations.
- **Existing test infra:** vitest is already wired into CI — `.github/workflows/ci.yml`'s `quality`
  job runs `pnpm run test:run` (`vitest run`) alongside lint/typecheck/build, no CI change needed
  to pick up a new test. Tests are colocated as `*.test.ts` (20 existing files, e.g.
  `src/lib/db-schema.test.ts`). `vitest.config.ts`'s coverage `include` is scoped to
  `src/lib/**/*.ts` only — a new test/module outside `src/lib` neither helps nor hurts the 60%
  coverage threshold; one inside `src/lib` would count toward it.
- **Existing lint infra:** `eslint.config.mjs` uses ESLint's flat config (`defineConfig` from
  `eslint/config`), composing `eslint-config-next`'s `core-web-vitals` and `typescript` presets.
  No i18n-specific ESLint plugin and no local/custom rule exists today — confirmed no
  `eslint-plugin-*i18n*` in `package.json` devDependencies.
- **No existing CI-script infra:** no `scripts/` directory exists in the repo root. `engines.node`
  requires `>=22`; devDependencies contain no TS-execution tool (`tsx`, `ts-node`, `esbuild-register`,
  etc.) — a standalone Node script would either need to be plain JS/ESM, use Node 22's native
  TS-stripping flag, or pull in a new dev dependency (a Plan-phase decision).
- **Pre-commit hook:** `.husky/pre-commit` runs `lint-staged`, which runs `eslint --fix` +
  `prettier --write` on staged `*.{js,jsx,ts,tsx}` and `prettier --write` on staged
  `*.{json,css,md}` (`package.json`'s `lint-staged` block). A locale JSON file edited alone would
  trigger prettier but not ESLint under the current `lint-staged` glob, unless the guard's ESLint
  rule is scoped to run against a `.ts`/`.tsx` file the rule also happens to lint, or the
  `lint-staged` config is extended — a Plan-phase detail, noted here so it isn't missed.

## Requirements

1. A single, importable check function/module exists that flattens each of
   `src/messages/{fr,en,de}.json` to a dotted-path key set and computes the set differences
   between all three. (Goal; user-confirmed mechanism)
2. That check is invoked from three independent entry points, all backed by the same core logic
   (no duplicated flatten/diff implementation per entry point): (user-confirmed mechanism)
   - a vitest test (fails the test run on any drift),
   - a custom ESLint rule (reports a lint error on any drift),
   - a standalone script runnable as its own CI step (exits non-zero on any drift).
3. The guard fails (non-zero exit / failing test / lint error, per entry point) when the three
   locale files' key sets are not identical, and passes when they are. (Goal, AC)
4. The new CI script entry point is wired into `.github/workflows/ci.yml`'s `quality` job as an
   explicit step, distinct from the existing `pnpm run test:run` step. (AC, mechanism)
5. The new ESLint rule is registered in `eslint.config.mjs` and active for the normal `pnpm run
lint` invocation (the same one CI's `quality` job already runs). (AC, mechanism)
6. `de.json` gains `appointments.types.laboratoire` with an accurate German translation (tentative:
   `"Labor"` — see Open questions), matching the structure/position convention of the other
   `appointments.types` entries. (AC)
7. `nav.acts` is removed from `fr.json` and `en.json` (confirmed dead — see Verified codebase
   facts), not added to `de.json`. All three files end with identical key sets. (AC)
8. No change to `next-intl` runtime config (`src/i18n/config.ts`, `src/i18n/request.ts`,
   `src/i18n/date-locale.ts`, `src/i18n/use-locale-switch.ts`) — the guard and key fixes are
   content/tooling-only. (Non-goal / AC)
9. No translation-quality changes beyond the `appointments.types.laboratoire` gap and the
   `nav.acts` removal — existing translations are left untouched. (Non-goal)

## Overrides

- **Ticket says:** "`nav.acts` — not referenced anywhere in the codebase found so far... Looks
  like an orphaned key already present in `fr`/`en`, not a live bug on its own — needs a decision
  (translate it, or delete it)."
  **Code/git shows:** it's not merely unreferenced — commit `c346746` deliberately deleted its one
  usage when `/acts` routes were redirected into `/objectives`. `src/app/acts/**` still exists but
  only as dead redirect shims with no `t(...)` calls.
  **Resulting requirement:** treat as confirmed dead; remove from `fr.json`/`en.json` rather than
  translate into `de.json` (Requirement 7) — no user decision needed on this branch, it's
  git-verified.
- **Ticket says:** "`nav.acts`... no `/acts` route found."
  **Code shows:** `src/app/acts/page.tsx`, `acts/new/page.tsx`, `acts/[id]/page.tsx`,
  `acts/[id]/edit/page.tsx` all exist, but each is a one-line `redirect()` to the `/objectives`
  equivalent — no UI, no translation usage. Doesn't change the resulting requirement, but the
  ticket's "not found" is inaccurate; "found, but a dead redirect shim" is the accurate state.

## Open questions

- **`appointments.types.laboratoire`'s German value.** Tentative: `"Labor"` (direct match for
  English `"Laboratory"`; a neutral noun, no gendered-suffix pattern needed unlike surrounding
  profession keys such as `"Chirurg·in"`). Non-blocking — flag for a native-speaker/human
  confirmation pass before merge, since translation-accuracy judgment isn't code-verifiable.
- **Exact file location and language for the shared check module and the standalone CI script**
  (e.g. plain `.mjs` vs a new TS-execution dev dependency vs Node's native TS-stripping flag; where
  it lives relative to `src/lib` for coverage purposes). Non-blocking for Requirements — this is
  architecture the Plan phase should decide, given the constraints already captured under Verified
  codebase facts (no `scripts/` dir, no TS-execution tool installed today).
- **Whether `lint-staged`'s glob needs extending** so editing only `src/messages/*.json` locally
  also triggers the new ESLint rule pre-commit (today only `prettier --write` runs on staged
  JSON). Non-blocking — the CI step and `pnpm run lint`/`pnpm run test:run` invocations catch drift
  regardless; this only affects how early a local pre-commit catches it.

## Acceptance criteria

- [ ] A shared check module flattens `src/messages/{fr,en,de}.json` to dotted-path key sets and
      diffs them.
- [ ] A vitest test using that module fails when the three key sets differ and passes when they
      match; it runs under the existing `pnpm run test:run` / CI `quality` job with no CI-step
      change needed for this entry point.
- [ ] A custom ESLint rule using that module is registered in `eslint.config.mjs`, fires under
      `pnpm run lint`, and reports an error when the three key sets differ.
- [ ] A standalone script using that module exits non-zero when the three key sets differ; it is
      wired into `.github/workflows/ci.yml`'s `quality` job as its own step.
- [ ] All three entry points share one flatten/diff implementation — no duplicated logic.
- [ ] `de.json` contains `appointments.types.laboratoire` with a non-empty German translation.
- [ ] `nav.acts` no longer exists in `fr.json` or `en.json`.
- [ ] Flattening and diffing all three locale files after the fix yields identical key sets (0
      missing, 0 extra, in every direction).
- [ ] `src/i18n/config.ts`, `src/i18n/request.ts`, `src/i18n/date-locale.ts`,
      `src/i18n/use-locale-switch.ts` are unchanged.
- [ ] `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:run`, and `pnpm run build` all still
      pass.
