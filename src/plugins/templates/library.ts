// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/templates/library.ts
//
// Practical template library with worked examples across several domains.
//
// Each template is a TemplatePlugin.  Drop this file to add all of them,
// or copy individual entries and add to registry.ts.
//
// AI GENERATION NOTE — follow PLUGINS.md conventions:
//   - Export one const per template
//   - Use makeId() for all node IDs
//   - build() must be a pure function
// ─────────────────────────────────────────────────────────────────────────────

import { TemplatePlugin, TemplateOptions, PluginNodesMap, makeId } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeTree(
  rootText: string,
  branches: { label: string; color: string; items: string[]; icon?: string }[],
  opts: TemplateOptions,
  xStep = 220
): PluginNodesMap {
  const rootId = makeId('t');
  const { originX, originY, parentId } = opts;
  const result: PluginNodesMap = {};

  const ITEM_H    = 56; // vertical space per leaf node
  const BRANCH_PAD = 24; // extra padding between branches

  // Compute each branch's height based on its item count
  const branchHeights = branches.map(b => Math.max(1, b.items.length) * ITEM_H);
  const totalH        = branchHeights.reduce((s, h) => s + h, 0) + (branches.length - 1) * BRANCH_PAD;

  result[rootId] = {
    id: rootId, text: rootText,
    x: originX, y: originY,
    parentId, children: [], collapsed: false,
  };

  let cursor = originY - totalH / 2;

  branches.forEach((branch, bi) => {
    const branchId  = makeId('t');
    const bH        = branchHeights[bi];
    const branchY   = cursor + bH / 2;
    const itemIds: string[] = [];

    result[branchId] = {
      id: branchId, text: `${branch.icon ?? ''} ${branch.label}`.trim(),
      x: originX + xStep, y: branchY,
      parentId: rootId, children: [], collapsed: false,
      color: branch.color,
    };

    branch.items.forEach((item, ii) => {
      const itemId = makeId('t');
      itemIds.push(itemId);
      result[itemId] = {
        id: itemId, text: item,
        x: originX + xStep * 2,
        y: cursor + ii * ITEM_H + ITEM_H / 2,
        parentId: branchId, children: [], collapsed: false,
      };
    });

    result[branchId].children = itemIds;
    result[rootId].children.push(branchId);
    cursor += bH + BRANCH_PAD;
  });

  return result;
}

function makeNestedTree(
  rootText: string,
  branches: {
    label: string;
    color: string;
    groups: { label: string; items: string[] }[];
  }[],
  opts: TemplateOptions,
  xStep = 175
): PluginNodesMap {
  type NestedItem = { label: string; children?: NestedItem[] };
  const { originX, originY, parentId } = opts;
  const totalLeaves = branches.reduce(
    (total, branch) => total + branch.groups.reduce((sum, group) => sum + group.items.length, 0),
    0
  );
  const leafStep = 58;
  const result: PluginNodesMap = {};
  const rootId = makeId('nested');

  result[rootId] = {
    id: rootId,
    text: rootText,
    x: originX,
    y: originY,
    parentId,
    children: [],
    collapsed: false,
  };

  let leafIndex = 0;
  const addNode = (
    item: NestedItem,
    depth: number,
    direction: number,
    color: string,
    nodeParentId: string
  ): { id: string; y: number } => {
    const id = makeId('nested');
    const children = item.children ?? [];
    const childNodes = children.map(child => addNode(child, depth + 1, direction, color, id));
    const y = childNodes.length
      ? childNodes.reduce((sum, child) => sum + child.y, 0) / childNodes.length
      : originY + (leafIndex++ - (totalLeaves - 1) / 2) * leafStep;

    result[id] = {
      id,
      text: item.label,
      x: originX + direction * depth * xStep,
      y,
      parentId: nodeParentId,
      children: childNodes.map(child => child.id),
      collapsed: false,
      color,
    };
    return { id, y };
  };

  branches.forEach((branch, index) => {
    const direction = index === 0 ? -1 : 1;
    const children = branch.groups.map(group => ({
      label: group.label,
      children: group.items.map(label => ({ label })),
    }));
    const childNodes = children.map(child => addNode(child, 2, direction, branch.color, rootId));
    const branchId = makeId('nested');
    const y = childNodes.reduce((sum, child) => sum + child.y, 0) / childNodes.length;

    result[branchId] = {
      id: branchId,
      text: branch.label,
      x: originX + direction * xStep,
      y,
      parentId: rootId,
      children: childNodes.map(child => child.id),
      collapsed: false,
      color: branch.color,
    };
    childNodes.forEach(child => {
      result[child.id].parentId = branchId;
    });
    result[rootId].children.push(branchId);
  });

  return result;
}

function makeImageAttachment(name: string, value: string) {
  return {
    id: makeId('image'),
    type: 'image' as const,
    name,
    value,
  };
}

function attachExternalLink(nodes: PluginNodesMap, nodeText: string, name: string, url: string): PluginNodesMap {
  const node = Object.values(nodes).find(candidate => candidate.text === nodeText);
  if (!node) {
    throw new Error(`Template resource node not found: ${nodeText}`);
  }
  node.attachments = [
    ...(node.attachments ?? []),
    { id: makeId('link'), type: 'link', name, value: url },
  ];
  return nodes;
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTOIRE
// ─────────────────────────────────────────────────────────────────────────────

export const TimelineTemplate: TemplatePlugin = {
  meta: { id: 'timeline-history', name: 'Chronologie historique', description: 'Période → événements majeurs → causes / conséquences', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Contexte', 'Événements', 'Acteurs', 'Conséquences'],
  build: (opts) => makeTree('Révolution française · 1789–1799', [
    { label: 'Avant 1789',      color: '#4f8ef7', items: ['Crise financière', 'Société d’ordres', 'États généraux'] },
    { label: 'Dates clés',      color: '#f5a623', items: ['14 juillet 1789 · Bastille', '26 août 1789 · Déclaration', '21 septembre 1792 · République'], icon: '📅' },
    { label: 'Acteurs',         color: '#e05c7b', items: ['Robespierre', 'Danton', 'Olympe de Gouges'], icon: '👤' },
    { label: 'Après 1789',      color: '#4ec9a0', items: ['Fin des privilèges', 'Terreur · 1793–1794', 'Coup d’État · 1799'] },
  ], opts),
};

export const IllustratedLearningTemplate: TemplatePlugin = {
  meta: {
    id: 'illustrated-learning-method',
    name: 'Apprendre efficacement',
    description: 'Une carte en plusieurs niveaux pour organiser ses méthodes d’apprentissage.',
    type: 'template',
    version: '1.0.0',
    author: 'minder-team',
  },
  category: 'education',
  preview: ['Comprendre', 'Mémoriser', 'S’entraîner'],
  build: (opts) => makeNestedTree('Apprendre efficacement', [
    {
      label: 'Comprendre',
      color: '#52719a',
      groups: [
        { label: 'Analyser', items: ['Idées clés', 'Exemples'] },
        { label: 'Relier', items: ['Causes', 'Conséquences'] },
      ],
    },
    {
      label: 'Mémoriser',
      color: '#bd8428',
      groups: [
        { label: 'Rappel actif', items: ['Se tester', 'Expliquer'] },
        { label: 'Révisions', items: ['Espacer', 'Répéter'] },
      ],
    },
    {
      label: 'S’entraîner',
      color: '#467b68',
      groups: [
        { label: 'Pratiquer', items: ['Exercices', 'Problèmes'] },
        { label: 'Corriger', items: ['Repérer ses erreurs', 'Reprendre la méthode'] },
      ],
    },
  ], opts),
};

export const IllustratedHistoryTemplate: TemplatePlugin = {
  meta: {
    id: 'illustrated-history-timeline',
    name: 'Frise historique illustrée',
    description: 'Une ligne du temps en images, avec les dates et leurs conséquences.',
    type: 'template',
    version: '1.0.0',
    author: 'minder-team',
  },
  category: 'education',
  preview: [
    '1789 · La Révolution commence',
    '1791 · Une première Constitution',
    '1792 · La République',
    '1799 · Le Consulat',
  ],
  build: ({ originX, originY, parentId }) => {
    const rootId = makeId('history');
    const events = [
      {
        date: '1789 · La Révolution commence',
        color: '#b6534b',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=640&q=80',
        details: ['Prise de la Bastille', 'Fin des privilèges'],
      },
      {
        date: '1791 · Une première Constitution',
        color: '#bd8428',
        image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=640&q=80',
        details: ['Monarchie constitutionnelle', 'Séparation des pouvoirs'],
      },
      {
        date: '1792 · La République',
        color: '#467b68',
        image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=640&q=80',
        details: ['Fin de la monarchie', 'Nouvelle assemblée'],
      },
      {
        date: '1799 · Le Consulat',
        color: '#52719a',
        image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=640&q=80',
        details: ['Coup d’État du 18 Brumaire', 'Début du Consulat'],
      },
    ];
    const result: PluginNodesMap = {
      [rootId]: {
        id: rootId,
        text: 'La Révolution française · 1789–1799',
        x: originX,
        y: originY,
        parentId,
        children: [],
        collapsed: false,
        notes: 'Parcourez les grandes étapes de la Révolution et reliez chaque événement à ses conséquences.',
      },
    };

    events.forEach((event, index) => {
      const direction = index % 2 === 0 ? -1 : 1;
      const row = index < 2 ? -1 : 1;
      const branchId = makeId('history');
      const childIds = event.details.map(() => makeId('history'));
      const x = originX + direction * 310;
      const y = originY + row * 150;
      result[branchId] = {
        id: branchId,
        text: event.date,
        x,
        y,
        parentId: rootId,
        children: childIds,
        collapsed: false,
        color: event.color,
        attachmentPosition: index % 2 === 0 ? 'top' : 'bottom',
        attachmentSize: 118,
        attachments: [makeImageAttachment(`${event.date} · image`, event.image)],
      };
      event.details.forEach((detail, childIndex) => {
        const childId = childIds[childIndex];
        result[childId] = {
          id: childId,
          text: detail,
          x: x + direction * 225,
          y: y + (childIndex === 0 ? -38 : 38),
          parentId: branchId,
          children: [],
          collapsed: false,
          color: event.color,
        };
      });
      result[rootId].children.push(branchId);
    });

    return result;
  },
};

export const IllustratedSolarSystemTemplate: TemplatePlugin = {
  meta: {
    id: 'illustrated-solar-system-atlas',
    name: 'Atlas illustré du système solaire',
    description: 'Le Soleil au centre, les planètes en orbite et leurs repères visuels.',
    type: 'template',
    version: '1.0.0',
    author: 'minder-team',
  },
  category: 'education',
  preview: ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'],
  build: ({ originX, originY, parentId }) => {
    const rootId = makeId('solar');
    const planets = [
      { name: 'Mercure', color: '#9b806f', image: 'https://images-assets.nasa.gov/image/PIA15163/PIA15163~thumb.jpg', facts: ['Planète la plus proche du Soleil', 'Surface couverte de cratères'] },
      { name: 'Vénus', color: '#d49b5c', image: 'https://images-assets.nasa.gov/image/PIA00104/PIA00104~thumb.jpg', facts: ['Atmosphère très dense', 'Température de surface élevée'] },
      { name: 'Terre', color: '#4387a8', image: 'https://images-assets.nasa.gov/image/PIA18033/PIA18033~thumb.jpg', facts: ['Eau liquide en surface', 'Un satellite naturel · la Lune'] },
      { name: 'Mars', color: '#bd654d', image: 'https://images-assets.nasa.gov/image/PIA04591/PIA04591~thumb.jpg', facts: ['Surnommée la planète rouge', 'Explorée par des robots mobiles'] },
      { name: 'Jupiter', color: '#b88862', image: 'https://images-assets.nasa.gov/image/PIA22946/PIA22946~thumb.jpg', facts: ['La plus grande planète', 'Grande Tache rouge'] },
      { name: 'Saturne', color: '#c4a65d', image: 'https://images-assets.nasa.gov/image/PIA21356/PIA21356~thumb.jpg', facts: ['Ses anneaux sont célèbres', 'Nombreux satellites naturels'] },
      { name: 'Uranus', color: '#69a6a8', image: 'https://images-assets.nasa.gov/image/PIA18182/PIA18182~thumb.jpg', facts: ['Axe de rotation très incliné', 'Atmosphère riche en méthane'] },
      { name: 'Neptune', color: '#5877ba', image: 'https://images-assets.nasa.gov/image/PIA01492/PIA01492~thumb.jpg', facts: ['Planète la plus éloignée', 'Vents extrêmement rapides'] },
    ];
    const result: PluginNodesMap = {
      [rootId]: {
        id: rootId,
        text: 'Notre système solaire',
        x: originX,
        y: originY,
        parentId,
        children: [],
        collapsed: false,
        icon: 'globe',
        attachmentPosition: 'top',
        attachmentSize: 128,
        attachments: [makeImageAttachment('Nébuleuse · repère spatial', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=640&q=80')],
        notes: 'Huit planètes orbitent autour du Soleil. Le schéma est pédagogique et ne respecte pas les échelles réelles.',
      },
    };

    planets.forEach((planet, index) => {
      const angle = -Math.PI / 2 + index * (Math.PI * 2 / planets.length);
      const direction = Math.cos(angle) < 0 ? -1 : 1;
      const branchId = makeId('solar');
      const childIds = planet.facts.map(() => makeId('solar'));
      const x = originX + Math.cos(angle) * 370;
      const y = originY + Math.sin(angle) * 250;
      result[branchId] = {
        id: branchId,
        text: planet.name,
        x,
        y,
        parentId: rootId,
        children: childIds,
        collapsed: false,
        color: planet.color,
        attachmentPosition: direction < 0 ? 'left' : 'right',
        attachmentSize: 76,
        attachments: [makeImageAttachment(`${planet.name} · image spatiale`, planet.image)],
      };
      planet.facts.forEach((fact, childIndex) => {
        const childId = childIds[childIndex];
        result[childId] = {
          id: childId,
          text: fact,
          x: x + direction * 205,
          y: y + (childIndex === 0 ? -35 : 35),
          parentId: branchId,
          children: [],
          collapsed: false,
          color: planet.color,
        };
      });
      result[rootId].children.push(branchId);
    });

    return result;
  },
};

export const IllustratedEgyptTemplate: TemplatePlugin = {
  meta: {
    id: 'illustrated-ancient-egypt',
    name: 'L’Égypte ancienne',
    description: 'Une carte pour explorer les repères de l’Égypte ancienne.',
    type: 'template',
    version: '1.0.0',
    author: 'minder-team',
  },
  category: 'education',
  preview: ['Le Nil', 'Les pharaons', 'Les pyramides'],
  build: (opts) => makeNestedTree('L’Égypte ancienne', [
    {
      label: 'Le Nil',
      color: '#52719a',
      groups: [
        { label: 'Crues', items: ['Dépôts fertiles', 'Récoltes'] },
        { label: 'Aménagements', items: ['Canaux', 'Irrigation'] },
      ],
    },
    {
      label: 'Les pharaons',
      color: '#bd8428',
      groups: [
        { label: 'Le pouvoir', items: ['Politique', 'Religion'] },
        { label: 'Les dynasties', items: ['Ancien Empire', 'Nouvel Empire'] },
      ],
    },
    {
      label: 'Les pyramides',
      color: '#467b68',
      groups: [
        { label: 'Construction', items: ['Carrières', 'Ouvriers'] },
        { label: 'Fonction', items: ['Tombeaux', 'Monuments royaux'] },
      ],
    },
  ], opts),
};

export const RevolutionTemplate: TemplatePlugin = {
  meta: { id: 'revolution', name: 'Révolution / Rupture', description: 'Causes profondes, déclencheur, déroulement, bilan', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Causes', 'Déclencheur', 'Déroulement', 'Bilan'],
  build: (opts) => makeTree('Révolution industrielle', [
    { label: 'Causes',           color: '#9b59b6', items: ['Progrès techniques', 'Charbon et matières premières', 'Croissance des villes'] },
    { label: 'Déclencheur',      color: '#e74c3c', items: ['Machine à vapeur', 'Usines mécanisées', 'Réseau ferroviaire'], icon: '⚡' },
    { label: 'Transformations',  color: '#f5a623', items: ['Travail en usine', 'Production de masse', 'Exode rural'] },
    { label: 'Bilan',            color: '#22c55e', items: ['Nouveaux métiers', 'Conditions ouvrières', 'Société industrielle'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// CHIMIE
// ─────────────────────────────────────────────────────────────────────────────

export const PeriodicElementTemplate: TemplatePlugin = {
  meta: { id: 'periodic-element', name: 'Élément chimique', description: 'Propriétés, réactions, applications d\'un élément', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Propriétés', 'Réactions', 'Isotopes', 'Applications'],
  build: (opts) => makeTree('Carbone · C', [
    { label: 'Propriétés',  color: '#4f8ef7', items: ['Numéro atomique · 6', 'Non-métal', 'Présent dans le vivant'], icon: '⚛️' },
    { label: 'Composés',    color: '#e05c7b', items: ['Dioxyde de carbone', 'Méthane', 'Carbonates'], icon: '🔬' },
    { label: 'Formes',      color: '#9b59b6', items: ['Graphite', 'Diamant', 'Graphène'] },
    { label: 'Applications',color: '#4ec9a0', items: ['Acier', 'Énergie', 'Matériaux'] },
  ], opts),
};

export const ReactionTemplate: TemplatePlugin = {
  meta: { id: 'chemical-reaction', name: 'Réaction chimique', description: 'Réactifs, produits, conditions, mécanisme', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Réactifs', 'Produits', 'Conditions', 'Mécanisme'],
  build: (opts) => makeTree('Combustion du méthane', [
    { label: 'Réactifs',   color: '#e74c3c', items: ['Méthane · CH₄', 'Dioxygène · O₂', 'Étincelle'], icon: '🧪' },
    { label: 'Produits',   color: '#22c55e', items: ['Dioxyde de carbone · CO₂', 'Eau · H₂O'] },
    { label: 'Conditions', color: '#f5a623', items: ['Présence de dioxygène', 'Source d’activation', 'Combustion complète'] },
    { label: 'À vérifier', color: '#4f8ef7', items: ['Équilibrer l’équation', 'Conserver les atomes', 'Repérer l’énergie libérée'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// MUSIQUE
// ─────────────────────────────────────────────────────────────────────────────

export const SongAnalysisTemplate: TemplatePlugin = {
  meta: { id: 'song-analysis', name: 'Analyse musicale', description: 'Structure, harmonie, rythme, paroles, contexte', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'creative',
  preview: ['Structure', 'Harmonie', 'Rythme', 'Paroles'],
  build: (opts) => makeTree('Analyser un morceau pop', [
    { label: 'Structure',  color: '#4f8ef7', items: ['Intro', 'Couplet', 'Refrain', 'Pont', 'Outro'], icon: '🎼' },
    { label: 'Harmonie',   color: '#9b59b6', items: ['Tonalité', 'Progression d’accords', 'Changement de tonalité'] },
    { label: 'Rythme',     color: '#f5a623', items: ['Tempo', 'Mesure', 'Pulsation', 'Syncopes'] },
    { label: 'Paroles',    color: '#e05c7b', items: ['Sujet', 'Images marquantes', 'Émotion'] },
    { label: 'Contexte',   color: '#4ec9a0', items: ['Interprète', 'Époque', 'Style', 'Influences'] },
  ], opts),
};

export const CompositionTemplate: TemplatePlugin = {
  meta: { id: 'composition', name: 'Composition musicale', description: 'Brouillon d\'une composition — structure, instruments, thèmes', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'creative',
  preview: ['Thème principal', 'Instruments', 'Sections', 'Ambiance'],
  build: (opts) => makeTree('Composer une chanson', [
    { label: 'Thème principal', color: '#4f8ef7', items: ['Motif A', 'Motif B', 'Développement'], icon: '🎵' },
    { label: 'Instruments',     color: '#f5a623', items: ['Mélodie', 'Harmonie', 'Basse', 'Percussions'] },
    { label: 'Sections',        color: '#4ec9a0', items: ['Intro', 'Développement', 'Climax', 'Conclusion'] },
    { label: 'Ambiance',        color: '#e05c7b', items: ['Émotion cible', 'Tempo', 'Dynamique'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// SPORT
// ─────────────────────────────────────────────────────────────────────────────

export const TrainingPlanTemplate: TemplatePlugin = {
  meta: { id: 'training-plan', name: 'Plan d\'entraînement', description: 'Objectifs, semaines, séances, récupération', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'personal',
  preview: ['Objectif', 'Semaine 1', 'Semaine 2', 'Récupération'],
  build: (opts) => makeTree('Préparer un 10 km', [
    { label: 'Objectif',         color: '#4f8ef7', items: ['Courir 10 km', 'Date de la course', 'Allure visée'], icon: '🎯' },
    { label: 'Construire la base',color: '#22c55e', items: ['Footing facile', 'Technique de course', 'Sortie longue'] },
    { label: 'Gagner en rythme', color: '#f5a623', items: ['Fractionné court', 'Allure cible', 'Récupération entre séries'] },
    { label: 'Arriver prêt',     color: '#e05c7b', items: ['Alléger la dernière semaine', 'Préparer son équipement', 'Visualiser la course'] },
    { label: 'Récupération',     color: '#9b59b6', items: ['Sommeil', 'Nutrition', 'Étirements'] },
  ], opts),
};

export const MatchAnalysisTemplate: TemplatePlugin = {
  meta: { id: 'match-analysis', name: 'Analyse de match', description: 'Tactique, phases, performances, axes d\'amélioration', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'personal',
  preview: ['Tactique', 'Attaque', 'Défense', 'Individuel'],
  build: (opts) => makeTree('Analyser un match', [
    { label: 'Tactique',      color: '#4f8ef7', items: ['Système', 'Pressing', 'Transitions'], icon: '♟️' },
    { label: 'Attaque',       color: '#22c55e', items: ['Occasions', 'Finition', 'Combinaisons'] },
    { label: 'Défense',       color: '#e74c3c', items: ['Organisation', 'Duels', 'Coups de pied arrêtés'] },
    { label: 'Performances',  color: '#f5a623', items: ['Stats clés', 'Points forts', 'Points faibles'] },
    { label: 'Axes progrès',  color: '#9b59b6', items: ['Priorité 1', 'Priorité 2', 'Long terme'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANÈTES / ASTRONOMIE
// ─────────────────────────────────────────────────────────────────────────────

export const PlanetTemplate: TemplatePlugin = {
  meta: { id: 'planet', name: 'Fiche planète', description: 'Caractéristiques physiques, orbite, satellites, exploration', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Physique', 'Orbite', 'Atmosphère', 'Exploration'],
  build: (opts) => makeTree('Mars · planète rouge', [
    { label: 'Physique',     color: '#4f8ef7', items: ['Masse', 'Rayon', 'Densité', 'Gravité'], icon: '🌍' },
    { label: 'Orbite',       color: '#f5a623', items: ['Distance au Soleil', 'Période', 'Excentricité'] },
    { label: 'Atmosphère',   color: '#4ec9a0', items: ['Composition', 'Pression', 'Température'] },
    { label: 'Satellites',   color: '#9b59b6', items: ['Lunes', 'Anneaux', 'Caractéristiques'] },
    { label: 'Exploration',  color: '#e05c7b', items: ['Missions passées', 'Sondes actives', 'Projets futurs'] },
  ], opts),
};

export const SolarSystemTemplate: TemplatePlugin = {
  meta: { id: 'solar-system', name: 'Système solaire', description: 'Toutes les planètes et le Soleil', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Soleil', 'Planètes telluriques', 'Géantes', 'Ceintures'],
  build: (opts) => makeTree('Système solaire', [
    { label: 'Soleil',            color: '#f5a623', items: ['Couches', 'Cycle solaire', 'Vent solaire'], icon: '☀️' },
    { label: 'Planètes telluriques', color: '#e74c3c', items: ['Mercure', 'Vénus', 'Terre', 'Mars'] },
    { label: 'Ceinture d\'astéroïdes', color: '#8090b8', items: ['Cérès', 'Vesta', 'Pallas'] },
    { label: 'Géantes gazeuses',  color: '#4f8ef7', items: ['Jupiter', 'Saturne'] },
    { label: 'Géantes de glace',  color: '#4ec9a0', items: ['Uranus', 'Neptune'] },
    { label: 'Zone Trans-neptunienne', color: '#9b59b6', items: ['Pluton', 'Eris', 'Makémaké'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// LITTÉRATURE
// ─────────────────────────────────────────────────────────────────────────────

export const NovelAnalysisTemplate: TemplatePlugin = {
  meta: { id: 'novel-analysis', name: 'Analyse littéraire', description: 'Roman, nouvelle, poème — personnages, thèmes, structure', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Intrigue', 'Personnages', 'Thèmes', 'Style'],
  build: (opts) => makeTree('Analyser un roman', [
    { label: 'Intrigue',     color: '#4f8ef7', items: ['Schéma narratif', 'Péripéties', 'Dénouement'], icon: '📖' },
    { label: 'Personnages',  color: '#e05c7b', items: ['Héros', 'Antagoniste', 'Secondaires', 'Évolution'] },
    { label: 'Thèmes',       color: '#9b59b6', items: ['Thème central', 'Thèmes secondaires', 'Symboles'] },
    { label: 'Style',        color: '#f5a623', items: ['Registre', 'Figures de style', 'Point de vue', 'Temps'] },
    { label: 'Contexte',     color: '#4ec9a0', items: ['Auteur', 'Époque', 'Courant littéraire'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// BIOLOGIE
// ─────────────────────────────────────────────────────────────────────────────

export const CellTemplate: TemplatePlugin = {
  meta: { id: 'cell-biology', name: 'Biologie cellulaire', description: 'Structure de la cellule, organites, fonctions', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Membrane', 'Noyau', 'Organites', 'Métabolisme'],
  build: (opts) => makeTree('Cellule animale', [
    { label: 'Membrane',     color: '#4f8ef7', items: ['Structure', 'Perméabilité', 'Récepteurs'], icon: '🔬' },
    { label: 'Noyau',        color: '#9b59b6', items: ['ADN', 'ARN', 'Nucléole', 'Division'] },
    { label: 'Organites',    color: '#f5a623', items: ['Mitochondries', 'RE', 'Golgi', 'Lysosomes'] },
    { label: 'Cytosquelette',color: '#4ec9a0', items: ['Microtubules', 'Actine', 'Filaments intermédiaires'] },
    { label: 'Métabolisme',  color: '#22c55e', items: ['Glycolyse', 'Respiration', 'Synthèse protéique'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMMATION / TECH
// ─────────────────────────────────────────────────────────────────────────────

export const ApiDesignTemplate: TemplatePlugin = {
  meta: { id: 'api-design', name: 'Conception API REST', description: 'Endpoints, auth, modèles de données, erreurs', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'enterprise',
  preview: ['Endpoints', 'Auth', 'Modèles', 'Erreurs'],
  build: (opts) => makeTree('API de gestion des tâches', [
    { label: 'Endpoints',    color: '#4f8ef7', items: ['GET /tasks', 'POST /tasks', 'PATCH /tasks/{id}', 'DELETE /tasks/{id}'], icon: '🔌' },
    { label: 'Accès',        color: '#e05c7b', items: ['Connexion requise', 'Vérifier le propriétaire', 'Limiter les abus'] },
    { label: 'Modèles',      color: '#9b59b6', items: ['Task · titre, statut, échéance', 'User · créateur', 'Valider les champs'] },
    { label: 'Réponses',     color: '#4ec9a0', items: ['200 OK', '201 Created', '400 Bad Req', '401', '404', '500'] },
    { label: 'Infra',        color: '#f5a623', items: ['Cache', 'Pagination', 'Versioning', 'Docs'] },
  ], opts),
};

export const UserStoryTemplate: TemplatePlugin = {
  meta: { id: 'user-story', name: 'User Story / Feature', description: 'En tant que… / Je veux… / Afin de… + critères', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'enterprise',
  preview: ['Contexte', 'Besoin', 'Critères', 'Tests'],
  build: (opts) => makeTree('Ex. : recevoir un rappel', [
    { label: 'Contexte',           color: '#4f8ef7', items: ['Utilisateur occupé', 'Une échéance approche', 'Risque d’oubli'] },
    { label: 'Besoin',             color: '#e05c7b', items: ['Recevoir un rappel', 'Choisir le délai', 'Pouvoir le désactiver'] },
    { label: 'Critères d’acceptation', color: '#22c55e', items: ['Rappel envoyé au bon moment', 'Aucun rappel si tâche terminée', 'Préférences respectées'] },
    { label: 'Tests',              color: '#f5a623', items: ['Tests unitaires', 'Tests E2E', 'Performance'] },
    { label: 'Dépendances',        color: '#9b59b6', items: ['Autres stories', 'APIs', 'Design'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// GÉOGRAPHIE
// ─────────────────────────────────────────────────────────────────────────────

export const CountryTemplate: TemplatePlugin = {
  meta: { id: 'country', name: 'Fiche pays', description: 'Géographie, population, économie, culture, politique', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Géographie', 'Population', 'Économie', 'Culture'],
  build: (opts) => makeTree('France · fiche pays', [
    { label: 'Géographie',   color: '#4ec9a0', items: ['Europe de l’Ouest', 'Massif alpin et Pyrénées', 'Climat tempéré'], icon: '🗺️' },
    { label: 'Population',   color: '#4f8ef7', items: ['Répartition urbaine', 'Français', 'Langues régionales'] },
    { label: 'Économie',     color: '#f5a623', items: ['Services', 'Industrie', 'Agriculture et tourisme'] },
    { label: 'Institutions', color: '#e05c7b', items: ['République', 'Président et gouvernement', 'Parlement'] },
    { label: 'Culture',      color: '#9b59b6', items: ['Cuisine', 'Arts et patrimoine', 'Fêtes et sports'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// PHILOSOPHIE
// ─────────────────────────────────────────────────────────────────────────────

export const PhilosophyConceptTemplate: TemplatePlugin = {
  meta: { id: 'philosophy-concept', name: 'Concept philosophique', description: 'Définition, auteurs, thèses, critiques, exemples', type: 'template', version: '1.0.0', author: 'minder-team' },
  category: 'education',
  preview: ['Définition', 'Auteurs clés', 'Arguments', 'Critiques'],
  build: (opts) => makeTree('La liberté · concept', [
    { label: 'Définition',   color: '#4f8ef7', items: ['Sens courant', 'Sens philosophique', 'Étymologie'], icon: '💭' },
    { label: 'Auteurs clés', color: '#9b59b6', items: ['Auteur 1 → thèse', 'Auteur 2 → thèse', 'Contexte'] },
    { label: 'Arguments',    color: '#22c55e', items: ['Pour', 'Nuances', 'Exemples', 'Contre-exemples'] },
    { label: 'Critiques',    color: '#e05c7b', items: ['Objections', 'Réfutations', 'Limites'] },
    { label: 'Enjeux actuels', color: '#f5a623', items: ['Liens contemporains', 'Débats ouverts'] },
  ], opts),
};

// ─────────────────────────────────────────────────────────────────────────────
// All templates as an array (for registration)
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_LIBRARY_TEMPLATES: TemplatePlugin[] = [
  // Histoire
  TimelineTemplate,
  RevolutionTemplate,
  IllustratedLearningTemplate,
  IllustratedHistoryTemplate,
  IllustratedSolarSystemTemplate,
  IllustratedEgyptTemplate,
  // Chimie
  PeriodicElementTemplate,
  ReactionTemplate,
  // Musique
  SongAnalysisTemplate,
  CompositionTemplate,
  // Sport
  TrainingPlanTemplate,
  MatchAnalysisTemplate,
  // Astronomie
  PlanetTemplate,
  SolarSystemTemplate,
  // Littérature
  NovelAnalysisTemplate,
  // Biologie
  CellTemplate,
  // Tech
  ApiDesignTemplate,
  UserStoryTemplate,
  // Géographie
  CountryTemplate,
  // Philosophie
  PhilosophyConceptTemplate,
];
