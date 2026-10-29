import { describe, expect, it } from 'vitest';
import { NodesMap } from '../types';
import { MinderJSON } from './MinderJSON';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet',
    x: 120,
    y: 80,
    parentId: null,
    children: ['child'],
    collapsed: false,
    notes: 'Note racine',
    tags: ['priorité'],
    attachments: [{
      id: 'att-1',
      type: 'link',
      name: 'Documentation',
      value: 'https://example.test/docs',
    }],
  },
  child: {
    id: 'child',
    text: 'Étape',
    x: 320,
    y: 80,
    parentId: 'root',
    children: [],
    collapsed: false,
    borderRadius: 0,
    nodeShape: 'hexagon',
    attachmentPosition: 'top',
    attachmentSize: 64,
    priority: 'high',
    taskStatus: 'open',
  },
};

function serializeNodes(value: unknown): string {
  const json = JSON.stringify(value);
  if (!json) throw new Error('Expected a JSON serializable value.');
  return json;
}

describe('MinderJSON', () => {
  it('round-trips the full node data in the canonical versioned wrapper', () => {
    const file = JSON.parse(MinderJSON.serialize(nodes, 'Plan')) as Record<string, unknown>;

    expect(file).toMatchObject({
      version: '1.0',
      title: 'Plan',
      nodes,
    });
    expect(file.createdAt).toEqual(expect.any(Number));
    expect(file.updatedAt).toEqual(expect.any(Number));
    expect(MinderJSON.deserialize(JSON.stringify(file))).toEqual(nodes);
  });

  it('imports the previous wrapped format with exportedAt metadata', () => {
    const legacyFile = { version: '1.0', title: 'Ancien export', exportedAt: 123, nodes };
    expect(MinderJSON.deserialize(JSON.stringify(legacyFile))).toEqual(nodes);
  });

  it('continues to import a bare NodesMap', () => {
    expect(MinderJSON.deserialize(JSON.stringify(nodes))).toEqual(nodes);
  });

  it('round-trips completed task status', () => {
    const completedNodes: NodesMap = {
      ...nodes,
      child: { ...nodes.child, taskStatus: 'done' },
    };

    expect(MinderJSON.deserialize(MinderJSON.serialize(completedNodes))).toEqual(completedNodes);
  });

  it('round-trips per-node text formatting', () => {
    const formattedNodes: NodesMap = {
      ...nodes,
      child: {
        ...nodes.child,
        textFormats: [{
          start: 0,
          end: 5,
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          textBold: true,
          textItalic: true,
          textUnderline: true,
          textStrikethrough: true,
          textColor: '#123456',
          textBackgroundColor: '#fff176',
        }],
        textAlign: 'right',
        textLineHeight: 1.5,
        textBullet: 'square',
      },
    };

    expect(MinderJSON.deserialize(MinderJSON.serialize(formattedNodes))).toEqual(formattedNodes);
  });

  it('rejects invalid node shape and out-of-range media preview settings', () => {
    for (const changes of [
      { nodeShape: 'starburst' },
      { attachmentPosition: 'center' },
      { attachmentSize: 221 },
      { textFormats: [{ start: 0, end: 5, fontSize: 33 }] },
      { textFormats: [{ start: 0, end: 4, textBold: true }, { start: 3, end: 5, textItalic: true }] },
      { textAlign: 'justify' },
      { textLineHeight: 1.75 },
      { textBullet: 'dash' },
    ]) {
      expect(() => MinderJSON.deserialize(serializeNodes({
        ...nodes,
        child: { ...nodes.child, ...changes },
      }))).toThrow();
    }
  });

  it('accepts larger image previews for visual maps', () => {
    const nodesWithLargeImage: NodesMap = {
      ...nodes,
      child: { ...nodes.child, attachmentSize: 220 },
    };

    expect(MinderJSON.deserialize(MinderJSON.serialize(nodesWithLargeImage))).toEqual(nodesWithLargeImage);
  });

  it('accepts a legacy map whose node IDs are reserved wrapper names', () => {
    const legacyMap: NodesMap = {
      version: {
        ...nodes.root,
        id: 'version',
        children: ['nodes'],
      },
      nodes: {
        ...nodes.child,
        id: 'nodes',
        parentId: 'version',
      },
    };

    expect(MinderJSON.deserialize(JSON.stringify(legacyMap))).toEqual(legacyMap);
  });

  it('preserves a node whose ID is a special object property', () => {
    const specialIdMap = JSON.parse(
      '{"__proto__":{"id":"__proto__","text":"Racine","x":0,"y":0,"parentId":null,"children":[],"collapsed":false}}'
    ) as NodesMap;

    expect(MinderJSON.deserialize(JSON.stringify(specialIdMap))).toEqual(specialIdMap);
  });

  it.each([
    ['malformed JSON', '{'],
    ['unsupported version', JSON.stringify({ version: '9.0', nodes })],
    ['empty map', serializeNodes({ version: '1.0', nodes: {} })],
    ['missing child node', serializeNodes({
      root: { ...nodes.root, children: ['missing'] },
    })],
    ['inconsistent parent link', serializeNodes({
      root: { ...nodes.root, children: [] },
      child: nodes.child,
    })],
    ['multiple roots', serializeNodes({
      ...nodes,
      other: { ...nodes.child, id: 'other', parentId: null },
    })],
    ['non-finite coordinates', serializeNodes({
      ...nodes,
      child: { ...nodes.child, x: Number.NaN },
    })],
    ['invalid task status', serializeNodes({
      ...nodes,
      child: { ...nodes.child, taskStatus: 'blocked' },
    })],
  ])('rejects invalid input (%s)', (_label, input) => {
    expect(() => MinderJSON.deserialize(input)).toThrow();
  });

  it('rejects serialization of an invalid graph instead of saving it', () => {
    const invalidNodes = {
      ...nodes,
      child: { ...nodes.child, parentId: null },
    };

    expect(() => MinderJSON.serialize(invalidNodes)).toThrow();
  });
});
