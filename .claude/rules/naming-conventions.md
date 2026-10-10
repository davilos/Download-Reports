---
description: "Naming conventions for backend, API, Prisma, frontend, tests and branches. Points to docs/NAMING-CONVENTIONS.md."
paths:
  - "backend/**/*.ts"
  - "backend/prisma/schema.prisma"
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
---

# Naming conventions

Full detail and examples: `docs/NAMING-CONVENTIONS.md`. Read it before naming a new file, class, function,
route, field, test or branch.

- Backend: `kebab-case.<role>.ts` files, PascalCase classes with a role suffix (`ReportsService`,
  `UploadIntentDto`), and UPPER_SNAKE constants, error codes and env vars.
- API: plural resources, kebab-case actions, camelCase JSON.
- Frontend: PascalCase `.tsx` components with named exports and `<Name>Props`; `useX` hooks returning
  `UseXReturn`; `onX` callbacks; `isX` booleans.
- Tests: `describe` uses the unit's exact name; `it` is present tense, without "should".
- Branches: `<type>/<kebab-description>` with Conventional Commit types (`feat/`, `fix/`, `docs/`, `chore/`…).
- Do not copy the known deviations listed in the doc, and do not rename them unless that is the task.
