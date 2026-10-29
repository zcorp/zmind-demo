import { describe, expect, it } from 'vitest';
import { createDefaultPluginPrefs, resolvePluginPrefs } from './usePlugins';

describe('document plugin preferences', () => {
  it('creates independent default preferences for each new map', () => {
    expect(createDefaultPluginPrefs()).toEqual({
      backgroundId: 'paper',
      layoutId: 'mindmap-balanced',
      styleId: 'playful-cards',
      spacingH: 1,
      spacingV: 1,
    });
  });

  it('uses the app display mode only until a map has an explicitly selected theme', () => {
    const prefs = createDefaultPluginPrefs();

    expect(resolvePluginPrefs(prefs, true)).toEqual({
      themeId: 'forest-dark',
      backgroundId: 'paper',
      layoutId: 'mindmap-balanced',
      styleId: 'playful-cards',
    });
    expect(resolvePluginPrefs({ ...prefs, themeId: 'playful' }, true).themeId).toBe('playful');
  });

  it('completes older partial preferences with defaults without replacing saved choices', () => {
    expect(resolvePluginPrefs({ themeId: 'forest-dark' }, false)).toEqual({
      themeId: 'forest-dark',
      backgroundId: 'paper',
      layoutId: 'mindmap-balanced',
      styleId: 'playful-cards',
    });
  });
});
