#!/usr/bin/env node
// Independent audit: does NOT import scripts/i18n-pending.mjs (no shared exempt set),
// so it cannot inherit that module's blind spots. Read-only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);

// --- assert the flatten itself before trusting any count derived from it ---
const enFlat = flatten(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8')));
const en = new Map(enFlat);
const paths = enFlat.map(([k]) => k);
if (new Set(paths).size !== paths.length)
  throw new Error(`flatten produced duplicate paths: ${en.size}/${paths.length} — counts are void`);
console.log(`en keys: ${en.size} (flatten asserted, no dupes)`);

const langsTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');
const codes = [...langsTs.matchAll(/code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g)]
  .filter((m) => m[1] !== 'en' && m[1] !== 'ar')
  .map((m) => ({ code: m[1], english: m[2] }));

let totalReal = 0, totalIdentical = 0, totalMissing = 0, totalDrift = 0;
const worst = [];
for (const { code, english } of codes) {
  let have;
  try { have = new Map(flatten(JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8')))); }
  catch { have = null; }
  let identical = 0, missing = 0, drift = 0;
  const same = [];
  for (const [k, v] of en) {
    const got = have?.get(k);
    if (typeof got !== 'string' || !got.trim()) { missing++; continue; }
    if (got === v) { identical++; same.push(k); }
    else {
      const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');
      if (ph(got) !== ph(v)) drift++;
    }
  }
  totalIdentical += identical; totalMissing += missing; totalDrift += drift;
  if (identical) worst.push({ code, english, identical, missing, drift, same });
  console.log(`${code}: covered ${en.size - identical - missing}/${en.size} | identicalToEN=${identical} missing=${missing} placeholderDrift=${drift}`);
}
console.log(`\nTOTAL across ${codes.length} locales x ${en.size} keys = ${codes.length * en.size} pairs`);
console.log(`  identicalToEN=${totalIdentical}  missing=${totalMissing}  placeholderDrift=${totalDrift}`);

// Cross-locale view: a genuinely locale-independent key stays EN in MOST locales.
if (worst.length) {
  console.log('\nkeys still identical to EN (per locale):');
  const byKey = new Map();
  for (const w of worst) for (const k of w.same) {
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(w.code);
  }
  for (const [k, cs] of byKey)
    console.log(`  ${k}: ${cs.length}/${codes.length} -> ${cs.join(',')}`);
} else {
  console.log('\nNo locale holds any EN-identical value. Nothing left to translate.');
}