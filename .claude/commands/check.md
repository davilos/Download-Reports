---
description: Run the full verification gate (typecheck, lint, tests, build) for backend and/or frontend
argument-hint: "[backend|frontend]  (default: packages changed vs HEAD, or both)"
allowed-tools: Bash(npm:*), Bash(npx:*), Bash(git status:*), Bash(git diff:*)
---

Run the verification gate and report the result. Scope: `$ARGUMENTS`.

1. Decide which packages to check. If `$ARGUMENTS` names `backend` or `frontend`, use that. Otherwise run
   `git status --porcelain` and check every package with changes; if nothing changed, check both.
2. Backend (run inside `backend/`, stop at the first failing step):
   - `npx prisma generate`
   - `npx tsc --noEmit`
   - `npm test`
   - `npx jest --config ./test/jest-e2e.json test/reports.e2e-spec.ts`
   - `npx eslint "{src,test}/**/*.ts"`
   - `npm run build`
3. Frontend (run inside `frontend/`, stop at the first failing step):
   - `npm run lint`
   - `npm run build`
   - `npm test`
4. Report a table: package · step · PASS/FAIL · short evidence (test counts, first error line).
   For a failure, quote the relevant output and name the file:line to look at. Do not fix anything unless
   the user asks — this command only reports.
