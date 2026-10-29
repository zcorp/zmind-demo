import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { FreeEdge, MindNode, NodePriority, NodesMap } from '../types';

interface XMindImport {
  title: string;
  nodes: NodesMap;
  freeEdges: FreeEdge[];
}

interface XMindTopic {
  id: string;
  class: 'topic';
  title: string;
  titleUnedited: boolean;
  structureClass?: string;
  notes?: { plain: { content: string } };
  markers?: Array<{ markerId: string }>;
  children?: { attached: XMindTopic[] } | XMindTopic[];
}

const XMIND_PRIORITY_TO_NODE_PRIORITY: Record<string, Exclude<NodePriority, 'none'>> = {
  'priority-1': 'critical',
  'priority-2': 'high',
  'priority-3': 'medium',
  'priority-4': 'low',
  'priority-5': 'low',
};

const NODE_PRIORITY_TO_XMIND_PRIORITY: Partial<Record<NodePriority, string>> = {
  low: 'priority-4',
  medium: 'priority-3',
  high: 'priority-2',
  critical: 'priority-1',
};

function assertValidHierarchy(nodes: NodesMap): string[] {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte XMind doit contenir exactement un nœud racine.');
  }

  const visited = new Set<string>();
  const orderedIds: string[] = [];
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

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function parseTopic(
  value: unknown,
  parentId: string | null,
  depth: number,
  row: { value: number },
  nodes: NodesMap,
  externalIds: Map<string, string>,
): MindNode {
  const topic = asObject(value);
  if (!topic || topic.class !== 'topic' || typeof topic.title !== 'string' || !topic.title.trim()) {
    throw new Error('Le fichier XMind contient un nœud sans titre valide.');
  }

  const externalId = typeof topic.id === 'string' && topic.id ? topic.id : `xmind_${row.value}`;
  if (externalIds.has(externalId)) {
    throw new Error(`L’identifiant XMind « ${externalId} » apparaît plusieurs fois.`);
  }
  const id = `xmind_${row.value++}`;
  externalIds.set(externalId, id);

  const noteObject = asObject(topic.notes);
  const plainNote = asObject(noteObject?.plain);
  const note = typeof plainNote?.content === 'string' ? plainNote.content : undefined;
  const markers = Array.isArray(topic.markers)
    ? topic.markers.map(asObject).filter((marker): marker is Record<string, unknown> => marker !== undefined)
    : [];
  const taskMarkerIds = markers
    .map(marker => marker.markerId)
    .filter((markerId): markerId is string => typeof markerId === 'string');
  const hasDoneTaskMarker = taskMarkerIds.includes('task-done');
  const hasOpenTaskMarker = taskMarkerIds.some(markerId =>
    ['task-start', 'task-oct', 'task-quarter', 'task-half', 'task-3quar'].includes(markerId),
  );
  const taskStatus = hasDoneTaskMarker ? 'done' : hasOpenTaskMarker ? 'open' : undefined;
  const priorityMarkerId = taskMarkerIds.find(markerId => markerId in XMIND_PRIORITY_TO_NODE_PRIORITY);
  const priority = priorityMarkerId ? XMIND_PRIORITY_TO_NODE_PRIORITY[priorityMarkerId] : undefined;
  const node: MindNode = {
    id,
    text: topic.title,
    x: 500 + depth * 220,
    y: 300 + row.value * 100,
    parentId,
    children: [],
    collapsed: false,
    ...(note ? { notes: note } : {}),
    ...(taskStatus ? { taskStatus } : {}),
    ...(priority ? { priority } : {}),
  };
  Object.defineProperty(nodes, id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });

  const childrenValue = topic.children;
  const childrenObject = asObject(childrenValue);
  const attached = Array.isArray(childrenValue)
    ? childrenValue
    : Array.isArray(childrenObject?.attached)
      ? childrenObject.attached
      : [];
  for (const child of attached) {
    const parsedChild = parseTopic(child, id, depth + 1, row, nodes, externalIds);
    node.children.push(parsedChild.id);
  }
  if (childrenValue !== undefined && !Array.isArray(childrenValue) && !Array.isArray(childrenObject?.attached)) {
    throw new Error('Le fichier XMind contient une liste d’enfants invalide.');
  }
  return node;
}

export function serializeXMind(
  nodes: NodesMap,
  title: string,
  freeEdges: FreeEdge[] = [],
): Uint8Array {
  const orderedIds = assertValidHierarchy(nodes);
  const externalIds = new Map(orderedIds.map((id, index) => [id, `minder-${index + 1}`]));
  for (const edge of freeEdges) {
    if (!externalIds.has(edge.from) || !externalIds.has(edge.to)) {
      throw new Error('Un lien entre nœuds référence un nœud absent de la carte.');
    }
  }

  const renderTopic = (id: string, isRoot = false): XMindTopic => {
    const node = nodes[id];
    const markers = [
      ...(node.taskStatus ? [{ markerId: node.taskStatus === 'done' ? 'task-done' : 'task-start' }] : []),
      ...(node.priority && NODE_PRIORITY_TO_XMIND_PRIORITY[node.priority]
        ? [{ markerId: NODE_PRIORITY_TO_XMIND_PRIORITY[node.priority]! }]
        : []),
    ];
    const topic: XMindTopic = {
      id: externalIds.get(id)!,
      class: 'topic',
      title: node.text,
      titleUnedited: false,
      ...(markers.length > 0 ? { markers } : {}),
      ...(isRoot ? { structureClass: 'org.xmind.ui.map.unbalanced' } : {}),
      ...(node.notes ? { notes: { plain: { content: node.notes } } } : {}),
    };
    if (node.children.length > 0) {
      topic.children = { attached: node.children.map(childId => renderTopic(childId)) };
    }
    return topic;
  };

  const rootId = orderedIds.find(id => nodes[id].parentId === null)!;
  const relationships = freeEdges.map((edge, index) => ({
    id: `minder-relationship-${index + 1}`,
    end1: externalIds.get(edge.from)!,
    end2: externalIds.get(edge.to)!,
    ...(edge.label ? { title: edge.label } : {}),
  }));
  const content = [{
    id: 'minder-sheet',
    class: 'sheet',
    title: title.trim() || 'Map',
    rootTopic: renderTopic(rootId, true),
    relationships,
  }];
  const metadata = { creator: { name: 'Minder.js', version: '0.1.0' } };
  const manifest = {
    'file-entries': {
      'content.json': {},
      'metadata.json': {},
    },
  };

  return zipSync({
    'content.json': strToU8(JSON.stringify(content, null, 2)),
    'metadata.json': strToU8(JSON.stringify(metadata, null, 2)),
    'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
  });
}

export function parseXMind(source: Uint8Array | ArrayBuffer): XMindImport {
  const archive = unzipSync(source instanceof Uint8Array ? source : new Uint8Array(source));
  const contentPath = Object.keys(archive).find(path => path === 'content.json' || path.endsWith('/content.json'));
  if (!contentPath) {
    throw new Error('Le fichier XMind ne contient pas de contenu JSON compatible.');
  }

  let content: unknown;
  try {
    content = JSON.parse(strFromU8(archive[contentPath]));
  } catch {
    throw new Error('Le contenu JSON du fichier XMind est invalide.');
  }
  if (!Array.isArray(content)) {
    throw new Error('Le fichier XMind ne contient aucune feuille compatible.');
  }
  const sheet = content.find(value => asObject(value)?.class === 'sheet');
  const sheetObject = asObject(sheet);
  const rootTopic = asObject(sheetObject?.rootTopic);
  if (!rootTopic) {
    throw new Error('Le fichier XMind ne contient pas de sujet racine compatible.');
  }

  const nodes: NodesMap = {};
  const externalIds = new Map<string, string>();
  const root = parseTopic(rootTopic, null, 0, { value: 0 }, nodes, externalIds);
  const freeEdges: FreeEdge[] = [];
  const relationships = sheetObject?.relationships;
  if (relationships !== undefined && !Array.isArray(relationships)) {
    throw new Error('Le fichier XMind contient des relations invalides.');
  }
  for (const [index, value] of (relationships as unknown[] | undefined ?? []).entries()) {
    const relationship = asObject(value);
    if (!relationship || typeof relationship.end1 !== 'string' || typeof relationship.end2 !== 'string') {
      throw new Error('Le fichier XMind contient une relation invalide.');
    }
    const from = externalIds.get(relationship.end1);
    const to = externalIds.get(relationship.end2);
    if (!from || !to) {
      throw new Error('Une relation XMind référence un sujet absent de la carte.');
    }
    freeEdges.push({
      id: typeof relationship.id === 'string' ? relationship.id : `xmind-edge-${index}`,
      from,
      to,
      ...(typeof relationship.title === 'string' ? { label: relationship.title } : {}),
    });
  }

  return {
    title: typeof sheetObject?.title === 'string' ? sheetObject.title : root.text,
    nodes,
    freeEdges,
  };
}

export function downloadXMind(nodes: NodesMap, title: string, freeEdges: FreeEdge[] = []): void {
  const content = serializeXMind(nodes, title, freeEdges);
  const blobBuffer = new ArrayBuffer(content.byteLength);
  new Uint8Array(blobBuffer).set(content);
  const blob = new Blob([blobBuffer], { type: 'application/vnd.xmind.workbook' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.xmind`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
