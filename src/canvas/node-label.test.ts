import { describe, expect, it } from 'vitest';
import { wrapNodeLabel, wrapNodeLabelRanges } from './node-label';

describe('wrapNodeLabel', () => {
  it('wraps at a word boundary even when the first word is short', () => {
    expect(wrapNodeLabel('Idée principale', 13)).toEqual(['Idée', 'principale']);
  });

  it('leaves short labels on one line and truncates an overlong second line', () => {
    expect(wrapNodeLabel('Idée', 8)).toBeNull();
    expect(wrapNodeLabel('Une extraordinairement longue', 12)).toEqual(['Une', 'extraordina…']);
  });

  it('keeps source offsets for wrapped text so formatting ranges survive line breaks', () => {
    expect(wrapNodeLabelRanges('Idée principale', 8)).toEqual([
      { text: 'Idée', start: 0, end: 4 },
      { text: 'princip…', start: 5, end: 12 },
    ]);
  });
});
