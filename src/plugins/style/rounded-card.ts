// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/style/rounded-card.ts
//
// STYLE PLUGIN — Rounded Card (v2)
//
// Depth-aware rendering inspired by Gitmind:
//   depth 0 (root)  → large pill, filled with accent, white text, bold
//   depth 1         → medium radius, accent fill at lower opacity
//   depth 2+        → small radius, white fill, accent border, smaller text
// ─────────────────────────────────────────────────────────────────────────────

import {
  StylePlugin, PluginNode,
  NodeShapeAttrs, NodeTextAttrs, EdgeAttrs,
} from '../types';

/** Hex color with alpha: hex("#4f8ef7", 0.15) → "rgba(79,142,247,0.15)" */
function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const RoundedCardStyle: StylePlugin = {

  meta: {
    id:          'rounded-card',
    name:        'Rounded Card',
    description: 'Profondeur visuelle : root en pilule, branches en carte, feuilles en ligne.',
    type:        'style',
    version:     '2.0.0',
    author:      'minder-team',
  },

  getNodeShape(
    node: Readonly<PluginNode>,
    depth: number,
    isSelected: boolean,
    accentColor: string
  ): NodeShapeAttrs {
    // Override color takes precedence
    const accent = node.color ?? accentColor;

    if (depth === 0) {
      // Root: large pill, solid accent fill
      return {
        rx: 20, ry: 20,
        fill:        node.bgColor ?? accent,
        stroke:      isSelected ? '#ffffff' : accent,
        strokeWidth: isSelected ? 3 : 0,
      };
    }

    if (depth === 1) {
      // Level 1: medium card with light accent fill
      return {
        rx: 12, ry: 12,
        fill:        node.bgColor ?? hexAlpha(accent, 0.12),
        stroke:      isSelected ? accent : accent,
        strokeWidth: isSelected ? 2.5 : 1.5,
      };
    }

    // Level 2+: minimal card
    return {
      rx: 8, ry: 8,
      fill:        node.bgColor ?? '#ffffff',
      stroke:      isSelected ? accent : '#d4cbbf',
      strokeWidth: isSelected ? 2 : 1,
    };
  },

  getNodeText(
    _node: Readonly<PluginNode>,
    depth: number,
    darkMode: boolean
  ): NodeTextAttrs {
    if (depth === 0) {
      // Root: bold white on dark fill
      return {
        fontSize:   14,
        fontWeight: 700,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fill:       '#ffffff',
      };
    }
    if (depth === 1) {
      return {
        fontSize:   13,
        fontWeight: 600,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fill:       darkMode ? '#e8eaf6' : '#1a1a14',
      };
    }
    return {
      fontSize:   12,
      fontWeight: 400,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fill:       darkMode ? '#c0c8e0' : '#3a3530',
    };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke:        accentColor,
      strokeWidth:   depth === 0 ? 2 : 1.5,
      strokeOpacity: depth === 0 ? 0.7 : 0.5,
      // Natural s-curve: same as smartBezier in canvas
      pathFn: (x1, y1, x2, y2) => {
        const dx = x2 - x1, dy = y2 - y1;
        if (Math.abs(dx) >= Math.abs(dy) * 0.7) {
          const cx = Math.max(Math.abs(dx) * 0.45, 50);
          const s  = dx >= 0 ? 1 : -1;
          return `M${x1},${y1} C${x1 + s * cx},${y1} ${x2 - s * cx},${y2} ${x2},${y2}`;
        }
        const cy = Math.max(Math.abs(dy) * 0.45, 40);
        const s  = dy >= 0 ? 1 : -1;
        return `M${x1},${y1} C${x1},${y1 + s * cy} ${x2},${y2 - s * cy} ${x2},${y2}`;
      },
    };
  },
};
