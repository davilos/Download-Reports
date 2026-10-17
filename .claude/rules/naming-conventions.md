---
description: "Naming conventions for backend, API, Prisma, frontend and tests, plus known deviations. Points to docs/NAMING-CONVENTIONS.md."
paths:
  - "backend/**/*.ts"
  - "backend/prisma/schema.prisma"
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
---

# Naming conventions

Full detail and examples: `docs/NAMING-CONVENTIONS.md`. Branch and commit names are in `code-generation-rules`.
Read the section that matches the task:

- Naming a backend file, module, class, method, constant, error code or env var → `#backend-nestjs`
- Naming a route, query parameter or JSON field → `#http-api`
- Naming a Prisma model, field, enum or index → `#database-prisma`
- Naming a component, prop, hook, callback, boolean or DOM id → `#frontend-react`
- Naming a test file, `describe` / `it` block or mock → `#tests`
- About to copy an existing name that breaks these patterns → `#known-deviations`

- Backend: files `kebab-case.<role>.ts` (`upload-intent.dto.ts`); classes PascalCase + role (`ReportsService`,
  `UploadIntentDto`); methods verb + noun (`createUploadIntent`); constants, error codes, env vars UPPER_SNAKE
  (durations end in `_SECONDS`).
- API: plural resources, kebab-case actions (`/reports/:id/download-link`), camelCase JSON; lists return
  `{ data, total, page, pageSize }`.
- Prisma: singular PascalCase models, camelCase fields, `createdAt` / `updatedAt` / `deletedAt`, enums
  `<Model><Concept>` with UPPERCASE values.
- Frontend: components PascalCase `.tsx` with named exports and `<Name>Props`; hooks `useX` returning
  `UseXReturn`; `index.ts` barrels; callbacks `onX`; booleans `isX`; DOM ids kebab-case (`upload-report-btn`).
- Tests: `*.spec.ts`, `*.test.ts(x)`, `*.e2e-spec.ts`; `describe` = unit name; `it` in present tense, no
  "should"; mocks `mockX`.
- Deviations (don't copy, don't rename unasked): lowercase `ReportType` values; `isDownloading` holds an id;
  Portuguese log messages in `CleanupService`.
