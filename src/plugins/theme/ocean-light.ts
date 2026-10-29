// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/theme/ocean-light.ts
//
// THEME PLUGIN — Ocean Light
//
// Crisp ocean-inspired light theme.
// ─────────────────────────────────────────────────────────────────────────────

import { ThemePlugin, ThemeColors } from '../types';

export const OceanLightTheme: ThemePlugin = {

  meta: {
    id:          'ocean-light',
    name:        'Ocean Light',
    description: 'Crisp ocean blues and sandy neutrals for daytime focus.',
    type:        'theme',
    version:     '1.0.0',
    author:      'minder-team',
  },

  isDark: false,

  getColors(): ThemeColors {
    return {
      canvasBackground: '#f0f7ff',
      nodeFill:         '#ffffff',
      nodeBorder:       '#b8d8f0',
      nodeText:         '#0d2d4a',
      nodeSelected:     '#1a7abf',
      dotGrid:          '#cde4f5',
      mutedText:        '#6898b8',
      palette: [
        '#1a7abf',  // depth 0 — ocean blue
        '#e88c2a',  // depth 1 — sandy orange
        '#2aaa88',  // depth 2 — sea-glass teal
        '#b84a6a',  // depth 3 — coral
        '#6a4ab8',  // depth 4 — deep sea purple
        '#2a9aaa',  // depth 5 — cyan
      ],
    };
  },
};
