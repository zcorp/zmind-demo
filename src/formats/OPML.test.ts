import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NodesMap } from '../types';
import { parseOPML, serializeOPML } from './OPML';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet & idées',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Note <racine> & détails',
    taskStatus: 'done',
    tags: ['idée importante', 'phase:2'],
    priority: 'critical',
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
    tags: ['urgent'],
    priority: 'high',
  },
};

class FixtureElement {
  readonly localName: string;
  readonly children: FixtureElement[];
  readonly textContent: string;

  constructor(
    name: string,
    private readonly attributes: Record<string, string> = {},
    children: FixtureElement[] = [],
    textContent = '',
  ) {
    this.localName = name;
    this.children = children;
    this.textContent = textContent;
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }
}

function fixtureDocument(root: FixtureElement, hasParserError = false): Document {
  return {
    documentElement: root,
    getElementsByTagName: (name: string) => hasParserError && name === 'parsererror' ? [{}] : [],
  } as unknown as Document;
}

function stubOPMLDocument(document: Document): void {
  vi.stubGlobal('DOMParser', class {
    parseFromString(): Document {
      return document;
    }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OPML format', () => {
  it('exports nested outlines with escaped titles and notes', () => {
    const opml = serializeOPML(nodes, 'Plan & suivi');

    expect(opml).toContain('<opml version="2.0">');
    expect(opml).toContain('<title>Plan &amp; suivi</title>');
    expect(opml).toContain('text="Projet &amp; idées"');
    expect(opml).toContain('note="Note &lt;racine&gt; &amp; détails"');
    expect(opml).toContain('task="done"');
    expect(opml).toContain('task="open"');
    expect(opml).toContain('minder-tags="[&quot;idée importante&quot;,&quot;phase:2&quot;]"');
    expect(opml).toContain('minder-priority="critical"');
    expect(opml).toContain('minder-priority="high"');
    expect(opml).toContain('text="Étape &quot;un&quot;"');
  });

  it('imports a single outline tree with its title and notes', () => {
    const nested = new FixtureElement('outline', {
      text: 'Étape', note: 'À faire', task: 'open', 'minder-tags': '["urgent"]', 'minder-priority': 'high',
    });
    const rootOutline = new FixtureElement('outline', {
      text: 'Projet', note: 'Contexte', task: 'done', 'minder-tags': '["idée importante","phase:2"]',
      'minder-priority': 'critical',
    }, [nested]);
    const body = new FixtureElement('body', {}, [rootOutline]);
    const head = new FixtureElement('head', {}, [new FixtureElement('title', {}, [], 'Plan importé')]);
    stubOPMLDocument(fixtureDocument(new FixtureElement('opml', {}, [head, body])));

    const imported = parseOPML('<opml />');
    const root = Object.values(imported.nodes).find(node => node.parentId === null);
    const child = root && imported.nodes[root.children[0]];

    expect(imported.title).toBe('Plan importé');
    expect(root).toMatchObject({
      text: 'Projet', notes: 'Contexte', taskStatus: 'done', tags: ['idée importante', 'phase:2'], priority: 'critical',
    });
    expect(child).toMatchObject({
      text: 'Étape', notes: 'À faire', taskStatus: 'open', tags: ['urgent'], priority: 'high', parentId: root?.id,
    });
  });

  it('creates a parent node when the OPML document has multiple top-level outlines', () => {
    const body = new FixtureElement('body', {}, [
      new FixtureElement('outline', { text: 'Premier' }),
      new FixtureElement('outline', { text: 'Deuxième' }),
    ]);
    stubOPMLDocument(fixtureDocument(new FixtureElement('opml', {}, [body])));

    const imported = parseOPML('<opml />');
    const root = Object.values(imported.nodes).find(node => node.parentId === null);

    expect(root?.text).toBe('Carte importée');
    expect(root?.children).toHaveLength(2);
  });

  it('rejects parser errors, non-OPML documents and empty bodies', () => {
    stubOPMLDocument(fixtureDocument(new FixtureElement('opml'), true));
    expect(() => parseOPML('<opml')).toThrow(/XML invalide/);

    stubOPMLDocument(fixtureDocument(new FixtureElement('html')));
    expect(() => parseOPML('<html />')).toThrow(/n’est pas un document OPML/);

    stubOPMLDocument(fixtureDocument(new FixtureElement('opml', {}, [new FixtureElement('body')])));
    expect(() => parseOPML('<opml><body /></opml>')).toThrow(/aucun nœud/);
  });

  it('rejects an export graph with inconsistent parent-child relationships', () => {
    const invalid = {
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    };

    expect(() => serializeOPML(invalid, 'Plan')).toThrow(/hiérarchie/);
  });

  it('rejects invalid task states', () => {
    const body = new FixtureElement('body', {}, [
      new FixtureElement('outline', { text: 'Projet', task: 'blocked' }),
    ]);
    stubOPMLDocument(fixtureDocument(new FixtureElement('opml', {}, [body])));

    expect(() => parseOPML('<opml />')).toThrow(/état de tâche invalide/);
  });

  it('rejects malformed custom tag attributes', () => {
    const body = new FixtureElement('body', {}, [
      new FixtureElement('outline', { text: 'Projet', 'minder-tags': '{"broken"}' }),
    ]);
    stubOPMLDocument(fixtureDocument(new FixtureElement('opml', {}, [body])));

    expect(() => parseOPML('<opml />')).toThrow(/minder-tags OPML contient un JSON invalide/);
  });

  it('rejects unknown node priorities', () => {
    const body = new FixtureElement('body', {}, [
      new FixtureElement('outline', { text: 'Projet', 'minder-priority': 'urgent' }),
    ]);
    stubOPMLDocument(fixtureDocument(new FixtureElement('opml', {}, [body])));

    expect(() => parseOPML('<opml />')).toThrow(/priorité invalide/);
  });
});
