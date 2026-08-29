import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function Contact() {
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
            <Link to="/about" className="navlink">About</Link>
            <Link to="/faq" className="navlink">FAQ</Link>
            <a href="https://ai-blog-ansygroups-projects.vercel.app" target="_blank" rel="noopener noreferrer" className="navlink" style={{ color: 'var(--accent)' }}>AI Blog</a>
            <a href="https://ansygroup.com" target="_blank" rel="noopener noreferrer" className="navlink" style={{ color: 'var(--accent)' }}>Ansy Group</a>
          </div>
        </nav>
      </header>

      <main className="section">
        <div className="container-narrow">
          <span className="eyebrow">Contact</span>
          <h1 className="h2 serif" style={{ marginBottom: 20 }}>Get in touch</h1>
          <p className="lede" style={{ marginBottom: 32 }}>
            Questions, corrections, or partnership ideas? Reach the Dreamscope team by email.
          </p>
          <div className="card" style={{ marginBottom: 24 }}>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>Email</p>
            <a href="mailto:hello@dreamscope.app" className="serif" style={{ fontSize: 22, color: 'var(--accent)', textDecoration: 'none' }}>hello@dreamscope.app</a>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            Dreamscope provides reflection and entertainment only. Interpretations are not medical, psychological, or religious advice. If you need support, please consult a qualified professional.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link to="/interpret" className="btn btn-primary">Back to Interpreter</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
