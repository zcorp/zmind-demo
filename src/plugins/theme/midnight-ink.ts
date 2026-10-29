// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/theme/midnight-ink.ts
//
// THEME PLUGIN — Midnight Ink
// Pure black OLED dark theme with high-contrast neon accents.
// author: ai-generated
// ─────────────────────────────────────────────────────────────────────────────

import { ThemePlugin, ThemeColors } from '../types';

export const MidnightInkTheme: ThemePlugin = {

  meta: {
    id:          'midnight-ink',
    name:        'Midnight Ink',
    description: 'Pure black OLED background with neon accent palette — battery-friendly.',
    type:        'theme',
    version:     '1.0.0',
    author:      'ai-generated',
  },

  isDark: true,

  getColors(): ThemeColors {
    return {
      canvasBackground: '#000000',
      nodeFill:         '#0a0a0a',
      nodeBorder:       '#1a1a1a',
      nodeText:         '#e8e8e8',
      nodeSelected:     '#00e5ff',
      dotGrid:          '#111111',
      mutedText:        '#444444',
      palette: [
        '#00e5ff',  // depth 0 — cyan neon
        '#ff4081',  // depth 1 — hot pink
        '#76ff03',  // depth 2 — electric green
        '#ffea00',  // depth 3 — yellow
        '#e040fb',  // depth 4 — purple neon
        '#ff6d00',  // depth 5 — orange
      ],
    };
  },
};
