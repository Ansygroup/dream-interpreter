import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function NotFound() {
  const { t, isRtl } = useI18n();
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ position: 'relative', zIndex: 1 }}>
      <div className="ambient" />
      <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>{t('notfound.code')}</span>
          <h1 className="display serif" style={{ marginBottom: 16 }}>{t('notfound.title')}</h1>
          <p className="lede" style={{ margin: '0 auto 32px' }}>{t('notfound.lede')}</p>
          <Link to="/" className="btn btn-primary">{t('notfound.cta')}</Link>
        </div>
      </div>
    </div>
  );
}
