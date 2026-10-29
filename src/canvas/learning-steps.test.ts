import { describe, expect, it } from 'vitest';
import { NodesMap } from '../types';
import { getLearningSteps } from './learning-steps';

const nodes: NodesMap = {
  root: { id: 'root', text: 'Carte', x: 0, y: 0, parentId: null, children: ['a', 'b', 'nested'], collapsed: false },
  a: { id: 'a', text: 'Comprendre', x: 1, y: 0, parentId: 'root', children: [], collapsed: false },
  b: { id: 'b', text: 'Pratiquer', x: 2, y: 0, parentId: 'root', children: [], collapsed: false },
  nested: { id: 'nested', text: 'Autre', x: 2, y: 1, parentId: 'a', children: [], collapsed: false },
};

describe('learning steps', () => {
  it('uses configured top-level branches in the selected order', () => {
    expect(getLearningSteps(nodes, ['b', 'a', 'nested', 'missing'])).toEqual([
      { id: 'b', title: 'Pratiquer' },
      { id: 'a', title: 'Comprendre' },
    ]);
  });

  it('supports disabling guided navigation with an empty configuration', () => {
    expect(getLearningSteps(nodes, [], 'angular-learning-path')).toEqual([]);
  });

  it('keeps legacy guided templates readable until they are explicitly configured', () => {
    const legacyNodes: NodesMap = {
      ...nodes,
      a: { ...nodes.a, text: 'Étape 1 · Comprendre' },
      b: { ...nodes.b, text: 'Étape 2 · Pratiquer' },
    };
    expect(getLearningSteps(legacyNodes, undefined, 'angular-learning-path')).toEqual([
      { id: 'a', title: 'Comprendre' },
      { id: 'b', title: 'Pratiquer' },
    ]);
    expect(getLearningSteps(legacyNodes)).toEqual([]);
  });
});
