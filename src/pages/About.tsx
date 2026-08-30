import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';
import { PERSPECTIVES } from '../data/perspectives';

export default function About() {
  const { t } = useI18n();

  const cards = [
    { title: t('about.card1Title'), body: t('about.card1Body') },
    { title: t('about.card2Title'), body: t('about.card2Body') },
    { title: t('about.card3Title'), body: t('about.card3Body') },
  ];

  return (
    <Layout>
      <div className="section">
        <div className="container-narrow">
          <h1 className="h2 serif" style={{ marginBottom: 24 }}>{t('about.title')}</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 16, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p>{t('about.p1')}</p>
            <p>{t('about.p2')}</p>
            <p>{t('about.p3')}</p>
          </div>

          {/* All traditions — the perspective engine */}
          <h2 className="h3 serif" style={{ margin: '48px 0 8px' }}>{t('about.traditionsTitle')}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14.5, marginBottom: 20 }}>{t('about.traditionsLede')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 40 }}>
            {PERSPECTIVES.map((p) => (
              <div key={p.id} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: 'var(--accent)' }}>
                  {p.icon}
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{t(`perspectives.${p.id}.name`)}</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>{t(`perspDesc.${p.id}`)}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '0 0 40px' }}>
            {cards.map((c, i) => (
              <div key={i} className="card">
                <div className="serif" style={{ fontSize: 28, color: 'var(--accent)' }}>{c.title}</div>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>{c.body}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/interpret" className="btn btn-primary">{t('about.cta')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
