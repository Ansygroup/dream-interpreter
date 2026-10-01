#!/usr/bin/env node
/**
 * _at-pending.mjs — read-only report of REAL pending i18n work per locale.
 * Mirrors translate-live.mjs pendingKeys() exactly (same flatten, same
 * placeholder check, same IDENTITY/BRAND/learned exclusions) so batching
 * below never under- or over-counts.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');
const languagesTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');

const LANG_RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
const all = [];
let m;
while ((m = LANG_RE.exec(languagesTs))) all.push({ code: m[1], english: m[2] });

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');

const IDENTITY_KEYS = new Set(['profile.noneYet', 'profile.autoSetupCmd', 'footer.copyright']);
const BRAND_KEYS = new Set(['nav.ansyGroup', 'nav.aiBlog', 'nav.faq']);

let learned = new Set();
try { learned = new Set(JSON.parse(readFileSync(join(root, 'scripts/.i18n-identity.json'), 'utf8'))); } catch {}

const flatEn = new Map(flatten(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'))));

const rows = [];
for (const l of all) {
  if (l.code === 'en' || l.code === 'ar') continue;
  let existing = null;
  try { existing = JSON.parse(readFileSync(join(localesDir, `${l.code}.json`), 'utf8')); } catch {}
  if (!existing) { rows.push({ code: l.code, english: l.english, pending: flatEn.size, missing: true }); continue; }
  const have = new Map(flatten(existing));
  let n = 0;
  for (const [k, en] of flatEn) {
    const v = have.get(k);
    const corrupt = typeof v !== 'string' || !v.trim() || ph(en) !== ph(v) || /^\s*[{[]/.test(v) || v === en;
    if (corrupt && !IDENTITY_KEYS.has(k) && !BRAND_KEYS.has(k) && !learned.has(k)) n++;
  }
  if (n) rows.push({ code: l.code, english: l.english, pending: n });
}
const total = rows.reduce((a, r) => a + r.pending, 0);
console.log(`locales_registered=${all.length} locales_with_work=${rows.length} total_pending_keys=${total}`);
for (const r of rows) console.log(`  ${r.code}\t${r.pending}\t${r.english}${r.missing ? '\t(MISSING FILE)' : ''}`);
