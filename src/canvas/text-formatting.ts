import type { NodeTextFormat } from '../types';

type TextStyle = Omit<NodeTextFormat, 'start' | 'end'>;

const STYLE_KEYS: (keyof TextStyle)[] = [
  'fontFamily',
  'fontSize',
  'textBold',
  'textItalic',
  'textUnderline',
  'textStrikethrough',
  'textColor',
  'textBackgroundColor',
];

export function applyTextFormat(
  formats: readonly NodeTextFormat[] | undefined,
  start: number,
  end: number,
  changes: Partial<TextStyle>,
  textLength: number,
): NodeTextFormat[] {
  const rangeStart = Math.max(0, Math.min(textLength, Math.floor(start)));
  const rangeEnd = Math.max(rangeStart, Math.min(textLength, Math.floor(end)));
  if (rangeStart === rangeEnd || textLength <= 0) return [...(formats ?? [])];

  const boundaries = new Set([0, textLength, rangeStart, rangeEnd]);
  for (const format of formats ?? []) {
    boundaries.add(Math.max(0, Math.min(textLength, format.start)));
    boundaries.add(Math.max(0, Math.min(textLength, format.end)));
  }
  const orderedBoundaries = [...boundaries].sort((a, b) => a - b);
  const result: NodeTextFormat[] = [];

  for (let index = 0; index < orderedBoundaries.length - 1; index++) {
    const segmentStart = orderedBoundaries[index];
    const segmentEnd = orderedBoundaries[index + 1];
    if (segmentStart === segmentEnd) continue;

    const midpoint = segmentStart + (segmentEnd - segmentStart) / 2;
    const existing = (formats ?? []).find(format => midpoint >= format.start && midpoint < format.end);
    const style: TextStyle = {};
    for (const key of STYLE_KEYS) {
      const shouldChange = midpoint >= rangeStart && midpoint < rangeEnd
        && Object.prototype.hasOwnProperty.call(changes, key);
      const value = shouldChange ? changes[key] : existing?.[key];
      if (value !== undefined) Object.assign(style, { [key]: value });
    }

    if (Object.keys(style).length === 0) continue;
    const previous = result[result.length - 1];
    if (previous && previous.end === segmentStart && sameStyle(previous, style)) {
      previous.end = segmentEnd;
    } else {
      result.push({ start: segmentStart, end: segmentEnd, ...style });
    }
  }

  return result;
}

export function textFormatAt(
  formats: readonly NodeTextFormat[] | undefined,
  position: number,
): TextStyle {
  const format = (formats ?? []).find(item => position >= item.start && position < item.end);
  if (!format) return {};
  const { start: _start, end: _end, ...style } = format;
  return style;
}

export function textFormatSegments(
  text: string,
  start: number,
  end: number,
  formats: readonly NodeTextFormat[] | undefined,
): Array<{ text: string; start: number; end: number; style: TextStyle }> {
  const boundaries = new Set([start, end]);
  for (const format of formats ?? []) {
    if (format.end > start && format.start < end) {
      boundaries.add(Math.max(start, format.start));
      boundaries.add(Math.min(end, format.end));
    }
  }
  const ordered = [...boundaries].sort((a, b) => a - b);
  return ordered.slice(0, -1).flatMap((segmentStart, index) => {
    const segmentEnd = ordered[index + 1];
    if (segmentEnd <= segmentStart) return [];
    return [{
      text: text.slice(segmentStart, segmentEnd),
      start: segmentStart,
      end: segmentEnd,
      style: textFormatAt(formats, segmentStart),
    }];
  });
}

export function clampTextFormats(
  formats: readonly NodeTextFormat[] | undefined,
  textLength: number,
): NodeTextFormat[] {
  return (formats ?? []).flatMap(format => {
    const start = Math.max(0, Math.min(textLength, format.start));
    const end = Math.max(start, Math.min(textLength, format.end));
    return end > start ? [{ ...format, start, end }] : [];
  });
}

function sameStyle(format: NodeTextFormat, style: TextStyle): boolean {
  return STYLE_KEYS.every(key => format[key] === style[key]);
}
