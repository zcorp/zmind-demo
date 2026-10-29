import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FreeEdge, NodesMap } from '../types';
import { parseYEd, serializeYEd } from './YEd';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet & idées',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Contexte important',
    taskStatus: 'done',
    priority: 'critical',
    bgColor: '#fefefe',
  },
  child: {
    id: 'child',
    text: 'Étape "un"',
    x: 720,
    y: 400,
    parentId: 'root',
    children: [],
    collapsed: false,
    taskStatus: 'open',
    priority: 'high',
    color: '#12abef',
  },
};

const freeEdges: FreeEdge[] = [{
  id: 'cross',
  from: 'root',
  to: 'child',
  label: 'Relation liée',
  color: '#ff0000',
}];

class FixtureElement {
  readonly localName: string;
  readonly children: FixtureElement[];
  parentElement: FixtureElement | null = null;
  readonly textContent: string;

  constructor(
    name: string,
    private readonly attributes: Record<string, string> = {},
    children: FixtureElement[] = [],
    textContent = '',
  ) {
    this.localName = name;
    this.children = children;
    this.textContent = textContent || children.map(child => child.textContent).join('');
    children.forEach(child => { child.parentElement = this; });
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }
}

function documentFixture(root: FixtureElement, hasParserError = false): Document {
  return {
    documentElement: root,
    getElementsByTagName: (name: string) => hasParserError && name === 'parsererror' ? [{}] : [],
  } as unknown as Document;
}

function stubDocument(document: Document): void {
  vi.stubGlobal('DOMParser', class {
    parseFromString(): Document {
      return document;
    }
  });
}

function key(id: string, attrs: Record<string, string>): FixtureElement {
  return new FixtureElement('key', { id, ...attrs });
}

function node(
  id: string,
  label: string,
  note?: string,
  taskStatus?: 'open' | 'done',
  priority?: string,
): FixtureElement {
  const graphics = new FixtureElement('data', { key: 'nodegraphics' }, [
    new FixtureElement('ShapeNode', {}, [
      new FixtureElement('Geometry', { x: '10', y: '20', width: '140', height: '48' }),
      new FixtureElement('Fill', { color: '#abcdef' }),
      new FixtureElement('NodeLabel', {}, [], label),
    ]),
  ]);
  return new FixtureElement('node', { id }, [
    ...(note ? [new FixtureElement('data', { key: 'description' }, [], note)] : []),
    ...(taskStatus ? [new FixtureElement('data', { key: 'taskStatus' }, [], taskStatus)] : []),
    ...(priority ? [new FixtureElement('data', { key: 'priority' }, [], priority)] : []),
    graphics,
  ]);
}

function edge(id: string, source: string, target: string, label?: string): FixtureElement {
  return new FixtureElement('edge', { id, source, target }, [
    ...(label ? [new FixtureElement('data', { key: 'edgeLabel' }, [], label)] : []),
    new FixtureElement('data', { key: 'edgegraphics' }, [
      new FixtureElement('PolyLineEdge', {}, [
        new FixtureElement('LineStyle', { color: '#987654' }),
        ...(label ? [new FixtureElement('EdgeLabel', {}, [], label)] : []),
      ]),
    ]),
  ]);
}

function graphmlDocument(
  nodeElements: FixtureElement[],
  edgeElements: FixtureElement[],
  title = 'Roadmap',
): Document {
  const keys = [
    key('graphTitle', { for: 'graph', 'attr.name': 'title' }),
    key('description', { for: 'node', 'attr.name': 'description' }),
    key('taskStatus', { for: 'node', 'attr.name': 'taskStatus' }),
    key('priority', { for: 'node', 'attr.name': 'priority' }),
    key('nodegraphics', { for: 'node', 'yfiles.type': 'nodegraphics' }),
    key('edgeLabel', { for: 'edge', 'attr.name': 'description' }),
    key('edgegraphics', { for: 'edge', 'yfiles.type': 'edgegraphics' }),
  ];
  const graph = new FixtureElement('graph', { edgedefault: 'directed' }, [
    new FixtureElement('data', { key: 'graphTitle' }, [], title),
    ...nodeElements,
    ...edgeElements,
  ]);
  const root = new FixtureElement('graphml', {}, [...keys, graph]);
  return documentFixture(root);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GraphML / yEd import/export', () => {
  it('exports yEd graphics, escaped labels, node notes, and free-edge labels', () => {
    const source = serializeYEd(nodes, 'Plan & suivi', freeEdges);

    expect(source).toContain('<graphml');
    expect(source).toContain('<y:ShapeNode>');
    expect(source).toContain('Projet &amp; idées');
    expect(source).toContain('Contexte important');
    expect(source).toContain('<data key="taskStatus">done</data>');
    expect(source).toContain('<data key="taskStatus">open</data>');
    expect(source).toContain('<data key="priority">critical</data>');
    expect(source).toContain('<data key="priority">high</data>');
    expect(source).toContain('<y:EdgeLabel>Relation liée</y:EdgeLabel>');
    expect(source).toContain('color="#ff0000"');
  });

  it('imports nodes, notes, geometry, hierarchy, and non-tree relationships', () => {
    stubDocument(graphmlDocument(
      [
        node('a', 'Root', 'Root note', 'done', 'critical'),
        node('b', 'Child', undefined, 'open', 'high'),
        node('c', 'Other', undefined, undefined, 'low'),
      ],
      [edge('tree-other', 'a', 'c'), edge('tree', 'a', 'b'), edge('cross', 'b', 'c', 'Depends')],
    ));

    const imported = parseYEd('<graphml/>');
    const root = Object.values(imported.nodes).find(item => item.parentId === null)!;
    const child = Object.values(imported.nodes).find(item => item.text === 'Child')!;
    const other = Object.values(imported.nodes).find(item => item.text === 'Other')!;

    expect(imported.title).toBe('Roadmap');
    expect(root).toMatchObject({ text: 'Root', notes: 'Root note', taskStatus: 'done', priority: 'critical', x: 10, y: 20 });
    expect(child).toMatchObject({ text: 'Child', taskStatus: 'open', priority: 'high' });
    expect(other).toMatchObject({ text: 'Other', priority: 'low' });
    expect(imported.freeEdges).toEqual([{
      id: 'cross',
      from: child.id,
      to: other.id,
      label: 'Depends',
      color: '#987654',
    }]);
  });

  it('groups disconnected roots and keeps GraphML edge direction', () => {
    stubDocument(graphmlDocument(
      [node('a', 'First'), node('b', 'Second'), node('c', 'Third')],
      [edge('tree', 'b', 'c')],
      'Multiple',
    ));
    const imported = parseYEd('<graphml/>');
    const root = Object.values(imported.nodes).find(item => item.parentId === null)!;
    const second = imported.nodes[root.children[1]];

    expect(root.text).toBe('Multiple');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['First', 'Second']);
    expect(imported.nodes[second.children[0]].text).toBe('Third');
  });

  it('rejects invalid XML, missing graph data, and cyclic graphs', () => {
    stubDocument(documentFixture(new FixtureElement('graphml'), true));
    expect(() => parseYEd('<graphml')).toThrow(/XML invalide/);
    stubDocument(documentFixture(new FixtureElement('html')));
    expect(() => parseYEd('<html/>')).toThrow(/n’est pas un document GraphML/);
    stubDocument(documentFixture(new FixtureElement('graphml')));
    expect(() => parseYEd('<graphml/>')).toThrow(/ne contient pas de graphe/);
    stubDocument(graphmlDocument(
      [node('a', 'A'), node('b', 'B')],
      [edge('ab', 'a', 'b'), edge('ba', 'b', 'a')],
    ));
    expect(() => parseYEd('<graphml/>')).toThrow(/cycle/);
    stubDocument(graphmlDocument([
      new FixtureElement('node', { id: 'a' }, [
        new FixtureElement('data', { key: 'taskStatus' }, [], 'blocked'),
      ]),
    ], []));
    expect(() => parseYEd('<graphml/>')).toThrow(/état de tâche GraphML/);
    stubDocument(graphmlDocument([node('a', 'A', undefined, undefined, 'urgent')], []));
    expect(() => parseYEd('<graphml/>')).toThrow(/priorité GraphML/);
  });

  it('rejects invalid node graphs and dangling free edges during export', () => {
    expect(() => serializeYEd({
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    }, 'Invalid')).toThrow(/hiérarchie/);
    expect(() => serializeYEd(nodes, 'Invalid', [{ id: 'dangling', from: 'root', to: 'missing' }]))
      .toThrow(/référence/);
  });
});
