import type { MindNode, NodePriority, NodesMap } from '../types';

export interface OPMLImport {
  title: string;
  nodes: NodesMap;
}

function escapeXml(value: string): string {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '\uFFFD')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeOPML(nodes: NodesMap, title: string): string {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte OPML doit contenir exactement un nœud racine.');
  }

  const visited = new Set<string>();
  const renderNode = (id: string): string => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en OPML.');
    }
    visited.add(id);

    const attributes = [`text="${escapeXml(node.text)}"`];
    if (node.notes?.trim()) attributes.push(`note="${escapeXml(node.notes)}"`);
    if (node.taskStatus) attributes.push(`task="${node.taskStatus}"`);
    if (node.tags?.length) attributes.push(`minder-tags="${escapeXml(JSON.stringify(node.tags))}"`);
    if (node.priority && node.priority !== 'none') {
      attributes.push(`minder-priority="${node.priority}"`);
    }
    const children = node.children.map(childId => {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en OPML.');
      }
      return renderNode(childId);
    });

    return children.length > 0
      ? `<outline ${attributes.join(' ')}>\n${children.map(child => `      ${child}`).join('\n')}\n    </outline>`
      : `<outline ${attributes.join(' ')} />`;
  };

  const root = roots[0][0];
  const outline = renderNode(root);
  if (visited.size !== entries.length) {
    throw new Error('La carte contient des nœuds inaccessibles depuis sa racine.');
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>${escapeXml(title)}</title>`,
    '  </head>',
    '  <body>',
    `    ${outline}`,
    '  </body>',
    '</opml>',
  ].join('\n');
}

function elementChildren(element: Element): Element[] {
  return Array.from(element.children);
}

function directChild(element: Element, name: string): Element | undefined {
  return elementChildren(element).find(child => child.localName.toLowerCase() === name);
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function parseOPML(source: string): OPMLImport {
  if (typeof DOMParser === 'undefined') {
    throw new Error('L’import OPML nécessite un navigateur compatible.');
  }

  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Le fichier OPML contient un XML invalide.');
  }

  const root = document.documentElement;
  if (root.localName.toLowerCase() !== 'opml') {
    throw new Error('Le fichier sélectionné n’est pas un document OPML.');
  }

  const body = directChild(root, 'body');
  if (!body) throw new Error('Le document OPML ne contient pas de section body.');

  const head = directChild(root, 'head');
  const title = (head ? directChild(head, 'title')?.textContent : undefined)?.trim();
  const outlines = elementChildren(body).filter(element => element.localName.toLowerCase() === 'outline');
  if (outlines.length === 0) {
    throw new Error('Le document OPML ne contient aucun nœud à importer.');
  }

  const nodes: NodesMap = {};
  let nextId = 0;
  let nextPosition = 0;
  const makeNode = (
    text: string,
    parentId: string | null,
    depth: number,
    notes?: string,
    taskStatus?: string | null,
    tagsValue?: string | null,
    priorityValue?: string | null,
  ): MindNode => {
    if (taskStatus !== undefined && taskStatus !== null && taskStatus !== 'open' && taskStatus !== 'done') {
      throw new Error('Un nœud OPML contient un état de tâche invalide.');
    }
    let tags: string[] | undefined;
    if (tagsValue) {
      let parsedTags: unknown;
      try {
        parsedTags = JSON.parse(tagsValue);
      } catch {
        throw new Error('L’attribut minder-tags OPML contient un JSON invalide.');
      }
      if (!Array.isArray(parsedTags) || !parsedTags.every(tag => typeof tag === 'string')) {
        throw new Error('L’attribut minder-tags OPML doit contenir une liste de tags textuels.');
      }
      tags = parsedTags;
    }
    let priority: NodePriority | undefined;
    switch (priorityValue) {
      case null:
      case undefined:
        break;
      case 'none':
      case 'low':
      case 'medium':
      case 'high':
      case 'critical':
        priority = priorityValue;
        break;
      default:
        throw new Error('Un nœud OPML contient une priorité invalide.');
    }
    return {
      id: `opml_${nextId++}`,
      text,
      x: 500 + depth * 220,
      y: 300 + nextPosition++ * 100,
      parentId,
      children: [],
      collapsed: false,
      ...(notes ? { notes } : {}),
      ...(taskStatus ? { taskStatus } : {}),
      ...(tags?.length ? { tags } : {}),
      ...(priority ? { priority } : {}),
    };
  };

  const importOutline = (outline: Element, parentId: string, depth: number): void => {
    const text = outline.getAttribute('text');
    if (text === null) {
      throw new Error('Un nœud OPML ne contient pas l’attribut text obligatoire.');
    }
    const node = makeNode(
      text,
      parentId,
      depth,
      outline.getAttribute('note') ?? undefined,
      outline.getAttribute('task'),
      outline.getAttribute('minder-tags'),
      outline.getAttribute('minder-priority'),
    );
    defineNode(nodes, node);
    nodes[parentId].children.push(node.id);

    for (const child of elementChildren(outline)) {
      if (child.localName.toLowerCase() === 'outline') {
        importOutline(child, node.id, depth + 1);
      }
    }
  };

  if (outlines.length === 1) {
    const rootNode = outlines[0];
    const text = rootNode.getAttribute('text');
    if (text === null) {
      throw new Error('Le nœud racine OPML ne contient pas l’attribut text obligatoire.');
    }
    const node = makeNode(
      text,
      null,
      0,
      rootNode.getAttribute('note') ?? undefined,
      rootNode.getAttribute('task'),
      rootNode.getAttribute('minder-tags'),
      rootNode.getAttribute('minder-priority'),
    );
    defineNode(nodes, node);
    for (const child of elementChildren(rootNode)) {
      if (child.localName.toLowerCase() === 'outline') {
        importOutline(child, node.id, 1);
      }
    }
  } else {
    const rootNode = makeNode(title || 'Carte importée', null, 0);
    defineNode(nodes, rootNode);
    for (const outline of outlines) importOutline(outline, rootNode.id, 1);
  }

  return { title: title || 'Carte importée', nodes };
}

export function downloadOPML(nodes: NodesMap, title: string): void {
  const content = serializeOPML(nodes, title);
  const blob = new Blob([content], { type: 'text/x-opml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.opml`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
