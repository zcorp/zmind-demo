// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/theme/gitmind-natural.ts
//
// THEME PLUGIN — Natural (Gitmind-inspired)
//
// Warm off-white canvas, olive/lime accents, organic feel.
// Matches the paper background.
// ─────────────────────────────────────────────────────────────────────────────

import { ThemePlugin, ThemeColors } from '../types';

export const NaturalTheme: ThemePlugin = {
  meta: {
    id:          'natural',
    name:        'Natural',
    description: 'Warm paper tones with olive and earthy accents — inspired by Gitmind.',
    type:        'theme',
    version:     '1.0.0',
    author:      'minder-team',
  },
  isDark: false,
  getColors(): ThemeColors {
    return {
      canvasBackground: '#f5f0e8',
      nodeFill:         '#ffffff',
      nodeBorder:       '#d4cbbf',
      nodeText:         '#1a1a14',
      nodeSelected:     '#7a9a3a',
      dotGrid:          '#e0d8cc',
      mutedText:        '#8a7e6a',
      palette: [
        '#7a9a3a',  // depth 0 — olive green
        '#d4952a',  // depth 1 — warm amber
        '#a05a3a',  // depth 2 — terracotta
        '#4a7a9a',  // depth 3 — slate blue
        '#8a4a9a',  // depth 4 — mauve
        '#3a9a7a',  // depth 5 — teal
      ],
    };
  },
};
