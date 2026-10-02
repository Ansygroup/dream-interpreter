#!/usr/bin/env node
// Coverage + placeholder + corruption audit across every locale vs en.json.
// Also applies the culture-bias scan on MARKETING keys as a separate gate.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'src/i18n/locales');

const flatten = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o || {})) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};
const ph = (s) => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(',');
// A JSON-blob-looking value = quote/bracket immediately after the brace.
// NOT value.startsWith('{') — placeholder-leading translations are legit.
const looksLikeBlob = (v) => /^\s*\{\s*["'[]/.test(String(v));

const en = flatten(JSON.parse(fs.readFileSync(path.join(DIR, 'en.json'), 'utf8')));
const enKeys = Object.keys(en).sort();
// Founder name is LEGIT in the named islamic school keys only
// (perspectives.islamic.name / perspDesc.islamic) — same carve-out the
// repo's own test-suite.mjs section 11 + 12 use. A whole-file scan
// false-positives on those two keys in 33 locales.
const ALLOWED_KEYS = new Set(['perspectives.islamic.name', 'perspDesc.islamic']);
const MKT = /tagline|heroLede|feature3Body|feature4Body|sampleReading|sampleTag3|ctaLede|about\.p1|about\.card1Title|about\.card1Body|faq\.a1/i;
const MARKS = /ibn sirin|ابن سيرين|ابن سرين/i;

const rows = [];
const issues = [];
for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()) {
  const code = f.replace(/\.json$/, '');
  if (code === 'en' || code === 'ar') continue;
  let raw, obj;
  try { raw = fs.readFileSync(path.join(DIR, f), 'utf8'); }
  catch (e) { issues.push(`${code}: UNREADABLE ${e.message}`); continue; }
  try { obj = JSON.parse(raw); }
  catch (e) { issues.push(`${code}: INVALID JSON — ${e.message}`); continue; }

  const flat = flatten(obj);
  const keys = Object.keys(flat);
  const missing = enKeys.filter((k) => !(k in flat));
  const extra = keys.filter((k) => !(k in en));
  const empty = keys.filter((k) => {
    const v = flat[k];
    return v == null || String(v).trim() === '' || String(v).trim() === '{}';
  });
  const blobbed = keys.filter((k) => looksLikeBlob(flat[k]));
  const phBad = keys.filter((k) => k in en && ph(en[k]) !== ph(flat[k]));
  const same = keys.filter((k) => k in en && String(flat[k]) === String(en[k]));
  const pctSame = keys.length ? +(100 * same.length / keys.length).toFixed(1) : 0;

  const bias = keys.filter((k) => !ALLOWED_KEYS.has(k) && MKT.test(k) && MARKS.test(String(flat[k])));

  rows.push({ code, keys: keys.length, missing: missing.length, extra: extra.length,
    empty: empty.length, blobbed: blobbed.length, phBad: phBad.length, pctSame,
    bias: bias.length });

  if (missing.length) issues.push(`${code}: ${missing.length} MISSING keys e.g. ${missing.slice(0,3).join(', ')}`);
  if (empty.length) issues.push(`${code}: ${empty.length} EMPTY e.g. ${empty.slice(0,3).join(', ')}`);
  if (blobbed.length) issues.push(`${code}: ${blobbed.length} JSON-BLOB value e.g. ${blobbed.slice(0,3).join(', ')}`);
  if (phBad.length) issues.push(`${code}: ${phBad.length} PLACEHOLDER mismatch e.g. ${phBad.slice(0,3).join(', ')}`);
  if (bias.length) issues.push(`${code}: CULTURE-BIAS founder name in ${bias.join(', ')}`);
  if (pctSame > 35) issues.push(`${code}: ${pctSame}% still byte-identical to en`);
}

console.log(`en.json leaf keys: ${enKeys.length}`);
console.log('code  keys  missing  extra  empty  blob  phBad  %=en  bias');
for (const r of rows) {
  console.log(
    `${r.code.padEnd(6)}${String(r.keys).padStart(4)}${String(r.missing).padStart(9)}` +
    `${String(r.extra).padStart(7)}${String(r.empty).padStart(7)}${String(r.blobbed).padStart(7)}` +
    `${String(r.phBad).padStart(7)}${String(r.pctSame).padStart(7)}${String(r.bias).padStart(6)}`
  );
}
console.log(`\nlocales audited: ${rows.length}`);
if (issues.length) { console.log('\nISSUES:'); issues.forEach((i) => console.log(' - ' + i)); process.exit(1); }
console.log('\nCLEAN: 0 issues across all locales.');
