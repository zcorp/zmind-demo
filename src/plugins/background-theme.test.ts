import { describe, expect, it } from 'vitest';
import type { BackgroundRenderOptions, ThemeColors } from './types';
import { CrosshatchBackground } from './background/crosshatch';
import { DotGridBackground } from './background/dot-grid';
import { PaperBackground } from './background/paper';
import { WaveBackground } from './background/wave';
import { renderThemedBackground } from './usePlugins';

const colors: ThemeColors = {
  canvasBackground: '#102030',
  nodeFill: '#ffffff',
  nodeBorder: '#334455',
  nodeText: '#101010',
  nodeSelected: '#ff0000',
  dotGrid: '#667788',
  palette: ['#abcdef', '#fedcba', '#ccbb99', '#9988aa'],
  mutedText: '#777777',
};

const options: BackgroundRenderOptions = {
  width: 800,
  height: 600,
  darkMode: false,
  accentColor: colors.palette[0],
  panX: 0,
  panY: 0,
};

describe('themed background rendering', () => {
  it('uses the active theme background for paper instead of covering it with a fixed color', () => {
    const svg = renderThemedBackground(PaperBackground, options, colors, false);

    expect(svg).toContain('fill="#102030"');
  });

  it('uses the active theme pattern color for dot, wave, and crosshatch backgrounds', () => {
    expect(renderThemedBackground(DotGridBackground, options, colors, false)).toContain('fill="#667788"');
    expect(renderThemedBackground(WaveBackground, options, colors, false)).toContain('stroke="#667788"');
    expect(renderThemedBackground(CrosshatchBackground, options, colors, false)).toContain('stroke="#667788"');
  });

  it('uses the theme darkness when rendering backgrounds', () => {
    const svg = renderThemedBackground(PaperBackground, options, colors, true);

    expect(svg).toContain('rgba(255,255,255,0.015)');
  });
});
