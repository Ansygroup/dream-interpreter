#!/usr/bin/env node
/**
 * activate-when-ready.mjs — self-completing activation pipeline for Dreamscope.
 *
 * Waits (without erroring) until the operator drops BOTH of these into
 * .dreamscope-secrets (a gitignored file, NEVER committed):
 *   SUPABASE_ACCESS_TOKEN=...      (platform token, used to flip Google provider)
 *   SUPABASE_PROJECT_REF=...       (e.g. nrrmajmxnxbrsvfvlfvv)
 *   GOOGLE_CLIENT_ID=...           (from Google Cloud Console OAuth client)
 *   GOOGLE_CLIENT_SECRET=...
 *   OPENROUTER_API_KEY=...         (to (re)generate the 58 non-en/ar locales neutral)
 *
 * The moment all are present it:
 *   1. enables the Supabase Google Auth provider (login button works),
 *   2. regenerates all other locales from the neutral en.json via translate-ui.mjs (--force),
 *   3. commits + pushes the regenerated locales,
 *   4. writes .activate-done so it won't re-run.
 *
 * Safe: if anything is missing it just exits 0 and retries next cron tick.
 * Idempotent: the .activate-done marker stops re-runs.
 *
 * Cron: `node scripts/activate-when-ready.mjs` every 30m.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SECRETS = join(root, '.dreamscope-secrets');
const DONE = join(root, '.activate-done');

const log = (...a) => console.log(`[activate ${new Date().toISOString()}]`, ...a);

if (existsSync(DONE)) { log('already activated — nothing to do.'); process.exit(0); }
if (!existsSync(SECRETS)) { log('no .dreamscope-secrets yet — waiting for credentials.'); process.exit(0); }

// Parse a simple "KEY=VALUE" secrets file (lines starting with # are comments).
const env = {};
for (const line of readFileSync(SECRETS, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const need = ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'OPENROUTER_API_KEY'];
const missing = need.filter((k) => !env[k]);
if (missing.length) { log('missing:', missing.join(', '), '— waiting.'); process.exit(0); }
log('all credentials present — activating.');

const run = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'inherit' });

try {
  // 1. Enable Google provider
  const googleEnv = { ...process.env, ...env };
  log('enabling Google provider…');
  run(`node scripts/enable-google.mjs --project ${env.SUPABASE_PROJECT_REF}`);

  // 2. Regenerate all non-en/ar locales from neutral en.json (--force)
  log('regenerating locales (neutral)…');
  run(`OPENROUTER_API_KEY=${env.OPENROUTER_API_KEY} node scripts/translate-ui.mjs --force`);

  // 3. Commit + push regenerated locales
  log('committing regenerated locales…');
  run('git add src/i18n/locales/*.json');
  run('git commit -m "i18n: regenerate 58 locales from neutral EN (multi-faith, no single-tradition bias)" || true');
  run('git push origin master || true');

  writeFileSync(DONE, new Date().toISOString());
  log('✅ activation complete (Google enabled + locales regenerated). Marker written.');
} catch (e) {
  log('activation step failed (will retry next tick):', e?.message || e);
  process.exit(0); // don't hard-fail the cron; retry later
}
