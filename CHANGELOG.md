# Changelog

## v1.3.1 (2026-07-11)

### Fixes

- Service worker no longer registers in development, since it was fighting Turbopack's Fast Refresh and causing a reload loop
- `postcss` bumped and pnpm overrides moved to `pnpm-workspace.yaml`, resolving 1 Dependabot advisory (XSS)

### Internal

- `db.ts` split into domain-focused files, with new characterization tests
- Dead code removed (per knip's report)
- French comments and stray UI strings translated to English
- Root screenshot moved into `docs/`
