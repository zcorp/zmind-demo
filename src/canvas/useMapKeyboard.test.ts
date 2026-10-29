import { describe, expect, it } from 'vitest';
import { isSearchFocusShortcut } from './useMapKeyboard';

describe('search focus shortcut', () => {
  it('recognizes Ctrl+F and Cmd+F without depending on key case', () => {
    expect(isSearchFocusShortcut({ ctrlKey: true, metaKey: false, key: 'f' })).toBe(true);
    expect(isSearchFocusShortcut({ ctrlKey: false, metaKey: true, key: 'F' })).toBe(true);
  });

  it('does not claim unrelated keys or an unmodified F key', () => {
    expect(isSearchFocusShortcut({ ctrlKey: false, metaKey: false, key: 'f' })).toBe(false);
    expect(isSearchFocusShortcut({ ctrlKey: true, metaKey: false, key: 'g' })).toBe(false);
  });
});
