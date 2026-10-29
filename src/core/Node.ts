export interface Point {
  x: number;
  y: number;
}

export enum NodeShape {
  Rectangle = 'rectangle',
  Circle = 'circle',
  RoundedRectangle = 'rounded'
}

export interface NodeStyle {
  color: string;
  backgroundColor: string;
  shape: NodeShape;
  fontSize: number;
  fontFamily: string;
}

export class MinderNode {
  id: string;
  text: string;
  position: Point;
  style: NodeStyle;
  children: MinderNode[];
  parent: MinderNode | null;
  notes: string;
  collapsed: boolean;
  order: number;
  selected: boolean;

  constructor(
    text: string,
    position: Point = { x: 0, y: 0 },
    parent: MinderNode | null = null,
    style?: Partial<NodeStyle>
  ) {
    this.id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.text = text;
    this.position = position;
    this.parent = parent;
    this.children = [];
    this.notes = '';
    this.collapsed = false;
    this.order = 0;
    this.selected = false;

    this.style = {
      color: style?.color || '#000000',
      backgroundColor: style?.backgroundColor || '#ffffff',
      shape: style?.shape || NodeShape.Rectangle,
      fontSize: style?.fontSize || 14,
      fontFamily: style?.fontFamily || 'Arial, sans-serif'
    };
  }

  addChild(node: MinderNode): void {
    node.parent = this;
    node.order = this.children.length;
    this.children.push(node);
  }

  removeChild(node: MinderNode): void {
    const index = this.children.findIndex(child => child.id === node.id);
    if (index !== -1) {
      this.children.splice(index, 1);
      node.parent = null;
    }
  }

  toJSON(): any {
    return {
      id: this.id,
      text: this.text,
      position: this.position,
      style: this.style,
      children: this.children.map(child => child.toJSON()),
      notes: this.notes,
      collapsed: this.collapsed,
      order: this.order
    };
  }
}
