import type { FreeEdge, MindNode, NodePriority, NodesMap, TaskStatus } from '../types';

export interface YEdImport {
  title: string;
  nodes: NodesMap;
  freeEdges: FreeEdge[];
}

interface GraphNode {
  externalId: string;
  text: string;
  notes?: string;
  taskStatus?: TaskStatus;
  priority?: NodePriority;
  color?: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  externalId: string;
  source: string;
  target: string;
  label?: string;
  color?: string;
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

function assertValidHierarchy(nodes: NodesMap): string[] {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte GraphML doit contenir exactement un nœud racine.');
  }
  const orderedIds: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en GraphML.');
    }
    visited.add(id);
    orderedIds.push(id);
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en GraphML.');
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

export function serializeYEd(nodes: NodesMap, title: string, freeEdges: FreeEdge[] = []): string {
  const orderedIds = assertValidHierarchy(nodes);
  const externalIds = new Map(orderedIds.map((id, index) => [id, `n${index}`]));
  for (const edge of freeEdges) {
    if (!externalIds.has(edge.from) || !externalIds.has(edge.to)) {
      throw new Error('Un lien entre nœuds référence un nœud absent de la carte.');
    }
  }

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:y="http://www.yworks.com/xml/graphml">',
    '  <key id="graphTitle" for="graph" attr.name="title" attr.type="string"/>',
    '  <key id="description" for="node" attr.name="description" attr.type="string"/>',
    '  <key id="taskStatus" for="node" attr.name="taskStatus" attr.type="string"/>',
    '  <key id="priority" for="node" attr.name="priority" attr.type="string"/>',
    '  <key id="nodegraphics" for="node" yfiles.type="nodegraphics"/>',
    '  <key id="edgeLabel" for="edge" attr.name="description" attr.type="string"/>',
    '  <key id="edgegraphics" for="edge" yfiles.type="edgegraphics"/>',
    '  <graph id="G" edgedefault="directed">',
    `    <data key="graphTitle">${escapeXml(title)}</data>`,
  ];

  for (const id of orderedIds) {
    const node = nodes[id];
    const x = Number.isFinite(node.x) ? node.x : 0;
    const y = Number.isFinite(node.y) ? node.y : 0;
    const color = node.bgColor && /^#[\da-f]{6}$/i.test(node.bgColor)
      ? node.bgColor
      : node.color && /^#[\da-f]{6}$/i.test(node.color)
        ? node.color
        : '#FFFFFF';
    const borderColor = node.color && /^#[\da-f]{6}$/i.test(node.color) ? node.color : '#333333';
    lines.push(
      `    <node id="${externalIds.get(id)}">`,
      ...(node.notes ? [`      <data key="description">${escapeXml(node.notes)}</data>`] : []),
      ...(node.taskStatus ? [`      <data key="taskStatus">${node.taskStatus}</data>`] : []),
      ...(node.priority && node.priority !== 'none' ? [`      <data key="priority">${node.priority}</data>`] : []),
      '      <data key="nodegraphics">',
      `        <y:ShapeNode><y:Geometry x="${x}" y="${y}" width="140" height="48"/>`,
      `          <y:Fill color="${color}" transparent="false"/>`,
      `          <y:BorderStyle color="${borderColor}" type="line" width="1.0"/>`,
      `          <y:NodeLabel xml:space="preserve">${escapeXml(node.text)}</y:NodeLabel>`,
      '          <y:Shape type="roundrectangle"/>',
      '        </y:ShapeNode>',
      '      </data>',
      '    </node>',
    );
  }

  let edgeIndex = 0;
  const appendEdge = (sourceId: string, targetId: string, label?: string, color?: string): void => {
    const safeColor = color && /^#[\da-f]{6}$/i.test(color) ? color : '#666666';
    lines.push(
      `    <edge id="e${edgeIndex++}" source="${externalIds.get(sourceId)}" target="${externalIds.get(targetId)}">`,
      ...(label ? [`      <data key="edgeLabel">${escapeXml(label)}</data>`] : []),
      '      <data key="edgegraphics">',
      `        <y:PolyLineEdge><y:LineStyle color="${safeColor}" type="line" width="1.0"/>`,
      '          <y:Arrows source="none" target="standard"/>',
      ...(label ? [`          <y:EdgeLabel>${escapeXml(label)}</y:EdgeLabel>`] : []),
      '        </y:PolyLineEdge>',
      '      </data>',
      '    </edge>',
    );
  };

  for (const id of orderedIds) {
    for (const childId of nodes[id].children) appendEdge(id, childId, undefined, nodes[childId].color);
  }
  for (const edge of freeEdges) appendEdge(edge.from, edge.to, edge.label, edge.color);
  lines.push('  </graph>', '</graphml>');
  return `${lines.join('\n')}\n`;
}

function elementChildren(element: Element): Element[] {
  return Array.from(element.children);
}

function descendants(element: Element, localName: string): Element[] {
  const result: Element[] = [];
  const visit = (current: Element): void => {
    for (const child of elementChildren(current)) {
      if (child.localName.toLowerCase() === localName.toLowerCase()) result.push(child);
      visit(child);
    }
  };
  visit(element);
  return result;
}

function directChild(element: Element, localName: string): Element | undefined {
  return elementChildren(element).find(child => child.localName.toLowerCase() === localName.toLowerCase());
}

function dataForKey(element: Element, key: string, keyNames: Map<string, string>): Element | undefined {
  return elementChildren(element).find(child =>
    child.localName.toLowerCase() === 'data' &&
    ((child.getAttribute('key') ?? '') === key || keyNames.get(child.getAttribute('key') ?? '') === key)
  );
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function parseCoordinate(value: string | null): number | undefined {
  if (!value) return undefined;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : undefined;
}

function parseTaskStatus(value: string | null): TaskStatus | undefined {
  const status = value?.trim();
  if (!status) return undefined;
  if (status !== 'open' && status !== 'done') {
    throw new Error(`L’état de tâche GraphML « ${status} » est invalide.`);
  }
  return status;
}

function parsePriority(value: string | null): NodePriority | undefined {
  const priority = value?.trim();
  if (!priority) return undefined;
  if (priority !== 'none' && priority !== 'low' && priority !== 'medium' && priority !== 'high' && priority !== 'critical') {
    throw new Error(`La priorité GraphML « ${priority} » est invalide.`);
  }
  return priority;
}

export function parseYEd(source: string): YEdImport {
  if (typeof DOMParser === 'undefined') {
    throw new Error('L’import GraphML nécessite un navigateur compatible.');
  }
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Le fichier GraphML contient un XML invalide.');
  }
  const root = document.documentElement;
  if (root.localName.toLowerCase() !== 'graphml') {
    throw new Error('Le fichier sélectionné n’est pas un document GraphML.');
  }

  const keyNames = new Map<string, string>();
  for (const key of descendants(root, 'key')) {
    const id = key.getAttribute('id');
    const name = key.getAttribute('attr.name');
    if (id && name) keyNames.set(id, name);
  }
  const graph = descendants(root, 'graph').find(element => element.parentElement === root)
    ?? descendants(root, 'graph')[0];
  if (!graph) throw new Error('Le document GraphML ne contient pas de graphe.');

  const externalNodes = elementChildren(graph).filter(element => element.localName.toLowerCase() === 'node');
  if (externalNodes.length === 0) throw new Error('Le graphe GraphML ne contient aucun nœud.');

  const parsedNodes: GraphNode[] = [];
  const externalIds = new Set<string>();
  const titleData = dataForKey(graph, 'graphTitle', keyNames);
  const title = titleData?.textContent?.trim() ?? '';
  for (const element of externalNodes) {
    const externalId = element.getAttribute('id');
    if (!externalId) throw new Error('Un nœud GraphML ne contient pas d’identifiant.');
    if (externalIds.has(externalId)) throw new Error(`L’identifiant GraphML « ${externalId} » apparaît plusieurs fois.`);
    externalIds.add(externalId);

    const graphicsData = elementChildren(element).find(data =>
      data.localName.toLowerCase() === 'data' &&
      (data.getAttribute('key') === 'nodegraphics' || keyNames.get(data.getAttribute('key') ?? '') === 'nodegraphics')
    );
    const labelElement = graphicsData ? descendants(graphicsData, 'NodeLabel')[0] : undefined;
    const description = dataForKey(element, 'description', keyNames)?.textContent?.trim();
    const taskStatus = parseTaskStatus(dataForKey(element, 'taskStatus', keyNames)?.textContent ?? null);
    const priority = parsePriority(dataForKey(element, 'priority', keyNames)?.textContent ?? null);
    const text = labelElement?.textContent?.trim() || description || externalId;
    const shapeNode = graphicsData ? descendants(graphicsData, 'ShapeNode')[0] : undefined;
    const geometry = shapeNode && directChild(shapeNode, 'Geometry');
    const fill = shapeNode && directChild(shapeNode, 'Fill');
    const color = fill?.getAttribute('color');
    parsedNodes.push({
      externalId,
      text,
      ...(description && description !== text ? { notes: description } : {}),
      ...(taskStatus ? { taskStatus } : {}),
      ...(priority && priority !== 'none' ? { priority } : {}),
      ...(color && /^#[\da-f]{6}$/i.test(color) ? { color } : {}),
      ...(parseCoordinate(geometry?.getAttribute('x') ?? null) !== undefined
        ? { x: parseCoordinate(geometry?.getAttribute('x') ?? null) } : {}),
      ...(parseCoordinate(geometry?.getAttribute('y') ?? null) !== undefined
        ? { y: parseCoordinate(geometry?.getAttribute('y') ?? null) } : {}),
    });
  }

  const edges: GraphEdge[] = [];
  for (const element of elementChildren(graph).filter(child => child.localName.toLowerCase() === 'edge')) {
    const sourceId = element.getAttribute('source');
    const targetId = element.getAttribute('target');
    if (!sourceId || !targetId || !externalIds.has(sourceId) || !externalIds.has(targetId)) {
      throw new Error('Une relation GraphML référence un nœud absent du graphe.');
    }
    const dataLabel = dataForKey(element, 'description', keyNames)?.textContent?.trim();
    const graphicsData = elementChildren(element).find(data =>
      data.localName.toLowerCase() === 'data' &&
      (data.getAttribute('key') === 'edgegraphics' || keyNames.get(data.getAttribute('key') ?? '') === 'edgegraphics')
    );
    const label = graphicsData ? descendants(graphicsData, 'EdgeLabel')[0]?.textContent?.trim() : undefined;
    const lineStyle = graphicsData ? descendants(graphicsData, 'LineStyle')[0] : undefined;
    const color = lineStyle?.getAttribute('color');
    edges.push({
      externalId: element.getAttribute('id') ?? `edge_${edges.length}`,
      source: sourceId,
      target: targetId,
      ...(label || dataLabel ? { label: label || dataLabel } : {}),
      ...(color && /^#[\da-f]{6}$/i.test(color) ? { color } : {}),
    });
  }

  const nodes: NodesMap = {};
  const internalIds = new Map<string, string>();
  let row = 0;
  for (const [index, parsed] of parsedNodes.entries()) {
    const id = `graphml_${index}`;
    internalIds.set(parsed.externalId, id);
    defineNode(nodes, {
      id,
      text: parsed.text,
      x: parsed.x ?? 500,
      y: parsed.y ?? 300 + row++ * 100,
      parentId: null,
      children: [],
      collapsed: false,
      ...(parsed.notes ? { notes: parsed.notes } : {}),
      ...(parsed.taskStatus ? { taskStatus: parsed.taskStatus } : {}),
      ...(parsed.priority ? { priority: parsed.priority } : {}),
      ...(parsed.color ? { color: parsed.color } : {}),
    });
  }

  const roots = new Set(parsedNodes.map(node => node.externalId));
  const treeEdges = new Set<string>();
  const freeEdges: FreeEdge[] = [];
  const outgoing = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge);
    outgoing.set(edge.source, list);
  }
  const visited = new Set<string>();
  const visit = (externalId: string): void => {
    visited.add(externalId);
    for (const edge of outgoing.get(externalId) ?? []) {
      if (!visited.has(edge.target) && roots.has(edge.target)) {
        treeEdges.add(edge.externalId);
        const parent = nodes[internalIds.get(externalId)!];
        const child = nodes[internalIds.get(edge.target)!];
        child.parentId = parent.id;
        parent.children.push(child.id);
        visit(edge.target);
      }
    }
  };

  const incoming = new Set(edges.map(edge => edge.target));
  const topRoots = parsedNodes.filter(node => !incoming.has(node.externalId));
  if (topRoots.length === 0) throw new Error('Le graphe GraphML contient un cycle et aucune racine.');
  topRoots.forEach(node => visit(node.externalId));
  if (visited.size !== parsedNodes.length) {
    throw new Error('Le graphe GraphML contient des nœuds cycliques ou inaccessibles depuis ses racines.');
  }

  for (const edge of edges) {
    if (treeEdges.has(edge.externalId)) continue;
    freeEdges.push({
      id: edge.externalId,
      from: internalIds.get(edge.source)!,
      to: internalIds.get(edge.target)!,
      ...(edge.label ? { label: edge.label } : {}),
      ...(edge.color ? { color: edge.color } : {}),
    });
  }

  if (topRoots.length === 1) {
    const rootNode = nodes[internalIds.get(topRoots[0].externalId)!];
    return { title: title || rootNode.text, nodes, freeEdges };
  }

  const syntheticRoot: MindNode = {
    id: `graphml_${parsedNodes.length}`,
    text: title || 'Carte importée',
    x: 500,
    y: 300,
    parentId: null,
    children: topRoots.map(node => internalIds.get(node.externalId)!),
    collapsed: false,
  };
  defineNode(nodes, syntheticRoot);
  topRoots.forEach((rootNode, index) => {
    const node = nodes[internalIds.get(rootNode.externalId)!];
    node.parentId = syntheticRoot.id;
    if (rootNode.x === undefined) node.x = 720;
    if (rootNode.y === undefined) node.y = 400 + index * 100;
  });
  return { title: syntheticRoot.text, nodes, freeEdges };
}

export function downloadYEd(nodes: NodesMap, title: string, freeEdges: FreeEdge[] = []): void {
  const content = serializeYEd(nodes, title, freeEdges);
  const blob = new Blob([content], { type: 'application/graphml+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.graphml`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
