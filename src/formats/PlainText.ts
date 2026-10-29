import type { MindNode, NodesMap } from '../types';

export interface PlainTextImport {
  title: string;
  nodes: NodesMap;
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function escapeLine(text: string): string {
  return text.replace(/^((?:[#\-+*>!])|\d+[.)])(?=\s)/, '\\$1');
}

function renderNode(nodes: NodesMap, id: string, depth: number): string {
  const node = nodes[id];
  if (!node) return '';

  const indent = '\t'.repeat(depth);
  const prefix = depth === 0 ? '# ' : `${indent}- `;
  const lines = node.text.split(/\r?\n/);
  const taskMarker = node.taskStatus ? `[${node.taskStatus === 'done' ? 'x' : ' '}] ` : '';
  const result = [`${prefix}${taskMarker}${escapeLine(lines[0])}`];
  for (const line of lines.slice(1)) {
    result.push(`${indent}  ${escapeLine(line)}`);
  }
  if (node.notes?.trim()) {
    for (const line of node.notes.trim().split(/\r?\n/)) {
      result.push(`${indent}  > ${line}`);
    }
  }
  for (const childId of node.children) {
    result.push(renderNode(nodes, childId, depth + 1));
  }
  return result.join('\n');
}

function assertValidHierarchy(nodes: NodesMap): string {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) {
    throw new Error('Un fichier texte doit contenir exactement un nœud racine.');
  }

  const visited = new Set<string>();
  const visit = (id: string): void => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée.');
    }
    visited.add(id);
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
  return roots[0][0];
}

export function parsePlainText(source: string): PlainTextImport {
  const nodes: NodesMap = {};
  const stack: MindNode[] = [];
  let nodeIndex = 0;
  let row = 0;
  let currentNode: MindNode | undefined;

  const addNode = (rawText: string, indentation: number): void => {
    const depth = Math.min(indentation, stack.length);
    stack.length = depth;
    const parent = depth > 0 ? stack[depth - 1] : null;
    const taskMatch = rawText.match(/^\[([ xX])\]\s+(.*)$/);
    const text = taskMatch ? taskMatch[2] : rawText;
    const id = `text_${nodeIndex++}`;
    const node: MindNode = {
      id,
      text: text.replace(/^\\(?=[#\-+*>!]\s|\d+[.)]\s)/, ''),
      x: 500 + depth * 220,
      y: 300 + row++ * 100,
      parentId: parent?.id ?? null,
      children: [],
      collapsed: false,
      taskStatus: taskMatch ? (taskMatch[1].toLowerCase() === 'x' ? 'done' : 'open') : undefined,
    };
    defineNode(nodes, node);
    if (parent) parent.children.push(id);
    stack.push(node);
    currentNode = node;
  };

  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;

    const quote = line.match(/^[ \t]*>\s?(.*)$/);
    if (quote) {
      if (currentNode) {
        currentNode.notes = currentNode.notes
          ? `${currentNode.notes}\n${quote[1]}`
          : quote[1];
      }
      continue;
    }

    const match = line.match(/^([ \t]*)(?:(-|[+*#!]|\d+[.)])\s+)?(.*)$/);
    if (!match) continue;

    const indentation = match[1].replace(/\t/g, '  ').length;
    const marker = match[2] ?? '';
    const content = match[3];
    if (marker) {
      addNode(content, Math.floor(indentation / 2));
    } else if (currentNode) {
      const continuation = content.replace(/^\\(?=[#\-+*>!]\s|\d+[.)]\s)/, '');
      currentNode.text += `\n${continuation}`;
    } else if (content.trim()) {
      addNode(content.trim(), 0);
    }
  }

  if (Object.keys(nodes).length === 0) {
    throw new Error('Le fichier texte ne contient aucun nœud à importer.');
  }

  const roots = Object.values(nodes).filter(node => node.parentId === null);
  if (roots.length > 1) {
    const root: MindNode = {
      id: `text_${nodeIndex}`,
      text: 'Carte importée',
      x: 500,
      y: 300,
      parentId: null,
      children: roots.map(node => node.id),
      collapsed: false,
    };
    defineNode(nodes, root);
    roots.forEach((node, index) => {
      node.parentId = root.id;
      node.x = 720;
      node.y = 400 + index * 100;
    });
    return { title: root.text, nodes };
  }

  return { title: roots[0].text, nodes };
}

export function serializePlainText(nodes: NodesMap): string {
  const rootId = assertValidHierarchy(nodes);
  return `${renderNode(nodes, rootId, 0)}\n`;
}

export function downloadPlainText(nodes: NodesMap, title: string): void {
  const content = serializePlainText(nodes);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
