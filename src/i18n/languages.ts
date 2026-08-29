/**
 * Single source of truth for every language Dreamscope supports.
 * UI translations live in src/i18n/locales/{code}.json — a language is only
 * listed here once its locale file exists.
 */

export interface LanguageInfo {
  code: string;
  /** Language name written in the language itself */
  native: string;
  /** Language name in English */
  english: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', native: 'English', english: 'English', dir: 'ltr' },
  { code: 'ar', native: 'العربية', english: 'Arabic', dir: 'rtl' },
  { code: 'es', native: 'Español', english: 'Spanish', dir: 'ltr' },
  { code: 'fr', native: 'Français', english: 'French', dir: 'ltr' },
  { code: 'de', native: 'Deutsch', english: 'German', dir: 'ltr' },
  { code: 'it', native: 'Italiano', english: 'Italian', dir: 'ltr' },
  { code: 'pt', native: 'Português', english: 'Portuguese', dir: 'ltr' },
  { code: 'ru', native: 'Русский', english: 'Russian', dir: 'ltr' },
  { code: 'zh', native: '中文', english: 'Chinese', dir: 'ltr' },
  { code: 'ja', native: '日本語', english: 'Japanese', dir: 'ltr' },
  { code: 'ko', native: '한국어', english: 'Korean', dir: 'ltr' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish', dir: 'ltr' },
  { code: 'nl', native: 'Nederlands', english: 'Dutch', dir: 'ltr' },
  { code: 'pl', native: 'Polski', english: 'Polish', dir: 'ltr' },
  { code: 'sv', native: 'Svenska', english: 'Swedish', dir: 'ltr' },
  { code: 'da', native: 'Dansk', english: 'Danish', dir: 'ltr' },
  { code: 'no', native: 'Norsk', english: 'Norwegian', dir: 'ltr' },
  { code: 'fi', native: 'Suomi', english: 'Finnish', dir: 'ltr' },
  { code: 'el', native: 'Ελληνικά', english: 'Greek', dir: 'ltr' },
  { code: 'cs', native: 'Čeština', english: 'Czech', dir: 'ltr' },
  { code: 'sk', native: 'Slovenčina', english: 'Slovak', dir: 'ltr' },
  { code: 'hu', native: 'Magyar', english: 'Hungarian', dir: 'ltr' },
  { code: 'ro', native: 'Română', english: 'Romanian', dir: 'ltr' },
  { code: 'bg', native: 'Български', english: 'Bulgarian', dir: 'ltr' },
  { code: 'hr', native: 'Hrvatski', english: 'Croatian', dir: 'ltr' },
  { code: 'sr', native: 'Српски', english: 'Serbian', dir: 'ltr' },
  { code: 'sl', native: 'Slovenščina', english: 'Slovenian', dir: 'ltr' },
  { code: 'uk', native: 'Українська', english: 'Ukrainian', dir: 'ltr' },
  { code: 'lt', native: 'Lietuvių', english: 'Lithuanian', dir: 'ltr' },
  { code: 'lv', native: 'Latviešu', english: 'Latvian', dir: 'ltr' },
  { code: 'et', native: 'Eesti', english: 'Estonian', dir: 'ltr' },
  { code: 'he', native: 'עברית', english: 'Hebrew', dir: 'rtl' },
  { code: 'fa', native: 'فارسی', english: 'Persian', dir: 'rtl' },
  { code: 'ur', native: 'اردو', english: 'Urdu', dir: 'rtl' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', dir: 'ltr' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', dir: 'ltr' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', dir: 'ltr' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', dir: 'ltr' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', dir: 'ltr' },
  { code: 'th', native: 'ไทย', english: 'Thai', dir: 'ltr' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese', dir: 'ltr' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian', dir: 'ltr' },
  { code: 'ms', native: 'Bahasa Melayu', english: 'Malay', dir: 'ltr' },
  { code: 'fil', native: 'Filipino', english: 'Filipino', dir: 'ltr' },
  { code: 'sw', native: 'Kiswahili', english: 'Swahili', dir: 'ltr' },
  { code: 'am', native: 'አማርኛ', english: 'Amharic', dir: 'ltr' },
  { code: 'ha', native: 'Hausa', english: 'Hausa', dir: 'ltr' },
  { code: 'yo', native: 'Yorùbá', english: 'Yoruba', dir: 'ltr' },
  { code: 'zu', native: 'isiZulu', english: 'Zulu', dir: 'ltr' },
  { code: 'af', native: 'Afrikaans', english: 'Afrikaans', dir: 'ltr' },
  { code: 'ka', native: 'ქართული', english: 'Georgian', dir: 'ltr' },
  { code: 'hy', native: 'Հայերեն', english: 'Armenian', dir: 'ltr' },
  { code: 'az', native: 'Azərbaycan', english: 'Azerbaijani', dir: 'ltr' },
  { code: 'kk', native: 'Қазақша', english: 'Kazakh', dir: 'ltr' },
  { code: 'uz', native: 'Oʻzbekcha', english: 'Uzbek', dir: 'ltr' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali', dir: 'ltr' },
  { code: 'si', native: 'සිංහල', english: 'Sinhala', dir: 'ltr' },
  { code: 'km', native: 'ខ្មែរ', english: 'Khmer', dir: 'ltr' },
  { code: 'my', native: 'မြန်မာ', english: 'Burmese', dir: 'ltr' },
  { code: 'mn', native: 'Монгол', english: 'Mongolian', dir: 'ltr' },
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

export const getLanguage = (code: string): LanguageInfo | undefined => byCode.get(code);

export const isRtlCode = (code: string): boolean => getLanguage(code)?.dir === 'rtl';

/**
 * Resolve a raw locale tag (e.g. 'en-US', 'pt_BR', 'nb', 'iw') to a supported
 * language code, or null when unsupported.
 */
const ALIASES: Record<string, string> = {
  nb: 'no',
  nn: 'no',
  iw: 'he',
  in: 'id',
  tl: 'fil',
  'zh-hans': 'zh',
  'zh-hant': 'zh',
};

export const resolveLanguageCode = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (byCode.has(lower)) return lower;
  const aliased = ALIASES[lower];
  if (aliased) return aliased;
  const base = lower.split(/[-_]/)[0];
  if (byCode.has(base)) return base;
  return ALIASES[base] ?? null;
};
