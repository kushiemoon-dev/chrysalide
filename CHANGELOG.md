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

### Fixes

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
