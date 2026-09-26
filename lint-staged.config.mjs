// Pre-commit checks on staged files only. Each package keeps its own toolchain, so run its local binaries.
const quote = (files) => files.map((f) => `"${f}"`).join(' ');

export default {
  'backend/{src,test}/**/*.ts': (files) =>
    `npm --prefix backend exec -- prettier --write ${quote(files)}`,
  'frontend/src/**/*.{ts,tsx}': (files) =>
    `npm --prefix frontend exec -- oxlint -c frontend/.oxlintrc.json ${quote(files)}`,
};
