// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/style/minimal-line.ts
//
// STYLE PLUGIN — Minimal Line
//
// Root: rounded pill.
// Level 1: soft capsule with light tint.
// Level 2+: no box — just text + thin underline beneath it.
// This gives a very clean Gitmind-inspired radial look.
// ─────────────────────────────────────────────────────────────────────────────

import {
  StylePlugin, PluginNode,
  NodeShapeAttrs, NodeTextAttrs, EdgeAttrs,
} from '../types';

function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const MinimalLineStyle: StylePlugin = {

  meta: {
    id:          'minimal-line',
    name:        'Minimal Line',
    description: 'Root en pilule, branches en capsule tintée, feuilles en texte souligné — look radial épuré.',
    type:        'style',
    version:     '1.0.0',
    author:      'minder-team',
  },

  getNodeShape(
    node: Readonly<PluginNode>,
    depth: number,
    isSelected: boolean,
    accentColor: string
  ): NodeShapeAttrs {
    const accent = node.color ?? accentColor;

    if (depth === 0) {
      return {
        rx: 22, ry: 22,
        fill:        node.bgColor ?? accent,
        stroke:      isSelected ? '#fff' : 'none',
        strokeWidth: isSelected ? 3 : 0,
      };
    }

    if (depth === 1) {
      return {
        rx: 14, ry: 14,
        fill:        node.bgColor ?? hexAlpha(accent, 0.10),
        stroke:      isSelected ? accent : hexAlpha(accent, 0.4),
        strokeWidth: isSelected ? 2 : 1,
      };
    }

    // Depth 2+: invisible box (the canvas will still render the rect for hitbox,
    // but with fill=transparent so it looks empty)
    return {
      rx: 4, ry: 4,
      fill:        isSelected ? hexAlpha(accentColor, 0.08) : 'transparent',
      stroke:      isSelected ? accentColor : 'transparent',
      strokeWidth: 0,
      // signal to canvas: render underline, not full box
      strokeDasharray: 'none-leaf',
    };
  },

  getNodeText(
    _node: Readonly<PluginNode>,
    depth: number,
    darkMode: boolean
  ): NodeTextAttrs {
    if (depth === 0) {
      return { fontSize: 14, fontWeight: 700, fontFamily: "'Segoe UI', system-ui, sans-serif", fill: '#ffffff' };
    }
    if (depth === 1) {
      return { fontSize: 13, fontWeight: 600, fontFamily: "'Segoe UI', system-ui, sans-serif", fill: darkMode ? '#e8eaf6' : '#1a1a14' };
    }
    return { fontSize: 12, fontWeight: 400, fontFamily: "'Segoe UI', system-ui, sans-serif", fill: darkMode ? '#b0bcd8' : '#3a3530' };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke:        accentColor,
      strokeWidth:   depth === 0 ? 2 : 1.5,
      strokeOpacity: depth >= 2 ? 0.35 : 0.55,
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
