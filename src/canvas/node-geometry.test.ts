import { describe, expect, it } from 'vitest';
import { MAX_NODE_ATTACHMENT_SIZE, type MindNode } from '../types';
import { getNodeGeometry } from './node-geometry';

const imageNode: MindNode = {
  id: 'image',
  text: 'Image',
  x: 0,
  y: 0,
  parentId: 'root',
  children: [],
  collapsed: false,
  attachments: [{
    id: 'image-attachment',
    type: 'image',
    name: 'portrait.png',
    value: 'data:image/png;base64,aGVsbG8=',
  }],
};

describe('getNodeGeometry', () => {
  it.each(['top', 'bottom', 'left', 'right'] as const)('reserves space for an image at %s', position => {
    const geometry = getNodeGeometry({ ...imageNode, attachmentPosition: position, attachmentSize: 48 }, 1);
    expect(geometry.preview?.size).toBe(48);
    expect(geometry.width).toBe(position === 'left' || position === 'right' ? 190 : 134);
    expect(geometry.height).toBe(position === 'top' || position === 'bottom' ? 96 : 40);
    expect(geometry.contentX).toBe(position === 'left' ? 56 : 0);
    expect(geometry.contentY).toBe(position === 'top' ? 56 : 0);
  });

  it('keeps existing geometry when a node has no raster image', () => {
    const geometry = getNodeGeometry({ ...imageNode, attachments: [] }, 0);
    expect(geometry).toMatchObject({
      width: 154,
      height: 44,
      contentWidth: 154,
      contentHeight: 44,
    });
    expect(geometry.preview).toBeUndefined();
  });

  it('reserves additional space for custom text sizes and line spacing', () => {
    const base = getNodeGeometry({ ...imageNode, attachments: [] }, 1);
    const formatted = getNodeGeometry({
      ...imageNode,
      attachments: [],
      text: 'Un texte suffisamment long pour se répartir sur deux lignes',
      textFormats: [{ start: 0, end: 4, fontSize: 24 }],
      textLineHeight: 2,
    }, 1);

    expect(formatted.width).toBeGreaterThan(base.width);
    expect(formatted.height).toBeGreaterThan(base.height);
  });

  it('reserves space for an image loaded from a web URL', () => {
    const node = {
      ...imageNode,
      attachments: [{
        id: 'remote-image',
        type: 'image' as const,
        name: 'plant.jpg',
        value: 'https://images.example.org/plant.jpg',
      }],
      attachmentSize: 64,
    };

    expect(getNodeGeometry(node, 1).preview?.size).toBe(64);
  });

  it('clamps the preview size to supported bounds', () => {
    expect(getNodeGeometry({ ...imageNode, attachmentSize: 240 }, 1).preview?.size).toBe(MAX_NODE_ATTACHMENT_SIZE);
    expect(getNodeGeometry({ ...imageNode, attachmentSize: 10 }, 1).preview?.size).toBe(24);
  });
});
