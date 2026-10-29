import { NodesMap } from '../types';

export interface LearningStep {
  id: string;
  title: string;
}

const LEGACY_GUIDED_TEMPLATES = new Set([
  'angular-learning-path',
  'hexagonal-architecture-project',
]);

export function getLearningSteps(
  nodes: NodesMap,
  configuredStepIds?: string[],
  legacyTemplateId?: string,
): LearningStep[] {
  const root = Object.values(nodes).find(node => node.parentId === null);
  if (!root) return [];

  if (configuredStepIds !== undefined) {
    return configuredStepIds
      .filter((id, index) => configuredStepIds.indexOf(id) === index)
      .map(id => nodes[id])
      .filter(node => node?.parentId === root.id)
      .map(node => ({ id: node.id, title: node.text.replace(/^Étape \d+ · /, '') }));
  }

  if (!LEGACY_GUIDED_TEMPLATES.has(legacyTemplateId ?? '')) return [];
  return root.children
    .map(id => nodes[id])
    .filter(node => node && /^Étape \d+ · /.test(node.text))
    .map(node => ({ id: node.id, title: node.text.replace(/^Étape \d+ · /, '') }));
}
