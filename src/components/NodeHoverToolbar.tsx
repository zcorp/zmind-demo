// ─────────────────────────────────────────────────────────────────────────────
// src/components/NodeHoverToolbar.tsx
//
// Mini floating toolbar that appears just above a node on hover.
// Inspired by Gitmind's inline quick-action bar.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';

interface NodeHoverToolbarProps {
  nodeId:    string;
  x: number; y: number;          // world coordinates of node centre
  pan: { x: number; y: number }; // current canvas pan
  scale: number;                  // current canvas scale
  nodeW: number;
  nodeH: number;
  darkMode: boolean;
  hasChildren: boolean;
  onEdit:       () => void;
  onAddChild:   () => void;
  onAddSibling: () => void;
  onDelete:     () => void;
  onOpenStyle:  () => void;
  onCollapse:   () => void;
  isCollapsed:  boolean;
}

export const NodeHoverToolbar: React.FC<NodeHoverToolbarProps> = ({
  x, y, pan, scale, nodeW, nodeH, darkMode,
  hasChildren, isCollapsed,
  onEdit, onAddChild, onAddSibling, onDelete, onOpenStyle, onCollapse,
}) => {
  // Convert world coords to screen coords
  const screenX = x * scale + pan.x;
  const screenY = (y - nodeH / 2) * scale + pan.y;

  const bg     = darkMode ? '#1e2040' : '#ffffff';
  const border = darkMode ? '#30325a' : '#e0e6f0';
  const text   = darkMode ? '#dde0f8' : '#1a1a2e';
  const muted  = darkMode ? '#6070a0' : '#9090b8';
  const accent = '#4f8ef7';

  const BTN_SIZE = 28;
  const TOOLBAR_W = 6 * BTN_SIZE + 5 * 4 + 16; // 6 buttons + gaps + padding

  const actions = [
    { icon: '✏️', label: 'Éditer (F2)', onClick: onEdit },
    { icon: '⤵', label: 'Ajouter enfant (↵)', onClick: onAddChild },
    { icon: '➕', label: 'Ajouter frère (⇧↵)', onClick: onAddSibling },
    { icon: '🎨', label: 'Style', onClick: onOpenStyle },
    ...(hasChildren ? [{ icon: isCollapsed ? '⊕' : '⊖', label: isCollapsed ? 'Déplier' : 'Replier', onClick: onCollapse }] : []),
    { icon: '🗑', label: 'Supprimer', onClick: onDelete, danger: true },
  ];

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        left:    screenX - TOOLBAR_W / 2,
        top:     screenY - 44,
        zIndex:  450,
        background: bg,
        border:  `1px solid ${border}`,
        borderRadius: 10,
        padding: '4px 8px',
        display: 'flex',
        gap: 4,
        boxShadow: darkMode
          ? '0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 16px rgba(0,0,0,0.12)',
        pointerEvents: 'all',
        // Animate in
        animation: 'htbIn 0.12s ease',
      }}
    >
      <style>{`@keyframes htbIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }`}</style>
      {actions.map((a, i) => (
        <button
          key={i}
          title={a.label}
          onClick={e => { e.stopPropagation(); a.onClick(); }}
          style={{
            width: BTN_SIZE, height: BTN_SIZE,
            border: 'none',
            background: 'transparent',
            borderRadius: 7,
            cursor: 'pointer',
            fontSize: 14,
            color: (a as any).danger ? '#e05c7b' : text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = darkMode ? '#2a2d4a' : '#f0f4ff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
};
