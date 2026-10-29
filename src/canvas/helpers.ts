// ─────────────────────────────────────────────────────────────────────────────
// src/canvas/helpers.ts
// Pure utility functions — no React, no side effects.
// ─────────────────────────────────────────────────────────────────────────────

import { MindNode, NodesMap, MapDocument, DocCategory } from '../types';
import { PALETTE, SPAWN_X_OFFSET, SPAWN_Y_GAP } from './constants';

// ─── ID generators ────────────────────────────────────────────────────────────

export function genId():    string { return `n_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }
export function genDocId(): string { return `doc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }

// ─── Tree traversal ───────────────────────────────────────────────────────────

/** Returns [id, ...all descendants] */
export function allDesc(nodes: NodesMap, id: string): string[] {
  const out = [id], q = [...(nodes[id]?.children ?? [])];
  while (q.length) { const c = q.shift()!; out.push(c); q.push(...(nodes[c]?.children ?? [])); }
  return out;
}

/** Returns false if any ancestor is collapsed */
export function visible(nodes: NodesMap, id: string): boolean {
  let cur = nodes[id]?.parentId ?? null;
  while (cur) { if (nodes[cur]?.collapsed) return false; cur = nodes[cur]?.parentId ?? null; }
  return true;
}

// ─── Colour ───────────────────────────────────────────────────────────────────

export function nodeColor(nodes: NodesMap, id: string, override?: string): string {
  if (override) return override;
  let d = 0; let cur = nodes[id]?.parentId ?? null;
  while (cur) { d++; cur = nodes[cur]?.parentId ?? null; }
  return PALETTE[d % PALETTE.length];
}

// ─── Smart spawn ──────────────────────────────────────────────────────────────

/** Returns {x, y} for a new child that doesn't overlap existing nodes */
export function spawnChildPos(nodes: NodesMap, parentId: string): { x: number; y: number } {
  const parent = nodes[parentId];
  if (!parent) return { x: 500, y: 300 };

  const siblings = parent.children.map(id => nodes[id]).filter(Boolean) as MindNode[];
  const depth = (() => {
    let d = 0; let cur = parent.parentId;
    while (cur) { d++; cur = nodes[cur]?.parentId ?? null; }
    return d;
  })();

  let xDir = 1;
  if (depth === 0) {
    const leftKids  = siblings.filter(s => s.x < parent.x).length;
    const rightKids = siblings.filter(s => s.x >= parent.x).length;
    xDir = leftKids <= rightKids ? -1 : 1;
  } else {
    xDir = parent.x >= (nodes[parent.parentId!]?.x ?? 0) ? 1 : -1;
  }

  const targetX  = parent.x + xDir * SPAWN_X_OFFSET;
  const allNodes = Object.values(nodes);
  const candidates: number[] = [];
  for (let i = 0; i < 20; i++) {
    candidates.push(parent.y + i * SPAWN_Y_GAP);
    if (i > 0) candidates.push(parent.y - i * SPAWN_Y_GAP);
  }

  for (const y of candidates) {
    const clash = allNodes.some(n =>
      Math.abs(n.x - targetX) < 120 && Math.abs(n.y - y) < SPAWN_Y_GAP - 4
    );
    if (!clash) return { x: targetX, y };
  }

  const lastSibling = siblings.sort((a, b) => b.y - a.y)[0];
  return { x: targetX, y: lastSibling ? lastSibling.y + SPAWN_Y_GAP : parent.y };
}

/** Returns {x, y} for a new sibling */
export function spawnSiblingPos(nodes: NodesMap, nodeId: string): { x: number; y: number } {
  const node = nodes[nodeId];
  if (!node?.parentId) return { x: 500, y: 300 };
  return spawnChildPos(nodes, node.parentId);
}

// ─── Default document ─────────────────────────────────────────────────────────

export function makeDefaultDoc(category: DocCategory = 'thoughts'): MapDocument {
  const id = genDocId();
  const c1 = genId(), c2 = genId(), c3 = genId(), c4 = genId(), c5 = genId();
  return {
    id, title: 'Nouvelle carte', category,
    createdAt: Date.now(), updatedAt: Date.now(),
    nodes: {
      [id]: { id, text: 'Idée principale', x: 500, y: 310, parentId: null, children: [c1, c2, c3], collapsed: false },
      [c1]: { id: c1, text: 'Thème A', x: 280, y: 198, parentId: id,  children: [c4], collapsed: false },
      [c2]: { id: c2, text: 'Thème B', x: 720, y: 254, parentId: id,  children: [],  collapsed: false },
      [c3]: { id: c3, text: 'Thème C', x: 280, y: 422, parentId: id,  children: [c5], collapsed: false },
      [c4]: { id: c4, text: 'Détail 1', x: 80,  y: 198, parentId: c1, children: [],  collapsed: false },
      [c5]: { id: c5, text: 'Détail 2', x: 80,  y: 422, parentId: c3, children: [],  collapsed: false },
    },
  };
}

// ─── Rebalance siblings ───────────────────────────────────────────────────────

/** After adding a child, spread the parent's children evenly */
export function rebalanceSiblings(nodes: NodesMap, parentId: string): NodesMap {
  const parent = nodes[parentId]; if (!parent) return nodes;
  const siblings = parent.children.map(id => nodes[id]).filter(Boolean) as MindNode[];
  if (siblings.length <= 1) return nodes;

  const left  = siblings.filter(s => s.x < parent.x);
  const right = siblings.filter(s => s.x >= parent.x);
  let result  = { ...nodes };

  const spread = (group: MindNode[], xTarget: number) => {
    if (!group.length) return;
    const totalH = group.length * SPAWN_Y_GAP;
    const startY = parent.y - totalH / 2 + SPAWN_Y_GAP / 2;
    group.sort((a, b) => a.y - b.y).forEach((sib, i) => {
      result = { ...result, [sib.id]: { ...sib, x: xTarget, y: startY + i * SPAWN_Y_GAP } };
    });
  };

  spread(left,  parent.x - SPAWN_X_OFFSET);
  spread(right, parent.x + SPAWN_X_OFFSET);
  return result;
}
