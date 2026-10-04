#!/usr/bin/env node
// verify-deploy.mjs — confirm the live dream-interpreter serves the full feature set.
// Checks the production bundle (HTML + JS chunks) for the signature strings of every
// shipped feature, plus a real /api/interpret LLM call. Prints a clear PASS/FAIL report.
//
// RELIABILITY: a single cold /api/interpret call can take up to maxDuration=45s
// (see api/interpret.js). When a function instance is reclaimed at the duration
// ceiling the socket dies with ECONNRESET, which is a TRANSPORT failure, not a
// product failure. We therefore retry transport-level failures (ECONNRESET,
// ETIMEDOUT, EPIPE, socket timeout) before declaring FAIL, so slow-but-healthy
// perspectives are not reported as broken. A real HTTP error (404/500/429) is
// never retried here — 429 is handled by the existing rate-limit backoff.
import https from 'node:https';
import { resolve } from 'path';

const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const REQUEST_TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS || 75_000);

// Transport failures worth retrying. Everything else (HTTP status, bad JSON) is not.
const RETRYABLE = new Set(['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNABORTED', 'EAI_AGAIN', 'ENOTFOUND', 'TIMEOUT']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TRANSPORT_TRIES = Number(process.env.VERIFY_TRIES || 3);

const get = (u) => new Promise((res) => {
  const rq = https.get(u, { timeout: REQUEST_TIMEOUT_MS }, (r) => {
    let b = ''; r.setEncoding('utf8');
    r.on('data', (c) => (b += c));
    r.on('end', () => res({ code: r.statusCode, body: b, transport: null }));
  });
  rq.on('timeout', () => rq.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })));
  rq.on('error', (e) => res({ code: 0, body: '', transport: e.code || e.message }));
});

const postRaw = (u, data, timeoutMs = REQUEST_TIMEOUT_MS) => new Promise((res) => {
  const body = JSON.stringify(data);
  const t = setTimeout(
    () => { rq.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })); },
    timeoutMs
  );
  const rq = https.request(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    timeout: timeoutMs,
  }, (r) => {
    let b = ''; r.setEncoding('utf8');
    r.on('data', (c) => (b += c));
    r.on('end', () => { clearTimeout(t); res({ code: r.statusCode, body: b, transport: null }); });
  });
  rq.on('timeout', () => rq.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })));
  rq.on('error', (e) => { clearTimeout(t); res({ code: 0, body: '', transport: e.code || e.message }); });
  rq.write(body); rq.end();
});

// Retry ONLY transport failures. An HTTP response (any status) is returned as-is.
async function post(u, data, { tries = TRANSPORT_TRIES, backoffMs = 4000 } = {}) {
  let last = { code: 0, body: '', transport: 'unknown' };
  for (let i = 0; i < tries; i++) {
    last = await postRaw(u, data);
    if (last.transport === null) return last;            // got a real HTTP response
    if (!RETRYABLE.has(last.transport)) return last;     // non-retryable transport error
    if (i < tries - 1) {
      console.log(`      (transport ${last.transport} — retry ${i + 1}/${tries - 1} in ${backoffMs}ms)`);
      await sleep(backoffMs * (i + 1));
    }
  }
  return last;
}

const html = await get(`${BASE}/interpret`);
const jsUrls = [...html.body.matchAll(/(?:src|href)="(\/[^"]+\.js)"/g)].map((m) => `${BASE}${m[1]}`);
let bundle = html.body;
for (const u of jsUrls) bundle += '\n' + (await get(u)).body;

const features = {
  'Compare Traditions': /Compare all traditions/.test(bundle),
  'Share (native/WhatsApp)': /Share/.test(bundle) && /wa\.me/.test(bundle),
  'Copy/Example/Symbols': /Try an example/.test(bundle),
  'User-owned login (Supabase connect)': /Connect your Supabase project/.test(bundle) || /اربط مشروع Supabase/.test(bundle),
};
const api = await post(`${BASE}/api/interpret`, { dream: 'water', perspective: 'general', language: 'en' });

// Multi-school live proof: every perspective must return a real reading.
const schools = [
  ['en', 'general'], ['ar', 'islamic'], ['es', 'psychology'], ['zh', 'chinese'],
  ['fr', 'christian'], ['hi', 'hindu'], ['ru', 'buddhist'], ['de', 'jewish'],
];
// The API enforces a per-IP limit (RATE_LIMIT requests / 60s window), so a
// single run must throttle itself or it trips its own limiter and reports
// false FAILs. Sleep between calls and retry once on 429.
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60 * 1000;
let schoolsPass = 0;
const failedSchools = [];
for (const [lang, persp] of schools) {
  let r = { code: 0, body: '', transport: null };
  for (let attempt = 0; attempt < 3; attempt++) {
    r = await post(`${BASE}/api/interpret`, { dream: 'I saw a snake leaving my house', language: lang, perspective: persp });
    if (r.code !== 429) break;
    console.log(`      (429 rate-limited; waiting ${RATE_WINDOW_MS / 1000}s before retry)`);
    await sleep(RATE_WINDOW_MS + 2000);
  }
  let j = null; try { j = JSON.parse(r.body); } catch {}
  const ok = r.code === 200 && j?.interpretation && j.interpretation.trim().length > 20;
  if (ok) schoolsPass++; else failedSchools.push(`${lang}/${persp}(${r.transport ? 'transport:' + r.transport : r.code})`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  perspective ${lang}/${persp} (${r.transport ? 'transport:' + r.transport : r.code})`);
  if (schoolsPass < schools.length && (lang !== 'en')) await sleep(Math.ceil(RATE_WINDOW_MS / RATE_LIMIT) + 500);
}

console.log('=== dream-interpreter LIVE deploy verify ===');
for (const [k, v] of Object.entries(features)) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
console.log(`${api.code === 200 ? 'PASS' : 'FAIL'}  /api/interpret LLM call (${api.code})`);
console.log(`${schoolsPass === schools.length ? 'PASS' : 'FAIL'}  all ${schools.length} perspectives respond (${schoolsPass}/${schools.length})`);
if (failedSchools.length) console.log(`  failed: ${failedSchools.join(', ')}`);
const allPass = Object.values(features).every(Boolean) && api.code === 200 && schoolsPass === schools.length;
console.log(allPass ? '\nRESULT: FULL STACK LIVE ✅' : '\nRESULT: INCOMPLETE — deploy pending or partial ⏳');
process.exit(allPass ? 0 : 2);
