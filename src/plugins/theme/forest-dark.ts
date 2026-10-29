// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/theme/forest-dark.ts
//
// THEME PLUGIN — Forest Dark
//
// A deep forest-inspired dark theme.
// Copy this file as a starting point to create new themes.
//
// AI GENERATION NOTE:
//   - Only edit values inside getColors().
//   - Do NOT add imports.
//   - palette must have at least 4 entries.
//   - All color values must be valid CSS hex strings (#rrggbb or #rrggbbaa).
// ─────────────────────────────────────────────────────────────────────────────

import { ThemePlugin, ThemeColors } from '../types';

export const ForestDarkTheme: ThemePlugin = {

  meta: {
    id:          'forest-dark',
    name:        'Forest Dark',
    description: 'Deep forest tones — dark green backgrounds with moss and amber accents.',
    type:        'theme',
    version:     '1.0.0',
    author:      'minder-team',
  },

  isDark: true,

  getColors(): ThemeColors {
    return {
      canvasBackground: '#0d1f0d',
      nodeFill:         '#162616',
      nodeBorder:       '#2a4a2a',
      nodeText:         '#c8e6c8',
      nodeSelected:     '#7ec87e',
      dotGrid:          '#1a311a',
      mutedText:        '#4a7a4a',
      palette: [
        '#7ec87e',  // depth 0 — bright moss
        '#c8a84b',  // depth 1 — amber
        '#6ab4b4',  // depth 2 — teal water
        '#c87e7e',  // depth 3 — terracotta
        '#a07ec8',  // depth 4 — dusk purple
        '#7ec8a0',  // depth 5 — mint
      ],
    };
  },
};
