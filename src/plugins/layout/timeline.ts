// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/layout/timeline.ts
//
// LAYOUT PLUGIN — Horizontal Timeline
//
// Root at left, top-level children are evenly spaced on a horizontal axis,
// their descendants fall below them in a compact column.
// ─────────────────────────────────────────────────────────────────────────────

import { LayoutPlugin, LayoutOptions, PluginNodesMap } from '../types';

function placeColumn(
  nodes: Readonly<PluginNodesMap>,
  id: string,
  x: number,
  startY: number,
  yStep: number,
  positions: Map<string, { x: number; y: number }>
): void {
  positions.set(id, { x, y: startY });
  const n = nodes[id];
  if (!n) return;
  let cursor = startY + yStep;
  for (const cid of n.children) {
    placeColumn(nodes, cid, x, cursor, yStep, positions);
    cursor += yStep;
  }
}

export const TimelineLayout: LayoutPlugin = {

  meta: {
    id:          'timeline-horizontal',
    name:        'Horizontal Timeline',
    description: 'Root anchored left. Top-level branches are milestones on a timeline.',
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
    if (!rootId || !nodes[rootId]) return positions;

    const xStep  = (opts.nodeWidth  + 30) * (opts.spacingH ?? opts.spacing);
    const yStep  = (opts.nodeHeight + 16) * opts.spacing;
    const rootX  = 80;
    const rootY  = opts.viewportHeight / 2;

    positions.set(rootId, { x: rootX, y: rootY });

    const root     = nodes[rootId];
    const children = root?.children ?? [];
    let   cursor   = rootX + xStep;

    for (const cid of children) {
      // Place each top-level child on the horizontal axis
      const timelineY = rootY;
      placeColumn(nodes, cid, cursor, timelineY, yStep, positions);
      cursor += xStep;
    }

    return positions;
  },
};
