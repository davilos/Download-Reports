---
trigger: glob
description: "Report domain rules: upload limits, download and confirm rules, expiry, listing, features not built. Points to docs/DOMAIN-GUIDELINES.md."
globs: backend/src/reports/**,backend/src/auth/**,backend/prisma/**,frontend/src/hooks/**,frontend/src/types/**,frontend/src/api/**,frontend/src/components/reports/**
---

# Domain rules

Full detail: `docs/DOMAIN-GUIDELINES.md`. Entities and statuses are summarized in `AGENTS.md`. Read the section
that matches the task:

- Adding or changing an entity, field, enum or migration → `#entities`
- Adding or changing a business rule, status, limit, TTL or the upload/download flow → `#business-rules`
- Naming a domain concept in code or UI copy (upload intent, confirmation, download link) → `#glossary`
- A request touches the not-built list below → `#not-in-the-domain-yet`, then ask the user first

1. Only pdf/xml/csv/xlsx, 1 B–50 MB — checked in `useUpload.ts` and `upload-intent.dto.ts`; change both together.
2. Only `AVAILABLE` reports download (`422 REPORT_NOT_AVAILABLE`). Download URL lasts 2 min, upload URL 15 min
   (`DOWNLOAD_TTL_SECONDS` / `UPLOAD_TTL_SECONDS`).
3. Confirm only from `PENDING`; a second confirm is `422 INVALID_STATUS_TRANSITION` (deliberate).
4. An hourly cron expires `PENDING` rows older than 20 min — 20–80 min in practice.
5. The list shows every non-deleted report, `PENDING` included, newest first; case-insensitive `fileName` search;
   `pageSize` ≤ 100.
6. Retrying after an S3 `403` (expired upload URL) creates a new report row.

Not built — don't add as a side effect, raise it with the user: per-user ownership (every user sees every report),
login or token issuing, a delete endpoint, S3 cleanup of expired rows, server-side check that the upload exists.

When a business rule or entity changes, update this rule and `docs/DOMAIN-GUIDELINES.md` in the same commit, and
the Domain section of `AGENTS.md` when an entity or status changes.
