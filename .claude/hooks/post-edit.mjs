#!/usr/bin/env node
// PostToolUse feedback: formats edited backend files with Prettier and lints edited frontend files with oxlint.
// Exit code 2 feeds lint output back to the agent; missing node_modules is skipped silently.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = payload.tool_input?.file_path;
if (!filePath || !existsSync(filePath)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd();
const abs = path.resolve(projectDir, filePath);
const rel = path.relative(projectDir, abs).split(path.sep).join('/');

function bin(pkg, name) {
  const p = path.join(projectDir, pkg, 'node_modules', '.bin', name);
  return existsSync(p) ? p : null;
}

function run(cmd, args, cwd) {
  return spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 30_000 });
}

if (/^backend\/(src|test)\/.+\.ts$/.test(rel)) {
  const prettier = bin('backend', 'prettier');
  if (prettier) run(prettier, ['--write', '--log-level', 'warn', abs], path.join(projectDir, 'backend'));
} else if (/^frontend\/src\/.+\.(ts|tsx)$/.test(rel)) {
  const oxlint = bin('frontend', 'oxlint');
  if (oxlint) {
    const res = run(oxlint, ['--quiet', abs], path.join(projectDir, 'frontend'));
    if (res.status !== 0) {
      process.stderr.write(`oxlint reported errors in ${rel}:\n${res.stdout}${res.stderr}`);
      process.exit(2);
    }
  }
}

process.exit(0);
