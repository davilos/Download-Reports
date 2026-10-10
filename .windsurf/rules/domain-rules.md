---
trigger: glob
description: "Report domain rules: statuses, upload limits, download and confirm rules, features not built. Points to docs/DOMAIN-GUIDELINES.md."
globs: backend/src/reports/**,backend/prisma/**,frontend/src/hooks/**,frontend/src/types/**,frontend/src/api/**,frontend/src/components/reports/**
---

# Domain rules

Full detail: `docs/DOMAIN-GUIDELINES.md`. Read it before changing report behaviour, the schema, statuses, limits
or the upload and download flows.

- `ReportStatus`: `PENDING` → `AVAILABLE` (confirm) → `EXPIRED` (cron, soft delete). `PROCESSING` / `ERROR` are
  reserved and unused.
- Accepted files: pdf, xml, csv, xlsx, 1 B–50 MB. The limit is checked in both `useUpload.ts` and
  `upload-intent.dto.ts`; change both together.
- Only `AVAILABLE` reports can be downloaded. Confirm is allowed only from `PENDING`; a second confirm is a
  deliberate `422 INVALID_STATUS_TRANSITION`.
- There is no per-user ownership, login, delete endpoint or S3 cleanup. Do not add them as a side effect; raise
  them with the user.
- When a business rule or entity changes, update `AGENTS.md` and `docs/DOMAIN-GUIDELINES.md` in the same commit.
