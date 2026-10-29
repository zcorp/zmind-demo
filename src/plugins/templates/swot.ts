// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/templates/swot.ts
//
// TEMPLATE PLUGIN — SWOT Analysis
//
// Produces a ready-to-use SWOT mind map with an adaptable product example.
// Use this as the reference implementation for template plugins.
//
// AI GENERATION NOTE:
//   - build() must be a pure function: no Math.random(), no Date.now() directly.
//     Use makeId() from '../types' for all node IDs.
//   - Do NOT reference global state.
//   - Every node in the returned map must form a valid tree
//     (parentId consistency + children array consistency).
//   - originX/Y from options = position of the root node.
// ─────────────────────────────────────────────────────────────────────────────

import { TemplatePlugin, TemplateOptions, PluginNodesMap, makeId } from '../types';

export const SwotTemplate: TemplatePlugin = {

  meta: {
    id:          'swot',
    name:        'Analyse SWOT',
    description: 'Un exemple de lancement de produit à adapter à votre projet.',
    type:        'template',
    version:     '1.0.0',
    author:      'minder-team',
  },

  category: 'enterprise',
  preview:  ['Forces', 'Faiblesses', 'Opportunités', 'Menaces'],

  build(opts: TemplateOptions): PluginNodesMap {
    const { originX, originY, parentId } = opts;

    // Generate stable IDs via makeId()
    const rootId = makeId('swot');
    const ids = {
      forces:       makeId('swot'),
      faiblesses:   makeId('swot'),
      opportunites: makeId('swot'),
      menaces:      makeId('swot'),
      f1: makeId('swot'), f2: makeId('swot'),
      fa1: makeId('swot'), fa2: makeId('swot'),
      o1: makeId('swot'), o2: makeId('swot'),
      m1: makeId('swot'),
    };

    const xGap = 180;
    const yGap = 80;

    const result: PluginNodesMap = {
      [rootId]: {
        id: rootId, text: 'Analyse SWOT',
        x: originX, y: originY,
        parentId,
        children: [ids.forces, ids.faiblesses, ids.opportunites, ids.menaces],
        collapsed: false, color: '#4f8ef7',
      },

      // ── Forces (left-up)
      [ids.forces]: {
        id: ids.forces, text: 'Forces', x: originX - xGap, y: originY - yGap * 2,
        parentId: rootId, children: [ids.f1, ids.f2], collapsed: false, color: '#22c55e',
      },
      [ids.f1]: {
        id: ids.f1, text: 'Équipe aux compétences variées', x: originX - xGap * 2, y: originY - yGap * 3,
        parentId: ids.forces, children: [], collapsed: false,
      },
      [ids.f2]: {
        id: ids.f2, text: 'Prototype déjà testé', x: originX - xGap * 2, y: originY - yGap,
        parentId: ids.forces, children: [], collapsed: false,
      },

      // ── Faiblesses (left-down)
      [ids.faiblesses]: {
        id: ids.faiblesses, text: 'Faiblesses', x: originX - xGap, y: originY + yGap * 2,
        parentId: rootId, children: [ids.fa1, ids.fa2], collapsed: false, color: '#e05c7b',
      },
      [ids.fa1]: {
        id: ids.fa1, text: 'Budget de lancement limité', x: originX - xGap * 2, y: originY + yGap,
        parentId: ids.faiblesses, children: [], collapsed: false,
      },
      [ids.fa2]: {
        id: ids.fa2, text: 'Notoriété encore faible', x: originX - xGap * 2, y: originY + yGap * 3,
        parentId: ids.faiblesses, children: [], collapsed: false,
      },

      // ── Opportunités (right-up)
      [ids.opportunites]: {
        id: ids.opportunites, text: 'Opportunités', x: originX + xGap, y: originY - yGap * 2,
        parentId: rootId, children: [ids.o1, ids.o2], collapsed: false, color: '#4ec9a0',
      },
      [ids.o1]: {
        id: ids.o1, text: 'Demande croissante', x: originX + xGap * 2, y: originY - yGap * 3,
        parentId: ids.opportunites, children: [], collapsed: false,
      },
      [ids.o2]: {
        id: ids.o2, text: 'Nouveau canal de vente', x: originX + xGap * 2, y: originY - yGap,
        parentId: ids.opportunites, children: [], collapsed: false,
      },

      // ── Menaces (right-down)
      [ids.menaces]: {
        id: ids.menaces, text: 'Menaces', x: originX + xGap, y: originY + yGap * 2,
        parentId: rootId, children: [ids.m1], collapsed: false, color: '#f5a623',
      },
      [ids.m1]: {
        id: ids.m1, text: 'Concurrent déjà bien installé', x: originX + xGap * 2, y: originY + yGap * 2,
        parentId: ids.menaces, children: [], collapsed: false,
      },
    };

    return result;
  },
};
