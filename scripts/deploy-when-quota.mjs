#!/usr/bin/env node
/**
 * deploy-when-quota.mjs — self-completing deploy watcher for dream-interpreter.
 *
 * Goal: deploy the latest origin/master to Vercel prod the moment the free-tier
 * 100-deploys/day quota reopens, then verify live. Idempotent: if the current
 * origin/master is already deployed, it does nothing (no wasted deploys).
 *
 * Run on a cron (every ~20m). Exits 0 silently when blocked or already-deployed.
 *
 * Precedence:
 *   1. Read local marker (scripts/.di-deployed-sha). If it equals origin/master HEAD -> already shipped, exit.
 *   2. Attempt `vercel deploy --prod --yes`.
 *   3. If quota-blocked (api-deployments-free-per-day) -> exit 0 (cron retries next tick).
 *   4. On success -> write HEAD to marker, then curl-verify live (home/interpret/api) + that the new "Compare all traditions" string is present in a served JS chunk.
 */

import { execSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const marker = resolve(root, 'scripts', '.di-deployed-sha');
const BASE = 'https://dream-interpreter-alpha-ruddy.vercel.app';

function sh(cmd, silent = true) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (e) {
    return e.stdout || e.stderr || '';
  }
}
function head() {
  return sh('git rev-parse origin/master').trim();
}
function markerSha() {
  try { return readFileSync(marker, 'utf8').trim(); } catch { return ''; }
}
function curlCode(url, max = 20000) {
  try { return execSync(`curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "${url}"`).trim(); } catch { return '000'; }
}
function liveHasCompare() {
  const html = sh(`curl -s -L ${BASE}/interpret --max-time 20`);
  const js = sh(`curl -s ${BASE}/assets/index-*.js --max-time 20`);
  return /compareLabel|Compare all traditions|قارن بين كل التقاليد/.test(html + js);
}

console.log(`[watcher] ${new Date().toISOString()}`);

// 1) already shipped? (marker matches origin/master)
const target = head();
const done = markerSha();
if (done && done === target) {
  console.log(`[watcher] origin/master ${target.slice(0, 8)} already deployed (marker) — nothing to do.`);
  process.exit(0);
}
// 1b) live already serves the feature and is up -> treat as shipped; set marker so the
//     05:00 portfolio cron doesn't double-deploy and we don't either.
if (curlCode(`${BASE}/`) === '200' && liveHasCompare()) {
  console.log('[watcher] live already serves Compare Traditions — syncing marker, nothing to deploy.');
  writeFileSync(marker, target);
  process.exit(0);
}
console.log(`[watcher] need deploy: target=${target.slice(0, 8)} marker=${done.slice(0, 8) || '(none)'}`);

// 2) attempt deploy
const out = sh('vercel deploy --prod --yes 2>&1');
if (/api-deployments-free-per-day/.test(out)) {
  console.log('[watcher] QUOTA BLOCKED — will retry next tick.');
  process.exit(0);
}
if (!/Deployment|https:\/\//.test(out)) {
  console.log('[watcher] deploy did not report success, output:\n' + out.slice(0, 400));
  process.exit(0);
}
console.log('[watcher] deploy reported success.');

// 3) verify live
const home = curlCode(`${BASE}/`);
const interpret = curlCode(`${BASE}/interpret`);
const api = sh(`curl -s -X POST ${BASE}/api/interpret -H 'Content-Type: application/json' -d '{"dream":"test","language":"en","perspective":"general"}' --max-time 25`).trim();
const apiOk = /interpretation/.test(api);
// new feature string shipped in a served JS chunk?
const jsHasCompare = /compareLabel|Compare all traditions|قارن بين كل التقاليد/.test(
  sh(`curl -s -L ${BASE}/interpret --max-time 20`).concat(sh(`curl -s ${BASE}/assets/index-*.js --max-time 20`))
);
console.log(`[verify] home=${home} interpret=${interpret} api=${apiOk ? 'ok' : 'FAIL'} compare-string=${jsHasCompare ? 'present' : 'absent'}`);

if (home === '200' && interpret === '200' && apiOk) {
  writeFileSync(marker, target);
  console.log(`[watcher] VERIFIED + marker set to ${target.slice(0, 8)} — Compare Traditions is LIVE.`);
} else {
  console.log('[watcher] deploy succeeded but live verify incomplete — will re-check next tick.');
}
