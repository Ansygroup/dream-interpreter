import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { LANGUAGES, resolveLanguageCode, isRtlCode, getLanguage, type LanguageInfo } from '../i18n/languages';
import en from '../i18n/locales/en.json';

type Dict = Record<string, unknown>;

/** Every locale file on disk — Vite code-splits these into lazy chunks. */
const localeModules = import.meta.glob('../i18n/locales/*.json');

const codeFromPath = (path: string): string | null =>
  path.match(/\/([a-z][a-z-]+)\.json$/i)?.[1] ?? null;

/** Languages that actually have a translation file. */
export const AVAILABLE_LANGUAGES: LanguageInfo[] = LANGUAGES.filter((l) =>
  Object.keys(localeModules).some((p) => codeFromPath(p) === l.code)
);

const COUNTRY_LANG: Record<string, string> = {
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', IQ: 'ar', JO: 'ar',
  SY: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', YE: 'ar', PS: 'ar',
  SD: 'ar', LY: 'ar', MR: 'ar', SO: 'ar', DJ: 'ar', KM: 'ar',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es',
  GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es',
  FR: 'fr', CA: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
  DE: 'de', AT: 'de', LI: 'de',
  IT: 'it', SM: 'it',
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt',
  RU: 'ru', BY: 'ru', KZ: 'kk',
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
  JP: 'ja', KR: 'ko', TR: 'tr', IN: 'hi', PK: 'ur', BD: 'bn',
  NL: 'nl', PL: 'pl', SE: 'sv', DK: 'da', NO: 'no', FI: 'fi',
  IL: 'he', IR: 'fa', AF: 'fa',
  TH: 'th', VN: 'vi', ID: 'id', MY: 'ms', PH: 'fil',
  GR: 'el', CZ: 'cs', SK: 'sk', HU: 'hu', RO: 'ro', BG: 'bg',
  HR: 'hr', RS: 'sr', SI: 'sl', UA: 'uk',
  LT: 'lt', LV: 'lv', EE: 'et',
  KE: 'sw', TZ: 'sw', UG: 'sw', ET: 'am',
  GE: 'ka', AM: 'hy', AZ: 'az', UZ: 'uz',
  NP: 'ne', LK: 'si', KH: 'km', MM: 'my', MN: 'mn',
  ZA: 'af', NG: 'ha',
};

interface I18nContextType {
  language: string;
  languageInfo: LanguageInfo;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLanguage: (lang: string) => void;
  isRtl: boolean;
  country: string | null;
  setCountry: (c: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'ds-lang';
const DEFAULT_LANGUAGE = 'en';

function lookup(dict: Dict, path: string): string | undefined {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node && typeof node === 'object' && part in (node as Dict)) {
      node = (node as Dict)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const getInitial = (): string => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedResolved = resolveLanguageCode(saved);
      if (savedResolved) return savedResolved;
      return resolveLanguageCode(navigator.language) ?? DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  };

  const [language, setLanguageState] = useState<string>(getInitial);
  const [country, setCountryState] = useState<string | null>(null);
  /** Loaded locale dictionaries. English ships in the main bundle. */
  const [dicts, setDicts] = useState<Record<string, Dict>>({ [DEFAULT_LANGUAGE]: en as Dict });

  // Keep <html lang/dir> in sync at all times, including first paint.
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRtlCode(language) ? 'rtl' : 'ltr';
  }, [language]);

  // Lazy-load the active locale bundle; t() falls back to English meanwhile.
  useEffect(() => {
    if (language === DEFAULT_LANGUAGE || dicts[language]) return;
    const loaderKey = Object.keys(localeModules).find((p) => codeFromPath(p) === language);
    if (!loaderKey) return;
    let active = true;
    localeModules[loaderKey]()
      .then((mod: unknown) => {
        if (!active) return;
        const dict = (mod as { default: Dict }).default;
        setDicts((prev) => ({ ...prev, [language]: dict }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [language, dicts]);

  // Geo-detect once on mount. Adopt the country's language as a *fallback hint*
  // only when there is no explicit saved choice. We prefer the browser's own
  // language first (strongest signal of user intent), then geo as a soft nudge.
  useEffect(() => {
    let active = true;
    fetch('/api/geo')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setCountryState(d.country || null);
        let saved: string | null = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
        if (saved) return; // explicit user choice wins, never overridden
        // Prefer browser language immediately (don't wait for agreement).
        const browserLang = resolveLanguageCode(navigator.language);
        if (browserLang) { setLanguageState(browserLang); return; }
        // Fall back to geo country language if browser lang is unresolvable.
        const geoLang = resolveLanguageCode(COUNTRY_LANG[d.country]);
        if (geoLang) setLanguageState(geoLang);
      })
      .catch(() => {
        // Network/geo failed: still apply browser language so UI isn't stuck in EN.
        const browserLang = resolveLanguageCode(navigator.language);
        if (browserLang) setLanguageState(browserLang);
      });
    return () => { active = false; };
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (!getLanguage(lang)) return;
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ }
  }, []);

  const setCountry = useCallback((c: string) => setCountryState(c), []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const raw =
      lookup(dicts[language], key) ??
      lookup(dicts[DEFAULT_LANGUAGE], key) ??
      key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
  }, [dicts, language]);

  const isRtl = isRtlCode(language);
  const languageInfo = useMemo(
    () => getLanguage(language) ?? getLanguage(DEFAULT_LANGUAGE)!,
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, languageInfo, t, setLanguage, isRtl, country, setCountry }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
