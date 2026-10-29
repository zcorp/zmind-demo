import type { BackgroundPlugin } from '../types';

export const PlainBackground: BackgroundPlugin = {
  meta: {
    id: 'plain',
    name: 'Fond uni',
    description: 'Un canevas sans motif, comme le fond classique de Minder.',
    type: 'background',
    version: '1.0.0',
    author: 'minder-team',
  },
  render: () => '',
};
