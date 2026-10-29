// ─────────────────────────────────────────────────────────────────────────────
// src/lib/supabase.ts
//
// Lightweight Supabase Auth client using fetch directly (no SDK needed).
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
// ─────────────────────────────────────────────────────────────────────────────

export const SUPABASE_URL      = ((typeof window !== 'undefined' && (window as any).__SUPABASE_URL__)  ) || 'https://YOUR_PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = ((window as any).__MINDER_SUPABASE_KEY__) ?? 'YOUR_ANON_KEY';

const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

// ─── Dev admin bypass ─────────────────────────────────────────────────────────
// When VITE_DEV_ADMIN=true, all auth calls are bypassed.
// The admin gets plan='team' (full access). NEVER enable in production.

const IS_DEV_ADMIN =
  typeof import.meta !== 'undefined' &&
  (import.meta as any).env?.VITE_DEV_ADMIN === 'true';

const DEV_ADMIN_EMAIL =
  typeof import.meta !== 'undefined'
    ? ((import.meta as any).env?.VITE_DEV_ADMIN_EMAIL ?? 'admin@dev.local')
    : 'admin@dev.local';

export function makeDevAdminSession(): Session {
  return {
    access_token:  'dev-admin-token',
    refresh_token: 'dev-admin-refresh',
    expires_at:    Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year
    user: {
      id:    'dev-admin-00000000-0000-0000-0000-000000000000',
      email: DEV_ADMIN_EMAIL,
      plan:  'team',
    },
  };
}

export { IS_DEV_ADMIN };

// ─── Storage keys ────────────────────────────────────────────────────────────

const SESSION_KEY = 'minder_session';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:    string;
  email: string;
  plan:  'free' | 'pro' | 'team';
}

export interface Session {
  access_token:  string;
  refresh_token: string;
  expires_at:    number;
  user:          AuthUser;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function headers(token?: string): HeadersInit {
  return {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token ?? SUPABASE_ANON_KEY}`,
  };
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${AUTH_URL}${path}`, {
    method:  'POST',
    headers: headers(token),
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? data.msg ?? 'Auth error');
  return data as T;
}

// ─── Session persistence ─────────────────────────────────────────────────────

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (s.expires_at && s.expires_at < Date.now() / 1000) {
      // Expired — try refresh
      return null;
    }
    return s;
  } catch { return null; }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Auth operations ─────────────────────────────────────────────────────────

interface RawSession {
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
  user: { id: string; email: string; user_metadata?: { plan?: string } };
}

function normalizeSession(raw: RawSession): Session {
  return {
    access_token:  raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at:    Math.floor(Date.now() / 1000) + (raw.expires_in ?? 3600),
    user: {
      id:    raw.user.id,
      email: raw.user.email,
      plan:  (raw.user.user_metadata?.plan as 'free' | 'pro' | 'team') ?? 'free',
    },
  };
}

export async function signUp(email: string, password: string): Promise<Session> {
  const raw = await post<RawSession>('/signup', { email, password });
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const raw = await post<RawSession>('/token?grant_type=password', { email, password });
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
}

export async function signOut(token: string): Promise<void> {
  await post('/logout', {}, token);
  clearSession();
}

export async function refreshSession(refreshToken: string): Promise<Session> {
  const raw = await post<RawSession>('/token?grant_type=refresh_token', { refresh_token: refreshToken });
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export function signInWithGoogle(): void {
  const redirectTo = `${window.location.origin}/#/auth/callback`;
  window.location.href =
    `${AUTH_URL}/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

/**
 * Parse the access_token from the URL hash after OAuth redirect.
 * Call this on #/auth/callback.
 */
export function parseOAuthSession(): Session | null {
  const hash = window.location.hash.slice(1); // remove leading #
  // The hash might be like: /auth/callback#access_token=...
  const paramStr = hash.includes('access_token=') ? hash : window.location.search.slice(1);
  const params = new URLSearchParams(paramStr);
  const access_token  = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const expires_in    = parseInt(params.get('expires_in') ?? '3600', 10);
  if (!access_token) return null;

  // Decode user from JWT payload
  try {
    const payload = JSON.parse(atob(access_token.split('.')[1]));
    const session: Session = {
      access_token,
      refresh_token: refresh_token ?? '',
      expires_at: Math.floor(Date.now() / 1000) + expires_in,
      user: {
        id:    payload.sub ?? '',
        email: payload.email ?? '',
        plan:  payload.user_metadata?.plan ?? 'free',
      },
    };
    saveSession(session);
    return session;
  } catch { return null; }
}
