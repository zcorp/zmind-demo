import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { parseOrgMode, serializeOrgMode } from './OrgMode';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Contexte\nDeuxième ligne\n:END:',
    tags: ['planning', 'project_2'],
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

describe('Org-mode import/export', () => {
  it('round-trips document title, hierarchy, and multiline notes', () => {
    const source = serializeOrgMode(nodes, 'Projet exporté');
    const imported = parseOrgMode(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source).toContain('#+TITLE: Projet exporté');
    expect(imported.title).toBe('Projet exporté');
    expect(root).toMatchObject({ text: 'Projet', notes: 'Contexte\nDeuxième ligne\n:END:' });
    expect(root.tags).toEqual(['planning', 'project_2']);
    expect(child.tags).toEqual(['urgent']);
    expect(imported.nodes[child.children[0]]).toMatchObject({ text: 'Détail', notes: 'À vérifier' });
  });

  it('round-trips task state using Org TODO and DONE keywords', () => {
    const taskNodes: NodesMap = {
      ...nodes,
      root: { ...nodes.root, taskStatus: 'done' },
      child: { ...nodes.child, taskStatus: 'open' },
    };
    const source = serializeOrgMode(taskNodes, 'Roadmap');
    const imported = parseOrgMode(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source).toContain('* DONE Projet');
    expect(source).toContain('** TODO Étape');
    expect(root).toMatchObject({ text: 'Projet', taskStatus: 'done' });
    expect(child).toMatchObject({ text: 'Étape', taskStatus: 'open' });
  });

  it('round-trips Minder priorities using Org priority cookies', () => {
    const prioritizedNodes: NodesMap = {
      ...nodes,
      root: { ...nodes.root, children: ['child', 'low'], priority: 'critical' },
      child: { ...nodes.child, priority: 'high' },
      grandchild: { ...nodes.grandchild, priority: 'medium' },
      low: {
        id: 'low',
        text: 'Faible',
        x: 720,
        y: 500,
        parentId: 'root',
        children: [],
        collapsed: false,
        priority: 'low',
      },
    };
    const source = serializeOrgMode(prioritizedNodes, 'Roadmap');
    const imported = parseOrgMode(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source).toContain('#+PRIORITIES: A B C D');
    expect(source).toContain('* [#A] Projet');
    expect(source).toContain('** [#B] Étape');
    expect(source).toContain('*** [#C] Détail');
    expect(source).toContain('** [#D] Faible');
    expect(root.priority).toBe('critical');
    expect(child.priority).toBe('high');
    expect(imported.nodes[child.children[0]].priority).toBe('medium');
    expect(imported.nodes[root.children[1]].priority).toBe('low');
  });

  it('round-trips free-form tags using a Minder property drawer', () => {
    const taggedNodes: NodesMap = {
      ...nodes,
      root: { ...nodes.root, tags: ['idée importante', 'phase:2', 'équipe'] },
    };
    const source = serializeOrgMode(taggedNodes, 'Roadmap');
    const imported = parseOrgMode(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(source).toContain(':MINDER_TAGS: ["idée importante","phase:2","équipe"]');
    expect(root.tags).toEqual(['idée importante', 'phase:2', 'équipe']);
  });

  it('imports Org TODO and DONE headings', () => {
    const imported = parseOrgMode('* TODO À faire :urgent:project_2:\n** DONE Terminé');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(root).toMatchObject({ text: 'À faire', taskStatus: 'open', tags: ['urgent', 'project_2'] });
    expect(child).toMatchObject({ text: 'Terminé', taskStatus: 'done' });
  });

  it('imports regular Org headings and combines multiple roots', () => {
    const imported = parseOrgMode([
      '#+TITLE: Roadmap',
      '* Planning',
      ':PROPERTIES:',
      ':CUSTOM_ID: planning',
      ':END:',
      '** Recherche',
      '*** Entretiens',
      '* Livraison',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(imported.title).toBe('Roadmap');
    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Planning', 'Livraison']);
    expect(imported.nodes[root.children[0]].notes).toBeUndefined();
    expect(imported.nodes[imported.nodes[root.children[0]].children[0]].text).toBe('Recherche');
  });

  it('imports Minder indentation-style outlines', () => {
    const imported = parseOrgMode([
      '* Root',
      '  Child',
      '    Grandchild',
      '  Sibling',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(root.text).toBe('Root');
    expect(child.text).toBe('Child');
    expect(imported.nodes[child.children[0]].text).toBe('Grandchild');
    expect(imported.nodes[root.children[1]].text).toBe('Sibling');
  });

  it('rejects missing parent levels and unterminated notes drawers', () => {
    expect(() => parseOrgMode('* Root\n*** Grandchild')).toThrow(/niveau parent manquant/);
    expect(() => parseOrgMode('* Root\n:NOTES:\nunfinished')).toThrow(/non terminé/);
    expect(() => parseOrgMode('#+TITLE: Empty')).toThrow(/aucun titre/);
  });

  it('rejects malformed Minder tag properties', () => {
    expect(() => parseOrgMode('* Root\n:PROPERTIES:\n:MINDER_TAGS: {invalid}\n:END:'))
      .toThrow(/JSON invalide/);
  });

  it('rejects node titles with line breaks during export', () => {
    const invalid = {
      ...nodes,
      root: { ...nodes.root, text: 'Deux lignes\nTitre' },
    };

    expect(() => serializeOrgMode(invalid, 'Map')).toThrow(/retours à la ligne/);
  });

  it('escapes heading markers in node titles', () => {
    const marked = {
      ...nodes,
      root: { ...nodes.root, text: '* Important' },
    };
    const imported = parseOrgMode(serializeOrgMode(marked, 'Map'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('* Important');
  });

  it('preserves titles that look like Org priority cookies', () => {
    const marked = {
      ...nodes,
      root: { ...nodes.root, text: '[#A] Literal' },
    };
    const source = serializeOrgMode(marked, 'Map');
    const imported = parseOrgMode(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(source).toContain('* \\[#A] Literal');
    expect(root).toMatchObject({ text: '[#A] Literal' });
    expect(root.priority).toBeUndefined();
  });

  it('rejects unsupported Org priority cookies', () => {
    expect(() => parseOrgMode('* [#E] Personnalisée')).toThrow(/n’est pas prise en charge/);
  });
});
