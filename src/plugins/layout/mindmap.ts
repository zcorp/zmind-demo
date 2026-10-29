// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/layout/mindmap.ts
//
// LAYOUT PLUGIN — Balanced Mind Map
//
// Classic mind-map layout: root in the center, children split left/right,
// sub-children cascade outward. No external dependencies.
//
// AI GENERATION NOTE:
//   - apply() MUST be a pure function (no mutation of `nodes`, no global state).
//   - Always return a Map<string, {x,y}> with an entry for EVERY node id.
//   - Use only the PluginNodesMap and LayoutOptions types from '../types'.
//   - Do NOT import d3 or any other library.
// ─────────────────────────────────────────────────────────────────────────────

import { LayoutPlugin, LayoutOptions, PluginNodesMap } from '../types';

// ── Internal helpers (not exported) ──────────────────────────────────────────

interface TreeNode {
  id: string;
  children: TreeNode[];
}

function buildTree(nodes: Readonly<PluginNodesMap>, rootId: string): TreeNode {
  const node = nodes[rootId];
  if (!node) return { id: rootId, children: [] };
  return {
    id: rootId,
    children: (node.children ?? [])
      .filter(cid => !!nodes[cid])
      .map(cid => buildTree(nodes, cid)),
  };
}

/** Returns total "height" of a subtree in slots */
function subtreeHeight(node: TreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + subtreeHeight(c), 0);
}

function placeSubtree(
  node: TreeNode,
  x: number,
  yTop: number,
  xStep: number,
  yStep: number,
  positions: Map<string, { x: number; y: number }>
): void {
  const h = subtreeHeight(node);
  const y = yTop + (h * yStep) / 2;
  positions.set(node.id, { x, y });

  let cursor = yTop;
  for (const child of node.children) {
    const ch = subtreeHeight(child);
    placeSubtree(child, x + xStep, cursor, xStep, yStep, positions);
    cursor += ch * yStep;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const MindMapLayout: LayoutPlugin = {

  meta: {
    id:          'mindmap-balanced',
    name:        'Mind Map Balanced',
    description: 'Root in center, first-level children split left and right, branches cascade outward.',
    type:        'layout',
    version:     '1.0.0',
    author:      'minder-team',
  },

  apply(
    nodes: Readonly<PluginNodesMap>,
    rootId: string,
    opts: LayoutOptions
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    // Defensive: return empty map if root is missing
    if (!rootId || !nodes[rootId]) return positions;

    const tree    = buildTree(nodes, rootId);
    const spacingH = opts.spacingH ?? opts.spacing;
    const spacingV = opts.spacing;
    const xStep   = (opts.nodeWidth  + 60) * spacingH;
    const yStep   = (opts.nodeHeight + 36) * spacingV;
    const cx      = opts.viewportWidth  / 2;
    const cy      = opts.viewportHeight / 2;

    // Place root
    positions.set(rootId, { x: cx, y: cy });

    // Split children left / right
    const children = tree.children;
    const leftKids: TreeNode[] = [];
    const rightKids: TreeNode[] = [];
    let leftLoad = 0;
    let rightLoad = 0;
    for (const child of children) {
      const load = subtreeHeight(child);
      if (leftLoad <= rightLoad) {
        leftKids.push(child);
        leftLoad += load;
      } else {
        rightKids.push(child);
        rightLoad += load;
      }
    }

    const placeGroup = (kids: TreeNode[], direction: 1 | -1) => {
      const totalH = kids.reduce((s, k) => s + subtreeHeight(k), 0);
      let cursor = cy - (totalH * yStep) / 2;
      for (const kid of kids) {
        const h = subtreeHeight(kid);
        placeSubtree(kid, cx + direction * xStep, cursor, direction * xStep, yStep, positions);
        cursor += h * yStep;
      }
    };

    placeGroup(leftKids,  -1);
    placeGroup(rightKids,  1);

    return positions;
  },
};
