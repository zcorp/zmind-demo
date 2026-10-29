// ─────────────────────────────────────────────────────────────────────────────
// src/components/DevAdminBanner.tsx
//
// Floating banner visible only when VITE_DEV_ADMIN=true.
// Reminds the developer they're in bypass mode and shows quick actions.
// Never rendered in production.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { IS_DEV_ADMIN } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const DevAdminBanner: React.FC = () => {
  const { user, isPro, isTeam } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!IS_DEV_ADMIN) return null;

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
          background: '#7a9a3a', color: '#fff',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 14, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          fontFamily: 'monospace',
        }}
        title="Dev Admin — cliquer pour afficher"
      >
        🛠
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
      background: '#1a1a14', color: '#fff',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      fontFamily: "'Fira Code', monospace",
      fontSize: 12, minWidth: 220,
      border: '1.5px solid #7a9a3a',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#7a9a3a', fontWeight: 700, fontSize: 11, letterSpacing: '.04em' }}>
          🛠 DEV ADMIN
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: 'none', border: 'none', color: '#6a6a5a', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
          title="Réduire"
        >×</button>
      </div>

      {/* User info */}
      <div style={{ color: '#a0b080', marginBottom: 6, lineHeight: 1.6 }}>
        <div>👤 {user?.email ?? '—'}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ background: isPro ? '#2a5a1a' : '#3a3a2a', color: isPro ? '#7a9a3a' : '#6a6a5a', padding: '1px 7px', borderRadius: 8, fontSize: 10.5 }}>
            {isPro ? '⭐ Pro' : 'Free'}
          </span>
          <span style={{ background: isTeam ? '#1a3a5a' : '#3a3a2a', color: isTeam ? '#4a8aba' : '#6a6a5a', padding: '1px 7px', borderRadius: 8, fontSize: 10.5 }}>
            {isTeam ? '👥 Team' : 'Solo'}
          </span>
          <span style={{ background: '#3a2a1a', color: '#c09040', padding: '1px 7px', borderRadius: 8, fontSize: 10.5 }}>
            admin
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: '#2a2a1a', margin: '8px 0' }} />

      {/* Quick links */}
      <div style={{ color: '#6a6a5a', fontSize: 11, lineHeight: 2 }}>
        <div>
          <a href="#/" style={{ color: '#a0b080', textDecoration: 'none' }}>→ Landing</a>
          {' · '}
          <a href="#/auth" style={{ color: '#a0b080', textDecoration: 'none' }}>Auth</a>
          {' · '}
          <a href="#/app" style={{ color: '#a0b080', textDecoration: 'none' }}>App</a>
          {' · '}
          <a href="#/pricing" style={{ color: '#a0b080', textDecoration: 'none' }}>Pricing</a>
        </div>
        <div style={{ color: '#4a4a3a', fontSize: 10, marginTop: 2 }}>
          VITE_DEV_ADMIN=true · plan=team
        </div>
      </div>
    </div>
  );
};
