import type { FreeEdge, MindNode, NodePriority, NodesMap } from '../types';

export type SearchField = 'titles' | 'notes' | 'tags' | 'connections' | 'attachments';
export type SearchFields = Record<SearchField, boolean>;
export type SearchPriorities = Record<NodePriority, boolean>;
export type SearchMatch =
  | { type: 'node'; id: string }
  | { type: 'connection'; id: string };

export interface SearchFilters {
  fields: SearchFields;
  includeTasks: boolean;
  includeNonTasks: boolean;
  includeCollapsed: boolean;
  includeExpanded: boolean;
  priorities: SearchPriorities;
}

function includesQuery(value: string | undefined, query: string): boolean {
  return value ? normalizeSearchText(value).includes(query) : false;
}

function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

export function collapsedAncestors(nodes: NodesMap, id: string): string[] {
  const ancestors: string[] = [];
  let parentId = nodes[id]?.parentId ?? null;
  while (parentId) {
    const parent = nodes[parentId];
    if (!parent) break;
    if (parent.collapsed) ancestors.push(parentId);
    parentId = parent.parentId;
  }
  return ancestors;
}

export function searchMatches(
  nodes: NodesMap,
  freeEdges: FreeEdge[],
  query: string,
  filters: SearchFilters,
): SearchMatch[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return [];

  const nodeMatches: SearchMatch[] = Object.values(nodes)
    .filter((node: MindNode) => {
      if (node.taskStatus ? !filters.includeTasks : !filters.includeNonTasks) return false;
      const priority = node.priority ?? 'none';
      if (!filters.priorities[priority]) return false;
      const isUnderCollapsedAncestor = collapsedAncestors(nodes, node.id).length > 0;
      if (isUnderCollapsedAncestor ? !filters.includeCollapsed : !filters.includeExpanded) return false;

      const { fields } = filters;
      return (fields.titles && includesQuery(node.text, normalizedQuery)) ||
        (fields.notes && includesQuery(node.notes, normalizedQuery)) ||
        (fields.tags && node.tags?.some(tag => includesQuery(tag, normalizedQuery)) === true) ||
        (fields.attachments && node.attachments?.some(attachment =>
          includesQuery(attachment.name, normalizedQuery) ||
          (attachment.type === 'link' || attachment.type === 'video' || attachment.type === 'equation') &&
            includesQuery(attachment.value, normalizedQuery),
        ) === true);
    })
    .map(node => ({ type: 'node', id: node.id }));
  const connectionMatches: SearchMatch[] = filters.fields.connections
    ? freeEdges
      .filter(edge => includesQuery(edge.label, normalizedQuery))
      .map(edge => ({ type: 'connection', id: edge.id }))
    : [];
  return [...nodeMatches, ...connectionMatches];
}
