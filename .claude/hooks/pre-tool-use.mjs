#!/usr/bin/env node
// PreToolUse gate: denies or escalates destructive shell commands and edits to protected files.
// Reads the hook payload from stdin and answers with a permissionDecision (see Claude Code hooks docs).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
const { tool_name: tool, tool_input: input = {} } = payload;
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd();

const DENY_COMMANDS = [
  [/\bgit\s+push\b[^|;&]*\s(--force(?!-with-lease)|-f)\b/, 'Force push rewrites shared history.'],
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard discards uncommitted work.'],
  [/\bgit\s+clean\s+-[a-z]*f/, 'git clean -f deletes untracked files (much of this repo is still untracked).'],
  [/\bgit\s+checkout\s+(--\s+)?\.(\s|$)/, 'git checkout . discards uncommitted work.'],
  [/\bgit\s+restore\s+(--\S+\s+)*\.(\s|$)/, 'git restore . discards uncommitted work.'],
  [/\bprisma\s+migrate\s+reset\b/, 'prisma migrate reset drops the database.'],
  [/\bprisma\s+db\s+push\b.*--(force-reset|accept-data-loss)/, 'Destructive prisma db push.'],
  [/\b(drop\s+(table|database|schema)|truncate\s+table)\b/i, 'Destructive SQL statement.'],
  [/\baws\s+s3\s+(rb|rm)\b/, 'Deletes S3 objects or buckets.'],
  [/\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+)+(\/|~|\$HOME|\.|\.\.|\*|\.git|backend|frontend|\.specs)\/?(\s|$)/,
    'Recursive delete of a broad path.'],
];

const ASK_COMMANDS = [
  [/\bgit\s+push\b/, 'Pushing publishes commits to the remote.'],
  [/\bprisma\s+migrate\s+deploy\b/, 'Applies migrations to the target database.'],
  [/\bnpm\s+publish\b/, 'Publishes a package.'],
];

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason },
  }));
  process.exit(0);
}

if (tool === 'Bash') {
  const cmd = String(input.command ?? '');
  for (const [re, why] of DENY_COMMANDS) if (re.test(cmd)) decide('deny', `Blocked by .claude/hooks/pre-tool-use.mjs: ${why} Ask the user to run it themselves if it is really needed.`);
  for (const [re, why] of ASK_COMMANDS) if (re.test(cmd)) decide('ask', why);
  process.exit(0);
}

const filePath = input.file_path ?? input.notebook_path;
if (filePath) {
  const rel = path.relative(projectDir, path.resolve(projectDir, filePath)).split(path.sep).join('/');
  const base = path.basename(rel);

  if (/^\.env(\..+)?$/.test(base) && !base.endsWith('.example')) {
    decide('deny', 'Editing .env files is blocked: they hold credentials. Update .env.example / the README instead.');
  }
  if (base === 'package-lock.json') {
    decide('deny', 'Do not hand-edit package-lock.json; run npm install in the package instead.');
  }
  if (rel.startsWith('.git/')) decide('deny', 'Direct edits inside .git/ are blocked.');
  if (/(^|\/)prisma\/migrations\/.+/.test(rel) && existsSync(path.resolve(projectDir, rel))) {
    decide('deny', 'Applied Prisma migrations are immutable; create a new migration with prisma migrate dev.');
  }
}

process.exit(0);
