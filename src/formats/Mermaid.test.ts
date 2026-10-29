import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { parseMermaid, serializeMermaid } from './Mermaid';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet "A" & B',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    taskStatus: 'done',
  },
  child: {
    id: 'child',
    text: 'Étape <un>\nDeuxième ligne',
    x: 720,
    y: 400,
    parentId: 'root',
    children: ['grandchild'],
    collapsed: false,
    taskStatus: 'open',
  },
  grandchild: {
    id: 'grandchild',
    text: 'Final #1',
    x: 940,
    y: 500,
    parentId: 'child',
    children: [],
    collapsed: false,
  },
};

describe('Mermaid mindmap import/export', () => {
  it('round-trips node labels and hierarchy with Mermaid entities', () => {
    const source = serializeMermaid(nodes);
    const imported = parseMermaid(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source).toContain('mindmap');
    expect(source).toContain('root(("[x] Projet #quot;A#quot; #amp; B"))');
    expect(imported.title).toBe('Projet "A" & B');
    expect(child.text).toBe('Étape <un>\nDeuxième ligne');
    expect(imported.nodes[child.children[0]].text).toBe('Final #1');
    expect(root.taskStatus).toBe('done');
    expect(child.taskStatus).toBe('open');
  });

  it('imports checklist markers as task state', () => {
    const imported = parseMermaid('mindmap\n  root((" [x] Finished"))\n    "[ ] Next step"');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(root).toMatchObject({ text: 'Finished', taskStatus: 'done' });
    expect(child).toMatchObject({ text: 'Next step', taskStatus: 'open' });
  });

  it('imports common Mermaid root shapes and indented nodes', () => {
    const imported = parseMermaid([
      '---',
      'title: Example',
      '---',
      'mindmap',
      '  root((Central topic))',
      '    Origins',
      '      Long history',
      '    Research',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const origins = imported.nodes[root.children[0]];

    expect(root.text).toBe('Central topic');
    expect(imported.nodes[origins.children[0]].text).toBe('Long history');
    expect(imported.nodes[root.children[1]].text).toBe('Research');
  });

  it('imports quoted multi-line labels and ignores Mermaid comments', () => {
    const imported = parseMermaid([
      'mindmap',
      '  "Central',
      '  topic"',
      '    Child',
      '  %% a comment',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Central\ntopic');
    expect(imported.nodes[root.children[0]].text).toBe('Child');
  });

  it.each([
    ['wrong directive', 'graph TD\n A --> B'],
    ['empty map', 'mindmap'],
    ['multiple roots', 'mindmap\n  First\n  Second'],
    ['missing parent level', 'mindmap\n  Root\n      Grandchild'],
    ['unterminated quoted label', 'mindmap\n  "unfinished'],
  ])('rejects invalid Mermaid input (%s)', (_label, source) => {
    expect(() => parseMermaid(source)).toThrow();
  });

  it('rejects an invalid node graph during export', () => {
    const invalid = {
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    };

    expect(() => serializeMermaid(invalid)).toThrow(/hiérarchie/);
  });
});
