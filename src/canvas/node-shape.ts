export function parallelogramPath(width: number, height: number): string {
  const skew = Math.min(height * 0.4, width * 0.16);
  return `M${skew},0 H${width} L${width - skew},${height} H0 Z`;
}

export function hexagonPath(width: number, height: number): string {
  const inset = Math.min(width * 0.16, height * 0.38);
  return `M${inset},0 H${width - inset} L${width},${height / 2} L${width - inset},${height} H${inset} L0,${height / 2} Z`;
}

export function customNodeShapePath(
  shape: 'parallelogram' | 'hexagon',
  width: number,
  height: number,
): string {
  return shape === 'hexagon' ? hexagonPath(width, height) : parallelogramPath(width, height);
}
