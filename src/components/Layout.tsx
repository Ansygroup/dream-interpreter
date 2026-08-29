import { useState, type ReactNode } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useReveal } from '../hooks/useReveal';
import { useTheme } from '../hooks/useTheme';
import LanguagePicker from './LanguagePicker';

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} aria-label="Dreamscope">
      <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-glow)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center' }}>
        <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15, color: 'var(--accent)' }}><path d="M12 3a6 6 0 0 0 0 12 4 4 0 0 1 0 6" /><path d="M12 3a6 6 0 0 1 0 12" /></svg>
      </span>
      <span className="serif" style={{ fontSize: size, fontWeight: 600, color: 'var(--text)' }}>Dreamscope</span>
    </Link>
  );
}

const SunIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 17, height: 17 }}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
const MoonIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 17, height: 17 }}><path d="M12 3a6 6 0 0 0 0 12 4 4 0 0 1 0 6" /><path d="M12 3a6 6 0 0 1 0 12" /></svg>
);
const BurgerIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
const CloseIcon = (
  <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><path d="M18 6 6 18M6 6l12 12" /></svg>
);

const EXTERNAL_LINKS = [
  { href: 'https://ai-blog-ansygroups-projects.vercel.app', label: 'nav.aiBlog' },
  { href: 'https://ansygroup.com', label: 'nav.ansyGroup' },
];

/**
 * Shared page shell: ambient glow, sticky nav (desktop links / mobile menu,
 * theme toggle), footer. Wraps children in the reveal-animation observer.
 */
export default function Layout({ children, title }: { children: ReactNode; title?: string }) {
  const { t, isRtl } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useReveal<HTMLDivElement>();
  const year = new Date().getFullYear();

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  const navLinks = (
    <>
      <Link to="/interpret" className="navlink" onClick={() => setMenuOpen(false)}>{t('nav.interpret')}</Link>
      <Link to="/symbols" className="navlink" onClick={() => setMenuOpen(false)}>{t('nav.symbols')}</Link>
      <Link to="/about" className="navlink" onClick={() => setMenuOpen(false)}>{t('nav.about')}</Link>
      <Link to="/faq" className="navlink" onClick={() => setMenuOpen(false)}>{t('nav.faq')}</Link>
      <Link to="/history" className="navlink" onClick={() => setMenuOpen(false)}>{t('nav.history')}</Link>
      <Link to="/saved" className="navlink" onClick={() => setMenuOpen(false)}>{t('nav.saved')}</Link>
      {EXTERNAL_LINKS.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="navlink nav-ext" onClick={() => setMenuOpen(false)}>{t(l.label)}</a>
      ))}
    </>
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ position: 'relative', zIndex: 1 }}>
      <div className="ambient" />
      <div ref={ref}>
        <header className="site-header">
          <nav className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <Logo />
            <div className="nav-links">{navLinks}</div>
            <div className="nav-actions">
              <LanguagePicker />
              <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? SunIcon : MoonIcon}
              </button>
              <Link to="/interpret" className="btn btn-primary nav-cta">{t('nav.start')}</Link>
              <button className="icon-btn nav-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen}>
                {menuOpen ? CloseIcon : BurgerIcon}
              </button>
            </div>
          </nav>
          {menuOpen && <div className="mobile-menu">{navLinks}</div>}
        </header>

        <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>

        <footer className="section-line" style={{ padding: '40px 0' }}>
          <div className="container footer-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
              <span className="serif" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Dreamscope</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 260, lineHeight: 1.6 }}>{t('footer.tagline')}</span>
            </div>
            <div className="footer-links">
              <Link to="/" className="navlink">{t('nav.home')}</Link>
              <Link to="/interpret" className="navlink">{t('nav.interpret')}</Link>
              <Link to="/symbols" className="navlink">{t('nav.symbols')}</Link>
              <Link to="/about" className="navlink">{t('nav.about')}</Link>
              <Link to="/faq" className="navlink">{t('nav.faq')}</Link>
              <Link to="/contact" className="navlink">{t('nav.contact')}</Link>
              <Link to="/history" className="navlink">{t('nav.history')}</Link>
              <Link to="/saved" className="navlink">{t('nav.saved')}</Link>
              {EXTERNAL_LINKS.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="navlink nav-ext">{t(l.label)}</a>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('footer.copyright', { year })}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
