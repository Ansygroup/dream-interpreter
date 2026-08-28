import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

const FAQS = [
  {
    q: 'How does Dreamscope interpret dreams?',
    a: 'Dreamscope blends classical dream scholarship — including Ibn Sirin\'s tradition — with modern depth psychology. You describe a dream in your own words and receive a reading that maps its symbols to their common meanings across cultures.',
  },
  {
    q: 'Is my dream data private?',
    a: 'Yes. Your dreams are stored only in your browser\'s local storage on your device. Nothing is sent to a server for storage, and you can delete your history at any time.',
  },
  {
    q: 'In which languages can I interpret dreams?',
    a: 'Dreamscope supports 36 languages including English, Arabic, Spanish, French, German, Chinese, Japanese, Korean, Turkish, Portuguese, Russian, Hindi, and more. The reading follows the language you choose.',
  },
  {
    q: 'Are the interpretations a substitute for professional advice?',
    a: 'No. Dream readings are for reflection and entertainment. They are not medical, psychological, or religious guidance. If you are struggling, please speak with a qualified professional.',
  },
  {
    q: 'How many dream symbols are covered?',
    a: 'Dreamscope has dedicated pages for dozens of common symbols — snake, water, flying, fire, pregnancy, money, and many more — each available in 13 languages with long-tail question variants.',
  },
];

export default function FAQ() {
  const { isRtl } = useI18n();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ position: 'relative', zIndex: 1 }}>
      <div className="ambient" />
      <header style={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', background: 'rgba(10,12,11,0.72)', borderBottom: '1px solid var(--border-soft)' }}>
        <nav className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Dreamscope</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link to="/interpret" className="navlink">Interpret</Link>
            <Link to="/about" className="navlink">About</Link>
            <Link to="/contact" className="navlink">Contact</Link>
          </div>
        </nav>
      </header>

      <main className="section">
        <div className="container-narrow">
          <span className="eyebrow">FAQ</span>
          <h1 className="h2 serif" style={{ marginBottom: 40 }}>Frequently asked questions</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQS.map((f) => (
              <div key={f.q} className="card">
                <h2 className="h3 serif" style={{ marginBottom: 10, color: 'var(--text)' }}>{f.q}</h2>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link to="/interpret" className="btn btn-primary">Interpret a Dream</Link>
          </div>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
