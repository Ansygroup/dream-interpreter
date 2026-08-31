// Locale-aware date/time formatting that follows the APP's selected language
// (not the browser/OS locale). The brief requires dates to format per the user's
// chosen language and region.
import { getLanguage } from '../i18n/languages.ts';

const DEFAULT_LANG = 'en';

// Map our language codes to BCP-47 tags the Intl API understands. Falls back to the
// raw code; Intl ignores unknown tags gracefully (treats them as 'en').
const BCP47: Record<string, string> = {
  en: 'en-US', ar: 'ar-EG', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT',
  pt: 'pt-BR', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', tr: 'tr-TR',
  nl: 'nl-NL', pl: 'pl-PL', sv: 'sv-SE', da: 'da-DK', no: 'nb-NO', fi: 'fi-FI',
  el: 'el-GR', cs: 'cs-CZ', sk: 'sk-SK', hu: 'hu-HU', ro: 'ro-RO', bg: 'bg-BG',
  hr: 'hr-HR', sr: 'sr-RS', sl: 'sl-SI', uk: 'uk-UA', lt: 'lt-LT', lv: 'lv-LV',
  et: 'et-EE', he: 'he-IL', fa: 'fa-IR', ur: 'ur-PK', hi: 'hi-IN', bn: 'bn-BD',
  pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN', th: 'th-TH', vi: 'vi-VN', id: 'id-ID',
  ms: 'ms-MY', fil: 'fil-PH', sw: 'sw-KE', am: 'am-ET', ha: 'ha-NG', yo: 'yo-NG',
  zu: 'zu-ZA', af: 'af-ZA', ka: 'ka-GE', hy: 'hy-AM', az: 'az-AZ', kk: 'kk-KZ',
  uz: 'uz-UZ', ne: 'ne-NP', si: 'si-LK', km: 'km-KH', my: 'my-MM', mn: 'mn-MN',
};

function tag(code: string): string {
  return BCP47[code] || getLanguage(code)?.english?.slice(0, 2)?.toLowerCase() || code || DEFAULT_LANG;
}

/** Format a date per the app's selected language. */
export function formatDate(input: string | number | Date, lang = DEFAULT_LANG): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);
  try {
    return new Intl.DateTimeFormat(tag(lang), { dateStyle: 'medium' }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/** Format date + time per the app's selected language. */
export function formatDateTime(input: string | number | Date, lang = DEFAULT_LANG): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);
  try {
    return new Intl.DateTimeFormat(tag(lang), { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return d.toLocaleString();
  }
}
