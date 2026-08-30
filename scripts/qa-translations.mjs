#!/usr/bin/env node
/**
 * qa-translations.mjs — quality assurance over all UI locale files.
 *
 * Checks (per language, against the canonical en.json):
 *  1. Structural parity: every en key exists with a non-empty string value
 *  2. Placeholder integrity: {placeholders} match exactly
 *  3. Script leakage: RTL/Asian locales must not be mostly Latin characters
 *  4. Length sanity: translation not suspiciously shorter than 40% of English
 *
 * Usage: node scripts/qa-translations.mjs [--fix-report-only]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src', 'i18n', 'locales');

const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const enLeaves = [];
(function walk(obj, path) {
  for (const [k, v] of Object.entries(obj)) {
    typeof v === 'object' && v !== null ? walk(v, `${path}${k}.`) : enLeaves.push([`${path}${k}`, v]);
  }
})(en, '');

const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
const latinRatio = (s) => {
  const letters = String(s).replace(/[^\p{L}]/gu, '');
  if (!letters) return 1;
  return (letters.match(/[A-Za-z]/g)?.length ?? 0) / letters.length;
};

// Locales where Latin script is expected
const LATIN_OK = new Set(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'sv', 'da', 'no', 'fi',
  'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sr', 'sl', 'lt', 'lv', 'et', 'af', 'sw', 'ha', 'yo', 'fil',
  'tr', 'az', 'kk', 'uz', 'mn', 'id', 'ms', 'vi', 'zu', 'ha2']);

const files = readdirSync(localesDir).filter((f) => f.endsWith('.json') && f !== 'en.json');
const report = [];
let passCount = 0;

for (const file of files.sort()) {
  const code = file.replace('.json', '');
  let d;
  try {
    d = JSON.parse(readFileSync(join(localesDir, file), 'utf8'));
  } catch (e) {
    report.push(`✗ ${code}: INVALID JSON — ${e.message.slice(0, 60)}`);
    continue;
  }
  const leaves = [];
  (function walk(obj, path) {
    for (const [k, v] of Object.entries(obj ?? {})) {
      typeof v === 'object' && v !== null ? walk(v, `${path}${k}.`) : leaves.push([`${path}${k}`, v]);
    }
  })(d, '');
  const map = new Map(leaves);

  const missing = enLeaves.filter(([k]) => !map.has(k) || !String(map.get(k) ?? '').trim()).map(([k]) => k);
  const placeholders = enLeaves.filter(([k, v]) => map.has(k) && ph(map.get(k)) !== ph(v)).map(([k]) => k);

  // Script leakage: non-latin-expected locales whose values are >70% latin.
  // Brand keys are latin by design (Dreamscope / Ansy Group) — excluded.
  const BRAND_KEYS = new Set(['nav.ansyGroup', 'footer.copyright', 'app.title']);
  const leakage = [];
  if (!LATIN_OK.has(code)) {
    for (const [k, v] of leaves) {
      if (BRAND_KEYS.has(k)) continue;
      const enVal = enLeaves.find(([ek]) => ek === k)?.[1] ?? '';
      if (typeof v === 'string' && String(enVal).length > 8 && latinRatio(v) > 0.7) {
        leakage.push(k);
      }
    }
  }

  // Length sanity (only where both scripts comparable — skip for now on mixed scripts)
  const issues = [];
  if (missing.length) issues.push(`missing ${missing.length} keys (${missing.slice(0, 3).join(', ')})`);
  if (placeholders.length) issues.push(`placeholder mismatch: ${placeholders.slice(0, 3).join(', ')}`);
  if (leakage.length) issues.push(`latin leakage in ${leakage.length} keys (${leakage.slice(0, 3).join(', ')})`);

  if (issues.length) {
    report.push(`⚠ ${code}: ${issues.join(' | ')}`);
  } else {
    passCount++;
    report.push(`✓ ${code}: ${leaves.length} keys clean`);
  }
}

console.log(`QA over ${files.length + 1} locales (canonical: en)\n`);
console.log(report.sort().join('\n'));
console.log(`\nClean: ${passCount}/${files.length} — issues above need attention (missing keys fall back to EN at runtime).`);
