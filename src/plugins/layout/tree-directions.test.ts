import { describe, expect, it } from 'vitest';
import type { PluginNodesMap } from '../types';
import {
  LeftTreeLayout, RadialTreeLayout, RightTreeLayout, VerticalTreeLayout,
} from './tree-directions';

const nodes: PluginNodesMap = {
  root: { id: 'root', text: 'Root', x: 0, y: 0, parentId: null, children: ['left', 'right'], collapsed: false },
  left: { id: 'left', text: 'Left', x: 0, y: 0, parentId: 'root', children: ['leaf'], collapsed: false },
  right: { id: 'right', text: 'Right', x: 0, y: 0, parentId: 'root', children: [], collapsed: false },
  leaf: { id: 'leaf', text: 'Leaf', x: 0, y: 0, parentId: 'left', children: [], collapsed: false },
};

const options = {
  viewportWidth: 800,
  viewportHeight: 600,
  nodeWidth: 120,
  nodeHeight: 40,
  spacing: 1,
  spacingH: 1,
};

describe('directional tree layouts', () => {
  it('places vertical branches below their parent and includes every node', () => {
    const positions = VerticalTreeLayout.apply(nodes, 'root', options);

    expect(positions.size).toBe(4);
    expect(positions.get('root')!.y).toBeLessThan(positions.get('left')!.y);
    expect(positions.get('left')!.y).toBeLessThan(positions.get('leaf')!.y);
  });

  it('places descendants to the requested side', () => {
    const left = LeftTreeLayout.apply(nodes, 'root', options);
    const right = RightTreeLayout.apply(nodes, 'root', options);

    expect(left.get('left')!.x).toBeLessThan(left.get('root')!.x);
    expect(right.get('left')!.x).toBeGreaterThan(right.get('root')!.x);
  });

  it('places radial branches around a centered root', () => {
    const positions = RadialTreeLayout.apply(nodes, 'root', options);

    expect(positions.get('root')).toEqual({ x: 0, y: 0 });
    expect(positions.get('left')).not.toEqual(positions.get('right'));
    expect(positions.size).toBe(4);
  });
});
