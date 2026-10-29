export class ExportDialog {
  static show(callback: (format: 'json' | 'svg' | 'png', name: string) => void): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 400px;
    `;

    dialog.innerHTML = `
      <h3 style="margin-bottom: 20px;">Exporter la mind map</h3>

      <div style="margin-bottom: 15px;">
        <label>Format:</label>
        <select id="export-format" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="json">JSON (.minder)</option>
          <option value="svg">SVG Image</option>
          <option value="png">PNG Image</option>
        </select>
      </div>

      <div style="margin-bottom: 20px;">
        <label>Nom du fichier:</label>
        <input type="text" id="export-filename" value="mind-map"
               style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;">
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="export-cancel" style="padding: 8px 16px;">Annuler</button>
        <button id="export-confirm" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px;">Exporter</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const confirmBtn = dialog.querySelector('#export-confirm');
    const cancelBtn = dialog.querySelector('#export-cancel');

    const confirm = () => {
      const format = (dialog.querySelector('#export-format') as HTMLSelectElement).value as 'json' | 'svg' | 'png';
      const filename = (dialog.querySelector('#export-filename') as HTMLInputElement).value;
      callback(format, filename);
      document.body.removeChild(overlay);
    };

    confirmBtn?.addEventListener('click', confirm);
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }
}

export class PreferencesDialog {
  static show(
    currentTheme: string,
    onSave: (theme: string) => void
  ): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 400px;
    `;

    dialog.innerHTML = `
      <h3 style="margin-bottom: 20px;">Préférences</h3>

      <div style="margin-bottom: 15px;">
        <label>Thème:</label>
        <select id="theme-select" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Clair</option>
          <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Sombre</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="prefs-cancel" style="padding: 8px 16px;">Annuler</button>
        <button id="prefs-save" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 4px;">Sauvegarder</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const saveBtn = dialog.querySelector('#prefs-save');
    const cancelBtn = dialog.querySelector('#prefs-cancel');

    saveBtn?.addEventListener('click', () => {
      const theme = (dialog.querySelector('#theme-select') as HTMLSelectElement).value;
      onSave(theme);
      document.body.removeChild(overlay);
    });

    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }
}
