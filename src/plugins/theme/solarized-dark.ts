import type { ThemePlugin } from '../types';

export const SolarizedDarkTheme: ThemePlugin = {
  meta: {
    id: 'solarized-dark',
    name: 'Solarisé sombre',
    description: 'Un bleu pétrole profond avec des accents chauds et contrastés.',
    type: 'theme',
    version: '1.0.0',
    author: 'minder-team',
  },
  isDark: true,
  getColors() {
    return {
      canvasBackground: '#073642',
      nodeFill: '#0b414d',
      nodeBorder: '#35616a',
      nodeText: '#c4d2cc',
      nodeSelected: '#5ab4dc',
      dotGrid: '#164752',
      mutedText: '#8ba5a5',
      palette: ['#f07178', '#f28c45', '#d8b456', '#a8bd45', '#5ab4dc', '#9c8bd8', '#e078a5', '#55b6a8'],
    };
  },
};
