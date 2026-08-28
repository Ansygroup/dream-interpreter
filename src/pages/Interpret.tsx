import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useReveal } from '../hooks/useReveal';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'hi', name: 'हिंदी' },
];

export default function Interpret() {
  const { language, setLanguage } = useI18n();
  const [dream, setDream] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useReveal<HTMLDivElement>();

  const handleInterpret = async () => {
    if (!dream.trim()) { setError('Please describe your dream first.'); return; }
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
        history.unshift({ dream, interpretation: data.interpretation, date: new Date().toISOString(), id: Date.now() });
        localStorage.setItem('dream-history', JSON.stringify(history.slice(0, 50)));
      } else {
        setError('The interpretation failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const saveDream = () => {
    if (!result) return;
    const saved = JSON.parse(localStorage.getItem('saved-dreams') || '[]');
    saved.unshift({ dream, interpretation: result, date: new Date().toISOString(), id: Date.now() });
    localStorage.setItem('saved-dreams', JSON.stringify(saved));
  };

  return (
    <>
      <div className="ambient" />
      <div ref={ref}>
        <header style={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', background: 'rgba(10,12,11,0.72)', borderBottom: '1px solid var(--border-soft)' }}>
          <nav className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-glow)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center' }}>
                <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15, color: 'var(--accent)' }}><path d="M12 3a6 6 0 0 0 0 12 4 4 0 0 1 0 6" /><path d="M12 3a6 6 0 0 1 0 12" /></svg>
              </span>
              <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Dreamscope</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <Link to="/history" className="navlink">History</Link>
              <Link to="/saved" className="navlink">Saved</Link>
            </div>
          </nav>
        </header>

        <main className="section" style={{ position: 'relative', zIndex: 1 }}>
          <div className="container-narrow">
            <div className="reveal" style={{ marginBottom: 40 }}>
              <span className="eyebrow">Interpret</span>
              <h1 className="h2 serif" style={{ marginBottom: 14 }}>Describe your dream</h1>
              <p className="lede">Write it in your own words. The more detail, the sharper the reading — setting, feelings, and anything unusual all matter.</p>
            </div>

            <div className="reveal" style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 12 }}>Language</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className="tag"
                    style={{
                      cursor: 'pointer',
                      borderColor: language === l.code ? 'var(--accent)' : 'var(--accent-line)',
                      background: language === l.code ? 'var(--accent-glow)' : 'transparent',
                      color: language === l.code ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="reveal">
              <label htmlFor="dream" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 12 }}>Your dream</label>
              <textarea
                id="dream"
                className="field"
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                placeholder="Last night I dreamed I was walking through a door that kept changing shape..."
                rows={6}
              />
              {error && (
                <p role="alert" style={{ color: '#f87171', marginTop: 12, fontSize: 14 }}>{error}</p>
              )}
              <button onClick={handleInterpret} disabled={loading} className="btn btn-primary" style={{ marginTop: 20 }}>
                {loading ? (
                  <>
                    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
                    Interpreting...
                  </>
                ) : (
                  <>
                    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M12 3v18M12 3c3 3 6 4 6 8s-3 7-6 10c-3-3-6-4-6-8s3-5 6-10z" /></svg>
                    Interpret Dream
                  </>
                )}
              </button>
            </div>

            {result && (
              <div className="reveal" style={{ marginTop: 48 }}>
                <div className="card" style={{ borderColor: 'var(--accent-line)', background: 'var(--surface-2)', boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span className="eyebrow" style={{ marginBottom: 0 }}>Your Reading</span>
                    <span style={{ fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 11, color: 'var(--muted)' }}>{new Date().toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{result}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                    <button onClick={saveDream} className="btn btn-ghost" style={{ padding: '10px 18px' }}>
                      <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      Save
                    </button>
                    <Link to="/history" className="btn btn-ghost" style={{ padding: '10px 18px' }}>View History</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="section-line" style={{ padding: '40px 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span className="serif" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Dreamscope</span>
            <Link to="/" className="navlink">Home</Link>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>© 2024 Dreamscope</span>
          </div>
        </footer>
      </div>
    </>
  );
}
