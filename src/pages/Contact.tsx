import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';

export default function Contact() {
  const { t } = useI18n();

  return (
    <Layout>
      <div className="section">
        <div className="container-narrow">
          <span className="eyebrow">{t('contact.eyebrow')}</span>
          <h1 className="h2 serif" style={{ marginBottom: 20 }}>{t('contact.title')}</h1>
          <p className="lede" style={{ marginBottom: 32 }}>{t('contact.lede')}</p>
          <div className="card" style={{ marginBottom: 24 }}>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>{t('contact.email')}</p>
            <a href="mailto:hello@dreamscope.app" className="serif" style={{ fontSize: 22, color: 'var(--accent)', textDecoration: 'none' }}>hello@dreamscope.app</a>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>{t('contact.disclaimer')}</p>
          <div style={{ marginTop: 32 }}>
            <Link to="/interpret" className="btn btn-primary">{t('contact.back')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
