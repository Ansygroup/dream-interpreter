import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, LANGUAGES } from '../contexts/I18nContext';
import Layout from '../components/Layout';

export default function Interpret() {
  const { t, language, setLanguage } = useI18n();
  const [dream, setDream] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInterpret = async () => {
    if (!dream.trim()) { setError(t('interpret.errorEmpty')); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream, language }),
      });
      const data = await res.json();
      if (data.interpretation) {
        setResult(data.interpretation);
        const history = JSON.parse(localStorage.getItem('dream-history') || '[]');
        history.unshift({ dream, interpretation: data.interpretation, date: new Date().toISOString(), id: Date.now(), language });
        localStorage.setItem('dream-history', JSON.stringify(history.slice(0, 50)));
      } else {
        setError(t('interpret.errorFailed'));
      }
    } catch {
      setError(t('interpret.errorNetwork'));
    }
    setLoading(false);
  };

  const saveDream = () => {
    if (!result) return;
    const saved = JSON.parse(localStorage.getItem('saved-dreams') || '[]');
    saved.unshift({ dream, interpretation: result, date: new Date().toISOString(), id: Date.now(), language });
    localStorage.setItem('saved-dreams', JSON.stringify(saved));
  };

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 80px)' }}>
        <div className="container-narrow">
          <div className="reveal" style={{ marginBottom: 40 }}>
            <span className="eyebrow">{t('interpret.eyebrow')}</span>
            <h1 className="h2 serif" style={{ marginBottom: 14 }}>{t('interpret.title')}</h1>
            <p className="lede">{t('interpret.lede')}</p>
          </div>

          <div className="reveal" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 12 }}>{t('interpret.language')}</label>
            <div className="lang-picker">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className="tag lang-chip"
                  style={{
                    cursor: 'pointer',
                    borderColor: language === l.code ? 'var(--accent)' : 'var(--accent-line)',
                    background: language === l.code ? 'var(--accent-glow)' : 'transparent',
                    color: language === l.code ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          <div className="reveal">
            <label htmlFor="dream" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 12 }}>{t('interpret.yourDream')}</label>
            <textarea
              id="dream"
              className="field"
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder={t('interpret.placeholder')}
              rows={6}
            />
            {error && (
              <p role="alert" style={{ color: '#f87171', marginTop: 12, fontSize: 14 }}>{error}</p>
            )}
            <button onClick={handleInterpret} disabled={loading} className="btn btn-primary" style={{ marginTop: 20 }}>
              {loading ? (
                <>
                  <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
                  {t('interpret.loading')}
                </>
              ) : (
                <>
                  <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M12 3v18M12 3c3 3 6 4 6 8s-3 7-6 10c-3-3-6-4-6-8s3-5 6-10z" /></svg>
                  {t('interpret.button')}
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="reveal" style={{ marginTop: 48 }}>
              <div className="card" style={{ borderColor: 'var(--accent-line)', background: 'var(--surface-2)' }}>
                <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: '92%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: '97%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: '85%' }} />
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="reveal" style={{ marginTop: 48 }}>
              <div className="card" style={{ borderColor: 'var(--accent-line)', background: 'var(--surface-2)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="eyebrow" style={{ marginBottom: 0 }}>{t('interpret.yourReading')}</span>
                  <span style={{ fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 11, color: 'var(--muted)' }}>{new Date().toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{result}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button onClick={saveDream} className="btn btn-ghost" style={{ padding: '10px 18px' }}>
                    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    {t('interpret.save')}
                  </button>
                  <Link to="/history" className="btn btn-ghost" style={{ padding: '10px 18px' }}>{t('interpret.viewHistory')}</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
