import { MinderNode } from './Node';

export class Helpers {
  /**
   * Deep clone a node and all its children
   */
  static cloneNode(node: MinderNode): MinderNode {
    const cloned = new MinderNode(
      node.text,
      { ...node.position },
      node.parent
    );
    cloned.id = node.id;
    cloned.collapsed = node.collapsed;
    cloned.order = node.order;
    cloned.selected = node.selected;
    cloned.style = { ...node.style };
    cloned.notes = node.notes;

    // Clone children recursively
    cloned.children = node.children.map(child => {
      const childClone = this.cloneNode(child);
      childClone.parent = cloned;
      return childClone;
    });

    return cloned;
  }

  /**
   * Find a node by ID in the tree
   */
  static findNodeById(root: MinderNode, id: string): MinderNode | null {
    if (root.id === id) return root;

    for (const child of root.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }

    return null;
  }

  /**
   * Get all descendant nodes (recursive)
   */
  static getAllDescendants(node: MinderNode): MinderNode[] {
    const descendants: MinderNode[] = [];

    for (const child of node.children) {
      descendants.push(child);
      if (!child.collapsed) {
        descendants.push(...this.getAllDescendants(child));
      }
    }

    return descendants;
  }

  /**
   * Get all ancestor nodes (parent chain)
   */
  static getAllAncestors(node: MinderNode): MinderNode[] {
    const ancestors: MinderNode[] = [];
    let current = node.parent;

    while (current) {
      ancestors.push(current);
      current = current.parent;
    }

    return ancestors;
  }

  /**
   * Check if a node is visible (not under a collapsed ancestor)
   */
  static isNodeVisible(node: MinderNode): boolean {
    let current: MinderNode | null = node;

    while (current) {
      if (current.parent && current.parent.collapsed) {
        return false;
      }
      current = current.parent;
    }

    return true;
  }

  /**
   * Calculate bounding box for a set of nodes
   */
  static calculateBounds(nodes: MinderNode[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } {
    if (nodes.length === 0) {
      return {
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        width: 0, height: 0, centerX: 0, centerY: 0
      };
    }

    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y));

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    return {
      minX, maxX, minY, maxY, width, height, centerX, centerY
    };
  }

  /**
   * Center a set of nodes in a viewport
   */
  static centerNodes(
    nodes: MinderNode[],
    viewportWidth: number,
    viewportHeight: number
  ): MinderNode[] {
    const bounds = this.calculateBounds(nodes);
    const offsetX = viewportWidth / 2 - bounds.centerX;
    const offsetY = viewportHeight / 2 - bounds.centerY;

    return nodes.map(node => {
      const cloned = this.cloneNode(node);
      cloned.position.x += offsetX;
      cloned.position.y += offsetY;
      return cloned;
    });
  }

  /**
   * Export tree to plain object structure
   */
  static toPlainObject(root: MinderNode): any {
    const obj: any = {
      id: root.id,
      text: root.text,
      position: { ...root.position },
      style: { ...root.style },
      collapsed: root.collapsed,
      order: root.order,
      notes: root.notes,
      children: []
    };

    obj.children = root.children.map(child => this.toPlainObject(child));

    return obj;
  }

  /**
   * Parse plain object back to MinderNode tree
   */
  static fromPlainObject(obj: any, parent: MinderNode | null = null): MinderNode {
    const node = new MinderNode(
      obj.text,
      { ...obj.position },
      parent
    );
    node.id = obj.id;
    node.collapsed = obj.collapsed || false;
    node.order = obj.order || 0;
    node.notes = obj.notes || '';
    node.style = { ...obj.style };
    node.selected = false;

    if (obj.children) {
      node.children = obj.children.map((childObj: any) =>
        this.fromPlainObject(childObj, node)
      );
    }

    return node;
  }

  /**
   * Generate unique ID for new nodes
   */
  static generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Traverse the entire tree and execute a callback on each node
   */
  static traverse(
    root: MinderNode,
    callback: (node: MinderNode, depth: number) => void,
    depth: number = 0
  ): void {
    callback(root, depth);
    for (const child of root.children) {
      this.traverse(child, callback, depth + 1);
    }
  }

  /**
   * Flatten tree to array (depth-first)
   */
  static flatten(root: MinderNode): MinderNode[] {
    const result: MinderNode[] = [];
    this.traverse(root, (node) => result.push(node));
    return result;
  }

  /**
   * Count total nodes in tree
   */
  static countNodes(root: MinderNode): number {
    let count = 1; // Count self
    for (const child of root.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  /**
   * Count visible nodes (respecting collapsed state)
   */
  static countVisibleNodes(root: MinderNode): number {
    let count = 1; // Count self
    if (!root.collapsed) {
      for (const child of root.children) {
        count += this.countVisibleNodes(child);
      }
    }
    return count;
  }

  /**
   * Find the deepest level in the tree
   */
  static getMaxDepth(root: MinderNode): number {
    if (root.children.length === 0) return 0;

    const childDepths = root.children.map(child => this.getMaxDepth(child));
    return 1 + Math.max(...childDepths);
  }

  /**
   * Sort children by order property
   */
  static sortChildrenByOrder(node: MinderNode): void {
    node.children.sort((a, b) => a.order - b.order);
    node.children.forEach(child => this.sortChildrenByOrder(child));
  }
}
