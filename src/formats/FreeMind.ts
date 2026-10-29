import type { FreeEdge, MindNode, NodeIcon, NodesMap } from '../types';

export interface FreeMindImport {
  title: string;
  nodes: NodesMap;
  freeEdges: FreeEdge[];
}

interface PendingLink {
  sourceId: string;
  destinationId: string;
  label?: string;
  color?: string;
}

const FREE_MIND_ICONS: Partial<Record<NodeIcon, string>> = {
  star: 'full-1',
  check: 'button_ok',
  warning: 'messagebox_warning',
  info: 'messagebox_info',
  idea: 'idea',
  question: 'help',
  flag: 'flag',
  clock: 'clock',
  mail: 'Mail',
};

const MINDER_ICONS = new Map(
  Object.entries(FREE_MIND_ICONS).map(([icon, builtin]) => [builtin, icon as NodeIcon]),
);

function escapeXml(value: string): string {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '\uFFFD')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeFreeMind(nodes: NodesMap, freeEdges: FreeEdge[] = []): string {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte FreeMind doit contenir exactement un nœud racine.');
  }

  const visited = new Set<string>();
  const externalIds = new Map<string, string>();
  const collectIds = (id: string): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée.');
    }
    visited.add(id);
    externalIds.set(id, `minder_${externalIds.size}`);
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée.');
      }
      collectIds(childId);
    }
  };
  collectIds(roots[0][0]);
  if (visited.size !== entries.length) {
    throw new Error('La carte contient des nœuds inaccessibles depuis sa racine.');
  }

  for (const edge of freeEdges) {
    if (!externalIds.has(edge.from) || !externalIds.has(edge.to)) {
      throw new Error('Un lien entre nœuds référence un nœud absent de la carte.');
    }
  }

  const escapedColor = (color: string | undefined): string | undefined =>
    color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color) ? color : undefined;

  const renderNode = (id: string): string => {
    const node = nodes[id];
    const attributes = [
      `ID="${externalIds.get(id)}"`,
      `TEXT="${escapeXml(node.text)}"`,
      `FOLDED="${node.collapsed}"`,
    ];
    if (node.taskStatus) attributes.push(`TASK="${node.taskStatus}"`);
    const color = escapedColor(node.color);
    if (color) attributes.push(`COLOR="${color}"`);
    const externalLink = node.attachments?.find(attachment => attachment.type === 'link')?.value;
    if (externalLink && !externalLink.startsWith('#')) {
      attributes.push(`LINK="${escapeXml(externalLink)}"`);
    }
    const builtinIcon = node.icon ? FREE_MIND_ICONS[node.icon] : undefined;
    const iconContent = builtinIcon ? `<icon BUILTIN="${builtinIcon}" />` : '';
    const note = node.notes?.trim();
    const noteContent = note
      ? `<richcontent TYPE="NOTE"><html><head/><body>${note.split(/\r?\n/).map(line => `<p>${escapeXml(line)}</p>`).join('')}</body></html></richcontent>`
      : '';
    const children = node.children.map(childId => {
      return renderNode(childId);
    });
    const arrows = freeEdges
      .filter(edge => edge.from === id)
      .map(edge => {
        const arrowAttributes = [
          `DESTINATION="${externalIds.get(edge.to)}"`,
          'STARTARROW="None"',
          'ENDARROW="Default"',
        ];
        const edgeColor = escapedColor(edge.color);
        if (edgeColor) arrowAttributes.push(`COLOR="${edgeColor}"`);
        if (edge.label) arrowAttributes.push(`TEXT="${escapeXml(edge.label)}"`);
        return `<arrowlink ${arrowAttributes.join(' ')} />`;
      });
    const extraContent = [iconContent, noteContent, ...arrows].filter(Boolean).join('');

    return children.length > 0
      ? `<node ${attributes.join(' ')}>${extraContent}\n${children.map(child => `      ${child}`).join('\n')}\n    </node>`
      : `<node ${attributes.join(' ')}>${extraContent}</node>`;
  };

  const outline = renderNode(roots[0][0]);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<map version="1.0.1">',
    `  ${outline}`,
    '</map>',
  ].join('\n');
}

function elementChildren(element: Element): Element[] {
  return Array.from(element.children);
}

function directChild(element: Element, name: string): Element | undefined {
  return elementChildren(element).find(child => child.localName.toLowerCase() === name);
}

function richText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const name = element.localName.toLowerCase();
  if (name === 'br') return '\n';
  const text = Array.from(node.childNodes).map(richText).join('');
  return ['p', 'div', 'li'].includes(name) ? `\n${text}\n` : text;
}

function getRichContent(node: Element, type: 'NODE' | 'NOTE'): string | undefined {
  const richContent = elementChildren(node).find(element =>
    element.localName.toLowerCase() === 'richcontent' &&
    (element.getAttribute('TYPE') ?? 'NOTE').toUpperCase() === type
  );
  const html = richContent && directChild(richContent, 'html');
  const body = html && directChild(html, 'body');
  const content = (body ?? html)?.childNodes
    ? Array.from((body ?? html)!.childNodes).map(richText).join('').replace(/\n+/g, '\n').trim()
    : '';
  return content || undefined;
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function parseFreeMind(source: string): FreeMindImport {
  if (typeof DOMParser === 'undefined') {
    throw new Error('L’import FreeMind/Freeplane nécessite un navigateur compatible.');
  }

  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Le fichier FreeMind/Freeplane contient un XML invalide.');
  }

  const root = document.documentElement;
  if (root.localName.toLowerCase() !== 'map') {
    throw new Error('Le fichier sélectionné n’est pas une carte FreeMind ou Freeplane.');
  }

  const rootElements = elementChildren(root).filter(element => element.localName.toLowerCase() === 'node');
  if (rootElements.length === 0) {
    throw new Error('La carte FreeMind/Freeplane ne contient aucun nœud.');
  }

  const nodes: NodesMap = {};
  const externalIdToNodeId = new Map<string, string>();
  const pendingLinks: PendingLink[] = [];
  const pendingNodeLinks: PendingLink[] = [];
  let nextEdgeId = 0;
  let nextId = 0;
  let row = 0;
  const makeNode = (element: Element, parentId: string | null, depth: number): MindNode => {
    const text = element.getAttribute('TEXT') ?? getRichContent(element, 'NODE');
    if (text === undefined) {
      throw new Error('Un nœud FreeMind/Freeplane ne contient aucun titre.');
    }
    const id = `mm_${nextId++}`;
    const collapsed = (element.getAttribute('FOLDED') ?? '').toLowerCase() === 'true';
    const taskStatus = element.getAttribute('TASK');
    if (taskStatus !== null && taskStatus !== 'open' && taskStatus !== 'done') {
      throw new Error('Un nœud FreeMind/Freeplane contient un état de tâche invalide.');
    }
    const notes = getRichContent(element, 'NOTE');
    const externalId = element.getAttribute('ID');
    if (externalId) {
      if (externalIdToNodeId.has(externalId)) {
        throw new Error(`L’identifiant FreeMind « ${externalId} » apparaît plusieurs fois.`);
      }
      externalIdToNodeId.set(externalId, id);
    }
    const color = element.getAttribute('COLOR');
    const link = element.getAttribute('LINK');
    const builtinIcon = elementChildren(element)
      .find(child => child.localName.toLowerCase() === 'icon')
      ?.getAttribute('BUILTIN');
    const icon = builtinIcon ? MINDER_ICONS.get(builtinIcon) : undefined;
    const node: MindNode = {
      id,
      text,
      x: 500 + depth * 220,
      y: 300 + row++ * 100,
      parentId,
      children: [],
      collapsed,
      ...(taskStatus ? { taskStatus } : {}),
      ...(icon ? { icon } : {}),
      ...(color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color) ? { color } : {}),
      ...(notes ? { notes } : {}),
      ...(link && !link.startsWith('#') ? {
        attachments: [{
          id: `mm_link_${id}`,
          type: 'link' as const,
          name: link,
          value: link,
        }],
      } : {}),
    };
    defineNode(nodes, node);
    if (link?.startsWith('#')) pendingNodeLinks.push({ sourceId: id, destinationId: link.slice(1) });
    for (const arrow of elementChildren(element).filter(child => child.localName.toLowerCase() === 'arrowlink')) {
      const destinationId = arrow.getAttribute('DESTINATION');
      if (destinationId) {
        pendingLinks.push({
          sourceId: id,
          destinationId,
          label: arrow.getAttribute('TEXT') ?? undefined,
          color: arrow.getAttribute('COLOR') ?? undefined,
        });
      }
    }
    return node;
  };

  const importChildren = (element: Element, node: MindNode, depth: number): void => {
    for (const child of elementChildren(element)) {
      if (child.localName.toLowerCase() !== 'node') continue;
      const importedChild = makeNode(child, node.id, depth);
      node.children.push(importedChild.id);
      importChildren(child, importedChild, depth + 1);
    }
  };

  if (rootElements.length === 1) {
    const importedRoot = makeNode(rootElements[0], null, 0);
    importChildren(rootElements[0], importedRoot, 1);
  } else {
    const importedRoot: MindNode = {
      id: `mm_${nextId++}`,
      text: 'Carte importée',
      x: 500,
      y: 300,
      parentId: null,
      children: [],
      collapsed: false,
    };
    defineNode(nodes, importedRoot);
    for (const element of rootElements) {
      const child = makeNode(element, importedRoot.id, 1);
      importedRoot.children.push(child.id);
      importChildren(element, child, 2);
    }
  }

  const mapRoot = Object.values(nodes).find(node => node.parentId === null)!;
  const freeEdges: FreeEdge[] = [];
  for (const link of [...pendingLinks, ...pendingNodeLinks]) {
    const from = link.sourceId;
    const to = externalIdToNodeId.get(link.destinationId);
    if (!to) continue;
    freeEdges.push({
      id: `mm_edge_${nextEdgeId++}`,
      from,
      to,
      ...(link.label ? { label: link.label } : {}),
      ...(typeof link.color === 'string' && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(link.color)
        ? { color: link.color }
        : {}),
    });
  }
  return { title: mapRoot.text, nodes, freeEdges };
}

export function downloadFreeMind(nodes: NodesMap, title: string, freeEdges: FreeEdge[] = []): void {
  const content = serializeFreeMind(nodes, freeEdges);
  const blob = new Blob([content], { type: 'application/x-freemind;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.mm`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
