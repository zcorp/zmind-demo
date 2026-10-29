import { MinderNode } from './Node';
import { hierarchy, tree, HierarchyNode } from 'd3-hierarchy';

export enum LayoutType {
  Tree = 'tree',
  TreeLeft = 'tree-left',
  TreeRight = 'tree-right',
  Radial = 'radial'
}

export interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  spacing: number;
  direction: LayoutType;
}

export class Layout {
  private options: LayoutOptions;

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = {
      nodeWidth: options.nodeWidth || 120,
      nodeHeight: options.nodeHeight || 40,
      spacing: options.spacing || 10,
      direction: options.direction || LayoutType.Tree
    };
  }

  applyLayout(rootNode: MinderNode): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    // Convertir en hierarchy D3
    const root = hierarchy<any>(rootNode, (d: any) => d.children);

    // Appliquer le layout approprié
    switch (this.options.direction) {
      case LayoutType.Tree:
        return this.applyTreeLayout(root, positions);
      case LayoutType.TreeLeft:
        return this.applyTreeLeftLayout(root, positions);
      case LayoutType.TreeRight:
        return this.applyTreeRightLayout(root, positions);
      case LayoutType.Radial:
        return this.applyRadialLayout(root, positions);
      default:
        return this.applyTreeLayout(root, positions);
    }
  }

  private applyTreeLayout(
    root: HierarchyNode<any>,
    positions: Map<string, { x: number; y: number }>
  ): Map<string, { x: number; y: number }> {
    const nodeSpacingX = this.options.nodeWidth * 1.2;
    const nodeSpacingY = this.options.nodeHeight * 2.5;

    const layout = tree<any>()
      .nodeSize([nodeSpacingX, nodeSpacingY])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));

    const treeLayout = layout(root);

    treeLayout.descendants().forEach(node => {
      positions.set(node.data.id, { x: node.x, y: node.y });
    });

    return positions;
  }

  /** Left-to-right horizontal tree */
  private applyTreeLeftLayout(
    root: HierarchyNode<any>,
    positions: Map<string, { x: number; y: number }>
  ): Map<string, { x: number; y: number }> {
    const nodeSpacingX = this.options.nodeHeight * 2.5;
    const nodeSpacingY = this.options.nodeWidth * 1.2;

    const layout = tree<any>()
      .nodeSize([nodeSpacingY, nodeSpacingX])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));

    const treeLayout = layout(root);

    // Rotate 90° counter-clockwise: (x, y) → (-y, x)
    treeLayout.descendants().forEach(node => {
      positions.set(node.data.id, {
        x: -node.y,
        y: node.x,
      });
    });

    return positions;
  }

  /** Right-to-left horizontal tree */
  private applyTreeRightLayout(
    root: HierarchyNode<any>,
    positions: Map<string, { x: number; y: number }>
  ): Map<string, { x: number; y: number }> {
    const nodeSpacingX = this.options.nodeHeight * 2.5;
    const nodeSpacingY = this.options.nodeWidth * 1.2;

    const layout = tree<any>()
      .nodeSize([nodeSpacingY, nodeSpacingX])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));

    const treeLayout = layout(root);

    // Rotate 90° clockwise: (x, y) → (y, x)
    treeLayout.descendants().forEach(node => {
      positions.set(node.data.id, {
        x: node.y,
        y: node.x,
      });
    });

    return positions;
  }

  private applyRadialLayout(
    root: HierarchyNode<any>,
    positions: Map<string, { x: number; y: number }>
  ): Map<string, { x: number; y: number }> {
    const radiusStep = 160;

    // Use d3 tree layout in [0, 2π] space first to get angular positions
    const layout = tree<any>().size([2 * Math.PI, 1]);
    const treeLayout = layout(root);

    treeLayout.descendants().forEach(node => {
      // node.x is in [0, 2π], node.y is depth [0, 1]
      const angle = node.x - Math.PI / 2; // rotate so root is at top
      const radius = node.depth * radiusStep;

      positions.set(node.data.id, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    });

    return positions;
  }
}
