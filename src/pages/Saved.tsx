import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function Saved() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [savedDreams, setSavedDreams] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/saved');
        if (!response.ok) {
          throw new Error('Failed to fetch saved dreams');
        }
        const data = await response.json();
        setSavedDreams(data.dreams || []);
      } catch (err: any) {
        setError(err.message || t('error.something'));
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);

  const handleUnsave = async (id: string) => {
    // In a real app, this would call an unsave endpoint
    // For now, we'll just filter locally
    setSavedDreams(prev => prev.filter(dream => dream.id !== id));
  };

  const handleInterpretAgain = (dream: string, language: string) => {
    navigate(`/interpret`, { state: { dream, language } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg px-6 py-4 max-w-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 dark">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 z-50">
        <select 
          value={localStorage.getItem('i18nextLng') || 'en'} 
          onChange={(e) => {
            localStorage.setItem('i18nextLng', e.target.value);
            window.location.reload();
          }}
          className="bg-cosmic-800/50 backdrop-blur-sm text-white border border-cosmic-600/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cosmic-400"
        >
          {['en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'tr', 'nl', 'pl', 'sv', 'da', 'no'].map(lang => {
            const langName = t('app.title') as any;
            const displayName = langName[lang] ? langName[lang] : lang.toUpperCase();
            return (
              <option key={lang} value={lang}>
                {displayName}
              </option>
            );
          })}
        </select>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center text-cosmic-300 hover:text-cosmic-200 mb-4">
            <span className="mr-2">←</span>
            <span>{t('nav.home')}</span>
          </Link>
          
          <h1 className="text-3xl font-display text-white mb-2">
            {t('saved.title')}
          </h1>
        </header>

        {savedDreams.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cosmic-400">{t('saved.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {savedDreams.map((dream) => (
              <div key={dream.id} className="bg-cosmic-800/50 backdrop-blur-sm border border-cosmic-600/30 rounded-lg p-5 hover:border-cosmic-400/50 transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {dream.dream.length > 50 ? dream.dream.substring(0, 50) + '...' : dream.dream}
                    </h3>
                    <p className="text-cosmic-300 text-sm">
                      {new Date(dream.timestamp).toLocaleString(undefined, { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })} · {dream.language.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInterpretAgain(dream.dream, dream.language)}
                      className="text-cosmic-300 hover:text-cosmic-200 hover:underline text-sm"
                    >
                      {t('nav.interpret')}
                    </button>
                    <button
                      onClick={() => handleUnsave(dream.id)}
                      className="text-red-400 hover:text-red-300 hover:underline text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {dream.interpretation && (
                  <div className="bg-cosmic-700/50 rounded-lg p-4 mt-3">
                    <p className="text-cosmic-100 leading-relaxed whitespace-pre-wrap">
                      {dream.interpretation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}