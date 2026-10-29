// ─────────────────────────────────────────────────────────────────────────────
// src/components/ZoomBar.tsx
//
// Fixed zoom control bar — bottom right of the canvas.
// Inspired by Gitmind: − | 43% | + | fit | fullscreen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  FitScreenRounded, FullscreenRounded, ZoomInRounded, ZoomOutRounded,
} from '@mui/icons-material';

interface ZoomBarProps {
  scale:        number;
  darkMode:     boolean;
  onZoomIn:     () => void;
  onZoomOut:    () => void;
  onFitView:    () => void;
  onSetZoom:    (scale: number) => void;
  onFullscreen: () => void;
}

export const ZoomBar: React.FC<ZoomBarProps> = ({
  scale, darkMode, onZoomIn, onZoomOut, onFitView, onSetZoom, onFullscreen,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const bg     = darkMode ? 'rgba(26,26,46,0.97)' : 'rgba(255,255,255,0.97)';
  const border = darkMode ? '#30325a' : '#e0e6f0';
  const text   = darkMode ? '#dde0f8' : '#1a1a2e';
  const muted  = darkMode ? '#6070a0' : '#9090b8';

  const iconButtonSx = {
    width: 36, height: 36, borderRadius: 1.5, color: text,
    '&:hover': { bgcolor: darkMode ? '#2a2d4a' : '#f0f4ff' },
  };

  const PRESETS = [25, 50, 75, 100, 150, 200];

  return (
    <div style={{
      position: 'absolute', bottom: 14, right: 14,
      display: 'flex', alignItems: 'center',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      height: 36,
      boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 14px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(8px)',
      zIndex: 310,
      userSelect: 'none',
    }}>
      <Tooltip title="Zoom arrière">
        <IconButton aria-label="Zoom arrière" onClick={onZoomOut} sx={iconButtonSx}>
          <ZoomOutRounded fontSize="small" />
        </IconButton>
      </Tooltip>

      <div style={{ width: 1, height: 18, background: border }} />

      {/* Zoom percentage — click to show presets */}
      <div style={{ position: 'relative' }}>
        <button
          aria-label={`Zoom ${Math.round(scale * 100)} %`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, minWidth: 52, fontSize: 12.5, fontWeight: 600, height: 36, padding: '0 8px', borderRadius: 6 }}
          onClick={() => setShowMenu(o => !o)}
          title="Zoom (clic pour choisir)"
          onMouseEnter={e => (e.currentTarget.style.background = darkMode ? '#2a2d4a' : '#f0f4ff')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {Math.round(scale * 100)}%
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute', bottom: '100%', left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 6,
              background: bg, border: `1px solid ${border}`,
              borderRadius: 9, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 320, minWidth: 80,
            }}
            onMouseLeave={() => setShowMenu(false)}
          >
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: muted, width: '100%', fontSize: 12.5, height: 32 }}
              onClick={() => { onFitView(); setShowMenu(false); }}>
              Ajuster
            </button>
            <div style={{ height: 1, background: border }} />
            {PRESETS.map(p => (
              <button key={p}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                  fontSize: 12.5, height: 30,
                  color: Math.round(scale * 100) === p ? '#4f8ef7' : text,
                  fontWeight: Math.round(scale * 100) === p ? 700 : 400,
                }}
                onClick={() => {
                  onSetZoom(p / 100);
                  setShowMenu(false);
                }}
                onMouseEnter={e => (e.currentTarget.style.background = darkMode ? '#2a2d4a' : '#f0f4ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {p}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 18, background: border }} />

      <Tooltip title="Zoom avant">
        <IconButton aria-label="Zoom avant" onClick={onZoomIn} sx={iconButtonSx}>
          <ZoomInRounded fontSize="small" />
        </IconButton>
      </Tooltip>

      <div style={{ width: 1, height: 18, background: border }} />

      {/* Fit to screen */}
      <Tooltip title="Ajuster à l’écran">
        <IconButton aria-label="Ajuster à l’écran" onClick={onFitView} sx={iconButtonSx}>
          <FitScreenRounded fontSize="small" />
        </IconButton>
      </Tooltip>

      <div style={{ width: 1, height: 18, background: border }} />

      {/* Fullscreen */}
      <Tooltip title="Plein écran">
        <IconButton aria-label="Plein écran" onClick={onFullscreen} sx={iconButtonSx}>
          <FullscreenRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
};
