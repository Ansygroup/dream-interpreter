// THROWAWAY independent audit. Must NOT import i18n-pending.mjs (shared exempt set
// would inherit the blind spot). Delete after use.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('src/i18n/locales');
const read = (c) => JSON.parse(fs.readFileSync(path.join(DIR, `${c}.json`), 'utf8'));

// CORRECT flatten: leaf returns the FULL leaf path.
const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]);

const enFlat = flat(read('en'));
const paths = enFlat.map(([k]) => k);
if (new Set(paths).size !== paths.length) {
  throw new Error(`flatten duplicate paths: ${new Set(paths).size}/${paths.length} — counts void`);
}
const en = new Map(enFlat);
console.log(`en.json keys: ${en.size} (asserted unique)`);

const codes = fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .filter((c) => c !== 'en')
  .sort();

const allEN = [];
let totalPairs = 0, missingTotal = 0;
for (const c of codes) {
  const lm = new Map(flat(read(c)));
  const enHits = [], miss = [];
  for (const [k, v] of en) {
    const lv = lm.get(k);
    if (lv === undefined) { miss.push(k); continue; }
    if (lv === v) enHits.push(k);
  }
  totalPairs += en.size; missingTotal += miss.length;
  allEN.push(...enHits.map((k) => `${c}|${k}`));
  console.log(`${c}: ${en.size - miss.length - enHits.length}/${en.size} real | EN=${enHits.length} missing=${miss.length}` +
    (enHits.length ? `  [${enHits.slice(0, 8).join(', ')}${enHits.length > 8 ? ' …' : ''}]` : '') +
    (miss.length ? `  MISSING[${miss.slice(0, 8).join(', ')}]` : ''));
}
console.log(`\nTOTAL: ${codes.length} locales, ${totalPairs} pairs, missing=${missingTotal}, EN-identical=${allEN.length}`);

// Reconcile the scoped-learn file: does any (code|key) mask an EN pair whose value
// is clearly NOT correct in that language?
const ident = JSON.parse(fs.readFileSync(path.join(DIR, '..', '..', 'scripts', '.i18n-identity.json'), 'utf8'));
const learned = ident.learned || [];
console.log(`\nlearned entries: ${learned.length} (${learned.filter((e) => e.includes('|')).length} scoped, ${learned.filter((e) => !e.includes('|')).length} bare)`);
const enSet = new Set(allEN);
for (const e of learned) {
  const masked = e.includes('|') ? (enSet.has(e) ? 1 : 0)
    : codes.filter((c) => enSet.has(`${c}|${e}`)).length;
  if (masked) console.log(`  masks-EN: ${e} -> ${masked} locale(s)`);
}