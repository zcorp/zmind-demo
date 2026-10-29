import { describe, expect, it } from 'vitest';
import { PlayfulCardsStyle } from './style/playful-cards';
import { PlayfulTheme } from './theme/playful';
import { resolvePluginPrefs } from './usePlugins';
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

describe('playful appearance presets', () => {
  it('provides a light canvas and a distinct, valid branch palette', () => {
    const colors = PlayfulTheme.getColors();

    expect(PlayfulTheme.isDark).toBe(false);
    expect(colors.canvasBackground).toBe('#fffaf4');
    expect(colors.palette.length).toBeGreaterThanOrEqual(4);
    expect(colors.palette.every(color => /^#[\da-f]{6}$/i.test(color))).toBe(true);
  });

  it('uses a filled root, tinted branch cards, and curved colored connections', () => {
    const root = PlayfulCardsStyle.getNodeShape(sampleNode, 0, false, '#6941c6');
    const child = PlayfulCardsStyle.getNodeShape(sampleNode, 1, false, '#117a65');
    const leaf = PlayfulCardsStyle.getNodeShape(sampleNode, 2, false, '#c44d64');
    const edge = PlayfulCardsStyle.getEdge(1, '#117a65');

    expect(root).toMatchObject({ rx: 24, fill: '#6941c6', strokeWidth: 0 });
    expect(child).toMatchObject({ rx: 16, fill: 'rgba(17,122,101,0.16)' });
    expect(leaf.fill).toBe('rgba(196,77,100,0.09)');
    expect(edge.stroke).toBe('#117a65');
    expect(edge.pathFn?.(0, 0, 100, 50)).toContain('C');
    expect(PlayfulCardsStyle.getNodeText(sampleNode, 1, true).fill).toBe('#f5f2ff');
  });

  it('resolves and exposes the new defaults without overriding saved preferences', () => {
    expect(resolvePluginPrefs(undefined, false)).toMatchObject({
      themeId: 'playful',
      styleId: 'playful-cards',
    });
    expect(resolvePluginPrefs(undefined, true)).toMatchObject({
      themeId: 'forest-dark',
      styleId: 'playful-cards',
    });
    expect(resolvePluginPrefs({ themeId: 'natural', styleId: 'sticky-notes' }, false))
      .toMatchObject({ themeId: 'natural', styleId: 'sticky-notes' });
  });
});
