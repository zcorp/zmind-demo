import { MAX_NODE_ATTACHMENT_SIZE, type MindNode } from '../types';
import { NODE_H, NODE_W } from './constants';
import { resolveImageSource } from './attachment-preview';

export interface NodeGeometry {
  width: number;
  height: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  preview?: { x: number; y: number; size: number };
}

export function getNodeGeometry(node: MindNode, depth: number): NodeGeometry {
  const defaultWidth = depth === 0 ? NODE_W + 20 : NODE_W;
  const defaultHeight = depth === 0 ? NODE_H + 4 : NODE_H;
  const defaultFontSize = depth === 0 ? 14 : 12;
  const fontSize = Math.max(defaultFontSize, ...(node.textFormats ?? []).map(format => format.fontSize ?? defaultFontSize));
  const fontScale = Math.max(1, fontSize / defaultFontSize);
  const contentWidth = Math.round(defaultWidth * Math.min(fontScale, 2.25));
  const customTextLayout = (node.textFormats?.some(format => format.fontSize !== undefined) ?? false)
    || node.textLineHeight !== undefined;
  const maxCharacters = Math.max(8, Math.floor((contentWidth - 44) / (fontSize * 0.62)));
  const lineCount = node.text.length > maxCharacters ? 2 : 1;
  const contentHeight = customTextLayout
    ? Math.max(defaultHeight, Math.ceil(fontSize * (node.textLineHeight ?? 1.25) * lineCount + 12))
    : defaultHeight;
  const image = node.attachments?.find(attachment =>
    attachment.type === 'image' &&
    (resolveImageSource(attachment.thumbnail) ?? resolveImageSource(attachment.value))
  );
  const imageSource = image
    ? resolveImageSource(image.thumbnail) ?? resolveImageSource(image.value)
    : null;

  if (!imageSource) {
    return {
      width: contentWidth,
      height: contentHeight,
      contentX: 0,
      contentY: 0,
      contentWidth,
      contentHeight,
    };
  }

  const size = Math.max(24, Math.min(MAX_NODE_ATTACHMENT_SIZE, node.attachmentSize ?? 28));
  const gap = 8;
  const position = node.attachmentPosition ?? 'right';

  if (position === 'top') {
    return {
      width: contentWidth,
      height: contentHeight + size + gap,
      contentX: 0,
      contentY: size + gap,
      contentWidth,
      contentHeight,
      preview: { x: (contentWidth - size) / 2, y: 0, size },
    };
  }
  if (position === 'bottom') {
    return {
      width: contentWidth,
      height: contentHeight + size + gap,
      contentX: 0,
      contentY: 0,
      contentWidth,
      contentHeight,
      preview: { x: (contentWidth - size) / 2, y: contentHeight + gap, size },
    };
  }
  if (position === 'left') {
    return {
      width: contentWidth + size + gap,
      height: contentHeight,
      contentX: size + gap,
      contentY: 0,
      contentWidth,
      contentHeight,
      preview: { x: 0, y: (contentHeight - size) / 2, size },
    };
  }
  return {
    width: contentWidth + size + gap,
    height: contentHeight,
    contentX: 0,
    contentY: 0,
    contentWidth,
    contentHeight,
    preview: { x: contentWidth + gap, y: (contentHeight - size) / 2, size },
  };
}
