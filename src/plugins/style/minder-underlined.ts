import type {
  EdgeAttrs,
  NodeShapeAttrs,
  NodeTextAttrs,
  PluginNode,
  StylePlugin,
} from '../types';

export const MinderUnderlinedStyle: StylePlugin = {
  meta: {
    id: 'minder-underlined',
    name: 'Souligné classique',
    description: 'Un sujet en évidence et des branches épurées, soulignées par leur couleur.',
    type: 'style',
    version: '1.0.0',
    author: 'minder-team',
  },

  getNodeShape(
    _node: Readonly<PluginNode>,
    depth: number,
    isSelected: boolean,
    accentColor: string,
  ): NodeShapeAttrs {
    if (depth === 0) {
      return {
        rx: 18, ry: 18,
        fill: accentColor,
        stroke: isSelected ? '#ffffff' : accentColor,
        strokeWidth: isSelected ? 2.5 : 0,
      };
    }

    return {
      rx: 0, ry: 0,
      fill: isSelected ? `${accentColor}18` : 'transparent',
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
      fontWeight: depth < 2 ? 650 : 450,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fill: depth === 0 ? '#ffffff' : darkMode ? '#e5e9ef' : '#30353c',
    };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke: accentColor,
      strokeWidth: depth === 1 ? 2.4 : 1.5,
      strokeOpacity: depth === 1 ? 0.8 : 0.52,
      pathFn: (x1, y1, x2, y2) => {
        const dx = Math.max(Math.abs(x2 - x1) * 0.45, 42);
        const direction = x2 >= x1 ? 1 : -1;
        return `M${x1},${y1} C${x1 + direction * dx},${y1} ${x2 - direction * dx},${y2} ${x2},${y2}`;
      },
    };
  },
};
