export interface ThemeColors {
  background: string;
  nodeBackground: string;
  nodeForeground: string;
  nodeBorder: string;
  connectionStroke: string;
  text: string;
  secondaryText: string;
  accent: string;
}

export class Theme {
  name: string;
  colors: ThemeColors;
  isDark: boolean;

  constructor(name: string, isDark: boolean, colors: ThemeColors) {
    this.name = name;
    this.isDark = isDark;
    this.colors = colors;
  }

  static light(): Theme {
    return new Theme('light', false, {
      background: '#ffffff',
      nodeBackground: '#ffffff',
      nodeForeground: '#000000',
      nodeBorder: '#cccccc',
      connectionStroke: '#666666',
      text: '#000000',
      secondaryText: '#666666',
      accent: '#0066cc'
    });
  }

  static dark(): Theme {
    return new Theme('dark', true, {
      background: '#1e1e1e',
      nodeBackground: '#2d2d2d',
      nodeForeground: '#ffffff',
      nodeBorder: '#404040',
      connectionStroke: '#888888',
      text: '#ffffff',
      secondaryText: '#cccccc',
      accent: '#4da6ff'
    });
  }

  // Applique les variables CSS au document
  apply(): void {
    const root = document.documentElement;
    Object.entries(this.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    root.style.setProperty('--theme-name', this.name);
  }
}
