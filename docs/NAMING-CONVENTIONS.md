# Naming conventions

Full reference for the naming rules summarized in [AGENTS.md](../AGENTS.md#naming).

Derived from the existing code; follow them for new code. Known deviations are listed at the end — do not copy
them, and do not rename them as a side effect of unrelated work.

## Backend (NestJS)

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

## HTTP API

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| Resource path | plural noun | `/reports` |
| Action sub-path | kebab-case noun or verb after `:id` | `/reports/upload-intent`, `/:id/confirm`, `/:id/download-link` |
| JSON fields, query params | camelCase | `fileSize`, `pageSize`, `uploadUrl`, `downloadUrl` |
| List response | `{ data, total, page, pageSize }` | `GET /reports` |

## Database (Prisma)

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| Model | PascalCase, singular | `Report` |
| Field | camelCase; foreign/external keys end in `Key`/`Id` | `fileName`, `s3Key` |
| Timestamps | `createdAt`, `updatedAt`, `deletedAt` (soft delete) on every model | `Report` |
| Enum | PascalCase, `<Model><Concept>` | `ReportStatus`, `ReportType` |
| Status enum values | UPPER_CASE | `PENDING`, `AVAILABLE` |

## Frontend (React)

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

## Tests

| Element | Convention | Examples |
| ------- | ---------- | -------- |
| File | `<file>.spec.ts` (backend), `<file>.test.ts(x)` (frontend), `<area>.e2e-spec.ts` (backend e2e) | `reports.service.spec.ts`, `useUpload.test.ts` |
| `describe` | the unit under test, by its exact name | `describe('CleanupService')`, `describe('fetchReports')` |
| `it` | present-tense behaviour, no "should" | `it('rejects an expired token')` |
| Mock | `mock<Name>` | `mockFetchReports`, `mockConfirmUpload` |

## Git

**Branches**: `<type>/<short-kebab-description>`, branched off `main` and merged back through a pull request. The
prefix is the Conventional Commit type of the branch's main change, so branch and commits read the same.

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
`fix/issue-12`). One logical change per branch.

**Commits**: Conventional Commits with a scope — `feat(upload): …`, `fix(reports): …`, `chore(test): …`. One
logical change per commit; messages in English.

## Known deviations

Leave as is unless the task is the rename:

- `ReportType` values are lowercase (`pdf`) while `ReportStatus` values are UPPERCASE.
- `isDownloading` in `useDownload` holds the report id (`string | null`), not a boolean.
- `CleanupService` log messages are in Portuguese; other code text is English.
