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
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE = process.env.API_BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const OUT = path.join(root, 'public', 'dream-today.json');
const today = new Date().toISOString().slice(0, 10);

const sh = (cmd, t) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: t }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };
// Same as sh() but keeps the exit code. The generator exits non-zero when the API
// never returns a complete reading from a real engine, and that MUST stop the
// pipeline: sh() swallows the code, so a stale boilerplate file left on disk from
// an earlier tick used to satisfy the existence + date checks and the run went on
// to commit, push and burn a Vercel quota slot shipping the SAME degraded bytes.
const shCode = (cmd, t) => { try { return { out: execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: t }), code: 0 }; } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status === null || e.status === undefined ? 1 : e.status }; } };
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

// Already live for today AND not a degraded card?
const live = await getJson(`${BASE}/dream-today.json`);
if (live && live.date === today && !looksDegraded(live)) {
  console.log('[daily-feed] live already has today\'s dream — nothing to do.');
  process.exit(0);
}
if (live && live.date === today && looksDegraded(live)) {
  console.log('[daily-feed] live card for today is OFFLINE BOILERPLATE (free-model quota was down) — regenerating.');
}

// 1. generate
const gen = shCode('node scripts/gen-dream-today.mjs', 180000);
if (gen.out.trim()) console.log(gen.out.trim());
if (gen.code !== 0) {
  console.error('[daily-feed] generator did not produce a real reading (free-model quota still down) — NOT committing, NOT deploying. Will retry next tick.');
  process.exit(0); // quota-safe: a later tick with quota back regenerates the card
}
if (!fs.existsSync(OUT)) { console.error('[daily-feed] generation failed.'); process.exit(1); }
const local = JSON.parse(fs.readFileSync(OUT, 'utf8'));
if (local.date !== today) { console.error('[daily-feed] generated date mismatch.'); process.exit(1); }
if (looksDegraded(local)) { console.error('[daily-feed] generated card is degraded — abort.'); process.exit(1); }

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

// 3. deploy (quota-safe)
const out = sh('timeout 150 vercel deploy --prod --yes 2>&1', 160000);
if (/api-deployments-free-per-day/.test(out)) { console.log('[daily-feed] QUOTA BLOCKED — will retry next tick.'); process.exit(0); }

// 4. verify — CONTENT, not just the date. `live.date === today` alone was true
// for the degraded boilerplate card that was already published, so the run
// printed "VERIFIED" while the site kept serving an offline keyword template.
const verify = await getJson(`${BASE}/dream-today.json`);
if (!verify || verify.date !== today) {
  console.log('[daily-feed] deployed but live not yet updated — will retry next tick.');
} else if (looksDegraded(verify)) {
  console.log('[daily-feed] live card is STILL the offline boilerplate — not verified; will retry next tick.');
} else {
  console.log(`[daily-feed] VERIFIED — live dream of the day: ${local.symbol.en} (engine=${verify.engine || 'unknown'}, en ${String(verify.reading?.en || '').length}ch / ar ${String(verify.reading?.ar || '').length}ch)`);
}
