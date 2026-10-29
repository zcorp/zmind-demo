import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportPrint, exportRasterImage } from './Export';

class TestImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    this.onload?.();
  }
}

function prepareExport(blobTypeForCanvas: string) {
  const createdBlobs: Blob[] = [];
  const click = vi.fn();
  const toBlob = vi.fn((callback: BlobCallback, _type?: string, _quality?: number) => {
    callback(new Blob(['image'], { type: blobTypeForCanvas }));
  });
  const context = {
    fillStyle: '',
    scale: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      data[(height - 1) * width * 4] = 255;
      return { width, height, data };
    }),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob,
  };
  const anchor = { href: '', download: '', click };
  const clone = {
    style: {},
    setAttribute: vi.fn(),
    querySelector: vi.fn(() => null),
    prepend: vi.fn(),
  };
  const svg = {
    querySelector: vi.fn(() => ({ getBBox: () => ({ x: 0, y: 0, width: 120, height: 40 }) })),
    cloneNode: vi.fn(() => clone),
  };

  vi.stubGlobal('Image', TestImage);
  vi.stubGlobal('XMLSerializer', class {
    serializeToString() { return '<svg />'; }
  });
  vi.stubGlobal('URL', class {
    static createObjectURL(blob: Blob) {
      createdBlobs.push(blob);
      return `blob:test-${createdBlobs.length}`;
    }
    static revokeObjectURL() {}
  });
  vi.stubGlobal('document', {
    createElement: (tag: string) => tag === 'canvas' ? canvas : anchor,
    createElementNS: () => ({ textContent: '' }),
  });
  vi.stubGlobal('setTimeout', vi.fn());

  return { svg, canvas, context, toBlob, anchor, createdBlobs };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('raster image export', () => {
  it.each([
    ['jpeg', 'image/jpeg', 0.92, 'My_Map.jpg'],
    ['webp', 'image/webp', 0.95, 'My_Map.webp'],
  ] as const)('exports %s with an opaque background', async (format, mimeType, quality, filename) => {
    const { svg, canvas, context, toBlob, anchor } = prepareExport(mimeType);

    await exportRasterImage({
      svgEl: svg as unknown as SVGSVGElement,
      title: 'My Map',
      darkMode: false,
      format,
    });

    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(180);
    expect(context.fillStyle).toBe('#f4f6fb');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 200, 120);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), mimeType, quality);
    expect(anchor.download).toBe(filename);
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it('rejects when the browser silently falls back to PNG encoding', async () => {
    const { svg, anchor } = prepareExport('image/png');

    await expect(exportRasterImage({
      svgEl: svg as unknown as SVGSVGElement,
      title: 'My Map',
      darkMode: true,
      format: 'webp',
    })).rejects.toThrow('Ce navigateur ne prend pas en charge l’export WEBP.');

    expect(anchor.click).not.toHaveBeenCalled();
  });

  it('encodes BMP as a bottom-up 24-bit bitmap', async () => {
    const { svg, canvas, context, toBlob, anchor, createdBlobs } = prepareExport('image/bmp');

    await exportRasterImage({
      svgEl: svg as unknown as SVGSVGElement,
      title: 'My Map',
      darkMode: false,
      format: 'bmp',
    });

    expect(context.getImageData).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    expect(toBlob).not.toHaveBeenCalled();
    expect(anchor.download).toBe('My_Map.bmp');
    expect(anchor.click).toHaveBeenCalledOnce();

    const bitmap = new DataView(await createdBlobs[1].arrayBuffer());
    expect(createdBlobs[1].type).toBe('image/bmp');
    expect(bitmap.getUint8(0)).toBe(0x42);
    expect(bitmap.getUint8(1)).toBe(0x4d);
    expect(bitmap.getUint32(18, true)).toBe(300);
    expect(bitmap.getUint32(22, true)).toBe(180);
    expect(bitmap.getUint16(28, true)).toBe(24);
    expect([bitmap.getUint8(54), bitmap.getUint8(55), bitmap.getUint8(56)]).toEqual([0, 0, 255]);
  });

  it('opens the browser print dialog for the cropped SVG', async () => {
    const { svg } = prepareExport('image/svg+xml');
    const afterPrint = vi.fn();
    const print = vi.fn();
    const image = {
      alt: '',
      src: '',
      style: { cssText: '' },
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };
    Object.defineProperty(image, 'src', {
      set() { image.onload?.(); },
    });
    const printWindow = {
      document: {
        title: '',
        documentElement: { style: { cssText: '' } },
        body: { style: { cssText: '' }, appendChild: vi.fn() },
        createElement: vi.fn(() => image),
      },
      addEventListener: vi.fn((_event: string, callback: () => void) => afterPrint.mockImplementation(callback)),
      focus: vi.fn(),
      print,
      close: vi.fn(),
    };
    vi.stubGlobal('window', { open: vi.fn(() => printWindow) });

    await exportPrint({
      svgEl: svg as unknown as SVGSVGElement,
      title: 'My Map',
      darkMode: false,
    });

    expect(printWindow.document.title).toBe('My_Map');
    expect(image.alt).toBe('My Map');
    expect(print).toHaveBeenCalledOnce();
    expect(printWindow.close).not.toHaveBeenCalled();

    afterPrint();
    expect(printWindow.close).toHaveBeenCalledOnce();
  });

  it('reports when the browser blocks the print window', async () => {
    const { svg } = prepareExport('image/svg+xml');
    vi.stubGlobal('window', { open: vi.fn(() => null) });

    await expect(exportPrint({
      svgEl: svg as unknown as SVGSVGElement,
      title: 'My Map',
      darkMode: false,
    })).rejects.toThrow('La fenêtre d’impression a été bloquée par le navigateur.');
  });
});
