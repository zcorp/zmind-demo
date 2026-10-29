import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { parsePlantUML, serializePlantUML } from './PlantUML';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet\\x\nligne deux',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: false,
    taskStatus: 'done',
  },
  child: {
    id: 'child',
    text: 'Étape',
    x: 720,
    y: 400,
    parentId: 'root',
    children: ['leaf'],
    collapsed: false,
    color: '#12abef',
    taskStatus: 'open',
  },
  leaf: {
    id: 'leaf',
    text: 'Final',
    x: 940,
    y: 500,
    parentId: 'child',
    children: [],
    collapsed: false,
  },
};

describe('PlantUML mindmap import/export', () => {
  it('round-trips hierarchy, escaped newlines, literal backslashes, and colors', () => {
    const source = serializePlantUML(nodes);
    const imported = parsePlantUML(source);
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(source).toContain('@startmindmap');
    expect(source).toContain('**[#12abef] [ ] Étape');
    expect(source).toContain('@endmindmap');
    expect(root.text).toBe('Projet\\x\nligne deux');
    expect(child.color).toBe('#12abef');
    expect(imported.nodes[child.children[0]].text).toBe('Final');
    expect(root.taskStatus).toBe('done');
    expect(child.taskStatus).toBe('open');
  });

  it('imports task markers without retaining them in node titles', () => {
    const imported = parsePlantUML([
      '@startmindmap',
      '* [x] Finished',
      '** [ ] Next step',
      '@endmindmap',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;
    const child = imported.nodes[root.children[0]];

    expect(root).toMatchObject({ text: 'Finished', taskStatus: 'done' });
    expect(child).toMatchObject({ text: 'Next step', taskStatus: 'open' });
  });

  it('imports common star, plus, minus, color, and no-border markers', () => {
    const imported = parsePlantUML([
      '@startmindmap',
      '* Root',
      '**[#00aaff] Blue child',
      '***_ No border',
      '** Right-side branch',
      '@endmindmap',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['Blue child', 'Right-side branch']);
    expect(imported.nodes[root.children[0]].color).toBe('#00aaff');
    expect(imported.nodes[imported.nodes[root.children[0]].children[0]].text).toBe('No border');
  });

  it('imports left/right side hints and combines multiple maps', () => {
    const imported = parsePlantUML([
      '@startmindmap',
      '* First',
      'right side',
      '** Child',
      '@endmindmap',
      '@startmindmap',
      '* Second',
      'left side',
      '** Another child',
      '@endmindmap',
    ].join('\n'));
    const root = Object.values(imported.nodes).find(node => node.parentId === null)!;

    expect(root.text).toBe('Carte importée');
    expect(root.children.map(id => imported.nodes[id].text)).toEqual(['First', 'Second']);
  });

  it.each([
    ['missing wrapper', '* Root'],
    ['empty map', '@startmindmap\n@endmindmap'],
    ['missing parent level', '@startmindmap\n* Root\n*** Child\n@endmindmap'],
    ['child before root', '@startmindmap\n** Child\n@endmindmap'],
    ['unclosed map', '@startmindmap\n* Root'],
  ])('rejects invalid PlantUML (%s)', (_label, source) => {
    expect(() => parsePlantUML(source)).toThrow();
  });

  it('rejects invalid graphs on export', () => {
    const invalid = {
      ...nodes,
      child: { ...nodes.child, parentId: 'missing' },
    };

    expect(() => serializePlantUML(invalid)).toThrow(/hiérarchie/);
  });
});
