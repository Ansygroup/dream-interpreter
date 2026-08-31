#!/usr/bin/env node
/**
 * test-live-api.mjs — REAL end-to-end check of the live interpret API.
 *
 * Calls the DEPLOYED endpoint (default https://dream-interpreter-alpha-ruddy.vercel.app)
 * across all 8 perspectives and several languages, asserting each returns a real,
 * non-empty reading. This is the "actually test it" proof the brief demands.
 *
 * Run after a deploy:  BASE_URL=https://your-site.vercel.app node scripts/test-live-api.mjs
 * Network + LLM required — NOT part of `npm test` (which is offline/fast).
 */
const BASE = process.env.BASE_URL || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const URL = `${BASE}/api/interpret`;

const cases = [
  ['en', 'general'],
  ['ar', 'islamic'],
  ['es', 'psychology'],
  ['zh', 'chinese'],
  ['fr', 'christian'],
  ['hi', 'hindu'],
  ['ru', 'buddhist'],
  ['de', 'jewish'],
];

let pass = 0, fail = 0;
console.log(`[live-api] probing ${BASE}\n`);
for (const [lang, persp] of cases) {
  try {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: 'I saw a snake leaving my house', language: lang, perspective: persp }),
    });
    const j = await r.json();
    const ok = r.status === 200 && j.interpretation && j.interpretation.trim().length > 20;
    const peek = (j.interpretation || j.error || '').replace(/\s+/g, ' ').slice(0, 64);
    if (ok) { pass++; console.log(`  PASS ${lang}/${persp} (${r.status}) — ${peek}…`); }
    else { fail++; console.log(`  FAIL ${lang}/${persp} (${r.status}) — ${peek}`); }
  } catch (e) {
    fail++;
    console.log(`  FAIL ${lang}/${persp} — network error: ${e.message}`);
  }
}
console.log(`\nLIVE API: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
