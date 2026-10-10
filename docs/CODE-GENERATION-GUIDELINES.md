# Code generation rules

Full reference for the rules summarized in [AGENTS.md](../AGENTS.md#code-generation-rules). They apply to any code
an agent writes or changes. Package-specific rules in [backend/AGENTS.md](../backend/AGENTS.md) and
[frontend/AGENTS.md](../frontend/AGENTS.md) still apply.

## Types

- **No `any`**, in either package, in source or tests. Use precise types, generics, or `unknown` plus narrowing
  for untrusted data. In tests, type mocks with `jest.Mocked<T>` / `vi.mocked(...)` instead of `as any`.
  One existing exception, `frontend/src/hooks/useUpload.test.ts:42`, is not a precedent; fix it when you touch
  that test.
- The tooling does **not** enforce this: neither tsconfig sets `strict: true`, the backend has
  `noImplicitAny: false` and ESLint turns `@typescript-eslint/no-explicit-any` off. Annotate parameters and
  return types of exported functions explicitly so an implicit `any` cannot slip in.
- Do not silence the compiler with `as` casts, `!` non-null assertions or `@ts-ignore`; narrow the value instead.
  Allowed only at a library or DOM boundary, with the reason in a comment.
- Reuse the domain types: backend enums from `@prisma/client` (`ReportStatus.PENDING`, never `'PENDING'`),
  frontend types from `src/types`. Do not redeclare them locally.

## Tests first

- **Every behaviour you add or change ships with unit tests in the same commit.** Prioritize the unit test over
  any other output; a change without tests is not done.
- Fixing a bug: write a failing test that reproduces it first, then fix.
- Cover the happy path, every error code the code can throw, boundary values (e.g. `52_428_800` and
  `52_428_801` bytes) and every status transition touched.
- Backend: mock `PrismaService` and `StorageService` with `Test.createTestingModule`. A new or changed route also
  gets a case in `backend/test/reports.e2e-spec.ts`.
- Frontend: hook and component tests mock `src/api/*`; API tests mock axios. No real network, AWS or database.
- Tests sit next to the code (`*.spec.ts` backend, `*.test.ts(x)` frontend).
- Never delete, skip or weaken an existing test to make a change pass. No `.only` / `.skip` in commits.
- Run `/check` before calling the work done.

## Structure

- Put code in the layer that owns it (see the codebase map in [ARCHITECTURE-GUIDELINES.md](ARCHITECTURE-GUIDELINES.md#codebase-map)).
  Business rules go in services and hooks, not in controllers, `src/api/*` or components.
- Reuse before adding: check `utils/format.ts`, `components/ui/` and the existing hooks and services first.
- Keep the diff minimal: no reformatting, renaming or refactoring of code the task does not need.
- No new dependency unless the task needs it; say why in the commit body, and install with `npm install` inside
  the package.

## Output hygiene

- No `console.log` or `debugger` in source. The backend logs through Nest `Logger`.
- No commented-out code, placeholder implementations or `TODO`s without an owner and reason.
- Comments explain *why*, never restate *what* the code does (see the `SPEC_DEVIATION` note in
  `reports.service.ts` for the expected style).
- Never swallow errors. The backend throws an HTTP exception with an `error` code; the frontend shows a pt-BR
  message to the user.

## Keep the docs current

**Always update the docs when you make a change**, in the same commit as the code: the summary in `AGENTS.md`
**and** the matching file in `docs/`. A change whose docs are stale is not done.

| You changed… | Update |
| ------------ | ------ |
| A behaviour, limit, TTL or status transition | Business rules in `AGENTS.md` and `docs/DOMAIN-GUIDELINES.md`; key decisions in `docs/ARCHITECTURE-GUIDELINES.md` if listed |
| The Prisma schema or an enum | Domain in `AGENTS.md`, entities in `docs/DOMAIN-GUIDELINES.md`; `docs/NAMING-CONVENTIONS.md` if it adds a pattern |
| A route, request/response field or error code | Flow in `AGENTS.md`, API ↔ UI contract, business rules |
| A file, module, folder or layer (added, moved, removed) | Codebase map in `AGENTS.md` and `docs/ARCHITECTURE-GUIDELINES.md` |
| A command, script, tool, hook or CI step | Build & test commands and the tooling table in `docs/ARCHITECTURE-GUIDELINES.md` |
| An env var or config key | `docs/ARCHITECTURE-GUIDELINES.md`, the package `AGENTS.md` config list, and the README |
| A naming pattern | Naming in `AGENTS.md` and `docs/NAMING-CONVENTIONS.md` |
| Something listed as missing, a deviation, a gap or a known issue (e.g. you fixed it) | Remove or reword that entry everywhere it appears |
| Something only one package cares about | That package's `AGENTS.md` (`backend/` or `frontend/`) |

- Document what the code **does**, not what it should do. Check every path, name and value you write.
- Edit the existing entry instead of appending a near-duplicate; delete entries that are no longer true.
- `AGENTS.md` stays a short summary (about two pages); full detail belongs in `docs/`.
- If a change needs no doc update, say so explicitly in the commit body or PR description.
