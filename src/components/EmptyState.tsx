import { Link } from 'react-router-dom';

export default function EmptyState({ label, cta, icon = 'book' }: { label: string; cta: string; icon?: 'book' | 'bookmark' }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
      {icon === 'bookmark' ? (
        <svg className="icon" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: 'var(--muted)', margin: '0 auto 16px' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
      ) : (
        <svg className="icon" viewBox="0 0 24 24" style={{ width: 32, height: 32, color: 'var(--muted)', margin: '0 auto 16px' }}><path d="M4 19V5l8 5 8-5v14" /><path d="M12 10v9" /></svg>
      )}
      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{label}</p>
      <Link to="/interpret" className="btn btn-primary">{cta}</Link>
    </div>
  );
}
