---
trigger: always_on
description: "Core architecture principles: layers, S3/DB/config access, soft delete, routes, API contract. Points to docs/ARCHITECTURE-GUIDELINES.md."
---

# Core architecture principles

Full detail: `docs/ARCHITECTURE-GUIDELINES.md`. Read it before adding, moving or removing files, modules or
layers, or before changing routes, configuration, storage, auth or tooling.

- File bytes never pass through the API: the browser PUTs to and GETs from S3 through presigned URLs.
- Business rules and status transitions live in services (backend) and hooks (frontend). Controllers, `src/api/*`
  and components stay thin.
- Only `StorageService` talks to S3, only `PrismaService` talks to the database, and configuration is read only
  through `ConfigService`.
- Deletion is soft (`deletedAt` + `status = EXPIRED`); every query filters `deletedAt: null`. Never hard-delete.
- Routes live under `/api`; report routes sit behind `JwtAuthGuard`. Errors are `throw new XxxException({ error: 'UPPER_SNAKE_CODE' })`.
- Keep the backend `Report` and `frontend/src/types/report.ts` consistent, or say explicitly that you did not.
- When the structure changes, update the codebase map in `AGENTS.md` and in `docs/ARCHITECTURE-GUIDELINES.md` in
  the same commit.
