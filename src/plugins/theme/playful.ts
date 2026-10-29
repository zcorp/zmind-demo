import type { ThemePlugin } from '../types';

export const PlayfulTheme: ThemePlugin = {
  meta: {
    id: 'playful',
    name: 'Couleurs vives',
    description: 'Un fond doux et des couleurs de branche lumineuses pour des cartes accueillantes.',
    type: 'theme',
    version: '1.0.0',
    author: 'minder-team',
  },
  isDark: false,
  getColors() {
    return {
      canvasBackground: '#fffaf4',
      nodeFill: '#ffffff',
      nodeBorder: '#eadfce',
      nodeText: '#2d2943',
      nodeSelected: '#ff795e',
      dotGrid: '#eadfce',
      mutedText: '#827b91',
      palette: ['#6941c6', '#117a65', '#c44d64', '#a65e00', '#3569b1', '#884d9e'],
    };
  },
};
