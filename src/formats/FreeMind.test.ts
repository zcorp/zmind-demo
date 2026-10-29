import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NodesMap } from '../types';
import { parseFreeMind, serializeFreeMind } from './FreeMind';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet & idées',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Contexte\nDeuxième ligne',
    color: '#336699',
    taskStatus: 'done',
    icon: 'idea',
    attachments: [{
      id: 'link-1',
      type: 'link',
      name: 'Documentation',
      value: 'https://example.test/docs',
    }],
  },
  child: {
    id: 'child',
    text: 'Étape <un>',
    x: 720,
    y: 400,
    parentId: 'root',
    children: [],
    collapsed: true,
    taskStatus: 'open',
  },
};

class FixtureElement {
  readonly nodeType = 1;
  readonly nodeName: string;
  readonly localName: string;
  readonly children: FixtureElement[];
  readonly childNodes: Array<FixtureElement | { nodeType: number; nodeValue: string }>;
  readonly textContent: string;

  constructor(
    name: string,
    private readonly attributes: Record<string, string> = {},
    children: FixtureElement[] = [],
    textContent = '',
  ) {
    this.nodeName = name;
    this.localName = name;
    this.children = children;
    this.childNodes = [...children, ...(textContent ? [{ nodeType: 3, nodeValue: textContent }] : [])];
    this.textContent = textContent || children.map(child => child.textContent).join('');
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }
}

function installDOMParser(root: FixtureElement, hasParserError = false): void {
  vi.stubGlobal('Node', { ELEMENT_NODE: 1, TEXT_NODE: 3 });
  vi.stubGlobal('DOMParser', class {
    parseFromString() {
      return {
        documentElement: root,
        getElementsByTagName: (name: string) => hasParserError && name === 'parsererror' ? [{}] : [],
      };
    }
  });
}

function richContent(type: string, lines: string[]): FixtureElement {
  const bodyChildren = lines.flatMap((line, index) => [
    new FixtureElement('p', {}, [], line),
    ...(index < lines.length - 1 ? [new FixtureElement('br')] : []),
  ]);
  return new FixtureElement('richcontent', { TYPE: type }, [
    new FixtureElement('html', {}, [
      new FixtureElement('head'),
      new FixtureElement('body', {}, bodyChildren),
    ]),
  ]);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FreeMind / Freeplane import-export', () => {
  it('exports a FreeMind-compatible map with escaped text, notes, folded state and unique IDs', () => {
    const xml = serializeFreeMind(nodes, [{
      id: 'edge-1',
      from: 'root',
      to: 'child',
      label: 'Dépend de',
      color: '#ff8800',
    }]);

    expect(xml).toContain('<map version="1.0.1">');
    expect(xml).toContain('TEXT="Projet &amp; idées"');
    expect(xml).toContain('TEXT="Étape &lt;un&gt;"');
    expect(xml).toContain('<richcontent TYPE="NOTE">');
    expect(xml).toContain('<p>Contexte</p><p>Deuxième ligne</p>');
    expect(xml).toContain('FOLDED="true"');
    expect(xml).toContain('TASK="done"');
    expect(xml).toContain('TASK="open"');
    expect(xml).toContain('COLOR="#336699"');
    expect(xml).toContain('<icon BUILTIN="idea" />');
    expect(xml).toContain('LINK="https://example.test/docs"');
    expect(xml).toContain('DESTINATION="minder_1"');
    expect(xml).toContain('TEXT="Dépend de"');
    expect(xml.match(/ID="minder_\d+"/g)).toEqual(['ID="minder_0"', 'ID="minder_1"']);
  });

  it('imports FreeMind node titles, hierarchy, notes, color, folded state and links', () => {
    const child = new FixtureElement('node', { ID: 'child-id', TEXT: 'Étape', FOLDED: 'true', TASK: 'open' }, [
      new FixtureElement('icon', { BUILTIN: 'messagebox_warning' }),
      richContent('NOTE', ['À faire', 'Deuxième note']),
    ]);
    const arrow = new FixtureElement('arrowlink', {
      DESTINATION: 'child-id',
      TEXT: 'Dépend de',
      COLOR: '#ff8800',
    });
    const root = new FixtureElement('node', {
      ID: 'root-id',
      TEXT: 'Projet',
      COLOR: '#336699',
      LINK: 'https://example.test/docs',
    }, [child, arrow]);
    installDOMParser(new FixtureElement('map', { version: '1.0.1' }, [root]));

    const imported = parseFreeMind('<map />');
    const mapRoot = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const importedChild = imported.nodes[mapRoot.children[0]];

    expect(imported.title).toBe('Projet');
    expect(mapRoot.text).toBe('Projet');
    expect(importedChild).toMatchObject({
      text: 'Étape',
      parentId: mapRoot.id,
      collapsed: true,
      notes: 'À faire\nDeuxième note',
      taskStatus: 'open',
      icon: 'warning',
    });
    expect(mapRoot.color).toBe('#336699');
    expect(mapRoot.attachments?.[0]).toMatchObject({
      type: 'link',
      value: 'https://example.test/docs',
    });
    expect(imported.freeEdges).toEqual([{
      id: 'mm_edge_0',
      from: mapRoot.id,
      to: importedChild.id,
      label: 'Dépend de',
      color: '#ff8800',
    }]);
  });

  it('imports Freeplane rich-content titles and single top-level maps', () => {
    const root = new FixtureElement('node', {}, [richContent('NODE', ['Titre riche'])]);
    installDOMParser(new FixtureElement('map', {}, [root]));

    const imported = parseFreeMind('<map />');
    const mapRoot = Object.values(imported.nodes).find(node => node.parentId === null);

    expect(mapRoot?.text).toBe('Titre riche');
    expect(imported.title).toBe('Titre riche');
  });

  it('groups multiple top-level nodes under a generated root', () => {
    installDOMParser(new FixtureElement('map', {}, [
      new FixtureElement('node', { TEXT: 'Premier' }),
      new FixtureElement('node', { TEXT: 'Deuxième' }),
    ]));

    const imported = parseFreeMind('<map />');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Premier', 'Deuxième']);
  });

  it('rejects invalid XML, non-map documents and maps without nodes', () => {
    installDOMParser(new FixtureElement('map'), true);
    expect(() => parseFreeMind('<map')).toThrow(/XML invalide/);

    installDOMParser(new FixtureElement('html'));
    expect(() => parseFreeMind('<html />')).toThrow(/n’est pas une carte/);

    installDOMParser(new FixtureElement('map'));
    expect(() => parseFreeMind('<map />')).toThrow(/aucun nœud/);
  });

  it('rejects invalid export relationships', () => {
    const invalid = {
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    };

    expect(() => serializeFreeMind(invalid)).toThrow(/hiérarchie/);
  });

  it('rejects links that reference nodes outside the map', () => {
    expect(() => serializeFreeMind(nodes, [{
      id: 'edge-1',
      from: 'root',
      to: 'missing',
    }])).toThrow(/nœud absent/);
  });

  it('rejects invalid task states', () => {
    installDOMParser(new FixtureElement('map', {}, [
      new FixtureElement('node', { TEXT: 'Projet', TASK: 'blocked' }),
    ]));

    expect(() => parseFreeMind('<map />')).toThrow(/état de tâche invalide/);
  });
});
