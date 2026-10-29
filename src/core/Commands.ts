import { Command } from './UndoManager';
import { MinderNode } from './Node';

export interface CommandData {
  nodes: Map<string, MinderNode>;
  setNodes: (nodes: Map<string, MinderNode>) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export class AddNodeCommand implements Command {
  private parentId: string;
  private newNode: MinderNode | null = null;
  private data: CommandData;

  constructor(parentId: string, data: CommandData) {
    this.parentId = parentId;
    this.data = data;
  }

  execute(): void {
    const parent = this.data.nodes.get(this.parentId);
    if (!parent) return;

    const newNode = new MinderNode(
      'New',
      {
        x: parent.position.x + 50,
        y: parent.position.y + 100
      },
      parent
    );

    parent.addChild(newNode);
    this.data.nodes.set(newNode.id, newNode);
    this.newNode = newNode;

    this.data.setNodes(new Map(this.data.nodes));
    this.data.setSelectedId(newNode.id);
  }

  undo(): void {
    if (!this.newNode) return;

    const parent = this.newNode.parent;
    if (parent) {
      parent.removeChild(this.newNode);
    }
    this.data.nodes.delete(this.newNode.id);

    this.data.setNodes(new Map(this.data.nodes));
    this.data.setSelectedId(null);
  }

  redo(): void {
    this.execute();
  }

  getName(): string {
    return 'Add Node';
  }
}

export class DeleteNodeCommand implements Command {
  private nodeId: string;
  private nodeData: MinderNode | null = null;
  private parentData: MinderNode | null = null;
  private data: CommandData;

  constructor(nodeId: string, data: CommandData) {
    this.nodeId = nodeId;
    this.data = data;
  }

  execute(): void {
    const node = this.data.nodes.get(this.nodeId);
    if (!node || !node.parent) return;

    const parent = node.parent;

    // Store data for undo
    this.nodeData = node;
    this.parentData = parent;

    parent.removeChild(node);
    this.data.nodes.delete(node.id);

    this.data.setNodes(new Map(this.data.nodes));
    this.data.setSelectedId(null);
  }

  undo(): void {
    if (!this.nodeData || !this.parentData) return;

    const node = this.nodeData;
    const parent = this.parentData;

    parent.addChild(node);
    this.data.nodes.set(node.id, node);

    this.data.setNodes(new Map(this.data.nodes));
    this.data.setSelectedId(node.id);
  }

  redo(): void {
    this.execute();
  }

  getName(): string {
    return 'Delete Node';
  }
}

export class EditNodeCommand implements Command {
  private nodeId: string;
  private oldText: string;
  private newText: string;
  private data: CommandData;

  constructor(nodeId: string, oldText: string, newText: string, data: CommandData) {
    this.nodeId = nodeId;
    this.oldText = oldText;
    this.newText = newText;
    this.data = data;
  }

  execute(): void {
    const node = this.data.nodes.get(this.nodeId);
    if (!node) return;

    node.text = this.newText;
    this.data.setNodes(new Map(this.data.nodes));
  }

  undo(): void {
    const node = this.data.nodes.get(this.nodeId);
    if (!node) return;

    node.text = this.oldText;
    this.data.setNodes(new Map(this.data.nodes));
  }

  redo(): void {
    this.execute();
  }

  getName(): string {
    return 'Edit Node';
  }
}

export class MoveNodeCommand implements Command {
  private nodeId: string;
  private oldPosition: { x: number; y: number };
  private newPosition: { x: number; y: number };
  private data: CommandData;

  constructor(
    nodeId: string,
    oldPosition: { x: number; y: number },
    newPosition: { x: number; y: number },
    data: CommandData
  ) {
    this.nodeId = nodeId;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
    this.data = data;
  }

  execute(): void {
    const node = this.data.nodes.get(this.nodeId);
    if (!node) return;

    node.position.x = this.newPosition.x;
    node.position.y = this.newPosition.y;
    this.data.setNodes(new Map(this.data.nodes));
  }

  undo(): void {
    const node = this.data.nodes.get(this.nodeId);
    if (!node) return;

    node.position.x = this.oldPosition.x;
    node.position.y = this.oldPosition.y;
    this.data.setNodes(new Map(this.data.nodes));
  }

  redo(): void {
    this.execute();
  }

  getName(): string {
    return 'Move Node';
  }
}
