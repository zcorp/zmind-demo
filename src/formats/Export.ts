import { NodesMap } from '../types';
import { MarkdownExport } from './Markdown';
import { MinderJSON } from './MinderJSON';

export type ExportQuality = 'standard' | 'hd';

interface ExportSVGOptions {
  svgEl: SVGSVGElement;
  title: string;
  darkMode: boolean;
}

interface ExportPNGOptions extends ExportSVGOptions {
  quality: ExportQuality;
  transparent?: boolean;
}

interface ExportPDFOptions extends ExportSVGOptions {
  quality: ExportQuality;
}

interface ExportRasterImageOptions extends ExportSVGOptions {
  format: 'bmp' | 'jpeg' | 'webp';
}

/** Serialize the live SVG to a clean string, cropped to content bounds */
function getSVGString(svgEl: SVGSVGElement, _darkMode?: boolean): { svg: string; w: number; h: number } {
  const viewport = svgEl.querySelector('g') as SVGGElement | null;
  if (!viewport) return { svg: '', w: 800, h: 600 };

  // Get bounding box of all content
  const bbox = viewport.getBBox();
  const pad  = 40;
  const x = bbox.x - pad, y = bbox.y - pad;
  const w = bbox.width  + pad * 2;
  const h = bbox.height + pad * 2;

  // Get the transform string from the viewport group

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width',   String(w));
  clone.setAttribute('height',  String(h));
  clone.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  clone.style.background = 'transparent';

  // Remove dot pattern elements
  const defs = clone.querySelector('defs');
  if (defs) defs.innerHTML = '';
  const vpBg = clone.querySelector('.vp-bg');
  if (vpBg) vpBg.remove();

  // Add Google Fonts embed for text rendering
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `text { font-family: 'Segoe UI', system-ui, sans-serif; }`;
  clone.prepend(style);

  const serializer = new XMLSerializer();
  return { svg: serializer.serializeToString(clone), w, h };
}

export async function exportSVG({ svgEl, title }: ExportSVGOptions): Promise<void> {
  const { svg } = getSVGString(svgEl, false);
  const blob = new Blob(
    ['<?xml version="1.0" encoding="utf-8"?>\n', svg],
    { type: 'image/svg+xml' }
  );
  downloadBlob(blob, `${sanitize(title)}.svg`);
}

export async function exportPNG({
  svgEl, title, darkMode, quality, transparent = false,
}: ExportPNGOptions): Promise<void> {
  const scale  = quality === 'hd' ? 3 : 1.5;
  const { svg, w, h } = getSVGString(svgEl, darkMode);
  if (!svg) return;

  const img   = new Image();
  const blob  = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url   = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const canvas   = document.createElement('canvas');
      canvas.width   = Math.round(w * scale);
      canvas.height  = Math.round(h * scale);
      const ctx      = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      if (!transparent) {
        ctx.fillStyle = darkMode ? '#1a1a2e' : '#f4f6fb';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      canvas.toBlob(b => {
        if (!b) { reject(new Error('canvas.toBlob failed')); return; }
        const suffix = transparent ? '-transparent' : '';
        const q      = quality === 'hd' ? '-HD' : '';
        downloadBlob(b, `${sanitize(title)}${q}${suffix}.png`);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export async function exportRasterImage({
  svgEl, title, darkMode, format,
}: ExportRasterImageOptions): Promise<void> {
  const { svg, w, h } = getSVGString(svgEl, darkMode);
  if (!svg) return;

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/bmp';
  const extension = format === 'jpeg' ? 'jpg' : format;
  const image = new Image();
  const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = 1.5;
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Impossible de créer le contexte de rendu de l’image.');
        context.scale(scale, scale);
        context.fillStyle = darkMode ? '#1a1a2e' : '#f4f6fb';
        context.fillRect(0, 0, w, h);
        context.drawImage(image, 0, 0, w, h);
        URL.revokeObjectURL(imageUrl);

        if (format === 'bmp') {
          const bitmap = context.getImageData(0, 0, canvas.width, canvas.height);
          downloadBlob(encodeBMP(bitmap), `${sanitize(title)}.bmp`);
          resolve();
          return;
        }

        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error(`Impossible d’encoder l’image ${extension.toUpperCase()}.`));
            return;
          }
          if (blob.type !== mimeType) {
            reject(new Error(`Ce navigateur ne prend pas en charge l’export ${extension.toUpperCase()}.`));
            return;
          }
          downloadBlob(blob, `${sanitize(title)}.${extension}`);
          resolve();
        }, mimeType, format === 'jpeg' ? 0.92 : 0.95);
      } catch (error) {
        URL.revokeObjectURL(imageUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Impossible de générer l’image à partir du canevas SVG.'));
    };
    image.src = imageUrl;
  });
}

function encodeBMP(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const buffer = new ArrayBuffer(54 + pixelDataSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelDataSize, true);

  for (let y = 0; y < height; y++) {
    const sourceRow = (height - 1 - y) * width * 4;
    const targetRow = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const source = sourceRow + x * 4;
      const target = targetRow + x * 3;
      bytes[target] = data[source + 2];
      bytes[target + 1] = data[source + 1];
      bytes[target + 2] = data[source];
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

export async function exportPrint({ svgEl, title }: ExportSVGOptions): Promise<void> {
  const { svg } = getSVGString(svgEl);
  if (!svg) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('La fenêtre d’impression a été bloquée par le navigateur.');

  const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const printDocument = printWindow.document;
  printDocument.title = sanitize(title);
  printDocument.documentElement.style.cssText = 'height:100%;';
  printDocument.body.style.cssText = 'height:100%;margin:0;background:#fff;';

  const image = printDocument.createElement('img');
  image.alt = title;
  image.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;';

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(imageUrl);
      printWindow.close();
    };
    image.onload = () => {
      try {
        printWindow.addEventListener('afterprint', cleanup, { once: true });
        printWindow.focus();
        printWindow.print();
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Impossible de préparer la carte pour l’impression.'));
    };
    image.src = imageUrl;
    printDocument.body.appendChild(image);
  });
}

export async function exportPDF({
  svgEl, title, darkMode, quality,
}: ExportPDFOptions): Promise<void> {
  const scale  = quality === 'hd' ? 3 : 1.5;
  const { svg, w, h } = getSVGString(svgEl, darkMode);
  if (!svg) return;

  const img  = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    img.onload = async () => {
      try {
        const canvas   = document.createElement('canvas');
        canvas.width   = Math.round(w * scale);
        canvas.height  = Math.round(h * scale);
        const ctx      = canvas.getContext('2d')!;
        ctx.scale(scale, scale);
        ctx.fillStyle  = darkMode ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

        // Dynamic import jsPDF to avoid SSR issues
        const { jsPDF } = await import('jspdf');
        const orientation = w > h ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
          orientation,
          unit: 'px',
          format: [w, h],
          compress: true,
        });

        pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h);
        pdf.save(`${sanitize(title)}${quality === 'hd' ? '-HD' : ''}.pdf`);
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export function exportMinderJSON(nodes: NodesMap, title: string): void {
  const content = MinderJSON.serialize(nodes, title);
  const blob = new Blob([content], { type: 'application/json' });
  downloadBlob(blob, `${sanitize(title)}.minder`);
}

export function exportMarkdownFile(nodes: NodesMap, title: string): void {
  MarkdownExport.download(nodes, title);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '_').slice(0, 60) || 'mindmap';
}
