export interface DreamItem {
  id: number;
  dream: string;
  interpretation: string;
  date: string;
  language?: string;
  perspective?: string;
}

export default function DreamCard({ item, index, onRemove, removeLabel }: {
  item: DreamItem;
  index: number;
  onRemove: (id: number) => void;
  removeLabel: string;
}) {
  const excerpt = item.dream.length > 80 ? item.dream.slice(0, 80) + '…' : item.dream;
  return (
    <div className="card card-hover reveal" data-delay={`${(index % 6) * 60}ms`} style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 10 }}>
        <p style={{ fontWeight: 500, color: 'var(--text)' }}>{excerpt}</p>
        <button
          onClick={() => onRemove(item.id)}
          aria-label={removeLabel}
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>{item.interpretation}</p>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono Variable, monospace' }}>
        {new Date(item.date).toLocaleDateString()} · {(item.language || 'en').toUpperCase()}
      </div>
    </div>
  );
}
