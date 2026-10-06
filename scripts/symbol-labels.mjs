/**
 * symbol-labels.mjs — the single resolver for a symbol's display labels.
 *
 * WHY THIS EXISTS (2026-10-06):
 *   Three writers each carried their OWN copy of the symbol table:
 *     - scripts/evolve.mjs            -> wrote `symbol: { key, en: key, ar: '' }`
 *     - scripts/gen-dream-today.mjs   -> a hardcoded 20-entry list
 *     - src/pages/Home.tsx            -> another hardcoded 20-entry list
 *   evolve.mjs is the cron writer, so on 2026-10-06 it shipped a live card whose
 *   Arabic label was the empty string. Home.tsx renders
 *   `{language === 'ar' ? daily.symbol.ar : daily.symbol.en}` as the card badge,
 *   so every Arabic visitor saw a BLANK tag on the site's hero "dream of the
 *   day" card. The readings were fine; only the label was broken.
 *
 *   src/symbol-names.ts is the real source of truth (146 slugs, en + ar + search
 *   aliases, and it is what the Symbols page already searches). Everything that
 *   needs a display label now asks this module, so a missing label is a loud
 *   error at build time instead of a silently blank badge in production.
 *
 * Title-cases the English label (symbol-names.ts stores canonical lowercase
 * slugs like `rain`, which read as "rain" rather than "Rain" in a card badge).
 */
import { SYMBOL_NAMES } from '../src/symbol-names.ts';

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * @param {string} key canonical slug, e.g. 'rain'
 * @returns {{ key: string, en: string, ar: string }}
 */
export function symbolLabels(key) {
  const k = String(key || '').trim().toLowerCase();
  const hit = SYMBOL_NAMES[k];
  if (!hit) {
    // Never fail silently again: a blank badge shipped unnoticed for a full day.
    throw new Error(
      `symbol-labels: unknown symbol '${key}'. Add it to src/symbol-names.ts ` +
        `before using it as a dream-of-the-day symbol.`,
    );
  }
  if (!hit.en || !hit.ar) {
    throw new Error(`symbol-labels: '${k}' has an empty en/ar label in src/symbol-names.ts`);
  }
  return { key: k, en: capitalize(hit.en), ar: hit.ar };
}

/**
 * Same as symbolLabels but never throws — for paths that must not fail hard
 * (the UI render path). Degrades to a visible em-dash placeholder rather than
 * an empty string, which is exactly the failure this module exists to prevent.
 */
export function safeSymbolLabels(key) {
  try {
    return symbolLabels(key);
  } catch {
    return { key: String(key || '').trim().toLowerCase(), en: '—', ar: '—' };
  }
}

export default symbolLabels;