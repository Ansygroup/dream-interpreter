#!/usr/bin/env node
// verify-deploy.mjs — confirm the live dream-interpreter serves the full feature set.
// Checks the production bundle (HTML + JS chunks) for the signature strings of every
// shipped feature, plus a real /api/interpret LLM call. Prints a clear PASS/FAIL report.
import https from 'https';
import { resolve } from 'path';

const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const get = (u) => new Promise((res) => {
  https.get(u, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res({ code: r.statusCode, body: b })); })
    .on('error', () => res({ code: 0, body: '' }));
});
const post = (u, data) => new Promise((res) => {
  const body = JSON.stringify(data);
  const rq = https.request(u, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (r) => {
    let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res({ code: r.statusCode, body: b }));
  });
  rq.on('error', () => res({ code: 0, body: '' })); rq.write(body); rq.end();
});

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let schoolsPass = 0;
for (const [lang, persp] of schools) {
  let r = { code: 0, body: '' };
  for (let attempt = 0; attempt < 3; attempt++) {
    r = await post(`${BASE}/api/interpret`, { dream: 'I saw a snake leaving my house', language: lang, perspective: persp });
    if (r.code !== 429) break;
    console.log(`      (429 rate-limited; waiting ${RATE_WINDOW_MS / 1000}s before retry)`);
    await sleep(RATE_WINDOW_MS + 2000);
  }
  let j = null; try { j = JSON.parse(r.body); } catch {}
  const ok = r.code === 200 && j?.interpretation && j.interpretation.trim().length > 20;
  if (ok) schoolsPass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  perspective ${lang}/${persp} (${r.code})`);
  if (schoolsPass < schools.length && (lang !== 'en')) await sleep(Math.ceil(RATE_WINDOW_MS / RATE_LIMIT) + 500);
}

console.log('=== dream-interpreter LIVE deploy verify ===');
for (const [k, v] of Object.entries(features)) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
console.log(`${api.code === 200 ? 'PASS' : 'FAIL'}  /api/interpret LLM call (${api.code})`);
console.log(`${schoolsPass === schools.length ? 'PASS' : 'FAIL'}  all ${schools.length} perspectives respond (${schoolsPass}/${schools.length})`);
const allPass = Object.values(features).every(Boolean) && api.code === 200 && schoolsPass === schools.length;
console.log(allPass ? '\nRESULT: FULL STACK LIVE ✅' : '\nRESULT: INCOMPLETE — deploy pending or partial ⏳');
process.exit(allPass ? 0 : 2);
