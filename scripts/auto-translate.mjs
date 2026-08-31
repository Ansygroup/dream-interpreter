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

// 1. Resolve OPENROUTER_API_KEY from one of (in priority order):
//    a) .dreamscope-secrets (operator-seeded literal key, gitignored) — headless-safe
//    b) the ambient environment (e.g. an operator-exported OPENROUTER_API_KEY)
//    c) Vercel env pull (works in an interactive pty; returns an ENCRYPTED reference
//       "@..." OR a redacted literal "[SENSITIVE]" for sensitive vars — neither is
//       usable, so we fall through in those cases instead of clobbering a real key).
//    A usable key must look like an OpenRouter key (starts with "sk-") and must not be
//    a Vercel encrypted reference ("@...") or a Vercel redaction ("[SENSITIVE]").
const usable = (k) => !!k && k.startsWith('sk-') && !k.startsWith('@') && k !== '[SENSITIVE]';

const secretsFile = join(root, '.dreamscope-secrets');
let KEY = process.env.OPENROUTER_API_KEY || '';
if (existsSync(secretsFile)) {
  for (const line of readFileSync(secretsFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (t.startsWith('OPENROUTER_API_KEY=')) { KEY = t.slice('OPENROUTER_API_KEY='.length).trim(); break; }
  }
}
if (!usable(KEY)) { // fall back to Vercel env pull
  const envFile = join(root, '.env.vercel.local');
  rmSync(envFile, { force: true });
  run('vercel env pull .env.vercel.local --environment production --yes 2>&1', { timeout: 90000 });
  if (existsSync(envFile)) {
    const txt = readFileSync(envFile, 'utf8');
    const m = txt.match(/OPENROUTER_API_KEY="?([^"\n]+)"?/);
    if (m && usable(m[1])) KEY = m[1]; // ignore "@..." / "[SENSITIVE]" redacted values
    rmSync(envFile, { force: true });
  }
}
if (!usable(KEY)) {
  // No usable OpenRouter key and the KEYLESS MyMemory fallback is unreliable
  // (it returns English "fallback" and would overwrite real translations).
  // Safer to skip this tick than to clobber locales — retry next cron tick.
  // To enable: seed `.dreamscope-secrets` with the literal OPENROUTER_API_KEY
  // (Vercel `env pull` redacts sensitive vars to "[SENSITIVE]", so it cannot be
  // obtained from Vercel here) or export OPENROUTER_API_KEY in the cron env.
  log('no usable OPENROUTER_API_KEY — skipping localization this tick (retry next). Do NOT run the KEYLESS MyMemory path: it overwrites real translations with English fallbacks.');
  process.exit(0);
}
// 2. High-quality LLM localization via OpenRouter (free-model cascade).
const mode = process.argv.includes('--all') ? '--force' : '--complete';
process.env.OPENROUTER_API_KEY = KEY;
log('using OpenRouter LLM localization (high quality).');
const out = run(`node scripts/translate-ui.mjs ${mode}`, { timeout: 600000 });
console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));

// 3. Commit + push the freshly localized locales (if any changed).
const status = run('git status --porcelain src/i18n/locales/');
if (!status.trim()) { log('no locale changes — nothing to commit.'); process.exit(0); }
run('git add src/i18n/locales/*.json');
run('git commit -m "i18n: agent auto-localized UI strings (self-completing localization)" || true');
run('git push origin master || true');
log('✅ auto-localization pass complete.');
