/**
 * i18n-script-audit.mjs — third blind-spot class detector.
 *
 * `i18n-pending.mjs` flags a (locale, key) pair only when `value === enValue`
 * (exact EN fallback). That predicate has TWO further blind spots, both of which
 * ship VISIBLE GARBAGE while the loop reports COMPLETE:
 *
 *   1. MINORITY SCRIPT ISLAND — a run of >=2 base characters from a script the
 *      locale does not use, e.g. a whole Russian clause inside Khmer
 *      (`km.interpret.lede`), or Georgian written with Cyrillic letters
 *      (`ka.about.p3` = "სервисი", where е/р/в/и/с are U+0435/U+0440/...).
 *   2. LATIN SPLICE inside a non-latin locale — a dropped-in foreign word
 *      (`ka.home.symbolsLede` = "სიymbolის", `sr.about.card1Body` = "призma").
 *
 * Both are `value !== en`, so no coverage count and no `v === en` check can ever
 * see them. This module is the ONLY thing that can, which is why the loop needs
 * it wired into the shared pending module.
 *
 * ── Design rules (measured; do not "simplify" these) ──────────────────────────
 * • Allowed scripts are a per-locale SET derived from THAT locale's own file,
 *   never one hand-written "dominant script" and never a hand-written
 *   per-locale allowlist. A hand-written list is a false-positive factory
 *   (measured 949 -> 5167 -> 819 phantom hits against a truth of ~21) because
 *   it silently misses Filipino/Yoruba diacritics and Ethiopic/Georgian/Sinhala,
 *   making those locales read as "no letters" and 100% broken.
 * • Minority SHARE (<=2% of that locale's own letters) handles confusable
 *   scripts with no exemption list: Bengali-in-Hindi is a tiny minority, while
 *   legitimate Bengali in the `bn` locale is the dominant share. Do NOT exempt
 *   whole confusable scripts — the Hindi/Nepali defects ARE confusable leaks.
 * • The CJK-adjacent exceptions are mandatory or correct copy gets flagged:
 *   `ko`/`ja` legitimately carry Han at a minority share (e.g.
 *   `ko.perspectives.chinese.name` = "주공(周公) – 중국").
 * • Strip placeholders / URLs / file paths / shell commands BEFORE scanning, and
 *   require a run of >=2 BASE (non-combining) chars, or `{{…}}` orphans into a
 *   bare letter and fires on all 58 locales.
 * • The latin-splice rule runs ONLY for locales whose own dominant script is
 *   non-latin. A latin word inside a latin-script locale IS the translation
 *   (measured: 6316 phantom hits when applied unconditionally).
 * • The latin rule ALSO skips single-token transliterations (a Georgian
 *   "Hindusthani" for "Hindu" is correct copy). A token is treated as a
 *   transliteration when it CONTAINS the first 4 chars of an EN-source token.
 *   This errs toward missing defects, never toward inventing them — a false
 *   positive makes the loop rewrite correct copy and ship it.
 *
 * Read-only: never writes locale files.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const localesDir = join(root, 'src/i18n/locales');

/** Unicode ranges -> script name. Only ranges this app's locales actually need. */
const BLOCKS = [
  ['Latin', 0x0000, 0x024f], ['LatinExt', 0x1e00, 0x1eff],
  ['Greek', 0x0370, 0x03ff], ['Cyrillic', 0x0400, 0x04ff],
  ['CyrillicExt', 0x0500, 0x052f], ['Armenian', 0x0530, 0x058f],
  ['Hebrew', 0x0590, 0x05ff], ['Arabic', 0x0600, 0x06ff],
  ['Devanagari', 0x0900, 0x097f], ['Bengali', 0x0980, 0x09ff],
  ['Gurmukhi', 0x0a00, 0x0a7f], ['Gujarati', 0x0a80, 0x0aff],
  ['Oriya', 0x0b00, 0x0b7f], ['Tamil', 0x0b80, 0x0bff],
  ['Telugu', 0x0c00, 0x0c7f], ['Kannada', 0x0c80, 0x0cff],
  ['Malayalam', 0x0d00, 0x0d7f], ['Sinhala', 0x0d80, 0x0dff],
  ['Thai', 0x0e00, 0x0e7f], ['Lao', 0x0e80, 0x0eff],
  ['Tibetan', 0x0f00, 0x0fff], ['Myanmar', 0x1000, 0x109f],
  ['Georgian', 0x10a0, 0x10ff], ['Ethiopic', 0x1200, 0x137f],
  ['Cherokee', 0x13a0, 0x13ff], ['Khmer', 0x1780, 0x17ff],
  ['Mongolian', 0x1800, 0x18af], ['GreekExt', 0x1f00, 0x1fff],
  ['Hangul', 0xac00, 0xd7af], ['Han', 0x4e00, 0x9fff],
  ['Hiragana', 0x3040, 0x309f], ['Katakana', 0x30a0, 0x30ff],
  ['Fullwidth', 0xff00, 0xffef],
];

/** Latin-script tokens that legitimately stay latin inside a translated string. */
const TECH_WORDS = new Set([
  'google', 'supabase', 'browser', 'server', 'local', 'storage', 'ctrl', 'enter',
  'cmd', 'shift', 'alt', 'tab', 'esc', 'api', 'url', 'http', 'https', 'com',
  'node', 'mjs', 'env', 'xxx', 'ok', 'kbd', 'oauth', 'client', 'anon', 'key',
]);

const blockOf = (cp) => {
  for (const [name, lo, hi] of BLOCKS) if (cp >= lo && cp <= hi) return name;
  return null;
};
const isBase = (cp) => !(cp >= 0x0300 && cp <= 0x036f);

/** Remove placeholders, URLs, file paths, env assignments and key glyphs. */
const strip = (s) => String(s)
  .replace(/\{\{[^}]*\}\}|\{[\w.]+\}/g, ' ')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[\w./\\-]*\.(mjs|cjs|js|json|ts|tsx)/g, ' ')
  .replace(/[A-Z_]{4,}=[\w.\-]+/g, ' ')
  .replace(/&[a-z]+;/g, ' ')
  .replace(/[⌘⏎↵]/g, ' ');

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);

/** Scripts legitimately present at a minority share in these locales. */
const EXTRA_ALLOWED = {
  ko: ['Han'], ja: ['Han', 'Fullwidth'], zh: ['Han', 'Fullwidth'],
  th: ['Lao'], lo: ['Thai'],
};

/**
 * Build the per-locale script allow-set from the locale's OWN file.
 * Returns null when the file has no countable letters — that locale is skipped
 * rather than silently exempted wholesale.
 */
export function allowedScripts(leaves) {
  const tally = {};
  for (const [, v] of leaves) {
    for (const ch of strip(v)) {
      const cp = ch.codePointAt(0);
      if (!isBase(cp)) continue;
      const b = blockOf(cp);
      if (b) tally[b] = (tally[b] || 0) + 1;
    }
  }
  const sum = Object.values(tally).reduce((a, b) => a + b, 0);
  if (!sum) return null;
  const set = new Set(Object.entries(tally).filter(([, n]) => n / sum > 0.02).map(([b]) => b));
  return set;
}

/**
 * Defective (key -> reason) pairs for one locale.
 * `leaves` is the locale's flattened [key, value] pairs; `enLeaves` the source's.
 */
export function localeDefects(code, leaves, enLeaves) {
  const allowed = allowedScripts(leaves);
  if (!allowed) return [];
  for (const extra of EXTRA_ALLOWED[code] || []) allowed.add(extra);
  // "dominant latin" = every allowed block is a Latin variant.
  const dominantLatin = [...allowed].every((b) => b.startsWith('Latin'));
  // Seed the EN token set so brand/tech words in the source pass the latin rule.
  const enTokens = new Set();
  for (const [, v] of enLeaves)
    for (const w of strip(v).match(/[A-Za-z]{2,}/g) || []) enTokens.add(w.toLowerCase());

  const bad = [];
  for (const [k, v] of leaves) {
    if (typeof v !== 'string') continue;
    const s = strip(v);
    let reason = null;

    // (1) minority script island: >=2 base chars from a script outside the set
    let run = '', runBlock = null;
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      if (!isBase(cp)) { run = ''; continue; }
      const b = blockOf(cp);
      if (!b || allowed.has(b)) { run = ''; continue; }
      if (b === runBlock) run += ch; else { runBlock = b; run = ch; }
      if ([...run].length >= 2) { reason = `script-island:${runBlock}`; break; }
    }

    // (2) latin splice inside a non-latin locale
    //
    // FUSION is the discriminator: a Latin run glued to a NON-LATIN LETTER is a
    // splice ("სიymbolის", "ჩას pastოთ", "Дубinska", "призma"), whereas a Latin
    // run standing as its own word is usually a transliteration, which is
    // CORRECT copy ("Hindusthani" for "Hindu"). Requiring >=2 letters keeps a
    // 1-char artifact from firing.
    //
    // The EN-token/tech allowlist is checked FIRST and applies to BOTH shapes.
    // Skipping it for fused tokens is what turns this into a false-positive
    // factory: every brand legitimately fuses with the target script
    // ("Dreamscopeについて", "Ibn Sirin의 고전 학파", "Ψυχολογία (Jung)"), and
    // those tokens ARE in the EN source.
    // Punctuation must NOT count as fusion — `(Jung)` is a parenthesised
    // brand, not a splice.
    if (!reason && !dominantLatin) {
      const re = /([^\p{Script=Latin}\s]?)([A-Za-z]{2,})([^\p{Script=Latin}\s]?)/gu;
      let mt;
      while ((mt = re.exec(s)) !== null) {
        const [, before, word, after] = mt;
        const lw = word.toLowerCase();
        if (TECH_WORDS.has(lw)) continue;
        if (enTokens.has(lw) || enTokens.has(lw.replace(/s$/, ''))) continue;
        // Punctuation neighbours are not fusion; require a real LETTER.
        const gluedToLetter = (ch) => !!ch && /[^\p{Script=Latin}\p{P}\p{S}\s]/u.test(ch);
        if (!gluedToLetter(before) && !gluedToLetter(after)) {
          // standalone token — transliteration guard: "hindusthani" ~ "hindu"
          if ([...enTokens].some((t) => t.length >= 4 && lw.includes(t.slice(0, 4)))) continue;
        }
        reason = `latin-splice:${word}`;
        break;
      }
    }
    if (reason) bad.push({ key: k, reason });
  }
  return bad;
}

/** Repo-wide (code, key, reason) defects. Read-only. */
export function allDefects() {
  const enLeaves = flatten(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8')));
  const out = [];
  for (const { code } of localeCodesPublic()) {
    let leaves;
    try { leaves = flatten(JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8'))); }
    catch { continue; }
    for (const d of localeDefects(code, leaves, enLeaves)) out.push({ code, ...d });
  }
  return out;
}

// Local copy of the locale list so this module has no import cycle with
// i18n-pending.mjs (which imports THIS module).
function localeCodesPublic() {
  const languagesTs = readFileSync(join(root, 'src/i18n/languages.ts'), 'utf8');
  const RE = /code: '([a-z-]+)', native: '[^']*', english: '([^']+)', dir: '(ltr|rtl)'/g;
  const out = [];
  let m;
  while ((m = RE.exec(languagesTs)))
    if (m[1] !== 'en' && m[1] !== 'ar') out.push({ code: m[1], english: m[2] });
  return out;
}
