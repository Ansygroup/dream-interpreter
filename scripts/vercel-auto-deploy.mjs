#!/usr/bin/env node
/**
 * vercel-auto-deploy.mjs — SHARED, reusable self-completing Vercel deploy workflow.
 *
 * Why: Vercel free tier caps 100 deploys/day. A naive `vercel deploy --prod` loop burns
 * the quota and bricks deploys for 24h. This script finishes the deploy the moment the
 * quota reopens, then verifies the FULL STACK is live before declaring done.
 *
 * Safety properties:
 *   - fetches origin/master first (never trusts a stale cached HEAD)
 *   - only deploys if the live site is NOT already serving the target feature set
 *   - times out the deploy call (150s) so a blocked quota fails fast, not hangs
 *   - writes the marker ONLY after home + (optional) API verify pass -> idempotent
 *   - on a blocked quota, exits 0 and retries next cron tick
 *
 * Usage (cron):
 *   node C:/Users/ansy0/ZCodeProject/scripts/vercel-auto-deploy.mjs \
 *     --repo "C:/Users/ansy0/ZCodeProject/projects/repos/dream-interpreter" \
 *     --base "https://dream-interpreter-alpha-ruddy.vercel.app" \
 *     --feature "Compare all traditions" \
 *     --api   "https://dream-interpreter-alpha-ruddy.vercel.app/api/interpret"
 *
 * Flags:
 *   --repo     absolute path to the git repo (default: script's parent's parent)
 *   --base     live site origin to verify against
 *   --feature  regex present ONLY in the latest bundle (proves new code is live)
 *   --api      optional POST endpoint to call with a real request (LLM health probe)
 *   --api-body optional JSON body for --api (default: {"dream":"water","perspective":"general","language":"en"})
 */
import { execSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

const root = path.resolve(get('--repo', path.resolve(__dirname, '..')));
const BASE = get('--base', '');
const FEATURE_RE = new RegExp(get('--feature', '.*'));
const API = get('--api', '');
const API_BODY = get('--api-body', '{"dream":"water","perspective":"general","language":"en"}');
const MARKER = path.join(root, '.deploy-sha');

const sh = (cmd, timeoutMs) => {
  try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: timeoutMs }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
};
const head = () => {
  sh('git fetch origin --quiet 2>/dev/null', 60000);
  return sh('git rev-parse origin/master', 30000).trim();
};
const markerSha = () => { try { return fs.readFileSync(MARKER, 'utf8').trim(); } catch { return ''; } };
const code = (u) => new Promise((res) => {
  https.get(u, (r) => { r.resume(); res(r.statusCode); }).on('error', () => res(0));
});
const body = (u) => new Promise((res) => {
  https.get(u, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }).on('error', () => res(''));
});
const postJson = (u, data) => new Promise((res) => {
  const buf = Buffer.from(JSON.stringify(data));
  const rq = https.request(u, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length } },
    (r) => { r.resume(); res(r.statusCode); });
  rq.on('error', () => res(0)); rq.write(buf); rq.end();
});

function liveBundleHas(re) {
  return body(`${BASE}/`).then(async (html) => {
    const urls = [...html.matchAll(/(?:src|href)="(\/[^"]+\.js)"/g)].map((m) => `${BASE}${m[1]}`);
    let t = html;
    for (const u of urls) t += '\n' + (await body(u));
    return re.test(t);
  });
}

console.log(`[vercel-auto-deploy] ${new Date().toISOString()} repo=${root}`);
const target = head();
if (!/^[0-9a-f]{40}$/.test(target)) {
  console.log(`[vercel-auto-deploy] could not resolve origin/master HEAD (got "${target}") — aborting.`);
  process.exit(1);
}
const done = markerSha();
if (done === target) { console.log(`[vercel-auto-deploy] ${target.slice(0, 8)} already deployed+verified — nothing to do.`); process.exit(0); }

// Defense: if live already serves the feature set, sync marker (covers other deploy paths).
const homeCode = await code(`${BASE}/`);
if (homeCode === 200 && (await liveBundleHas(FEATURE_RE))) {
  console.log('[vercel-auto-deploy] live already serves target feature set — syncing marker.');
  fs.writeFileSync(MARKER, target); process.exit(0);
}
console.log(`[vercel-auto-deploy] need deploy: target=${target.slice(0, 8)} marker=${done.slice(0, 8) || '(none)'}`);

const out = sh('timeout 150 vercel deploy --prod --yes 2>&1', 160000);
if (/api-deployments-free-per-day/.test(out)) {
  console.log('[vercel-auto-deploy] QUOTA BLOCKED — will retry next tick.');
  process.exit(0);
}
if (!/https?:\/\/\S+\.vercel\.app/.test(out)) {
  console.log('[vercel-auto-deploy] deploy did not return a URL — output:\n' + out.slice(0, 400));
  process.exit(0);
}
console.log('[vercel-auto-deploy] deployed — verifying full stack…');

let apiOk = true;
if (API) { apiOk = (await postJson(API, JSON.parse(API_BODY))) === 200; }
const home = await code(`${BASE}/`);
const interpret = await code(`${BASE}/interpret`);
if (home === 200 && interpret === 200 && apiOk && (await liveBundleHas(FEATURE_RE))) {
  fs.writeFileSync(MARKER, target);
  console.log(`[vercel-auto-deploy] VERIFIED — full stack live. marker=${target.slice(0, 8)}.`);
} else {
  console.log(`[vercel-auto-deploy] deployed but verify incomplete (home=${home} interpret=${interpret} api=${apiOk ? 'ok' : 'FAIL'}) — will retry next tick.`);
}
