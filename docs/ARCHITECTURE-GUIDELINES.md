# Architecture

Full reference for the architecture and codebase map summarized in [AGENTS.md](../AGENTS.md#codebase-map).

## Key decisions

- Report lifecycle (`ReportStatus`): `PENDING` → `AVAILABLE` (on confirm) → `EXPIRED` (soft delete).
  `PROCESSING` / `ERROR` are reserved. See [DOMAIN-GUIDELINES.md](DOMAIN-GUIDELINES.md).
- Deletion is **soft**: set `deletedAt` + `status = EXPIRED`. Never hard-delete rows.
- A cron job (`backend/src/reports/cleanup.service.ts`) expires `PENDING` rows older than 20 min.
- S3 key format: `reports/{reportId}/{originalFileName}`.
- TTLs: upload URL 15 min, download URL 2 min — configured by `UPLOAD_TTL_SECONDS` / `DOWNLOAD_TTL_SECONDS`.
  The 50 MB max size is hardcoded (`52_428_800`) in the upload DTO and in `useUpload`.
- All routes are under the `/api` prefix. The reports routes are guarded by `JwtAuthGuard` (class-level on the
  controller); the scaffold `GET /api` in `app.controller.ts` is **not** guarded.

Decisions are logged in `.specs/STATE.md` (AD-001…). Feature specs live in `.specs/features/<feature>/`
(`spec.md`, `design.md`, `tasks.md`). `.specs/` is gitignored, so it exists only in local checkouts. Read the
relevant spec before changing behaviour it covers; record new architectural decisions in `STATE.md`.

`tlc-spec-lean` verification profile (declared in [AGENTS.md](../AGENTS.md#tlc-spec-lean)): `standard` by default,
so the Verifier recomputes `Coverage`, judges `Test policy` rows and injects faults; `ui` when the feature changes
what `frontend/src/pages/` or `frontend/src/components/` render, which adds the comparison against binding design
sources and the per-screen check of copy and arrangement. The profile is pinned on the `Profile:` line of the
feature's `checks.md`, and `validate_verification.py` rejects a report that declares a different one.

## Codebase map

Where each responsibility lives, by layer. Put new code in the layer that owns the concern: business rules and
status transitions go in services (backend) or hooks (frontend), never in controllers, `src/api/*` or components.

### Backend: domain and application (`backend/src/reports/`)

| Path | Responsibility |
| ---- | -------------- |
| `reports.service.ts` | All report use cases: upload intent, confirm (`PENDING → AVAILABLE`), download link, listing/filters, MIME → `ReportType` mapping. Throws the domain errors. |
| `cleanup.service.ts` | Hourly cron that expires abandoned uploads (`PENDING → EXPIRED` + `deletedAt`). |
| `dto/upload-intent.dto.ts` | Upload input rules: allowed MIME types (`ALLOWED_CONTENT_TYPES`), size 1 B–50 MB. |
| `dto/reports-filters.dto.ts` | List query rules: `search`, `type`, `page`, `pageSize` (≤ 100). |
| `reports.module.ts` | Wires the controller, `ReportsService` and `CleanupService`. |

### Backend: interface (HTTP)

| Path | Responsibility |
| ---- | -------------- |
| `backend/src/reports/reports.controller.ts` | The four `/reports` routes; thin, delegates to `ReportsService`. |
| `backend/src/main.ts` | Bootstrap: global `api` prefix, `ValidationPipe({ whitelist, transform })`, `PORT`. CORS is not enabled. |
| `backend/src/app.module.ts` | Root module: `ConfigModule` (global), `ScheduleModule`, and the feature/infra modules. |
| `backend/src/app.controller.ts`, `app.service.ts` | Nest scaffold (`GET /api` → hello). Not part of the domain. |

### Backend: infrastructure

| Path | Responsibility |
| ---- | -------------- |
| `backend/prisma/schema.prisma` | Data model and indexes (PostgreSQL). Migrations go in `backend/prisma/migrations/` (none committed yet). |
| `backend/src/prisma/` | `PrismaService` (connect/disconnect lifecycle) in a `@Global()` module. The only database access point. |
| `backend/src/storage/` | `StorageService` in a `@Global()` module: S3 client, key format, presigned PUT/GET, TTLs. The only S3 access point. |
| `backend/src/auth/` | `JwtStrategy` (Bearer token, `sub` → `req.user.userId`), `JwtAuthGuard`, `AuthModule`. Verifies tokens only; nothing issues them. `JWT_SECRET` falls back to `'default-secret'` when unset. |
| `ConfigService` (`@nestjs/config`) | All configuration. Env keys are listed in [backend/AGENTS.md](../backend/AGENTS.md) and the root README. |

### Frontend (`frontend/src/`)

| Path | Responsibility |
| ---- | -------------- |
| `main.tsx`, `App.tsx` | Entry point; renders `ReportsPage` (single page, no router). |
| `pages/ReportsPage.tsx` | Composes header, filters, table, pagination, upload button and error states. |
| `components/reports/` | Feature components: `ReportsTable`, `SearchFilterBar` (300 ms debounce), `Pagination`, `UploadButton`. |
| `components/ui/`, `components/layout/` | Presentational primitives (`Badge`, `StatusDot`, `FileTypeIcon`, `EmptyState`, `TableSkeleton`) and `Header`. |
| `hooks/` | Client-side application logic: `useUpload` (validation, PUT with progress, auto-retry, `ttl-expired`), `useDownload` (link on click, `<a download>`), `useReports` (filters, pagination, refetch). |
| `api/` | HTTP adapters, one function per endpoint. `client.ts`: axios with `baseURL: '/api'`, 30 s timeout, JWT from `localStorage.token`. `upload.ts` uses raw axios for the S3 PUT. |
| `types/report.ts` | Frontend mirror of the API contract (see below). |
| `utils/format.ts` | Display formatting: file size, dates (absolute/relative), type colours, status labels. |
| `index.css`, `../tailwind.config.js`, `../postcss.config.js` | Styling and design tokens. |
| `../vite.config.ts` | Build and dev server. There is **no `/api` proxy**, so in dev the SPA (`:5173`) cannot reach the API (`:3000`) without one. |

### Tests

| Path | Responsibility |
| ---- | -------------- |
| `backend/src/**/*.spec.ts` | Unit tests (Jest); `PrismaService` and `StorageService` mocked. |
| `backend/test/reports.e2e-spec.ts` | HTTP e2e via supertest: real guard, JWT strategy and `ValidationPipe`; Prisma and S3 mocked. Config: `test/jest-e2e.json`. |
| `backend/test/app.e2e-spec.ts` | Scaffold e2e; needs a real database (known baseline failure). |
| `frontend/src/**/*.test.ts(x)` | Vitest + Testing Library (jsdom); setup in `src/test/setup.ts`, config in `frontend/vitest.config.ts`. |

### Tooling, CI, agent harness and docs

| Path | Responsibility |
| ---- | -------------- |
| `.github/workflows/ci.yml` | CI per package: typecheck, lint, unit + e2e tests, build (Node 22). |
| `package.json`, `.husky/pre-commit`, `lint-staged.config.mjs` | Root git hooks only: Prettier on staged backend files, oxlint on staged frontend files. |
| `backend/eslint.config.mjs`, `backend/.prettierrc`, `frontend/.oxlintrc.json` | Lint and format rules. |
| `.claude/settings.json`, `.claude/hooks/` | `pre-tool-use.mjs` blocks destructive commands and `.env` access; `post-edit.mjs` formats/lints edited files. |
| `.claude/commands/check.md`, `.claude/agents/api-contract-reviewer.md` | The `/check` gate and the contract-review subagent. |
| `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/` | Workflow skills (tlc-*, the-judge, harness-eval), mirrored per tool. |
| `.claude/rules/*.md`, `.cursor/rules/*.mdc`, `.windsurf/rules/*.md` | Short rules that point agents to the `docs/` guidelines: `core-architecture-principles` and `code-generation-rules` always apply; `domain-rules` and `naming-conventions` load only for matching paths. Same body in each tool; only the frontmatter differs. Edit all three together. |
| `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md` | Agent rules; the `CLAUDE.md` files import them. |
| `docs/` | Full-detail references behind `AGENTS.md`: domain, architecture, naming, code generation. |

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

`/check` runs the full gate. A change is not done until the gate passes for every package touched. Known baseline
failure (do not "fix" it as a side effect of unrelated work): `backend/test/app.e2e-spec.ts` needs a real
`DATABASE_URL`.

## API ↔ UI contract

The backend `Report` (Prisma: `createdAt`, `fileSize`, UPPERCASE status) and the frontend `Report`
(`frontend/src/types/report.ts`: `sentAt`, `sizeInBytes`, lowercase status) currently **differ**. This is known
drift tracked in `.design/run-end-to-end.md` (local, gitignored). Any change touching either side must keep them
consistent or say explicitly that it does not; the `api-contract-reviewer` subagent checks this.

Error responses: `throw new XxxException({ error: 'UPPER_SNAKE_CODE' })`. The frontend matches on `error`.
