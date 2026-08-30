import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import DreamCard, { type DreamItem } from '../components/DreamCard';

export default function Saved() {
  const { t } = useI18n();
  const [dreams, setDreams] = useState<DreamItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('saved-dreams');
    if (raw) {
      try { setDreams(JSON.parse(raw)); } catch { setDreams([]); }
    }
  }, []);

  const remove = (id: number) => {
    const next = dreams.filter((d) => d.id !== id);
    setDreams(next);
    localStorage.setItem('saved-dreams', JSON.stringify(next));
  };

  return (
    <Layout>
      <div className="section" style={{ paddingTop: 'clamp(48px, 7vw, 80px)' }}>
        <div className="container-narrow">
          <div className="reveal" style={{ marginBottom: 40 }}>
            <h1 className="h2 serif" style={{ marginBottom: 12 }}>{t('saved.title')}</h1>
            <p className="lede">{t('saved.lede')}</p>
          </div>

          {dreams.length === 0 ? (
            <EmptyState label={t('saved.empty')} cta={t('common.interpretCta')} icon="bookmark" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dreams.map((d, i) => (
                <DreamCard
                  key={d.id}
                  item={d}
                  index={i}
                  onRemove={remove}
                  removeLabel={t('common.remove')}
                  perspectiveName={d.perspective ? t(`perspectives.${d.perspective}.name`) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
