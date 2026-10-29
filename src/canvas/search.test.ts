import { describe, expect, it } from 'vitest';
import type { NodesMap } from '../types';
import { collapsedAncestors, searchMatches, type SearchFilters } from './search';
import type { FreeEdge } from '../types';

const nodes: NodesMap = {
  root: {
    id: 'root',
    text: 'Projet',
    x: 500,
    y: 300,
    parentId: null,
    children: ['child'],
    collapsed: true,
    notes: 'Préparer le lancement',
    tags: ['Important'],
    priority: 'high',
  },
  child: {
    id: 'child',
    text: 'Publier',
    x: 720,
    y: 400,
    parentId: 'root',
    children: [],
    collapsed: false,
    notes: 'Relire la documentation',
    tags: ['Release'],
    priority: 'low',
    taskStatus: 'open',
    attachments: [
      { id: 'att-link', type: 'link', name: 'Roadmap', value: 'https://example.test/plan' },
      { id: 'att-equation', type: 'equation', name: 'x + y', value: 'x + y' },
      { id: 'att-image', type: 'image', name: 'maquette.png', value: 'data:image/png;base64,encoded-payload' },
      { id: 'att-file', type: 'file', name: 'brief.pdf', value: 'data:application/pdf;base64,encoded-payload' },
    ],
  },
  noPriority: {
    id: 'noPriority',
    text: 'Sans priorité',
    x: 500,
    y: 500,
    parentId: null,
    children: [],
    collapsed: false,
  },
};

const allFilters: SearchFilters = {
  fields: { titles: true, notes: true, tags: true, connections: true, attachments: true },
  includeTasks: true,
  includeNonTasks: true,
  includeCollapsed: true,
  includeExpanded: true,
  priorities: { none: true, low: true, medium: true, high: true, critical: true },
};
const freeEdges: FreeEdge[] = [
  { id: 'edge-1', from: 'root', to: 'child', label: 'Dépend de' },
  { id: 'edge-2', from: 'child', to: 'noPriority' },
];

describe('node search', () => {
  it('searches titles by default and ignores case and surrounding whitespace', () => {
    expect(searchMatches(nodes, freeEdges, '  PROJET ', {
      ...allFilters,
      fields: { titles: true, notes: false, tags: false, connections: false, attachments: false },
    })).toEqual([{ type: 'node', id: 'root' }]);
  });

  it('searches notes and tags only when their filters are enabled', () => {
    expect(searchMatches(nodes, freeEdges, 'documentation', allFilters)).toEqual([{ type: 'node', id: 'child' }]);
    expect(searchMatches(nodes, freeEdges, 'release', allFilters)).toEqual([{ type: 'node', id: 'child' }]);
    expect(searchMatches(nodes, freeEdges, 'documentation', {
      ...allFilters,
      fields: { titles: true, notes: false, tags: false, connections: false, attachments: false },
    })).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'release', {
      ...allFilters,
      fields: { titles: true, notes: true, tags: false, connections: false, attachments: false },
    })).toEqual([]);
  });

  it('returns no matches for a blank query or when every field is disabled', () => {
    expect(searchMatches(nodes, freeEdges, '  ', allFilters)).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'Projet', {
      ...allFilters,
      fields: { titles: false, notes: false, tags: false, connections: false, attachments: false },
    })).toEqual([]);
  });

  it('filters by priority and expanded/collapsed state', () => {
    expect(searchMatches(nodes, freeEdges, 'e', {
      ...allFilters,
      fields: { titles: true, notes: false, tags: false, connections: false, attachments: false },
      priorities: { none: false, low: false, medium: false, high: true, critical: false },
    })).toEqual([{ type: 'node', id: 'root' }]);
    expect(searchMatches(nodes, freeEdges, 'Projet', {
      ...allFilters,
      includeExpanded: false,
    })).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'Projet', {
      ...allFilters,
      priorities: { none: true, low: true, medium: true, high: false, critical: true },
    })).toEqual([]);
  });

  it('filters task and non-task nodes independently', () => {
    expect(searchMatches(nodes, freeEdges, 'publier', {
      ...allFilters,
      includeTasks: false,
    })).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'projet', {
      ...allFilters,
      includeNonTasks: false,
    })).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'publier', {
      ...allFilters,
      includeNonTasks: false,
    })).toEqual([{ type: 'node', id: 'child' }]);
  });

  it('classifies descendants of folded parents and finds all folded ancestors', () => {
    expect(collapsedAncestors(nodes, 'child')).toEqual(['root']);
    expect(collapsedAncestors(nodes, 'root')).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'publier', {
      ...allFilters,
      includeCollapsed: false,
    })).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'publier', {
      ...allFilters,
      includeExpanded: false,
    })).toEqual([{ type: 'node', id: 'child' }]);
  });

  it('searches connection labels without matching unlabeled links', () => {
    expect(searchMatches(nodes, freeEdges, 'dépend', {
      ...allFilters,
      fields: { titles: false, notes: false, tags: false, connections: true, attachments: false },
    })).toEqual([{ type: 'connection', id: 'edge-1' }]);
  });

  it('matches accented text when the query omits accents', () => {
    expect(searchMatches(nodes, freeEdges, 'PREPARER', {
      ...allFilters,
      fields: { titles: false, notes: true, tags: false, connections: false, attachments: false },
    })).toEqual([{ type: 'node', id: 'root' }]);
    expect(searchMatches(nodes, freeEdges, 'depend', {
      ...allFilters,
      fields: { titles: false, notes: false, tags: false, connections: true, attachments: false },
    })).toEqual([{ type: 'connection', id: 'edge-1' }]);
  });

  it('searches attachment names and text values, but not embedded file data', () => {
    const onlyAttachments = {
      ...allFilters,
      fields: { titles: false, notes: false, tags: false, connections: false, attachments: true },
    };

    expect(searchMatches(nodes, freeEdges, 'roadmap', onlyAttachments))
      .toEqual([{ type: 'node', id: 'child' }]);
    expect(searchMatches(nodes, freeEdges, 'example.test/plan', onlyAttachments))
      .toEqual([{ type: 'node', id: 'child' }]);
    expect(searchMatches(nodes, freeEdges, 'maquette.png', onlyAttachments))
      .toEqual([{ type: 'node', id: 'child' }]);
    expect(searchMatches(nodes, freeEdges, 'encoded-payload', onlyAttachments)).toEqual([]);
    expect(searchMatches(nodes, freeEdges, 'roadmap', {
      ...onlyAttachments,
      fields: { ...onlyAttachments.fields, attachments: false },
    })).toEqual([]);
  });
});
