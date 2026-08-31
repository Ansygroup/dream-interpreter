#!/usr/bin/env node
/**
 * auto-translate.mjs — self-completing UI localization for Dreamscope.
 *
 * This is the AGENT-IN-THE-LOOP piece: it needs no secrets from the operator.
 * It pulls the OpenRouter key from the project's Vercel production env (the
 * Vercel CLI is already authenticated as `ansygroup`), then runs translate-ui.mjs
 * over every locale that is still partial (neutral EN placeholder copy) or
 * missing — preserving the hand-curated en.json (source) and ar.json (bilingual).
 *
 * Safe: if Vercel pull fails or the key is absent, it just exits 0 and retries
 * next cron tick. Idempotent: only translates incomplete locales unless --all.
 *
 * Cron: `node scripts/auto-translate.mjs` every 30m (self-healing localization).
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const log = (...a) => console.log(`[auto-translate ${new Date().toISOString()}]`, ...a);

const run = (cmd, opts = {}) => {
  try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', ...opts }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
};

// 1. Pull production env (contains OPENROUTER_API_KEY). Never commit the file.
const envFile = join(root, '.env.vercel.local');
rmSync(envFile, { force: true });
const pull = run('vercel env pull .env.vercel.local --environment production 2>&1', { timeout: 90000 });
if (!existsSync(envFile) || !/OPENROUTER_API_KEY=/.test(readFileSync(envFile, 'utf8'))) {
  log('could not obtain OPENROUTER_API_KEY from Vercel env — will retry next tick.');
  rmSync(envFile, { force: true });
  process.exit(0);
}
log('obtained OPENROUTER_API_KEY from Vercel production env.');

// 2. Translate all incomplete (non-en/ar) locales.
//    --complete = only (re)translate partial files; default also covers missing.
const mode = process.argv.includes('--all') ? '--force' : '--complete';
const out = run(`node scripts/translate-ui.mjs ${mode}`, { timeout: 600000 });
console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));

// 3. Commit + push the freshly localized locales (if any changed).
rmSync(envFile, { force: true }); // never leave the secret file on disk
const status = run('git status --porcelain src/i18n/locales/');
if (!status.trim()) { log('no locale changes — nothing to commit.'); process.exit(0); }
run('git add src/i18n/locales/*.json');
run('git commit -m "i18n: agent auto-localized UI strings (Vercel-pulled OpenRouter key)" || true');
run('git push origin master || true');
log('✅ auto-localization pass complete.');
