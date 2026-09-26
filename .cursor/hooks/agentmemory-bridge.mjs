#!/usr/bin/env node
/**
 * Cursor hooks → agentmemory plugin scripts bridge.
 * Normalizes Cursor hook payloads (conversation_id, workspace_roots, etc.)
 * and forwards them to @agentmemory/agentmemory plugin scripts.
 */
import { execSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';

const hookName = process.argv[2];
if (!hookName) {
  process.stderr.write('Usage: agentmemory-bridge.mjs <hook-script-name>\n');
  process.exit(1);
}

function resolveScriptPath(name) {
  const npmRoot = execSync('npm root -g', {
    encoding: 'utf8',
    timeout: 5000,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  return join(npmRoot, '@agentmemory/agentmemory', 'plugin', 'scripts', `${name}.mjs`);
}

function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => resolve(input));
  });
}

/** Map Cursor common schema fields to agentmemory hook expectations. */
function normalizeCursorPayload(data) {
  if (!data || typeof data !== 'object') return data;

  const out = { ...data };

  if (!out.session_id && !out.sessionId) {
    out.session_id = data.session_id ?? data.conversation_id ?? data.sessionId;
  }

  if (!out.cwd) {
    out.cwd =
      data.cwd ??
      process.env.CURSOR_PROJECT_DIR ??
      process.env.CLAUDE_PROJECT_DIR ??
      (Array.isArray(data.workspace_roots) ? data.workspace_roots[0] : undefined) ??
      process.cwd();
  }

  if (data.error_message && out.error == null && out.errorMessage == null) {
    out.error = data.error_message;
  }

  if (data.prompt && out.userPrompt == null) {
    out.userPrompt = data.prompt;
  }

  return out;
}

async function main() {
  const raw = await readStdin();
  let payload = {};
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0);
    }
  }

  const scriptPath = resolveScriptPath(hookName);
  const normalized = JSON.stringify(normalizeCursorPayload(payload));

  const env = {
    ...process.env,
    AGENTMEMORY_URL: process.env.AGENTMEMORY_URL ?? 'http://localhost:3111',
    AGENTMEMORY_PROJECT_NAME: process.env.AGENTMEMORY_PROJECT_NAME ?? 'restful-ui',
  };

  const result = spawnSync(process.execPath, [scriptPath], {
    input: normalized,
    encoding: 'utf8',
    env,
    timeout: hookName === 'stop' || hookName === 'session-end' ? 130_000 : 30_000,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

main().catch(() => process.exit(0));
