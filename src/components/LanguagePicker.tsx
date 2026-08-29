import { useEffect, useRef, useState } from 'react';
import { AVAILABLE_LANGUAGES, useI18n } from '../contexts/I18nContext';

const GlobeIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 17, height: 17 }}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
);
const CheckIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15, color: 'var(--accent)' }}><path d="M20 6 9 17l-5-5" /></svg>
);
const CloseIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}><path d="M18 6 6 18M6 6l12 12" /></svg>
);

/** Language switcher: globe button in the nav + searchable dropdown panel. */
export default function LanguagePicker() {
  const { language, languageInfo, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = AVAILABLE_LANGUAGES.filter(
    (l) => !q || l.native.toLowerCase().includes(q) || l.english.toLowerCase().includes(q) || l.code.includes(q)
  );

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={() => { setOpen((v) => !v); setQuery(''); }}
        aria-label={t('nav.language')}
        aria-expanded={open}
        title={languageInfo.native}
      >
        {GlobeIcon}
      </button>
      {open && (
        <div className="lang-menu" role="dialog" aria-label={t('nav.language')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 8px' }}>
            <input
              autoFocus
              className="field"
              style={{ padding: '9px 12px', fontSize: 14 }}
              placeholder={t('nav.searchLanguage')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setOpen(false)} aria-label="Close">
              {CloseIcon}
            </button>
          </div>
          <div className="lang-menu-list">
            {list.map((l) => (
              <button
                key={l.code}
                className="lang-menu-item"
                style={{
                  background: l.code === language ? 'var(--accent-glow)' : 'transparent',
                  borderColor: l.code === language ? 'var(--accent-line)' : 'transparent',
                }}
                onClick={() => { setLanguage(l.code); setOpen(false); }}
              >
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                  <span style={{ fontSize: 14.5, color: 'var(--text)' }}>{l.native}</span>
                  <span className="mono-meta">{l.english}</span>
                </span>
                {l.code === language ? CheckIcon : <span className="mono-meta">{l.code}</span>}
              </button>
            ))}
            {list.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: 14, padding: '16px 14px 20px' }}>{t('nav.noLanguage')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
