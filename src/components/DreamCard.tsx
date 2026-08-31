import { useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { formatDate } from '../lib/datetime';

export interface DreamItem {
  id: number | string;
  dream: string;
  interpretation: string;
  date: string;
  language?: string;
  perspective?: string;
  symbols?: string[];
  mood?: string;
}

const MOOD_EMOJI: Record<string, string> = {
  peace: '😌', anxiety: '😰', hope: '✨', sadness: '😢', anger: '😠', confusion: '🤔',
};

export default function DreamCard({ item, index, onRemove, removeLabel, confirmLabel, perspectiveName }: {
  item: DreamItem;
  index: number;
  onRemove: (id: number | string) => void;
  removeLabel: string;
  confirmLabel?: string;
  perspectiveName?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const { language } = useI18n();
  const excerpt = item.dream.length > 80 ? item.dream.slice(0, 80) + '…' : item.dream;
  return (
    <div className="card card-hover reveal" data-delay={`${(index % 6) * 60}ms`} style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 10 }}>
        <p style={{ fontWeight: 500, color: 'var(--text)' }}>{excerpt}</p>
        {confirming ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => { onRemove(item.id); setConfirming(false); }} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: '#f87171', borderColor: '#f87171' }}>{confirmLabel ?? 'Remove?'}</button>
            <button onClick={() => setConfirming(false)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>×</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label={removeLabel}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        )}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>{item.interpretation}</p>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {item.mood && <span className="tag" style={{ fontSize: 10 }}>{MOOD_EMOJI[item.mood] ?? ''} {item.mood}</span>}
        {item.symbols?.slice(0, 4).map((s) => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
        <span className="mono-meta">
          {formatDate(item.date, language)} · {(item.language || 'en').toUpperCase()}
          {perspectiveName ? ` · ${perspectiveName}` : ''}
        </span>
      </div>
    </div>
  );
}
