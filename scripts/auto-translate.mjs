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
  log('no usable OPENROUTER_API_KEY — will use KEYLESS localization (no secret needed).');
}
// 2. Pick the translation engine:
//    - If a usable OpenRouter key is present → high-quality LLM localization.
//    - Otherwise (no key) → KEYLESS MyMemory path so the site is NEVER stuck in
//      English-only. This is the self-completing default: zero operator secrets.
const mode = process.argv.includes('--all') ? '--force' : '--complete';
let out;
if (usable(KEY)) {
  process.env.OPENROUTER_API_KEY = KEY;
  log('using OpenRouter LLM localization (high quality).');
  out = run(`node scripts/translate-ui.mjs ${mode}`, { timeout: 600000 });
} else {
  log('no OpenRouter key — using KEYLESS MyMemory localization (no operator secret needed).');
  out = run(`node scripts/translate-free.mjs`, { timeout: 600000 });
}
console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));

// 3. Commit + push the freshly localized locales (if any changed).
const status = run('git status --porcelain src/i18n/locales/');
if (!status.trim()) { log('no locale changes — nothing to commit.'); process.exit(0); }
run('git add src/i18n/locales/*.json');
run('git commit -m "i18n: agent auto-localized UI strings (self-completing localization)" || true');
run('git push origin master || true');
log('✅ auto-localization pass complete.');
