/**
 * Supabase client — feature-flagged + runtime-configurable.
 *
 * Resolution order for the connection:
 *   1. Runtime override in localStorage (`ds_supabase_url` / `ds_supabase_key`)
 *      — lets a user connect THEIR OWN Supabase project from /profile with no redeploy.
 *   2. Build-time env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) for deployed config.
 *
 * When neither is present everything still runs in guest mode: cloud features
 * report `enabled: false` and the UI shows a "connect your project" prompt.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const LS_URL = 'ds_supabase_url';
const LS_KEY = 'ds_supabase_key';

const buildUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const buildKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function readLs(key: string): string | undefined {
  try {
    const v = localStorage.getItem(key);
    return v && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function buildClient(): SupabaseClient | null {
  const url = readLs(LS_URL) ?? buildUrl;
  const anonKey = readLs(LS_KEY) ?? buildKey;
  if (!url || !anonKey || !url.startsWith('http')) return null;
  try {
    return createClient(url, anonKey);
  } catch {
    return null;
  }
}

let client: SupabaseClient | null = buildClient();

/** Rebuild the client from (possibly new) localStorage overrides. Call after the user connects. */
export function reinitSupabase(): SupabaseClient | null {
  client = buildClient();
  return client;
}

/** Persist the user's own Supabase project, then rebuild the live client. */
export function connectSupabase(url: string, anonKey: string): boolean {
  try {
    localStorage.setItem(LS_URL, url.trim());
    localStorage.setItem(LS_KEY, anonKey.trim());
  } catch {
    return false;
  }
  return Boolean(reinitSupabase());
}

export function isConnected(): boolean {
  return Boolean(client);
}

/** Returns the current live client (rebuilds from any new localStorage override). */
export function getSupabase(): SupabaseClient | null {
  return client ?? buildClient();
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
