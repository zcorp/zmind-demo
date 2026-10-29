import type {
  EdgeAttrs,
  NodeShapeAttrs,
  NodeTextAttrs,
  PluginNode,
  StylePlugin,
} from '../types';

export const MinderPillStyle: StylePlugin = {
  meta: {
    id: 'minder-pill',
    name: 'Pilules',
    description: 'Des nœuds en capsules, avec une couleur légère pour distinguer chaque branche.',
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
      rx: 22, ry: 22,
      fill: node.bgColor ?? (depth === 0 ? accent : `${accent}18`),
      stroke: isSelected ? accent : depth === 0 ? accent : `${accent}9c`,
      strokeWidth: isSelected ? 2.5 : depth === 0 ? 1 : 1.3,
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
      fill: depth === 0 ? '#ffffff' : darkMode ? '#e8eaf6' : '#30353c',
    };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke: accentColor,
      strokeWidth: depth === 1 ? 2.2 : 1.5,
      strokeOpacity: 0.65,
      pathFn: (x1, y1, x2, y2) => {
        const dx = Math.max(Math.abs(x2 - x1) * 0.45, 44);
        const direction = x2 >= x1 ? 1 : -1;
        return `M${x1},${y1} C${x1 + direction * dx},${y1} ${x2 - direction * dx},${y2} ${x2},${y2}`;
      },
    };
  },
};
