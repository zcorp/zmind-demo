import type { ThemePlugin } from '../types';

export const MinderDarkTheme: ThemePlugin = {
  meta: {
    id: 'minder-dark',
    name: 'Classique sombre',
    description: 'Un fond graphite apaisé et des branches lumineuses.',
    type: 'theme',
    version: '1.0.0',
    author: 'minder-team',
  },
  isDark: true,
  getColors() {
    return {
      canvasBackground: '#292b30',
      nodeFill: '#33363d',
      nodeBorder: '#626873',
      nodeText: '#f1f3f5',
      nodeSelected: '#78b8f5',
      dotGrid: '#3b3e45',
      mutedText: '#a0a6af',
      palette: ['#f06a72', '#f28c4b', '#e2c34d', '#75bd69', '#62a6ed', '#b08be0', '#ce9a76', '#d2d5da'],
    };
  },
};
