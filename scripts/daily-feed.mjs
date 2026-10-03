#!/usr/bin/env node
/**
 * daily-feed.mjs — self-completing daily "Dream of the day" publisher.
 *   1. generate public/dream-today.json (gen-dream-today.mjs)
 *   2. commit + push to origin/master
 *   3. vercel deploy --prod (quota-safe: exits cleanly if blocked)
 *   4. verify the live file matches today's date
 * Runs on a daily cron. Idempotent: if the live file is already today's, skip deploy.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { existsSync } from 'node:fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE = process.env.API_BASE || 'https://dream-interpreter-ansygroups-projects.vercel.app';
const DEPLOY_LOOP = 'C:/Users/ansy0/ZCodeProject/scripts/deploy-loop.mjs';
const OUT = path.join(root, 'public', 'dream-today.json');
const today = new Date().toISOString().slice(0, 10);

const sh = (cmd, t) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: t }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };
// Park the thread without burning a core (a plain spin loop pegged the CPU).
const sleepMs = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (_) { const e = Date.now() + ms; while (Date.now() < e) {} } };
const getJson = (u) => new Promise((res) => {
  https.get(u, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch { res(null); } }); }).on('error', () => res(null));
});

console.log(`[daily-feed] ${new Date().toISOString()}`);
// Already live for today?
const live = await getJson(`${BASE}/dream-today.json`);
if (live && live.date === today) { console.log('[daily-feed] live already has today\'s dream — nothing to do.'); process.exit(0); }

// 1. generate
sh('node scripts/gen-dream-today.mjs', 120000);
if (!fs.existsSync(OUT)) { console.error('[daily-feed] generation failed.'); process.exit(1); }
const local = JSON.parse(fs.readFileSync(OUT, 'utf8'));
if (local.date !== today) { console.error('[daily-feed] generated date mismatch.'); process.exit(1); }

// 2. commit + push
sh('git add public/dream-today.json');
sh('git -c user.email="ansy@ansygroup.com" -c user.name="Hermes" commit -q -m "chore: dream of the day — ' + local.symbol.en + ' (' + today + ')"');
sh('git push origin master', 60000);

// 2b. SETTLE: do not hand off to the deploy loop until origin/master ACTUALLY
// carries today's date. 2026-10-03: the push landed at 03:01:17Z but the deploy
// loop had already read origin/master at 03:01:10Z, got yesterday's dream,
// deployed it, and then recorded deployedSha - so the site served the 2026-10-02
// dream all day while today's was committed and pushed. The two scripts share no
// lock, so the only real barrier is to make the handoff observable: poll the
// pushed ref until it agrees with what we generated.
let originReady = false;
for (let i = 0; i < 8; i++) {
  const shown = sh('git show origin/master:public/dream-today.json', 30000);
  const m = String(shown).match(/"date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  if (m && m[1] === today) { originReady = true; break; }
  sleepMs(2000);
}
if (!originReady) {
  console.error('[daily-feed] origin/master does not carry ' + today + ' after the push - refusing to deploy a stale feed.');
  process.exit(1);
}
console.log('[daily-feed] origin/master carries ' + today + ' (' + local.symbol.en + ') - handing off to the deploy loop.');

// 3. deploy (quota-safe).
// This checkout and repos/dream-interpreter-feed are TWO checkouts linked to the
// SAME Vercel project. An in-place `vercel deploy` from here uploads this branch's
// public/ copy (a stale 2026-08-31) and lands QUEUED, never live. The only
// correct publisher is the shared deploy loop, which syncs origin/master's feed
// and deploys from a git-free staging dir. 2026-10-01.
const out = existsSync(DEPLOY_LOOP)
  ? sh('node ' + JSON.stringify(DEPLOY_LOOP), 900000)
  : sh('timeout 150 vercel deploy --prod --yes 2>&1', 160000);
if (/api-deployments-free-per-day/.test(out)) { console.log('[daily-feed] QUOTA BLOCKED — will retry next tick.'); process.exit(0); }

// 4. verify
const verify = await getJson(`${BASE}/dream-today.json`);
if (verify && verify.date === today) {
  console.log(`[daily-feed] VERIFIED — live dream of the day: ${local.symbol.en}`);
  process.exit(0);
}
// A READY deployment whose alias still serves yesterday's feed is a REAL miss,
// not something to shrug at: the deploy loop used to call this a success. Retry
// the shared loop once (it has a short partial-promotion backoff), then report
// honestly instead of exiting 0 on a stale site.
console.log('[daily-feed] live is still ' + ((verify && verify.date) || 'unreadable') + ' - retrying the deploy loop once.');
const retry = existsSync(DEPLOY_LOOP) ? sh('node ' + JSON.stringify(DEPLOY_LOOP), 900000) : '';
const after = await getJson(`${BASE}/dream-today.json`);
if (after && after.date === today) {
  console.log(`[daily-feed] VERIFIED on retry — live dream of the day: ${local.symbol.en}`);
  process.exit(0);
}
if (/free-per-day|100\/day|quota/i.test(String(retry))) {
  console.log('[daily-feed] QUOTA BLOCKED — will retry next tick.');
} else {
  console.log('[daily-feed] STILL STALE after the retry — the feed is committed on origin/master; the next deploy-loop run will promote it.');
}
process.exit(1);
