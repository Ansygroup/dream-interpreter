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
<<<<<<< HEAD
// Park the thread without burning a core (a plain spin loop pegged the CPU).
const sleepMs = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (_) { const e = Date.now() + ms; while (Date.now() < e) {} } };
=======
// Same as sh() but keeps the exit code. The generator exits non-zero when the API
// never returns a complete reading from a real engine, and that MUST stop the
// pipeline: sh() swallows the code, so a stale boilerplate file left on disk from
// an earlier tick used to satisfy the existence + date checks and the run went on
// to commit, push and burn a Vercel quota slot shipping the SAME degraded bytes.
const shCode = (cmd, t) => { try { return { out: execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: t }), code: 0 }; } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status === null || e.status === undefined ? 1 : e.status }; } };
>>>>>>> origin/master
const getJson = (u) => new Promise((res) => {
  https.get(u, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch { res(null); } }); }).on('error', () => res(null));
});

console.log(`[daily-feed] ${new Date().toISOString()}`);

// Safety guard: this script pushes the checked-out tree to master and deploys it
// to production. If the repo is sitting on a feature/redesign branch, that would
// silently ship unreviewed work. Only the release branch may publish.
const BRANCH = (process.env.FEED_BRANCH || 'master');
const head = sh('git rev-parse --abbrev-ref HEAD', 20000).trim();
if (head !== BRANCH) {
  console.error(`[daily-feed] ABORT — checked-out branch is ${JSON.stringify(head)}, expected ${JSON.stringify(BRANCH)}.`);
  console.error('[daily-feed] Refusing to push/deploy from a non-release branch.');
  process.exit(2);
}
if (/^\s*(UU|AA|DD|AU|UA|DU|UD)/.test(sh('git diff --name-only --diff-filter=U', 20000))) {
  console.error('[daily-feed] ABORT — unresolved merge conflicts.');
  process.exit(2);
}

// A real LLM reading is several hundred characters. The offline fallback
// (engine:"offline", returned when the free-model quota is 429-exhausted) is a
// ~206-char keyword template that is always "complete" by shape, so a date-only
// check treated degraded output as a finished card. This detects the boilerplate
// by content so a later tick can regenerate it once quota recovers.
const OFFLINE_BOILERPLATE_EN = 'uniquely yours';
const looksDegraded = (d) =>
  !!d && !!(d.reading && String(d.reading.en || '').includes(OFFLINE_BOILERPLATE_EN));

// Literal U+FFFD replacement characters render as black diamonds in the card.
// Independent of how the file was produced, a reading containing one is broken
// text — never publish it.
const hasMojibake = (d) =>
  !!d && !!d.reading && [d.reading.en, d.reading.ar].some((t) => /\ufffd/.test(String(t || '')));

// Already live for today AND not a degraded card?
const live = await getJson(`${BASE}/dream-today.json`);
if (live && live.date === today && !looksDegraded(live)) {
  console.log('[daily-feed] live already has today\'s dream — nothing to do.');
  process.exit(0);
}
if (live && live.date === today && looksDegraded(live)) {
  console.log('[daily-feed] live card for today is OFFLINE BOILERPLATE (free-model quota was down) — regenerating.');
}
if (live && live.date === today && hasMojibake(live)) {
  console.log('[daily-feed] live card for today contains replacement characters — regenerating.');
}

// 1. generate
// 480s: with the site LLM pool down, the generator waits out the fallback
// gateway's 1-request-per-minute free gate between EN and AR before giving up.
// The old 180s ceiling cut the retry off mid-wait and failed the whole day.
const gen = shCode('node scripts/gen-dream-today.mjs', 480000);
if (gen.out.trim()) console.log(gen.out.trim());
if (gen.code !== 0) {
  console.error('[daily-feed] generator did not produce a real reading (free-model quota still down) — NOT committing, NOT deploying. Will retry next tick.');
  process.exit(0); // quota-safe: a later tick with quota back regenerates the card
}
if (!fs.existsSync(OUT)) { console.error('[daily-feed] generation failed.'); process.exit(1); }
const local = JSON.parse(fs.readFileSync(OUT, 'utf8'));
if (local.date !== today) { console.error('[daily-feed] generated date mismatch.'); process.exit(1); }
if (looksDegraded(local)) { console.error('[daily-feed] generated card is degraded — abort.'); process.exit(1); }
if (hasMojibake(local)) { console.error('[daily-feed] generated card contains replacement characters — abort.'); process.exit(1); }

// 2. commit + push
sh('git add public/dream-today.json');
sh('git -c user.email="ansy@ansygroup.com" -c user.name="Hermes" commit -q -m "chore: dream of the day — ' + local.symbol.en + ' (' + today + ')"');
const push = sh('git push origin ' + BRANCH, 60000);
// sh() returns '' on success and captured stderr on failure — never deploy a
// push that did not land, or the card silently reverts on the next build.
if (/rejected|error:|failed|denied|non-fast-forward/i.test(push)) {
  console.error('[daily-feed] git push FAILED — not deploying.');
  console.error(push.trim().slice(0, 500));
  process.exit(3);
}

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

// 4. verify — CONTENT, not just the date. `live.date === today` alone was true
// for the degraded boilerplate card that was already published, so the run
// printed "VERIFIED" while the site kept serving an offline keyword template.
const verify = await getJson(`${BASE}/dream-today.json`);
<<<<<<< HEAD
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
=======
if (!verify || verify.date !== today) {
  console.log('[daily-feed] deployed but live not yet updated — will retry next tick.');
} else if (looksDegraded(verify)) {
  console.log('[daily-feed] live card is STILL the offline boilerplate — not verified; will retry next tick.');
} else if (hasMojibake(verify)) {
  console.log('[daily-feed] live card contains replacement characters — not verified; will retry next tick.');
} else {
  console.log(`[daily-feed] VERIFIED — live dream of the day: ${local.symbol.en} (engine=${verify.engine || 'unknown'}, en ${String(verify.reading?.en || '').length}ch / ar ${String(verify.reading?.ar || '').length}ch)`);
}
>>>>>>> origin/master
