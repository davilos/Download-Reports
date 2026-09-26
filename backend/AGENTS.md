# backend/ — agent rules

NestJS 11 API. Applies to everything under `backend/`. Root rules in [../AGENTS.md](../AGENTS.md) still apply.

## Layout

- `src/<feature>/` — one Nest module per feature: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.
- `src/prisma/` — `PrismaService` (global module). `src/storage/` — `StorageService` (global, wraps S3).
- `src/auth/` — JWT strategy + `JwtAuthGuard`; `req.user.userId` comes from the token `sub`.
- `prisma/schema.prisma` — single source of truth for the data model.

## Rules

- Run `npx prisma generate` after any change to `schema.prisma`; add a migration, never edit an applied one.
- Validate every request body/query with a `class-validator` DTO in `dto/`. The global `ValidationPipe` uses
  `whitelist: true, transform: true`, so undeclared fields are silently dropped.
- Read config through `ConfigService.get(...)`, never `process.env` inside services. Current keys:
  `DATABASE_URL`, `JWT_SECRET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`,
  `UPLOAD_TTL_SECONDS`, `DOWNLOAD_TTL_SECONDS`, `PORT`.
- Only `StorageService` talks to S3. Controllers stay thin; business rules and status transitions live in services.
- Queries that list or fetch reports must filter `deletedAt: null`.
- Errors: Nest HTTP exceptions with `{ error: 'UPPER_SNAKE_CODE' }` bodies.
- Formatting is Prettier (`singleQuote`, `trailingComma: all`); the Claude Code post-edit hook applies it.
- Unit tests (`src/**/*.spec.ts`) mock `PrismaService` and `StorageService` via `Test.createTestingModule`.

## Verify

```bash
npx prisma generate && npx tsc --noEmit && npx eslint "{src,test}/**/*.ts" && npm test \
  && npx jest --config ./test/jest-e2e.json test/reports.e2e-spec.ts && npm run build
```
