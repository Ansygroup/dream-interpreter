#!/usr/bin/env node
/**
 * auto-translate.mjs — self-completing UI localization for Dreamscope.
 *
 * This is the AGENT-IN-THE-LOOP piece: it needs no secrets from the operator.
 * It pulls the OpenRouter key from the project's Vercel prod env (the
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
import { totalPending } from './i18n-pending.mjs';

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
  run('vercel env pull .env.vercel.local --environment production --yes 2>&1', { timeout: 120000 }); // increased timeout
  if (existsSync(envFile)) {
    const txt = readFileSync(envFile, 'utf8');
    const m = txt.match(/OPENROUTER_API_KEY=\"?([^\"\\n]+)\"?/);
    if (m && usable(m[1])) KEY = m[1]; // ignore "@..." / "[SENSITIVE]" redacted values
    rmSync(envFile, { force: true });
  }
}

// 1b. TERMINATION GATE. The self-completing loop has no natural end state, so
//     without this it would probe a dead engine forever and report the SAME
//     blocker every tick even after every locale is fully translated. Count the
//     real outstanding (locale, key) pairs FIRST: when zero, the job is done
//     and there is nothing for a dead engine to block — exit 0 quietly.
let pendingNow = null;
try { pendingNow = totalPending(); } catch (e) { pendingNow = null; log(`pending-count failed: ${e?.message || e}`); }
if (pendingNow === 0) {
  log('✅ localization COMPLETE — 0 pending (locale, key) pairs across all non-en/ar locales. Nothing to translate; exiting 0.');
  process.exit(0);
}
if (pendingNow !== null) log(`pending (locale, key) pairs: ${pendingNow}`);

// 2. Self-completing localization — prefer the LIVE /api/translate endpoint
//    (the deployed app holds OPENROUTER_API_KEY server-side, so we get
//    high-quality LLM translations with ZERO operator secrets). Falls back
//    to a local OpenRouter call only if the live endpoint is unreachable.
const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
let probe = '000';
try {
  const res = await fetch(`${BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'en', source: { footer: { tagline: 'x' } } }),
    // Increased timeout to match endpoint maxDuration (120s) + buffer
    signal: AbortSignal.timeout(120000),
  });
  probe = String(res.status);
} catch { probe = '000'; }
const liveReachable = probe.startsWith('2') || probe === '400'; // 400 means endpoint alive, rejected our tiny payload — still usable

// 2b. LIVENESS probe — a reachable route is NOT a working translator.
//     The cheap probe above only proves /api/translate exists. When nothing is
//     pending, the driver below makes ZERO translation calls, so a dead engine
//     (all models 404/429/402 on Vercel prod) reports a perfect false green:
//     "Done: 0 translated" + "no locale changes". That breaks the self-completing
//     loop — it can never notice its own blocker. So always force ONE real
//     translation through the endpoint and report the verdict, pending or not.
let engineOk = null, engineDetail = '';
if (liveReachable) {
  try {
    const r2 = await fetch(`${BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'sw', source: { nav: { home: 'Home' } } }),
      signal: AbortSignal.timeout(120000),
    });
    const j2 = await r2.json().catch(() => ({}));
    const got = j2?.translations?.nav?.home;
    engineOk = r2.ok && typeof got === 'string' && got.trim().length > 0;
    engineDetail = `HTTP ${r2.status}${got ? ` got=${JSON.stringify(got)}` : ` err=${j2?.error || 'no translations'}`}`;
  } catch (e) { engineOk = false; engineDetail = `threw: ${e?.message || e}`; }
  log(`${engineOk ? '✅' : '❌'} translation engine liveness: ${engineDetail}`);
  if (!engineOk) {
    log('⚠️  ENGINE DEAD but route is up — the self-completing loop is BLOCKED and no cron tick can heal it.');
    log('   Usual causes, in order: (1) Vercel prod is running STALE code whose');
    log('   FREE_MODELS list is dead (check: `vercel ls` last Ready age vs the');
    log('   commit that last touched api/translate.js); (2) deploys failing with');
    log('   BUILD_ERROR "Resource provisioning failed"; (3) OpenRouter key out of');
    log('   credits on the Vercel prod env. Locales stay as-is — no work is lost.');
  }
}

if (liveReachable) {
  log(`using LIVE /api/translate (no operator secret needed; engine runs on Vercel). probe=${probe}.`);
  // --all MUST be forwarded: without it the driver skips locales it wrongly
  // considers complete and the whole run degenerates into a no-op.
  const allFlag = process.argv.includes('--all') ? ' --all' : '';
  const out = run(`node scripts/translate-live.mjs${allFlag}`, { timeout: 900000 }); // increased to 15 min
  console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));
} else if (usable(KEY)) {
  const mode = process.argv.includes('--all') ? '--force' : '--complete';
  process.env.OPENROUTER_API_KEY = KEY;
  log(`live endpoint unreachable (probe=${probe}) — using local OpenRouter key.`);
  const out = run(`node scripts/translate-ui.mjs ${mode}`, { timeout: 900000 });
  console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));
} else {
  // Last-resort keyless: MyMemory (rate-limited; better than nothing).
  //
  // GUARDED: translate-free.mjs retranslates EVERY key of every target locale
  // from scratch with MT and falls back to EN on failure. Reaching it from a
  // cron tick would silently overwrite curated translations across all 58
  // locales with worse machine copy — a destructive regression, not a
  // recovery. So it is opt-in only (ALLOW_MT_FALLBACK=1); by default we report
  // the blocker and let a human decide. The loop still self-heals: once the
  // engine recovers, the next tick translates normally.
  if (process.env.ALLOW_MT_FALLBACK !== '1') {
    log('live endpoint unreachable (probe=' + probe + ') and no local key.');
    log('⚠️  refusing the keyless MyMemory fallback: it rewrites whole locales with machine translation.');
    log('   Re-run with ALLOW_MT_FALLBACK=1 only if you accept an MT-quality regression.');
    log('❌ exiting 75 (blocked, locales untouched) — engine/key must be restored first.');
    process.exit(75);
  }
  log('live endpoint unreachable (probe=' + probe + ') and no local key — ALLOW_MT_FALLBACK=1, falling back to keyless MyMemory.');
  const out = run(`node scripts/translate-free.mjs`, { timeout: 900000 });
  console.log(out.split('\n').filter((l) => /→|✓|✗|Done|translated/.test(l)).join('\n'));
}

// 3. Commit + push the freshly localized locales (if any changed).
//    Push to the CURRENT branch, never a hardcoded "master": the repo carries
//    long-lived work branches (redesign/*, ops/*) and pushing master from one
//    of them is rejected as non-fast-forward, silently losing every run's work.
const status = run('git status --porcelain src/i18n/locales/');
const hasChanges = !!status.trim();
// 3b. Exit 75 (EX_TEMPFAIL) when the engine is verifiably dead. A "no locale
//     changes" success would otherwise be indistinguishable from real progress,
//     and the cron would report a healthy pass forever while nothing can
//     translate. Locales are untouched either way — this only makes the failure
//     visible instead of silently green.
if (engineOk === false) {
  if (!hasChanges) log('no locale changes — nothing to commit.');
  log('❌ exiting 75 (engine dead, locales unchanged) — see the liveness line above.');
  process.exit(75);
}
if (!hasChanges) {
  log('no locale changes — nothing to commit.');
  process.exit(0);
}
run('git add src/i18n/locales/*.json');
run('git commit -m "i18n: agent auto-localized UI strings (self-completing localization)" || true');
const BRANCH = run('git rev-parse --abbrev-ref HEAD').trim();
const pushed = run(`git push origin HEAD:${BRANCH}`);
if (/rejected|failed/.test(pushed)) {
  log(`⚠️ push to ${BRANCH} rejected — run 'git pull --rebase' to integrate, then push.`);
} else {
  log(`✅ pushed to origin/${BRANCH}.`);
}
log('✅ auto-localization pass complete.');