import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { MarkdownExport, parseMarkdown } from './Markdown';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Contexte\nDeuxième ligne',
    tags: ['idée importante', 'phase:2'],
    priority: 'critical',
  },
  child: {
    id: 'child',
    text: 'Étape',
    x: 720,
    y: 400,
    parentId: 'root',
    children: ['grandchild'],
    collapsed: false,
    tags: ['urgent'],
    priority: 'high',
  },
  grandchild: {
    id: 'grandchild',
    text: 'Détail',
    x: 940,
    y: 500,
    parentId: 'child',
    children: [],
    collapsed: false,
    notes: 'À vérifier',
  },
};

describe('Markdown import/export', () => {
  it('round-trips the hierarchy and multiline notes exported by Minder.js', () => {
    const markdown = MarkdownExport.serialize(nodes);
    const imported = parseMarkdown(markdown);
    const root = Object.values(imported.nodes).find(node => node.parentId === null);

    expect(imported.title).toBe('Projet');
    expect(root).toMatchObject({ text: 'Projet', notes: 'Contexte\nDeuxième ligne' });
    expect(root?.tags).toEqual(['idée importante', 'phase:2']);
    expect(root?.priority).toBe('critical');
    expect(root && imported.nodes[root.children[0]]).toMatchObject({
      text: 'Étape',
      parentId: root?.id,
      tags: ['urgent'],
      priority: 'high',
    });
    const child = root && imported.nodes[root.children[0]];
    expect(child && imported.nodes[child.children[0]]).toMatchObject({
      text: 'Détail',
      notes: 'À vérifier',
      parentId: child?.id,
    });
  });

  it('imports heading and nested list outlines', () => {
    const imported = parseMarkdown([
      '# Plan',
      '## Préparation',
      '### Documentation',
      '## Livraison',
      '    - Vérifier',
      '      1. Publier',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const preparation = imported.nodes[root.children[0]];
    const delivery = imported.nodes[root.children[1]];

    expect(preparation.text).toBe('Préparation');
    expect(imported.nodes[preparation.children[0]].text).toBe('Documentation');
    expect(delivery.text).toBe('Livraison');
    expect(imported.nodes[delivery.children[0]].text).toBe('Vérifier');
    expect(imported.nodes[imported.nodes[delivery.children[0]].children[0]].text).toBe('Publier');
  });

  it('imports checklist syntax as task state', () => {
    const imported = parseMarkdown('# Plan\n\n- [x] Terminé\n- [ ] À faire');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(imported.nodes[root.children[0]]).toMatchObject({ text: 'Terminé', taskStatus: 'done' });
    expect(imported.nodes[root.children[1]]).toMatchObject({ text: 'À faire', taskStatus: 'open' });
  });

  it('round-trips open and completed task statuses including the root node', () => {
    const taskNodes: NodesMap = {
      ...nodes,
      root: { ...nodes.root, taskStatus: 'done' },
      child: { ...nodes.child, taskStatus: 'open' },
    };

    expect(parseMarkdown(MarkdownExport.serialize(taskNodes)).nodes).toMatchObject({
      md_0: { text: 'Projet', taskStatus: 'done' },
      md_1: { text: 'Étape', taskStatus: 'open' },
    });
  });

  it('round-trips arbitrary tags in invisible HTML comments', () => {
    const taggedNodes: NodesMap = {
      ...nodes,
      root: { ...nodes.root, tags: ['a --> b', 'étiquette importante', 'phase:2'] },
    };
    const source = MarkdownExport.serialize(taggedNodes);
    const imported = parseMarkdown(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(source).toContain('<!-- minder-tags:["a \\u002d\\u002d> b","étiquette importante","phase:2"] -->');
    expect(root.tags).toEqual(['a --> b', 'étiquette importante', 'phase:2']);
  });

  it('round-trips node priorities in invisible HTML comments', () => {
    const source = MarkdownExport.serialize(nodes);
    const imported = parseMarkdown(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source).toContain('<!-- minder-priority:critical -->');
    expect(source).toContain('<!-- minder-priority:high -->');
    expect(root.priority).toBe('critical');
    expect(child.priority).toBe('high');
  });

  it('groups multiple top-level list items under a generated root', () => {
    const imported = parseMarkdown('- Premier\n- Deuxième');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Premier', 'Deuxième']);
  });

  it('rejects Markdown without headings or list items', () => {
    expect(() => parseMarkdown('Texte sans structure')).toThrow(/aucun titre ni élément de liste/);
  });

  it('rejects malformed or misplaced Minder tag comments', () => {
    expect(() => parseMarkdown('# Plan\n<!-- minder-tags:{invalid} -->')).toThrow(/JSON invalide/);
    expect(() => parseMarkdown('<!-- minder-tags:["urgent"] -->\n# Plan')).toThrow(/avant tout nœud/);
    expect(() => parseMarkdown('# Plan\n<!-- minder-tags:["urgent"]')).toThrow(/mal formé/);
  });

  it('rejects malformed or invalid Minder priority comments', () => {
    expect(() => parseMarkdown('# Plan\n<!-- minder-priority:urgent -->')).toThrow(/priorité invalide/);
    expect(() => parseMarkdown('# Plan\n<!-- minder-priority:high')).toThrow(/mal formé/);
    expect(() => parseMarkdown('<!-- minder-priority:high -->\n# Plan')).toThrow(/avant tout nœud/);
  });

  it('ignores regular HTML comments', () => {
    const imported = parseMarkdown('# Plan\n<!-- commentaire markdown -->\n- Étape');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Plan');
    expect(imported.nodes[root.children[0]].text).toBe('Étape');
  });
});
