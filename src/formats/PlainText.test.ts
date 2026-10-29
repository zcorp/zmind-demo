import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { parsePlainText, serializePlainText } from './PlainText';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Plan\net objectifs',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Contexte\nDeuxième ligne',
  },
  child: {
    id: 'child',
    text: '- conserver ce préfixe',
    x: 720,
    y: 400,
    parentId: 'root',
    children: ['leaf'],
    collapsed: false,
    notes: 'Note de l’étape',
  },
  leaf: {
    id: 'leaf',
    text: 'Détail',
    x: 940,
    y: 500,
    parentId: 'child',
    children: [],
    collapsed: false,
  },
};

describe('PlainText import/export', () => {
  it('round-trips hierarchy, multiline titles, escaped prefixes, and notes', () => {
    const source = serializePlainText(nodes);
    const imported = parsePlainText(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(imported.title).toBe('Plan\net objectifs');
    expect(root.notes).toBe('Contexte\nDeuxième ligne');
    expect(child.text).toBe('- conserver ce préfixe');
    expect(child.notes).toBe('Note de l’étape');
    expect(imported.nodes[child.children[0]].text).toBe('Détail');
  });

  it('imports tab-indented bullets, numbered items, and quoted notes', () => {
    const imported = parsePlainText([
      '# Projet',
      '\t- Préparation',
      '\t\t1. Vérifier',
      '\t  > Note',
      '\t+ Livraison',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const preparation = imported.nodes[root.children[0]];

    expect(root.text).toBe('Projet');
    expect(preparation.text).toBe('Préparation');
    expect(imported.nodes[preparation.children[0]].text).toBe('Vérifier');
    expect(imported.nodes[preparation.children[0]].notes).toBe('Note');
    expect(imported.nodes[root.children[1]].text).toBe('Livraison');
  });

  it('round-trips open and completed task markers', () => {
    const taskNodes: NodesMap = {
      ...nodes,
      root: { ...nodes.root, taskStatus: 'done' },
      child: { ...nodes.child, taskStatus: 'open' },
    };
    const imported = parsePlainText(serializePlainText(taskNodes));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root).toMatchObject({ text: 'Plan\net objectifs', taskStatus: 'done' });
    expect(imported.nodes[root.children[0]]).toMatchObject({
      text: '- conserver ce préfixe',
      taskStatus: 'open',
    });
  });

  it('groups multiple top-level items beneath a generated root', () => {
    const imported = parsePlainText('# Premier\n# Deuxième');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Premier', 'Deuxième']);
  });

  it('rejects empty or structurally invalid maps', () => {
    expect(() => parsePlainText('\uFEFF \n')).toThrow(/aucun nœud/);
    expect(() => serializePlainText({})).toThrow(/exactement un nœud racine/);
  });
});
