import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { SYMBOL_LIST } from '../symbols-list';
import { SYMBOL_NAMES } from '../symbol-names';
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

/** Does a symbol match the query across slug + localized names + aliases? */
function matches(slug: string, q: string): boolean {
  if (!q) return true;
  const query = q.trim().toLowerCase();
  if (slug.includes(query)) return true;
  const names = SYMBOL_NAMES[slug];
  if (!names) return false;
  if (names.en.toLowerCase().includes(query)) return true;
  if (names.ar.includes(q.trim())) return true; // Arabic exact substring
  if (names.ar.toLowerCase().includes(query)) return true;
  if (names.aliases?.some((a) => a.toLowerCase().includes(query))) return true;
  return false;
}

/** Localized display label for a symbol, falling back to the slug. */
function displayName(slug: string, lang: string): string {
  const names = SYMBOL_NAMES[slug];
  if (names) return lang === 'ar' ? names.ar : names.en;
  return slug.replace(/_/g, ' ');
}

export default function Symbols() {
  const { t, language } = useI18n();
  const [filter, setFilter] = useState('');

  const list = SYMBOL_LIST.filter((s) => matches(s, filter));

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 72px)' }}>
        <div className="container">
          <header style={{ textAlign: 'center', margin: '0 auto 40px', maxWidth: 640 }}>
            <h1 className="h2 serif" style={{ margin: '12px 0' }}>{t('symbols.title', { n: SYMBOL_LIST.length })}</h1>
            <p className="lede" style={{ margin: '0 auto' }}>{t('symbols.lede')}</p>
            <input
              type="search"
              placeholder={t('symbols.search')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="field"
              style={{ maxWidth: 360, margin: '24px auto 0' }}
              aria-label={t('symbols.search')}
            />
          </header>

          {list.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)' }}>{t('symbols.noResults')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {list.map((sym) => (
                <div key={sym} className="card" style={{ padding: 18 }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>{displayName(sym, language)}</h3>
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
          )}
        </div>
      </div>
    </Layout>
  );
}
