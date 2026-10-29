import { describe, expect, it } from 'vitest';
import { applyTextFormat, clampTextFormats, textFormatAt, textFormatSegments } from './text-formatting';

describe('text formatting ranges', () => {
  it('applies a style to only the selected characters', () => {
    const formats = applyTextFormat(undefined, 2, 5, { textBold: true, textColor: '#123456' }, 8);

    expect(formats).toEqual([{ start: 2, end: 5, textBold: true, textColor: '#123456' }]);
    expect(textFormatAt(formats, 1)).toEqual({});
    expect(textFormatAt(formats, 3)).toEqual({ textBold: true, textColor: '#123456' });
  });

  it('splits and preserves neighboring styles when the selection overlaps them', () => {
    const initial = [{ start: 1, end: 6, textBold: true }];
    const updated = applyTextFormat(initial, 3, 5, { textItalic: true }, 8);

    expect(updated).toEqual([
      { start: 1, end: 3, textBold: true },
      { start: 3, end: 5, textBold: true, textItalic: true },
      { start: 5, end: 6, textBold: true },
    ]);
  });

  it('removes a style only from the selected range', () => {
    const initial = [{ start: 0, end: 7, textUnderline: true }];
    const updated = applyTextFormat(initial, 2, 4, { textUnderline: undefined }, 7);

    expect(updated).toEqual([
      { start: 0, end: 2, textUnderline: true },
      { start: 4, end: 7, textUnderline: true },
    ]);
  });

  it('returns text segments with their applicable styles', () => {
    const formats = [{ start: 1, end: 3, textBold: true }];

    expect(textFormatSegments('abcd', 0, 4, formats)).toEqual([
      { text: 'a', start: 0, end: 1, style: {} },
      { text: 'bc', start: 1, end: 3, style: { textBold: true } },
      { text: 'd', start: 3, end: 4, style: {} },
    ]);
  });

  it('keeps edited styles in bounds when text is shortened', () => {
    expect(clampTextFormats([
      { start: 0, end: 5, textBold: true },
      { start: 6, end: 8, textItalic: true },
    ], 4)).toEqual([
      { start: 0, end: 4, textBold: true },
    ]);
  });
});
