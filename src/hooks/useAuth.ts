// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useAuth.ts
// Global auth state. Call useAuth() anywhere to get current user + plan.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  Session, AuthUser,
  loadSession, clearSession,
  signIn as _signIn, signUp as _signUp, signOut as _signOut,
  refreshSession, signInWithGoogle, parseOAuthSession,
  IS_DEV_ADMIN, makeDevAdminSession,
} from '../lib/supabase';
import { navigate } from '../lib/router';

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AuthState {
  user:     AuthUser | null;
  session:  Session  | null;
  loading:  boolean;
  error:    string | null;
  // Actions
  signIn:         (email: string, password: string) => Promise<void>;
  signUp:         (email: string, password: string) => Promise<void>;
  signOut:        () => Promise<void>;
  signInGoogle:   () => void;
  signInDemo:     () => void;
  clearError:     () => void;
  // Plan helpers
  isPro:  boolean;
  isTeam: boolean;
}

import React from 'react';

export const AuthContext = createContext<AuthState>({
  user: null, session: null, loading: true, error: null,
  signIn: async () => {}, signUp: async () => {}, signOut: async () => {},
  signInGoogle: () => {}, signInDemo: () => {}, clearError: () => {},
  isPro: false, isTeam: false,
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Session initialisée synchroniquement pour dev admin — pas de flash de redirect
  const [session, setSession] = useState<Session | null>(
    IS_DEV_ADMIN ? makeDevAdminSession() : null
  );
  const [loading, setLoading] = useState(!IS_DEV_ADMIN); // false immédiatement en dev admin
  const [error,   setError]   = useState<string | null>(null);

  // ── Boot: restore session or handle OAuth callback ──────────────────────
  useEffect(() => {
    // ── Dev admin bypass ─────────────────────────────────────────────────
    if (IS_DEV_ADMIN) {
      console.info(
        '%c[ZMIND Dev] Admin bypass actif — plan Team, accès complet.',
        'background:#7a9a3a;color:#fff;padding:3px 8px;border-radius:4px;font-weight:600'
      );
      setSession(makeDevAdminSession());
      setLoading(false);
      return;
    }

    // Check for OAuth callback hash params
    if (window.location.hash.includes('access_token=')) {
      const s = parseOAuthSession();
      if (s) {
        setSession(s);
        window.history.replaceState(null, '', '/#/app');
      }
      setLoading(false);
      return;
    }

    // Restore stored session
    const stored = loadSession();
    if (stored) {
      const expiresIn = stored.expires_at - Date.now() / 1000;
      if (expiresIn < 300 && stored.refresh_token) {
        refreshSession(stored.refresh_token)
          .then(setSession)
          .catch(() => { clearSession(); setSession(null); })
          .finally(() => setLoading(false));
      } else {
        setSession(stored);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_DEV_ADMIN) { setSession(makeDevAdminSession()); return; }
    setError(null); setLoading(true);
    try { setSession(await _signIn(email, password)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (IS_DEV_ADMIN) { setSession(makeDevAdminSession()); return; }
    setError(null); setLoading(true);
    try { setSession(await _signUp(email, password)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    if (session?.access_token) await _signOut(session.access_token).catch(() => {});
    clearSession(); setSession(null);
  }, [session]);

  const clearError  = useCallback(() => setError(null), []);

  const signInDemo = useCallback(() => {
    // Instant demo session — no Supabase, no password needed
    setError(null);
    setSession(makeDevAdminSession());
    navigate('/app');
  }, []);

  const value: AuthState = {
    user:    session?.user ?? null,
    session,
    loading,
    error,
    signIn, signUp, signOut,
    signInGoogle: signInWithGoogle,
    signInDemo,
    clearError,
    isPro:  session?.user.plan === 'pro'  || session?.user.plan === 'team',
    isTeam: session?.user.plan === 'team',
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}
