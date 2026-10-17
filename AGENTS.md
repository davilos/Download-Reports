# AGENTS.md

Project summary for AI coding agents: what the system is, its stack, entities and structure. The rules agents
follow live in the rule files listed under [Rules](#rules); full detail lives in [`docs/`](docs/), read on demand.
Package notes: [backend/AGENTS.md](backend/AGENTS.md), [frontend/AGENTS.md](frontend/AGENTS.md).

## Read before you change

| Change | Read |
| ------ | ---- |
| New entity / field / migration | [Domain › Entities](docs/DOMAIN-GUIDELINES.md#entities), [Naming › Database](docs/NAMING-CONVENTIONS.md#database-prisma) |
| New business rule / status / limit | [Domain › Business rules](docs/DOMAIN-GUIDELINES.md#business-rules), [Architecture › Key decisions](docs/ARCHITECTURE-GUIDELINES.md#key-decisions) |
| New route / controller / DTO / error code | [Architecture › API ↔ UI contract](docs/ARCHITECTURE-GUIDELINES.md#api--ui-contract), [Naming › HTTP API](docs/NAMING-CONVENTIONS.md#http-api) |
| New module / service | [Architecture › Codebase map](docs/ARCHITECTURE-GUIDELINES.md#codebase-map), [Naming › Backend](docs/NAMING-CONVENTIONS.md#backend-nestjs) |
| New S3 / database / auth / env var use | [Architecture › Backend: infrastructure](docs/ARCHITECTURE-GUIDELINES.md#backend-infrastructure) |
| New page / component / hook | [Architecture › Frontend](docs/ARCHITECTURE-GUIDELINES.md#frontend-frontendsrc), [Naming › Frontend](docs/NAMING-CONVENTIONS.md#frontend-react) |
| New frontend API call / type | [Architecture › API ↔ UI contract](docs/ARCHITECTURE-GUIDELINES.md#api--ui-contract) |
| New test | [Code generation › Tests first](docs/CODE-GENERATION-GUIDELINES.md#tests-first), [Naming › Tests](docs/NAMING-CONVENTIONS.md#tests) |
| New command / CI step / hook / skill | [Architecture › Tooling](docs/ARCHITECTURE-GUIDELINES.md#tooling-ci-agent-harness-and-docs) |
| Setup / config / library API / new dependency | Context7, as `library-docs-rules` says, with the version from the package's `package.json` |
| A "Not built" feature | [Domain › Not in the domain yet](docs/DOMAIN-GUIDELINES.md#not-in-the-domain-yet) — ask the user first |
| Any change, before committing | [Code generation › Keep the docs current](docs/CODE-GENERATION-GUIDELINES.md#keep-the-docs-current) |

## Overview

**Central de Relatórios**: users upload, search and download report files (the UI calls them *documentos fiscais*)
through S3 presigned URLs. The system stores files, never generates or parses them. UI text is pt-BR; code,
identifiers and commits are English.

Flow: `POST /api/reports/upload-intent` → browser `PUT` to S3 → `PATCH /api/reports/:id/confirm` →
`GET /api/reports` → `GET /api/reports/:id/download-link`.

Stack: `backend/` NestJS 11, Prisma 5 + PostgreSQL, AWS SDK v3, passport-jwt, Jest · `frontend/` React 19, Vite 8,
TypeScript 6, Tailwind 3, Radix UI, axios, Vitest, oxlint. No root workspace: run commands inside each package.
`/check` runs the gate (typecheck, lint, tests, build). Known failure: `backend/test/app.e2e-spec.ts` needs a real
database. Decisions and specs: `.specs/` (local, gitignored) — read the relevant spec before changing behaviour it
covers.

## Domain

- **Report** — one uploaded file plus metadata: `id` (UUID, used in routes and the S3 key), `fileName`, `fileSize`
  (bytes declared by the client), `contentType`, `type` (derived from the MIME type), `status`, `s3Key`
  (`reports/{id}/{fileName}`), `createdAt` (intent time; UI "Data de Envio"), `updatedAt`, `deletedAt` (soft delete).
- **ReportStatus** — `PENDING` (intent created, not downloadable) → `AVAILABLE` (confirmed) → `EXPIRED` (abandoned,
  soft-deleted by the cron). `PROCESSING` / `ERROR` are reserved and unused.
- **ReportType** — `pdf | xml | csv | xlsx`.
- **User** — not a model: only the JWT `sub` (`req.user.userId`), never persisted.

## Codebase map

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
.claude/                          hooks (guard, post-edit), /check, api-contract-reviewer, skills, rules
                                  (skills and rules mirrored in .cursor/ and .windsurf/)
.mcp.json, .cursor/mcp.json       project MCP servers: context7 (current library docs)
docs/                             full-detail references behind this file and the rules
PRODUCT.md, DESIGN.md, .impeccable/  design context: product truth, visual system + design.json, surface briefs
```

## Rules

In `.claude/rules/`, with the same body in `.cursor/rules/*.mdc` and `.windsurf/rules/*.md`. Each rule says what to
read for each kind of task.

| Rule | Loads | Covers | Full detail |
| ---- | ----- | ------ | ----------- |
| `code-generation-rules` | always | types, tests first, layering, output hygiene, `/check`, git, keeping docs current | [CODE-GENERATION](docs/CODE-GENERATION-GUIDELINES.md) |
| `core-architecture-principles` | always | presigned URLs, layers, S3 / database / config access, soft delete, routes and errors, API contract | [ARCHITECTURE](docs/ARCHITECTURE-GUIDELINES.md) |
| `domain-rules` | `backend/src/{reports,auth}`, `backend/prisma`, frontend `hooks`, `types`, `api`, `components/reports` | upload limits, download and confirm, expiry cron, listing, features not built | [DOMAIN](docs/DOMAIN-GUIDELINES.md) |
| `naming-conventions` | backend and frontend source | backend, API, Prisma, frontend and test names; known deviations | [NAMING](docs/NAMING-CONVENTIONS.md) |
| `library-docs-rules` | always | when and how to query Context7 for version-matched library docs; fallback | [README › Context7](README.md#library-docs-context7) |

## tlc-spec-lean

profile: standard

Use `ui` instead when the feature changes what `frontend/src/pages/` or `frontend/src/components/` render. Write
the chosen profile on the `Profile:` line of `checks.md`; the Verifier and `validate_verification.py` follow it.

## Safety

- Never read, print or commit `.env*` files or credentials; document new env vars in the package README.
- Don't hand-edit `package-lock.json`; never edit an applied migration — create a new one.
- Destructive commands and `.env` access are blocked by `.claude/hooks/pre-tool-use.mjs`; ask the user instead of
  working around it.
