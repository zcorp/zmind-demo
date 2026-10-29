// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/background/crosshatch.ts
//
// BACKGROUND PLUGIN — Crosshatch Grid
// Fine perpendicular lines forming a graph-paper effect.
// author: ai-generated
// ─────────────────────────────────────────────────────────────────────────────

import { BackgroundPlugin, BackgroundOptions } from '../types';

export const CrosshatchBackground: BackgroundPlugin = {

  meta: {
    id:          'crosshatch',
    name:        'Crosshatch Grid',
    description: 'Fine graph-paper grid lines — great for technical diagrams.',
    type:        'background',
    version:     '1.0.0',
    author:      'ai-generated',
  },

  render(opts: BackgroundOptions): string {
    const { dotGridColor, accentColor, panX, panY } = opts;
    const lineColor = dotGridColor;
    const cellSize    = 40;
    const bigCell     = cellSize * 5; // major gridline every 5 cells
    const ox = ((panX % bigCell) + bigCell) % bigCell;
    const oy = ((panY % bigCell) + bigCell) % bigCell;

    return [
      `<defs>`,
      // Minor grid
      `  <pattern id="bg-minor" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse"`,
      `    patternTransform="translate(${ox.toFixed(1)},${oy.toFixed(1)})">`,
      `    <path d="M${cellSize},0 L0,0 0,${cellSize}" fill="none" stroke="${lineColor}" stroke-width="0.5"/>`,
      `  </pattern>`,
      // Major grid (every 5)
      `  <pattern id="bg-major" width="${bigCell}" height="${bigCell}" patternUnits="userSpaceOnUse"`,
      `    patternTransform="translate(${ox.toFixed(1)},${oy.toFixed(1)})">`,
      `    <rect width="${bigCell}" height="${bigCell}" fill="url(#bg-minor)"/>`,
      `    <path d="M${bigCell},0 L0,0 0,${bigCell}" fill="none" stroke="${accentColor}" stroke-width="1"/>`,
      `  </pattern>`,
      `</defs>`,
      `<rect width="100%" height="100%" fill="url(#bg-major)"/>`,
    ].join('\n');
  },
};
