import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

type DreamItem = { id: number; dream: string; interpretation: string; date: string; language?: string };

const Nav = () => (
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
        <Link to="/saved" className="navlink">Saved</Link>
        <a href="https://ai-blog-ansygroups-projects.vercel.app" target="_blank" rel="noopener noreferrer" className="navlink" style={{ color: 'var(--accent)' }}>AI Blog</a>
        <a href="https://ansygroup.com" target="_blank" rel="noopener noreferrer" className="navlink" style={{ color: 'var(--accent)' }}>Ansy Group</a>
      </div>
    </nav>
  </header>
);

const Footer = () => (
  <footer className="section-line" style={{ padding: '40px 0' }}>
    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
      <span className="serif" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Dreamscope</span>
      <Link to="/" className="navlink">Home</Link>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>© 2024 Dreamscope</span>
    </div>
  </footer>
);

const EmptyState = ({ label, cta }: { label: string; cta: string }) => (
  <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
    <svg className="icon" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: 'var(--muted)', margin: '0 auto 16px' }}><path d="M4 19V5l8 5 8-5v14" /><path d="M12 10v9" /></svg>
    <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{label}</p>
    <Link to="/interpret" className="btn btn-primary">{cta}</Link>
  </div>
);

export default function History() {
  const [dreams, setDreams] = useState<DreamItem[]>([]);
  const ref = useReveal<HTMLDivElement>();

  useEffect(() => {
    const raw = localStorage.getItem('dream-history');
    if (raw) {
      try { setDreams(JSON.parse(raw)); } catch { setDreams([]); }
    }
  }, []);

  const remove = (id: number) => {
    const next = dreams.filter((d) => d.id !== id);
    setDreams(next);
    localStorage.setItem('dream-history', JSON.stringify(next));
  };

  return (
    <>
      <div className="ambient" />
      <div ref={ref}>
        <Nav />
        <main className="section" style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(48px, 7vw, 80px)' }}>
          <div className="container-narrow">
            <div className="reveal" style={{ marginBottom: 40 }}>
              <span className="eyebrow">Your Activity</span>
              <h1 className="h2 serif" style={{ marginBottom: 12 }}>Dream history</h1>
              <p className="lede">Every interpretation you've generated, stored on this device.</p>
            </div>

            {dreams.length === 0 ? (
              <EmptyState label="No dreams interpreted yet." cta="Interpret a Dream" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dreams.map((d, i) => (
                  <div key={d.id} className="card card-hover reveal" data-delay={`${(i % 6) * 60}ms`} style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 10 }}>
                      <p style={{ fontWeight: 500, color: 'var(--text)' }}>{d.dream.length > 80 ? d.dream.slice(0, 80) + '…' : d.dream}</p>
                      <button onClick={() => remove(d.id)} aria-label="Delete" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
                        ×
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>{d.interpretation}</p>
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono Variable, monospace' }}>
                      {new Date(d.date).toLocaleDateString()} · {d.language?.toUpperCase() || 'EN'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
