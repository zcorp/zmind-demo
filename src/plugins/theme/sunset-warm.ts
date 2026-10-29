// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/theme/sunset-warm.ts
//
// THEME PLUGIN — Sunset Warm
// Generated following PLUGINS.md conventions. author: ai-generated
// ─────────────────────────────────────────────────────────────────────────────

import { ThemePlugin, ThemeColors } from '../types';

export const SunsetWarmTheme: ThemePlugin = {

  meta: {
    id:          'sunset-warm',
    name:        'Sunset Warm',
    description: 'Warm amber-to-crimson tones for creative brainstorming sessions.',
    type:        'theme',
    version:     '1.0.0',
    author:      'ai-generated',
  },

  isDark: false,

  getColors(): ThemeColors {
    return {
      canvasBackground: '#fff8f0',
      nodeFill:         '#ffffff',
      nodeBorder:       '#f0c8a0',
      nodeText:         '#2a1000',
      nodeSelected:     '#e05c20',
      dotGrid:          '#ffe0c0',
      mutedText:        '#b08060',
      palette: [
        '#e05c20',  // depth 0 — burnt orange
        '#e0a020',  // depth 1 — amber
        '#c04080',  // depth 2 — rose
        '#8040c0',  // depth 3 — dusk purple
        '#4080e0',  // depth 4 — twilight blue
        '#20a060',  // depth 5 — forest green
      ],
    };
  },
};
