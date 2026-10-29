import { describe, expect, it } from 'vitest';
import type { NodeTextAttrs } from '../plugins/types';
import { createHarmonizedNodeFills, ensureReadableNodeText } from './color-contrast';

const text: NodeTextAttrs = {
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'sans-serif',
  fill: '#ffffff',
};

describe('ensureReadableNodeText', () => {
  it('switches to dark text when a light node fill makes white text unreadable', () => {
    expect(ensureReadableNodeText(text, '#fff9c4', '#ffffff').fill).toBe('#111111');
  });

  it('switches to light text when a dark node fill makes dark text unreadable', () => {
    expect(ensureReadableNodeText({ ...text, fill: '#111111' }, '#162616', '#0d1f0d').fill).toBe('#ffffff');
  });

  it('composites translucent fills over the canvas before checking contrast', () => {
    expect(ensureReadableNodeText(text, 'rgba(255,255,255,0.2)', '#0d1f0d').fill).toBe(text.fill);
  });

  it('keeps a style text color when it already has sufficient contrast', () => {
    const readableText = { ...text, fill: '#2d2943' };
    expect(ensureReadableNodeText(readableText, '#ffffff', '#fffaf4')).toBe(readableText);
  });

  it('keeps the existing style color for unsupported CSS colors', () => {
    expect(ensureReadableNodeText(text, 'var(--node-fill)', '#ffffff')).toBe(text);
  });
});

describe('createHarmonizedNodeFills', () => {
  it('creates coordinated graduated fills from an accent and light canvas', () => {
    const fills = createHarmonizedNodeFills('#6941c6', '#fffaf4');
    expect(fills).toHaveLength(4);
    expect(new Set(fills).size).toBe(fills.length);
    expect(fills[0]).toMatch(/^#[\da-f]{6}$/i);
  });

  it('creates deeper tones for a dark canvas', () => {
    const fills = createHarmonizedNodeFills('#7ec87e', '#0d1f0d');
    expect(fills).toHaveLength(4);
    expect(fills[0]).not.toBe(fills[3]);
  });
});
