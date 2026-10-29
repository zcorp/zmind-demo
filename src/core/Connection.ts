import { MinderNode } from './Node';

export interface ConnectionStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity?: number;
}

export const DEFAULT_CONNECTION_STYLE: ConnectionStyle = {
  stroke: '#4f8ef7',
  strokeWidth: 2,
  opacity: 0.6,
};

export class Connection {
  id: string;
  from: MinderNode;
  to: MinderNode;
  style: ConnectionStyle;
  label?: string;

  constructor(from: MinderNode, to: MinderNode, style?: Partial<ConnectionStyle>) {
    this.id = `conn_${from.id}_${to.id}`;
    this.from = from;
    this.to = to;
    this.style = { ...DEFAULT_CONNECTION_STYLE, ...style };
  }

  /** Generate a cubic Bézier SVG path between two nodes */
  getPath(): string {
    const x1 = this.from.position.x;
    const y1 = this.from.position.y;
    const x2 = this.to.position.x;
    const y2 = this.to.position.y;
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }

  toJSON(): object {
    return {
      id: this.id,
      fromId: this.from.id,
      toId: this.to.id,
      style: this.style,
      label: this.label,
    };
  }
}
