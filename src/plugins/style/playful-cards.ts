import type {
  EdgeAttrs,
  NodeShapeAttrs,
  NodeTextAttrs,
  PluginNode,
  StylePlugin,
} from '../types';

function hexAlpha(hex: string, alpha: number): string {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export const PlayfulCardsStyle: StylePlugin = {
  meta: {
    id: 'playful-cards',
    name: 'Cartes pastel',
    description: 'Des cartes douces, des branches colorées et une racine bien visible.',
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
        rx: 24,
        ry: 24,
        fill: node.bgColor ?? accent,
        stroke: isSelected ? '#ffffff' : accent,
        strokeWidth: isSelected ? 3 : 0,
      };
    }

    return {
      rx: depth === 1 ? 16 : 12,
      ry: depth === 1 ? 16 : 12,
      fill: node.bgColor ?? hexAlpha(accent, depth === 1 ? 0.16 : 0.09),
      stroke: isSelected ? accent : hexAlpha(accent, depth === 1 ? 0.8 : 0.55),
      strokeWidth: isSelected ? 2.5 : depth === 1 ? 1.8 : 1.2,
    };
  },

  getNodeText(
    _node: Readonly<PluginNode>,
    depth: number,
    darkMode: boolean,
  ): NodeTextAttrs {
    return {
      fontSize: depth === 0 ? 14 : depth === 1 ? 13 : 12,
      fontWeight: depth < 2 ? 650 : 500,
      fontFamily: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif",
      fill: depth === 0 ? '#ffffff' : darkMode ? '#f5f2ff' : '#2d2943',
    };
  },

  getEdge(depth: number, accentColor: string): EdgeAttrs {
    return {
      stroke: accentColor,
      strokeWidth: depth === 1 ? 2.4 : 1.8,
      strokeOpacity: depth === 1 ? 0.82 : 0.62,
      pathFn: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        if (Math.abs(dx) >= Math.abs(dy) * 0.7) {
          const curve = Math.max(Math.abs(dx) * 0.45, 50);
          const direction = dx >= 0 ? 1 : -1;
          return `M${x1},${y1} C${x1 + direction * curve},${y1} ${x2 - direction * curve},${y2} ${x2},${y2}`;
        }
        const curve = Math.max(Math.abs(dy) * 0.45, 40);
        const direction = dy >= 0 ? 1 : -1;
        return `M${x1},${y1} C${x1},${y1 + direction * curve} ${x2},${y2 - direction * curve} ${x2},${y2}`;
      },
    };
  },
};
