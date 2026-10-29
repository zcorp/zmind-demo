import React, { useId, useRef } from 'react';
import type { NodesMap } from '../types';
import type {
  EdgeAttrs,
  NodeShapeAttrs,
  NodeTextAttrs,
  PluginNode,
  ThemeColors,
} from '../plugins/types';
import { customNodeShapePath } from '../canvas/node-shape';
import { getNodeGeometry } from '../canvas/node-geometry';
import { applyNodeShapeOverrides } from '../plugins/node-shape-overrides';
import { resolveImageSource } from '../canvas/attachment-preview';
import { visible } from '../canvas/helpers';

interface MinimapProps {
  nodes: NodesMap;
  pan: { x: number; y: number };
  scale: number;
  canvasW: number;
  canvasH: number;
  darkMode: boolean;
  selectedId: string | null;
  colors: ThemeColors;
  getNodeShape: (node: Readonly<PluginNode>, depth: number, isSelected: boolean, accentColor: string) => NodeShapeAttrs;
  getNodeText: (node: Readonly<PluginNode>, depth: number) => NodeTextAttrs;
  getEdge: (depth: number, accentColor: string) => EdgeAttrs;
  onPanChange: (pan: { x: number; y: number }) => void;
}

const MM_W = 260;
const MM_H = 150;
const PAD = 14;

function getDepth(nodes: NodesMap, id: string): number {
  let depth = 0;
  let parentId = nodes[id]?.parentId ?? null;
  const seen = new Set([id]);

  while (parentId && nodes[parentId] && !seen.has(parentId)) {
    seen.add(parentId);
    depth += 1;
    parentId = nodes[parentId].parentId;
  }
  return depth;
}

function fitLabel(text: string, width: number, fontSize: number): string {
  const maxCharacters = Math.floor((width - 10) / (fontSize * 0.56));
  if (maxCharacters < 2) return '';
  const characters = Array.from(text.replace(/\s+/g, ' ').trim());
  if (characters.length <= maxCharacters) return characters.join('');
  return `${characters.slice(0, Math.max(1, maxCharacters - 1)).join('')}…`;
}

export const Minimap: React.FC<MinimapProps> = ({
  nodes,
  pan,
  scale,
  canvasW,
  canvasH,
  darkMode,
  selectedId,
  colors,
  getNodeShape,
  getNodeText,
  getEdge,
  onPanChange,
}) => {
  const clipId = `overview-${useId().replace(/:/g, '')}`;
  const pointerStart = useRef<{ id: number; x: number; y: number; pan: { x: number; y: number } } | null>(null);
  const nodeList = Object.values(nodes).filter(node =>
    Number.isFinite(node.x) && Number.isFinite(node.y) && visible(nodes, node.id)
  );
  if (nodeList.length === 0) return null;

  const bounds = nodeList.map(node => {
    const geometry = getNodeGeometry(node, getDepth(nodes, node.id));
    return {
      left: node.x - geometry.width / 2,
      right: node.x + geometry.width / 2,
      top: node.y - geometry.height / 2,
      bottom: node.y + geometry.height / 2,
    };
  });
  const minX = Math.min(...bounds.map(bound => bound.left)) - PAD;
  const maxX = Math.max(...bounds.map(bound => bound.right)) + PAD;
  const minY = Math.min(...bounds.map(bound => bound.top)) - PAD;
  const maxY = Math.max(...bounds.map(bound => bound.bottom)) + PAD;
  const worldW = Math.max(maxX - minX, 1);
  const worldH = Math.max(maxY - minY, 1);
  const mapScale = Math.min((MM_W - PAD * 2) / worldW, (MM_H - PAD * 2) / worldH);
  const offsetX = (MM_W - worldW * mapScale) / 2 - minX * mapScale;
  const offsetY = (MM_H - worldH * mapScale) / 2 - minY * mapScale;
  const toMap = (x: number, y: number) => ({
    x: x * mapScale + offsetX,
    y: y * mapScale + offsetY,
  });

  const zoom = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const visibleLeft = -pan.x / zoom;
  const visibleTop = -pan.y / zoom;
  const visibleWidth = Math.max(0, canvasW / zoom);
  const visibleHeight = Math.max(0, canvasH / zoom);
  const viewport = {
    x: visibleLeft * mapScale + offsetX,
    y: visibleTop * mapScale + offsetY,
    width: visibleWidth * mapScale,
    height: visibleHeight * mapScale,
  };
  const viewportLeft = Math.max(PAD, viewport.x);
  const viewportTop = Math.max(PAD, viewport.y);
  const viewportRight = Math.min(MM_W - PAD, viewport.x + viewport.width);
  const viewportBottom = Math.min(MM_H - PAD, viewport.y + viewport.height);
  const viewportIntersectsMap = viewportRight > viewportLeft && viewportBottom > viewportTop;

  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * MM_W / rect.width,
      y: (event.clientY - rect.top) * MM_H / rect.height,
    };
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.stopPropagation();
    const point = pointFromEvent(event);
    const worldX = (point.x - offsetX) / mapScale;
    const worldY = (point.y - offsetY) / mapScale;
    const nextPan = {
      x: canvasW / 2 - worldX * zoom,
      y: canvasH / 2 - worldY * zoom,
    };
    pointerStart.current = { id: event.pointerId, x: point.x, y: point.y, pan: nextPan };
    event.currentTarget.setPointerCapture(event.pointerId);
    onPanChange(nextPan);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const start = pointerStart.current;
    if (!start || start.id !== event.pointerId) return;
    const point = pointFromEvent(event);
    onPanChange({
      x: start.pan.x - (point.x - start.x) / mapScale * zoom,
      y: start.pan.y - (point.y - start.y) / mapScale * zoom,
    });
  };

  const onPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (pointerStart.current?.id === event.pointerId) pointerStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const panelBackground = darkMode ? '#171a2b' : '#ffffff';
  const panelBorder = darkMode ? '#3b4056' : '#d9dee8';
  const viewportStroke = darkMode ? '#82b9ff' : '#2878c7';

  return (
    <section
      aria-label="Vue d’ensemble de la carte"
      style={{
        position: 'absolute',
        bottom: 60,
        right: 12,
        width: `min(${MM_W}px, calc(100vw - 32px))`,
        overflow: 'hidden',
        zIndex: 300,
        border: `1px solid ${panelBorder}`,
        borderRadius: 12,
        background: panelBackground,
        boxShadow: darkMode ? '0 5px 22px rgba(0,0,0,.46)' : '0 5px 20px rgba(30,45,65,.14)',
        userSelect: 'none',
      }}
    >
      <div style={{
        minHeight: 30,
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottom: `1px solid ${panelBorder}`,
      }}>
        <span style={{
          color: colors.nodeText,
          fontSize: 10,
          fontWeight: 750,
          letterSpacing: '.08em',
        }}>VUE D’ENSEMBLE</span>
        <span style={{ color: colors.mutedText, fontSize: 10, whiteSpace: 'nowrap' }}>
          {nodeList.length} {nodeList.length > 1 ? 'nœuds' : 'nœud'} · {Math.round(zoom * 100)} %
        </span>
      </div>

      <svg
        viewBox={`0 0 ${MM_W} ${MM_H}`}
        role="img"
        aria-label={`Carte de ${nodeList.length} nœuds. Cliquez pour recentrer ou faites glisser pour vous déplacer.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          aspectRatio: `${MM_W} / ${MM_H}`,
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD} y={PAD} width={MM_W - PAD * 2} height={MM_H - PAD * 2} />
          </clipPath>
        </defs>
        <rect width={MM_W} height={MM_H} fill={colors.canvasBackground} />

        <g clipPath={`url(#${clipId})`}>
          {nodeList.filter(node => node.parentId && nodes[node.parentId] && visible(nodes, node.parentId)).map(node => {
            const parent = nodes[node.parentId!];
            const depth = getDepth(nodes, node.id);
            const accent = node.color ?? colors.palette[depth % colors.palette.length];
            const edge = getEdge(depth, accent);
            const from = toMap(parent.x, parent.y);
            const to = toMap(node.x, node.y);
            return (
              <path
                key={`edge-${node.id}`}
                d={edge.pathFn?.(from.x, from.y, to.x, to.y) ?? `M${from.x},${from.y} L${to.x},${to.y}`}
                fill="none"
                stroke={edge.stroke}
                strokeWidth={Math.max(0.7, edge.strokeWidth * mapScale)}
                strokeOpacity={edge.strokeOpacity}
                strokeDasharray={edge.strokeDasharray}
              />
            );
          })}

          {viewportIntersectsMap && (
            <rect
              x={viewportLeft}
              y={viewportTop}
              width={viewportRight - viewportLeft}
              height={viewportBottom - viewportTop}
              fill={viewportStroke}
              fillOpacity={darkMode ? 0.1 : 0.08}
              stroke="none"
              pointerEvents="none"
            />
          )}

          {nodeList.map(node => {
            const depth = getDepth(nodes, node.id);
            const accent = node.color ?? colors.palette[depth % colors.palette.length];
            const selected = node.id === selectedId;
            const shape = applyNodeShapeOverrides(
              node,
              getNodeShape(node, depth, selected, accent),
            );
            const text = getNodeText(node, depth);
            const center = toMap(node.x, node.y);
            const geometry = getNodeGeometry(node, depth);
            const width = geometry.width * mapScale;
            const height = geometry.height * mapScale;
            const lineOnly = shape.strokeDasharray === 'none-leaf';
            const fontSize = Math.max(4, Math.min(8, height * 0.32));
            const label = fitLabel(node.text, width, fontSize);

            return (
              <g key={`node-${node.id}`}>
                {!lineOnly && (
                  shape.shape
                    ? <path
                        d={customNodeShapePath(shape.shape, width, height)}
                        transform={`translate(${center.x - width / 2},${center.y - height / 2})`}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={Math.max(selected ? 1 : 0.55, shape.strokeWidth * mapScale)}
                      />
                    : <rect
                        x={center.x - width / 2}
                        y={center.y - height / 2}
                        width={width}
                        height={height}
                        rx={Math.min(shape.rx * mapScale, height / 2)}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={Math.max(selected ? 1 : 0.55, shape.strokeWidth * mapScale)}
                      />
                )}
                {geometry.preview && (() => {
                  const image = node.attachments?.find(attachment =>
                    attachment.type === 'image' &&
                    (resolveImageSource(attachment.thumbnail) ?? resolveImageSource(attachment.value))
                  );
                  const imageSource = image
                    ? resolveImageSource(image.thumbnail) ?? resolveImageSource(image.value)
                    : null;
                  if (!imageSource) return null;
                  const previewSize = geometry.preview.size * mapScale;
                  return (
                    <image
                      href={imageSource}
                      x={center.x - width / 2 + geometry.preview.x * mapScale}
                      y={center.y - height / 2 + geometry.preview.y * mapScale}
                      width={previewSize}
                      height={previewSize}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  );
                })()}
                {lineOnly && (
                  <line
                    x1={center.x - width / 2 + 2}
                    y1={center.y + height * 0.32}
                    x2={center.x + width / 2 - 2}
                    y2={center.y + height * 0.32}
                    stroke={accent}
                    strokeWidth={Math.max(0.8, mapScale * 2)}
                  />
                )}
                {label && width > 24 && height > 9 && (
                  <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fontSize}
                    fontWeight={text.fontWeight}
                    fontFamily={text.fontFamily}
                    fill={text.fill}
                    pointerEvents="none"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {viewportIntersectsMap && (
            <rect
              x={viewportLeft}
              y={viewportTop}
              width={viewportRight - viewportLeft}
              height={viewportBottom - viewportTop}
              fill="none"
              stroke={viewportStroke}
              strokeWidth="1.5"
              rx="2"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </section>
  );
};
