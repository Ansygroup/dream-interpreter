import { createContext, useContext, useState } from 'react';

interface I18nContextType {
  language: string;
  t: (key: string) => string;
  setLanguage: (lang: string) => void;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Default language
const DEFAULT_LANGUAGE = 'en';

// Supported languages
const SUPPORTED_LANGUAGES = [
  'en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 
  'tr', 'nl', 'pl', 'sv', 'da', 'no'
];

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Mock translations - in a real app, these would be imported from JSON files
const translations: Record<string, Record<string, string>> = {
  en: {
    'app.title': 'Dream Interpreter',
    'app.description': 'Free AI-powered dream interpreter in 17+ languages',
    'nav.home': 'Home',
    'nav.interpret': 'Interpret',
    'nav.history': 'History',
    'nav.saved': 'Saved',
    'nav.language': 'Language',
    'hero.title': 'Understand Your Dreams',
    'hero.subtitle': 'Enter your dream and get an instant interpretation powered by AI',
    'hero.placeholder': 'Describe your dream here...',
    'hero.button': 'Interpret Dream',
    'hero.example': 'Example: I dreamed I was flying over a city at night',
    'results.title': 'Dream Interpretation',
    'results.save': 'Save Interpretation',
    'results.saved': 'Saved!',
    'history.title': 'Dream History',
    'history.empty': 'No dreams recorded yet',
    'saved.title': 'Saved Interpretations',
    'saved.empty': 'No saved interpretations yet',
    'footer.about': 'About Dream Interpreter',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.contact': 'Contact Us',
    'footer.rights': 'All rights reserved.',
    'error.something': 'Something went wrong. Please try again.',
    'error.network': 'Network error. Please check your connection.',
    'error.empty': 'Please describe your dream first.',
    'modal.close': 'Close',
    'modal.confirm': 'Confirm',
    'modal.cancel': 'Cancel'
  },
  ar: {
    'app.title': 'مفسر الأحلام',
    'app.description': 'مفسر أحلام مجاني يعمل بالذكاء الاصطناعي بـ 17+ لغة',
    'nav.home': 'الرئيسية',
    'nav.interpret': 'فسر',
    'nav.history': 'السجل',
    'nav.saved': 'المحفوظات',
    'nav.language': 'اللغة',
    'hero.title': 'افهم أحلامك',
    'hero.subtitle': 'أدخل حلمك واحصل على تفسير فوري مدعوم بالذكاء الاصطناعي',
    'hero.placeholder': 'صف حلمك هنا...',
    'hero.button': 'فسر الحلم',
    'hero.example': 'مثال: حلمت أنني أطير فوق مدينة في الليل',
    'results.title': 'تفسير الحلم',
    'results.save': 'احفظ التفسير',
    'results.saved': 'تم الحفظ!',
    'history.title': 'سجل الأحلام',
    'history.empty': 'لا توجد أحلام مسجلة حتى الآن',
    'saved.title': 'التفسيرات المحفوظة',
    'saved.empty': 'لا توجد تفسيرات محفوظة بعد',
    'footer.about': 'حول مفسر الأحلام',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الخدمة',
    'footer.contact': 'اتصل بنا',
    'footer.rights': 'جميع الحقوق محفوظة.',
    'error.something': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    'error.network': 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
    'error.empty': 'يرجى وصف حلمك أولًا.',
    'modal.close': 'إغلاق',
    'modal.confirm': 'تأكيد',
    'modal.cancel': 'إلغاء'
  }
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  // Helper to get initial language from localStorage
  const getInitialLanguage = (): string => {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
    return DEFAULT_LANGUAGE;
  };

  const [language, setLanguageState] = useState<string>(getInitialLanguage);
  const [trans, setTrans] = useState<Record<string, string>>(translations[language] || translations[DEFAULT_LANGUAGE]);

  // Function to set language and update translations and localStorage
  const setLanguage = (lang: string) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      // Load translations for the selected language
      setTrans(translations[lang] || translations[DEFAULT_LANGUAGE]);
      // Update localStorage
      localStorage.setItem('i18nextLng', lang);
      // Update HTML attributes for SEO and accessibility
      document.documentElement.lang = lang;
      document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    }
  };

  // Determine if current language is RTL
  const isRtl = RTL_LANGUAGES.includes(language);

  return (
    <I18nContext.Provider value={{ language, t: (key: string) => trans[key] || key, setLanguage, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};