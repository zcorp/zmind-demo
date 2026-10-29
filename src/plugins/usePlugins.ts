// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/usePlugins.ts
//
// Pure hook — no global state, no localStorage writes.
// Plugin preferences are stored in the document itself (doc.pluginPrefs),
// so each tab can have its own theme/background/layout/style independently.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo } from 'react';
import type {
  ThemeColors, BackgroundRenderOptions, BackgroundPlugin, LayoutOptions,
  PluginNodesMap, PluginNode,
  NodeShapeAttrs, NodeTextAttrs, EdgeAttrs,
} from './types';
import type { DocPluginPrefs } from '../types/index';
import {
  getThemes, getBackgrounds, getLayouts, getTemplates, getStyles,
  getThemeById, getLayoutById, getStyleById,
} from './registry';

export { getThemes, getBackgrounds, getLayouts, getTemplates, getStyles };

const DEFAULT_LIGHT      = 'playful';
const DEFAULT_DARK       = 'forest-dark';
const DEFAULT_BACKGROUND = 'paper';
const DEFAULT_LAYOUT     = 'mindmap-balanced';
const DEFAULT_STYLE      = 'playful-cards';

type ResolvedPluginPrefs = Required<Pick<DocPluginPrefs, 'themeId' | 'backgroundId' | 'layoutId' | 'styleId'>>;
type DefaultPluginPrefs = Required<Pick<DocPluginPrefs, 'backgroundId' | 'layoutId' | 'styleId' | 'spacingH' | 'spacingV'>>;

export function createDefaultPluginPrefs(): DefaultPluginPrefs {
  return {
    backgroundId: DEFAULT_BACKGROUND,
    layoutId: DEFAULT_LAYOUT,
    styleId: DEFAULT_STYLE,
    spacingH: 1.0,
    spacingV: 1.0,
  };
}

export function resolvePluginPrefs(prefs: DocPluginPrefs | undefined, darkMode: boolean): ResolvedPluginPrefs {
  const defaults = createDefaultPluginPrefs();
  return {
    themeId:      prefs?.themeId      ?? (darkMode ? DEFAULT_DARK : DEFAULT_LIGHT),
    backgroundId: prefs?.backgroundId ?? defaults.backgroundId,
    layoutId:     prefs?.layoutId     ?? defaults.layoutId,
    styleId:      prefs?.styleId      ?? defaults.styleId,
  };
}

export interface PluginApi {
  activeThemeId:      string;
  activeBackgroundId: string;
  activeLayoutId:     string;
  activeStyleId:      string;
  colors:           ThemeColors;
  isDark:           boolean;
  renderBackground: (opts: BackgroundRenderOptions) => string;
  applyLayout:      (nodes: Readonly<PluginNodesMap>, rootId: string, opts: LayoutOptions) => Map<string, { x: number; y: number }>;
  getNodeShape:     (node: Readonly<PluginNode>, depth: number, isSelected: boolean, accentColor: string) => NodeShapeAttrs;
  getNodeText:      (node: Readonly<PluginNode>, depth: number) => NodeTextAttrs;
  getEdge:          (depth: number, accentColor: string) => EdgeAttrs;
}

export function usePlugins(
  docPluginPrefs: DocPluginPrefs | undefined,
  darkMode: boolean
): PluginApi {
  const prefs = useMemo(
    () => resolvePluginPrefs(docPluginPrefs, darkMode),
    [docPluginPrefs, darkMode]
  );

  const theme      = useMemo(() => getThemeById(prefs.themeId)   ?? getThemes()[0],      [prefs.themeId]);
  const background = useMemo(() => getBackgrounds().find(b => b.meta.id === prefs.backgroundId) ?? getBackgrounds()[0], [prefs.backgroundId]);
  const layout     = useMemo(() => getLayoutById(prefs.layoutId) ?? getLayouts()[0],      [prefs.layoutId]);
  const style      = useMemo(() => getStyleById(prefs.styleId)   ?? getStyles()[0],       [prefs.styleId]);

  const colors = useMemo(() => {
    try { return theme.getColors(); }
    catch { return fallbackColors(darkMode); }
  }, [theme, darkMode]);

  const renderBackground = useCallback((opts: BackgroundRenderOptions): string => {
    try {
      return renderThemedBackground(background, opts, colors, theme.isDark);
    }
    catch { return ''; }
  }, [background, theme, colors]);

  const applyLayout = useCallback((
    nodes: Readonly<PluginNodesMap>, rootId: string, opts: LayoutOptions
  ) => {
    try { return layout.apply(nodes, rootId, opts); }
    catch { return new Map<string, { x: number; y: number }>(); }
  }, [layout]);

  const getNodeShape = useCallback((
    node: Readonly<PluginNode>, depth: number, isSelected: boolean, accentColor: string
  ): NodeShapeAttrs => {
    try { return style.getNodeShape(node, depth, isSelected, accentColor); }
    catch { return fallbackShape(isSelected, accentColor); }
  }, [style]);

  const getNodeText = useCallback((
    node: Readonly<PluginNode>, depth: number
  ): NodeTextAttrs => {
    try { return style.getNodeText(node, depth, theme.isDark); }
    catch { return fallbackText(theme.isDark); }
  }, [style, theme]);

  const getEdge = useCallback((depth: number, accentColor: string): EdgeAttrs => {
    try { return style.getEdge(depth, accentColor); }
    catch { return fallbackEdge(accentColor); }
  }, [style]);

  return {
    activeThemeId:      prefs.themeId,
    activeBackgroundId: prefs.backgroundId,
    activeLayoutId:     prefs.layoutId,
    activeStyleId:      prefs.styleId,
    colors, isDark: theme.isDark,
    renderBackground, applyLayout, getNodeShape, getNodeText, getEdge,
  };
}

export function renderThemedBackground(
  background: BackgroundPlugin,
  options: BackgroundRenderOptions,
  colors: ThemeColors,
  themeIsDark: boolean,
): string {
  return background.render({
    ...options,
    darkMode: themeIsDark,
    canvasBackground: colors.canvasBackground,
    dotGridColor: colors.dotGrid,
  });
}

function fallbackColors(dark: boolean): ThemeColors {
  return {
    canvasBackground: dark ? '#1a1a2e' : '#f4f6fb',
    nodeFill: dark ? '#22243c' : '#ffffff',
    nodeBorder: dark ? '#30325a' : '#d0d8ea',
    nodeText: dark ? '#dde0f8' : '#1a1a2e',
    nodeSelected: '#4f8ef7',
    dotGrid: dark ? '#222447' : '#dde3f0',
    mutedText: dark ? '#6070a0' : '#8090b8',
    palette: ['#4f8ef7','#e05c7b','#4ec9a0','#f5a623','#9b59b6','#1abc9c'],
  };
}
function fallbackShape(isSel: boolean, accent: string): NodeShapeAttrs {
  return { rx: 10, ry: 10, fill: '#ffffff', stroke: isSel ? accent : '#d0d8ea', strokeWidth: isSel ? 2.5 : 1.5 };
}
function fallbackText(dark: boolean): NodeTextAttrs {
  return { fontSize: 12.5, fontWeight: 400, fontFamily: "'Segoe UI', system-ui, sans-serif", fill: dark ? '#dde0f8' : '#1a1a2e' };
}
function fallbackEdge(accent: string): EdgeAttrs {
  return {
    stroke: accent, strokeWidth: 2, strokeOpacity: 0.45,
    pathFn: (x1, y1, x2, y2) => {
      const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
      return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
    },
  };
}

export function nodeDepth(nodes: Record<string, { parentId: string | null }>, id: string): number {
  let d = 0; let cur = nodes[id]?.parentId ?? null;
  while (cur) { d++; cur = nodes[cur]?.parentId ?? null; }
  return d;
}
