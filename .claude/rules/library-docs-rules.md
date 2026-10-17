---
description: "Library documentation: consult the Context7 MCP for current, version-matched docs before writing setup, configuration or library code. Setup in README.md."
---

# Library docs rules

Model knowledge of libraries goes stale. The Context7 MCP server (`context7`, configured in `.mcp.json` and
`.cursor/mcp.json`; setup in `README.md#library-docs-context7`) serves current documentation. Consult it before you:

- Write or change setup or configuration: `package.json` scripts, `vite.config.ts`, `vitest.config.ts`,
  `tailwind.config.js`, `tsconfig*.json`, `nest-cli.json`, `eslint.config.mjs`, `.oxlintrc.json`, `schema.prisma`.
- Use a library API the repo does not use yet, or use a familiar one in a new way: NestJS modules and decorators,
  Prisma queries, AWS SDK v3, passport-jwt, class-validator, React 19, Radix UI, axios, Vitest, Jest.
- Add or upgrade a dependency, or diagnose an error raised by a library.

How:

1. Read the installed version from the package's own `package.json`; the packages differ (TypeScript 5 in
   `backend/`, 6 in `frontend/`).
2. Call `resolve-library-id`, then `query-docs` with that id and a query that names the version (`Prisma 5`,
   `Tailwind CSS 3`). Docs for a newer major do not apply here.
3. The repo comes first: existing code and conventions, then `docs/`, then Context7, then official docs through web
   search. If none confirms an API, option or command, say so instead of guessing.

- If the `context7` tools are not available in the session, say so and fall back to the official docs.
- Queries leave the machine: never put secrets, `.env` values or large chunks of project code in them.
