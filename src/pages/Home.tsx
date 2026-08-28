import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useReveal } from '../hooks/useReveal';

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

const STATS = [
  { value: '36', label: 'Languages' },
  { value: '4,100+', label: 'Symbol pages' },
  { value: '100%', label: 'Private' },
];

const FEATURES = [
  {
    icon: (
      <svg className="icon" viewBox="0 0 24 24"><path d="M12 3v18M12 3c3 3 6 4 6 8s-3 7-6 10c-3-3-6-4-6-8s3-5 6-10z" /></svg>
    ),
    title: 'Symbolic Analysis',
    body: 'Every dream is mapped to its core symbols and traced through centuries of interpretation tradition.',
  },
  {
    icon: (
      <svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
    ),
    title: '36 Languages',
    body: 'Interpret and read symbols in English, Arabic, Spanish, Chinese, Japanese, and 31 more languages.',
  },
  {
    icon: (
      <svg className="icon" viewBox="0 0 24 24"><path d="M4 19V5l8 5 8-5v14" /><path d="M12 10v9" /></svg>
    ),
    title: 'Ibn Sirin + Psychology',
    body: 'Blends classical Islamic dream scholarship with modern depth psychology in one reading.',
  },
  {
    icon: (
      <svg className="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v16" /></svg>
    ),
    title: 'Saved & Private',
    body: 'Your dreams stay on your device. Revisit, compare, and track patterns over time.',
  },
];

export default function Home() {
  const { language } = useI18n();
  const ref = useReveal<HTMLDivElement>();

  return (
    <>
      <div className="ambient" />
      <div ref={ref}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', background: 'rgba(10,12,11,0.72)', borderBottom: '1px solid var(--border-soft)' }}>
        <nav className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-glow)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center' }}>
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15, color: 'var(--accent)' }}><path d="M12 3a6 6 0 0 0 0 12 4 4 0 0 1 0 6" /><path d="M12 3a6 6 0 0 1 0 12" /></svg>
            </span>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Dreamscope</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link to="/interpret" className="navlink">Interpret</Link>
            <Link to="/about" className="navlink">About</Link>
            <Link to="/faq" className="navlink">FAQ</Link>
            <Link to="/history" className="navlink">History</Link>
            <Link to="/saved" className="navlink">Saved</Link>
            <Link to="/interpret" className="btn btn-primary" style={{ padding: '10px 18px' }}>Start</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="section" style={{ paddingTop: 'clamp(56px, 8vw, 96px)', position: 'relative', zIndex: 1 }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }}>
              <div className="reveal">
                <span className="eyebrow">AI Dream Interpretation</span>
                <h1 className="display serif" style={{ marginBottom: 24 }}>
                  What your <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>subconscious</em> is trying to say
                </h1>
                <p className="lede" style={{ marginBottom: 36 }}>
                  Ancient symbolism, modern psychology, and AI — combined into one clear reading. Describe a dream in your own words and get an interpretation grounded in both Ibn Sirin and depth psychology.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <Link to="/interpret" className="btn btn-primary">Interpret a Dream</Link>
                  <a href="#symbols" className="btn btn-ghost">Browse Symbols</a>
                </div>
                <div style={{ display: 'flex', gap: 28, marginTop: 44, flexWrap: 'wrap' }}>
                  {STATS.map((s) => (
                    <div key={s.label}>
                      <div className="serif" style={{ fontSize: 30, color: 'var(--text)' }}>{s.value}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.label}</div>
                    </div>
                  ))}
                  </div>
                </div>

              {/* Sample card stack */}
              <div className="reveal" data-delay="120ms" style={{ position: 'relative', minHeight: '360px' }}>
                <div className="card" style={{ position: 'relative', zIndex: 2, boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span className="tag">Sample Reading</span>
                    <span style={{ fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 11, color: 'var(--muted)' }}>just now</span>
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 18 }}>
                    "I saw a green snake leave the house through the garden gate."
                  </p>
                  <p style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.7 }}>
                    Snakes mark transformation — something in your life is shedding its old skin. The gate suggests a clear exit is opening. In Ibn Sirin's tradition, a harmless snake leaving the home often means a lingering worry is finally moving on.
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                    <span className="tag">Transformation</span>
                    <span className="tag">Release</span>
                    <span className="tag">Ibn Sirin</span>
                  </div>
                </div>
                <div className="card" style={{ position: 'absolute', bottom: -28, left: -24, zIndex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}><path d="M20 6 9 17l-5-5" /></svg>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Saved to your device</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features bento */}
        <section className="section section-line">
          <div className="container">
            <div className="reveal" style={{ marginBottom: 48, maxWidth: 620 }}>
              <span className="eyebrow">Why Dreamscope</span>
              <h2 className="h2 serif">A reading you can actually use</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} className="card card-hover reveal" data-delay={`${i * 80}ms`}>
                  <span style={{ color: 'var(--accent)', display: 'inline-flex', marginBottom: 16 }}>{f.icon}</span>
                  <h3 className="h3 serif" style={{ marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.65 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Symbols grid */}
        <section id="symbols" className="section section-line">
          <div className="container">
            <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 40, alignItems: 'end', marginBottom: 48 }}>
              <div>
                <span className="eyebrow">Dream Symbols</span>
                <h2 className="h2 serif">Every symbol carries a meaning</h2>
              </div>
              <p className="lede" style={{ paddingBottom: 6 }}>
                From water to fire, explore the most common dream motifs and what each one tends to signal across traditions.
              </p>
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
                  <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--muted)', width: 18, height: 18 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section section-line">
          <div className="container-narrow" style={{ textAlign: 'center' }}>
            <div className="reveal">
              <span className="eyebrow" style={{ justifyContent: 'center' }}>Ready when you are</span>
              <h2 className="h2 serif" style={{ marginBottom: 18 }}>Describe your dream</h2>
              <p className="lede" style={{ margin: '0 auto 32px' }}>
                A few sentences is enough. The reading takes seconds and stays on your device.
              </p>
              <Link to="/interpret" className="btn btn-primary">Start Interpreting</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="section-line" style={{ padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span className="serif" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Dreamscope</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/" className="navlink">Home</Link>
            <Link to="/interpret" className="navlink">Interpret</Link>
            <Link to="/about" className="navlink">About</Link>
            <Link to="/faq" className="navlink">FAQ</Link>
            <Link to="/contact" className="navlink">Contact</Link>
            <Link to="/history" className="navlink">History</Link>
            <Link to="/saved" className="navlink">Saved</Link>
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>© 2024 Dreamscope</span>
        </div>
      </footer>
      </div>
    </>
  );
}
