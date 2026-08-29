import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function About() {
  const { isRtl } = useI18n();
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
            <Link to="/faq" className="navlink">FAQ</Link>
            <Link to="/contact" className="navlink">Contact</Link>
            <a href="https://ai-blog-ansygroups-projects.vercel.app" target="_blank" rel="noopener noreferrer" className="navlink" style={{ color: 'var(--accent)' }}>AI Blog</a>
          </div>
        </nav>
      </header>

      <main className="section">
        <div className="container-narrow">
          <span className="eyebrow">About</span>
          <h1 className="h2 serif" style={{ marginBottom: 24 }}>A clear reading, rooted in tradition</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 16, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p>
              Dreamscope exists to make dream interpretation accessible in your own language. We combine two streams of understanding: the classical Islamic dream scholarship of Ibn Sirin, one of the most influential dream interpreters in history, and the symbolic frameworks of modern depth psychology.
            </p>
            <p>
              Every reading is generated to help you reflect — not to predict the future. Symbols like water, fire, flight, or a snake have carried meaning across cultures for thousands of years, and our interpretations trace those threads so you can find what resonates with your own life.
            </p>
            <p>
              The service is free, private by design, and available in 36 languages. Your dreams never leave your device.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '40px 0' }}>
            <div className="card">
              <div className="serif" style={{ fontSize: 28, color: 'var(--accent)' }}>Ibn Sirin</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>Classical Islamic dream scholarship, traced through centuries of interpretation.</p>
            </div>
            <div className="card">
              <div className="serif" style={{ fontSize: 28, color: 'var(--accent)' }}>36 languages</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>From Arabic to Japanese — interpret in the language you dream in.</p>
            </div>
            <div className="card">
              <div className="serif" style={{ fontSize: 28, color: 'var(--accent)' }}>100% private</div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>Dreams stay on your device. No accounts, no tracking.</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/interpret" className="btn btn-primary">Start Interpreting</Link>
          </div>
        </div>
      </main>

      <footer className="section-line" style={{ padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span className="serif" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Dreamscope</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/" className="navlink">Home</Link>
            <Link to="/faq" className="navlink">FAQ</Link>
            <Link to="/contact" className="navlink">Contact</Link>
            <a href="https://ai-blog-ansygroups-projects.vercel.app" target="_blank" rel="noopener noreferrer" className="navlink" style={{ color: 'var(--accent)' }}>AI Blog</a>
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>© 2024 Dreamscope</span>
        </div>
      </footer>
    </div>
  );
}
