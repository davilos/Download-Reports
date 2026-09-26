# download-reports

Upload, list and download report files (PDF, XML, CSV, XLSX) through S3 presigned URLs. The API issues
short-lived URLs; the browser transfers the bytes straight to and from S3.

| Package | Stack | Docs |
| ------- | ----- | ---- |
| [`backend/`](backend/) | NestJS 11 · Prisma 5 + PostgreSQL · AWS S3 · JWT | [backend/AGENTS.md](backend/AGENTS.md) |
| [`frontend/`](frontend/) | React 19 · Vite · Tailwind · Radix UI | [frontend/AGENTS.md](frontend/AGENTS.md) |

## Getting started

Requirements: Node.js 22, PostgreSQL, and an S3 bucket (or an S3-compatible local service).

```bash
npm install                      # repo root: installs the git pre-commit hook (husky + lint-staged)

cd backend
npm install
npx prisma generate
npm run start:dev                # http://localhost:3000/api

cd ../frontend
npm install
npm run dev                      # http://localhost:5173
```

The backend reads `DATABASE_URL`, `JWT_SECRET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`S3_BUCKET_NAME`, `UPLOAD_TTL_SECONDS`, `DOWNLOAD_TTL_SECONDS` and `PORT` from `backend/.env`.

## API

All routes require `Authorization: Bearer <jwt>` and live under `/api`.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `POST` | `/reports/upload-intent` | Create a `PENDING` report and return a presigned PUT URL |
| `PATCH` | `/reports/:id/confirm` | Mark the upload as `AVAILABLE` |
| `GET` | `/reports` | Paginated, filterable list |
| `GET` | `/reports/:id/download-link` | Presigned GET URL (2 min TTL) |

## Quality gates

- **CI** (`.github/workflows/ci.yml`): typecheck, lint, unit + e2e tests and build for both packages.
- **Pre-commit**: Prettier on staged backend files, oxlint on staged frontend files.
- **AI agents**: project rules in [AGENTS.md](AGENTS.md); Claude Code hooks, commands and subagents in `.claude/`.

Specs and architectural decisions: [`.specs/`](.specs/) (`STATE.md` holds the decision log).
