# AGENTS.md

Rules for AI coding agents in this repo. Package rules: [backend/AGENTS.md](backend/AGENTS.md),
[frontend/AGENTS.md](frontend/AGENTS.md). This file is the summary; each section links to its full-detail file in
[`docs/`](docs/) — read it before working on that area.

## Overview

**Central de Relatórios**: users upload, search and download report files (pdf, xml, csv, xlsx — the UI calls them
*documentos fiscais*) through S3 presigned URLs; file bytes never pass through the API. The system stores files,
never generates or parses them. UI text is pt-BR; code, identifiers and commits are English.

Flow: `POST /api/reports/upload-intent` → browser `PUT` to S3 → `PATCH /api/reports/:id/confirm` →
`GET /api/reports` → `GET /api/reports/:id/download-link`.

Stack: `backend/` NestJS 11, Prisma 5 + PostgreSQL, AWS SDK v3, passport-jwt, Jest · `frontend/` React 19, Vite 8,
TypeScript 6, Tailwind 3, Radix UI, axios, Vitest, oxlint. No root workspace: run commands inside each package.
`/check` runs the gate; a change is done only when it passes for every package touched. Known failure:
`backend/test/app.e2e-spec.ts` needs a real database. Decisions and specs: `.specs/` (local, gitignored) — read the
relevant spec before changing behaviour it covers.

## Domain

Full detail: [docs/DOMAIN-GUIDELINES.md](docs/DOMAIN-GUIDELINES.md).

- **Report** — one uploaded file plus metadata: `id` (UUID, used in routes and the S3 key), `fileName`, `fileSize`
  (bytes declared by the client), `contentType`, `type` (derived from the MIME type), `status`, `s3Key`
  (`reports/{id}/{fileName}`), `createdAt` (intent time; UI "Data de Envio"), `updatedAt`, `deletedAt` (soft delete).
- **ReportStatus** — `PENDING` (intent created, not downloadable) → `AVAILABLE` (confirmed) → `EXPIRED` (abandoned,
  soft-deleted by the cron). `PROCESSING` / `ERROR` are reserved and unused.
- **ReportType** — `pdf | xml | csv | xlsx`.
- **User** — not a model: only the JWT `sub` (`req.user.userId`), never persisted.

Rules:
1. Only pdf/xml/csv/xlsx, 1 B–50 MB — checked in `useUpload.ts` and `upload-intent.dto.ts`; change both together.
2. Only `AVAILABLE` reports download (`422 REPORT_NOT_AVAILABLE`). Download URL lasts 2 min, upload URL 15 min
   (`DOWNLOAD_TTL_SECONDS` / `UPLOAD_TTL_SECONDS`).
3. Confirm only from `PENDING`; a second confirm is `422 INVALID_STATUS_TRANSITION` (deliberate).
4. An hourly cron expires `PENDING` rows older than 20 min — 20–80 min in practice.
5. The list shows every non-deleted report, `PENDING` included, newest first; case-insensitive `fileName` search;
   `pageSize` ≤ 100.
6. Never hard-delete; every query filters `deletedAt: null`.
7. Retrying after an S3 `403` (expired upload URL) creates a new report row.

Not built — don't add as a side effect, raise it: per-user ownership (every user sees every report), login or token
issuing, a delete endpoint, S3 cleanup of expired rows, server-side check that the upload exists.

## Codebase map

Full detail, key decisions and build commands: [docs/ARCHITECTURE-GUIDELINES.md](docs/ARCHITECTURE-GUIDELINES.md).

```
backend/prisma/schema.prisma      data model (no migrations committed yet)
backend/src/main.ts               bootstrap: /api prefix, ValidationPipe; no CORS
backend/src/app.module.ts         root module: Config, Schedule, feature + infra modules
backend/src/reports/              DOMAIN: reports.service.ts (all use cases + errors), cleanup.service.ts (cron),
                                  dto/ (input rules), reports.controller.ts (thin routes)
backend/src/storage/              INFRA: StorageService, the only S3 access (keys, presigned URLs, TTLs)
backend/src/prisma/               INFRA: PrismaService, the only database access
backend/src/auth/                 INFRA: JwtStrategy + JwtAuthGuard; verifies tokens, never issues them;
                                  JWT_SECRET falls back to 'default-secret'
backend/src/app.controller.ts     Nest scaffold, GET /api, unguarded
backend/test/reports.e2e-spec.ts  HTTP e2e with Prisma and S3 mocked
frontend/src/pages/               ReportsPage, the only page (no router)
frontend/src/components/          reports/ (feature) · ui/ (primitives) · layout/ (Header)
frontend/src/hooks/               client logic: useUpload, useDownload, useReports
frontend/src/api/                 one function per endpoint; client.ts = axios '/api' + JWT from localStorage.token
frontend/src/types/report.ts      API contract mirror
frontend/src/utils/format.ts      display formatting
frontend/vite.config.ts           no /api proxy: the dev SPA (:5173) can't reach the API (:3000) without one
.github/workflows/ci.yml          CI gate · .husky/ + lint-staged.config.mjs: pre-commit format and lint
.claude/                          hooks (guard, post-edit), /check, api-contract-reviewer, skills
                                  (skills mirrored in .cursor/ and .windsurf/)
docs/                             full-detail references behind this file
```

Business rules live in services (backend) and hooks (frontend), never in controllers, `api/` or components.

## API ↔ UI contract

Known drift: backend `createdAt` / `fileSize` / UPPERCASE status vs frontend `sentAt` / `sizeInBytes` / lowercase.
Keep both sides consistent or say explicitly that you didn't; `api-contract-reviewer` checks it. Errors are
`throw new XxxException({ error: 'UPPER_SNAKE_CODE' })`; the frontend matches on `error`.

## Naming

Full detail and examples: [docs/NAMING-CONVENTIONS.md](docs/NAMING-CONVENTIONS.md).

- **Backend:** files `kebab-case.<role>.ts` (`upload-intent.dto.ts`); classes PascalCase + role (`ReportsService`,
  `UploadIntentDto`); methods verb + noun (`createUploadIntent`); constants, error codes, env vars UPPER_SNAKE
  (durations end in `_SECONDS`).
- **API:** plural resources, kebab-case actions (`/reports/:id/download-link`), camelCase JSON; lists return
  `{ data, total, page, pageSize }`.
- **Prisma:** singular PascalCase models, camelCase fields, `createdAt` / `updatedAt` / `deletedAt`, enums
  `<Model><Concept>` with UPPERCASE values.
- **Frontend:** components PascalCase `.tsx` with named exports and `<Name>Props`; hooks `useX` returning
  `UseXReturn`; `index.ts` barrels; callbacks `onX`; booleans `isX`; DOM ids kebab-case (`upload-report-btn`).
- **Tests:** `*.spec.ts`, `*.test.ts(x)`, `*.e2e-spec.ts`; `describe` = unit name; `it` in present tense, no
  "should"; mocks `mockX`.
- **Git:** branches `<type>/<kebab-description>` using Conventional Commit types (`feat/`, `fix/`, `hotfix/`,
  `refactor/`, `test/`, `docs/`, `chore/`, `ci/`); commits `type(scope): …`, one logical change each.
- **Deviations** (don't copy, don't rename unasked): lowercase `ReportType` values; `isDownloading` holds an id;
  Portuguese log messages in `CleanupService`.

## Code generation rules

Full detail: [docs/CODE-GENERATION-GUIDELINES.md](docs/CODE-GENERATION-GUIDELINES.md).

- **No `any`** anywhere, tests included: use `unknown` + narrowing, `jest.Mocked` / `vi.mocked`. Tooling doesn't
  enforce it (no `strict`, backend `no-explicit-any` off), so type exported signatures explicitly. No `as`, `!` or
  `@ts-ignore` to silence errors. Existing exception to fix when touched: `useUpload.test.ts:42`.
- **Tests first:** every behaviour change ships unit tests in the same commit; bug fixes start with a failing test.
  Cover the happy path, each error code, boundaries and status transitions. Mock Prisma, S3 and `src/api`; new
  routes get an e2e case. Never delete, skip or weaken a test to pass.
- Put code in its layer; reuse before adding; keep the diff minimal; no new dependency without a stated reason.
- No `console.log`, commented-out code or bare TODOs; comments explain *why*; never swallow errors.
- **Keep the docs current:** in the same commit as any change, update this summary **and** the matching `docs/`
  file (rules, entities, routes, files, commands, env vars, naming); delete entries that stop being true. Document
  only what the code does, and verify it. This file stays about two pages; detail goes in `docs/`.

## Safety

- Never read, print or commit `.env*` files or credentials; document new env vars in the package README.
- Don't hand-edit `package-lock.json`; never edit an applied migration — create a new one.
- Destructive commands and `.env` access are blocked by `.claude/hooks/pre-tool-use.mjs`; ask the user instead of
  working around it.
