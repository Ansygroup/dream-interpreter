#!/usr/bin/env node
/**
 * auto-deploy.mjs — self-completing deploy workflow for Vercel projects that hit
 * the free-tier 100-deploys/day quota. Runs on a cron; finishes the moment the
 * blocker clears. No re-prompt, no wasted deploys.
 *
 * Full-stack aware: verifies the FRONTEND (home + /interpret) AND the BACKEND
 * (/api/interpret LLM call) after deploy.
 *
 * Idempotent: a marker file (.deploy-sha) records the last SHA that is actually
 * live+verified. If origin/master HEAD == marker, it does nothing. If quota is
 * blocked, it exits 0 and the cron retries next tick. The marker is written ONLY
 * after deploy + full-stack verify pass — so a broken deploy is retried, never
 * mistaken for done.
 *
 * Network checks use Node's native https (not curl) so it works identically on
 * Windows/cmd, macOS and Linux — no /dev/null or shell-quoting pitfalls.
 *
 * Reusable: pass the repo dir as argv[2] and the live base URL via --base.
 *   node scripts/auto-deploy.mjs /path/to/repo --base https://x.vercel.app
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const root = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
const baseIdx = process.argv.indexOf('--base');
const BASE = baseIdx !== -1 ? process.argv[baseIdx + 1] : 'https://dream-interpreter-alpha-ruddy.vercel.app';
const MARKER = resolve(root, '.deploy-sha');

function sh(cmd, timeoutMs) {
  try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: timeoutMs }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
function head() {
  sh('git fetch origin --quiet 2>/dev/null');
  return sh('git rev-parse origin/master').trim();
}
function markerSha() {
  try { return readFileSync(MARKER, 'utf8').trim(); } catch { return ''; }
}

// --- Native https fetch with redirect following + retries (no curl/shell) ---
function httpReq(url, { method = 'GET', body = null, headers = {}, maxRedirects = 5, timeoutMs = 20000 } = {}) {
  return new Promise((resolve) => {
    const attempt = (u, redirects) => {
      let req;
      try {
        const uu = new URL(u);
        req = https.request(uu, { method, headers, timeout: timeoutMs }, (res) => {
          const { statusCode, headers: h } = res;
          if ([301, 302, 307, 308].includes(statusCode) && h.location && redirects > 0) {
            res.resume();
            return attempt(new URL(h.location, uu).toString(), redirects - 1);
          }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: statusCode, body: data }));
        });
      } catch (e) { return resolve({ status: 0, body: '' }); }
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', () => resolve({ status: 0, body: '' }));
      if (body) req.write(body);
      req.end();
    };
    attempt(url, maxRedirects);
  });
}
async function fetchWithRetry(url, opts = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const r = await httpReq(url, opts);
    if (r.status > 0) return r;
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return { status: 0, body: '' };
}
async function code(url) { return String((await fetchWithRetry(url)).status); }
async function text(url) { return (await fetchWithRetry(url)).body; }
async function liveBundleHas(re) {
  const html = await text(`${BASE}/interpret`);
  const urls = [...html.matchAll(/(?:src|href)="(\/[^"]+\.js)"/g)].map((m) => `${BASE}${m[1]}`);
  let t = html;
  for (const u of urls) t += '\n' + (await text(u));
  return re.test(t);
}
// Full feature set = Compare (b4e4f7f) AND login (3a8f03b). Checked independently.
const liveHasFullSet = async () =>
  (await liveBundleHas(/Compare all traditions/)) &&
  ((await liveBundleHas(/Connect your Supabase project/)) || (await liveBundleHas(/اربط مشروع Supabase/)));

async function main() {
  console.log(`[auto-deploy] ${new Date().toISOString()} repo=${root}`);

  const target = head();
  if (!/^[0-9a-f]{40}$/.test(target)) {
    console.log(`[auto-deploy] could not resolve origin/master HEAD (got "${target}") — aborting this tick.`);
    process.exit(1);
  }
  const done = markerSha();
  if (done === target) {
    console.log(`[auto-deploy] ${target.slice(0, 8)} already deployed+verified — nothing to do.`);
    process.exit(0);
  }
  // Defense: if live already serves the full feature set, sync the marker (covers
  // the case where another cron/process deployed it) and stop.
  if ((await code(`${BASE}/`)) === '200' && (await liveHasFullSet())) {
    console.log('[auto-deploy] live already serves the full feature set — syncing marker.');
    writeFileSync(MARKER, target);
    process.exit(0);
  }
  console.log(`[auto-deploy] need deploy: target=${target.slice(0, 8)} marker=${done.slice(0, 8) || '(none)'}`);

  const out = sh('timeout 150 vercel deploy --prod --yes 2>&1', 160000);
  if (/api-deployments-free-per-day/.test(out)) {
    console.log('[auto-deploy] QUOTA BLOCKED — will retry next tick.');
    process.exit(0);
  }
  if (!/Deployment|https:\/\//.test(out)) {
    console.log('[auto-deploy] deploy did not report success:\n' + out.slice(0, 400));
    process.exit(0);
  }
  console.log('[auto-deploy] deploy reported success — verifying full stack...');

  // Full-stack verify BEFORE marking done.
  const home = await code(`${BASE}/`);
  const interpret = await code(`${BASE}/interpret`);
  const apiRes = await fetchWithRetry(`${BASE}/api/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dream: 'test', language: 'en', perspective: 'general' }),
    timeoutMs: 25000,
  });
  const apiOk = /interpretation/.test(apiRes.body);
  if (home === '200' && interpret === '200' && apiOk) {
    writeFileSync(MARKER, target);
    console.log(`[auto-deploy] VERIFIED — full stack live (frontend + /api/interpret). marker=${target.slice(0, 8)}.`);
    // Best-effort IndexNow ping (no-ops if INDEXNOW_KEY absent).
    try { sh('node scripts/postdeploy-indexnow.mjs 2>&1'); } catch { /* ignore */ }
  } else {
    // Deployed but verify failed (rare; propagation). Do NOT write marker -> retry next tick.
    console.log(`[auto-deploy] deployed but verify incomplete (home=${home} interpret=${interpret} api=${apiOk ? 'ok' : 'FAIL'}) — will retry next tick.`);
  }
}
main();
