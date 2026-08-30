import type { DreamItem } from '../components/DreamCard';
import { getSupabase } from './supabase';

/**
 * One-time local→cloud migration: push every locally stored dream on first
 * login (deduped by client_id), then mark the migration done.
 */
const MIGRATED_KEY = 'ds-migrated';

export async function migrateLocalDreams(userId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  try {
    if (localStorage.getItem(MIGRATED_KEY) === userId) return 0;
    const local: DreamItem[] = [
      ...JSON.parse(localStorage.getItem('dream-history') || '[]'),
      ...JSON.parse(localStorage.getItem('saved-dreams') || '[]'),
    ];
    if (!local.length) {
      localStorage.setItem(MIGRATED_KEY, userId);
      return 0;
    }
    const rows = local.map((d) => ({
      client_id: d.id,
      dream: d.dream,
      interpretation: d.interpretation,
      language: d.language ?? 'en',
      perspective: d.perspective ?? 'general',
      symbols: d.symbols ?? [],
      created_at: d.date,
    }));
    const { error } = await supabase.from('dreams').upsert(rows, { onConflict: 'user_id,client_id', ignoreDuplicates: true });
    if (error) throw error;
    localStorage.setItem(MIGRATED_KEY, userId);
    return rows.length;
  } catch {
    return 0;
  }
}

/** Save one interpretation to the cloud journal (best-effort). */
export async function saveDreamToCloud(userId: string, item: DreamItem): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  void userId; // RLS scopes the row to the authenticated user
  const { error } = await supabase.from('dreams').upsert(
    {
      client_id: item.id,
      dream: item.dream,
      interpretation: item.interpretation,
      language: item.language ?? 'en',
      perspective: item.perspective ?? 'general',
      symbols: item.symbols ?? [],
      created_at: item.date,
    },
    { onConflict: 'user_id,client_id' }
  );
  return !error;
}

/** Fetch the cloud journal, newest first. */
export async function fetchCloudDreams(userId: string): Promise<DreamItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('dreams')
    .select('client_id, dream, interpretation, language, perspective, symbols, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: Number(r.client_id),
    dream: String(r.dream),
    interpretation: String(r.interpretation),
    date: String(r.created_at),
    language: (r.language as string) ?? 'en',
    perspective: (r.perspective as string) ?? 'general',
    symbols: (r.symbols as string[]) ?? [],
  }));
}

/** Delete one cloud dream by client_id. */
export async function deleteCloudDream(userId: string, clientId: number): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('dreams').delete().eq('user_id', userId).eq('client_id', clientId);
}

/** Persist interpretation feedback (guests included). */
export async function sendCloudFeedback(payload: {
  interpretationId: string;
  helpful: boolean;
  language: string;
  perspective: string;
  engine: string;
}): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from('feedback').insert({
    user_id: userData?.user?.id ?? null,
    interpretation_id: payload.interpretationId,
    helpful: payload.helpful,
    language: payload.language,
    perspective: payload.perspective,
    engine: payload.engine,
  });
  return !error;
}
