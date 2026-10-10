---
description: "Code generation rules: no any, tests first, structure, output hygiene, docs kept current. Points to docs/CODE-GENERATION-GUIDELINES.md."
---

# Code generation rules

Full detail: `docs/CODE-GENERATION-GUIDELINES.md`. Read it before writing or changing code or tests.

- No `any`, in source or tests. Use precise types or `unknown` plus narrowing. No `as`, `!` or `@ts-ignore` to
  silence the compiler.
- Tests first: every behaviour change ships unit tests in the same commit; a bug fix starts with a failing test.
  Mock Prisma, S3 and `src/api`. Never delete, skip or weaken a test to make a change pass.
- Put code in the layer that owns it, reuse before adding, keep the diff minimal, and add no dependency without a
  stated reason.
- No `console.log`, commented-out code or bare TODOs. Comments explain why. Never swallow errors.
- Run `/check` before calling the work done.
- Update `AGENTS.md` and the matching `docs/` file in the same commit as the change.
