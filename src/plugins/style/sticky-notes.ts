// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/style/sticky-notes.ts
//
// STYLE PLUGIN — Sticky Notes
// Rounded squares with a soft yellow fill for root, white for children.
// Slightly thicker hand-drawn-feel borders.
// author: ai-generated
// ─────────────────────────────────────────────────────────────────────────────

import {
  StylePlugin, PluginNode,
  NodeShapeAttrs, NodeTextAttrs, EdgeAttrs,
} from '../types';

// Sticky note background colors by depth
const STICKY_FILLS = ['#fff9c4', '#ffffff', '#e8f5e9', '#fce4ec', '#e3f2fd', '#fff3e0'];

export const StickyNotesStyle: StylePlugin = {

  meta: {
    id:          'sticky-notes',
    name:        'Sticky Notes',
    description: 'Colored sticky-note shapes with a hand-written feel.',
    type:        'style',
    version:     '1.0.0',
    author:      'ai-generated',
  },

  getNodeShape(
    node: Readonly<PluginNode>,
    depth: number,
    isSelected: boolean,
    accentColor: string
  ): NodeShapeAttrs {
    const fill = node.bgColor ?? STICKY_FILLS[depth % STICKY_FILLS.length];
    return {
      rx:              4,
      ry:              4,
      fill,
      stroke:          isSelected ? accentColor : '#bdbdbd',
      strokeWidth:     isSelected ? 2.5 : 1.5,
      strokeDasharray: undefined,
    };
  },

  getNodeText(
    _node: Readonly<PluginNode>,
    depth: number,
    _darkMode: boolean
  ): NodeTextAttrs {
    return {
      fontSize:    depth === 0 ? 13.5 : 12.5,
      fontWeight:  depth === 0 ? 600 : 400,
      fontFamily:  "'Segoe UI', 'Helvetica Neue', sans-serif",
      fill:        '#3e2723',
    };
  },

  getEdge(_depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke:         accentColor,
      strokeWidth:    1.5,
      strokeOpacity:  0.5,
      strokeDasharray: '2,2',
      // Slightly curved but short control handles for a natural feel
      pathFn: (x1, y1, x2, y2) => {
        const dx = (x2 - x1) * 0.35;
        const dy = (y2 - y1) * 0.1;
        return `M${x1},${y1} C${x1 + dx},${y1 + dy} ${x2 - dx},${y2 - dy} ${x2},${y2}`;
      },
    };
  },
};
