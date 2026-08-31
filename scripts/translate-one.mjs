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

async function translateOne(code, key, value, context) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await fetch(`${base}/api/translate-one`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, key, value, context }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) { await sleep(2000 * attempt); continue; }
      const data = await r.json();
      if (!data?.translation) { await sleep(2000 * attempt); continue; }
      // Placeholder sanity
      if (ph(value) !== ph(data.translation)) {
        console.log(`   ⚠ ${key}: placeholder mismatch, retrying`);
        await sleep(1500);
        continue;
      }
      return data.translation;
    } catch (e) {
      await sleep(2000 * attempt);
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
    // Skip if already real-translated and placeholder matches
    if (existingFlat.has(key)) {
      const v = existingFlat.get(key);
      const isReal = typeof v === 'string' && v.trim() && !v.trim().startsWith('Free AI dream') && v.trim() !== '';
      if (isReal && ph(v) === ph(value)) { skipped++; continue; }
    }
    const t = await translateOne(code, key, value, `Section: ${key.split('.')[0]}`);
    if (t) { existingFlat.set(key, t); done++; }
    else { failed++; }
    if ((done + failed) % 25 === 0) {
      // Periodic save
      const partial = unflatten([...existingFlat.entries()]);
      writeFileSync(outPath, JSON.stringify(partial, null, 2) + '\n', 'utf8');
      console.log(`   …${done} done, ${failed} failed (saved partial)`);
    }
    await sleep(120); // gentle pacing
  }
  const final = unflatten([...existingFlat.entries()]);
  writeFileSync(outPath, JSON.stringify(final, null, 2) + '\n', 'utf8');
  console.log(`✓ ${code}: ${done} translated, ${skipped} already done, ${failed} failed`);
}
