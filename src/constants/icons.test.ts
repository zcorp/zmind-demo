import { describe, expect, it } from 'vitest';
import { ICON_CATEGORIES, ICON_LABELS, NODE_ICON_COMPONENTS } from './icons';

describe('node icon choices', () => {
  it('organizes contextual icons once with a readable name and Material icon', () => {
    const selectableIcons = Object.values(ICON_CATEGORIES).flat();
    const allIconIds = Object.keys(NODE_ICON_COMPONENTS);

    expect(new Set(selectableIcons).size).toBe(selectableIcons.length);
    expect([...selectableIcons].sort()).toEqual([
      'book', 'calendar', 'chart', 'check', 'clock', 'code', 'flag',
      'globe', 'heart', 'idea', 'info', 'lock', 'mail', 'person', 'pin',
      'question', 'star', 'target', 'warning',
    ]);
    for (const icon of selectableIcons) {
      expect(ICON_LABELS[icon]).toBeTruthy();
      expect(NODE_ICON_COMPONENTS[icon]).toBeTruthy();
    }
    for (const icon of allIconIds) {
      expect(ICON_LABELS[icon as keyof typeof ICON_LABELS]).toBeTruthy();
      if (icon !== 'none') expect(NODE_ICON_COMPONENTS[icon as keyof typeof NODE_ICON_COMPONENTS]).toBeTruthy();
    }
  });
});
