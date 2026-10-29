import { describe, expect, it } from 'vitest';
import type { PluginNodesMap } from '../types';
import { TimelineLayout } from './timeline';

const nodes: PluginNodesMap = {
  root: { id: 'root', text: 'Root', x: 0, y: 0, parentId: null, children: ['first', 'second'], collapsed: false },
  first: { id: 'first', text: 'First', x: 0, y: 0, parentId: 'root', children: ['detail'], collapsed: false },
  second: { id: 'second', text: 'Second', x: 0, y: 0, parentId: 'root', children: [], collapsed: false },
  detail: { id: 'detail', text: 'Detail', x: 0, y: 0, parentId: 'first', children: [], collapsed: false },
};

describe('horizontal timeline layout', () => {
  it('uses independent horizontal and vertical spacing values', () => {
    const positions = TimelineLayout.apply(nodes, 'root', {
      viewportWidth: 800,
      viewportHeight: 600,
      nodeWidth: 120,
      nodeHeight: 40,
      spacing: 1.5,
      spacingH: 2,
    });

    expect(positions.get('second')!.x - positions.get('first')!.x).toBe(300);
    expect(positions.get('detail')!.y - positions.get('first')!.y).toBe(84);
  });
});
