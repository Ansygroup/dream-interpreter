import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function Interpret() {
  const { t, language, setLanguage } = useI18n();
  const [dream, setDream] = useState('');
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(language) ? 'rtl' : 'ltr';
  }, [language]);

  const saveToLocalStorage = (dreamEntry: any) => {
    const dreams = JSON.parse(localStorage.getItem('dreams') || '[]');
    dreams.push(dreamEntry);
    localStorage.setItem('dreams', JSON.stringify(dreams));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dream.trim()) {
      setError(t('error.empty'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream, language }),
      });
      if (!response.ok) throw new Error('Failed to interpret dream');
      const data = await response.json();
      setInterpretation(data.interpretation);
      const dreamEntry = {
        id: Date.now().toString(),
        dream,
        language,
        interpretation: data.interpretation,
        timestamp: new Date().toISOString(),
        saved: false
      };
      saveToLocalStorage(dreamEntry);
      setTimeout(() => {
        const resultsEl = document.getElementById('results');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || t('error.something'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDream('');
    setInterpretation(null);
    setError(null);
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', ar: 'العربية', es: 'Español', fr: 'Français',
    de: 'Deutsch', it: 'Italiano', pt: 'Português', ru: 'Русский',
    zh: '中文', ja: '日本語', ko: '한국어', tr: 'Türkçe',
    nl: 'Nederlands', pl: 'Polski', sv: 'Svenska', da: 'Dansk', no: 'Norsk'
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 dark">
      <div className="fixed top-4 right-4 z-50">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-cosmic-800/50 backdrop-blur-sm text-white border border-cosmic-600/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cosmic-400"
        >
          {['en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'tr', 'nl', 'pl', 'sv', 'da', 'no'].map(lang => (
            <option key={lang} value={lang}>{LANGUAGE_NAMES[lang]}</option>
          ))}
        </select>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <Link to="/" className="inline-flex items-center text-cosmic-300 hover:text-cosmic-200 mb-6">
            <span className="mr-2">←</span>
            <span>{t('nav.home')}</span>
          </Link>
          <h1 className="text-4xl font-display text-white mb-4">{t('hero.title')}</h1>
          <p className="text-xl text-cosmic-200 max-w-3xl">{t('hero.subtitle')}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="dream" className="block text-sm font-medium text-white mb-2">
              {t('hero.placeholder')}
            </label>
            <textarea
              id="dream"
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder={t('hero.example')}
              className="w-full min-h-[120px] bg-cosmic-800/50 backdrop-blur-sm border border-cosmic-600/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cosmic-400 resize-y"
              rows={4}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !dream.trim()}
            className="w-full bg-cosmic-500 hover:bg-cosmic-600 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-lg shadow-cosmic-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Interpreting...' : t('hero.button')}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {interpretation && (
          <div id="results" className="bg-cosmic-800/50 backdrop-blur-sm border border-cosmic-600/30 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('results.title')}</h2>
            <p className="text-cosmic-100 leading-relaxed mb-6 whitespace-pre-wrap">{interpretation}</p>
            <div className="flex items-center gap-3">
              <button onClick={handleClear} className="text-cosmic-300 hover:text-cosmic-200 hover:underline">
                {t('modal.clear')}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-12 border-t border-cosmic-800/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-cosmic-400">
          <p className="mb-2">{t('footer.about')} · {t('footer.privacy')} · {t('footer.terms')} · {t('footer.contact')}</p>
          <p className="text-sm">{t('footer.rights')} © {new Date().getFullYear()} Dream Interpreter</p>
        </div>
      </footer>
    </div>
  );
}