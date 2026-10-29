// ─────────────────────────────────────────────────────────────────────────────
// src/components/Inspector.tsx  v2
//
// Gitmind-inspired property panel with 3 tabs:
//   Style  — Couleur fond, texte, bordure, rayon, épaisseur, style de ligne
//   Contenu — Texte, notes Markdown, icône, priorité, numéro, étiquettes
//   Infos  — Profondeur, enfants, stats + actions rapides
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, IconButton, Slider, Stack, Tab as MuiTab, Tabs, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { AddRounded, CloseRounded, DeleteOutlineRounded, ExpandMoreRounded } from '@mui/icons-material';
import { MindNode, NodesMap, NodeBorderStyle, NodePriority, NodeShapeVariant } from '../types';
import { NodeIconPicker } from './NodeIconPicker';
import { createHarmonizedNodeFills } from '../canvas/color-contrast';

interface InspectorProps {
  node:       MindNode | null;
  nodes:      NodesMap;
  darkMode:   boolean;
  accentPalette: string[];
  canvasBackground: string;
  tab:        InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  shapeDefaults: { radius: number; width: number; style: NodeBorderStyle };
  onUpdate:   (id: string, changes: Partial<MindNode>) => void;
  onDelete:   (id: string) => void;
  onAddChild: (id: string) => void;
  onClose:    () => void;
}

// ─── Color palettes ───────────────────────────────────────────────────────────

const BORDER_STYLES = ['solid','dashed','dotted'] as const;
const NODE_SHAPES: { id: NodeShapeVariant | 'style'; label: string }[] = [
  { id: 'style', label: 'Automatique' },
  { id: 'rounded', label: 'Arrondi' },
  { id: 'capsule', label: 'Capsule' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'parallelogram', label: 'Incliné' },
  { id: 'hexagon', label: 'Hexagone' },
  { id: 'underline', label: 'Souligné' },
];

const PRIORITIES: { id: NodePriority; label: string; color: string }[] = [
  { id: 'none',     label: 'Aucune',   color: 'transparent' },
  { id: 'low',      label: 'Basse',    color: '#22c55e' },
  { id: 'medium',   label: 'Moyenne',  color: '#f5a623' },
  { id: 'high',     label: 'Haute',    color: '#e05c7b' },
  { id: 'critical', label: 'Critique', color: '#e74c3c' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export type InspectorTab = 'style' | 'content' | 'info';

export const Inspector: React.FC<InspectorProps> = ({
  node, nodes, darkMode, accentPalette, canvasBackground, tab, onTabChange, shapeDefaults, onUpdate, onDelete, onAddChild, onClose,
}) => {
  const [text,    setText]    = useState('');
  const [notes,   setNotes]   = useState('');
  const [tags,    setTags]    = useState('');
  const [radius,  setRadius]  = useState(shapeDefaults.radius);
  const [bWidth,  setBWidth]  = useState(shapeDefaults.width);
  const [bStyle,  setBStyle]  = useState<NodeBorderStyle>(shapeDefaults.style);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!node) return;
    setText(node.text);
    setNotes(node.notes ?? '');
    setTags((node.tags ?? []).join(', '));
    setRadius(node.borderRadius ?? shapeDefaults.radius);
    setBWidth(node.borderWidth ?? shapeDefaults.width);
    setBStyle(node.borderStyle ?? shapeDefaults.style);
  }, [
    node?.id, node?.borderRadius, node?.borderWidth, node?.borderStyle,
    shapeDefaults.radius, shapeDefaults.width, shapeDefaults.style,
  ]);

  if (!node) {
    return (
      <Box component="aside" sx={{
        width: { xs: 'min(300px, calc(100vw - 80px))', sm: 300 }, flexShrink: 0,
        bgcolor: darkMode ? '#1a1b30' : 'background.paper',
        borderLeft: '1px solid', borderColor: darkMode ? '#2e3060' : 'divider',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'text.secondary', gap: 1.25, p: 3, textAlign: 'center',
        position: { xs: 'absolute', sm: 'relative' },
        top: { xs: 60, sm: 0 }, right: { xs: 0, sm: 'auto' }, bottom: { xs: 0, sm: 'auto' },
        zIndex: 310,
      }}>
        <Typography sx={{ fontSize: 30, opacity: .45, color: 'primary.main' }}>✦</Typography>
        <Typography variant="body2">Sélectionnez un nœud pour voir ses propriétés.</Typography>
      </Box>
    );
  }

  const bg      = darkMode ? '#1a1b30' : '#ffffff';
  const border  = darkMode ? '#2e3060' : '#e0e6f0';
  const text2   = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted   = darkMode ? '#6070a0' : '#8090b8';
  const inputBg = darkMode ? '#22243c' : '#f8f9fc';
  const accent  = '#007c91';

  const depth = (() => {
    let d = 0; let cur = node.parentId;
    while (cur) { d++; cur = nodes[cur]?.parentId ?? null; }
    return d;
  })();
  const nodeAccent = node.color ?? accentPalette[depth % accentPalette.length] ?? '#007c91';
  const accentColors = Array.from(new Set([
    ...accentPalette,
    ...(node.color && !accentPalette.includes(node.color) ? [node.color] : []),
  ]));
  const fillColors = Array.from(new Set([
    ...createHarmonizedNodeFills(nodeAccent, canvasBackground),
    ...(node.bgColor ? [node.bgColor] : []),
  ]));
  const descendants = (() => {
    let count = 0; const q = [...node.children];
    while (q.length) { const id = q.shift()!; count++; q.push(...(nodes[id]?.children ?? [])); }
    return count;
  })();

  const sectionSx = { mb: 2.25 };
  const sectionLabelSx = {
    display: 'block',
    mb: .75,
    color: muted,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.07em',
    lineHeight: 1.4,
  };
  const toggleGroupSx = {
    display: 'flex',
    '& .MuiToggleButton-root': {
      color: muted,
      borderColor: border,
      '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)' },
      '&.Mui-selected': {
        color: darkMode ? '#e8eaf6' : accent,
        bgcolor: darkMode ? `${accent}55` : `${accent}28`,
      },
      '&.Mui-selected:hover': { bgcolor: darkMode ? `${accent}70` : `${accent}38` },
    },
  };
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: inputBg,
      color: text2,
      fontSize: 13,
      '& fieldset': { borderColor: border },
      '&:hover fieldset': { borderColor: muted },
      '&.Mui-focused fieldset': { borderColor: accent },
    },
    '& .MuiInputLabel-root': { color: muted },
  };
  const commitText = () => {
    if (text.trim() && text !== node.text) onUpdate(node.id, { text: text.trim() });
  };
  const commitNotes = (val: string) => {
    setNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => onUpdate(node.id, { notes: val }), 400);
  };
  const commitTags = (val: string) => {
    const parsed = val.split(',').map(s => s.trim()).filter(Boolean);
    onUpdate(node.id, { tags: parsed });
  };

  return (
    <Box component="aside" sx={{
      width: { xs: 'min(300px, calc(100vw - 80px))', sm: 300 }, flexShrink: 0,
      bgcolor: bg, borderLeft: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: { xs: 'absolute', sm: 'relative' },
      top: { xs: 60, sm: 0 }, right: { xs: 0, sm: 'auto' }, bottom: { xs: 0, sm: 'auto' },
      zIndex: 310,
      color: text2,
    }}>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.75, pt: 1.5 }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: text2, maxWidth: 220 }}>
          {node.text}
        </Typography>
        <Tooltip title="Fermer les propriétés">
          <IconButton size="small" aria-label="Fermer les propriétés" onClick={onClose} sx={{ color: muted }}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Tabs ── */}
      <Tabs
        value={tab}
        onChange={(_, value: InspectorTab) => onTabChange(value)}
        variant="fullWidth"
        aria-label="Propriétés du nœud"
        sx={{
          minHeight: 42, borderBottom: `1px solid ${border}`, px: 1,
          '& .MuiTab-root': { minHeight: 42, minWidth: 0, fontSize: 12, textTransform: 'none', color: muted },
          '& .Mui-selected': { color: `${accent} !important`, fontWeight: 700 },
          '& .MuiTabs-indicator': { bgcolor: accent },
        }}
      >
        <MuiTab value="style" label="Style" />
        <MuiTab value="content" label="Contenu" />
        <MuiTab value="info" label="Infos" />
      </Tabs>

      {/* ── Body ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>

        {/* ════════ STYLE TAB ════════ */}
        {tab === 'style' && (
          <>
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Forme du nœud</Typography>
              <ToggleButtonGroup
                exclusive
                value={node.nodeShape ?? 'style'}
                aria-label="Forme du nœud"
                onChange={(_, value: NodeShapeVariant | 'style' | null) => {
                  if (value !== null) {
                    onUpdate(node.id, {
                      nodeShape: value === 'style' ? undefined : value,
                      borderRadius: undefined,
                    });
                  }
                }}
                sx={{
                  ...toggleGroupSx,
                  display: 'flex',
                  flexWrap: 'wrap',
                  '& .MuiToggleButton-root': {
                    ...toggleGroupSx['& .MuiToggleButton-root'],
                    flex: '1 0 30%',
                    minWidth: 0,
                    px: .5,
                    py: .75,
                    fontSize: 10,
                    textTransform: 'none',
                  },
                }}
              >
                {NODE_SHAPES.map(shape => (
                  <ToggleButton key={shape.id} value={shape.id} aria-label={`Forme ${shape.label}`}>
                    {shape.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Node color (accent) */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Couleur du nœud</Typography>
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={.5}>
                {accentColors.map(c => (
                  <IconButton key={c} title={`Couleur ${c}`} aria-label={`Choisir la couleur ${c}`}
                    aria-pressed={node.color === c} onClick={() => onUpdate(node.id, { color: c })}
                    sx={{
                      width: 26, height: 26, borderRadius: 1.25, p: 0,
                      bgcolor: c, border: '2px solid',
                      borderColor: node.color === c ? 'text.primary' : 'transparent',
                      '&:hover': { bgcolor: c, filter: 'brightness(.92)' },
                    }}
                  />
                ))}
                <Button size="small" variant={!node.color ? 'contained' : 'outlined'}
                  aria-pressed={!node.color}
                  onClick={() => onUpdate(node.id, { color: undefined })}
                  sx={{ minWidth: 42, px: .75, fontSize: 10 }}>
                  Auto
                </Button>
              </Stack>
            </Box>

            {/* Background fill */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Fond du nœud</Typography>
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={.5}>
                {fillColors.map(c => (
                  <IconButton key={c} title={`Fond ${c}`} aria-label={`Choisir le fond ${c}`}
                    aria-pressed={node.bgColor === c} onClick={() => onUpdate(node.id, { bgColor: c })}
                    sx={{
                      width: 26, height: 26, borderRadius: 1.25, p: 0,
                      bgcolor: c, border: '1px solid',
                      borderColor: node.bgColor === c ? accent : border,
                      boxShadow: node.bgColor === c ? `inset 0 0 0 1px ${accent}` : 'none',
                      '&:hover': { bgcolor: c, filter: 'brightness(.96)' },
                    }}
                  />
                ))}
                <Button size="small" variant={!node.bgColor ? 'contained' : 'outlined'}
                  aria-pressed={!node.bgColor}
                  onClick={() => onUpdate(node.id, { bgColor: undefined })}
                  sx={{ minWidth: 42, px: .75, fontSize: 10 }}>
                  Auto
                </Button>
              </Stack>
            </Box>

            {/* Custom hex color */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Couleur personnalisée</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField type="color" size="small" value={node.color ?? '#4f8ef7'}
                  aria-label="Choisir une couleur personnalisée"
                  onChange={e => onUpdate(node.id, { color: e.target.value })}
                  sx={{
                    width: 56,
                    '& input': { p: .5, height: 30, cursor: 'pointer' },
                    '& fieldset': { borderColor: border },
                  }}
                />
                <TextField value={node.color ?? ''} placeholder="#007c91" size="small"
                  aria-label="Code couleur personnalisé"
                  onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onUpdate(node.id, { color: e.target.value })}
                  onKeyDown={e => e.stopPropagation()}
                  sx={{ ...fieldSx, flex: 1 }}
                />
              </Stack>
            </Box>

            {/* Divider */}
            <div style={{ height: 1, background: border, marginBottom: 18 }} />

            {/* Border radius */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Arrondi des coins</Typography>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Slider min={0} max={24} value={radius}
                  aria-label="Arrondi des coins"
                  onChange={(_, value) => { if (typeof value === 'number') setRadius(value); }}
                  onChangeCommitted={(_, value) => {
                    if (typeof value === 'number') onUpdate(node.id, { borderRadius: value });
                  }}
                  sx={{ flex: 1, color: accent }}
                />
                <Typography variant="caption" sx={{ minWidth: 28, color: text2, textAlign: 'right' }}>{radius}</Typography>
              </Stack>
              <ToggleButtonGroup exclusive size="small" value={radius}
                aria-label="Préréglages d’arrondi des coins"
                onChange={(_, value: number | null) => {
                  if (value !== null) {
                    setRadius(value);
                    onUpdate(node.id, { borderRadius: value });
                  }
                }}
                sx={{ ...toggleGroupSx, mt: 1 }}>
                {[0, 6, 12, 20].map(r => (
                  <ToggleButton key={r} value={r} aria-label={`Arrondi ${r} pixels`}
                    sx={{ flex: 1, height: 30, fontSize: 11, borderRadius: `${r / 2.5}px !important` }}>
                    {r}px
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Border */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Bordure</Typography>
              <ToggleButtonGroup exclusive size="small" value={bStyle}
                aria-label="Style de bordure"
                onChange={(_, value: NodeBorderStyle | null) => {
                  if (value !== null) {
                    setBStyle(value);
                    onUpdate(node.id, { borderStyle: value });
                  }
                }}
                sx={toggleGroupSx}>
                {BORDER_STYLES.map(s => (
                  <ToggleButton key={s} value={s} aria-label={`Bordure ${s}`}
                    sx={{ flex: 1, height: 32, fontSize: 12 }}>
                    {s === 'solid' ? '—' : s === 'dashed' ? '- -' : '···'}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: muted, minWidth: 60 }}>Épaisseur</Typography>
                <Slider min={0} max={5} step={0.5} value={bWidth}
                  aria-label="Épaisseur de la bordure"
                  onChange={(_, value) => { if (typeof value === 'number') setBWidth(value); }}
                  onChangeCommitted={(_, value) => {
                    if (typeof value === 'number') onUpdate(node.id, { borderWidth: value });
                  }}
                  sx={{ flex: 1, color: accent }}
                />
                <Typography variant="caption" sx={{ minWidth: 32, color: text2, textAlign: 'right' }}>{bWidth}px</Typography>
              </Stack>
              {(node.borderRadius !== undefined || node.borderWidth !== undefined || node.borderStyle !== undefined) && (
                <Button size="small" color="inherit"
                  onClick={() => {
                    setRadius(shapeDefaults.radius);
                    setBWidth(shapeDefaults.width);
                    setBStyle(shapeDefaults.style);
                    onUpdate(node.id, {
                      borderRadius: undefined,
                      borderWidth: undefined,
                      borderStyle: undefined,
                    });
                  }}
                  sx={{ mt: .5, px: 0, minWidth: 0, textTransform: 'none' }}>
                  Rétablir le style par défaut
                </Button>
              )}
            </Box>
          </>
        )}

        {/* ════════ CONTENT TAB ════════ */}
        {tab === 'content' && (
          <>
            {/* Node text */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Texte du nœud</Typography>
              <TextField value={text} size="small" fullWidth
                aria-label="Texte du nœud"
                onChange={e => setText(e.target.value)}
                onBlur={commitText}
                onKeyDown={e => { if (e.key === 'Enter') commitText(); e.stopPropagation(); }}
                sx={fieldSx}
              />
            </Box>

            {/* Icon picker */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Icône</Typography>
              <NodeIconPicker
                value={node.icon}
                darkMode={darkMode}
                compact
                onChange={icon => onUpdate(node.id, { icon })}
              />
            </Box>

            {/* Task status */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Tâche</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  checked={node.taskStatus === 'done'}
                  disabled={!node.taskStatus}
                  onChange={event => onUpdate(node.id, {
                    taskStatus: event.target.checked ? 'done' : 'open',
                  })}
                  inputProps={{ 'aria-label': 'Tâche terminée' }}
                  sx={{ p: .5 }}
                />
                <Button
                  size="small"
                  variant={node.taskStatus ? 'outlined' : 'contained'}
                  onClick={() => onUpdate(node.id, {
                    taskStatus: node.taskStatus ? undefined : 'open',
                  })}
                  sx={{ textTransform: 'none' }}
                >
                  {node.taskStatus ? 'Retirer la tâche' : 'Convertir en tâche'}
                </Button>
                <Typography variant="caption" sx={{ color: muted }}>
                  {node.taskStatus === 'done' ? 'Terminée' : node.taskStatus === 'open' ? 'À faire' : ''}
                </Typography>
              </Stack>
            </Box>

            {/* Priority */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Priorité</Typography>
              <ToggleButtonGroup exclusive fullWidth size="small" value={node.priority ?? 'none'}
                aria-label="Priorité du nœud"
                onChange={(_, value: NodePriority | null) => {
                  if (value !== null) onUpdate(node.id, { priority: value });
                }}
                sx={{ '& .MuiToggleButton-root': { px: .25, fontSize: 10, lineHeight: 1.2 } }}>
                {PRIORITIES.map(p => (
                  <ToggleButton key={p.id} value={p.id} aria-label={`Priorité ${p.label}`}
                    sx={{
                      minHeight: 32,
                      color: node.priority === p.id && p.color !== 'transparent' ? p.color : muted,
                      '&.Mui-selected': {
                          color: p.color === 'transparent' ? (darkMode ? '#e8eaf6' : accent) : p.color,
                          bgcolor: p.color === 'transparent'
                            ? (darkMode ? `${accent}55` : `${accent}15`)
                            : `${p.color}20`,
                        },
                    }}>
                    {p.id !== 'none' && (
                      <Box component="span" sx={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', bgcolor: p.color, mr: .5 }} />
                    )}
                    {p.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Number label */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Numérotation</Typography>
              <TextField value={node.number ?? ''} size="small" fullWidth
                aria-label="Numérotation du nœud"
                onChange={e => onUpdate(node.id, { number: e.target.value || undefined })}
                onKeyDown={e => e.stopPropagation()}
                placeholder="ex: 1.2.3"
                sx={fieldSx}
              />
            </Box>

            {/* Tags */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Étiquettes (séparées par virgule)</Typography>
              <TextField value={tags} size="small" fullWidth
                aria-label="Étiquettes séparées par des virgules"
                onChange={e => setTags(e.target.value)}
                onBlur={e => commitTags(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitTags(tags); e.stopPropagation(); }}
                placeholder="design, urgent, v2…"
                sx={fieldSx}
              />
              {node.tags && node.tags.length > 0 && (
                <Stack direction="row" useFlexGap flexWrap="wrap" gap={.5} sx={{ mt: .875 }}>
                  {node.tags.map(t => (
                    <Chip key={t} label={t} size="small"
                      sx={{ bgcolor: `${accent}15`, color: accent, fontSize: 11, fontWeight: 600 }} />
                  ))}
                </Stack>
              )}
            </Box>

            {/* Notes */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Notes (Markdown)</Typography>
              <TextField value={notes} multiline minRows={5} fullWidth
                aria-label="Notes en Markdown"
                onChange={e => commitNotes(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                placeholder="Ajoutez vos notes ici…"
                sx={{
                  ...fieldSx,
                  '& textarea': { fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, lineHeight: 1.55 },
                }}
              />
            </Box>
          </>
        )}

        {/* ════════ INFO TAB ════════ */}
        {tab === 'info' && (
          <>
            {/* Stats grid */}
            <Box sx={{
              ...sectionSx,
              bgcolor: darkMode ? '#22243c' : '#f4f6fb',
              borderRadius: 2.5, p: 1.75,
            }}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Statistiques</Typography>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 14px', fontSize: 12 }}>
                {[
                  ['Profondeur', depth],
                  ['Enfants directs', node.children.length],
                  ['Total descendants', descendants],
                  ['Replié', node.collapsed ? 'Oui' : 'Non'],
                  ['Icône', node.icon !== 'none' ? node.icon ?? '—' : '—'],
                  ['Priorité', node.priority ?? 'none'],
                  ['Étiquettes', (node.tags?.length ?? 0)],
                  ['Notes', node.notes ? `${node.notes.length} cars` : '—'],
                ].map(([k, v]) => (
                  <React.Fragment key={String(k)}>
                    <span style={{ color: muted }}>{k}</span>
                    <span style={{ color: text2, fontWeight: 600, textAlign: 'right' }}>{String(v)}</span>
                  </React.Fragment>
                ))}
              </div>
            </Box>

            {/* Node ID */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Identifiant</Typography>
              <div style={{
                padding: '6px 10px', borderRadius: 6,
                background: inputBg, border: `1px solid ${border}`,
                fontSize: 11, fontFamily: 'monospace', color: muted,
                wordBreak: 'break-all',
              }}>{node.id}</div>
            </Box>

            {/* Position */}
            <Box sx={sectionSx}>
              <Typography component="div" variant="overline" sx={sectionLabelSx}>Position</Typography>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: muted, display: 'block', marginBottom: 3 }}>X</span>
                  <TextField type="number" size="small" value={Math.round(node.x)}
                    aria-label="Position X"
                    onChange={e => onUpdate(node.id, { x: +e.target.value })}
                    onKeyDown={e => e.stopPropagation()}
                    sx={{ ...fieldSx, '& input': { textAlign: 'center' } }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, color: muted, display: 'block', marginBottom: 3 }}>Y</span>
                  <TextField type="number" size="small" value={Math.round(node.y)}
                    aria-label="Position Y"
                    onChange={e => onUpdate(node.id, { y: +e.target.value })}
                    onKeyDown={e => e.stopPropagation()}
                    sx={{ ...fieldSx, '& input': { textAlign: 'center' } }}
                  />
                </div>
              </div>
            </Box>

            {/* Divider */}
            <div style={{ height: 1, background: border, marginBottom: 18 }} />

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="contained" startIcon={<AddRounded />} onClick={() => onAddChild(node.id)}>
                Ajouter un enfant
              </Button>

              <Button
                variant="outlined"
                startIcon={<ExpandMoreRounded sx={{ transform: node.collapsed ? 'rotate(-90deg)' : 'none' }} />}
                onClick={() => onUpdate(node.id, { collapsed: !node.collapsed })}
              >
                {node.collapsed ? 'Déplier les enfants' : 'Replier les enfants'}
              </Button>

              {node.parentId && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineRounded />}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Supprimer ce nœud
                </Button>
              )}
            </div>
          </>
        )}
      </Box>
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-node-title"
      >
        <DialogTitle id="delete-node-title">Supprimer ce nœud ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            « {node.text} » et tous ses nœuds enfants seront supprimés. Cette action est définitive.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              onDelete(node.id);
              setDeleteConfirmOpen(false);
            }}
          >
            Supprimer le nœud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
