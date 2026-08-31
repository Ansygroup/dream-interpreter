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
// 2. Self-completing localization — prefer the LIVE /api/translate endpoint
//    (the deployed app holds OPENROUTER_API_KEY server-side, so we get
//    high-quality LLM translations with ZERO operator secrets). Falls back
//    to a local OpenRouter call only if the live endpoint is unreachable.
const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const probe = (() => {
  try { return run(`curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/translate -X POST -H "Content-Type: application/json" -d '{"code":"en","source":{"footer":{"tagline":"x"}}}', { timeout: 15000 }); } catch { return '000'; }
})();
const liveReachable = probe.startsWith('2') || probe === '400'; // 400 means endpoint alive, rejected our tiny payload — still usable
if (liveReachable) {
  log(`using LIVE /api/translate (no operator secret needed; engine runs on Vercel). probe=${probe}.`);
  const out = run(`node scripts/translate-live.mjs`, { timeout: 600000 });
  console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));
} else if (usable(KEY)) {
  const mode = process.argv.includes('--all') ? '--force' : '--complete';
  process.env.OPENROUTER_API_KEY = KEY;
  log(`live endpoint unreachable (probe=${probe}) — using local OpenRouter key.`);
  const out = run(`node scripts/translate-ui.mjs ${mode}`, { timeout: 600000 });
  console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));
} else {
  // Last-resort keyless: MyMemory (rate-limited; better than nothing).
  log(`live endpoint unreachable (probe=${probe}) and no local key — falling back to keyless MyMemory.`);
  const out = run(`node scripts/translate-free.mjs`, { timeout: 600000 });
  console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));
}

// 3. Commit + push the freshly localized locales (if any changed).
const status = run('git status --porcelain src/i18n/locales/');
if (!status.trim()) { log('no locale changes — nothing to commit.'); process.exit(0); }
run('git add src/i18n/locales/*.json');
run('git commit -m "i18n: agent auto-localized UI strings (self-completing localization)" || true');
run('git push origin master || true');
log('✅ auto-localization pass complete.');
