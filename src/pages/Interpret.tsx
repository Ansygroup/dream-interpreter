import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LanguagePicker from '../components/LanguagePicker';
import { PERSPECTIVES } from '../data/perspectives';

/** Dream emotions — saved with the entry, tracked in the user state. */
const MOODS = [
  { id: 'peace', emoji: '😌' },
  { id: 'anxiety', emoji: '😰' },
  { id: 'hope', emoji: '✨' },
  { id: 'sadness', emoji: '😢' },
  { id: 'anger', emoji: '😠' },
  { id: 'confusion', emoji: '🤔' },
];
import { saveDreamToCloud, sendCloudFeedback } from '../lib/sync';

type Reading = { interpretation: string; symbols: string[]; engine: string; id: string };

export default function Interpret() {
  const { t, language, languageInfo } = useI18n();
  const { user } = useAuth();
  const [dream, setDream] = useState('');
  const [perspective, setPerspective] = useState('general');
  const [mood, setMood] = useState<string | null>(null);
  const [result, setResult] = useState<Reading | null>(null);
  const [compare, setCompare] = useState<boolean>(false);
  const [comparison, setComparison] = useState<Array<{ id: string; name: string; reading: Reading | null; error?: boolean }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const persist = (reading: Reading, persp: string) => {
    const entry = { dream, interpretation: reading.interpretation, date: new Date().toISOString(), id: Date.now(), language, perspective: persp, symbols: reading.symbols, mood: mood ?? undefined };
    const history = JSON.parse(localStorage.getItem('dream-history') || '[]');
    history.unshift(entry);
    localStorage.setItem('dream-history', JSON.stringify(history.slice(0, 50)));
    if (user) saveDreamToCloud(user.id, entry);
  };

  const fetchReading = async (persp: string): Promise<Reading> => {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream, language, perspective: persp }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!data.interpretation) throw new Error('empty');
    return data as Reading;
  };

  const handleInterpret = async () => {
    if (!dream.trim()) { setError(t('interpret.errorEmpty')); return; }
    setCompare(false);
    setLoading(true);
    setError(null);
    setResult(null);
    setComparison(null);
    setFeedback(null);
    try {
      const reading = await fetchReading(perspective);
      setResult(reading);
      persist(reading, perspective);
    } catch {
      setError(t('interpret.errorNetwork'));
    }
    setLoading(false);
  };

  const handleCompare = async () => {
    if (!dream.trim()) { setError(t('interpret.errorEmpty')); return; }
    setCompare(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setComparison(PERSPECTIVES.map((p) => ({ id: p.id, name: t(`perspectives.${p.id}.name`), reading: null })));
    try {
      const results = await Promise.all(
        PERSPECTIVES.map(async (p) => {
          try {
            const reading = await fetchReading(p.id);
            persist(reading, p.id);
            return { id: p.id, name: t(`perspectives.${p.id}.name`), reading };
          } catch {
            return { id: p.id, name: t(`perspectives.${p.id}.name`), reading: null, error: true };
          }
        })
      );
      setComparison(results);
    } catch {
      setError(t('interpret.errorNetwork'));
    }
    setLoading(false);
  };

  const saveDream = () => {
    if (!result) return;
    const saved = JSON.parse(localStorage.getItem('saved-dreams') || '[]');
    saved.unshift({ dream, interpretation: result.interpretation, date: new Date().toISOString(), id: Date.now(), language, perspective, symbols: result.symbols, mood: mood ?? undefined });
    localStorage.setItem('saved-dreams', JSON.stringify(saved));
    if (user) {
      saveDreamToCloud(user.id, { dream, interpretation: result.interpretation, date: new Date().toISOString(), id: Date.now(), language, perspective, symbols: result.symbols, mood: mood ?? undefined });
    }
  };

  const sendFeedback = async (helpful: boolean) => {
    if (!result || feedback) return;
    setFeedback(helpful ? 'up' : 'down');
    const payload = { interpretationId: result.id, helpful, language, perspective, engine: result.engine };
    const cloudOk = await sendCloudFeedback(payload).catch(() => false);
    if (!cloudOk) {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: result.id, helpful, language, perspective, engine: result.engine }),
        });
      } catch { /* best effort */ }
    }
  };

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 80px)' }}>
        <div className="container-narrow">
          <div className="reveal" style={{ marginBottom: 32 }}>
            <h1 className="h2 serif" style={{ marginBottom: 14 }}>{t('interpret.title')}</h1>
            <p className="lede">{t('interpret.lede')}</p>
          </div>

          {/* Perspective — the tradition the reading speaks through */}
          <div className="reveal" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 12 }}>{t('interpret.perspectiveLabel')}</label>
            <div className="perspective-picker">
              {PERSPECTIVES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPerspective(p.id)}
                  className="tag perspective-chip"
                  style={{
                    cursor: 'pointer',
                    gap: 7,
                    borderColor: perspective === p.id ? 'var(--accent)' : 'var(--accent-line)',
                    background: perspective === p.id ? 'var(--accent-glow)' : 'transparent',
                    color: perspective === p.id ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {p.icon}
                  {t(`perspectives.${p.id}.name`)}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '60ch' }}>
              {t(`perspDesc.${perspective}`)}
            </p>
          </div>

          {/* Language */}
          <div className="reveal" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 12 }}>{t('interpret.language')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LanguagePicker />
              <span style={{ fontSize: 14.5, color: 'var(--text)' }}>{languageInfo.native}</span>
            </div>
          </div>

          {/* Dream input */}
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
              {loading && !compare ? (
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
            <button onClick={handleCompare} disabled={loading} className="btn btn-ghost" style={{ marginTop: 20, marginInlineStart: 10 }}>
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M12 3v18M3 7h18M3 17h18" /></svg>
              {t('interpret.compareLabel')}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <span className="mono-meta" style={{ color: 'var(--accent)' }}>{t('interpret.yourReading')}</span>
                  <span className="mono-meta">{t(`perspectives.${perspective}.name`)}</span>
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{result.interpretation}</p>
                {result.symbols?.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{t('interpret.symbolsLabel')}</span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {result.symbols.map((s) => <span key={s} className="tag">{s}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 18 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{t('interpret.moodLabel')}</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMood(mood === m.id ? null : m.id)}
                        className="tag"
                        style={{
                          cursor: 'pointer',
                          gap: 6,
                          borderColor: mood === m.id ? 'var(--accent)' : 'var(--accent-line)',
                          background: mood === m.id ? 'var(--accent-glow)' : 'transparent',
                          color: mood === m.id ? 'var(--accent)' : 'var(--muted)',
                        }}
                      >
                        {m.emoji} {t(`moods.${m.id}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={saveDream} className="btn btn-ghost" style={{ padding: '10px 18px' }}>
                    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    {t('interpret.save')}
                  </button>
                  <Link to="/history" className="btn btn-ghost" style={{ padding: '10px 18px' }}>{t('interpret.viewHistory')}</Link>
                  <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {feedback ? (
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('interpret.thanks')}</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('interpret.feedbackQ')}</span>
                        <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => sendFeedback(true)} aria-label={t('interpret.yes')}>
                          <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                        </button>
                        <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => sendFeedback(false)} aria-label={t('interpret.no')}>
                          <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14, transform: 'rotate(180deg)' }}><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {comparison && (
            <div className="reveal" style={{ marginTop: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <span className="mono-meta" style={{ color: 'var(--accent)' }}>{t('interpret.compareLabel')}</span>
                <button onClick={() => setComparison(null)} className="btn btn-ghost" style={{ padding: '8px 14px' }}>{t('interpret.compareBack')}</button>
              </div>
              <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {comparison.map((c) => (
                  <div key={c.id} className="card" style={{ borderColor: 'var(--accent-line)', background: 'var(--surface-2)', boxShadow: 'var(--shadow)' }}>
                    <span className="mono-meta" style={{ color: 'var(--accent)', display: 'block', marginBottom: 12 }}>{c.name}</span>
                    {loading && !c.reading && !c.error ? (
                      <>
                        <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 10 }} />
                        <div className="skeleton" style={{ height: 12, width: '88%', marginBottom: 10 }} />
                        <div className="skeleton" style={{ height: 12, width: '94%' }} />
                      </>
                    ) : c.error ? (
                      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{t('interpret.errorNetwork')}</p>
                    ) : (
                      <>
                        <p style={{ fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{c.reading?.interpretation}</p>
                        {c.reading?.symbols?.length ? (
                          <div style={{ marginTop: 14 }}>
                            <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{t('interpret.compareSymbols')}</span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {c.reading.symbols.map((s) => <span key={s} className="tag">{s}</span>)}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
