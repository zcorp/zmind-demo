import type { MindNode, NodesMap } from '../types';

export interface MermaidImport {
  title: string;
  nodes: NodesMap;
}

function escapeLabel(value: string): string {
  return value
    .replace(/#/g, '#35;')
    .replace(/&/g, '#amp;')
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;');
}

function unescapeLabel(value: string): string {
  return value.replace(/#(amp|quot|lt|gt|35);/g, entity => ({
    '#amp;': '&',
    '#quot;': '"',
    '#lt;': '<',
    '#gt;': '>',
    '#35;': '#',
  })[entity] ?? entity);
}

export function serializeMermaid(nodes: NodesMap): string {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Une carte Mermaid doit contenir exactement un nœud racine.');
  }

  const visited = new Set<string>();
  const lines = ['mindmap'];
  const renderNode = (id: string, depth: number): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en Mermaid.');
    }
    visited.add(id);
    const taskMarker = node.taskStatus ? `[${node.taskStatus === 'done' ? 'x' : ' '}] ` : '';
    const label = escapeLabel(`${taskMarker}${node.text}`).replace(/\r?\n/g, '<br/>');
    const syntax = depth === 0 ? `root(("${label}"))` : `"${label}"`;
    lines.push(`${'  '.repeat(depth + 1)}${syntax}`);
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en Mermaid.');
      }
      renderNode(childId, depth + 1);
    }
  };

  renderNode(roots[0][0], 0);
  if (visited.size !== entries.length) {
    throw new Error('La carte contient des nœuds inaccessibles depuis sa racine.');
  }
  return lines.join('\n');
}

function makeNode(
  id: string,
  text: string,
  parentId: string | null,
  depth: number,
  row: number,
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
    taskStatus,
  };
}

function addNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function parseLabel(line: string, isRoot: boolean): string {
  let label = line.trim();
  if (isRoot) {
    const rootShape = label.match(/^root\s*\(\(\s*([\s\S]*?)\s*\)\)\s*$/i)
      ?? label.match(/^root\s*\(\s*([\s\S]*?)\s*\)\s*$/i);
    if (rootShape) label = rootShape[1];
  } else {
    const shape = label.match(/^[\w-]+\s*(?:\(\(\s*([\s\S]*)\s*\)\)|\(\s*([\s\S]*)\s*\)|\[\s*([\s\S]*)\s*\]|\{\s*([\s\S]*)\s*\})$/);
    if (shape) label = shape.slice(1).find(value => value !== undefined) ?? label;
  }

  if (label.startsWith('"') && label.endsWith('"') && label.length >= 2) {
    label = label.slice(1, -1);
  } else if (label.startsWith('`') && label.endsWith('`') && label.length >= 2) {
    label = label.slice(1, -1);
  }
  return unescapeLabel(label.replace(/<br\s*\/?>/gi, '\n').trim());
}

export function parseMermaid(source: string): MermaidImport {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  let inFrontmatter = false;
  let foundMindmap = false;
  const entries: Array<{ indent: number; label: string }> = [];
  let multilineEntry: { indent: number; label: string } | null = null;
  let multilineDelimiter: '"' | '`' | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (multilineEntry && multilineDelimiter) {
      const endIndex = trimmed.indexOf(multilineDelimiter);
      if (endIndex >= 0) {
        multilineEntry.label += `\n${trimmed.slice(0, endIndex)}`;
        multilineEntry.label = unescapeLabel(multilineEntry.label);
        multilineEntry = null;
        multilineDelimiter = null;
      } else {
        multilineEntry.label += `\n${trimmed}`;
      }
      continue;
    }

    if (!foundMindmap && trimmed === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter || trimmed.startsWith('%%')) continue;
    if (!foundMindmap) {
      if (!/^mindmap(?:\s|$)/i.test(trimmed)) {
        throw new Error('Le fichier Mermaid doit commencer par une directive mindmap.');
      }
      foundMindmap = true;
      continue;
    }

    const indentation = rawLine.match(/^[ \t]*/)?.[0].replace(/\t/g, '  ').length ?? 0;
    const content = trimmed;
    const openingQuote = content.startsWith('"') ? '"' : content.startsWith('`') ? '`' : null;
    if (openingQuote && !content.endsWith(openingQuote)) {
      multilineEntry = { indent: indentation, label: content.slice(1) };
      multilineDelimiter = openingQuote;
      entries.push(multilineEntry);
      continue;
    }

    const label = parseLabel(content, entries.length === 0);
    if (!label) continue;
    entries.push({ indent: indentation, label });
  }

  if (!foundMindmap) throw new Error('Aucune carte Mermaid mindmap n’a été trouvée.');
  if (multilineDelimiter) throw new Error('Le fichier Mermaid contient un libellé entre guillemets non terminé.');
  if (entries.length === 0) throw new Error('La mindmap Mermaid ne contient aucun nœud.');

  const nodes: NodesMap = {};
  const stack: MindNode[] = [];
  let row = 0;
  const firstIndent = entries[0].indent;
  for (const [index, entry] of entries.entries()) {
    const depth = Math.max(0, Math.floor((entry.indent - firstIndent) / 2));
    if (depth > stack.length) {
      throw new Error('L’indentation de la mindmap Mermaid comporte un niveau parent manquant.');
    }
    stack.length = depth;
    const parent = depth > 0 ? stack[depth - 1] : null;
    const taskMatch = entry.label.match(/^\[([ xX])\]\s+([\s\S]*)$/);
    const text = taskMatch ? taskMatch[2] : entry.label;
    const taskStatus = taskMatch ? (taskMatch[1].toLowerCase() === 'x' ? 'done' : 'open') : undefined;
    const node = makeNode(`mermaid_${index}`, text, parent?.id ?? null, depth, row++, taskStatus);
    addNode(nodes, node);
    if (parent) parent.children.push(node.id);
    stack.push(node);
  }

  const roots = Object.values(nodes).filter(node => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('La mindmap Mermaid doit avoir un seul nœud racine.');
  }
  return { title: roots[0].text, nodes };
}

export function downloadMermaid(nodes: NodesMap, title: string): void {
  const content = serializeMermaid(nodes);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.mmd`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
