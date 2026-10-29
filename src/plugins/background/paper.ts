// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/background/paper.ts
//
// BACKGROUND PLUGIN — Warm Paper
//
// A soft, warm off-white background that mimics Gitmind's paper texture.
// Uses SVG noise-like cross-hatching at very low opacity.
// ─────────────────────────────────────────────────────────────────────────────

import { BackgroundPlugin, BackgroundOptions } from '../types';

export const PaperBackground: BackgroundPlugin = {

  meta: {
    id:          'paper',
    name:        'Papier doux',
    description: 'Fond papier chaud comme Gitmind — très doux, professionnel.',
    type:        'background',
    version:     '1.0.0',
    author:      'minder-team',
  },

  render(opts: BackgroundOptions): string {
    const { darkMode, canvasBackground } = opts;

    const grainFill = darkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)';
    const lineFill  = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';

    // Subtle diagonal lines + micro-dots for paper grain feel
    return [
      `<defs>`,
      `  <pattern id="bg-paper-grain" width="8" height="8" patternUnits="userSpaceOnUse">`,
      `    <circle cx="1" cy="1" r="0.4" fill="${grainFill}"/>`,
      `    <circle cx="5" cy="3" r="0.3" fill="${grainFill}"/>`,
      `    <circle cx="3" cy="6" r="0.4" fill="${grainFill}"/>`,
      `    <circle cx="7" cy="7" r="0.3" fill="${grainFill}"/>`,
      `  </pattern>`,
      `  <pattern id="bg-paper-lines" width="60" height="60" patternUnits="userSpaceOnUse">`,
      `    <line x1="0" y1="0" x2="60" y2="60" stroke="${lineFill}" stroke-width="0.5"/>`,
      `    <line x1="60" y1="0" x2="0" y2="60" stroke="${lineFill}" stroke-width="0.5"/>`,
      `  </pattern>`,
      `</defs>`,
      `<rect width="100%" height="100%" fill="${canvasBackground}"/>`,
      `<rect width="100%" height="100%" fill="url(#bg-paper-lines)" opacity="1"/>`,
      `<rect width="100%" height="100%" fill="url(#bg-paper-grain)" opacity="1"/>`,
    ].join('\n');
  },
};
