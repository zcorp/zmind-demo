import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Paper } from '@mui/material';
import { createPortal } from 'react-dom';

export interface MenuAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  divider?: boolean;   // divider BEFORE this item
  disabled?: boolean;
  danger?: boolean;
  submenu?: MenuAction[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: MenuAction[];
  onAction: (id: string) => void;
  onClose: () => void;
  darkMode: boolean;
}

function MenuItem({
  action, onAction, onClose, darkMode, depth = 0,
}: {
  action: MenuAction;
  onAction: (id: string) => void;
  onClose: () => void;
  darkMode: boolean;
  depth?: number;
}) {
  const [subOpen, setSubOpen] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bg       = darkMode ? '#1e2040' : '#ffffff';
  const textCol  = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted    = darkMode ? '#6070a0' : '#8090b8';
  const hoverBg  = darkMode ? '#2a2d4a' : '#f0f4ff';
  const border   = darkMode ? '#2e3060' : '#e8edf5';

  useLayoutEffect(() => {
    if (!subOpen || !action.submenu || !ref.current) return;
    const updatePosition = () => {
      const anchor = ref.current?.getBoundingClientRect();
      if (!anchor) return;
      const submenuWidth = Math.min(220, window.innerWidth - 24);
      const openLeft = anchor.right + submenuWidth > window.innerWidth - 12 && anchor.left >= submenuWidth + 12;
      const left = openLeft
        ? anchor.left - submenuWidth
        : Math.min(anchor.right - 4, window.innerWidth - submenuWidth - 12);
      setSubmenuPosition(current => current?.left === left
        ? current
        : { left, top: Math.max(12, anchor.top - 4) });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [action.submenu, subOpen]);

  useLayoutEffect(() => {
    if (!submenuPosition || !submenuRef.current) return;
    const bounds = submenuRef.current.getBoundingClientRect();
    const maxTop = Math.max(12, window.innerHeight - bounds.height - 12);
    const top = Math.max(12, Math.min(submenuPosition.top, maxTop));
    if (top !== submenuPosition.top) setSubmenuPosition({ ...submenuPosition, top });
  }, [submenuPosition]);

  const cancelSubmenuClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleSubmenuClose = () => {
    cancelSubmenuClose();
    closeTimer.current = setTimeout(() => setSubOpen(false), 120);
  };

  useEffect(() => () => cancelSubmenuClose(), []);

  if (action.divider) {
    return <div style={{ height: 1, background: border, margin: '4px 10px' }} />;
  }

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onMouseEnter={() => {
        cancelSubmenuClose();
        if (action.submenu) setSubOpen(true);
      }}
      onMouseLeave={() => action.submenu && scheduleSubmenuClose()}
    >
      <button
        disabled={action.disabled}
        onClick={() => {
          if (action.submenu) return;
          onAction(action.id);
          onClose();
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          width: '100%', padding: '7px 14px',
          background: 'none', border: 'none',
          cursor: action.disabled ? 'not-allowed' : 'pointer',
          fontSize: 13, color: action.danger ? '#e05c7b' : (action.disabled ? muted : textCol),
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          textAlign: 'left', borderRadius: 6,
          opacity: action.disabled ? 0.45 : 1,
          transition: 'background 0.08s',
        }}
        onMouseEnter={e => !action.disabled && (e.currentTarget.style.background = hoverBg)}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ width: 18, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>{action.icon}</span>
        <span style={{ flex: 1 }}>{action.label}</span>
        {action.shortcut && (
          <span style={{ fontSize: 11, color: muted, marginLeft: 8 }}>{action.shortcut}</span>
        )}
        {action.submenu && <span style={{ fontSize: 10, color: muted }}>▶</span>}
      </button>

      {action.submenu && subOpen && (
        submenuPosition && createPortal(
          <div
            ref={submenuRef}
            data-context-submenu="true"
            onMouseEnter={cancelSubmenuClose}
            onMouseLeave={scheduleSubmenuClose}
            style={{
              position: 'fixed',
              left: submenuPosition.left,
              top: submenuPosition.top,
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 10,
              boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
              width: 220,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 'calc(100dvh - 24px)',
              overflowY: 'auto',
              padding: '4px 0',
              zIndex: 1400,
            }}
          >
            {action.submenu.map(sub => (
              <MenuItem key={sub.id} action={sub} onAction={onAction} onClose={onClose} darkMode={darkMode} depth={depth + 1} />
            ))}
          </div>,
          document.body,
        )
      )}
    </div>
  );
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x, y, actions, onAction, onClose, darkMode,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target;
      if (
        target instanceof Element &&
        !ref.current?.contains(target) &&
        !target.closest('[data-context-submenu="true"]')
      ) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const menuW = 220;
  useLayoutEffect(() => {
    const updatePosition = () => {
      const menu = ref.current;
      if (!menu) return;
      const maxLeft = Math.max(12, window.innerWidth - menu.offsetWidth - 12);
      const maxTop = Math.max(12, window.innerHeight - menu.offsetHeight - 12);
      setMenuPosition({
        left: Math.max(12, Math.min(x, maxLeft)),
        top: Math.max(12, Math.min(y, maxTop)),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [x, y, actions.length]);

  const border = darkMode ? '#2e3060' : '#e8edf5';
  const initialLeft = Math.max(12, Math.min(x, window.innerWidth - menuW - 12));

  return createPortal(
      <Paper
        ref={ref}
        elevation={darkMode ? 12 : 8}
        role="menu"
        sx={{
          position: 'fixed', left: menuPosition?.left ?? initialLeft, top: menuPosition?.top ?? Math.max(12, y),
          bgcolor: darkMode ? '#1e2040' : '#fff', color: darkMode ? '#e8eaf6' : '#1a1a2e',
          border: `1px solid ${border}`, borderRadius: 2.5,
          width: menuW, maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto',
          py: .5, zIndex: 1300,
          animation: 'ctxFadeIn .1s ease',
        }}
      >
        <style>{`@keyframes ctxFadeIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
        {actions.map(action => (
          <MenuItem
            key={action.id}
            action={action}
            onAction={onAction}
            onClose={onClose}
            darkMode={darkMode}
          />
        ))}
      </Paper>,
      document.body,
  );
};
