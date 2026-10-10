# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Windsurf, Codex…) working in this repository.
Package-specific rules live in [backend/AGENTS.md](backend/AGENTS.md) and [frontend/AGENTS.md](frontend/AGENTS.md).

## Project overview

**download-reports** — upload, list and download report files (pdf, xml, csv, xlsx) using S3 presigned URLs.
The file bytes never pass through the API: the browser PUTs to / GETs from S3 directly.

Flow: `POST /api/reports/upload-intent` → browser `PUT` to the presigned URL → `PATCH /api/reports/:id/confirm`
→ `GET /api/reports` lists it → `GET /api/reports/:id/download-link` returns a short-lived GET URL.

| Package | Stack |
| ------- | ----- |
| `backend/` | NestJS 11, Prisma 5 + PostgreSQL, AWS SDK v3 (S3 presigner), passport-jwt, `@nestjs/schedule`, Jest |
| `frontend/` | React 19, Vite 8, TypeScript 6, Tailwind 3, Radix UI, axios, Vitest + Testing Library, oxlint |

There is no root workspace: each package has its own `package.json` and lockfile. Run commands from inside
the package or with `npm --prefix <package>`.

## Business domain

**Central de Relatórios** is a self-service file hub: authenticated users upload report files (the UI frames them
as *documentos fiscais*) and later search, filter and download them. The system **stores** files; it never
generates or parses their contents. User-facing text is Brazilian Portuguese — keep new UI strings in pt-BR.

Why presigned URLs: files up to 50 MB never touch the API, and a stored file can only be read through a link
issued on demand to an authenticated user that expires within minutes.

### Entities

Source of truth: `backend/prisma/schema.prisma`. Frontend names are in brackets where they differ.

**User** — not a model. Represents the authenticated caller, identified only by the JWT `sub`
(`req.user.userId`). Nothing about the user is persisted (no account, subscriber or tenant record).

**Report** (`Report`; UI: "relatório") — represents one file a user uploaded, plus the metadata needed to list it
and to find its object in S3.

| Field | Description |
| ----- | ----------- |
| `id` | UUID. Public identifier in every route, and part of the S3 key. |
| `fileName` | Original file name as sent by the browser. Used in the S3 key, as the download file name, and as the search target. |
| `fileSize` [`sizeInBytes`] | Size in bytes **declared by the client** at upload intent (1 B–50 MB). Not checked against the stored object. |
| `contentType` | MIME type declared by the client; one of the four allowed types. Signed into the PUT URL. |
| `type` | File format derived from `contentType` on the server. Drives the type filter and the file icon. |
| `status` | Position in the lifecycle — see `ReportStatus`. |
| `s3Key` | `reports/{id}/{fileName}`. Briefly `''` between the two writes in `createUploadIntent`. |
| `createdAt` [`sentAt`] | When the upload intent was created (not when it was confirmed). UI: "Data de Envio". Sort key; the cron measures age from it. |
| `updatedAt` | Last change, maintained by Prisma. |
| `deletedAt` | Soft-delete marker. `null` = live; set together with `status = EXPIRED`. |

**ReportStatus** (lowercase in the frontend):

| Value | Meaning | Set by |
| ----- | ------- | ------ |
| `PENDING` | Upload intent created; bytes not confirmed yet. Listed but not downloadable. | `POST /upload-intent` |
| `AVAILABLE` | Upload confirmed; downloadable. | `PATCH /:id/confirm` |
| `EXPIRED` | Abandoned `PENDING` upload, soft-deleted; hidden everywhere. | Cleanup cron |
| `PROCESSING` | Reserved; nothing sets it. | — |
| `ERROR` | Reserved; nothing sets it. | — |

**ReportType**: `pdf` (`application/pdf`), `xml` (`application/xml`), `csv` (`text/csv`), `xlsx`
(`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### Glossary

| Term | Meaning | Code / UI |
| ---- | ------- | --------- |
| Upload intent | Reserves a `PENDING` row and returns a presigned PUT URL before any byte is sent. | `POST /upload-intent` |
| Confirmation | The client's claim that the PUT finished; makes the report downloadable. | `PATCH /:id/confirm` |
| Download link | Presigned GET URL generated per click (2 min); never stored or listed. | `downloadUrl`; "Baixar" |

### Business rules

1. Accepted files: pdf, xml, csv, xlsx, 1 byte–50 MB. Enforced on the client (`frontend/src/hooks/useUpload.ts`)
   and the server (`backend/src/reports/dto/upload-intent.dto.ts`) — change both together.
2. Only `AVAILABLE` reports can be downloaded (`422 REPORT_NOT_AVAILABLE`); the UI disables the button otherwise.
3. Confirm is allowed only from `PENDING`. A second confirm returns `422 INVALID_STATUS_TRANSITION` — it is
   deliberately not idempotent (see the `SPEC_DEVIATION` note in `reports.service.ts`).
4. An upload not confirmed within 20 min is abandoned. The cron runs hourly (`0 * * * *`), so a `PENDING` row
   actually expires 20–80 min after creation.
5. The list shows every non-deleted report, newest first, **including `PENDING` ones**. Search is a
   case-insensitive substring match on `fileName`; default page size 10, max 100.
6. Expired reports are invisible to every endpoint (`deletedAt: null`), but the row is kept.
7. If the upload URL expires mid-transfer (S3 `403`), retrying creates a **new** upload intent and report row;
   the old row is left for the cron.

### Not in the domain yet

Agents tend to assume these exist. They don't — do not add them as a side effect of other work; raise them:

- **Ownership / multi-tenancy.** The JWT `sub` reaches `createUploadIntent` as `_userId` but is not stored.
  Every authenticated user sees and downloads every report.
- **Login.** No sign-in UI or token issuance; the frontend reads a pre-existing JWT from `localStorage.token`.
- **Deleting reports.** No delete endpoint; only the cron expires rows.
- **Storage cleanup.** Expiring a row does not delete its S3 object, so abandoned uploads can leave orphans.
- **Upload verification.** Confirm trusts the client; it does not check that the S3 object exists.

## Build & test commands

```bash
# backend
cd backend
npm ci
npx prisma generate                                # required before tsc/build/tests
npm test                                           # unit tests (Jest, Prisma/S3 mocked)
npx jest --config ./test/jest-e2e.json test/reports.e2e-spec.ts   # e2e, mocked Prisma
npx tsc --noEmit
npm run build

# frontend
cd frontend
npm ci
npm test                                           # Vitest (jsdom)
npm run lint                                       # oxlint
npm run build                                      # tsc -b && vite build
```

Use the `/check` command to run the full gate. A change is not done until the gate for every package you
touched passes.

Known baseline failures (do not "fix" them as a side effect of unrelated work):
- `backend/test/app.e2e-spec.ts` needs a real `DATABASE_URL`; there is no Postgres in the sandbox.

## Architecture

- Report lifecycle (`ReportStatus`): `PENDING` → `AVAILABLE` (on confirm) → `EXPIRED` (soft delete).
  `PROCESSING` / `ERROR` are reserved.
- Deletion is **soft**: set `deletedAt` + `status = EXPIRED`. Never hard-delete rows.
- A cron job (`backend/src/reports/cleanup.service.ts`) expires `PENDING` rows older than 20 min.
- S3 key format: `reports/{reportId}/{originalFileName}`.
- TTLs: upload URL 15 min, download URL 2 min — configured by `UPLOAD_TTL_SECONDS` / `DOWNLOAD_TTL_SECONDS`.
  The 50 MB max size is hardcoded (`52_428_800`) in the upload DTO and in `useUpload`.
- All routes are under the `/api` prefix. The reports routes are guarded by `JwtAuthGuard` (class-level on the
  controller); the scaffold `GET /api` in `app.controller.ts` is **not** guarded.

### Codebase map

Where each responsibility lives, by layer. Put new code in the layer that owns the concern: business rules and
status transitions go in services (backend) or hooks (frontend), never in controllers, `src/api/*` or components.

**Backend: domain and application** (`backend/src/reports/`)

| Path | Responsibility |
| ---- | -------------- |
| `reports.service.ts` | All report use cases: upload intent, confirm (`PENDING → AVAILABLE`), download link, listing/filters, MIME → `ReportType` mapping. Throws the domain errors. |
| `cleanup.service.ts` | Hourly cron that expires abandoned uploads (`PENDING → EXPIRED` + `deletedAt`). |
| `dto/upload-intent.dto.ts` | Upload input rules: allowed MIME types (`ALLOWED_CONTENT_TYPES`), size 1 B–50 MB. |
| `dto/reports-filters.dto.ts` | List query rules: `search`, `type`, `page`, `pageSize` (≤ 100). |
| `reports.module.ts` | Wires the controller, `ReportsService` and `CleanupService`. |

**Backend: interface (HTTP)**

| Path | Responsibility |
| ---- | -------------- |
| `backend/src/reports/reports.controller.ts` | The four `/reports` routes; thin, delegates to `ReportsService`. |
| `backend/src/main.ts` | Bootstrap: global `api` prefix, `ValidationPipe({ whitelist, transform })`, `PORT`. CORS is not enabled. |
| `backend/src/app.module.ts` | Root module: `ConfigModule` (global), `ScheduleModule`, and the feature/infra modules. |
| `backend/src/app.controller.ts`, `app.service.ts` | Nest scaffold (`GET /api` → hello). Not part of the domain. |

**Backend: infrastructure**

| Path | Responsibility |
| ---- | -------------- |
| `backend/prisma/schema.prisma` | Data model and indexes (PostgreSQL). Migrations go in `backend/prisma/migrations/` (none committed yet). |
| `backend/src/prisma/` | `PrismaService` (connect/disconnect lifecycle) in a `@Global()` module. The only database access point. |
| `backend/src/storage/` | `StorageService` in a `@Global()` module: S3 client, key format, presigned PUT/GET, TTLs. The only S3 access point. |
| `backend/src/auth/` | `JwtStrategy` (Bearer token, `sub` → `req.user.userId`), `JwtAuthGuard`, `AuthModule`. Verifies tokens only; nothing issues them. `JWT_SECRET` falls back to `'default-secret'` when unset. |
| `ConfigService` (`@nestjs/config`) | All configuration. Env keys are listed in [backend/AGENTS.md](backend/AGENTS.md) and the root README. |

**Frontend** (`frontend/src/`)

| Path | Responsibility |
| ---- | -------------- |
| `main.tsx`, `App.tsx` | Entry point; renders `ReportsPage` (single page, no router). |
| `pages/ReportsPage.tsx` | Composes header, filters, table, pagination, upload button and error states. |
| `components/reports/` | Feature components: `ReportsTable`, `SearchFilterBar` (300 ms debounce), `Pagination`, `UploadButton`. |
| `components/ui/`, `components/layout/` | Presentational primitives (`Badge`, `StatusDot`, `FileTypeIcon`, `EmptyState`, `TableSkeleton`) and `Header`. |
| `hooks/` | Client-side application logic: `useUpload` (validation, PUT with progress, auto-retry, `ttl-expired`), `useDownload` (link on click, `<a download>`), `useReports` (filters, pagination, refetch). |
| `api/` | HTTP adapters, one function per endpoint. `client.ts`: axios with `baseURL: '/api'`, 30 s timeout, JWT from `localStorage.token`. `upload.ts` uses raw axios for the S3 PUT. |
| `types/report.ts` | Frontend mirror of the API contract (see "API ↔ UI contract"). |
| `utils/format.ts` | Display formatting: file size, dates (absolute/relative), type colours, status labels. |
| `index.css`, `../tailwind.config.js`, `../postcss.config.js` | Styling and design tokens. |
| `../vite.config.ts` | Build and dev server. There is **no `/api` proxy**, so in dev the SPA (`:5173`) cannot reach the API (`:3000`) without one. |

**Tests**

| Path | Responsibility |
| ---- | -------------- |
| `backend/src/**/*.spec.ts` | Unit tests (Jest); `PrismaService` and `StorageService` mocked. |
| `backend/test/reports.e2e-spec.ts` | HTTP e2e via supertest: real guard, JWT strategy and `ValidationPipe`; Prisma and S3 mocked. Config: `test/jest-e2e.json`. |
| `backend/test/app.e2e-spec.ts` | Scaffold e2e; needs a real database (known baseline failure). |
| `frontend/src/**/*.test.ts(x)` | Vitest + Testing Library (jsdom); setup in `src/test/setup.ts`, config in `frontend/vitest.config.ts`. |

**Tooling, CI and agent harness**

| Path | Responsibility |
| ---- | -------------- |
| `.github/workflows/ci.yml` | CI per package: typecheck, lint, unit + e2e tests, build (Node 22). |
| `package.json`, `.husky/pre-commit`, `lint-staged.config.mjs` | Root git hooks only: Prettier on staged backend files, oxlint on staged frontend files. |
| `backend/eslint.config.mjs`, `backend/.prettierrc`, `frontend/.oxlintrc.json` | Lint and format rules. |
| `.claude/settings.json`, `.claude/hooks/` | `pre-tool-use.mjs` blocks destructive commands and `.env` access; `post-edit.mjs` formats/lints edited files. |
| `.claude/commands/check.md`, `.claude/agents/api-contract-reviewer.md` | The `/check` gate and the contract-review subagent. |
| `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/` | Workflow skills (tlc-*, the-judge, harness-eval), mirrored per tool. |
| `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md` | Agent rules; the `CLAUDE.md` files import them. |

Decisions are logged in `.specs/STATE.md` (AD-001…). Feature specs live in `.specs/features/<feature>/`
(`spec.md`, `design.md`, `tasks.md`). Read the relevant spec before changing behaviour it covers; record new
architectural decisions in `STATE.md`.

## API ↔ UI contract

The backend `Report` (Prisma: `createdAt`, `fileSize`, UPPERCASE status) and the frontend `Report`
(`frontend/src/types/report.ts`: `sentAt`, `sizeInBytes`, lowercase status) currently **differ**. This is known
drift tracked in `.design/run-end-to-end.md`. Any change touching either side must keep them consistent or
say explicitly that it does not; the `api-contract-reviewer` subagent checks this.

## Conventions

- TypeScript rules (including no `any`) are in "Code generation rules".
- Error responses: `throw new XxxException({ error: 'UPPER_SNAKE_CODE' })`. The frontend matches on `error`.
- Tests sit next to the code: `*.spec.ts` (backend, Jest), `*.test.ts(x)` (frontend, Vitest).
  Mock Prisma and S3 in unit tests — never hit real AWS.
- Commits follow Conventional Commits with a scope: `feat(upload): …`, `fix(reports): …`, `chore(test): …`.
  One logical change per commit.
- Specs and decision logs are written in Portuguese; code, identifiers and commit messages in English.
- Every change updates `AGENTS.md` in the same commit — see "Keep AGENTS.md current".

## Naming conventions

Derived from the existing code; follow them for new code. Known deviations are listed at the end — do not copy
them, and do not rename them as a side effect of unrelated work.

**Backend (NestJS)**

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| Feature folder | kebab-case, plural for resources | `reports/`, `auth/`, `storage/` |
| File | `kebab-case.<role>.ts`, role = `module`, `controller`, `service`, `dto`, `guard`, `strategy` | `reports.service.ts`, `upload-intent.dto.ts`, `jwt-auth.guard.ts` |
| Class | PascalCase + role suffix, matching the file | `ReportsService`, `UploadIntentDto`, `JwtAuthGuard` |
| DTO | `<Action>Dto` for bodies, `<Resource>FiltersDto` for list queries | `UploadIntentDto`, `ReportsFiltersDto` |
| Service method | camelCase verb + noun; `findAll` for the list | `createUploadIntent`, `confirmUpload`, `getDownloadLink` |
| Constant | UPPER_SNAKE_CASE | `ALLOWED_CONTENT_TYPES` |
| Error code | UPPER_SNAKE_CASE, describes the condition | `REPORT_NOT_FOUND`, `INVALID_STATUS_TRANSITION` |
| Env var | UPPER_SNAKE_CASE; durations end in `_SECONDS` | `S3_BUCKET_NAME`, `UPLOAD_TTL_SECONDS` |
| Logger | `new Logger(ClassName.name)` in a `private readonly logger` field | `ReportsService`, `CleanupService` |

**HTTP API**

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| Resource path | plural noun | `/reports` |
| Action sub-path | kebab-case noun or verb after `:id` | `/reports/upload-intent`, `/:id/confirm`, `/:id/download-link` |
| JSON fields, query params | camelCase | `fileSize`, `pageSize`, `uploadUrl`, `downloadUrl` |
| List response | `{ data, total, page, pageSize }` | `GET /reports` |

**Database (Prisma)**

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| Model | PascalCase, singular | `Report` |
| Field | camelCase; foreign/external keys end in `Key`/`Id` | `fileName`, `s3Key` |
| Timestamps | `createdAt`, `updatedAt`, `deletedAt` (soft delete) on every model | `Report` |
| Enum | PascalCase, `<Model><Concept>` | `ReportStatus`, `ReportType` |
| Status enum values | UPPER_CASE | `PENDING`, `AVAILABLE` |

**Frontend (React)**

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| Component file and name | PascalCase `.tsx`, named export (`App` is the only default export) | `ReportsTable.tsx` → `export function ReportsTable` |
| Props type | `<Component>Props` interface | `ReportsTableProps`, `UploadButtonProps` |
| Hook | `use<Feature>` in `useFeature.ts`; return type `Use<Feature>Return` | `useUpload` → `UseUploadReturn` |
| Non-component file | camelCase or lowercase `.ts` | `client.ts`, `reports.ts`, `format.ts`, `report.ts` |
| Folder barrel | `index.ts` re-exporting the folder | `components/ui/index.ts` |
| API function | verb + noun, mirrors the endpoint | `fetchReports`, `getDownloadLink`, `requestUploadUrl`, `confirmUpload` |
| Callback prop | `on<Event>` | `onDownload`, `onPageChange`, `onUploadSuccess` |
| Boolean | `is<State>` | `isLoading`, `isAvailable` |
| State union | lowercase, kebab-case for multi-word | `UploadStatus = 'idle' \| … \| 'ttl-expired'` |
| DOM `id` | kebab-case, `<area>-<element>`, `-${id}` suffix for rows | `search-reports`, `upload-report-btn`, `download-${report.id}` |
| Tailwind tokens | `brand-*` (accent), `surface-*` (neutrals) from `tailwind.config.js` | `bg-surface-950`, `text-brand-400` |

**Tests**

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| File | `<file>.spec.ts` (backend), `<file>.test.ts(x)` (frontend), `<area>.e2e-spec.ts` (backend e2e) | `reports.service.spec.ts`, `useUpload.test.ts` |
| `describe` | the unit under test, by its exact name | `describe('CleanupService')`, `describe('fetchReports')` |
| `it` | present-tense behaviour, no "should" | `it('rejects an expired token')` |
| Mock | `mock<Name>` | `mockFetchReports`, `mockConfirmUpload` |

**Git branches**: `<type>/<short-kebab-description>`, branched off `main` and merged back through a pull request.
The prefix is the Conventional Commit type of the branch's main change, so branch and commits read the same.

| Prefix | Use for | Example |
| ------ | ------- | ------- |
| `feat/` | New behaviour or feature | `feat/upload-retry` |
| `fix/` | Bug fix | `fix/confirm-idempotency` |
| `hotfix/` | Urgent fix that must reach `main` ahead of other work | `hotfix/jwt-default-secret` |
| `refactor/` | Code change with no behaviour change | `refactor/storage-service` |
| `perf/` | Performance improvement | `perf/reports-list-query` |
| `test/` | Adding or fixing tests only | `test/cleanup-cron` |
| `docs/` | Documentation and agent guides | `docs/refactor-doc-agents` |
| `style/` | Formatting only | `style/backend-prettier` |
| `ci/` | CI workflow changes | `ci/cache-prisma` |
| `chore/` | Tooling, dependencies, config, harness | `chore/bump-prisma` |

Description: lowercase kebab-case, 2–5 words, says what changes (`fix/confirm-idempotency`, not `fix/bug` or
`fix/issue-12`). One logical change per branch. Commit messages follow the Conventional Commits rule above.

**Known deviations** (leave as is unless the task is the rename):

- `ReportType` values are lowercase (`pdf`) while `ReportStatus` values are UPPERCASE.
- `isDownloading` in `useDownload` holds the report id (`string | null`), not a boolean.
- `CleanupService` log messages are in Portuguese; other code text is English.
- Backend `createdAt` / `fileSize` vs frontend `sentAt` / `sizeInBytes` (see "API ↔ UI contract").

## Code generation rules

Rules for any code an agent writes or changes. Package-specific rules in [backend/AGENTS.md](backend/AGENTS.md)
and [frontend/AGENTS.md](frontend/AGENTS.md) still apply.

### Types

- **No `any`**, in either package, in source or tests. Use precise types, generics, or `unknown` plus narrowing
  for untrusted data. In tests, type mocks with `jest.Mocked<T>` / `vi.mocked(...)` instead of `as any`.
  One existing exception, `frontend/src/hooks/useUpload.test.ts:42`, is not a precedent; fix it when you touch
  that test.
- The tooling does **not** enforce this: neither tsconfig sets `strict: true`, the backend has
  `noImplicitAny: false` and ESLint turns `@typescript-eslint/no-explicit-any` off. Annotate parameters and
  return types of exported functions explicitly so an implicit `any` cannot slip in.
- Do not silence the compiler with `as` casts, `!` non-null assertions or `@ts-ignore`; narrow the value instead.
  Allowed only at a library or DOM boundary, with the reason in a comment.
- Reuse the domain types: backend enums from `@prisma/client` (`ReportStatus.PENDING`, never `'PENDING'`),
  frontend types from `src/types`. Do not redeclare them locally.

### Tests first

- **Every behaviour you add or change ships with unit tests in the same commit.** Prioritize the unit test over
  any other output; a change without tests is not done.
- Fixing a bug: write a failing test that reproduces it first, then fix.
- Cover the happy path, every error code the code can throw, boundary values (e.g. `52_428_800` and
  `52_428_801` bytes) and every status transition touched.
- Backend: mock `PrismaService` and `StorageService` with `Test.createTestingModule`. A new or changed route also
  gets a case in `backend/test/reports.e2e-spec.ts`.
- Frontend: hook and component tests mock `src/api/*`; API tests mock axios. No real network, AWS or database.
- Never delete, skip or weaken an existing test to make a change pass. No `.only` / `.skip` in commits.
- Run `/check` before calling the work done.

### Structure

- Put code in the layer that owns it (see "Codebase map"). Business rules go in services and hooks, not in
  controllers, `src/api/*` or components.
- Reuse before adding: check `utils/format.ts`, `components/ui/` and the existing hooks and services first.
- Keep the diff minimal: no reformatting, renaming or refactoring of code the task does not need.
- No new dependency unless the task needs it; say why in the commit body, and install with `npm install` inside
  the package.

### Output hygiene

- No `console.log` or `debugger` in source. The backend logs through Nest `Logger`.
- No commented-out code, placeholder implementations or `TODO`s without an owner and reason.
- Comments explain *why*, never restate *what* the code does (see the `SPEC_DEVIATION` note in
  `reports.service.ts` for the expected style).
- Never swallow errors. The backend throws an HTTP exception with an `error` code; the frontend shows a pt-BR
  message to the user.

### Keep AGENTS.md current

**Always update `AGENTS.md` when you make a change**, in the same commit as the code. A change whose docs are
stale is not done. Use this table to find what to update:

| You changed… | Update |
| ------------ | ------ |
| A behaviour, limit, TTL or status transition | "Business rules"; "Architecture" if it is listed there |
| The Prisma schema or an enum | "Entities"; "Naming conventions → Database" if it adds a pattern |
| A route, request/response field or error code | "Project overview" flow, "API ↔ UI contract", "Business rules" |
| A file, module, folder or layer (added, moved, removed) | "Codebase map" |
| A command, script, tool, hook or CI step | "Build & test commands" and/or "Codebase map → Tooling" |
| An env var or config key | "Architecture", the package `AGENTS.md` config list, and the README |
| A new naming pattern | "Naming conventions" |
| Something listed as missing, a deviation, a gap or a known issue (e.g. you fixed it) | Remove or reword that entry ("Not in the domain yet", "Known deviations", the `any` exception, the missing `/api` proxy…) |
| Something only one package cares about | That package's `AGENTS.md` (`backend/` or `frontend/`) |

- Document what the code **does**, not what it should do. Check every path, name and value you write.
- Edit the existing entry instead of appending a near-duplicate; delete entries that are no longer true.
- If a change needs no doc update, say so explicitly in the commit body or PR description.

## Safety

- Never read, print or commit `.env` files or credentials. Document new variables in the package README
  (and `.env.example` once it exists).
- Do not hand-edit `package-lock.json`; use `npm install`.
- Never edit an applied migration under `backend/prisma/migrations/`; create a new one.
- Destructive commands (`git reset --hard`, force push, `prisma migrate reset`, `rm -rf` on broad paths) and any
  read or edit of `.env*` files (Read, Grep, or a shell command naming the file) are blocked by
  `.claude/hooks/pre-tool-use.mjs`. Ask the user instead of working around the hook.
