import { describe, expect, it } from 'vitest';
import { getBackgrounds, getStyles, getThemes } from './registry';
import { MinderUnderlinedStyle } from './style/minder-underlined';
import { MinderSquareStyle } from './style/minder-square';
import { MinderPillStyle } from './style/minder-pill';
import { MinderFlowStyle } from './style/minder-flow';
import { parallelogramPath } from '../canvas/node-shape';
import type { PluginNode } from './types';

const sampleNode: PluginNode = {
  id: 'node',
  text: 'Example',
  x: 0,
  y: 0,
  parentId: null,
  children: [],
  collapsed: false,
};

describe('Minder-inspired appearance presets', () => {
  it('registers the classic, Solarized, and plain-canvas choices', () => {
    const themes = getThemes();
    const backgrounds = getBackgrounds();

    expect(themes.map(theme => theme.meta.id)).toEqual(expect.arrayContaining([
      'minder-light',
      'minder-dark',
      'solarized-light',
      'solarized-dark',
    ]));
    expect(getStyles().map(style => style.meta.id)).toContain('minder-flow');
    expect(themes.every(theme => theme.getColors().palette.length >= 4)).toBe(true);
    expect(backgrounds.map(background => background.meta.id)).toContain('plain');
  });

  it('provides distinct underlined, square, and pill node treatments', () => {
    const underline = MinderUnderlinedStyle.getNodeShape(sampleNode, 1, false, '#2678c7');
    const square = MinderSquareStyle.getNodeShape(sampleNode, 1, false, '#2678c7');
    const pill = MinderPillStyle.getNodeShape(sampleNode, 1, false, '#2678c7');

    expect(underline.strokeDasharray).toBe('none-leaf');
    expect(square.rx).toBe(3);
    expect(pill.rx).toBe(22);
    expect(MinderSquareStyle.getEdge(1, '#2678c7').pathFn?.(0, 0, 100, 50)).toContain('V');
  });

  it('combines a capsule root, slanted branch cards, and underlined leaves', () => {
    expect(MinderFlowStyle.getNodeShape(sampleNode, 0, false, '#2678c7').rx).toBe(20);
    expect(MinderFlowStyle.getNodeShape(sampleNode, 1, false, '#2678c7').shape).toBe('parallelogram');
    expect(MinderFlowStyle.getNodeShape(sampleNode, 2, false, '#2678c7').strokeDasharray).toBe('none-leaf');
    expect(parallelogramPath(100, 40)).toBe('M16,0 H100 L84,40 H0 Z');
  });
});
