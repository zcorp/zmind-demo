/**
 * Markdown import/export for hierarchical mind maps.
 */

import type { MindNode, NodesMap as MindNodesMap } from '../types';

export interface MindNodeFlat {
  id: string;
  text: string;
  parentId: string | null;
  children: string[];
  collapsed: boolean;
  notes?: string;
  taskStatus?: MindNode['taskStatus'];
  tags?: string[];
  priority?: MindNode['priority'];
}

export type NodesMap = Record<string, MindNodeFlat>;

export interface MarkdownImport {
  title: string;
  nodes: NodesMap;
}

function renderNode(nodes: NodesMap, id: string, depth: number): string {
  const node = nodes[id];
  if (!node) return '';
  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '# ' : `${indent}- `;
  const taskMarker = node.taskStatus ? `[${node.taskStatus === 'done' ? 'x' : ' '}] ` : '';
  let md = `${prefix}${taskMarker}${node.text}\n`;
  if (node.tags?.length) {
    const encodedTags = JSON.stringify(node.tags).replace(/-/g, '\\u002d');
    md += `${indent}<!-- minder-tags:${encodedTags} -->\n`;
  }
  if (node.priority && node.priority !== 'none') {
    md += `${indent}<!-- minder-priority:${node.priority} -->\n`;
  }
  if (node.notes?.trim()) {
    md += `${node.notes.trim().split(/\r?\n/).map(line => `${indent}  > ${line}`).join('\n')}\n`;
  }
  for (const childId of node.children) {
    md += renderNode(nodes, childId, depth + 1);
  }
  return md;
}

function makeNode(
  id: string,
  text: string,
  parentId: string | null,
  x: number,
  y: number,
  taskStatus?: MindNode['taskStatus'],
): MindNode {
  return { id, text, x, y, parentId, children: [], collapsed: false, taskStatus };
}

function parseTaskMarker(text: string): { text: string; taskStatus?: MindNode['taskStatus'] } {
  const match = text.match(/^\[([ xX])\]\s+(.*)$/);
  if (!match) return { text };
  return { text: match[2], taskStatus: match[1].toLowerCase() === 'x' ? 'done' : 'open' };
}

function parseTagsComment(line: string): string[] | undefined {
  if (!/^\s*<!--\s*minder-tags:/.test(line)) return undefined;
  const match = line.match(/^\s*<!--\s*minder-tags:(.*?)-->\s*$/);
  if (!match) throw new Error('Le commentaire minder-tags Markdown est mal formé.');
  let tags: unknown;
  try {
    tags = JSON.parse(match[1]);
  } catch {
    throw new Error('Le commentaire minder-tags Markdown contient un JSON invalide.');
  }
  if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string')) {
    throw new Error('Le commentaire minder-tags Markdown doit contenir une liste de tags textuels.');
  }
  return tags;
}

function parsePriorityComment(line: string): MindNode['priority'] | undefined {
  if (!/^\s*<!--\s*minder-priority:/.test(line)) return undefined;
  const match = line.match(/^\s*<!--\s*minder-priority:(.*?)-->\s*$/);
  if (!match) throw new Error('Le commentaire minder-priority Markdown est mal formé.');
  const priority = match[1].trim();
  switch (priority) {
    case 'none':
    case 'low':
    case 'medium':
    case 'high':
    case 'critical':
      return priority;
    default:
      throw new Error('Le commentaire minder-priority Markdown contient une priorité invalide.');
  }
}

function defineNode(nodes: MindNodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function parseMarkdown(source: string): MarkdownImport {
  const nodes: MindNodesMap = {};
  const stack: MindNode[] = [];
  let nodeIndex = 0;
  let currentNodeIndex = 0;
  let lastNodeId: string | null = null;
  let activeHeadingDepth: number | null = null;
  let syntheticRoot: MindNode | null = null;

  const addNode = (rawText: string, requestedDepth: number): MindNode => {
    const depth = Math.min(requestedDepth, stack.length);
    stack.length = depth;
    const { text, taskStatus } = parseTaskMarker(rawText);

    let parent = depth > 0 ? stack[depth - 1] : null;
    if (!parent && Object.keys(nodes).length > 0) {
      if (!syntheticRoot) {
        const existingRoot = Object.values(nodes).find(node => node.parentId === null);
        syntheticRoot = makeNode(`md_${nodeIndex++}`, 'Carte importée', null, 500, 300);
        defineNode(nodes, syntheticRoot);
        if (existingRoot) {
          existingRoot.parentId = syntheticRoot.id;
          syntheticRoot.children.push(existingRoot.id);
        }
      }
      parent = syntheticRoot;
      stack.length = 0;
      stack.push(syntheticRoot);
    }

    const node = makeNode(
      `md_${nodeIndex++}`,
      text,
      parent?.id ?? null,
      500 + depth * 220,
      300 + currentNodeIndex++ * 100,
      taskStatus,
    );
    defineNode(nodes, node);
    if (parent) parent.children.push(node.id);
    stack.push(node);
    lastNodeId = node.id;
    return node;
  };

  for (const rawLine of source.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const tags = parseTagsComment(rawLine);
    if (tags) {
      const lastNode = lastNodeId ? nodes[lastNodeId] : undefined;
      if (!lastNode) throw new Error('Un commentaire minder-tags apparaît avant tout nœud Markdown.');
      lastNode.tags = tags;
      continue;
    }

    const priority = parsePriorityComment(rawLine);
    if (priority) {
      const lastNode = lastNodeId ? nodes[lastNodeId] : undefined;
      if (!lastNode) throw new Error('Un commentaire minder-priority apparaît avant tout nœud Markdown.');
      lastNode.priority = priority;
      continue;
    }

    if (/^\s*<!--\s*minder-tags:/.test(rawLine)) {
      parseTagsComment(rawLine);
    } else if (/^\s*<!--\s*minder-priority:/.test(rawLine)) {
      parsePriorityComment(rawLine);
    } else if (/^\s*<!--/.test(rawLine)) {
      continue;
    }

    const quote = rawLine.match(/^\s*>\s?(.*)$/);
    if (quote) {
      const lastNode = lastNodeId ? nodes[lastNodeId] : undefined;
      if (lastNode) {
        lastNode.notes = lastNode.notes
          ? `${lastNode.notes}\n${quote[1]}`
          : quote[1];
      }
      continue;
    }

    const heading = rawLine.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      activeHeadingDepth = heading[1].length - 1;
      addNode(heading[2], activeHeadingDepth);
      continue;
    }

    const listItem = rawLine.match(/^([ \t]*)(?:[-+*]|\d+[.)])\s+(.+?)\s*$/);
    if (listItem) {
      const indentation = listItem[1].replace(/\t/g, '  ').length;
      let depth = Math.floor(indentation / 2);
      if (depth === 0 && activeHeadingDepth !== null) depth = activeHeadingDepth + 1;
      addNode(listItem[2], depth);
      continue;
    }

    const lastNode = lastNodeId ? nodes[lastNodeId] : undefined;
    if (lastNode) {
      lastNode.text = `${lastNode.text} ${rawLine.trim()}`;
    }
  }

  if (Object.keys(nodes).length === 0) {
    throw new Error('Le fichier Markdown ne contient aucun titre ni élément de liste à importer.');
  }

  const root = Object.values(nodes).find(node => node.parentId === null);
  if (!root) throw new Error('Impossible de déterminer la racine de la carte Markdown.');

  return { title: root.text, nodes };
}

export const MarkdownExport = {
  /** Convert a NodesMap to Markdown string */
  serialize(nodes: MindNodesMap): string {
    const root = Object.values(nodes).find(n => n.parentId === null);
    if (!root) return '';
    return renderNode(nodes, root.id, 0);
  },

  download(nodes: MindNodesMap, title = 'mindmap'): void {
    const content = MarkdownExport.serialize(nodes);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
