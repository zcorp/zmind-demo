// ─────────────────────────────────────────────────────────────────────────────
// src/App.tsx  — Root router + AuthProvider
// ─────────────────────────────────────────────────────────────────────────────

import React, { lazy, Suspense, useEffect } from 'react';
import { useRouter, navigate } from './lib/router';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DevAdminBanner } from './components/DevAdminBanner';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { appTheme } from './theme';

const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const Auth = lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Pricing = lazy(() => import('./pages/Pricing').then(module => ({ default: module.Pricing })));
const MindMapFinal = lazy(() => import('./components/MindMapFinal'));

function AppLoading() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui', fontSize: 14, color: '#66705e',
    }}>
      Chargement de ZMIND…
    </div>
  );
}

// ── Protected route: redirect to /auth if not logged in ──────────────────────
function ProtectedApp() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading]);

  if (loading) return <AppLoading />;

  if (!user) return null;
  return <MindMapFinal />;
}

// ── Root router ───────────────────────────────────────────────────────────────
function Router() {
  const { route }          = useRouter();
  const { user, loading }  = useAuth();

  // Control body scroll: landing/auth pages scroll, app canvas does not
  useEffect(() => {
    const isCanvas = route === '/app';
    document.body.classList.toggle('locked',     isCanvas);
    document.body.classList.toggle('scrollable', !isCanvas);
    return () => { document.body.classList.remove('locked', 'scrollable'); };
  }, [route]);

  // Redirect logged-in user away from landing/auth
  useEffect(() => {
    if (!loading && user && (route === '/' || route === '/auth')) navigate('/app');
  }, [user, loading, route]);

  // While auth is resolving, show nothing (avoids flash of wrong page)
  if (loading) return <AppLoading />;

  // If user is logged in and on a public route, hold until redirect fires
  if (user && (route === '/' || route === '/auth')) return null;

  switch (route) {
    case '/auth':
    case '/auth/callback': return <Auth />;
    case '/app':           return <ProtectedApp />;
    case '/pricing':       return <Pricing />;
    default:               return <Landing />;
  }
}

// ── App shell ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <Suspense fallback={<AppLoading />}>
          <Router />
        </Suspense>
        <DevAdminBanner />
      </AuthProvider>
    </ThemeProvider>
  );
}
