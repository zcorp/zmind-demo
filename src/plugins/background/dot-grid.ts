// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/background/dot-grid.ts
//
// BACKGROUND PLUGIN — Dot Grid
//
// The default dot-grid background.
// Use this as the reference implementation for background plugins.
//
// AI GENERATION NOTE:
//   - render() must return a plain SVG fragment string (no <svg> wrapper).
//   - Only use inline attributes — no <style> blocks, no external hrefs.
//   - The fragment must work at any viewport size.
//   - Do NOT use JavaScript inside the SVG string.
// ─────────────────────────────────────────────────────────────────────────────

import { BackgroundPlugin, BackgroundOptions } from '../types';

export const DotGridBackground: BackgroundPlugin = {

  meta: {
    id:          'dot-grid',
    name:        'Dot Grid',
    description: 'Minimal dot grid that follows pan offset.',
    type:        'background',
    version:     '1.0.0',
    author:      'minder-team',
  },

  render(opts: BackgroundOptions): string {
    const { dotGridColor, panX, panY } = opts;
    // Keep the pan offset modulo grid size so the pattern tiles seamlessly
    const ox = (panX % 40).toFixed(1);
    const oy = (panY % 40).toFixed(1);

    return [
      `<defs>`,
      `  <pattern id="bg-dots" width="40" height="40" patternUnits="userSpaceOnUse"`,
      `    patternTransform="translate(${ox},${oy})">`,
      `    <circle cx="0" cy="0" r="1" fill="${dotGridColor}"/>`,
      `  </pattern>`,
      `</defs>`,
      `<rect width="100%" height="100%" fill="url(#bg-dots)"/>`,
    ].join('\n');
  },
};
