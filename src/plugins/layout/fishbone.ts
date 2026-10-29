// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/layout/fishbone.ts
//
// LAYOUT PLUGIN — Fishbone (Ishikawa)
// Root on the right, a horizontal spine extends left, branches angle up/down.
// Classic cause-and-effect / root-cause-analysis diagram.
// author: ai-generated
// ─────────────────────────────────────────────────────────────────────────────

import { LayoutPlugin, LayoutOptions, PluginNodesMap } from '../types';

export const FishboneLayout: LayoutPlugin = {

  meta: {
    id:          'fishbone',
    name:        'Fishbone (Ishikawa)',
    description: 'Spine left→right, main branches angle 45°, sub-branches are horizontal.',
    type:        'layout',
    version:     '1.0.0',
    author:      'ai-generated',
  },

  apply(
    nodes: Readonly<PluginNodesMap>,
    rootId: string,
    opts: LayoutOptions
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    if (!rootId || !nodes[rootId]) return positions;

    const root      = nodes[rootId];
    const children  = root.children ?? [];
    const cx        = opts.viewportWidth  * 0.85;
    const cy        = opts.viewportHeight / 2;
    const spineStep = (opts.nodeWidth + 24) * Math.max(opts.spacing, 1);
    const branchLen = (opts.nodeWidth + 16) * Math.max(opts.spacing, 1);
    const subStep   = (opts.nodeHeight + 14) * Math.max(opts.spacing, 1);

    // Root at right
    positions.set(rootId, { x: cx, y: cy });

    // Spine extends leftward
    const spineStartX = cx - spineStep;

    children.forEach((cid, i) => {
      if (!nodes[cid]) return;
      const child    = nodes[cid];
      const spineX   = spineStartX - i * spineStep;
      const isTop    = i % 2 === 0;
      // 45-degree branch
      const branchY  = cy + (isTop ? -branchLen : branchLen);

      positions.set(cid, { x: spineX, y: branchY });

      // Sub-branches extend further from spine, stacked
      const subChildren = child.children ?? [];
      subChildren.forEach((sid, j) => {
        if (!nodes[sid]) return;
        const offset = (j - (subChildren.length - 1) / 2) * subStep;
        positions.set(sid, {
          x: spineX - branchLen * 0.7,
          y: branchY + (isTop ? -1 : 1) * (branchLen * 0.3 + offset),
        });

        // Tertiary level — keep same x, stack vertically
        const tertiary = nodes[sid]?.children ?? [];
        tertiary.forEach((tid, k) => {
          if (!nodes[tid]) return;
          positions.set(tid, {
            x: spineX - branchLen * 1.4,
            y: branchY + (isTop ? -1 : 1) * (branchLen * 0.3 + offset) + k * subStep * 0.7,
          });
        });
      });
    });

    return positions;
  },
};
