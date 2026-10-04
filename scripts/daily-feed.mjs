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
sh('node scripts/gen-dream-today.mjs', 120000);
if (!fs.existsSync(OUT)) { console.error('[daily-feed] generation failed.'); process.exit(1); }
const local = JSON.parse(fs.readFileSync(OUT, 'utf8'));
if (local.date !== today) { console.error('[daily-feed] generated date mismatch.'); process.exit(1); }

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

// 4. verify
const verify = await getJson(`${BASE}/dream-today.json`);
if (verify && verify.date === today) console.log(`[daily-feed] VERIFIED — live dream of the day: ${local.symbol.en}`);
else console.log('[daily-feed] deployed but live not yet updated — will retry next tick.');
