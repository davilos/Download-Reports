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
- TTLs: upload URL 15 min, download URL 2 min, max size 50 MB — configured by env vars.
- All routes are under the `/api` prefix and guarded by `JwtAuthGuard`.

Decisions are logged in `.specs/STATE.md` (AD-001…). Feature specs live in `.specs/features/<feature>/`
(`spec.md`, `design.md`, `tasks.md`). Read the relevant spec before changing behaviour it covers; record new
architectural decisions in `STATE.md`.

## API ↔ UI contract

The backend `Report` (Prisma: `createdAt`, `fileSize`, UPPERCASE status) and the frontend `Report`
(`frontend/src/types/report.ts`: `sentAt`, `sizeInBytes`, lowercase status) currently **differ**. This is known
drift tracked in `.design/run-end-to-end.md`. Any change touching either side must keep them consistent or
say explicitly that it does not; the `api-contract-reviewer` subagent checks this.

## Conventions

- TypeScript strict everywhere; no `any` in new frontend code.
- Error responses: `throw new XxxException({ error: 'UPPER_SNAKE_CODE' })`. The frontend matches on `error`.
- Tests sit next to the code: `*.spec.ts` (backend, Jest), `*.test.ts(x)` (frontend, Vitest).
  Mock Prisma and S3 in unit tests — never hit real AWS.
- Commits follow Conventional Commits with a scope: `feat(upload): …`, `fix(reports): …`, `chore(test): …`.
  One logical change per commit.
- Specs and decision logs are written in Portuguese; code, identifiers and commit messages in English.

## Safety

- Never read, print or commit `.env` files or credentials. Document new variables in the package README
  (and `.env.example` once it exists).
- Do not hand-edit `package-lock.json`; use `npm install`.
- Never edit an applied migration under `backend/prisma/migrations/`; create a new one.
- Destructive commands (`git reset --hard`, force push, `prisma migrate reset`, `rm -rf` on broad paths) and any
  read or edit of `.env*` files (Read, Grep, or a shell command naming the file) are blocked by
  `.claude/hooks/pre-tool-use.mjs`. Ask the user instead of working around the hook.
