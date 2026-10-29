import React from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { AccountTreeRounded } from '@mui/icons-material';
import {
  IllustratedEgyptTemplate, IllustratedHistoryTemplate,
  IllustratedLearningTemplate, IllustratedSolarSystemTemplate,
} from '../plugins/templates/library';
import { TemplatePlugin } from '../plugins/types';
import { TemplatePreview } from './PluginPreviews';

type PreviewTree = {
  label: string;
  children?: PreviewTree[];
};

type TextTreeLayout = 'horizontal' | 'vertical' | 'mindmap';

const textTreeExamples: Record<string, PreviewTree> = {
  'illustrated-solar-system-atlas': {
    label: 'Système solaire',
    children: [
      { label: 'Étoile', children: [{ label: 'Soleil' }, { label: 'Lumière' }] },
      {
        label: 'Planètes',
        children: [
          { label: 'Rocheuses', children: [{ label: 'Terre' }, { label: 'Mars' }] },
          { label: 'Gazeuses', children: [{ label: 'Jupiter' }, { label: 'Saturne' }] },
        ],
      },
      { label: 'Exploration', children: [{ label: 'Satellites' }, { label: 'Rovers' }] },
    ],
  },
  'illustrated-history-timeline': {
    label: 'Révolution française',
    children: [
      { label: 'Les causes', children: [{ label: 'Inégalités' }, { label: 'Crise financière' }] },
      {
        label: 'Les étapes',
        children: [
          { label: '1789', children: [{ label: 'Bastille' }, { label: 'Déclaration' }] },
          { label: '1792', children: [{ label: 'République' }, { label: 'Convention' }] },
        ],
      },
      { label: 'Les suites', children: [{ label: 'Consulat' }, { label: 'Nouvelles lois' }] },
    ],
  },
  'illustrated-ancient-egypt': {
    label: 'Égypte ancienne',
    children: [
      { label: 'Le Nil', children: [{ label: 'Crues' }, { label: 'Récoltes' }] },
      { label: 'Les pharaons', children: [{ label: 'Dynasties' }, { label: 'Pouvoir' }] },
      { label: 'Les pyramides', children: [{ label: 'Construction' }, { label: 'Tombeaux' }] },
    ],
  },
  'illustrated-learning-method': {
    label: 'Apprendre efficacement',
    children: [
      { label: 'Comprendre', children: [{ label: 'Analyser' }, { label: 'Relier' }] },
      { label: 'Mémoriser', children: [{ label: 'Se tester' }, { label: 'Réviser' }] },
      { label: 'S’entraîner', children: [{ label: 'Pratiquer' }, { label: 'Corriger' }] },
    ],
  },
};

const treeColors = ['#238675', '#c18634', '#5579a8'];

function TextTreePreview({
  tree,
  layout = 'horizontal',
}: {
  tree: PreviewTree;
  layout?: TextTreeLayout;
}) {
  if (layout === 'vertical') return <VerticalTreePreview tree={tree} />;
  if (layout === 'mindmap') return <MindmapTreePreview tree={tree} />;

  const width = 320;
  const height = 174;
  const nodeWidth = 65;
  const nodeHeight = 13;
  const left = 8;
  const nodes: Array<{
    id: string;
    label: string;
    depth: number;
    y: number;
    color: string;
    parentId: string | null;
  }> = [];
  let leafIndex = 0;

  const place = (
    node: PreviewTree,
    depth: number,
    color: string,
    parentId: string | null,
  ): number => {
    const id = `${parentId ?? 'root'}-${depth}-${nodes.length}`;
    const nodeColor = depth === 1 ? treeColors[nodes.filter(item => item.depth === 1).length % treeColors.length] : color;
    const children = node.children ?? [];
    const childYs = children.map(child => place(child, depth + 1, nodeColor, id));
    const y = children.length
      ? childYs.reduce((sum, childY) => sum + childY, 0) / childYs.length
      : 14 + leafIndex++ * ((height - 28) / (countLeaves(tree) - 1));

    nodes.push({ id, label: node.label, depth, y, color: nodeColor, parentId });
    return y;
  };
  place(tree, 0, treeColors[0], null);

  const maxDepth = Math.max(...nodes.map(node => node.depth));
  const step = (width - left * 2 - nodeWidth) / maxDepth;
  const nodeX = (depth: number) => left + depth * step;
  const byId = new Map(nodes.map(node => [node.id, node]));

  return (
    <Box
      role="img"
      aria-label={`Carte mentale textuelle à plusieurs niveaux : ${tree.label}`}
      sx={{ height, mb: 1, overflow: 'hidden', border: '1px solid rgba(125,115,148,.22)', borderRadius: 2, bgcolor: '#f5f7ef' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: '100%' }}>
        {nodes.filter(node => node.parentId).map(node => {
          const parent = byId.get(node.parentId!)!;
          const startX = nodeX(parent.depth) + nodeWidth;
          const endX = nodeX(node.depth);
          return (
            <path
              key={`edge-${node.id}`}
              d={`M${startX} ${parent.y} C${startX + (endX - startX) / 2} ${parent.y} ${startX + (endX - startX) / 2} ${node.y} ${endX} ${node.y}`}
              fill="none"
              stroke={node.color}
              strokeOpacity=".58"
              strokeWidth="1.2"
            />
          );
        })}
        {nodes.map(node => (
          <g key={node.id}>
            <rect
              x={nodeX(node.depth)}
              y={node.y - nodeHeight / 2}
              width={nodeWidth}
              height={nodeHeight}
              rx={node.depth === 0 ? 6 : 4}
              fill={node.depth === 0 ? '#087f8c' : node.depth === 1 ? `${node.color}18` : '#fff'}
              stroke={node.depth === 0 ? '#087f8c' : node.color}
              strokeOpacity={node.depth === 0 ? 1 : node.depth === 1 ? '.7' : '.38'}
              strokeWidth={node.depth === 0 ? 1 : '.8'}
            />
            <text
              x={nodeX(node.depth) + nodeWidth / 2}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={node.depth === 0 ? '#fff' : '#343c32'}
              fontSize={node.depth === 0 ? 6.3 : 6}
              fontWeight={node.depth < 2 ? 700 : 500}
            >
              {truncateTreeLabel(node.label)}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

function VerticalTreePreview({ tree }: { tree: PreviewTree }) {
  const width = 320;
  const height = 174;
  const nodeHeight = 14;
  const leaves = countLeaves(tree);
  const nodes: Array<{
    id: string;
    label: string;
    depth: number;
    x: number;
    y: number;
    color: string;
    parentId: string | null;
  }> = [];
  let leafIndex = 0;

  const place = (
    node: PreviewTree,
    depth: number,
    color: string,
    parentId: string | null,
  ): number => {
    const id = `${parentId ?? 'root'}-${depth}-${nodes.length}`;
    const nodeColor = depth === 1 ? treeColors[nodes.filter(item => item.depth === 1).length % treeColors.length] : color;
    const childIds = (node.children ?? []).map(child => place(child, depth + 1, nodeColor, id));
    const x = childIds.length
      ? childIds.reduce((sum, childX) => sum + childX, 0) / childIds.length
      : 22 + leafIndex++ * ((width - 44) / Math.max(1, leaves - 1));
    nodes.push({ id, label: node.label, depth, x, y: 20 + depth * 62, color: nodeColor, parentId });
    return x;
  };
  place(tree, 0, treeColors[0], null);
  const byId = new Map(nodes.map(node => [node.id, node]));
  const nodeWidth = (depth: number) => depth === 0 ? 88 : depth === 1 ? 58 : 48;

  return (
    <TreePreviewSurface tree={tree} height={height} layout="vertical">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: '100%' }}>
        {nodes.filter(node => node.parentId).map(node => {
          const parent = byId.get(node.parentId!)!;
          return (
            <path
              key={`edge-${node.id}`}
              d={`M${parent.x} ${parent.y + nodeHeight / 2} C${parent.x} ${parent.y + 28} ${node.x} ${node.y - 28} ${node.x} ${node.y - nodeHeight / 2}`}
              fill="none"
              stroke={node.color}
              strokeOpacity=".58"
              strokeWidth="1.2"
            />
          );
        })}
        {nodes.map(node => (
          <g key={node.id}>
            <rect
              x={node.x - nodeWidth(node.depth) / 2}
              y={node.y - nodeHeight / 2}
              width={nodeWidth(node.depth)}
              height={nodeHeight}
              rx={node.depth === 0 ? 6 : 4}
              fill={node.depth === 0 ? '#087f8c' : node.depth === 1 ? `${node.color}18` : '#fff'}
              stroke={node.depth === 0 ? '#087f8c' : node.color}
              strokeOpacity={node.depth === 0 ? 1 : node.depth === 1 ? '.7' : '.38'}
              strokeWidth={node.depth === 0 ? 1 : '.8'}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={node.depth === 0 ? '#fff' : '#343c32'}
              fontSize={node.depth === 0 ? 6.3 : 5.8}
              fontWeight={node.depth < 2 ? 700 : 500}
            >
              {truncateTreeLabel(node.label)}
            </text>
          </g>
        ))}
      </svg>
    </TreePreviewSurface>
  );
}

function MindmapTreePreview({ tree }: { tree: PreviewTree }) {
  const width = 320;
  const height = 174;
  const nodeHeight = 14;
  const root = { id: 'root', label: tree.label, x: 122, y: 80, width: 76, depth: 0, color: treeColors[0], parentId: null as string | null };
  const nodes = [root];
  const branchPositions = [
    { x: 214, y: 38, leafX: 269 },
    { x: 52, y: 80, leafX: 3 },
    { x: 214, y: 122, leafX: 269 },
  ];

  tree.children?.forEach((branch, branchIndex) => {
    const position = branchPositions[branchIndex % branchPositions.length];
    const color = treeColors[branchIndex % treeColors.length];
    const branchId = `branch-${branchIndex}`;
    const branchNode = {
      id: branchId,
      label: branch.label,
      x: position.x,
      y: position.y,
      width: 54,
      depth: 1,
      color,
      parentId: root.id,
    };
    nodes.push(branchNode);
    branch.children?.slice(0, 2).forEach((leaf, leafIndex) => {
      nodes.push({
        id: `${branchId}-leaf-${leafIndex}`,
        label: leaf.label,
        x: position.leafX,
        y: position.y + (leafIndex === 0 ? -12 : 12),
        width: 48,
        depth: 2,
        color,
        parentId: branchId,
      });
    });
  });
  const byId = new Map(nodes.map(node => [node.id, node]));

  return (
    <TreePreviewSurface tree={tree} height={height} layout="mindmap">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: '100%' }}>
        {nodes.filter(node => node.parentId).map(node => {
          const parent = byId.get(node.parentId!)!;
          const isLeft = node.x < parent.x;
          const startX = isLeft ? parent.x : parent.x + parent.width;
          const endX = isLeft ? node.x + node.width : node.x;
          const bend = (endX - startX) / 2;
          return (
            <path
              key={`edge-${node.id}`}
              d={`M${startX} ${parent.y} C${startX + bend} ${parent.y} ${startX + bend} ${node.y} ${endX} ${node.y}`}
              fill="none"
              stroke={node.color}
              strokeOpacity=".58"
              strokeWidth="1.2"
            />
          );
        })}
        {nodes.map(node => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y - nodeHeight / 2}
              width={node.width}
              height={nodeHeight}
              rx={node.depth === 0 ? 6 : 4}
              fill={node.depth === 0 ? '#087f8c' : node.depth === 1 ? `${node.color}18` : '#fff'}
              stroke={node.depth === 0 ? '#087f8c' : node.color}
              strokeOpacity={node.depth === 0 ? 1 : node.depth === 1 ? '.7' : '.38'}
              strokeWidth={node.depth === 0 ? 1 : '.8'}
            />
            <text
              x={node.x + node.width / 2}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={node.depth === 0 ? '#fff' : '#343c32'}
              fontSize={node.depth === 0 ? 6.1 : 5.6}
              fontWeight={node.depth < 2 ? 700 : 500}
            >
              {truncateTreeLabel(node.label)}
            </text>
          </g>
        ))}
      </svg>
    </TreePreviewSurface>
  );
}

function TreePreviewSurface({
  tree,
  height,
  layout,
  children,
}: {
  tree: PreviewTree;
  height: number;
  layout: 'vertical' | 'mindmap';
  children: React.ReactElement;
}) {
  return (
    <Box
      role="img"
      aria-label={`Carte mentale sans image, disposition ${layout === 'vertical' ? 'verticale' : 'radiale'} : ${tree.label}`}
      sx={{ height, mb: 1, overflow: 'hidden', border: '1px solid rgba(125,115,148,.22)', borderRadius: 2, bgcolor: '#f5f7ef' }}
    >
      {children}
    </Box>
  );
}

function countLeaves(node: PreviewTree): number {
  return node.children?.length
    ? node.children.reduce((sum, child) => sum + countLeaves(child), 0)
    : 1;
}

function truncateTreeLabel(label: string): string {
  return label.length > 15 ? `${label.slice(0, 14)}…` : label;
}

const illustratedTemplates: Array<{
  template: TemplatePlugin;
  description: string;
  category: string;
}> = [
  { template: IllustratedSolarSystemTemplate, description: 'Explorez les planètes et leurs liens.', category: 'Sciences' },
  { template: IllustratedHistoryTemplate, description: 'Reliez les événements aux grandes étapes.', category: 'Histoire' },
  { template: IllustratedEgyptTemplate, description: 'Comprenez le rôle du Nil et des pharaons.', category: 'Histoire' },
  { template: IllustratedLearningTemplate, description: 'Comprendre, mémoriser, s’entraîner.', category: 'Éducation' },
];

export default function IllustratedShowcase({ variant }: { variant: 'featured' | 'gallery' }) {
  if (variant === 'featured') {
    return (
      <Box
        sx={{
          position: 'relative',
          minWidth: 0,
          overflow: 'hidden',
          p: { xs: 2, sm: 3 },
          border: '1px solid',
          borderColor: 'rgba(0,124,145,.14)',
          borderRadius: { xs: 4, md: 5 },
          background: 'linear-gradient(145deg, #edf7f4 0%, #f5f3e9 100%)',
          boxShadow: '0 28px 72px rgba(32,45,50,.12)',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 220,
            height: 220,
            top: -110,
            right: -80,
            borderRadius: '50%',
            bgcolor: 'rgba(0,124,145,.08)',
          },
        }}
      >
        <Stack spacing={1.5} sx={{ position: 'relative' }}>
          <Chip
            icon={<AccountTreeRounded />}
            label="APPRENDRE · COMPRENDRE · RETENIR"
            size="small"
            sx={{
              alignSelf: 'flex-start',
              bgcolor: 'rgba(255,255,255,.82)',
              color: 'primary.dark',
              fontSize: 10,
              fontWeight: 750,
              letterSpacing: '.04em',
            }}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 1.5 }}>
            <Card variant="outlined" sx={{ minWidth: 0, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,.88)' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1} sx={{ mb: 0.75 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>Atlas du système solaire</Typography>
                  <Typography variant="caption" color="text.secondary">8 planètes</Typography>
                </Stack>
                <Box role="img" aria-label="Atlas illustré du système solaire, avec le Soleil et les planètes">
                  <TemplatePreview template={IllustratedSolarSystemTemplate} darkMode={false} size="detail" />
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 0, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,.88)' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1} sx={{ mb: 0.75 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>Frise historique</Typography>
                  <Typography variant="caption" color="text.secondary">1789–1799</Typography>
                </Stack>
                <TextTreePreview tree={textTreeExamples[IllustratedHistoryTemplate.meta.id]} />
              </CardContent>
            </Card>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Une vue d’ensemble pour mieux comprendre et mémoriser.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        gap: { xs: 1.5, md: 2 },
      }}
    >
      {illustratedTemplates.map(({ template, description, category }) => (
        <Card
          key={template.meta.id}
          variant="outlined"
          sx={{
            minWidth: 0,
            borderRadius: 3,
            borderColor: 'rgba(52,58,64,.12)',
            bgcolor: '#fff',
            transition: 'transform .18s ease, box-shadow .18s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px rgba(32,45,50,.10)' },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {template.meta.id === IllustratedSolarSystemTemplate.meta.id
              || template.meta.id === IllustratedHistoryTemplate.meta.id ? (
                <Box role="img" aria-label={`Aperçu illustré du modèle ${template.meta.name}`}>
                  <TemplatePreview template={template} darkMode={false} />
                </Box>
              ) : (
                <TextTreePreview
                  tree={textTreeExamples[template.meta.id]}
                  layout={template.meta.id === IllustratedEgyptTemplate.meta.id ? 'vertical' : 'mindmap'}
                />
              )}
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 0.75 }}>
              <Typography variant="subtitle1" sx={{ minWidth: 0, fontWeight: 750, lineHeight: 1.25 }}>
                {template.meta.name}
              </Typography>
              <Chip
                label={category}
                size="small"
                sx={{
                  flexShrink: 0,
                  height: 22,
                  bgcolor: 'rgba(0,124,145,.08)',
                  color: 'primary.dark',
                  fontSize: 10,
                  fontWeight: 650,
                }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
