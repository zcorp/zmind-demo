import type { MindNode, NodesMap } from '../types';

export interface OutlinerImport {
  title: string;
  nodes: NodesMap;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '\uFFFD')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\r/g, '&#13;')
    .replace(/\n/g, '&#10;')
    .replace(/\t/g, '&#9;');
}

function assertValidHierarchy(nodes: NodesMap): string[] {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte Outliner doit contenir exactement un nœud racine.');
  }
  const orderedIds: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en Outliner.');
    }
    visited.add(id);
    orderedIds.push(id);
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en Outliner.');
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

function renderNode(nodes: NodesMap, id: string): string {
  const node = nodes[id];
  const name = `<name><text data="${escapeXmlAttribute(node.text)}" parse-as="html"/></name>`;
  const note = node.notes?.trim()
    ? `<note><text data="${escapeXmlAttribute(node.notes)}" parse-as="markdown"/></note>`
    : '';
  const task = node.taskStatus ? ` task="${node.taskStatus}"` : '';
  const children = node.children.map(childId => renderNode(nodes, childId)).join('');
  return `<node expanded="${!node.collapsed}" hidenote="true"${task}>${name}${note}<nodes>${children}</nodes></node>`;
}

export function serializeOutliner(nodes: NodesMap): string {
  const orderedIds = assertValidHierarchy(nodes);
  const rootId = orderedIds.find(id => nodes[id].parentId === null)!;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<outliner condensed="false" show-tasks="false" show-depth="false" markdown="true" blank-rows="false" auto-sizing="false">',
    '<theme name="default"/>',
    `<nodes>${renderNode(nodes, rootId)}</nodes>`,
    '</outliner>',
  ].join('\n');
}

function directChildren(element: Element, localName: string): Element[] {
  return Array.from(element.children).filter(child => child.localName.toLowerCase() === localName);
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function parseOutliner(source: string): OutlinerImport {
  if (typeof DOMParser === 'undefined') {
    throw new Error('L’import Outliner nécessite un navigateur compatible.');
  }
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Le fichier Outliner contient un XML invalide.');
  }
  const root = document.documentElement;
  if (root.localName.toLowerCase() !== 'outliner') {
    throw new Error('Le fichier sélectionné n’est pas un document Outliner.');
  }
  const nodesElement = directChildren(root, 'nodes')[0];
  const rootElements = nodesElement ? directChildren(nodesElement, 'node') : [];
  if (rootElements.length === 0) {
    throw new Error('Le document Outliner ne contient aucun nœud à importer.');
  }

  const nodes: NodesMap = {};
  let nextId = 0;
  let row = 0;
  const importNode = (element: Element, parentId: string | null, depth: number): MindNode => {
    const nameElement = directChildren(element, 'name')[0];
    const textElement = nameElement && directChildren(nameElement, 'text')[0];
    const text = textElement?.getAttribute('data') ?? textElement?.textContent ?? '';
    if (!text.trim()) throw new Error('Un nœud Outliner ne contient pas de titre.');

    const noteElement = directChildren(element, 'note')[0];
    const noteText = noteElement && directChildren(noteElement, 'text')[0];
    const note = noteText?.getAttribute('data') ?? noteText?.textContent ?? undefined;
    const taskElement = directChildren(element, 'task')[0];
    const taskValue = element.getAttribute('task') ?? taskElement?.getAttribute('status');
    if (taskValue !== null && taskValue !== undefined &&
        taskValue !== 'open' && taskValue !== 'done' && taskValue !== 'doing') {
      throw new Error('Un nœud Outliner contient un état de tâche invalide.');
    }
    const taskStatus = taskValue === 'done' ? 'done' : taskValue ? 'open' : undefined;
    const expanded = element.getAttribute('expanded');
    const node: MindNode = {
      id: `outliner_${nextId++}`,
      text,
      x: 500 + depth * 220,
      y: 300 + row++ * 100,
      parentId,
      children: [],
      collapsed: expanded === 'false',
      ...(note ? { notes: note } : {}),
      ...(taskStatus ? { taskStatus } : {}),
    };
    defineNode(nodes, node);
    const nestedNodes = directChildren(element, 'nodes')[0];
    if (nestedNodes) {
      for (const childElement of directChildren(nestedNodes, 'node')) {
        const child = importNode(childElement, node.id, depth + 1);
        node.children.push(child.id);
      }
    }
    return node;
  };

  if (rootElements.length === 1) {
    importNode(rootElements[0], null, 0);
  } else {
    const syntheticRoot: MindNode = {
      id: `outliner_${nextId++}`,
      text: 'Carte importée',
      x: 500,
      y: 300,
      parentId: null,
      children: [],
      collapsed: false,
    };
    defineNode(nodes, syntheticRoot);
    for (const element of rootElements) {
      const child = importNode(element, syntheticRoot.id, 1);
      syntheticRoot.children.push(child.id);
    }
  }

  const mapRoot = Object.values(nodes).find(node => node.parentId === null)!;
  return { title: mapRoot.text, nodes };
}

export function downloadOutliner(nodes: NodesMap, title: string): void {
  const content = serializeOutliner(nodes);
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.outliner`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
