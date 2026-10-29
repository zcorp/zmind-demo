import type { LayoutOptions, LayoutPlugin, PluginNodesMap } from '../types';

type TreeDirection = 'vertical' | 'left' | 'right' | 'radial';

function createDirectionalLayout(
  id: string,
  name: string,
  description: string,
  direction: TreeDirection,
): LayoutPlugin {
  return {
    meta: {
      id,
      name,
      description,
      type: 'layout',
      version: '1.0.0',
      author: 'minder-team',
    },

    apply(nodes: Readonly<PluginNodesMap>, rootId: string, options: LayoutOptions) {
      const positions = new Map<string, { x: number; y: number }>();
      if (!nodes[rootId]) return positions;

      const leafCount = (id: string): number => {
        const children = nodes[id]?.children.filter(childId => nodes[childId]) ?? [];
        return children.length ? children.reduce((count, childId) => count + leafCount(childId), 0) : 1;
      };

      const horizontalGap = (options.nodeWidth + 56) * (options.spacingH ?? options.spacing);
      const verticalGap = (options.nodeHeight + 40) * options.spacing;
      const totalLeaves = leafCount(rootId);

      if (direction === 'radial') {
        const radiusStep = Math.max(options.nodeWidth, options.nodeHeight) + 72;
        const place = (id: string, depth: number, startAngle: number, endAngle: number) => {
          const angle = (startAngle + endAngle) / 2;
          const radius = depth * radiusStep;
          positions.set(id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });

          const children = nodes[id]?.children.filter(childId => nodes[childId]) ?? [];
          const descendantLeaves = children.reduce((sum, childId) => sum + leafCount(childId), 0);
          let cursor = startAngle;
          for (const childId of children) {
            const childLeaves = leafCount(childId);
            const childEnd = cursor + ((endAngle - startAngle) * childLeaves) / descendantLeaves;
            place(childId, depth + 1, cursor, childEnd);
            cursor = childEnd;
          }
        };

        const children = nodes[rootId].children.filter(childId => nodes[childId]);
        positions.set(rootId, { x: 0, y: 0 });
        if (children.length) {
          let cursor = -Math.PI / 2;
          for (const childId of children) {
            const span = (2 * Math.PI * leafCount(childId)) / totalLeaves;
            place(childId, 1, cursor, cursor + span);
            cursor += span;
          }
        }
        return positions;
      }

      const slotGap = direction === 'vertical' ? horizontalGap : verticalGap;
      const depthGap = direction === 'vertical' ? verticalGap : horizontalGap;
      const totalSpan = (totalLeaves - 1) * slotGap;
      const place = (id: string, depth: number, firstLeaf: number): number => {
        const children = nodes[id]?.children.filter(childId => nodes[childId]) ?? [];
        const xCenter = (firstLeaf + leafCount(id) / 2 - 0.5) * slotGap - totalSpan / 2;
        const depthOffset = depth * depthGap;
        const point = direction === 'vertical'
          ? { x: xCenter, y: depthOffset }
          : {
              x: direction === 'left' ? -depthOffset : depthOffset,
              y: xCenter,
            };
        positions.set(id, point);

        let nextLeaf = firstLeaf;
        for (const childId of children) nextLeaf += place(childId, depth + 1, nextLeaf);
        return children.length ? nextLeaf - firstLeaf : 1;
      };

      place(rootId, 0, 0);
      return positions;
    },
  };
}

export const VerticalTreeLayout = createDirectionalLayout(
  'tree-vertical',
  'Arbre vertical',
  'Le sujet se place en haut et les branches descendent par niveaux.',
  'vertical',
);

export const LeftTreeLayout = createDirectionalLayout(
  'tree-left',
  'Arbre vers la gauche',
  'Le sujet se place à droite et les branches se développent vers la gauche.',
  'left',
);

export const RightTreeLayout = createDirectionalLayout(
  'tree-right',
  'Arbre vers la droite',
  'Le sujet se place à gauche et les branches se développent vers la droite.',
  'right',
);

export const RadialTreeLayout = createDirectionalLayout(
  'tree-radial',
  'Radial',
  'Les branches rayonnent autour du sujet central.',
  'radial',
);
