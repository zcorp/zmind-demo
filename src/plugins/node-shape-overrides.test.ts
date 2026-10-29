import { describe, expect, it } from 'vitest';
import type { MindNode } from '../types';
import type { NodeShapeAttrs } from './types';
import { applyNodeShapeOverrides } from './node-shape-overrides';

const defaultShape: NodeShapeAttrs = {
  rx: 12,
  ry: 12,
  fill: '#fff',
  stroke: '#789',
  strokeWidth: 1.5,
  strokeDasharray: '3,2',
};

describe('applyNodeShapeOverrides', () => {
  it('preserves the active plugin defaults when the node has no overrides', () => {
    expect(applyNodeShapeOverrides({}, defaultShape)).toEqual(defaultShape);
  });

  it('applies zero radius and custom stroke settings without losing plugin colors', () => {
    const node: Pick<MindNode, 'borderRadius' | 'borderWidth' | 'borderStyle'> = {
      borderRadius: 0,
      borderWidth: 0,
      borderStyle: 'dashed',
    };

    expect(applyNodeShapeOverrides(node, defaultShape)).toEqual({
      ...defaultShape,
      rx: 0,
      ry: 0,
      strokeWidth: 0,
      strokeDasharray: '6,4',
    });
  });

  it('uses the plugin dash pattern for the solid option', () => {
    expect(applyNodeShapeOverrides({ borderStyle: 'solid' }, defaultShape).strokeDasharray)
      .toBeUndefined();
  });

  it('preserves the minimal-line marker so leaf rendering remains intact', () => {
    const minimalLineShape = { ...defaultShape, strokeDasharray: 'none-leaf' };
    expect(applyNodeShapeOverrides({ borderStyle: 'dashed' }, minimalLineShape).strokeDasharray)
      .toBe('none-leaf');
  });

  it('overrides plugin geometry with an explicit node shape', () => {
    expect(applyNodeShapeOverrides({ nodeShape: 'hexagon' }, defaultShape)).toMatchObject({
      shape: 'hexagon',
      strokeDasharray: '3,2',
    });
    expect(applyNodeShapeOverrides({ nodeShape: 'capsule' }, defaultShape).rx).toBe(20);
    expect(applyNodeShapeOverrides({ nodeShape: 'underline' }, defaultShape)).toMatchObject({
      fill: 'transparent',
      stroke: 'transparent',
      strokeDasharray: 'none-leaf',
    });
  });

  it('lets an explicit node shape replace a plugin underline marker', () => {
    expect(applyNodeShapeOverrides(
      { nodeShape: 'parallelogram' },
      { ...defaultShape, strokeDasharray: 'none-leaf' },
    )).toMatchObject({
      shape: 'parallelogram',
      strokeDasharray: undefined,
    });
  });
});
