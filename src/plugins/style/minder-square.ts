import type {
  EdgeAttrs,
  NodeShapeAttrs,
  NodeTextAttrs,
  PluginNode,
  StylePlugin,
} from '../types';

export const MinderSquareStyle: StylePlugin = {
  meta: {
    id: 'minder-square',
    name: 'Cartes carrées',
    description: 'Des cadres nets et des connecteurs droits pour lire la structure d’un coup d’œil.',
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
    return {
      rx: 3, ry: 3,
      fill: node.bgColor ?? (depth === 0 ? accent : `${accent}16`),
      stroke: isSelected ? accent : depth === 0 ? accent : `${accent}a8`,
      strokeWidth: isSelected ? 2.5 : depth === 0 ? 1.5 : 1.2,
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
      fill: depth === 0 ? '#ffffff' : darkMode ? '#e8eaf6' : '#292d34',
    };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke: accentColor,
      strokeWidth: depth === 1 ? 2 : 1.4,
      strokeOpacity: 0.62,
      pathFn: (x1, y1, x2, y2) => {
        const middle = x1 + (x2 - x1) / 2;
        return `M${x1},${y1} H${middle} V${y2} H${x2}`;
      },
    };
  },
};
