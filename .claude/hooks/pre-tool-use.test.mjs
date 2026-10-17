// Run from the repo root with: node --test ".claude/hooks/*.test.mjs"
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pre-tool-use.mjs');
const projectDir = mkdtempSync(path.join(tmpdir(), 'hook-'));
const appliedMigration = 'backend/prisma/migrations/20260101000000_init/migration.sql';
mkdirSync(path.join(projectDir, path.dirname(appliedMigration)), { recursive: true });
writeFileSync(path.join(projectDir, appliedMigration), 'CREATE TABLE "Report" ();');

function decisionFor(tool, input) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_name: tool, tool_input: input, cwd: projectDir }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput.permissionDecision : 'allow';
}

describe('pre-tool-use migrations guard', () => {
  test('denies writing a new migration file', () => {
    const file = 'backend/prisma/migrations/20261017000000_add_tag/migration.sql';
    assert.equal(decisionFor('Write', { file_path: file, content: 'ALTER TABLE "Report" ADD "tag" TEXT;' }), 'deny');
  });

  test('denies editing an applied migration', () => {
    assert.equal(decisionFor('Edit', { file_path: appliedMigration, old_string: 'a', new_string: 'b' }), 'deny');
  });

  test('denies an absolute path to a new migration', () => {
    const file = path.join(projectDir, 'backend', 'prisma', 'migrations', 'migration_lock.toml');
    assert.equal(decisionFor('Write', { file_path: file, content: 'provider = "postgresql"' }), 'deny');
  });

  test('allows editing the Prisma schema', () => {
    assert.equal(decisionFor('Edit', { file_path: 'backend/prisma/schema.prisma', old_string: 'a', new_string: 'b' }), 'allow');
  });

  test('denies a shell redirect into the migrations folder', () => {
    const command = "cat > backend/prisma/migrations/20261017000000_add_tag/migration.sql <<'SQL'\nALTER TABLE x;\nSQL";
    assert.equal(decisionFor('Bash', { command }), 'deny');
  });

  test('denies an appending redirect with a Windows path', () => {
    assert.equal(decisionFor('Bash', { command: 'echo "ALTER TABLE x;" >> backend\\prisma\\migrations\\x\\migration.sql' }), 'deny');
  });

  test('denies tee into the migrations folder', () => {
    assert.equal(decisionFor('Bash', { command: 'echo sql | tee -a prisma/migrations/x/migration.sql' }), 'deny');
  });

  test('denies copying a file into the migrations folder', () => {
    assert.equal(decisionFor('Bash', { command: 'cp /tmp/draft.sql backend/prisma/migrations/x/migration.sql' }), 'deny');
  });

  test('denies creating a migration folder by hand', () => {
    assert.equal(decisionFor('Bash', { command: 'mkdir -p backend/prisma/migrations/20261017000000_add_tag' }), 'deny');
  });

  test('allows generating a migration with prisma migrate dev', () => {
    assert.equal(decisionFor('Bash', { command: 'cd backend && npx prisma migrate dev --name add-report-tag' }), 'allow');
    assert.equal(decisionFor('Bash', { command: 'npx prisma migrate dev --name add-report-tag --create-only' }), 'allow');
  });

  test('allows redirecting output elsewhere while naming the migrations folder', () => {
    assert.equal(decisionFor('Bash', { command: 'git diff -- backend/prisma/migrations > /tmp/migrations.diff' }), 'allow');
    assert.equal(decisionFor('Bash', { command: 'npm test > out.txt 2>&1' }), 'allow');
  });

  test('allows reading or copying a migration out of the folder', () => {
    assert.equal(decisionFor('Bash', { command: `cat ${appliedMigration} && ls backend/prisma/migrations` }), 'allow');
    assert.equal(decisionFor('Bash', { command: `cp ${appliedMigration} /tmp/review.sql` }), 'allow');
  });

  test('allows a commit message that mentions the migrations folder', () => {
    assert.equal(decisionFor('Bash', { command: 'git commit -m "docs: mention > prisma/migrations/ rule"' }), 'allow');
  });
});
