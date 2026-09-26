# frontend/ — agent rules

React 19 + Vite SPA. Applies to everything under `frontend/`. Root rules in [../AGENTS.md](../AGENTS.md) still apply.

## Layout

- `src/api/` — thin axios wrappers, one function per endpoint, re-exported from `api/index.ts`.
  `client.ts` sets `baseURL: '/api'` and injects the JWT from `localStorage.token`.
- `src/hooks/` — stateful logic (`useReports`, `useUpload`, `useDownload`); components stay presentational.
- `src/components/{reports,ui,layout}/` — each folder has an `index.ts` barrel; import from the barrel.
- `src/types/` — domain types (`report.ts`). Must mirror the backend response shape (see root "API ↔ UI contract").
- `src/pages/` — route-level components.

## Rules

- Components never call `apiClient` directly — go through `src/api/*` and a hook.
- Styling is Tailwind utility classes; primitives come from Radix UI; icons from `lucide-react`.
- Keep upload behaviour aligned with decisions AD-009 (one auto-retry after 3 s) and AD-013 (`File` kept in `useRef`).
- Lint is oxlint (`.oxlintrc.json`), including `react/rules-of-hooks`; the post-edit hook runs it on edited files.
- Tests: `*.test.ts(x)` next to the code, Vitest globals + Testing Library, `jsdom`. Mock `src/api/*` in hook
  and component tests; never make real network calls.

## Verify

```bash
npm run lint && npm run build && npm test
```
