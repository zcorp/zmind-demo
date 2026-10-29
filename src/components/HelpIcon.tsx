import React, { useState } from 'react';
import { CloseRounded } from '@mui/icons-material';

interface HelpIconProps {
  darkMode?: boolean;
}

const SHORTCUTS = [
  { key: 'Double-clic',   action: 'Éditer le texte en ligne' },
  { key: 'Entrée',        action: 'Créer un nœud enfant' },
  { key: 'F2',            action: 'Éditer le nœud sélectionné' },
  { key: 'Suppr',         action: 'Supprimer (+ descendants)' },
  { key: 'Espace / Tab',  action: 'Replier / Déplier' },
  { key: 'Ctrl+Z',        action: 'Annuler' },
  { key: 'Ctrl+Y / ⇧Z',  action: 'Rétablir' },
  { key: 'Ctrl+S',        action: 'Sauvegarder maintenant' },
  { key: 'Molette',       action: 'Zoom centré sur le curseur' },
  { key: 'Drag fond',     action: 'Pan (déplacer la vue)' },
  { key: 'Drag nœud',     action: 'Déplacer le nœud' },
];

export const HelpIcon: React.FC<HelpIconProps> = ({ darkMode = false }) => {
  const [open, setOpen] = useState(false);

  const bg    = darkMode ? 'rgba(30,30,60,0.96)' : 'rgba(255,255,255,0.98)';
  const border = darkMode ? '#3a3c5a' : '#e0e4f0';
  const text   = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted  = darkMode ? '#7080a0' : '#8090b0';
  const kbdBg  = darkMode ? '#2a2d4a' : '#f4f6fb';

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Raccourcis clavier"
        aria-label="Raccourcis clavier"
        style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: '#4f8ef7',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          fontWeight: 700,
          boxShadow: '0 3px 12px rgba(79,142,247,0.45)',
          zIndex: 2000,
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        ?
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby="keyboard-shortcuts-title"
          style={{
          position: 'absolute',
          bottom: 72,
          left: 16,
          width: 'min(340px, calc(100% - 32px))',
          maxHeight: 'calc(100dvh - 100px)',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          boxShadow: darkMode
            ? '0 8px 32px rgba(0,0,0,0.6)'
            : '0 8px 32px rgba(79,142,247,0.15)',
          padding: '18px 20px 14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 2000,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 id="keyboard-shortcuts-title" style={{ margin: 0, fontSize: 15, color: text, fontWeight: 600 }}>
              ⌨ Raccourcis
            </h3>
            <button
              aria-label="Fermer les raccourcis"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 18 }}
            >
              <CloseRounded fontSize="small" />
            </button>
          </div>

          <div style={{ display: 'grid', gap: 7, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {SHORTCUTS.map(({ key, action }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <kbd style={{
                  background: kbdBg,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '2px 7px',
                  fontSize: 11.5,
                  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  color: text,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {key}
                </kbd>
                <span style={{ fontSize: 12.5, color: muted, textAlign: 'right' }}>{action}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}`, fontSize: 11.5, color: muted, textAlign: 'center' }}>
            Sauvegarde auto • Export/Import .minder
          </div>
        </div>
      )}
    </>
  );
};
