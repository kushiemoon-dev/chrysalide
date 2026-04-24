# Chrysalide Architecture

Medical PWA for HRT transition tracking — 100% local, zero backend.

## Tech Stack

| Layer      | Technology               | Version |
| ---------- | ------------------------ | ------- |
| Framework  | Next.js (App Router)     | 16.x    |
| UI         | React                    | 19.x    |
| Language   | TypeScript (strict)      | 5.x     |
| CSS        | Tailwind CSS             | 4.x     |
| Components | shadcn/ui (Radix UI)     | -       |
| Database   | Dexie.js (IndexedDB)     | 4.x     |
| Charts     | Recharts                 | 3.x     |
| Icons      | Lucide React             | -       |
| Forms      | React Hook Form + Zod    | -       |
| Unit Tests | Vitest + Testing Library | 4.x     |
| E2E Tests  | Playwright               | 1.58.x  |

## Local-First Architecture

```
[Browser]
    |
    +-- Next.js App Router (client-side only)
    |       |
    |       +-- Pages (src/app/**/page.tsx)
    |       +-- Components (src/components/)
    |       +-- Business logic (src/lib/)
    |
    +-- IndexedDB (Dexie.js)
    |       |
    |       +-- 14 versioned tables
    |       +-- Automatic migrations
    |
    +-- Service Worker (PWA)
    |       |
    |       +-- Offline cache
    |       +-- Push notifications
    |
    +-- QR Sync (optional)
            |
            +-- Export: data -> chunks -> QR codes
            +-- Import: scan QR -> reassemble -> DB
```

No network requests for user data. The Vercel deployment only serves static assets.

## Database Schema

**14 tables, 7 migration versions** (in `src/lib/db.ts`):

### Tables

| Table              | Key    | Indexes                                         | Description                         |
| ------------------ | ------ | ----------------------------------------------- | ----------------------------------- |
| `medications`      | `++id` | name, type, isActive, startDate                 | Active/inactive medications         |
| `medicationLogs`   | `++id` | medicationId, timestamp, taken, applicationZone | Dose history                        |
| `bloodTests`       | `++id` | date, practitionerId                            | Blood test results + lab link       |
| `physicalProgress` | `++id` | date                                            | Photos and measurements             |
| `appointments`     | `++id` | date, type, practitionerId, actId               | Medical appointments + act link     |
| `practitioners`    | `++id` | name, specialty, lastUsed, usageCount           | Practitioner directory (incl. labs) |
| `journalEntries`   | `++id` | date, mood, \*tags                              | Journal (mood, side effects)        |
| `objectives`       | `++id` | category, status, targetDate                    | Transition objectives               |
| `milestones`       | `++id` | objectiveId, date                               | Objective milestones                |
| `treatmentChanges` | `++id` | medicationId, date, changeType                  | Treatment change history            |
| `reminders`        | `++id` | -                                               | Medication reminders                |
| `userProfile`      | `++id` | -                                               | User profile                        |
| `acts`             | `++id` | category, status, createdAt                     | Medical act notebook                |
| `actTodos`         | `++id` | actId, done, order                              | Per-act checklist items             |

### Schema Versions

| Version | Changes                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------- |
| v1      | Core tables (medications, logs, bloodTests, progress, appointments, reminders, userProfile)             |
| v2      | `applicationZone` field on medicationLogs (gel tracking)                                                |
| v3      | journal, objectives, milestones, treatmentChanges tables                                                |
| v4      | practitioners table                                                                                     |
| v5      | appointments -> practitioners foreign key                                                               |
| v6      | `cost` field on appointments                                                                            |
| v7      | acts, actTodos tables; `practitionerId` on bloodTests; `actId` on appointments; date normalizer upgrade |

## App Routes

### Main Navigation (bottom nav)

| Route          | Page                        |
| -------------- | --------------------------- |
| `/`            | Dashboard — today's summary |
| `/medications` | Medications list            |
| `/bloodtests`  | Blood tests list            |

### "More" Menu

| Route            | Page                       |
| ---------------- | -------------------------- |
| `/progress`      | Physical progress          |
| `/journal`       | Personal journal           |
| `/objectives`    | Transition objectives      |
| `/acts`          | Medical act notebook       |
| `/appointments`  | Appointments               |
| `/practitioners` | Practitioners (incl. labs) |
| `/resources`     | Resources & FAQ            |

### Other

| Route         | Page                              |
| ------------- | --------------------------------- |
| `/settings`   | Preferences, theme, export/import |
| `/onboarding` | First-time setup wizard           |

Each section follows the CRUD pattern: `/{section}`, `/{section}/new`, `/{section}/[id]`, `/{section}/[id]/edit`.

## Component Organization

```
src/components/
  ui/              # shadcn/ui — generated, do not edit manually
  layout/          # bottom-nav.tsx, header.tsx
  brand/           # logo.tsx, decorated-icon.tsx
  onboarding/      # Wizard steps (welcome, profile, medication, tour)
  dashboard/       # recap-card.tsx
  medications/     # change-entry.tsx, treatment-timeline.tsx
  bloodtests/      # hormone-chart.tsx (Recharts visualization)
  objectives/      # blahaj-progress.tsx, celebration-modal.tsx, ...
  journal/         # entry-card.tsx, mood-picker.tsx, tag-input.tsx
  appointments/    # practitioner-input.tsx, year-calendar.tsx
  settings/        # theme-picker.tsx, theme-provider.tsx
  pwa/             # service-worker-register.tsx
  sync/            # qr-export.tsx, qr-import.tsx
```

## Business Logic Modules (`src/lib/`)

| Module                      | Responsibility                                                |
| --------------------------- | ------------------------------------------------------------- |
| `db.ts`                     | Dexie schema, CRUD helpers, export/import, aggregations       |
| `types.ts`                  | TypeScript interfaces (Medication, BloodTest, Appointment...) |
| `constants.ts`              | Medication types, blood markers, reference ranges, templates  |
| `utils.ts`                  | Utility functions (fuzzySearch, cn, date helpers)             |
| `notifications.ts`          | Notification preferences, frequency calculations, reminders   |
| `notification-scheduler.ts` | Notification scheduling via Service Worker                    |
| `onboarding.ts`             | Onboarding state (localStorage)                               |
| `qr-sync.ts`                | Chunk splitting, QR generation, reassembly                    |
| `theme.ts`                  | Light/dark themes, system preference detection                |
| `resources-data.ts`         | FAQ content and resources (static)                            |

## Medical Data

### Treatment Types

- **Feminizing**: estrogens, anti-androgens, progesterone
- **Masculinizing**: testosterone
- **Other**: GnRH agonists

### Blood Markers (14)

Estradiol, testosterone, LH, FSH, prolactin, SHBG, progesterone, DHT, hematocrit, hemoglobin, potassium, blood glucose, creatinine, AST/ALT.

Each marker has **reference ranges** configured per context (feminizing, masculinizing, cis male, cis female).

### Administration

5 methods: pill, injection, patch, gel, implant — each with specific frequencies and routes.

## Theme & Design

Palette based on the trans flag colors:

| Color      | Hex       | Usage            |
| ---------- | --------- | ---------------- |
| Trans blue | `#5BCEFA` | Primary accent   |
| Trans pink | `#F5A9B8` | Secondary accent |
| White      | `#FFFFFF` | Light background |

Native dark mode support with automatic system preference detection.

## CI/CD Pipeline

```
Push/PR to dev or main
    |
    +-- GitHub Actions (ci.yml)
    |       |
    |       +-- pnpm install --frozen-lockfile
    |       +-- pnpm lint
    |       +-- pnpm typecheck
    |       +-- pnpm test:run
    |       +-- pnpm build
    |
    +-- Vercel (automatic deployment)
```

## Technical Decisions

| Decision               | Rationale                                       |
| ---------------------- | ----------------------------------------------- |
| IndexedDB (no backend) | Medical data privacy, zero server               |
| QR sync (no cloud)     | Device-to-device transfer without accounts      |
| Next.js App Router     | SSG + PWA, standard routing                     |
| Dexie.js               | Clean API over IndexedDB, versioned migrations  |
| shadcn/ui              | Accessible, customizable components, no lock-in |
| Vitest (not Jest)      | Fast, native ESM support, modern API            |
