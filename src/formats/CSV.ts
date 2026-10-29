import type { MindNode, NodesMap, TaskStatus } from '../types';

export interface CSVImport {
  title: string;
  nodes: NodesMap;
}

function parseRecords(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '');
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (closedQuote && character !== ',' && character !== '\r' && character !== '\n') {
      throw new Error('Le fichier CSV contient du texte après la fermeture d’un champ entre guillemets.');
    }
    if (character === '"' && field.length === 0 && !closedQuote) {
      quoted = true;
    } else if (character === ',') {
      record.push(field);
      field = '';
      closedQuote = false;
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      closedQuote = false;
    } else {
      if (character === '"') throw new Error('Le fichier CSV contient un guillemet mal placé.');
      field += character;
    }
  }

  if (quoted) throw new Error('Le fichier CSV contient un champ entre guillemets non terminé.');
  if (field.length > 0 || record.length > 0 || closedQuote) {
    record.push(field);
    records.push(record);
  }
  while (records.length > 0 && records[records.length - 1].every(value => value === '')) records.pop();
  return records;
}

function parseHeader(header: string[]): number {
  if (header.length === 0 || header.length % 2 !== 0) {
    throw new Error('Le CSV doit contenir des colonnes level0,note0, level1,note1, etc.');
  }
  const levels = header.length / 2;
  for (let depth = 0; depth < levels; depth += 1) {
    if (header[depth * 2].trim().toLowerCase() !== `level${depth}` ||
        header[depth * 2 + 1].trim().toLowerCase() !== `note${depth}`) {
      throw new Error('Les colonnes CSV doivent suivre l’ordre level0,note0, level1,note1, etc.');
    }
  }
  return levels;
}

function defineNode(nodes: NodesMap, node: MindNode): void {
  Object.defineProperty(nodes, node.id, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function parseTaskTitle(title: string): { text: string; taskStatus?: TaskStatus } {
  const match = title.match(/^ - \[([ xX])\] (.*)$/);
  if (!match) return { text: title };
  return {
    text: match[2],
    taskStatus: match[1].toLowerCase() === 'x' ? 'done' : 'open',
  };
}

export function parseCSV(source: string): CSVImport {
  const records = parseRecords(source);
  if (records.length < 2) throw new Error('Le fichier CSV doit contenir un en-tête et au moins un nœud.');

  const levelCount = parseHeader(records[0]);
  const nodes: NodesMap = {};
  const lastAtDepth: Array<MindNode | undefined> = [];
  let nextId = 0;
  let rowIndex = 0;

  for (const [recordIndex, record] of records.slice(1).entries()) {
    if (record.length > levelCount * 2) {
      throw new Error(`La ligne CSV ${recordIndex + 2} contient plus de colonnes que l’en-tête.`);
    }
    const padded = [...record, ...Array(levelCount * 2 - record.length).fill('')];
    if (padded.every(value => value === '')) continue;
    const populatedDepths = Array.from({ length: levelCount }, (_, depth) => depth)
      .filter(depth => padded[depth * 2] !== '');
    if (populatedDepths.length !== 1) {
      throw new Error(`La ligne CSV ${recordIndex + 2} doit contenir exactement un titre de nœud.`);
    }

    const depth = populatedDepths[0];
    if (depth > 0 && !lastAtDepth[depth - 1]) {
      throw new Error(`La ligne CSV ${recordIndex + 2} référence un niveau parent manquant.`);
    }
    lastAtDepth.length = depth + 1;
    const parent = depth > 0 ? lastAtDepth[depth - 1]! : null;
    const id = `csv_${nextId++}`;
    const { text, taskStatus } = parseTaskTitle(padded[depth * 2]);
    const node: MindNode = {
      id,
      text,
      x: 500 + depth * 220,
      y: 300 + rowIndex++ * 100,
      parentId: parent?.id ?? null,
      children: [],
      collapsed: false,
      ...(taskStatus ? { taskStatus } : {}),
      ...(padded[depth * 2 + 1] !== '' ? { notes: padded[depth * 2 + 1] } : {}),
    };
    defineNode(nodes, node);
    if (parent) parent.children.push(id);
    lastAtDepth[depth] = node;
  }

  const roots = Object.values(nodes).filter(node => node.parentId === null);
  if (roots.length === 0) throw new Error('Le fichier CSV ne contient aucun titre de nœud.');
  if (roots.length === 1) return { title: roots[0].text, nodes };

  const syntheticRoot: MindNode = {
    id: `csv_${nextId}`,
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
  return { title: syntheticRoot.text, nodes };
}

export function serializeCSV(nodes: NodesMap): string {
  const entries = Object.entries(nodes);
  const roots = entries.filter(([, node]) => node.parentId === null);
  if (roots.length !== 1) throw new Error('Une carte CSV doit contenir exactement un nœud racine.');

  const orderedIds: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string, depth: number): number => {
    const node = nodes[id];
    if (!node || node.id !== id || visited.has(id)) {
      throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en CSV.');
    }
    visited.add(id);
    orderedIds.push(id);
    let maxDepth = depth;
    for (const childId of node.children) {
      if (nodes[childId]?.parentId !== id) {
        throw new Error('La hiérarchie de la carte est invalide et ne peut pas être exportée en CSV.');
      }
      maxDepth = Math.max(maxDepth, visit(childId, depth + 1));
    }
    return maxDepth;
  };

  const rootId = roots[0][0];
  const maxDepth = visit(rootId, 0);
  if (visited.size !== entries.length) {
    throw new Error('La carte contient des nœuds inaccessibles depuis sa racine.');
  }

  const depthById = new Map<string, number>();
  const assignDepth = (id: string, depth: number): void => {
    depthById.set(id, depth);
    nodes[id].children.forEach(childId => assignDepth(childId, depth + 1));
  };
  assignDepth(rootId, 0);

  const rows = [
    Array.from({ length: maxDepth + 1 }, (_, depth) => [`level${depth}`, `note${depth}`]).flat(),
  ];
  for (const id of orderedIds) {
    const node = nodes[id];
    const depth = depthById.get(id)!;
    const row = Array((maxDepth + 1) * 2).fill('');
    const taskMarker = node.taskStatus
      ? ` - [${node.taskStatus === 'done' ? 'x' : ' '}] `
      : '';
    row[depth * 2] = `${taskMarker}${node.text}`;
    row[depth * 2 + 1] = node.notes ?? '';
    rows.push(row);
  }
  return `${rows.map(row => row.map(escapeField).join(',')).join('\r\n')}\r\n`;
}

export function downloadCSV(nodes: NodesMap, title: string): void {
  const content = serializeCSV(nodes);
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
