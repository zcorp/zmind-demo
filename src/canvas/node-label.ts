export function wrapNodeLabel(text: string, maxCharacters: number): [string, string] | null {
  const limit = Math.max(1, Math.floor(maxCharacters));
  if (text.length <= limit) return null;

  const candidate = text.slice(0, limit + 1).match(/\s+\S*$/)?.index ?? -1;
  const breakAt = candidate > 0 ? candidate : limit;
  const firstLine = text.slice(0, breakAt).trim();
  const remainder = text.slice(breakAt).trim();
  const secondLine = remainder.length > limit
    ? `${remainder.slice(0, limit - 1)}…`
    : remainder;

  return [firstLine, secondLine];
}

export function wrapNodeLabelRanges(
  text: string,
  maxCharacters: number,
): Array<{ text: string; start: number; end: number }> {
  const wrapped = wrapNodeLabel(text, maxCharacters);
  if (!wrapped) return [{ text, start: 0, end: text.length }];

  const [firstLine, secondLine] = wrapped;
  const firstStart = text.indexOf(firstLine);
  const firstEnd = firstStart + firstLine.length;
  const secondStart = text.indexOf(secondLine, firstEnd);
  const lineStart = secondStart >= 0
    ? secondStart
    : text.slice(firstEnd).search(/\S/) + firstEnd;
  const sourceLine = text.slice(lineStart);
  const visibleLine = sourceLine.length > maxCharacters
    ? `${sourceLine.slice(0, maxCharacters - 1)}…`
    : sourceLine;

  return [
    { text: firstLine, start: firstStart, end: firstEnd },
    { text: visibleLine, start: lineStart, end: lineStart + visibleLine.replace(/…$/, '').length },
  ];
}
