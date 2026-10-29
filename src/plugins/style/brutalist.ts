// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/style/brutalist.ts
//
// STYLE PLUGIN — Brutalist
//
// Hard edges, monospace labels, dashed borders, straight connector lines.
// Demonstrates full customization of node and edge rendering.
// ─────────────────────────────────────────────────────────────────────────────

import {
  StylePlugin, PluginNode,
  NodeShapeAttrs, NodeTextAttrs, EdgeAttrs,
} from '../types';

export const BrutalistStyle: StylePlugin = {

  meta: {
    id:          'brutalist',
    name:        'Brutalist',
    description: 'Hard square nodes, dashed borders, monospace text, straight connectors.',
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
    return {
      rx:              0,
      ry:              0,
      fill:            node.bgColor ?? (depth === 0 ? accentColor : '#ffffff'),
      stroke:          isSelected ? accentColor : '#333333',
      strokeWidth:     isSelected ? 3 : 2,
      strokeDasharray: isSelected ? undefined : '6,3',
    };
  },

  getNodeText(
    _node: Readonly<PluginNode>,
    depth: number,
    darkMode: boolean
  ): NodeTextAttrs {
    return {
      fontSize:      depth === 0 ? 14 : 12,
      fontWeight:    depth === 0 ? 700 : 400,
      fontFamily:    "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      fill:          darkMode ? '#e8eaf6' : '#111111',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    };
  },

  getEdge(_depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke:         accentColor,
      strokeWidth:    1.5,
      strokeOpacity:  0.7,
      strokeDasharray: '4,4',
      // Straight lines instead of curves
      pathFn: (x1, y1, x2, y2) => `M${x1},${y1} L${x2},${y2}`,
    };
  },
};
