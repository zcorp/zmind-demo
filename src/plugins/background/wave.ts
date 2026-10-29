// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/background/wave.ts
//
// BACKGROUND PLUGIN — Wave Lines
//
// Subtle horizontal wave lines, evenly spaced.
// Demonstrates a geometry-based background with no external deps.
// ─────────────────────────────────────────────────────────────────────────────

import { BackgroundPlugin, BackgroundOptions } from '../types';

export const WaveBackground: BackgroundPlugin = {

  meta: {
    id:          'wave',
    name:        'Wave Lines',
    description: 'Soft horizontal sine-wave lines for a calm, flowing feel.',
    type:        'background',
    version:     '1.0.0',
    author:      'minder-team',
  },

  render(opts: BackgroundOptions): string {
    const { width, height, dotGridColor } = opts;
    const stroke = dotGridColor;
    const spacing  = 48;
    const amplitude = 8;
    const rows     = Math.ceil(height / spacing) + 2;
    const paths: string[] = [];

    for (let i = 0; i < rows; i++) {
      const y0     = i * spacing;
      const points: string[] = [];
      const steps  = Math.ceil(width / 20) + 2;

      for (let s = 0; s <= steps; s++) {
        const x = s * 20;
        const y = y0 + Math.sin((s / steps) * Math.PI * 4) * amplitude;
        points.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
      }

      paths.push(
        `<path d="${points.join(' ')}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.6"/>`
      );
    }

    return paths.join('\n');
  },
};
