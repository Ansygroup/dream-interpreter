import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { SYMBOL_LIST } from '../symbols-list';
import Layout from '../components/Layout';

/** Language chips shown per symbol card (top SEO languages). */
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
  const { t } = useI18n();
  const [filter, setFilter] = useState('');

  const list = SYMBOL_LIST.filter((s) => s.includes(filter.toLowerCase()));

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 72px)' }}>
        <div className="container">
          <header style={{ textAlign: 'center', margin: '0 auto 40px', maxWidth: 640 }}>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>{t('symbols.eyebrow')}</span>
            <h1 className="h2 serif" style={{ margin: '12px 0' }}>{t('symbols.title', { n: SYMBOL_LIST.length })}</h1>
            <p className="lede" style={{ margin: '0 auto' }}>{t('symbols.lede')}</p>
            <input
              type="search"
              placeholder={t('symbols.search')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="field"
              style={{ maxWidth: 360, margin: '24px auto 0' }}
            />
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {list.map((sym) => (
              <div key={sym} className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 10, textTransform: 'capitalize' }}>{sym.replace(/_/g, ' ')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LANGS.map((l) => (
                    <Link key={l.code} to={`/seo/${sym}/${l.code}`} className="tag" style={{ fontSize: 11, textDecoration: 'none' }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
