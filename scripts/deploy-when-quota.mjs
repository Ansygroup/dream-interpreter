#!/usr/bin/env node
/**
 * deploy-when-quota.mjs — self-completing deploy watcher for dream-interpreter.
 *
 * Goal: deploy the latest origin/master to Vercel prod the moment the free-tier
 * 100-deploys/day quota reopens, then verify live. Idempotent: if the current
 * origin/master is already deployed, it does nothing (no wasted deploys).
 *
 * Precedence:
 *   1. Read local marker (scripts/.di-deployed-sha). If it equals origin/master HEAD -> already shipped, exit.
 *   2. Check live already serves the feature (covers case where another cron deployed) -> set marker, exit.
 *   3. Attempt `vercel deploy --prod --yes`.
 *   4. If quota-blocked (api-deployments-free-per-day) -> exit 0 (cron retries next tick).
 *   5. On success -> write HEAD to marker IMMEDIATELY (deploy is the costly step), then best-effort
 *      live-verify (home/interpret/api 200 + feature string present in served JS chunks).
 *
 * NOTE: curl does NOT glob remote URLs, so we parse real asset URLs from the HTML
 * and fetch each chunk to grep for the feature string.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const marker = resolve(root, 'scripts', '.di-deployed-sha');
const BASE = 'https://dream-interpreter-alpha-ruddy.vercel.app';
const FEATURE_RE = /compareLabel|Compare all traditions|قارن بين كل التقاليد/;

function sh(cmd) {
  try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
function head() {
  return sh('git rev-parse origin/master').trim();
}
function markerSha() {
  try { return readFileSync(marker, 'utf8').trim(); } catch { return ''; }
}
function curlCode(url) {
  try { return execSync(`curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "${url}"`).trim(); }
  catch { return '000'; }
}
function curlText(url) {
  try { return execSync(`curl -s -L --max-time 20 "${url}"`).toString(); } catch { return ''; }
}
// Fetch /interpret HTML, extract real JS chunk URLs, return concatenated text of all chunks.
function liveBundleText() {
  const html = curlText(`${BASE}/interpret`);
  const urls = [...html.matchAll(/(?:src|href)="(\/[^"]+\.js)"/g)].map(m => `${BASE}${m[1]}`);
  let text = html;
  for (const u of urls) text += '\n' + curlText(u);
  return text;
}
function liveHasCompare() {
  return FEATURE_RE.test(liveBundleText());
}

console.log(`[watcher] ${new Date().toISOString()}`);

// 1) already shipped (marker matches origin/master)?
const target = head();
const done = markerSha();
if (done && done === target) {
  console.log(`[watcher] origin/master ${target.slice(0, 8)} already deployed (marker) — nothing to do.`);
  process.exit(0);
}
// 1b) live already serves the feature and is up -> treat as shipped; set marker so we
//     (and the 05:00 portfolio cron) don't double-deploy.
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

// 3) The deploy is the costly step — record it NOW so we never re-deploy the same SHA.
writeFileSync(marker, target);

// 4) best-effort live verify (informational; marker already set)
const home = curlCode(`${BASE}/`);
const interpret = curlCode(`${BASE}/interpret`);
const api = curlText(`curl -s -X POST ${BASE}/api/interpret -H 'Content-Type: application/json' -d '{"dream":"test","language":"en","perspective":"general"}' --max-time 25`);
const apiOk = /interpretation/.test(api);
const compareOk = liveHasCompare();
console.log(`[verify] home=${home} interpret=${interpret} api=${apiOk ? 'ok' : 'FAIL'} compare-string=${compareOk ? 'present' : 'absent'}`);
if (home === '200' && interpret === '200' && apiOk && compareOk) {
  console.log(`[watcher] VERIFIED — Compare Traditions is LIVE (marker ${target.slice(0, 8)}).`);
} else {
  console.log('[watcher] deployed; live verify pending propagation (marker already set).');
}
