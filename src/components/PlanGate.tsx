// ─────────────────────────────────────────────────────────────────────────────
// src/components/PlanGate.tsx
// Wraps any Pro-only feature. Shows an upgrade prompt for free users.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../lib/router';
import { startCheckout } from '../lib/stripe';

interface PlanGateProps {
  feature:   string;         // e.g. "les liens libres"
  children:  React.ReactNode;
}

export const PlanGate: React.FC<PlanGateProps> = ({ feature, children }) => {
  const { isPro, session } = useAuth();
  if (isPro) return <>{children}</>;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12,
      padding: '24px 20px', textAlign: 'center',
      background: 'rgba(122,154,58,0.06)',
      border: '1.5px dashed #7a9a3a',
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 28 }}>🔒</span>
      <p style={{ fontSize: 14, color: '#1a1a14', fontWeight: 600, margin: 0 }}>
        {feature} est une fonctionnalité Pro
      </p>
      <p style={{ fontSize: 12.5, color: '#8a7e6a', margin: 0 }}>
        Passez à Pro pour débloquer cette fonctionnalité et bien d'autres.
      </p>
      <button
        onClick={() => session
          ? startCheckout('pro', session.user.email, session.access_token)
          : navigate('/auth')
        }
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none',
          background: '#7a9a3a', color: '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        }}
      >
        Passer à Pro — 5 €/mois
      </button>
    </div>
  );
};

// ─── Free plan limits ─────────────────────────────────────────────────────────

export const FREE_LIMITS = {
  maxDocs:  3,
  maxNodes: 50,
} as const;

export function checkFreeLimit(
  type: 'docs' | 'nodes',
  current: number,
  isPro: boolean,
): boolean {
  if (isPro) return true;
  if (type === 'docs')  return current < FREE_LIMITS.maxDocs;
  if (type === 'nodes') return current < FREE_LIMITS.maxNodes;
  return true;
}

// ─── Upgrade banner ───────────────────────────────────────────────────────────

export const UpgradeBanner: React.FC<{ type: 'docs' | 'nodes'; onUpgrade: () => void }> = ({
  type, onUpgrade,
}) => {
  const msg = type === 'docs'
    ? 'Vous avez atteint la limite de 3 cartes. Passez à Pro pour en créer autant que vous voulez.'
    : 'Vous avez atteint la limite de 50 nœuds. Passez à Pro pour des cartes illimitées.';

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a14', color: '#fff',
      padding: '12px 20px', borderRadius: 12,
      display: 'flex', alignItems: 'center', gap: 14,
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: '90vw',
    }}>
      <span style={{ fontSize: 13 }}>🔒 {msg}</span>
      <button onClick={onUpgrade} style={{
        padding: '6px 16px', borderRadius: 7, border: 'none',
        background: '#7a9a3a', color: '#fff',
        cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
        flexShrink: 0,
      }}>
        Passer à Pro
      </button>
    </div>
  );
};
