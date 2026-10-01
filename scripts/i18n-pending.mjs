#!/usr/bin/env node
/**
 * i18n-pending.mjs — shared "what still needs translating?" detector.
 *
 * The self-completing localization loop has no natural end state: once every
 * locale is fully translated there is nothing left for a tick to do, but the
 * driver would keep re-requesting and the engine liveness probe would keep
 * reporting a dead upstream. That is a loop that can never say "done".
 *
 * This module answers one question: how many (locale, key) pairs are still
 * genuinely untranslated? When the answer is 0 the loop is COMPLETE and the
 * runner should exit 0 instead of escalating a dead-engine blocker.
 *
 * Read-only: never writes locale files.
 *
 * Rules kept in sync with scripts/translate-live.mjs (the driver):
 *   - a key is pending when the locale value is missing / empty / placeholder-
 *     drifted / a JSON blob stuffed into a string / identical to the EN source;
 *   - IDENTITY_KEYS (locale-independent tokens) and BRAND_KEYS (proper nouns)
 *     are never pending;
 *   - learned keys in scripts/.i18n-identity.json are never pending — the
 *     endpoint provably returned the source string unchanged for them.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');

export const IDENTITY_KEYS = new Set(['profile.noneYet', 'profile.autoSetupCmd', 'footer.copyright']);
export const BRAND_KEYS = new Set(['nav.ansyGroup', 'nav.aiBlog', 'nav.faq']);

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const ph = (s) => (String(s).match(/\{[\w.]+\}/g) || []).sort().join(',');

/** All non-en/ar locale codes declared in languages.ts, in file order. */
export function localeCodes() {
  const languagesTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');
  const LANG_RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
  const out = [];
  let m;
  while ((m = LANG_RE.exec(languagesTs))) if (m[1] !== 'en' && m[1] !== 'ar') out.push({ code: m[1], english: m[2] });
  return out;
}

/** Keys the endpoint has proven it returns unchanged. */
export function learnedIdentityKeys() {
  try { return new Set(JSON.parse(readFileSync(join(root, 'scripts/.i18n-identity.json'), 'utf8'))); }
  catch { return new Set(); }
}

/** Pending (locale, key) pairs, grouped per locale and sorted worst-first. */
export function pendingByLocale() {
  const flatEn = new Map(flatten(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'))));
  const learned = learnedIdentityKeys();
  const rows = [];
  for (const { code, english } of localeCodes()) {
    let have;
    try { have = new Map(flatten(JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8')))); }
    catch { have = null; }
    const pending = [];
    for (const [k, en] of flatEn) {
      if (IDENTITY_KEYS.has(k) || BRAND_KEYS.has(k) || learned.has(k)) continue;
      if (!have) { pending.push(k); continue; }
      const v = have.get(k);
      if (typeof v !== 'string' || !v.trim() || ph(en) !== ph(v) ||
          /^\s*\{\s*["'\[]/.test(v) || v === en) pending.push(k);
    }
    rows.push({ code, english, pending });
  }
  rows.sort((a, b) => b.pending.length - a.pending.length);
  return { totalKeys: flatEn.size, localeCount: rows.length, rows };
}

/** Flat count of (locale, key) pairs still needing translation. */
export function totalPending() {
  return pendingByLocale().rows.reduce((n, r) => n + r.pending.length, 0);
}