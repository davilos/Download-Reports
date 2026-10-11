# Business domain

Full reference for the domain summarized in [AGENTS.md](../AGENTS.md#domain).

**Central de Relatórios** is a self-service file hub: authenticated users upload report files (the UI frames them
as *documentos fiscais*) and later search, filter and download them. The system **stores** files; it never
generates or parses their contents. User-facing text is Brazilian Portuguese — keep new UI strings in pt-BR.

Why presigned URLs: files up to 50 MB never touch the API, and a stored file can only be read through a link
issued on demand to an authenticated user that expires within minutes.

## Entities

Source of truth: `backend/prisma/schema.prisma`. The frontend `Report` uses the same field names.

**User** — not a model. Represents the authenticated caller, identified only by the JWT `sub`
(`req.user.userId`). Nothing about the user is persisted (no account, subscriber or tenant record).

**Report** (`Report`; UI: "relatório") — represents one file a user uploaded, plus the metadata needed to list it
and to find its object in S3.

| Field | Description |
| ----- | ----------- |
| `id` | UUID. Public identifier in every route, and part of the S3 key. |
| `fileName` | Original file name as sent by the browser. Used in the S3 key, as the download file name, and as the search target. |
| `fileSize` | Size in bytes **declared by the client** at upload intent (1 B–50 MB). Not checked against the stored object. |
| `contentType` | MIME type declared by the client; one of the four allowed types. Signed into the PUT URL. |
| `type` | File format derived from `contentType` on the server. Drives the type filter and the file icon. |
| `status` | Position in the lifecycle — see `ReportStatus`. |
| `s3Key` | `reports/{id}/{fileName}`. Briefly `''` between the two writes in `createUploadIntent`. |
| `createdAt` | When the upload intent was created (not when it was confirmed). UI: "Data de Envio". Sort key; the cron measures age from it. |
| `updatedAt` | Last change, maintained by Prisma. |
| `deletedAt` | Soft-delete marker. `null` = live; set together with `status = EXPIRED`. |

**ReportStatus** (same UPPERCASE values in the frontend):

| Value | Meaning | Set by |
| ----- | ------- | ------ |
| `PENDING` | Upload intent created; bytes not confirmed yet. Listed but not downloadable. | `POST /upload-intent` |
| `AVAILABLE` | Upload confirmed; downloadable. | `PATCH /:id/confirm` |
| `EXPIRED` | Abandoned `PENDING` upload, soft-deleted; hidden everywhere. | Cleanup cron |
| `PROCESSING` | Reserved; nothing sets it. | — |
| `ERROR` | Reserved; nothing sets it. | — |

**ReportType**: `pdf` (`application/pdf`), `xml` (`application/xml`), `csv` (`text/csv`), `xlsx`
(`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

## Glossary

| Term | Meaning | Code / UI |
| ---- | ------- | --------- |
| Upload intent | Reserves a `PENDING` row and returns a presigned PUT URL before any byte is sent. | `POST /upload-intent` |
| Confirmation | The client's claim that the PUT finished; makes the report downloadable. | `PATCH /:id/confirm` |
| Download link | Presigned GET URL generated per click (2 min); never stored or listed. | `downloadUrl`; "Baixar" |

## Business rules

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

## Not in the domain yet

Agents tend to assume these exist. They don't — do not add them as a side effect of other work; raise them:

- **Ownership / multi-tenancy.** The JWT `sub` reaches `createUploadIntent` as `_userId` but is not stored.
  Every authenticated user sees and downloads every report.
- **Login.** No sign-in UI or token issuance; the frontend reads a pre-existing JWT from `localStorage.token`.
- **Deleting reports.** No delete endpoint; only the cron expires rows.
- **Storage cleanup.** Expiring a row does not delete its S3 object, so abandoned uploads can leave orphans.
- **Upload verification.** Confirm trusts the client; it does not check that the S3 object exists.
