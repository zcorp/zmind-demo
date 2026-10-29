/**
 * MinderJSON — canonical versioned format for editable Minder.js maps.
 * Deserialization also accepts the earlier bare NodesMap representation.
 */

import { MAX_NODE_ATTACHMENT_SIZE, type MindNode, type NodesMap } from '../types';

export interface MinderFile {
  version: '1.0';
  title: string;
  createdAt: number;
  updatedAt: number;
  nodes: NodesMap;
}

const NODE_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'critical']);
const TASK_STATUSES = new Set(['open', 'done']);
const NODE_ICONS = new Set([
  'none', 'star', 'check', 'warning', 'info', 'idea', 'question', 'flag',
  'heart', 'fire', 'lock', 'person', 'clock', 'target', 'book', 'chart',
  'code', 'globe', 'mail', 'pin',
]);
const ATTACHMENT_TYPES = new Set(['image', 'link', 'video', 'file', 'equation']);
const BORDER_STYLES = new Set(['solid', 'dashed', 'dotted']);
const NODE_SHAPES = new Set(['rounded', 'capsule', 'rectangle', 'parallelogram', 'hexagon', 'underline']);
const ATTACHMENT_POSITIONS = new Set(['top', 'bottom', 'left', 'right']);
const TEXT_ALIGNS = new Set(['left', 'center', 'right']);
const TEXT_BULLETS = new Set(['disc', 'circle', 'square']);
const TEXT_LINE_HEIGHTS = new Set([1, 1.25, 1.5, 2]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isMindNode(value: unknown, id: string): value is MindNode {
  if (!isRecord(value)) return false;
  if (
    value.id !== id ||
    typeof value.text !== 'string' ||
    typeof value.x !== 'number' || !Number.isFinite(value.x) ||
    typeof value.y !== 'number' || !Number.isFinite(value.y) ||
    (value.parentId !== null && typeof value.parentId !== 'string') ||
    !Array.isArray(value.children) ||
    !value.children.every(childId => typeof childId === 'string') ||
    typeof value.collapsed !== 'boolean'
  ) return false;

  if (
    !isOptionalString(value.color) ||
    !isOptionalString(value.bgColor) ||
    !isOptionalString(value.notes) ||
    !isOptionalString(value.number) ||
    !isOptionalFiniteNumber(value.borderRadius) ||
    !isOptionalFiniteNumber(value.borderWidth) ||
    !isOptionalFiniteNumber(value.attachmentSize)
  ) return false;

  if (value.textAlign !== undefined && !TEXT_ALIGNS.has(String(value.textAlign))) return false;
  if (value.textBullet !== undefined && !TEXT_BULLETS.has(String(value.textBullet))) return false;
  if (value.textLineHeight !== undefined && !TEXT_LINE_HEIGHTS.has(Number(value.textLineHeight))) return false;
  if (value.textFormats !== undefined) {
    if (!Array.isArray(value.textFormats)) return false;
    let previousEnd = 0;
    for (const format of value.textFormats) {
      if (!isRecord(format) ||
        !Number.isInteger(format.start) || !Number.isInteger(format.end) ||
        Number(format.start) < previousEnd || Number(format.end) <= Number(format.start) ||
        Number(format.end) > value.text.length ||
        !isOptionalString(format.fontFamily) ||
        !isOptionalString(format.textColor) ||
        !isOptionalString(format.textBackgroundColor) ||
        !isOptionalFiniteNumber(format.fontSize) ||
        (format.fontSize !== undefined && (Number(format.fontSize) < 8 || Number(format.fontSize) > 32)) ||
        !['textBold', 'textItalic', 'textUnderline', 'textStrikethrough'].every(key =>
          format[key] === undefined || typeof format[key] === 'boolean')) return false;
      previousEnd = Number(format.end);
    }
  }
  if (value.taskStatus !== undefined && !TASK_STATUSES.has(String(value.taskStatus))) return false;
  if (value.borderStyle !== undefined && !BORDER_STYLES.has(String(value.borderStyle))) return false;
  if (value.nodeShape !== undefined && !NODE_SHAPES.has(String(value.nodeShape))) return false;
  if (value.attachmentPosition !== undefined && !ATTACHMENT_POSITIONS.has(String(value.attachmentPosition))) return false;
  if (value.attachmentSize !== undefined && (Number(value.attachmentSize) < 24 || Number(value.attachmentSize) > MAX_NODE_ATTACHMENT_SIZE)) return false;
  if (value.priority !== undefined && !NODE_PRIORITIES.has(String(value.priority))) return false;
  if (value.icon !== undefined && !NODE_ICONS.has(String(value.icon))) return false;
  if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every(tag => typeof tag === 'string'))) return false;
  if (value.attachments !== undefined) {
    if (!Array.isArray(value.attachments) || !value.attachments.every(attachment =>
      isRecord(attachment) &&
      typeof attachment.id === 'string' &&
      ATTACHMENT_TYPES.has(String(attachment.type)) &&
      typeof attachment.name === 'string' &&
      typeof attachment.value === 'string' &&
      isOptionalString(attachment.thumbnail)
    )) return false;
  }

  return true;
}

function validateNodes(value: unknown): NodesMap {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new Error('La carte doit contenir au moins un nœud.');
  }

  const nodes: NodesMap = {};
  for (const [id, node] of Object.entries(value)) {
    if (!id || !isMindNode(node, id)) {
      throw new Error(`Le nœud « ${id || '(sans identifiant)'} » est invalide.`);
    }
    Object.defineProperty(nodes, id, {
      value: node,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }

  const roots: string[] = [];
  for (const [id, node] of Object.entries(nodes)) {
    if (node.parentId === null) {
      roots.push(id);
    } else {
      const parent = nodes[node.parentId];
      if (!parent || !parent.children.includes(id)) {
        throw new Error(`La relation parent-enfant du nœud « ${id} » est invalide.`);
      }
    }

    if (new Set(node.children).size !== node.children.length) {
      throw new Error(`Le nœud « ${id} » référence plusieurs fois un même enfant.`);
    }
    for (const childId of node.children) {
      if (childId === id || nodes[childId]?.parentId !== id) {
        throw new Error(`La relation parent-enfant du nœud « ${id} » est invalide.`);
      }
    }
  }

  if (roots.length !== 1) {
    throw new Error('La carte doit avoir exactement un nœud racine.');
  }

  const visited = new Set<string>();
  const pending = [roots[0]];
  while (pending.length > 0) {
    const id = pending.pop()!;
    if (visited.has(id)) {
      throw new Error('La hiérarchie de la carte contient un cycle.');
    }
    visited.add(id);
    pending.push(...nodes[id].children);
  }
  if (visited.size !== Object.keys(nodes).length) {
    throw new Error('La carte contient des nœuds inaccessibles depuis sa racine.');
  }

  return nodes;
}

export const MinderJSON = {
  serialize(nodes: NodesMap, title = 'Sans titre'): string {
    const file: MinderFile = {
      version: '1.0',
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: validateNodes(nodes),
    };
    return JSON.stringify(file, null, 2);
  },

  deserialize(json: string): NodesMap {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Le fichier Minder ne contient pas un JSON valide.');
    }

    if (!isRecord(parsed)) {
      throw new Error('Le fichier Minder doit contenir un objet JSON.');
    }

    if ('version' in parsed && typeof parsed.version === 'string') {
      if (parsed.version !== '1.0') {
        throw new Error(`La version du fichier Minder « ${String(parsed.version)} » n’est pas prise en charge.`);
      }
      if (!('nodes' in parsed)) {
        throw new Error('Le fichier Minder ne contient pas de carte.');
      }
      return validateNodes(parsed.nodes);
    }

    return validateNodes(parsed);
  },

  download(nodes: NodesMap, title = 'mindmap'): void {
    const content = MinderJSON.serialize(nodes, title);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_') || 'mindmap'}.minder`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async upload(): Promise<NodesMap> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.minder,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('Aucun fichier Minder sélectionné.'));
          return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error('Impossible de lire le fichier Minder.'));
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Le contenu du fichier Minder est illisible.'));
            return;
          }
          try {
            resolve(MinderJSON.deserialize(reader.result));
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  },
};
