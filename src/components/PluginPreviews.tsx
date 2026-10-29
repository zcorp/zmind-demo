import React from 'react';
import type {
  BackgroundPlugin,
  LayoutPlugin,
  PluginNode,
  StylePlugin,
  TemplatePlugin,
  ThemePlugin,
} from '../plugins/types';
import { parallelogramPath } from '../canvas/node-shape';
import { resolveImageSource } from '../canvas/attachment-preview';

export function ThemePreview({ theme }: { theme: ThemePlugin }) {
  const colors = theme.getColors();
  const background = colors.canvasBackground;
  const root = colors.palette[0];
  const first = colors.palette[1 % colors.palette.length];
  const second = colors.palette[2 % colors.palette.length];
  const text = colors.nodeText;

  return (
    <PreviewSurface background={background}>
      <svg viewBox="0 0 240 76" aria-hidden="true" focusable="false">
        <path d="M111 38 C133 38 133 20 153 20 M111 38 C133 38 133 56 153 56 M190 20 H211 M190 56 H211"
          fill="none" stroke={colors.nodeBorder} strokeWidth="2" strokeLinecap="round" />
        <rect x="57" y="25" width="56" height="26" rx="13" fill={root} />
        <text x="85" y="41" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="8" fontWeight="700">Idée</text>
        <rect x="153" y="10" width="38" height="20" rx="7" fill={colors.nodeFill} stroke={first} strokeWidth="1.5" />
        <text x="172" y="20" textAnchor="middle" dominantBaseline="central" fill={text} fontSize="6.5">Projet</text>
        <rect x="153" y="46" width="38" height="20" rx="7" fill={colors.nodeFill} stroke={second} strokeWidth="1.5" />
        <text x="172" y="56" textAnchor="middle" dominantBaseline="central" fill={text} fontSize="6.5">Idées</text>
        <circle cx="217" cy="20" r="3" fill={first} />
        <circle cx="217" cy="56" r="3" fill={second} />
      </svg>
    </PreviewSurface>
  );
}

export function BackgroundPreview({
  background,
  darkMode,
  canvasBackground,
  nodeFill,
  nodeBorder,
}: {
  background: BackgroundPlugin;
  darkMode: boolean;
  canvasBackground?: string;
  nodeFill?: string;
  nodeBorder?: string;
}) {
  const backgroundColor = canvasBackground ?? (darkMode ? '#17182a' : '#fffaf4');
  const line = darkMode ? '#555b78' : '#c8c3b9';
  const accent = darkMode ? '#b7a4ff' : '#6941c6';
  const node = nodeFill ?? (darkMode ? '#292b43' : '#fff');
  const border = nodeBorder ?? line;
  const patternId = `preview-${background.meta.id}`;

  return (
    <PreviewSurface background={backgroundColor}>
      <svg viewBox="0 0 240 76" aria-hidden="true" focusable="false">
        <defs>
          {background.meta.id === 'crosshatch' && (
            <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M12 0H0V12" fill="none" stroke={line} strokeWidth=".55" />
              <path d="M0 0H12V12" fill="none" stroke={accent} strokeWidth=".35" opacity=".55" />
            </pattern>
          )}
          {background.meta.id === 'dot-grid' && (
            <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill={line} />
            </pattern>
          )}
          {background.meta.id === 'paper' && (
            <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M0 0L16 16" stroke={line} strokeWidth=".35" opacity=".22" />
              <circle cx="4" cy="5" r=".7" fill={line} opacity=".7" />
            </pattern>
          )}
        </defs>
        {background.meta.id !== 'wave' && background.meta.id !== 'plain' && (
          <rect width="240" height="76" fill={`url(#${patternId})`} />
        )}
        {background.meta.id === 'plain' && (
          <path d="M0 0H240V76H0Z" fill={backgroundColor} />
        )}
        {background.meta.id === 'wave' && Array.from({ length: 5 }, (_, index) => {
          const y = 10 + index * 14;
          return <path key={index} d={`M0 ${y} C45 ${y - 7} 70 ${y + 7} 120 ${y} S195 ${y - 7} 240 ${y}`}
            fill="none" stroke={line} strokeWidth="1" />;
        })}
        <path d="M101 38 C121 38 123 25 139 25 M101 38 C121 38 123 51 139 51"
          fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".8" />
        <rect x="70" y="28" width="33" height="20" rx="10" fill={node} stroke={accent} strokeWidth="1.5" />
        <rect x="139" y="17" width="35" height="16" rx="6" fill={node} stroke={border} strokeWidth="1.2" />
        <rect x="139" y="43" width="35" height="16" rx="6" fill={node} stroke={border} strokeWidth="1.2" />
      </svg>
    </PreviewSurface>
  );
}

export function LayoutPreview({ layout }: { layout: LayoutPlugin }) {
  const color = '#6941c6';
  const ink = '#9188a2';
  let paths: string[];
  let nodes: Array<[number, number, string]>;
  let root = { x: 120, y: 38 };

  if (layout.meta.id === 'tree-vertical') {
    return (
      <PreviewSurface background="#fffaf4">
        <svg viewBox="0 0 240 76" aria-hidden="true" focusable="false">
          <g fill="none" stroke="#a49bb4" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M120 17V24M56 24H184M56 24V31M120 24V31M184 24V31" />
            <path d="M56 44V51M47 51H65M47 51V57M65 51V57" />
            <path d="M120 44V51M111 51H129M111 51V57M129 51V57" />
            <path d="M184 44V51M175 51H193M175 51V57M193 51V57" />
          </g>
          <rect x="92" y="3" width="56" height="14" rx="7" fill={color} />
          <text x="120" y="10" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="6" fontWeight="700">Concept</text>
          {[[36, 31, 'Définir', '#edf4f1', '#86aa9c'], [100, 31, 'Expliquer', '#f2eefb', '#a695d0'], [164, 31, 'Illustrer', '#fff2e8', '#dda77c']].map(([x, y, label, fill, stroke]) => (
            <g key={String(label)}>
              <rect x={Number(x)} y={Number(y)} width="40" height="13" rx="5" fill={String(fill)} stroke={String(stroke)} />
              <text x={Number(x) + 20} y={Number(y) + 6.5} textAnchor="middle" dominantBaseline="central" fill="#40394f" fontSize="5.5">{String(label)}</text>
            </g>
          ))}
          {[[39, 57], [57, 57], [103, 57], [121, 57], [167, 57], [185, 57]].map(([x, y], index) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width="16" height="9" rx="3.5" fill={index % 2 ? '#f3f0f8' : '#f2f6f1'} stroke={index % 2 ? '#d2c9e2' : '#c6d9cd'} />
              <circle cx={x + 8} cy={y + 4.5} r="1.2" fill={index % 2 ? '#9a85c3' : '#79a88d'} />
            </g>
          ))}
        </svg>
      </PreviewSurface>
    );
  } else if (layout.meta.id === 'fishbone') {
    paths = ['M18 38 H220', 'M54 38 L76 16', 'M91 38 L113 60', 'M139 38 L161 16', 'M177 38 L199 60'];
    nodes = [[45, 10, 'Cause'], [82, 54, 'Cause'], [150, 10, 'Cause'], [188, 54, 'Cause'], [203, 30, 'Effet']];
  } else if (layout.meta.id === 'timeline-horizontal') {
    paths = ['M24 39 H216', 'M65 39 V17', 'M119 39 V59', 'M173 39 V17'];
    nodes = [[49, 8, 'Étape'], [103, 53, 'Étape'], [157, 8, 'Étape'], [11, 31, 'Début']];
  } else if (layout.meta.id === 'tree-vertical') {
    root = { x: 120, y: 12 };
    paths = ['M120 22 V35', 'M62 35 H178', 'M62 35 V48', 'M120 35 V48', 'M178 35 V48'];
    nodes = [[42, 48, 'Br.'], [100, 48, 'Br.'], [158, 48, 'Br.']];
  } else if (layout.meta.id === 'tree-left') {
    root = { x: 207, y: 38 };
    paths = ['M185 38 H151', 'M151 18 V58', 'M151 18 H112', 'M151 58 H112', 'M112 18 H72', 'M112 58 H72'];
    nodes = [[32, 10, 'Détail'], [32, 50, 'Détail'], [72, 10, 'Br.'], [72, 50, 'Br.'], [112, 10, 'Br.'], [112, 50, 'Br.']];
  } else if (layout.meta.id === 'tree-right') {
    root = { x: 33, y: 38 };
    paths = ['M55 38 H89', 'M89 18 V58', 'M89 18 H128', 'M89 58 H128', 'M128 18 H168', 'M128 58 H168'];
    nodes = [[168, 10, 'Détail'], [168, 50, 'Détail'], [128, 10, 'Br.'], [128, 50, 'Br.'], [89, 10, 'Br.'], [89, 50, 'Br.']];
  } else if (layout.meta.id === 'tree-radial') {
    paths = ['M120 28 L120 10', 'M142 38 L176 20', 'M142 38 L176 56', 'M120 48 L120 66', 'M98 38 L64 56', 'M98 38 L64 20'];
    nodes = [[102, 0, 'Br.'], [169, 10, 'Br.'], [169, 48, 'Br.'], [102, 60, 'Br.'], [31, 48, 'Br.'], [31, 10, 'Br.']];
  } else {
    paths = ['M111 38 H76', 'M129 38 H164', 'M76 38 L57 18', 'M76 38 L57 58', 'M164 38 L183 18', 'M164 38 L183 58'];
    nodes = [[34, 30, 'Br.'], [170, 30, 'Br.'], [39, 8, 'Idée'], [39, 53, 'Idée'], [174, 8, 'Idée'], [174, 53, 'Idée']];
  }

  return (
    <PreviewSurface background="#fff">
      <svg viewBox="0 0 240 76" aria-hidden="true" focusable="false">
        {paths.map(path => <path key={path} d={path} fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />)}
        <rect x={root.x - 22} y={root.y - 10} width="44" height="20" rx="10" fill={color} />
        <text x={root.x} y={root.y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="6.5" fontWeight="700">Sujet</text>
        {nodes.map(([x, y, label], index) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width={layout.meta.id === 'mindmap-balanced' ? 34 : 40} height="16" rx="5"
              fill={index % 2 ? '#f2eefb' : '#edf4f1'} stroke={index % 2 ? '#a695d0' : '#86aa9c'} strokeWidth="1" />
            <text x={x + (layout.meta.id === 'mindmap-balanced' ? 17 : 20)} y={y + 8}
              textAnchor="middle" dominantBaseline="central" fill="#40394f" fontSize="5.6">{label}</text>
          </g>
        ))}
      </svg>
    </PreviewSurface>
  );
}

export function StylePreview({ style, darkMode }: { style: StylePlugin; darkMode: boolean }) {
  const sampleNode: PluginNode = {
    id: 'preview',
    text: 'Idée',
    x: 0,
    y: 0,
    parentId: null,
    children: [],
    collapsed: false,
  };
  const colors = ['#6941c6', '#117a65', '#c44d64'];
  const placements = [
    { depth: 0, x: 13, y: 27, width: 48, height: 22, text: 'Idée' },
    { depth: 1, x: 91, y: 11, width: 48, height: 19, text: 'Projet' },
    { depth: 2, x: 166, y: 45, width: 55, height: 18, text: 'Détail' },
  ];
  const edge = style.getEdge(1, colors[1]);
  const background = darkMode ? '#202137' : '#fff';

  return (
    <PreviewSurface background={background}>
      <svg viewBox="0 0 240 76" aria-hidden="true" focusable="false">
        <path d={edge.pathFn?.(61, 36, 91, 20) ?? 'M61 36 L91 20'}
          fill="none" stroke={edge.stroke} strokeWidth={Math.max(1, edge.strokeWidth)} strokeOpacity={edge.strokeOpacity}
          strokeDasharray={edge.strokeDasharray === 'none-leaf' ? undefined : edge.strokeDasharray} />
        <path d={edge.pathFn?.(139, 20, 166, 54) ?? 'M139 20 L166 54'}
          fill="none" stroke={colors[2]} strokeWidth={Math.max(1, edge.strokeWidth)} strokeOpacity={edge.strokeOpacity} />
        {placements.map(({ depth, x, y, width, height, text }, index) => {
          const shape = style.getNodeShape(sampleNode, depth, false, colors[index]);
          const label = style.getNodeText(sampleNode, depth, darkMode);
          const isLineLeaf = shape.strokeDasharray === 'none-leaf';
          return (
            <g key={depth}>
              {!isLineLeaf
              ? shape.shape === 'parallelogram'
                ? <path d={parallelogramPath(width, height)} transform={`translate(${x} ${y})`}
                    fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth}
                    strokeDasharray={shape.strokeDasharray} />
                : <rect x={x} y={y} width={width} height={height} rx={shape.rx} ry={shape.ry}
                    fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth}
                    strokeDasharray={shape.strokeDasharray} />
              : <line x1={x + 3} y1={y + height - 1} x2={x + width - 3} y2={y + height - 1}
                    stroke={colors[index]} strokeWidth="1.5" />}
              <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
                fill={label.fill} fontSize={Math.min(label.fontSize, 8)} fontWeight={label.fontWeight}>
                {text}
              </text>
            </g>
          );
        })}
      </svg>
    </PreviewSurface>
  );
}

export function TemplatePreview({
  template,
  darkMode,
  size = 'card',
}: {
  template: TemplatePlugin;
  darkMode: boolean;
  size?: 'card' | 'detail';
}) {
  const nodes = React.useMemo(
    () => template.build({ originX: 0, originY: 0, parentId: null }),
    [template]
  );
  const root = Object.values(nodes).find(node => node.parentId === null);
  const branches = root?.children.map(id => nodes[id]).filter(Boolean) ?? [];
  const isDetail = size === 'detail';
  if (root && branches.some(branch => branch.attachments?.some(attachment => attachment.type === 'image'))) {
    if (template.meta.id === 'illustrated-history-timeline') {
      return <IllustratedHistoryPreview root={root} branches={branches} darkMode={darkMode} isDetail={isDetail} />;
    }
    if (template.meta.id === 'illustrated-solar-system-atlas') {
      return <SolarSystemPreview root={root} branches={branches} darkMode={darkMode} isDetail={isDetail} />;
    }
    const width = isDetail ? 340 : 280;
    const height = isDetail ? 156 : 112;
    const rootX = 10;
    const rootWidth = isDetail ? 78 : 70;
    const branchX = isDetail ? 108 : 94;
    const rowHeight = isDetail ? 32 : 27;
    const visibleBranches = branches.slice(0, isDetail ? 4 : 3);
    const firstY = (height - visibleBranches.length * rowHeight) / 2 + rowHeight / 2;
    const rootImage = root.attachments?.find(attachment => attachment.type === 'image');
    const rootSource = rootImage && resolveImageSource(rootImage.thumbnail ?? rootImage.value);

    return (
      <PreviewSurface background={darkMode ? '#202137' : '#f5f7ef'} height={height}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
          {visibleBranches.map((branch, index) => {
            const centerY = firstY + rowHeight * index;
            const accent = branch.color ?? '#6941c6';
            const image = branch.attachments?.find(attachment => attachment.type === 'image');
            const imageSource = image && resolveImageSource(image.thumbnail ?? image.value);
            return (
              <g key={branch.id}>
                <path d={`M${rootX + rootWidth} ${height / 2} C${rootX + rootWidth + 18} ${height / 2} ${branchX - 18} ${centerY} ${branchX} ${centerY}`}
                  fill="none" stroke={accent} strokeWidth="1.8" strokeOpacity=".7" />
                <rect x={branchX} y={centerY - (isDetail ? 12 : 10)} width={isDetail ? 218 : 176} height={isDetail ? 24 : 20}
                  rx="7" fill={darkMode ? '#30324d' : '#fff'} stroke={accent} strokeOpacity=".55" />
                {imageSource && (
                  <>
                    <image href={imageSource} x={branchX + 3} y={centerY - (isDetail ? 9 : 7)}
                      width={isDetail ? 36 : 28} height={isDetail ? 18 : 14} preserveAspectRatio="xMidYMid slice" />
                    <rect x={branchX + 3} y={centerY - (isDetail ? 9 : 7)}
                      width={isDetail ? 36 : 28} height={isDetail ? 18 : 14} rx="3"
                      fill="none" stroke={accent} strokeOpacity=".38" />
                  </>
                )}
                <text x={branchX + (imageSource ? (isDetail ? 45 : 36) : 10)} y={centerY}
                  dominantBaseline="central" fill={darkMode ? '#f2effc' : '#343c32'}
                  fontSize={isDetail ? 7 : 6.5}>
                  {truncatePreviewText(branch.text, isDetail ? 28 : 23)}
                </text>
              </g>
            );
          })}
          <rect x={rootX} y={height / 2 - (isDetail ? 25 : 22)} width={rootWidth} height={isDetail ? 50 : 44}
            rx="9" fill="#6941c6" />
          {rootSource && (
            <image href={rootSource} x={rootX + 4} y={height / 2 - (isDetail ? 21 : 18)}
              width={rootWidth - 8} height={isDetail ? 25 : 21} preserveAspectRatio="xMidYMid slice" />
          )}
          <text x={rootX + rootWidth / 2} y={height / 2 + (isDetail ? 13 : 11)}
            textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={isDetail ? 5.8 : 5.4} fontWeight="700">
            {truncatePreviewText(root.text, isDetail ? 18 : 15)}
          </text>
          {branches.length > visibleBranches.length && (
            <text x={width - 10} y={height - 7} textAnchor="end" fill={darkMode ? '#c1bdd3' : '#727b68'} fontSize="6.5">
              + {branches.length - visibleBranches.length}
            </text>
          )}
        </svg>
      </PreviewSurface>
    );
  }

  if (!root) return null;
  return <HierarchicalTemplatePreview nodes={nodes} root={root} darkMode={darkMode} isDetail={isDetail} />;
}

type PreviewTreeNode = {
  source: PluginNode;
  depth: number;
  color: string;
  children: PreviewTreeNode[];
  x: number;
  y: number;
};

function HierarchicalTemplatePreview({
  nodes,
  root,
  darkMode,
  isDetail,
}: {
  nodes: Record<string, PluginNode>;
  root: PluginNode;
  darkMode: boolean;
  isDetail: boolean;
}) {
  const width = isDetail ? 340 : 280;
  const height = isDetail ? 156 : 112;
  const maxDepth = isDetail ? 4 : 3;
  const branchLimit = isDetail ? 4 : 3;
  let remainingNodes = isDetail ? 30 : 18;
  let omittedNodes = Math.max(0, root.children.length - branchLimit);
  const branchColors = ['#238675', '#c18634', '#5579a8', '#b25d78'];

  const buildBranch = (
    source: PluginNode,
    depth: number,
    color: string,
    branchIndex: number,
  ): PreviewTreeNode => {
    const nodeColor = depth === 1 ? source.color ?? branchColors[branchIndex % branchColors.length] : color;
    const previewNode: PreviewTreeNode = { source, depth, color: nodeColor, children: [], x: 0, y: 0 };
    if (depth >= maxDepth) {
      omittedNodes += source.children.length;
      return previewNode;
    }

    const childIds = source.children
      .map(id => nodes[id])
      .filter((child): child is PluginNode => Boolean(child));
    const childLimit = depth === 0 ? branchLimit : 2;
    omittedNodes += Math.max(0, childIds.length - childLimit);

    for (const child of childIds.slice(0, childLimit)) {
      if (remainingNodes <= 0) {
        omittedNodes += 1;
        continue;
      }
      remainingNodes -= 1;
      previewNode.children.push(buildBranch(child, depth + 1, nodeColor, branchIndex));
    }
    return previewNode;
  };

  const tree = buildBranch(root, 0, darkMode ? '#baa8ff' : '#087f8c', 0);
  const visibleNodes: PreviewTreeNode[] = [];
  let leafIndex = 0;
  const countLeaves = (node: PreviewTreeNode): number =>
    node.children.length ? node.children.reduce((sum, child) => sum + countLeaves(child), 0) : 1;
  const leafCount = countLeaves(tree);
  const leafTop = 8;
  const leafBottom = height - 8;

  const place = (node: PreviewTreeNode) => {
    if (!node.children.length) {
      node.y = leafCount === 1
        ? height / 2
        : leafTop + leafIndex++ * ((leafBottom - leafTop) / (leafCount - 1));
    } else {
      node.children.forEach(place);
      node.y = node.children.reduce((sum, child) => sum + child.y, 0) / node.children.length;
    }
    visibleNodes.push(node);
  };
  place(tree);

  const visibleDepth = Math.max(...visibleNodes.map(node => node.depth));
  const marginX = 7;
  const rootWidth = isDetail ? 63 : 54;
  const nodeWidth = isDetail ? 58 : 51;
  const columnGap = visibleDepth > 0
    ? (width - marginX * 2 - rootWidth - nodeWidth) / visibleDepth
    : 0;
  const nodeX = (depth: number) => depth === 0
    ? marginX
    : marginX + rootWidth + (depth - 1) * columnGap + 4;
  const nodeHeight = isDetail ? 10 : 9;
  const surface = darkMode ? '#22243b' : '#f5f7ef';
  const ink = darkMode ? '#e5e2ef' : '#343c32';
  const bySourceId = new Map(visibleNodes.map(node => [node.source.id, node]));

  return (
    <PreviewSurface background={surface} height={height}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        <circle cx={width - 18} cy="12" r="27" fill={darkMode ? '#7a6bb8' : '#dfe9d2'} opacity=".25" />
        {visibleNodes.filter(node => node.depth > 0).map(node => {
          const parent = node.source.parentId ? bySourceId.get(node.source.parentId) : undefined;
          if (!parent) return null;
          const startX = nodeX(parent.depth) + (parent.depth === 0 ? rootWidth : nodeWidth);
          const endX = nodeX(node.depth);
          const bend = (endX - startX) / 2;
          return (
            <path
              key={`edge-${node.source.id}`}
              d={`M${startX} ${parent.y} C${startX + bend} ${parent.y} ${startX + bend} ${node.y} ${endX} ${node.y}`}
              fill="none"
              stroke={node.color}
              strokeWidth={node.depth === 1 ? 1.5 : 1}
              strokeOpacity=".62"
            />
          );
        })}
        {visibleNodes.map(node => {
          const widthForNode = node.depth === 0 ? rootWidth : nodeWidth;
          return (
            <g key={node.source.id}>
              <rect
                x={nodeX(node.depth)}
                y={node.y - nodeHeight / 2}
                width={widthForNode}
                height={nodeHeight}
                rx={node.depth === 0 ? 4 : 3}
                fill={node.depth === 0 ? (darkMode ? '#62539a' : '#087f8c') : node.depth === 1 ? `${node.color}20` : (darkMode ? '#292b43' : '#fff')}
                stroke={node.depth === 0 ? (darkMode ? '#8374bc' : '#087f8c') : node.color}
                strokeOpacity={node.depth < 2 ? '.8' : '.38'}
                strokeWidth={node.depth === 0 ? 1 : '.7'}
              />
              <text
                x={nodeX(node.depth) + widthForNode / 2}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={node.depth === 0 ? '#fff' : ink}
                fontSize={isDetail ? 5.4 : 5}
                fontWeight={node.depth < 2 ? 700 : 500}
              >
                {truncatePreviewText(node.source.text, isDetail ? 13 : 11)}
              </text>
            </g>
          );
        })}
        {omittedNodes > 0 && (
          <text x={width - 5} y={height - 3} textAnchor="end" fill={darkMode ? '#c1bdd3' : '#727b68'} fontSize="5.5">
            + {omittedNodes}
          </text>
        )}
      </svg>
    </PreviewSurface>
  );
}

type IllustratedPreviewProps = {
  root: PluginNode;
  branches: PluginNode[];
  darkMode: boolean;
  isDetail: boolean;
};

function nodeImageSource(node: PluginNode) {
  const image = node.attachments?.find(attachment => attachment.type === 'image');
  return image && resolveImageSource(image.thumbnail ?? image.value);
}

function IllustratedHistoryPreview({ root, branches, darkMode, isDetail }: IllustratedPreviewProps) {
  const width = isDetail ? 340 : 280;
  const height = isDetail ? 156 : 112;
  const axisY = isDetail ? 79 : 56;
  const cardHeight = isDetail ? 46 : 34;
  const cardWidth = width / branches.length - (isDetail ? 14 : 10);
  const topY = isDetail ? 22 : 18;
  const bottomY = height - cardHeight - (isDetail ? 10 : 5);
  const ink = darkMode ? '#f2effc' : '#343c32';

  return (
    <PreviewSurface background={darkMode ? '#202137' : '#f5f7ef'} height={height}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        <text x={width / 2} y={isDetail ? 12 : 9} textAnchor="middle" dominantBaseline="central"
          fill={ink} fontSize={isDetail ? 7 : 6.5} fontWeight="700">
          {truncatePreviewText(root.text, isDetail ? 42 : 34)}
        </text>
        <path d={`M12 ${axisY} H${width - 12}`} fill="none" stroke={darkMode ? '#aaa0c8' : '#84789d'} strokeWidth="2" />
        {branches.map((branch, index) => {
          const centerX = width * (index + 0.5) / branches.length;
          const cardY = index % 2 === 0 ? topY : bottomY;
          const imageSource = nodeImageSource(branch);
          const accent = branch.color ?? '#6941c6';
          const imageHeight = isDetail ? 27 : 19;
          return (
            <g key={branch.id}>
              <path d={`M${centerX} ${axisY} V${index % 2 === 0 ? cardY + cardHeight : cardY}`}
                fill="none" stroke={accent} strokeWidth="1.2" />
              <circle cx={centerX} cy={axisY} r={isDetail ? 4 : 3.2} fill={accent} stroke="#fff" strokeWidth="1" />
              <rect x={centerX - cardWidth / 2} y={cardY} width={cardWidth} height={cardHeight} rx="5"
                fill={darkMode ? '#30324d' : '#fff'} stroke={accent} strokeOpacity=".6" />
              {imageSource && (
                <image href={imageSource} x={centerX - cardWidth / 2 + 3} y={cardY + 3}
                  width={cardWidth - 6} height={imageHeight} preserveAspectRatio="xMidYMid slice" />
              )}
              <text x={centerX} y={cardY + cardHeight - (isDetail ? 7 : 6)} textAnchor="middle" dominantBaseline="central"
                fill={ink} fontSize={isDetail ? 6.3 : 5.4} fontWeight="600">
                {truncatePreviewText(branch.text, isDetail ? 20 : 15)}
              </text>
            </g>
          );
        })}
      </svg>
    </PreviewSurface>
  );
}

function SolarSystemPreview({ root, branches, darkMode, isDetail }: IllustratedPreviewProps) {
  const width = isDetail ? 340 : 280;
  const height = isDetail ? 156 : 112;
  const centerX = width / 2;
  const centerY = height / 2;
  const orbitX = isDetail ? 112 : 91;
  const orbitY = isDetail ? 60 : 39;
  const visibleBranches = branches.slice(0, isDetail ? 8 : 4);
  const rootSource = nodeImageSource(root);
  const ink = darkMode ? '#f2effc' : '#343c32';
  const planetSize = isDetail ? 27 : 21;
  const rootSize = isDetail ? 43 : 34;
  const rootClipId = `solar-preview-${root.id}`;

  return (
    <PreviewSurface background={darkMode ? '#17192d' : '#edf3f7'} height={height}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={rootClipId}>
            <circle cx={centerX} cy={centerY} r={rootSize / 2} />
          </clipPath>
        </defs>
        <ellipse cx={centerX} cy={centerY} rx={orbitX} ry={orbitY} fill="none"
          stroke={darkMode ? '#555b78' : '#a9b5c5'} strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={centerX} cy={centerY} r={rootSize / 2 + 3} fill={darkMode ? '#483b59' : '#f7d88a'} opacity=".55" />
        {rootSource && (
          <image href={rootSource} x={centerX - rootSize / 2} y={centerY - rootSize / 2}
            width={rootSize} height={rootSize} preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${rootClipId})`} />
        )}
        <circle cx={centerX} cy={centerY} r={rootSize / 2} fill="none"
          stroke={darkMode ? '#f3c76e' : '#d89c34'} strokeWidth="1.5" />
        <text x={centerX} y={centerY + rootSize / 2 + (isDetail ? 10 : 8)} textAnchor="middle"
          fill={ink} fontSize={isDetail ? 6.5 : 5.8} fontWeight="700">
          {truncatePreviewText(root.text, 16)}
        </text>
        {visibleBranches.map((branch, index) => {
          const angle = -Math.PI / 2 + index * (Math.PI * 2 / visibleBranches.length);
          const x = centerX + Math.cos(angle) * orbitX;
          const y = centerY + Math.sin(angle) * orbitY;
          const imageSource = nodeImageSource(branch);
          const accent = branch.color ?? '#6941c6';
          const clipId = `solar-preview-${branch.id}`;
          return (
            <g key={branch.id}>
              <defs>
                <clipPath id={clipId}>
                  <circle cx={x} cy={y} r={planetSize / 2} />
                </clipPath>
              </defs>
              <circle cx={x} cy={y} r={planetSize / 2 + 2} fill={darkMode ? '#292b43' : '#fff'} stroke={accent} strokeWidth="1.2" />
              {imageSource && (
                <image href={imageSource} x={x - planetSize / 2} y={y - planetSize / 2}
                  width={planetSize} height={planetSize} preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${clipId})`} />
              )}
              <text x={x} y={y + planetSize / 2 + (isDetail ? 8 : 7)} textAnchor="middle"
                fill={ink} fontSize={isDetail ? 6 : 5.6} fontWeight="600">
                {truncatePreviewText(branch.text, 9)}
              </text>
            </g>
          );
        })}
        {branches.length > visibleBranches.length && (
          <text x={width - 8} y={height - 7} textAnchor="end" fill={darkMode ? '#c1bdd3' : '#727b68'} fontSize="6.5">
            + {branches.length - visibleBranches.length} planètes
          </text>
        )}
      </svg>
    </PreviewSurface>
  );
}

function truncatePreviewText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function PreviewSurface({
  background,
  children,
  height = 76,
}: {
  background: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div style={{
      height,
      overflow: 'hidden',
      borderRadius: 9,
      background,
      border: `1px solid ${background === '#fff' ? '#e9e5ee' : 'rgba(125,115,148,.22)'}`,
      marginBottom: 8,
    }}>
      {React.cloneElement(children as React.ReactElement<{ style?: React.CSSProperties }>, {
        style: { display: 'block', width: '100%', height: '100%' },
      })}
    </div>
  );
}
