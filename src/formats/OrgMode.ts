import type { MindNode, NodesMap } from '../types';

const ORG_PRIORITY_TO_NODE_PRIORITY: Record<string, NonNullable<MindNode['priority']>> = {
  A: 'critical',
  B: 'high',
  C: 'medium',
  D: 'low',
};

export interface OrgModeImport {
  title: string;
  nodes: NodesMap;
}

function assertValidHierarchy(nodes: NodesMap): string[] {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte Org-mode doit contenir exactement un nœud racine.');
  }

  const orderedIds: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée.');
    }
    visited.add(id);
    orderedIds.push(id);
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée.');
      }
      visit(childId);
    }
  };
  visit(roots[0][0]);
  if (visited.size !== entries.length) {
    throw new Error('La carte contient des nœuds inaccessibles depuis sa racine.');
  }
  return orderedIds;
}

function escapeHeading(text: string): string {
  return text.replace(/^(\*+\s|\[#([^\]]+)\]\s)/, '\\$1');
}

function splitOrgTags(text: string): { text: string; tags?: string[] } {
  const match = text.match(/^(.*?)\s+:([A-Za-z0-9_@#%]+(?::[A-Za-z0-9_@#%]+)*:)$/);
  if (!match || !match[1]) return { text };
  return { text: match[1], tags: match[2].slice(0, -1).split(':') };
}

function getOrgPriority(priority: MindNode['priority']): string | undefined {
  switch (priority) {
    case 'critical': return 'A';
    case 'high': return 'B';
    case 'medium': return 'C';
    case 'low': return 'D';
    default: return undefined;
  }
}

function isOrgTag(tag: string): boolean {
  return /^[A-Za-z0-9_@#%]+$/.test(tag);
}

function renderNode(nodes: NodesMap, id: string, depth: number): string {
  const node = nodes[id];
  if (/[\r\n]/.test(node.text)) {
    throw new Error('Org-mode ne permet pas de conserver les retours à la ligne dans un titre de nœud.');
  }

  const tags = node.tags ?? [];
  const hasNonOrgTags = tags.some(tag => !isOrgTag(tag));
  const taskKeyword = node.taskStatus === 'open' ? 'TODO ' : node.taskStatus === 'done' ? 'DONE ' : '';
  const priorityLetter = getOrgPriority(node.priority);
  const priorityCookie = priorityLetter ? `[#${priorityLetter}] ` : '';
  const headingTags = !hasNonOrgTags && tags.length > 0 ? ` :${tags.join(':')}:` : '';
  const heading = `${'*'.repeat(depth + 1)} ${taskKeyword}${priorityCookie}${escapeHeading(node.text)}${headingTags}`;
  const lines = [heading];
  if (hasNonOrgTags) {
    lines.push(':PROPERTIES:', `:MINDER_TAGS: ${JSON.stringify(tags)}`, ':END:');
  }
  if (node.notes?.trim()) {
    lines.push(':NOTES:', ...node.notes.trim().split(/\r?\n/).map(line =>
      line === ':END:' ? '\\:END:' : line
    ), ':END:');
  }
  for (const childId of node.children) {
    lines.push('', renderNode(nodes, childId, depth + 1));
  }
  return lines.join('\n');
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function parseOrgMode(source: string): OrgModeImport {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const titleLine = lines.find(line => /^\s*#\+TITLE\s*:/i.test(line));
  const documentTitle = titleLine?.replace(/^\s*#\+TITLE\s*:/i, '').trim();
  const hasNestedHeadings = lines.some(line => /^\*{2,}\s+/.test(line));
  const nodes: NodesMap = {};
  const stack: MindNode[] = [];
  let nodeIndex = 0;
  let row = 0;
  let currentNode: MindNode | undefined;
  let inNotes = false;
  let inIgnoredDrawer = false;
  let notesLines: string[] = [];
  let propertiesNode: MindNode | undefined;

  const addNode = (rawText: string, depth: number): MindNode => {
    if (depth > stack.length) {
      throw new Error('La hiérarchie Org-mode comporte un niveau parent manquant.');
    }
    stack.length = depth;
    const parent = depth > 0 ? stack[depth - 1] : null;
    const { text: headingText, tags } = splitOrgTags(rawText);
    const taskMatch = headingText.match(/^(TODO|DONE)\s+(.+)$/);
    const headingContent = taskMatch ? taskMatch[2] : headingText;
    const escapedPriority = headingContent.match(/^\\(\[#([^\]]+)\]\s+.*)$/);
    const priorityMatch = escapedPriority ? undefined : headingContent.match(/^\[#([^\]]+)\]\s+(.+)$/);
    const priority = priorityMatch ? ORG_PRIORITY_TO_NODE_PRIORITY[priorityMatch[1]] : undefined;
    if (priorityMatch && !priority) {
      throw new Error(`La priorité Org-mode ${priorityMatch[1]} n’est pas prise en charge.`);
    }
    const text = escapedPriority ? escapedPriority[1] : priorityMatch ? priorityMatch[2] : headingContent;
    const id = `org_${nodeIndex++}`;
    const node: MindNode = {
      id,
      text: text.replace(/^\\(?=\*+\s)/, ''),
      x: 500 + depth * 220,
      y: 300 + row++ * 100,
      parentId: parent?.id ?? null,
      children: [],
      collapsed: false,
      taskStatus: taskMatch ? (taskMatch[1] === 'DONE' ? 'done' : 'open') : undefined,
      ...(priority ? { priority } : {}),
      ...(tags ? { tags } : {}),
    };
    defineNode(nodes, node);
    if (parent) parent.children.push(id);
    stack.push(node);
    currentNode = node;
    return node;
  };

  const saveNotes = (): void => {
    if (currentNode && notesLines.length > 0) {
      currentNode.notes = notesLines.join('\n').replace(/\\:END:/g, ':END:').trimEnd();
    }
    notesLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (inIgnoredDrawer) {
      if (propertiesNode) {
        const tagsProperty = line.match(/^\s*:MINDER_TAGS:\s*(.*?)\s*$/);
        if (tagsProperty) {
          let tags: unknown;
          try {
            tags = JSON.parse(tagsProperty[1]);
          } catch {
            throw new Error('La propriété Minder_TAGS du fichier Org-mode contient un JSON invalide.');
          }
          if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string')) {
            throw new Error('La propriété Minder_TAGS doit contenir une liste de tags textuels.');
          }
          propertiesNode.tags = tags;
        }
      }
      if (trimmed === ':END:') inIgnoredDrawer = false;
      continue;
    }
    if (inNotes) {
      if (trimmed === ':END:') {
        saveNotes();
        inNotes = false;
      } else {
        notesLines.push(line.replace(/^\s+/, ''));
      }
      continue;
    }
    if (/^\s*#\+/.test(line)) continue;
    if (trimmed === ':NOTES:') {
      if (!currentNode) throw new Error('Un bloc de notes Org-mode apparaît avant tout nœud.');
      inNotes = true;
      continue;
    }
    if (trimmed === ':PROPERTIES:' || trimmed === ':LOGBOOK:') {
      inIgnoredDrawer = true;
      propertiesNode = trimmed === ':PROPERTIES:' ? currentNode : undefined;
      continue;
    }

    const heading = line.match(/^(\*+)\s+(.+?)\s*$/);
    if (heading) {
      if (!hasNestedHeadings) {
        const depth = stack.length === 0 ? 0 : 0;
        addNode(heading[2], depth);
      } else {
        addNode(heading[2], heading[1].length - 1);
      }
      continue;
    }

    if (!trimmed) continue;
    if (!currentNode) continue;

    if (!hasNestedHeadings && /^\s+/.test(line)) {
      const indentation = line.match(/^[ \t]*/)?.[0].replace(/\t/g, '  ').length ?? 0;
      const depth = Math.max(1, Math.floor(indentation / 2));
      addNode(trimmed, depth);
      continue;
    }

    currentNode.notes = currentNode.notes ? `${currentNode.notes}\n${trimmed}` : trimmed;
  }

  if (inNotes) throw new Error('Le fichier Org-mode contient un bloc NOTES non terminé.');
  if (Object.keys(nodes).length === 0) {
    throw new Error('Le fichier Org-mode ne contient aucun titre à importer.');
  }

  const roots = Object.values(nodes).filter(node => node.parentId === null);
  if (roots.length > 1) {
    const syntheticRoot: MindNode = {
      id: `org_${nodeIndex}`,
      text: 'Carte importée',
      x: 500,
      y: 300,
      parentId: null,
      children: roots.map(root => root.id),
      collapsed: false,
    };
    defineNode(nodes, syntheticRoot);
    roots.forEach((root, index) => {
      root.parentId = syntheticRoot.id;
      root.x = 720;
      root.y = 400 + index * 100;
    });
    return { title: documentTitle || syntheticRoot.text, nodes };
  }

  return { title: documentTitle || roots[0].text, nodes };
}

export function serializeOrgMode(nodes: NodesMap, title: string): string {
  const orderedIds = assertValidHierarchy(nodes);
  const rootId = orderedIds.find(id => nodes[id].parentId === null)!;
  const safeTitle = title.replace(/[\r\n]+/g, ' ').trim();
  const headers = [
    ...(safeTitle ? [`#+TITLE: ${safeTitle}`] : []),
    ...(orderedIds.some(id => nodes[id].priority === 'low') ? ['#+PRIORITIES: A B C D'] : []),
  ];
  return `${headers.length ? `${headers.join('\n')}\n\n` : ''}${renderNode(nodes, rootId, 0)}\n`;
}

export function downloadOrgMode(nodes: NodesMap, title: string): void {
  const content = serializeOrgMode(nodes, title);
  const blob = new Blob([content], { type: 'text/org;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.org`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
