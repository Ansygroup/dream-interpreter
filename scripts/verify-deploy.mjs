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
let schoolsPass = 0;
for (const [lang, persp] of schools) {
  const r = await post(`${BASE}/api/interpret`, { dream: 'I saw a snake leaving my house', language: lang, perspective: persp });
  let j = null; try { j = JSON.parse(r.body); } catch {}
  const ok = r.code === 200 && j?.interpretation && j.interpretation.trim().length > 20;
  if (ok) schoolsPass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  perspective ${lang}/${persp} (${r.code})`);
}

console.log('=== dream-interpreter LIVE deploy verify ===');
for (const [k, v] of Object.entries(features)) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
console.log(`${api.code === 200 ? 'PASS' : 'FAIL'}  /api/interpret LLM call (${api.code})`);
console.log(`${schoolsPass === schools.length ? 'PASS' : 'FAIL'}  all ${schools.length} perspectives respond (${schoolsPass}/${schools.length})`);
const allPass = Object.values(features).every(Boolean) && api.code === 200 && schoolsPass === schools.length;
console.log(allPass ? '\nRESULT: FULL STACK LIVE ✅' : '\nRESULT: INCOMPLETE — deploy pending or partial ⏳');
process.exit(allPass ? 0 : 2);
