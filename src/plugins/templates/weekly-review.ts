// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/templates/weekly-review.ts
//
// TEMPLATE PLUGIN — Weekly Review
//
// Personal productivity template with a concrete weekly-planning example.
// ─────────────────────────────────────────────────────────────────────────────

import { TemplatePlugin, TemplateOptions, PluginNodesMap, makeId } from '../types';

export const WeeklyReviewTemplate: TemplatePlugin = {

  meta: {
    id:          'weekly-review',
    name:        'Revue hebdomadaire',
    description: 'Accompli · En cours · Bloquant · Priorités semaine prochaine.',
    type:        'template',
    version:     '1.0.0',
    author:      'minder-team',
  },

  category: 'personal',
  preview:  ['Accompli', 'En cours', 'Bloquant', 'Semaine prochaine'],

  build(opts: TemplateOptions): PluginNodesMap {
    const { originX, originY, parentId } = opts;
    const rootId = makeId('wr');

    const sections: Array<{
      key: string; label: string; color: string; dx: number; dy: number;
      items: string[];
    }> = [
      { key: 'done',  label: '✅ Terminé',        color: '#22c55e', dx: -160, dy: -90, items: ['Prototype de la page d’accueil', 'Réunion d’équipe préparée'] },
      { key: 'wip',   label: '🔄 En cours',       color: '#4f8ef7', dx: -160, dy:  90, items: ['Finaliser la maquette mobile'] },
      { key: 'block', label: '⚠️ Bloqué',         color: '#e05c7b', dx:  160, dy: -90, items: ['En attente du retour client'] },
      { key: 'next',  label: 'À faire ensuite',   color: '#f5a623', dx:  160, dy:  90, items: ['Tester avec 3 personnes', 'Corriger les retours', 'Préparer la démonstration'] },
    ];

    const result: PluginNodesMap = {
      [rootId]: {
        id: rootId, text: 'Ma semaine · exemple', x: originX, y: originY,
        parentId, children: sections.map(s => s.key + '_' + rootId),
        collapsed: false, color: '#9b59b6', icon: 'clock',
      },
    };

    for (const sec of sections) {
      const secId    = sec.key + '_' + rootId;
      const itemIds  = sec.items.map(() => makeId('wr'));

      result[secId] = {
        id: secId, text: sec.label,
        x: originX + sec.dx, y: originY + sec.dy,
        parentId: rootId, children: itemIds,
        collapsed: false, color: sec.color,
      };

      itemIds.forEach((iid, idx) => {
        result[iid] = {
          id: iid, text: sec.items[idx],
          x: originX + sec.dx + Math.sign(sec.dx) * 160,
          y: originY + sec.dy + (idx - Math.floor(sec.items.length / 2)) * 60,
          parentId: secId, children: [], collapsed: false,
        };
      });
    }

    return result;
  },
};
