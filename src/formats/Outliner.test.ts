import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NodesMap } from '../types';
import { parseOutliner, serializeOutliner } from './Outliner';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet & idées',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: true,
    notes: 'Contexte <important>\nDeuxième ligne',
    taskStatus: 'done',
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
  },
};

class FixtureElement {
  readonly children: FixtureElement[];
  readonly localName: string;

  constructor(
    name: string,
    private readonly attributes: Record<string, string> = {},
    children: FixtureElement[] = [],
    readonly textContent = '',
  ) {
    this.localName = name;
    this.children = children;
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Outliner import/export', () => {
  it('exports XML-safe titles, multiline notes, hierarchy, and collapsed state', () => {
    const source = serializeOutliner(nodes);

    expect(source).toContain('<outliner');
    expect(source).toContain('data="Projet &amp; idées"');
    expect(source).toContain('data="Contexte &lt;important&gt;&#10;Deuxième ligne"');
    expect(source).toContain('expanded="false"');
    expect(source).toContain('task="done"');
    expect(source).toContain('task="open"');
    expect(source).not.toContain('<task');
    expect(source).toContain('Étape &quot;un&quot;');
  });

  it('imports node titles, notes, children, and expanded state', () => {
    const text = new FixtureElement('text', { data: 'Projet' });
    const name = new FixtureElement('name', {}, [text]);
    const noteText = new FixtureElement('text', { data: 'Contexte' });
    const note = new FixtureElement('note', {}, [noteText]);
    const childName = new FixtureElement('name', {}, [
      new FixtureElement('text', { data: 'Étape' }),
    ]);
    const child = new FixtureElement('node', { expanded: 'true' }, [childName]);
    const nodeChildren = new FixtureElement('nodes', {}, [child]);
    const task = new FixtureElement('task', { status: 'done' });
    const node = new FixtureElement('node', { expanded: 'false' }, [name, note, task, nodeChildren]);
    const topNodes = new FixtureElement('nodes', {}, [node]);
    stubDocument(documentFixture(new FixtureElement('outliner', {}, [topNodes])));

    const imported = parseOutliner('<outliner/>');
    const root = Object.values(imported.nodes).find(item => item.parentId === null)!;
    const importedChild = imported.nodes[root.children[0]];

    expect(imported.title).toBe('Projet');
    expect(root).toMatchObject({ text: 'Projet', notes: 'Contexte', collapsed: true, taskStatus: 'done' });
    expect(importedChild).toMatchObject({ text: 'Étape', parentId: root.id, collapsed: false });
  });

  it('wraps multiple top-level nodes under a generated root', () => {
    const createNode = (text: string) => new FixtureElement('node', {}, [
      new FixtureElement('name', {}, [new FixtureElement('text', { data: text })]),
    ]);
    stubDocument(documentFixture(new FixtureElement('outliner', {}, [
      new FixtureElement('nodes', {}, [createNode('Premier'), createNode('Deuxième')]),
    ])));

    const imported = parseOutliner('<outliner/>');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Premier', 'Deuxième']);
  });

  it('rejects invalid XML, other roots, and files without node titles', () => {
    stubDocument(documentFixture(new FixtureElement('outliner'), true));
    expect(() => parseOutliner('<outliner')).toThrow(/XML invalide/);
    stubDocument(documentFixture(new FixtureElement('html')));
    expect(() => parseOutliner('<html/>')).toThrow(/n’est pas un document Outliner/);
    stubDocument(documentFixture(new FixtureElement('outliner', {}, [
      new FixtureElement('nodes', {}, [new FixtureElement('node')]),
    ])));
    expect(() => parseOutliner('<outliner/>')).toThrow(/ne contient pas de titre/);
  });

  it('rejects invalid node graphs on export', () => {
    const invalid = {
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    };

    expect(() => serializeOutliner(invalid)).toThrow(/hiérarchie/);
  });

  it('rejects unknown task states in imported files', () => {
    const name = new FixtureElement('name', {}, [new FixtureElement('text', { data: 'Projet' })]);
    stubDocument(documentFixture(new FixtureElement('outliner', {}, [
      new FixtureElement('nodes', {}, [new FixtureElement('node', { task: 'blocked' }, [name])]),
    ])));

    expect(() => parseOutliner('<outliner/>')).toThrow(/état de tâche invalide/);
  });

  it('imports native Outliner task attributes including the in-progress state', () => {
    const createNode = (title: string, task: string) => new FixtureElement('node', { task }, [
      new FixtureElement('name', {}, [new FixtureElement('text', { data: title })]),
    ]);
    stubDocument(documentFixture(new FixtureElement('outliner', {}, [
      new FixtureElement('nodes', {}, [createNode('Open', 'open'), createNode('In progress', 'doing'), createNode('Done', 'done')]),
    ])));

    const imported = parseOutliner('<outliner/>');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const tasks = root.children.map(id => imported.nodes[id]);

    expect(tasks.map(node => [node.text, node.taskStatus])).toEqual([
      ['Open', 'open'],
      ['In progress', 'open'],
      ['Done', 'done'],
    ]);
  });

  it('continues importing the legacy Minder.js task element', () => {
    const name = new FixtureElement('name', {}, [new FixtureElement('text', { data: 'Projet' })]);
    const task = new FixtureElement('task', { status: 'done' });
    stubDocument(documentFixture(new FixtureElement('outliner', {}, [
      new FixtureElement('nodes', {}, [new FixtureElement('node', {}, [name, task])]),
    ])));

    const imported = parseOutliner('<outliner/>');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    expect(root.taskStatus).toBe('done');
  });
});
