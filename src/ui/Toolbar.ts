export class Toolbar {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
      <button id="undo">↶ Undo</button>
      <button id="redo">↷ Redo</button>
      <button id="add-root-node">+ Root Node</button>
      <button id="delete">🗑 Delete</button>
      <button id="export">📥 Export</button>
      <button id="layout-tree">🌳 Tree</button>
      <button id="zoom-in">🔍+</button>
      <button id="zoom-out">🔍−</button>
    `;
    this.container.appendChild(toolbar);
  }

  onUndo(callback: () => void): void {
    document.getElementById('undo')?.addEventListener('click', callback);
  }

  onRedo(callback: () => void): void {
    document.getElementById('redo')?.addEventListener('click', callback);
  }

  onAddRootNode(callback: () => void): void {
    document.getElementById('add-root-node')?.addEventListener('click', callback);
  }

  onDelete(callback: () => void): void {
    document.getElementById('delete')?.addEventListener('click', callback);
  }

  onExport(callback: () => void): void {
    document.getElementById('export')?.addEventListener('click', callback);
  }

  onLayoutTree(callback: () => void): void {
    document.getElementById('layout-tree')?.addEventListener('click', callback);
  }

  onZoomIn(callback: () => void): void {
    document.getElementById('zoom-in')?.addEventListener('click', callback);
  }

  onZoomOut(callback: () => void): void {
    document.getElementById('zoom-out')?.addEventListener('click', callback);
  }
}
