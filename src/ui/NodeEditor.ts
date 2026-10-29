import { MinderNode } from '../core/Node';

export class NodeEditor {
  private overlay: HTMLElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'node-editor-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    document.body.appendChild(this.overlay);
  }

  editNode(node: MinderNode, callback: (newText: string) => void): void {
    this.overlay.style.display = 'flex';

    const editor = document.createElement('div');
    editor.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 300px;
    `;

    editor.innerHTML = `
      <h3>Éditer le nœud</h3>
      <input type="text" id="node-text" value="${node.text}"
             style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;">
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel" style="padding: 8px 16px;">Annuler</button>
        <button id="save" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px;">Sauvegarder</button>
      </div>
    `;

    this.overlay.appendChild(editor);

    const saveBtn = editor.querySelector('#save');
    const cancelBtn = editor.querySelector('#cancel');
    const input = editor.querySelector('#node-text') as HTMLInputElement;

    const save = () => {
      callback(input.value);
      this.closeEditor();
    };

    saveBtn?.addEventListener('click', save);
    cancelBtn?.addEventListener('click', () => this.closeEditor());

    input.focus();
    input.select();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        this.closeEditor();
      }
    });

    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) {
        this.closeEditor();
      }
    };
  }

  private closeEditor(): void {
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = '';
  }
}
