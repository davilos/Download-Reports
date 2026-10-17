# Download Report Files

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

### Library docs (Context7)

AI agents query the [Context7](https://context7.com) MCP server for current, version-matched library docs (see
`.claude/rules/library-docs-rules.md`). It runs remotely at `https://mcp.context7.com/mcp`; nothing to install.

- **Claude Code**: `.mcp.json` registers it for the project and `.claude/settings.json` approves it.
- **Cursor**: `.cursor/mcp.json`; enable it under Settings › MCP if Cursor asks.
- **Windsurf**: no project-level MCP config. Add a `context7` server with `"serverUrl": "https://mcp.context7.com/mcp"`
  to your user `mcp_config.json` ([Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp)).

It works without an API key, at a lower rate limit. With a free key from
[context7.com/dashboard](https://context7.com/dashboard), add it to your user scope only, never to the repo:

```bash
claude mcp add --scope user --transport http --header "Authorization: Bearer <key>" \
  context7 https://mcp.context7.com/mcp
```

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
- **AI agents**: project summary in [AGENTS.md](AGENTS.md); rules in `.claude/rules/` (mirrored in `.cursor/` and
  `.windsurf/`); Claude Code hooks, commands and subagents in `.claude/`; MCP servers in `.mcp.json` and
  `.cursor/mcp.json`.

Specs and architectural decisions: [`.specs/`](.specs/) (`STATE.md` holds the decision log).
