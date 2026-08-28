import { createContext, useContext, useState, useEffect } from 'react';

interface I18nContextType {
  language: string;
  t: (key: string) => string;
  setLanguage: (lang: string) => void;
  isRtl: boolean;
  country: string | null;
  setCountry: (c: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const DEFAULT_LANGUAGE = 'en';

// Full supported language list (27)
export const SUPPORTED_LANGUAGES = [
  'en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko',
  'tr', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'he', 'hi', 'th', 'vi',
  'id', 'ms', 'el', 'cs', 'hu', 'ro', 'sk', 'uk', 'bg', 'hr', 'lt', 'lv', 'et', 'sl'
];

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Country → language (ISO alpha-2)
export const COUNTRY_LANG: Record<string, string> = {
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', IQ: 'ar', JO: 'ar',
  SY: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', YE: 'ar', PS: 'ar',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es',
  FR: 'fr', CA: 'fr', BE: 'fr', CH: 'fr', LU: 'fr',
  DE: 'de', AT: 'de', LI: 'de',
  IT: 'it', BR: 'pt', PT: 'pt', RU: 'ru', CN: 'zh', TW: 'zh', HK: 'zh',
  JP: 'ja', KR: 'ko', TR: 'tr', IN: 'hi', NL: 'nl', PL: 'pl', SE: 'sv',
  DK: 'da', NO: 'no', FI: 'fi', IL: 'he', TH: 'th', VN: 'vi', ID: 'id',
  MY: 'ms', GR: 'el', CZ: 'cs', HU: 'hu', RO: 'ro', SK: 'sk', UA: 'uk',
  BG: 'bg', HR: 'hr', LT: 'lt', LV: 'lv', EE: 'et', SI: 'sl',
};

// UI strings (minimal — SEO pages carry their own copy)
const translations: Record<string, Record<string, string>> = {
  en: {
    'app.title': 'Dreamscope',
    'nav.home': 'Home', 'nav.interpret': 'Interpret', 'nav.history': 'History', 'nav.saved': 'Saved',
    'hero.title': 'What your subconscious is trying to say',
    'hero.subtitle': 'Ancient symbolism, modern psychology, and AI — combined into one clear reading.',
    'hero.button': 'Interpret a Dream', 'hero.browse': 'Browse Symbols',
    'history.title': 'Dream history', 'history.empty': 'No dreams interpreted yet.',
    'saved.title': 'Saved dreams', 'saved.empty': 'Nothing saved yet.',
    'error.empty': 'Please describe your dream first.',
    'error.network': 'Connection error. Please try again.',
  },
  ar: {
    'app.title': 'دريم سكوب',
    'nav.home': 'الرئيسية', 'nav.interpret': 'فسر', 'nav.history': 'السجل', 'nav.saved': 'المحفوظات',
    'hero.title': 'ماذا يحاول عقلك الباطن أن يقول',
    'hero.subtitle': 'رموز قديمة وعلم نفس حديث وذكاء اصطناعي — في قراءة واحدة واضحة.',
    'hero.button': 'فسر حلمك', 'hero.browse': 'تصفح الرموز',
    'history.title': 'سجل الأحلام', 'history.empty': 'لا توجد أحلام مفسرة بعد.',
    'saved.title': 'الأحلام المحفوظة', 'saved.empty': 'لا شيء محفوظ بعد.',
    'error.empty': 'يرجى وصف حلمك أولاً.',
    'error.network': 'خطأ في الاتصال. حاول مرة أخرى.',
  },
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const getInitial = (): string => {
    const saved = localStorage.getItem('ds-lang');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    return DEFAULT_LANGUAGE;
  };

  const [language, setLanguageState] = useState<string>(getInitial);
  const [country, setCountryState] = useState<string | null>(null);

  // Geo-detect once on mount
  useEffect(() => {
    let active = true;
    fetch('/api/geo')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setCountryState(d.country || null);
        // If user has no saved preference, adopt country language
        if (!localStorage.getItem('ds-lang') && d.country && COUNTRY_LANG[d.country]) {
          setLanguage(COUNTRY_LANG[d.country]);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const setLanguage = (lang: string) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('ds-lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    }
  };

  const setCountry = (c: string) => setCountryState(c);

  const isRtl = RTL_LANGUAGES.includes(language);

  return (
    <I18nContext.Provider value={{ language, t: (key: string) => translations[language]?.[key] || translations.en[key] || key, setLanguage, isRtl, country, setCountry }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
