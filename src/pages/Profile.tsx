import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';
import { migrateLocalDreams } from '../lib/sync';
import { formatDate } from '../lib/datetime';
import type { DreamItem } from '../components/DreamCard';

interface LocalState {
  total: number;
  savedCount: number;
  streak: number;
  lastDate: string | null;
  topSymbols: Array<{ name: string; count: number }>;
  languages: string[];
  perspectives: string[];
  topMoods: Array<{ name: string; count: number }>;
}

function computeLocalState(): LocalState {
  const history: DreamItem[] = JSON.parse(localStorage.getItem('dream-history') || '[]');
  const saved: DreamItem[] = JSON.parse(localStorage.getItem('saved-dreams') || '[]');
  const all = [...history, ...saved];

  // Streak: consecutive days (including today/yesterday) with at least one dream
  const days = new Set(all.map((d) => (d.date || '').slice(0, 10)).filter(Boolean));
  let streak = 0;
  const cursor = new Date();
  // allow the streak to start today or yesterday
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const symbolCount = new Map<string, number>();
  for (const d of all) for (const s of d.symbols ?? []) symbolCount.set(s, (symbolCount.get(s) ?? 0) + 1);
  const topSymbols = [...symbolCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const moodCount = new Map<string, number>();
  for (const d of all) if (d.mood) moodCount.set(d.mood, (moodCount.get(d.mood) ?? 0) + 1);
  const topMoods = [...moodCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const last = all.map((d) => d.date).filter(Boolean).sort().pop() ?? null;

  return {
    total: history.length,
    savedCount: saved.length,
    streak,
    lastDate: last,
    topSymbols,
    languages: [...new Set(all.map((d) => d.language).filter(Boolean))] as string[],
    perspectives: [...new Set(all.map((d) => d.perspective).filter(Boolean))] as string[],
    topMoods,
  };
}

const MOOD_EMOJI: Record<string, string> = {
  peace: '😌', anxiety: '😰', hope: '✨', sadness: '😢', anger: '😠', confusion: '🤔',
};

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
    <div className="serif" style={{ fontSize: 30, color: 'var(--accent)' }}>{value}</div>
    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
  </div>
);

export default function Profile() {
  const { t, language } = useI18n();
  const { user, cloudEnabled, signInWithMagicLink, signInWithGoogle, signOut, connect } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrated, setMigrated] = useState<number | null>(null);
  const [local] = useState<LocalState>(() => computeLocalState());
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [supaError, setSupaError] = useState<string | null>(null);
  const rtlLangs = ['ar', 'he', 'fa', 'ur'];

  const handleConnect = async () => {
    setSupaError(null);
    if (!supaUrl.trim() || !supaKey.trim()) { setSupaError(t('profile.connectError')); return; }
    setConnecting(true);
    const ok = connect(supaUrl.trim(), supaKey.trim());
    setConnecting(false);
    if (!ok) setSupaError(t('profile.connectError'));
  };

  useEffect(() => {
    if (user && migrated === null) migrateLocalDreams(user.id).then(setMigrated);
  }, [user, migrated]);

  const handleMagicLink = async () => {
    setError(null);
    if (!email.trim() || !email.includes('@')) { setError(t('profile.invalidEmail')); return; }
    const res = await signInWithMagicLink(email.trim());
    if (res.error) setError(t('profile.signInError'));
    else setSent(true);
  };

  const handleGoogle = async () => {
    setError(null);
    const res = await signInWithGoogle();
    if (res.error) {
      // Translate the common Supabase provider-not-enabled error into a clear, localized hint.
      if (/provider is not enabled/i.test(res.error)) setError(t('profile.googleNotEnabled'));
      else setError(t('profile.signInError'));
    }
  };

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 80px)' }}>
        <div className="container-narrow">
          <h1 className="h2 serif" style={{ marginBottom: 8 }}>{t('profile.title')}</h1>
          <p className="lede" style={{ marginBottom: 32 }}>{t('profile.lede')}</p>

          {/* ===== حالتك الآن — محلية وتعمل دائماً ===== */}
          <h2 className="h3 serif" style={{ marginBottom: 16 }}>{t('profile.yourState')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            <Stat value={local.total} label={t('profile.statDreams')} />
            <Stat value={local.savedCount} label={t('profile.statSaved')} />
            <Stat value={local.streak} label={t('profile.statStreak')} />
            <Stat value={local.topSymbols[0]?.name ?? '—'} label={t('profile.statTopSymbol')} />
          </div>

          {local.total === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>{t('profile.emptyState')}</p>
          ) : (
            <div className="card" style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'var(--text-dim)' }}>
                <div>
                  <span className="mono-meta" style={{ display: 'block', marginBottom: 6 }}>{t('profile.symbolsYouMeet')}</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {local.topSymbols.length ? local.topSymbols.map((s) => (
                      <span key={s.name} className="tag">{s.name} ×{s.count}</span>
                    )) : <span style={{ color: 'var(--muted)' }}>{t('profile.noneYet')}</span>}
                  </div>
                </div>
                {local.topMoods.length > 0 && (
                  <div>
                    <span className="mono-meta" style={{ display: 'block', marginBottom: 6 }}>{t('profile.moodPattern')}</span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {local.topMoods.map((m) => (
                        <span key={m.name} className="tag">{MOOD_EMOJI[m.name] ?? ''} {t(`moods.${m.name}`)} ×{m.count}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <span>
                    <span className="mono-meta" style={{ display: 'block', marginBottom: 4 }}>{t('profile.lastReading')}</span>
                    {local.lastDate ? formatDate(local.lastDate, language) : '—'}
                  </span>
                  <span>
                    <span className="mono-meta" style={{ display: 'block', marginBottom: 4 }}>{t('profile.languagesUsed')}</span>
                    {local.languages.length ? local.languages.map((l) => l.toUpperCase()).join(' · ') : '—'}
                  </span>
                  <span>
                    <span className="mono-meta" style={{ display: 'block', marginBottom: 4 }}>{t('profile.perspectivesUsed')}</span>
                    {local.perspectives.length
                      ? local.perspectives.map((p) => t(`perspectives.${p}.name`)).join(' · ')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===== الحساب السحابي ===== */}
          <h2 className="h3 serif" style={{ marginBottom: 16 }}>{t('profile.cloudTitle')}</h2>

          {!cloudEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460, marginBottom: 24 }}>
              <div className="card">
                <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.7, marginBottom: 16 }}>{t('profile.connectTitle')}</p>
                <label htmlFor="supa-url" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{t('profile.connectUrlLabel')}</label>
                <input id="supa-url" type="url" className="field" value={supaUrl} onChange={(e) => setSupaUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
                <label htmlFor="supa-key" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', margin: '14px 0 8px' }}>{t('profile.connectKeyLabel')}</label>
                <input id="supa-key" type="password" className="field" value={supaKey} onChange={(e) => setSupaKey(e.target.value)} placeholder="eyJhbGciOi…" />
                {supaError && <p role="alert" style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{supaError}</p>}
                <button
                  onClick={handleConnect}
                  className="btn btn-primary"
                  style={{ marginTop: 16, width: '100%' }}
                  disabled={connecting}
                >
                  {connecting ? t('interpret.loading') : t('profile.connectCta')}
                </button>
                <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 12 }}>
                  {t('profile.cloudOff')}
                </p>
              </div>
              <details style={{ maxWidth: 460 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13.5, color: 'var(--muted)' }}>⚙ {t('profile.autoSetupTitle')}</summary>
                <div className="card" style={{ marginTop: 12 }}>
                  <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.7, marginBottom: 12 }}>{t('profile.autoSetupBody')}</p>
                  <code style={{ display: 'block', fontSize: 12, color: 'var(--accent)', background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 8, wordBreak: 'break-all' }}>{t('profile.autoSetupCmd')}</code>
                </div>
              </details>
            </div>
          )}

          {cloudEnabled && !user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460, marginBottom: 24 }}>
              {sent ? (
                <div className="card" style={{ borderColor: 'var(--accent-line)' }}>
                  <p style={{ color: 'var(--text)' }}>✉️ {t('profile.checkEmail')}</p>
                </div>
              ) : (
                <div className="card">
                  <label htmlFor="email" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 10 }}>{t('profile.emailLabel')}</label>
                  <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{error}</p>}
                  <button onClick={handleMagicLink} className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}>{t('profile.magicLink')}</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                    <span className="hr" style={{ flex: 1 }} /><span className="mono-meta">or</span><span className="hr" style={{ flex: 1 }} />
                  </div>
                  <button onClick={handleGoogle} className="btn btn-ghost" style={{ width: '100%' }}>
                    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
                    {t('profile.google')}
                  </button>
                </div>
              )}
              <button onClick={() => { try { localStorage.removeItem('ds_supabase_url'); localStorage.removeItem('ds_supabase_key'); } catch {} window.location.reload(); }} className="btn btn-ghost" style={{ fontSize: 13 }}>{t('profile.disconnect')}</button>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{t('profile.dataNote')}</p>
            </div>
          )}

          {cloudEnabled && user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--accent-glow)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                    {(user.email ?? '?')[0]?.toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user.email}</div>
                    <div className="mono-meta">{t('profile.member')}</div>
                  </div>
                </div>
                {migrated !== null && migrated > 0 && (
                  <p style={{ fontSize: 13.5, color: 'var(--accent)' }}>✓ {t('profile.migrated', { n: migrated })}</p>
                )}
              </div>
              <div><button onClick={signOut} className="btn btn-ghost">{t('profile.signOut')}</button></div>
            </div>
          )}

          <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {t('profile.privacyNote')} · {language && rtlLangs.includes(language) ? '' : ''}
          </p>
        </div>
      </div>
    </Layout>
  );
}
