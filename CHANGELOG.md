# Changelog

## v2.0.0 (2026-09-06)

### Features

- Migrated the app from Next.js to SvelteKit 2 and Svelte 5
- Rebuilt every screen on a new design system: dashboard, medications, blood tests, appointments, practitioners, journal, objectives, progress, resources, settings, and onboarding
- Added a desktop layout with its own nav rail and route-based content width, alongside the existing mobile nav
- Added shared UI primitives (aurora background, glass gauge, nav components) and sharpened the purple-tinted theme with action-feedback animations
- Added a hematocrit safety threshold, patch rotation tracking, and a stock estimate for medications
- Added practitioner-facing PDF/PNG export for blood test and progress charts
- Added QR sync export/import UI and wired up the notifications boot sequence
- Prerendered the home page with real meta tags for SEO

### Fixes

- Vercel was serving the app as a Next.js build; told it explicitly this is a static build, then added a 200.html fallback for every route so client-side routing survives a hard refresh

- Medication auto-validation now catches up every missed dose since a treatment's start date instead of only today and yesterday, and no longer depends on a 5 minute interval that dies once the PWA is backgrounded
- App icon replaced with the chrysalis mark cropped from the banner logo, recentered with margin to survive maskable safe-zone cropping
- Dashboard now shows proper empty states when there are no medications or appointments
- Restored the full-year overview on the appointments calendar and native dialog centering broken by Tailwind preflight
- Calmed the dark-theme aurora background and added grain/vignette
- Desktop dashboard timeline hidden below 1024px; mobile nav labels stay visible instead of active-only
- Nav and theme-switch labels now route through i18n instead of hardcoded French
- Restored the document title and the `/acts` redirect

### Internal

- E2E suite ported to the Svelte markup and native dialogs
- CI workflow and Playwright config adapted to the SvelteKit stack
- Test coverage added for the desktop nav rail and its breakpoints

## v1.3.1 (2026-07-11)

### Fixes

- Service worker no longer registers in development, since it was fighting Turbopack's Fast Refresh and causing a reload loop
- `postcss` bumped and pnpm overrides moved to `pnpm-workspace.yaml`, resolving 1 Dependabot advisory (XSS)

### Internal

- `db.ts` split into domain-focused files, with new characterization tests
- Dead code removed (per knip's report)
- French comments and stray UI strings translated to English
- Root screenshot moved into `docs/`

## v1.3.0 (2026-07-06)

### Features

- Objectives now absorb acts: a Dexie v8 migration merges legacy acts into objectives, `/acts/*` routes redirect to `/objectives/*`, and the acts entry was removed from the bottom nav
- Objectives gained a medical act category, practitioner and appointment linking, and appointments can now reference an objective directly
- Added a Playwright e2e job to the CI pipeline

### Fixes

- Patched 44 of 45 Dependabot-flagged vulnerabilities (Next.js, next-intl, Vitest, and their overrides)
- Pinned the `packageManager` field and bumped CI to pnpm v11 and Node.js 22, since local and CI were resolving different lockfile formats
- Fixed `/acts/[id]` redirects landing on `/objectives/undefined`: Next.js 15 makes `params` a Promise that must be awaited, and it was cast directly instead
- Removed the last hardcoded French strings from objective status labels
- Resolved react-hooks compiler errors surfaced by the Next.js 16 upgrade
- Associated the practitioner input with its label for accessibility
- Matched the Playwright locale to the app default, fixing a hydration race in e2e

### Internal

- Extracted shared form-field components for appointments, journal, blood tests, medications, objectives, and practitioners, cutting roughly 2,800 lines of duplicated new/edit form code
- Removed dead code and 5 dependencies (`react-hook-form`, `@hookform/resolvers`, `zod`, `canvas-confetti`, `sharp`) after an audit found no remaining call sites
- Extracted the 4-step CI setup into a composite action, shrinking `ci.yml` from 96 to 68 lines

## v1.2.0 (2026-04-24)

### Features

- Added an acts notebook and a lab address book, alongside a handful of dashboard bug fixes

## v1.1.1 (2026-04-10)

### Features

- Added English and German alongside French, migrating the whole app off hardcoded French strings onto `next-intl` message files
- Improved medication tracking UX based on user feedback

### Fixes

- Resolved Dependabot security alerts across 17 vulnerabilities, then a second pass for the remaining ones
- Bumped Next.js to 16.2.3 and Vite to >=8.0.5 for a security fix
- Polished German and English translation wording after review

## v1.0.0 (2026-02-27)

Initial release.

### Features

- Database schema, core utilities, UI components and app layout
- Medication tracking, blood test and hormone tracking, appointments and practitioner directory, journal and objectives, progress tracking
- Onboarding wizard and dashboard with a recap card
- Settings, resources, and data sync

### Internal

- Unit and E2E test suites
- CI pipeline and code quality tooling
