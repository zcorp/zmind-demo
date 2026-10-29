// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/templates/okr.ts
//
// TEMPLATE PLUGIN — OKR Quarterly Planning
// Objectif → Key Results avec sous-initiatives
// author: ai-generated
// ─────────────────────────────────────────────────────────────────────────────

import { TemplatePlugin, TemplateOptions, PluginNodesMap, makeId } from '../types';

export const OkrTemplate: TemplatePlugin = {

  meta: {
    id:          'okr-quarterly',
    name:        'OKR Trimestriel',
    description: 'Exemple concret d’objectif, de résultats mesurables et d’initiatives.',
    type:        'template',
    version:     '1.0.0',
    author:      'ai-generated',
  },

  category: 'enterprise',
  preview:  ['Objectif', 'Résultats mesurables', 'Initiatives'],

  build(opts: TemplateOptions): PluginNodesMap {
    const { originX, originY, parentId } = opts;
    const rootId = makeId('okr');

    const krCount  = 4;
    const xStep    = 200;
    const yStep    = 90;
    const totalH   = (krCount - 1) * yStep;

    const result: PluginNodesMap = {
      [rootId]: {
        id: rootId, text: 'Ex. lancer l’app avec succès',
        x: originX, y: originY,
        parentId,
        children: [],
        collapsed: false,
        color: '#4f8ef7',
        icon: 'target',
        priority: 'high',
      },
    };

    const krIds: string[] = [];
    const keyResults = [
      'Atteindre 1 000 inscriptions',
      '40 % reviennent après 7 jours',
      'Obtenir 4,5/5 de satisfaction',
      'Garder l’ouverture sous 2 s',
    ];
    const initiatives = [
      ['Créer un parcours d’accueil', 'Inviter les premiers testeurs'],
      ['Envoyer un rappel utile', 'Améliorer les fonctions clés'],
      ['Interroger les utilisateurs', 'Corriger les irritants prioritaires'],
      ['Mesurer les temps de réponse', 'Optimiser les écrans lourds'],
    ];

    for (let i = 0; i < krCount; i++) {
      const krId       = makeId('okr');
      const krY        = originY - totalH / 2 + i * yStep;
      const init1Id    = makeId('okr');
      const init2Id    = makeId('okr');
      const krLabel    = keyResults[i];
      const krColor    = ['#22c55e', '#4f8ef7', '#f5a623', '#e05c7b'][i % 4];

      krIds.push(krId);

      result[krId] = {
        id: krId, text: krLabel,
        x: originX + xStep, y: krY,
        parentId: rootId,
        children: [init1Id, init2Id],
        collapsed: false,
        color: krColor,
        number: `${i + 1}`,
      };

      result[init1Id] = {
        id: init1Id, text: initiatives[i][0],
        x: originX + xStep * 2, y: krY - 28,
        parentId: krId, children: [], collapsed: false,
      };

      result[init2Id] = {
        id: init2Id, text: initiatives[i][1],
        x: originX + xStep * 2, y: krY + 28,
        parentId: krId, children: [], collapsed: false,
      };
    }

    result[rootId].children = krIds;
    return result;
  },
};
