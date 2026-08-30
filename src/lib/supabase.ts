/**
 * Supabase client — feature-flagged. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * are absent (or malformed) everything still runs in guest mode: cloud features
 * simply report `enabled: false` and the UI hides them.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

try {
  if (url && anonKey && url.startsWith('http')) {
    client = createClient(url, anonKey);
  }
} catch {
  client = null;
}

export const supabase = client;
export const cloudEnabled = Boolean(client);

export interface CloudDream {
  client_id: number;
  dream: string;
  interpretation: string;
  language?: string;
  perspective?: string;
  symbols?: string[];
  created_at: string;
}
