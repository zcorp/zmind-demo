import { strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { FreeEdge, NodesMap } from '../types';
import { parseXMind, serializeXMind } from './XMind';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet Minder',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child', 'second'],
    collapsed: false,
    notes: 'Note racine',
    taskStatus: 'done',
    priority: 'critical',
  },
  child: {
    id: 'child',
    text: 'Étape 1',
    x: 720,
    y: 400,
    parentId: 'root',
    children: ['grandchild'],
    collapsed: false,
    notes: 'Note enfant',
    taskStatus: 'open',
    priority: 'high',
  },
  grandchild: {
    id: 'grandchild',
    text: 'Final',
    x: 940,
    y: 500,
    parentId: 'child',
    children: [],
    collapsed: false,
    priority: 'medium',
  },
  second: {
    id: 'second',
    text: 'Étape 2',
    x: 720,
    y: 600,
    parentId: 'root',
    children: [],
    collapsed: false,
    priority: 'low',
  },
};

const freeEdges: FreeEdge[] = [{
  id: 'edge-1',
  from: 'child',
  to: 'second',
  label: 'Dépend de',
}];

describe('XMind 2021 import/export', () => {
  it('round-trips title, hierarchy, notes, and inter-node links', () => {
    const archive = serializeXMind(nodes, 'Projet exporté', freeEdges);
    const files = unzipSync(archive);
    const imported = parseXMind(archive);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];
    const second = imported.nodes[root.children[1]];

    expect(Object.keys(files).sort()).toEqual(['content.json', 'manifest.json', 'metadata.json']);
    expect(imported.title).toBe('Projet exporté');
    expect(root.text).toBe('Projet Minder');
    expect(root.notes).toBe('Note racine');
    expect(root.taskStatus).toBe('done');
    expect(root.priority).toBe('critical');
    expect(child.notes).toBe('Note enfant');
    expect(child.taskStatus).toBe('open');
    expect(child.priority).toBe('high');
    expect(imported.nodes[child.children[0]].text).toBe('Final');
    expect(imported.nodes[child.children[0]].priority).toBe('medium');
    expect(imported.nodes[root.children[1]].priority).toBe('low');
    const content = JSON.parse(new TextDecoder().decode(files['content.json']));
    expect(content[0].rootTopic.markers).toEqual([
      { markerId: 'task-done' },
      { markerId: 'priority-1' },
    ]);
    expect(imported.freeEdges).toEqual([{
      id: 'minder-relationship-1',
      from: child.id,
      to: second.id,
      label: 'Dépend de',
    }]);
  });

  it('imports XMind child arrays and the attached-topic object shape', () => {
    const source = new TextEncoder().encode(JSON.stringify([{
      class: 'sheet',
      title: 'Imported',
      rootTopic: {
        id: 'root',
        class: 'topic',
        title: 'Root',
        children: {
          attached: [{
            id: 'child',
            class: 'topic',
            title: 'Child',
            children: [{
              id: 'leaf',
              class: 'topic',
              title: 'Leaf',
            }],
          }],
        },
      },
    }]));
    const imported = parseXMind(zipSync({ 'content.json': source }));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(imported.title).toBe('Imported');
    expect(imported.nodes[child.children[0]].text).toBe('Leaf');
  });

  it('imports standard XMind task markers', () => {
    const content = strToU8(JSON.stringify([{
      class: 'sheet',
      title: 'Tasks',
      rootTopic: {
        id: 'root',
        class: 'topic',
        title: 'Root',
        markers: [{ markerId: 'task-start' }],
        children: { attached: [{
          id: 'done',
          class: 'topic',
          title: 'Done',
          markers: [{ markerId: 'task-done' }],
        }] },
      },
    }]));
    const imported = parseXMind(zipSync({ 'content.json': content }));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(root.taskStatus).toBe('open');
    expect(child.taskStatus).toBe('done');
  });

  it('rejects invalid archives, missing roots, and broken relationships', () => {
    expect(() => parseXMind(new Uint8Array([1, 2, 3]))).toThrow();
    expect(() => parseXMind(zipSync({ 'content.json': strToU8('{}') }))).toThrow(/feuille/);

    const invalidRelations = zipSync({
      'content.json': strToU8(JSON.stringify([{
        class: 'sheet',
        rootTopic: { id: 'root', class: 'topic', title: 'Root' },
        relationships: [{ end1: 'root', end2: 'missing' }],
      }])),
    });
    expect(() => parseXMind(invalidRelations)).toThrow(/sujet absent/);
  });

  it('rejects node graphs and links that cannot be represented', () => {
    expect(() => serializeXMind({
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    }, 'Invalid')).toThrow(/hiérarchie/);
    expect(() => serializeXMind(nodes, 'Invalid', [{
      id: 'edge-missing',
      from: 'root',
      to: 'missing',
    }])).toThrow(/référence/);
  });
});
