import type { MindNode, NodesMap } from '../types';

export interface PlantUMLImport {
  title: string;
  nodes: NodesMap;
}

function assertValidHierarchy(nodes: NodesMap): string[] {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte PlantUML doit contenir exactement un nœud racine.');
  }

  const orderedIds: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en PlantUML.');
    }
    visited.add(id);
    orderedIds.push(id);
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en PlantUML.');
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

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n?|\n/g, '\\n');
}

function unescapeLabel(value: string): string {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\' && index + 1 < value.length) {
      const next = value[index + 1];
      if (next === 'n') {
        result += '\n';
        index += 1;
        continue;
      }
      if (next === '\\') {
        result += '\\';
        index += 1;
        continue;
      }
    }
    result += value[index];
  }
  return result;
}

export function serializePlantUML(nodes: NodesMap): string {
  const orderedIds = assertValidHierarchy(nodes);
  const rootId = orderedIds.find(id => nodes[id].parentId === null)!;
  const lines = ['@startmindmap'];
  const renderNode = (id: string, depth: number): void => {
    const node = nodes[id];
    const prefix = '*'.repeat(depth + 1);
    const color = depth > 0 && node.color && /^#[\da-f]{6}$/i.test(node.color)
      ? `[${node.color}] `
      : depth > 0 ? '_ ' : ' ';
    const taskMarker = node.taskStatus ? `[${node.taskStatus === 'done' ? 'x' : ' '}] ` : '';
    lines.push(`${prefix}${color}${taskMarker}${escapeLabel(node.text)}`);
    node.children.forEach(childId => renderNode(childId, depth + 1));
  };
  renderNode(rootId, 0);
  lines.push('@endmindmap');
  return `${lines.join('\n')}\n`;
}

function makeNode(
  id: string,
  text: string,
  parentId: string | null,
  depth: number,
  row: number,
  color?: string,
  taskStatus?: MindNode['taskStatus'],
): MindNode {
  return {
    id,
    text,
    x: 500 + depth * 220,
    y: 300 + row * 100,
    parentId,
    children: [],
    collapsed: false,
    ...(color ? { color } : {}),
    ...(taskStatus ? { taskStatus } : {}),
  };
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function parsePlantUML(source: string): PlantUMLImport {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const roots: Array<{
    label: string;
    color?: string;
    depth: number;
    taskStatus?: MindNode['taskStatus'];
  }> = [];
  let inMindmap = false;
  let foundMindmap = false;
  let currentRootHasNode = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^@startmindmap\b/i.test(trimmed)) {
      if (inMindmap) throw new Error('Le fichier PlantUML contient un bloc mindmap imbriqué.');
      inMindmap = true;
      foundMindmap = true;
      currentRootHasNode = false;
      continue;
    }
    if (/^@endmindmap\b/i.test(trimmed)) {
      if (!inMindmap) throw new Error('Le fichier PlantUML contient une fin de bloc sans début.');
      inMindmap = false;
      continue;
    }
    if (!inMindmap || !trimmed || trimmed === 'left side' || trimmed === 'right side') continue;

    const match = line.match(/^[ \t]*([*+-]+)(\[#([\da-f]{6})\]|_)?\s+([\s\S]*)$/i);
    if (!match) continue;
    const marker = match[1];
    const depth = marker.length - 1;
    const color = match[3] ? `#${match[3]}` : undefined;
    const rawLabel = unescapeLabel(match[4]);
    const taskMatch = rawLabel.match(/^\[([ xX])\]\s+([\s\S]*)$/);
    const label = taskMatch ? taskMatch[2] : rawLabel;
    if (!label.trim()) throw new Error('Un nœud PlantUML ne peut pas avoir un titre vide.');
    if (depth > 0 && !currentRootHasNode) {
      throw new Error('La hiérarchie PlantUML commence par un nœud enfant sans racine.');
    }
    if (depth === 0) currentRootHasNode = true;
    roots.push({
      label,
      color,
      depth,
      ...(taskMatch ? { taskStatus: taskMatch[1].toLowerCase() === 'x' ? 'done' as const : 'open' as const } : {}),
    });
  }

  if (inMindmap) throw new Error('Le fichier PlantUML contient un bloc mindmap non terminé.');
  if (!foundMindmap) throw new Error('Aucun bloc @startmindmap PlantUML n’a été trouvé.');
  if (roots.length === 0) throw new Error('Le fichier PlantUML ne contient aucun nœud.');

  const nodes: NodesMap = {};
  const stack: MindNode[] = [];
  let row = 0;
  for (const [index, entry] of roots.entries()) {
    if (entry.depth > stack.length) {
      throw new Error('La hiérarchie PlantUML comporte un niveau parent manquant.');
    }
    if (entry.depth === 0) {
      stack.length = 0;
    } else {
      stack.length = entry.depth;
    }
    const parent = entry.depth > 0 ? stack[entry.depth - 1] : null;
    const node = makeNode(
      `plantuml_${index}`,
      entry.label,
      parent?.id ?? null,
      entry.depth,
      row++,
      entry.color,
      entry.taskStatus,
    );
    defineNode(nodes, node);
    if (parent) parent.children.push(node.id);
    stack.push(node);
  }

  const nodeRoots = Object.values(nodes).filter(node => node.parentId === null);
  if (nodeRoots.length > 1) {
    const syntheticRoot: MindNode = {
      id: `plantuml_${roots.length}`,
      text: 'Carte importée',
      x: 500,
      y: 300,
      parentId: null,
      children: nodeRoots.map(node => node.id),
      collapsed: false,
    };
    defineNode(nodes, syntheticRoot);
    nodeRoots.forEach((node, index) => {
      node.parentId = syntheticRoot.id;
      node.x = 720;
      node.y = 400 + index * 100;
    });
    return { title: syntheticRoot.text, nodes };
  }
  return { title: nodeRoots[0].text, nodes };
}

export function downloadPlantUML(nodes: NodesMap, title: string): void {
  const content = serializePlantUML(nodes);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.puml`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
