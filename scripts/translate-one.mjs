#!/usr/bin/env node
/**
 * translate-one.mjs — KEYLESS, key-by-key UI localization for stubborn languages.
 *
 * Uses /api/translate-one (server-side key) to translate each flat key
 * individually. Bypasses the chunked-merge 502 ceiling for languages like
 * Greek/Khmer/Lithuanian that the free OpenRouter models choke on as a
 * single large batch.
 *
 * Robust: 5 retries per key, writes partial progress so a crash doesn't
 * lose work. Skip already-translated keys.
 *
 * Usage: node scripts/translate-one.mjs --only=el,km,lt
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.BASE || 'https://dream-interpreter-alpha-ruddy.vercel.app';
const localesDir = join(root, 'src', 'i18n', 'locales');

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());
const base = args.find((a) => a.startsWith('--base='))?.split('=')[1] || BASE;
const fast = args.includes('--fast');

const source = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const unflatten = (pairs) => {
  const out = {};
  for (const [path, value] of pairs) {
    const parts = path.split('.');
    let node = out;
    while (parts.length > 1) { const p = parts.shift(); node[p] = (node[p] && typeof node[p] === 'object') ? node[p] : {}; node = node[p]; }
    node[parts[0]] = value;
  }
  return out;
};
const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const flat = flatten(source);
const targets = only && only.length
  ? only.filter((c) => c !== 'en' && c !== 'ar')
  : flat.map(() => '').concat(); // noop default; require --only

async function translateOne(code, key, value, context, fast) {
  const maxAttempts = fast ? 2 : 5;
  const fetchTimeout = fast ? 5000 : 25000;
  const retrySleep = fast ? 300 : 2000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const r = await fetch(`${base}/api/translate-one`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, key, value, context }),
        signal: AbortSignal.timeout(fetchTimeout),
      });
      if (!r.ok) { await sleep(retrySleep * attempt); continue; }
      const data = await r.json();
      if (!data?.translation) { await sleep(retrySleep * attempt); continue; }
      // Placeholder sanity
      if (ph(value) !== ph(data.translation)) {
        if (fast) return null; // in fast mode, skip on placeholder mismatch
        console.log(`   ⚠ ${key}: placeholder mismatch, retrying`);
        await sleep(1500);
        continue;
      }
      return data.translation;
    } catch (e) {
      await sleep(retrySleep * attempt);
    }
  }
  return null;
}

for (const code of targets) {
  const outPath = join(localesDir, `${code}.json`);
  let existing = {};
  try { existing = JSON.parse(readFileSync(outPath, 'utf8')); } catch {}
  const existingFlat = new Map(flatten(existing));

  console.log(`→ ${code} (key-by-key, ${flat.length} keys, ${existingFlat.size} already done)`);
  let done = 0, failed = 0, skipped = 0;
  for (const [key, value] of flat) {
    // Skip already-translated keys. Also skip keys whose stored value is identical to
    // the EN source (still untranslated) OR whose value was previously identified as an
    // untranslatable token (brand name, copyright, em-dash, short symbol, tech command)
    // so we don't hammer the API for identity returns on every re-run.
    if (existingFlat.has(key)) {
      const v = existingFlat.get(key);
      const isFallback = v === value;
      const isReal = typeof v === 'string' && v.trim() && !isFallback && v.trim() !== '';
      // unauthocratically untranslatable tokens (brand, copyright, em-dash, short token, tech cmd)
      const looksUntranslatable = (
        v.trim().length <= 3 ||
        v.trim().startsWith('©') ||
        v.trim().startsWith('SUPABASE_ACCESS_TOKEN') ||
        /^[A-Z][a-z0-9 ]+ [A-Z][a-z0-9]+$/.test(v.trim())  // "AI Blog", "Home Page", "Free Dreams"
      );
      if (isReal && ph(v) === ph(value)) { skipped++; continue; }
      if (looksUntranslatable) { skipped++; continue; }
    }
    const t = await translateOne(code, key, value, `Section: ${key.split('.')[0]}`, fast);
    if (t) {
      // API returned identity (same as source) for untranslatable tokens like brand
      // names, copyright notices, em-dashes, or technical commands — accept as done
      // so we don't loop forever on every re-run. Still count it as translated.
      existingFlat.set(key, t);
      done++;
      if (t === value) console.log(`   ℹ ${key}: API returned source identically (untranslatable token), accepted`);
    }
    else { failed++; }
    if ((done + failed) % 25 === 0) {
      // Periodic save
      const partial = unflatten([...existingFlat.entries()]);
      writeFileSync(outPath, JSON.stringify(partial, null, 2) + '\n', 'utf8');
      console.log(`   …${done} done, ${failed} failed (saved partial)`);
    }
    await sleep(fast ? 20 : 120); // gentle pacing (fast: 20ms, normal: 120ms)
  }
  const final = unflatten([...existingFlat.entries()]);
  writeFileSync(outPath, JSON.stringify(final, null, 2) + '\n', 'utf8');
  console.log(`✓ ${code}: ${done} translated, ${skipped} already done, ${failed} failed`);
}
