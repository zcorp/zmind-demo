import type { ThemePlugin } from '../types';

export const MinderLightTheme: ThemePlugin = {
  meta: {
    id: 'minder-light',
    name: 'Classique clair',
    description: 'Un canevas clair et sobre, avec des branches aux couleurs franches.',
    type: 'theme',
    version: '1.0.0',
    author: 'minder-team',
  },
  isDark: false,
  getColors() {
    return {
      canvasBackground: '#ffffff',
      nodeFill: '#ffffff',
      nodeBorder: '#b8bec7',
      nodeText: '#24272c',
      nodeSelected: '#3584e4',
      dotGrid: '#e5e8ec',
      mutedText: '#737b86',
      palette: ['#c6262e', '#e87520', '#d2a400', '#4b8f32', '#2878c7', '#7550a1', '#76533d', '#44484f'],
    };
  },
};
