import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase as initialClient, cloudEnabled as initialCloud, reinitSupabase, connectSupabase as persistConnection } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  /** True once the initial session check finished. */
  ready: boolean;
  /** Cloud features available (Supabase configured). */
  cloudEnabled: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /** Connect the user's own Supabase project (no redeploy needed). */
  connect: (url: string, anonKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!initialCloud);
  const [cloudEnabled, setCloudEnabled] = useState(initialCloud);

  // (Re)bind auth listeners whenever the client changes (initial + after connect).
  useEffect(() => {
    const client = initialClient;
    if (!client) {
      setReady(true);
      return;
    }
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // initialClient is stable for the session; reconnects call connect() which re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const client = reinitSupabase();
    if (!client) return { error: 'cloud-disabled' };
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/profile' },
    });
    return error ? { error: error.message } : {};
  };

  const signInWithGoogle = async () => {
    const client = reinitSupabase();
    if (!client) return { error: 'cloud-disabled' };
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/profile' },
    });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    const client = reinitSupabase();
    if (client) await client.auth.signOut();
    setUser(null);
  };

  const connect = (url: string, anonKey: string): boolean => {
    const ok = persistConnection(url, anonKey);
    if (ok) setCloudEnabled(true);
    return ok;
  };

  return (
    <AuthContext.Provider value={{ user, ready, cloudEnabled, signInWithMagicLink, signInWithGoogle, signOut, connect }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
