// ─────────────────────────────────────────────────────────────────────────────
// src/canvas/edgeGeometry.ts
// Pure functions for edge port selection and Bézier path generation.
// ─────────────────────────────────────────────────────────────────────────────

import { NODE_W, NODE_H } from './constants';

/**
 * Picks the best anchor point on each node based on relative position.
 * Returns (x1,y1) on the parent and (x2,y2) on the child.
 */
export function edgePorts(
  px: number, py: number,
  cx: number, cy: number,
  pW = NODE_W, pH = NODE_H,
  cW = NODE_W, cH = NODE_H,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = cx - px, dy = cy - py;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  const BIAS = 1.4;

  if (absDx > absDy * BIAS) {
    return dx > 0
      ? { x1: px + pW / 2, y1: py, x2: cx - cW / 2, y2: cy }
      : { x1: px - pW / 2, y1: py, x2: cx + cW / 2, y2: cy };
  }
  if (absDy > absDx * BIAS) {
    return dy > 0
      ? { x1: px, y1: py + pH / 2, x2: cx, y2: cy - cH / 2 }
      : { x1: px, y1: py - pH / 2, x2: cx, y2: cy + cH / 2 };
  }
  return {
    x1: px + (dx > 0 ? pW / 2 : -pW / 2), y1: py + (dy > 0 ? pH / 4 : -pH / 4),
    x2: cx + (dx > 0 ? -cW / 2 : cW / 2),  y2: cy + (dy > 0 ? -cH / 4 : cH / 4),
  };
}

/**
 * Generates a smooth S-shaped cubic Bézier path between two points,
 * adapting control handles to the connection direction.
 */
export function smartBezier(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  if (Math.abs(dx) >= Math.abs(dy) * 0.7) {
    const cx = Math.max(Math.abs(dx) * 0.45, 50);
    const s  = dx >= 0 ? 1 : -1;
    return `M${x1},${y1} C${x1 + s * cx},${y1} ${x2 - s * cx},${y2} ${x2},${y2}`;
  }
  const cy = Math.max(Math.abs(dy) * 0.45, 40);
  const s  = dy >= 0 ? 1 : -1;
  return `M${x1},${y1} C${x1},${y1 + s * cy} ${x2},${y2 - s * cy} ${x2},${y2}`;
}
