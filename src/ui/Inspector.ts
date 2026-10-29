import { MinderNode } from '../core/Node';

export class Inspector {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'inspector';
    this.container.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      width: 300px;
      height: 100%;
      background: var(--nodeBackground, #ffffff);
      border-left: 1px solid var(--nodeBorder, #cccccc);
      padding: 20px;
      overflow-y: auto;
      display: none;
    `;
    this.render();
  }

  show(node: MinderNode): void {
    this.container.style.display = 'block';
    this.update(node);
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  private render(): void {
    this.container.innerHTML = `
      <h3 style="margin-bottom: 20px;">Propriétés du nœud</h3>
      <div id="inspector-content">
        <p style="color: var(--secondaryText, #666);">Sélectionnez un nœud pour voir ses propriétés</p>
      </div>
    `;
  }

  private update(node: MinderNode): void {
    const content = this.container.querySelector('#inspector-content');
    if (!content) return;

    content.innerHTML = `
      <div style="margin-bottom: 15px;">
        <strong>Texte:</strong>
        <input type="text" value="${node.text}"
               style="width: 100%; padding: 6px; margin-top: 5px; border: 1px solid var(--nodeBorder); border-radius: 4px;"
               onchange="document.dispatchEvent(new CustomEvent('node-text-changed', { detail: { id: '${node.id}', text: this.value } ))">
      </div>

      <div style="margin-bottom: 15px;">
        <strong>Couleur du texte:</strong>
        <input type="color" value="${node.style.color}"
               style="width: 100%; height: 30px; margin-top: 5px; border: none;"
               onchange="document.dispatchEvent(new CustomEvent('node-color-changed', { detail: { id: '${node.id}', color: this.value } ))">
      </div>

      <div style="margin-bottom: 15px;">
        <strong>Couleur de fond:</strong>
        <input type="color" value="${node.style.backgroundColor}"
               style="width: 100%; height: 30px; margin-top: 5px; border: none;"
               onchange="document.dispatchEvent(new CustomEvent('node-bgcolor-changed', { detail: { id: '${node.id}', bgcolor: this.value } ))">
      </div>

      <div style="margin-bottom: 15px;">
        <strong>Notes:</strong>
        <textarea style="width: 100%; height: 100px; padding: 6px; margin-top: 5px; border: 1px solid var(--nodeBorder); border-radius: 4px; resize: vertical;"
                  onchange="document.dispatchEvent(new CustomEvent('node-notes-changed', { detail: { id: '${node.id}', notes: this.value } ))">${node.notes}</textarea>
      </div>

      <div style="margin-bottom: 15px;">
        <strong>Enfants:</strong> ${node.children.length}
      </div>

      <div style="margin-bottom: 15px;">
        <strong>Position:</strong> (${Math.round(node.position.x)}, ${Math.round(node.position.y)})
      </div>
    `;
  }
}
