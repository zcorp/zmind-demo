import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { parseCSV, serializeCSV } from './CSV';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet, "A"',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child', 'sibling'],
    collapsed: false,
    notes: 'Contexte\nDeuxième ligne',
    taskStatus: 'done',
  },
  child: {
    id: 'child',
    text: 'Étape 1',
    x: 720,
    y: 400,
    parentId: 'root',
    children: ['grandchild'],
    collapsed: false,
    notes: 'Note avec, virgule et "guillemets"',
    taskStatus: 'open',
  },
  grandchild: {
    id: 'grandchild',
    text: 'Détail',
    x: 940,
    y: 500,
    parentId: 'child',
    children: [],
    collapsed: false,
  },
  sibling: {
    id: 'sibling',
    text: 'Étape 2',
    x: 720,
    y: 600,
    parentId: 'root',
    children: [],
    collapsed: false,
  },
};

describe('CSV import/export', () => {
  it('round-trips an irregular hierarchy, quoted fields, and multiline notes', () => {
    const source = serializeCSV(nodes);
    const imported = parseCSV(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source.split('\r\n')[0]).toBe('level0,note0,level1,note1,level2,note2');
    expect(imported.title).toBe('Projet, "A"');
    expect(root.notes).toBe('Contexte\nDeuxième ligne');
    expect(child.notes).toBe('Note avec, virgule et "guillemets"');
    expect(root.taskStatus).toBe('done');
    expect(child.taskStatus).toBe('open');
    expect(imported.nodes[child.children[0]].text).toBe('Détail');
    expect(imported.nodes[root.children[1]].text).toBe('Étape 2');
  });

  it('imports multiple roots and the legacy Minder CSV outline shape', () => {
    const imported = parseCSV([
      'level0,note0,level1,note1',
      'Premier,,,',
      ',, - [x] Enfant,Note',
      'Deuxième,,,',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Premier', 'Deuxième']);
    const child = imported.nodes[imported.nodes[root.children[0]].children[0]];
    expect(child).toMatchObject({ text: 'Enfant', notes: 'Note', taskStatus: 'done' });
  });

  it('supports BOM and CRLF records with quoted line breaks', () => {
    const imported = parseCSV('\uFEFFlevel0,note0\r\n"Root","First line\r\nSecond line"\r\n');
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.notes).toBe('First line\r\nSecond line');
  });

  it.each([
    ['unclosed quote', 'level0,note0\n"Root,Note'],
    ['misplaced quote', 'level0,note0\nRo"ot,Note'],
    ['missing parent', 'level0,note0,level1,note1\n,,Child,Note'],
    ['several nodes in one row', 'level0,note0,level1,note1\nRoot,Note,Child,Note'],
    ['invalid columns', 'title,note\nRoot,Note'],
  ])('rejects malformed or unsupported CSV (%s)', (_label, source) => {
    expect(() => parseCSV(source)).toThrow();
  });

  it('rejects invalid node graphs on export', () => {
    const invalid = {
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    };

    expect(() => serializeCSV(invalid)).toThrow(/hiérarchie/);
  });
});
