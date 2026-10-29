import { describe, expect, it } from 'vitest';
import { normalizeExternalUrl, resolveImageSource, safeImageDataUrl } from './attachment-preview';

describe('attachment preview sources', () => {
  it('normalizes web addresses and keeps their HTTP scheme', () => {
    expect(normalizeExternalUrl('start.spring.io')).toBe('https://start.spring.io/');
    expect(normalizeExternalUrl('http://example.com/lesson')).toBe('http://example.com/lesson');
  });

  it('rejects empty, malformed, and non-web link schemes', () => {
    expect(normalizeExternalUrl('  ')).toBeNull();
    expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeExternalUrl('not a valid url')).toBeNull();
  });

  it('allows raster image data URLs but excludes SVG payloads', () => {
    expect(safeImageDataUrl('data:image/png;base64,aGVsbG8=')).toBe('data:image/png;base64,aGVsbG8=');
    expect(safeImageDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
    expect(safeImageDataUrl('https://example.com/image.png')).toBeNull();
  });

  it('resolves both locally stored images and normalized web image URLs', () => {
    expect(resolveImageSource('data:image/jpeg;base64,aGVsbG8=')).toBe('data:image/jpeg;base64,aGVsbG8=');
    expect(resolveImageSource('images.example.org/plant.jpg')).toBe('https://images.example.org/plant.jpg');
    expect(resolveImageSource('javascript:alert(1)')).toBeNull();
    expect(resolveImageSource(undefined)).toBeNull();
  });
});
