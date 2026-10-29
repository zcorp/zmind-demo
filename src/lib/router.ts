// ─────────────────────────────────────────────────────────────────────────────
// src/lib/router.ts
// Minimal hash-based router — no dependencies.
// Routes: #/  #/auth  #/app  #/pricing
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { IS_DEV_ADMIN } from './supabase';

// Dev admin: skip landing/auth, go straight to /app on first load
if (IS_DEV_ADMIN) {
  const h = window.location.hash;
  if (!h || h === '#' || h === '#/' || h === '') {
    window.location.hash = '/app';
  }
}

export type Route = '/' | '/auth' | '/app' | '/pricing' | '/auth/callback';

function getRoute(): Route {
  const hash = window.location.hash.replace('#', '') || '/';
  // OAuth callback: hash contains access_token
  if (hash.includes('access_token=')) return '/auth/callback';
  const known: Route[] = ['/', '/auth', '/app', '/pricing', '/auth/callback'];
  const match = known.find(r => hash === r || hash.startsWith(r + '?'));
  return match ?? '/';
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const h = () => setRoute(getRoute());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  const navigate = (to: Route) => {
    window.location.hash = to;
  };

  return { route, navigate };
}

export function navigate(to: Route): void {
  window.location.hash = to;
}
