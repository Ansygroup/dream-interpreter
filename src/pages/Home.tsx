import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';

interface DreamToday {
  date: string;
  symbol: { key: string; en: string; ar: string };
  dream: { en: string; ar: string };
  reading: { en: string; ar: string };
}

const SYMBOLS = [
  { key: 'snake', en: 'Snake', ar: 'الثعبان' },
  { key: 'water', en: 'Water', ar: 'الماء' },
  { key: 'flying', en: 'Flying', ar: 'الطيران' },
  { key: 'falling', en: 'Falling', ar: 'السقوط' },
  { key: 'teeth', en: 'Teeth', ar: 'الأسنان' },
  { key: 'death', en: 'Death', ar: 'الموت' },
  { key: 'house', en: 'House', ar: 'البيت' },
  { key: 'fire', en: 'Fire', ar: 'النار' },
  { key: 'dog', en: 'Dog', ar: 'الكلب' },
  { key: 'marriage', en: 'Marriage', ar: 'الزواج' },
  { key: 'cat', en: 'Cat', ar: 'القطة' },
  { key: 'bird', en: 'Bird', ar: 'الطائر' },
  { key: 'fish', en: 'Fish', ar: 'السمكة' },
  { key: 'tree', en: 'Tree', ar: 'الشجرة' },
  { key: 'sun', en: 'Sun', ar: 'الشمس' },
  { key: 'moon', en: 'Moon', ar: 'القمر' },
  { key: 'baby', en: 'Baby', ar: 'الرضيع' },
  { key: 'money', en: 'Money', ar: 'المال' },
  { key: 'pregnancy', en: 'Pregnancy', ar: 'الحمل' },
  { key: 'blood', en: 'Blood', ar: 'الدم' },
];

export default function Home() {
  const { t, language } = useI18n();
  const [heroBefore, heroAfter] = t('home.heroTitle').split('{accent}');
  const heroAccent = t('home.heroAccent');
  const [daily, setDaily] = useState<DreamToday | null>(null);

  useEffect(() => {
    fetch('/dream-today.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DreamToday) => {
        if (d?.date === new Date().toISOString().slice(0, 10)) setDaily(d);
      })
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: <svg className="icon" viewBox="0 0 24 24"><path d="M12 3v18M12 3c3 3 6 4 6 8s-3 7-6 10c-3-3-6-4-6-8s3-5 6-10z" /></svg>,
      title: t('home.feature1Title'),
      body: t('home.feature1Body'),
    },
    {
      icon: <svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>,
      title: t('home.feature2Title'),
      body: t('home.feature2Body'),
    },
    {
      icon: <svg className="icon" viewBox="0 0 24 24"><path d="M4 19V5l8 5 8-5v14" /><path d="M12 10v9" /></svg>,
      title: t('home.feature3Title'),
      body: t('home.feature3Body'),
    },
    {
      icon: <svg className="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v16" /></svg>,
      title: t('home.feature4Title'),
      body: t('home.feature4Body'),
    },
  ];

  return (
    <Layout>
      {/* Hero — the page's one authored moment */}
      <section className="section" style={{ paddingTop: 'clamp(56px, 8vw, 104px)' }}>
        <div className="container">
          <div className="hero-grid">
            <div>
              <h1 className="display serif rise" style={{ marginBottom: 24 }}>
                {heroBefore}
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{heroAccent}</em>
                {heroAfter}
              </h1>
              <p className="lede rise" data-delay="90ms" style={{ marginBottom: 36 }}>{t('home.heroLede')}</p>
              <div className="rise" data-delay="180ms" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/interpret" className="btn btn-primary">{t('home.interpretCta')}</Link>
                <Link to="/symbols" className="btn btn-ghost">{t('home.browseCta')}</Link>
              </div>
              <p className="rise mono-meta" data-delay="260ms" style={{ marginTop: 36 }}>
                {t('home.statLanguages', { n: 60 })} · {t('home.statSymbols', { n: 146 })} · {t('home.statPrivateLine')}
              </p>
            </div>

            {/* Sample reading — real proof, not decoration */}
            <div className="hero-sample rise" data-delay="220ms" style={{ position: 'relative', minHeight: '360px' }}>
              <div className="card" style={{ position: 'relative', zIndex: 2, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="tag">{t('home.sampleTag')}</span>
                  <span className="mono-meta">{t('home.sampleJustNow')}</span>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 18 }}>
                  {t('home.sampleDream')}
                </p>
                <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7 }}>
                  {t('home.sampleReading')}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  <span className="tag">{t('home.sampleTag1')}</span>
                  <span className="tag">{t('home.sampleTag2')}</span>
                  <span className="tag">{t('home.sampleTag3')}</span>
                </div>
              </div>
              <div className="card" style={{ position: 'absolute', bottom: -28, left: -24, zIndex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}><path d="M20 6 9 17l-5-5" /></svg>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t('home.sampleSaved')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — editorial manifest, not a card grid */}
      <section className="section section-line">
        <div className="container">
          <div className="manifest-grid">
            <div style={{ position: 'sticky', top: 96, alignSelf: 'start' }}>
              <h2 className="h2 serif" style={{ marginBottom: 18 }}>{t('home.whyTitle')}</h2>
              <p className="lede">{t('home.whyLede')}</p>
            </div>
            <div>
              {features.map((f) => (
                <div key={f.title} className="manifest-row">
                  <span style={{ color: 'var(--accent)', display: 'inline-flex', paddingTop: 3 }}>{f.icon}</span>
                  <div>
                    <h3 className="h3 serif" style={{ marginBottom: 6 }}>{f.title}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.65 }}>{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Symbols index */}
      <section id="symbols" className="section section-line">
        <div className="container">
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 40, alignItems: 'end', marginBottom: 48 }}>
            <h2 className="h2 serif">{t('home.symbolsTitle')}</h2>
            <p className="lede" style={{ paddingBottom: 6 }}>{t('home.symbolsLede')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {SYMBOLS.map((sym, i) => (
              <Link
                key={sym.key}
                to={`/seo/${sym.key}/${language}`}
                className="card card-hover reveal"
                data-delay={`${(i % 5) * 60}ms`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--text)', padding: '18px 20px' }}
              >
                <span style={{ fontWeight: 500, fontSize: 15 }}>{language === 'ar' ? sym.ar : sym.en}</span>
                <svg className="icon icon-flip" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: 18, height: 18 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Dream of the day — refreshed daily by the evolve automation */}
      {daily && (
        <section className="section section-line">
          <div className="container-narrow">
            <div className="card reveal" style={{ borderColor: 'var(--accent-line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <span className="tag">{t('daily.tag')}</span>
                <span className="mono-meta">{language === 'ar' ? daily.symbol.ar : daily.symbol.en}</span>
              </div>
              <p className="serif" style={{ fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)', lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic', color: 'var(--text)' }}>
                “{language === 'ar' ? daily.dream.ar : daily.dream.en}”
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.75 }}>
                {language === 'ar' ? daily.reading.ar : daily.reading.en}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section section-line">
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <h2 className="h2 serif" style={{ marginBottom: 18 }}>{t('home.ctaTitle')}</h2>
          <p className="lede" style={{ margin: '0 auto 32px' }}>{t('home.ctaLede')}</p>
          <Link to="/interpret" className="btn btn-primary">{t('home.ctaButton')}</Link>
        </div>
      </section>
    </Layout>
  );
}
