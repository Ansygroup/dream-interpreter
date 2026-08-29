import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';

export default function FAQ() {
  const { t } = useI18n();

  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <Layout>
      <div className="section">
        <div className="container-narrow">
          <h1 className="h2 serif" style={{ marginBottom: 40 }}>{t('faq.title')}</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {faqs.map((f, i) => (
              <div key={i} className="card">
                <h2 className="h3 serif" style={{ marginBottom: 10, color: 'var(--text)' }}>{f.q}</h2>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Link to="/interpret" className="btn btn-primary" style={{ textDecoration: 'none' }}>{t('common.interpretCta')}</Link>
          </div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Layout>
  );
}
