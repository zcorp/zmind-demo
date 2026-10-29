import { describe, expect, it } from 'vitest';
import type { PluginNodesMap } from '../types';
import { MindMapLayout } from './mindmap';

const nodes: PluginNodesMap = {
  root: { id: 'root', text: 'Root', x: 0, y: 0, parentId: null, children: ['large', 'small-a', 'small-b'], collapsed: false },
  large: { id: 'large', text: 'Large branch', x: 0, y: 0, parentId: 'root', children: ['a', 'b', 'c', 'd'], collapsed: false },
  'small-a': { id: 'small-a', text: 'Small branch A', x: 0, y: 0, parentId: 'root', children: [], collapsed: false },
  'small-b': { id: 'small-b', text: 'Small branch B', x: 0, y: 0, parentId: 'root', children: [], collapsed: false },
  a: { id: 'a', text: 'A', x: 0, y: 0, parentId: 'large', children: [], collapsed: false },
  b: { id: 'b', text: 'B', x: 0, y: 0, parentId: 'large', children: [], collapsed: false },
  c: { id: 'c', text: 'C', x: 0, y: 0, parentId: 'large', children: [], collapsed: false },
  d: { id: 'd', text: 'D', x: 0, y: 0, parentId: 'large', children: [], collapsed: false },
};

describe('balanced mind map layout', () => {
  it('balances root branches by subtree size while preserving every node', () => {
    const positions = MindMapLayout.apply(nodes, 'root', {
      viewportWidth: 800,
      viewportHeight: 600,
      nodeWidth: 134,
      nodeHeight: 40,
      spacing: 1,
      spacingH: 1,
    });

    expect(positions.size).toBe(Object.keys(nodes).length);
    expect(positions.get('large')!.x).toBeLessThan(positions.get('root')!.x);
    expect(positions.get('small-a')!.x).toBeGreaterThan(positions.get('root')!.x);
    expect(positions.get('small-b')!.x).toBeGreaterThan(positions.get('root')!.x);
    expect(positions.get('large')!.y).toBe(positions.get('root')!.y);
  });
});
