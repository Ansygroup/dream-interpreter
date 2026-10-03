// Independent coverage audit for dream-interpreter i18n.
// Rules from skill keyless-i18n-automation:
//  - .i18n-identity.json is an ARRAY of "code|key" strings -> keep verbatim, never re-normalize
//  - exempt(c,k) = IDENTITY_KEYS | BRAND_KEYS | cached.has(`${c}|${k}`)
//  - residue = EN-fallback (code,key) pairs not exempt by any of the three sets
//  - also flag: missing keys, empty values, JSON-blob corruption (/^\s*\{\s*["'\[/)
//  - 1:1 fingerprint: EN-fallback locale set === cached set => poisoned learn signature
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('src/i18n/locales');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8'));

function flatten(o, prefix = '', out = new Map()) {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else out.set(prefix, o);
  return out;
}

const en = flatten(read('en'));
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const locales = files.filter((c) => c !== 'en' && c !== 'ar');

const IDENTITY_KEYS = new Set(['profile.noneYet', 'profile.autoSetupCmd', 'footer.copyright']);
const BRAND_KEYS = new Set(['nav.ansyGroup', 'nav.aiBlog', 'nav.faq']);

let cache = [];
try { cache = JSON.parse(fs.readFileSync('scripts/.i18n-identity.json', 'utf8')); } catch {}
const cached = new Set(cache);
const exempt = (c, k) => IDENTITY_KEYS.has(k) || BRAND_KEYS.has(k) || cached.has(`${c}|${k}`);

const missing = [], empty = [], blob = [], residue = [], fingerprint = [];
const enFallbackByKey = new Map();

for (const code of locales) {
  const flat = flatten(read(code));
  for (const [k, enVal] of en) {
    const v = flat.get(k);
    if (v === undefined) { missing.push(`${code}|${k}`); continue; }
    if (typeof v === 'string' && v.trim() === '') { empty.push(`${code}|${k}`); continue; }
    if (typeof v === 'string' && /^\s*\{\s*["'[]/.test(v)) blob.push(`${code}|${k}`);
    if (v === enVal && !exempt(code, k)) {
      residue.push(`${code}|${k}`);
      if (!enFallbackByKey.has(k)) enFallbackByKey.set(k, new Set());
      enFallbackByKey.get(k).add(code);
    }
  }
}

// 1:1 fingerprint test -> poisoned identity entries
const cachedByKey = new Map();
for (const entry of cache) {
  const i = entry.lastIndexOf('|');
  if (i < 0) continue;
  const k = entry.slice(i + 1), c = entry.slice(0, i);
  if (!cachedByKey.has(k)) cachedByKey.set(k, new Set());
  cachedByKey.get(k).add(c);
}
for (const [k, enSet] of enFallbackByKey) {
  const cSet = cachedByKey.get(k);
  if (!cSet) continue;
  const same = enSet.size === cSet.size && [...enSet].every((c) => cSet.has(c));
  if (same) fingerprint.push(`  ${k} -> EN in {${[...enSet].sort().join(',')}} cached {${[...cSet].sort().join(',')}}`);
}

console.log(`Locales (non-en/ar): ${locales.length}`);
console.log(`EN source keys:      ${en.size}`);
console.log(`Missing keys:        ${missing.length}${missing.length ? ' -> ' + missing.slice(0, 10).join(', ') : ''}`);
console.log(`Empty values:        ${empty.length}${empty.length ? ' -> ' + empty.slice(0, 10).join(', ') : ''}`);
console.log(`JSON-blob corruption:${blob.length ? ' ' + blob.length : ' 0'}${blob.length ? ' -> ' + blob.slice(0, 5).join(', ') : ''}`);
console.log(`RESIDUE (enFallback not exempt): ${residue.length}${residue.length ? ' -> ' + residue.slice(0, 15).join(', ') : ''}`);
console.log(`1:1 poisoned-signature keys: ${fingerprint.length}`);
if (fingerprint.length) console.log(fingerprint.slice(0, 15).join('\n'));

const ok = missing.length === 0 && empty.length === 0 && blob.length === 0 && residue.length === 0;
console.log(`\nCoverage: ${locales.length}/${locales.length} locales complete`);
console.log(ok ? 'AUDIT: PASS' : 'AUDIT: FAIL');
process.exit(ok ? 0 : 1);