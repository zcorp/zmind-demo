import type { ThemePlugin } from '../types';

export const SolarizedLightTheme: ThemePlugin = {
  meta: {
    id: 'solarized-light',
    name: 'Solarisé clair',
    description: 'Des tons ivoire et ardoise, ponctués de couleurs solaires.',
    type: 'theme',
    version: '1.0.0',
    author: 'minder-team',
  },
  isDark: false,
  getColors() {
    return {
      canvasBackground: '#fdf6e3',
      nodeFill: '#fffaf0',
      nodeBorder: '#d8cfb4',
      nodeText: '#53666d',
      nodeSelected: '#268bd2',
      dotGrid: '#e7dec7',
      mutedText: '#78878a',
      palette: ['#dc322f', '#cb4b16', '#b58900', '#859900', '#268bd2', '#6c71c4', '#d33682', '#2aa198'],
    };
  },
};
