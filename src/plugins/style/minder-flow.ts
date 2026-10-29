import type {
  EdgeAttrs,
  NodeShapeAttrs,
  NodeTextAttrs,
  PluginNode,
  StylePlugin,
} from '../types';

export const MinderFlowStyle: StylePlugin = {
  meta: {
    id: 'minder-flow',
    name: 'Élan incliné',
    description: 'Sujet en capsule, branches inclinées et feuilles soulignées.',
    type: 'style',
    version: '1.0.0',
    author: 'minder-team',
  },

  getNodeShape(
    node: Readonly<PluginNode>,
    depth: number,
    isSelected: boolean,
    accentColor: string,
  ): NodeShapeAttrs {
    const accent = node.color ?? accentColor;

    if (depth === 0) {
      return {
        rx: 20,
        ry: 20,
        fill: node.bgColor ?? accent,
        stroke: isSelected ? '#ffffff' : accent,
        strokeWidth: isSelected ? 3 : 0,
      };
    }

    if (depth === 1) {
      return {
        shape: 'parallelogram',
        rx: 0,
        ry: 0,
        fill: node.bgColor ?? `${accent}20`,
        stroke: isSelected ? accent : `${accent}a8`,
        strokeWidth: isSelected ? 2.5 : 1.2,
      };
    }

    return {
      rx: 0,
      ry: 0,
      fill: isSelected ? `${accent}18` : 'transparent',
      stroke: 'transparent',
      strokeWidth: 0,
      strokeDasharray: 'none-leaf',
    };
  },

  getNodeText(
    _node: Readonly<PluginNode>,
    depth: number,
    darkMode: boolean,
  ): NodeTextAttrs {
    return {
      fontSize: depth === 0 ? 14 : depth === 1 ? 13 : 12,
      fontWeight: depth === 0 ? 700 : depth === 1 ? 600 : 450,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fill: depth === 0 ? '#ffffff' : darkMode ? '#e5e9ef' : '#30353c',
    };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke: accentColor,
      strokeWidth: depth === 1 ? 2.2 : 1.5,
      strokeOpacity: depth === 1 ? 0.72 : 0.48,
      pathFn: (x1, y1, x2, y2) => {
        const dx = Math.max(Math.abs(x2 - x1) * 0.45, 42);
        const direction = x2 >= x1 ? 1 : -1;
        return `M${x1},${y1} C${x1 + direction * dx},${y1} ${x2 - direction * dx},${y2} ${x2},${y2}`;
      },
    };
  },
};
