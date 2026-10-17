---
trigger: always_on
description: "General rules: use the Context7 MCP for library docs without being asked; keep implementation plans pragmatic, end them with build, lint and e2e steps, cover important paths with e2e tests; create and run migrations only through the Prisma CLI."
---

# General rules

## Library documentation: Context7

- Use the Context7 MCP on your own initiative, without waiting to be asked, whenever a task needs code generation,
  setup or configuration steps, or library or API documentation.
- Resolve the library ID first (`resolve-library-id`), then fetch its docs (`get-library-docs`; `query-docs` in
  newer servers). Ask for the version the package pins in its `package.json`.
- Prefer what Context7 returns over memory for library APIs. If it has no entry for the library, say so before
  relying on memory.

## Implementation plans

- Plan high-quality, maintainable code and avoid overengineering: the simplest change that meets the requirement.
- Be pragmatic: follow `AGENTS.md` and the `docs/` guidelines first. Apply an industry standard only where they are
  silent and it fits this codebase, never against them.
- Every plan ends with build, lint and e2e steps for each package it touches, run inside the package:
  - backend: `npm run build`, `npm run lint`, `npm run test:e2e`
  - frontend: `npm run build`, `npm run lint`, `npm run test:e2e` (Playwright; see below)

## Implementation and testing

- **Always** plan e2e tests for the important paths. Backend: add cases to `backend/test/reports.e2e-spec.ts` (real
  guard and `ValidationPipe`, Prisma and S3 mocked). Frontend: real-browser e2e tests with Playwright for the
  important user flows. The frontend has no Playwright suite yet: the first plan that needs one sets it up as its own
  step (`@playwright/test`, an `npm run test:e2e` script, CI) and documents it in `AGENTS.md` and `docs/`.
- Every plan includes a test suite that covers the happy paths and the edge cases: each error code, boundaries,
  status transitions, empty and invalid input.
- Write high-quality tests that give confidence: assert observable behaviour, not implementation details, and cover
  most of the implementation.

## Database entities and migrations

- Never write a migration by hand: from `backend/`, create and apply it with
  `npx prisma migrate dev --name <description>`. Always pass `--name`; without it the command prompts and fails in a
  non-interactive shell. If it asks to reset the database, stop and ask the user.
