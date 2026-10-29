import type { MindNode } from '../types';
import type { NodeShapeAttrs } from './types';

type NodeShapeOverrides = Pick<MindNode, 'borderRadius' | 'borderWidth' | 'borderStyle' | 'nodeShape'>;

export function applyNodeShapeOverrides(
  node: NodeShapeOverrides,
  baseShape: NodeShapeAttrs,
): NodeShapeAttrs {
  const isMinimalLine = node.nodeShape
    ? node.nodeShape === 'underline'
    : baseShape.strokeDasharray === 'none-leaf';
  const baseDash = baseShape.strokeDasharray === 'none-leaf' ? undefined : baseShape.strokeDasharray;
  const strokeDasharray = isMinimalLine
    ? 'none-leaf'
    : node.borderStyle === 'dashed'
      ? '6,4'
      : node.borderStyle === 'dotted'
        ? '2,2'
        : node.borderStyle === 'solid'
          ? undefined
          : baseDash;

  const shapeOverride = node.nodeShape === 'parallelogram' || node.nodeShape === 'hexagon'
    ? node.nodeShape
    : undefined;
  const radius = node.nodeShape === 'rectangle'
    ? 0
    : node.nodeShape === 'capsule'
      ? 20
      : node.nodeShape === 'rounded'
        ? 12
        : node.borderRadius;

  return {
    ...baseShape,
    rx: radius ?? baseShape.rx,
    ry: radius ?? baseShape.ry,
    strokeWidth: node.borderWidth ?? baseShape.strokeWidth,
    strokeDasharray,
    shape: shapeOverride ?? (node.nodeShape ? undefined : baseShape.shape),
    ...(isMinimalLine ? { fill: 'transparent', stroke: 'transparent' } : {}),
  };
}
