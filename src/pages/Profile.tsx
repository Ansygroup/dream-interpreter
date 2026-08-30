import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';
import { migrateLocalDreams } from '../lib/sync';

export default function Profile() {
  const { t } = useI18n();
  const { user, cloudEnabled, signInWithMagicLink, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrated, setMigrated] = useState<number | null>(null);

  // One-time local→cloud migration right after first login
  useEffect(() => {
    if (user && migrated === null) {
      migrateLocalDreams(user.id).then(setMigrated);
    }
  }, [user, migrated]);

  const handleMagicLink = async () => {
    setError(null);
    if (!email.trim() || !email.includes('@')) { setError(t('profile.invalidEmail')); return; }
    const res = await signInWithMagicLink(email.trim());
    if (res.error) setError(res.error);
    else setSent(true);
  };

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 80px)' }}>
        <div className="container-narrow">
          <h1 className="h2 serif" style={{ marginBottom: 28 }}>{t('profile.title')}</h1>

          {!cloudEnabled && (
            <div className="card">
              <p style={{ color: 'var(--muted)' }}>{t('profile.cloudOff')}</p>
            </div>
          )}

          {cloudEnabled && !user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
              <p className="lede">{t('profile.signInLede')}</p>
              {sent ? (
                <div className="card" style={{ borderColor: 'var(--accent-line)' }}>
                  <p style={{ color: 'var(--text)' }}>✉️ {t('profile.checkEmail')}</p>
                </div>
              ) : (
                <div className="card">
                  <label htmlFor="email" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 10 }}>{t('profile.emailLabel')}</label>
                  <input
                    id="email"
                    type="email"
                    className="field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{error}</p>}
                  <button onClick={handleMagicLink} className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}>
                    {t('profile.magicLink')}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                    <span className="hr" style={{ flex: 1 }} /><span className="mono-meta">or</span><span className="hr" style={{ flex: 1 }} />
                  </div>
                  <button onClick={signInWithGoogle} className="btn btn-ghost" style={{ width: '100%' }}>
                    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
                    {t('profile.google')}
                  </button>
                </div>
              )}
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{t('profile.guestNote')}</p>
            </div>
          )}

          {cloudEnabled && user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
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
              <div>
                <button onClick={signOut} className="btn btn-ghost">{t('profile.signOut')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
