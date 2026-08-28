import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { SYMBOL_LIST } from '../symbols-list';
import { useReveal } from '../hooks/useReveal';

const LANGS = [
  { code: 'en', label: 'English' }, { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' }, { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' }, { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' }, { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' }, { code: 'ko', label: '한국어' },
  { code: 'tr', label: 'Türkçe' }, { code: 'hi', label: 'हिंदी' },
  { code: 'it', label: 'Italiano' },
];

export default function Symbols() {
  const { isRtl } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useReveal();
  const [filter, setFilter] = useState('');

  const list = SYMBOL_LIST.filter((s) => s.includes(filter.toLowerCase()));

  return (
    <div ref={ref} dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen container-narrow reveal">
      <nav className="nav">
        <Link to="/" className="brand">Dreamscope</Link>
        <div className="nav-links">
          <Link to="/interpret">Interpret</Link>
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </nav>

      <header style={{ textAlign: 'center', margin: '48px 0 24px' }}>
        <span className="ey">Dream Symbol Dictionary</span>
        <h1 style={{ fontSize: '2.4rem', margin: '12px 0' }}>{SYMBOL_LIST.length} Dream Symbols</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Browse every symbol we interpret — free, in 13 languages. Pick yours to read the meaning.
        </p>
        <input
          type="search"
          placeholder="Search a symbol…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input"
          style={{ maxWidth: 360, margin: '20px auto 0' }}
        />
      </header>

      <div className="bento" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {list.map((sym) => (
          <div key={sym} className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 10, textTransform: 'capitalize' }}>{sym.replace(/_/g, ' ')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGS.map((l) => (
                <Link
                  key={l.code}
                  to={`/seo/${sym}/${l.code}`}
                  className="chip"
                  style={{ fontSize: 11 }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="footer">
        <p>© 2024 Dreamscope. Free AI dream interpretation grounded in Ibn Sirin & modern psychology.</p>
      </footer>
    </div>
  );
}
