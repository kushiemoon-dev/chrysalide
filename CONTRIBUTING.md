# Contributing to Chrysalide

Thanks for your interest in contributing! This guide will get you set up and running tests in under 15 minutes.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10

## Installation

```bash
git clone https://github.com/kushiemoon-dev/chrysalide.git
cd chrysalide
pnpm install
```

## Available Scripts

| Command              | Description                 |
| -------------------- | --------------------------- |
| `pnpm dev`           | Dev server (port 3000)      |
| `pnpm build`         | Production build            |
| `pnpm lint`          | ESLint                      |
| `pnpm typecheck`     | TypeScript type checking    |
| `pnpm test`          | Unit tests (watch mode)     |
| `pnpm test:run`      | Unit tests (single run, CI) |
| `pnpm test:coverage` | Tests + coverage report     |
| `pnpm test:e2e`      | Playwright E2E tests        |
| `pnpm format`        | Format all code             |
| `pnpm format:check`  | Check formatting            |

## Development Workflow

### 1. Create a branch

```bash
git checkout dev
git pull origin dev
git checkout -b feat/my-feature
```

### 2. Code

- Follow existing style (ESLint + Prettier run automatically via pre-commit hook)
- TypeScript strict: no `any`, no `@ts-ignore`
- Immutability: always create new objects, never mutate

### 3. Test

```bash
pnpm test:run          # unit tests
pnpm test:coverage     # check coverage (>60%)
pnpm test:e2e          # E2E (requires Chromium: npx playwright install chromium)
```

### 4. Commit

The pre-commit hook automatically runs ESLint and Prettier on staged files.

Commit message format:

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### 5. Pull Request

- Base branch: `dev`
- Describe changes and test plan
- CI (GitHub Actions) runs: lint, typecheck, test, build

## Project Structure

```
src/
  app/          # Next.js App Router pages
  components/   # React components by feature
    ui/         # shadcn/ui (do not edit manually)
    layout/     # Navigation, header
    ...         # One folder per domain
  lib/          # Business logic, DB, utilities
e2e/            # Playwright E2E tests
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Conventions

### Files

- Organize by feature/domain, not by type
- Target 200-400 lines per file, max 800
- One component = one file

### Tests

- Unit tests in `src/lib/*.test.ts` (Vitest + jsdom)
- E2E tests in `e2e/*.spec.ts` (Playwright)
- For React 19 controlled inputs, use `pressSequentially()` instead of `fill()` in Playwright

### Database

- Dexie.js (IndexedDB) — no backend
- All data stays on the user's device
- Versioned schema in `src/lib/db.ts`

## Sensitive Data

- **Never** hardcode secrets (API keys, tokens)
- `.env*` files are in `.gitignore`
- Local tracking files (`task_plan.md`, `findings.md`, `progress.md`, `notes.md`) are git-ignored
