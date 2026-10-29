import React, { useEffect, useState } from 'react';
import {
  Button, FormControl, Popover,
  InputLabel, MenuItem, Select, Stack, ToggleButton, Tooltip, Typography,
} from '@mui/material';
import {
  FormatAlignCenterRounded, FormatAlignLeftRounded, FormatAlignRightRounded,
  FormatBoldRounded, FormatColorTextRounded, FormatItalicRounded,
  FormatStrikethroughRounded, FormatUnderlinedRounded,
} from '@mui/icons-material';
import type { MindNode, NodeTextBullet, NodeTextLineHeight, NodeTextStyle } from '../types';
import type { NodeTextAttrs } from '../plugins/types';

interface TextFormattingPopoverProps {
  anchorEl: Element | null;
  node: MindNode | null;
  range: { start: number; end: number } | null;
  rangeFormat: Partial<NodeTextStyle>;
  defaults: NodeTextAttrs;
  selectionCount: number;
  darkMode: boolean;
  onApplyTextStyle: (changes: Partial<NodeTextStyle>) => void;
  onApplyParagraph: (changes: Partial<Pick<MindNode, 'textAlign' | 'textLineHeight' | 'textBullet'>>) => void;
  onResetFormatting: () => void;
  onClose: () => void;
}

const FONT_FAMILIES = [
  { label: 'Par défaut', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];
const LINE_HEIGHTS: NodeTextLineHeight[] = [1, 1.25, 1.5, 2];

export const TextFormattingPopover: React.FC<TextFormattingPopoverProps> = ({
  anchorEl, node, range, rangeFormat, defaults, selectionCount, darkMode,
  onApplyTextStyle, onApplyParagraph, onResetFormatting, onClose,
}) => {
  const open = Boolean(anchorEl);
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState<number | ''>(14);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [textColor, setTextColor] = useState('');
  const [textBackgroundColor, setTextBackgroundColor] = useState('');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [lineHeight, setLineHeight] = useState<NodeTextLineHeight>(1.25);
  const [bullet, setBullet] = useState('');

  useEffect(() => {
    if (!open || !node) return;
    setFontFamily(rangeFormat.fontFamily ?? '');
    setFontSize(rangeFormat.fontSize ?? '');
    setBold(rangeFormat.textBold ?? Number(defaults.fontWeight) >= 600);
    setItalic(rangeFormat.textItalic ?? false);
    setUnderline(rangeFormat.textUnderline ?? false);
    setStrikethrough(rangeFormat.textStrikethrough ?? false);
    setTextColor(rangeFormat.textColor ?? '');
    setTextBackgroundColor(rangeFormat.textBackgroundColor ?? '');
    setTextAlign(node.textAlign ?? 'center');
    setLineHeight(node.textLineHeight ?? 1.25);
    setBullet(node.textBullet ?? '');
  }, [open, node?.id, range?.start, range?.end, rangeFormat]);

  const applyStyle = <K extends keyof NodeTextStyle>(key: K, value: NodeTextStyle[K]) => {
    onApplyTextStyle({ [key]: value } as Pick<NodeTextStyle, K>);
  };
  const applyParagraph = <K extends 'textAlign' | 'textLineHeight' | 'textBullet'>(
    key: K,
    value: MindNode[K],
  ) => {
    onApplyParagraph({ [key]: value } as Pick<MindNode, K>);
  };
  const reset = () => {
    onResetFormatting();
    setFontFamily('');
    setFontSize('');
    setBold(Number(defaults.fontWeight) >= 600);
    setItalic(false);
    setUnderline(false);
    setStrikethrough(false);
    setTextColor('');
    setTextBackgroundColor('');
    setTextAlign('center');
    setLineHeight(1.25);
    setBullet('');
  };

  const border = darkMode ? '#3a3c5a' : '#e0e4ea';
  const label = darkMode ? '#e8eaf6' : '#30372b';
  const muted = darkMode ? '#a0a3b8' : '#777f72';
  const pickerSx = {
    position: 'relative',
    width: 36,
    height: 36,
    p: .5,
    border: '1px solid',
    borderColor: border,
    borderRadius: 1.5,
    bgcolor: darkMode ? '#22243c' : '#fff',
    cursor: 'pointer',
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      disableAutoFocus
      disableEnforceFocus
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      marginThreshold={16}
      slotProps={{
        paper: {
          sx: {
            width: 'min(440px, calc(100vw - 24px))',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            borderRadius: 3,
          },
        },
      }}
    >
      <Stack spacing={2} sx={{ p: 2 }} data-text-formatting-popover="">
        <Typography id="text-formatting-title" variant="subtitle1" fontWeight={700}>
          Mise en forme du texte
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            · {selectionCount > 1 ? `${selectionCount} nœuds` : `${Math.max(0, (range?.end ?? 0) - (range?.start ?? 0))} caractères sélectionnés`}
          </Typography>
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" fullWidth>
            <InputLabel id="text-font-family-label">Police</InputLabel>
            <Select
              labelId="text-font-family-label"
              label="Police"
              value={fontFamily}
              onChange={event => {
                const value = event.target.value;
                setFontFamily(value);
                applyStyle('fontFamily', value || undefined);
              }}
            >
              {FONT_FAMILIES.map(font => (
                <MenuItem key={font.label} value={font.value} sx={{ fontFamily: font.value || 'inherit' }}>
                  {font.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 128 } }}>
            <InputLabel id="text-font-size-label">Taille</InputLabel>
            <Select
              labelId="text-font-size-label"
              label="Taille"
              value={fontSize}
              onChange={event => {
                const rawValue = event.target.value;
                const value = rawValue === '' ? '' : Number(rawValue);
                setFontSize(value);
                applyStyle('fontSize', value === '' ? undefined : value);
              }}
            >
              <MenuItem value="">Par défaut</MenuItem>
              {FONT_SIZES.map(size => <MenuItem key={size} value={size}>{size} px</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={.75} alignItems="center" flexWrap="wrap">
          {([
            ['Gras', bold, setBold, 'textBold', <FormatBoldRounded />],
            ['Italique', italic, setItalic, 'textItalic', <FormatItalicRounded />],
            ['Souligné', underline, setUnderline, 'textUnderline', <FormatUnderlinedRounded />],
            ['Barré', strikethrough, setStrikethrough, 'textStrikethrough', <FormatStrikethroughRounded />],
          ] as const).map(([title, active, setActive, field, icon]) => (
            <Tooltip key={field} title={title}>
              <ToggleButton
                size="small"
                value={field}
                selected={active}
                aria-label={title}
                onChange={() => {
                  const next = !active;
                  setActive(next);
                  applyStyle(field, next);
                }}
              >
                {icon}
              </ToggleButton>
            </Tooltip>
          ))}
          <FormControl size="small" sx={{ minWidth: 130, ml: 'auto !important' }}>
            <InputLabel id="text-line-height-label">Interligne</InputLabel>
            <Select
              labelId="text-line-height-label"
              label="Interligne"
              value={lineHeight}
              onChange={event => {
                const value = Number(event.target.value) as NodeTextLineHeight;
                setLineHeight(value);
                applyParagraph('textLineHeight', value);
              }}
            >
              {LINE_HEIGHTS.map(value => (
                <MenuItem key={value} value={value}>{value === 1 ? 'Simple' : `${value}×`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Couleur du texte">
              <Stack component="label" direction="row" alignItems="center" justifyContent="center" sx={pickerSx}>
                <FormatColorTextRounded sx={{ color: textColor || defaults.fill, fontSize: 19 }} />
                <input
                  type="color"
                  aria-label="Couleur du texte"
                  value={textColor || defaults.fill}
                  onChange={event => {
                    setTextColor(event.target.value);
                    applyStyle('textColor', event.target.value);
                  }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </Stack>
            </Tooltip>
            <Typography variant="body2">Couleur du texte</Typography>
            {textColor && (
              <Button size="small" onClick={() => { setTextColor(''); applyStyle('textColor', undefined); }}>
                Effacer
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Surlignage du texte">
              <Stack component="label" direction="row" alignItems="center" justifyContent="center" sx={pickerSx}>
                <span aria-hidden="true" style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: textBackgroundColor || 'transparent', border: `1px solid ${border}`,
                }} />
                <input
                  type="color"
                  aria-label="Couleur de surlignage du texte"
                  value={textBackgroundColor || '#fff176'}
                  onChange={event => {
                    setTextBackgroundColor(event.target.value);
                    applyStyle('textBackgroundColor', event.target.value);
                  }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </Stack>
            </Tooltip>
            <Typography variant="body2">Surlignage</Typography>
            {textBackgroundColor && (
              <Button size="small" onClick={() => { setTextBackgroundColor(''); applyStyle('textBackgroundColor', undefined); }}>
                Effacer
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" fullWidth>
            <InputLabel id="text-align-label">Alignement</InputLabel>
            <Select
              labelId="text-align-label"
              label="Alignement"
              value={textAlign}
              onChange={event => {
                const value = event.target.value as 'left' | 'center' | 'right';
                setTextAlign(value);
                applyParagraph('textAlign', value);
              }}
            >
              <MenuItem value="left"><FormatAlignLeftRounded sx={{ mr: 1 }} />Gauche</MenuItem>
              <MenuItem value="center"><FormatAlignCenterRounded sx={{ mr: 1 }} />Centré</MenuItem>
              <MenuItem value="right"><FormatAlignRightRounded sx={{ mr: 1 }} />Droite</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="text-bullet-label">Liste à puces</InputLabel>
            <Select
              labelId="text-bullet-label"
              label="Liste à puces"
              value={bullet}
              onChange={event => {
                const value = event.target.value as NodeTextBullet | '';
                setBullet(value);
                applyParagraph('textBullet', value || undefined);
              }}
            >
              <MenuItem value="">Aucune</MenuItem>
              <MenuItem value="disc">• Ronde</MenuItem>
              <MenuItem value="circle">◦ Cercle</MenuItem>
              <MenuItem value="square">▪ Carrée</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Button color="inherit" onClick={reset} sx={{ color: muted }}>Réinitialiser</Button>
          <Button variant="contained" onClick={onClose}>Terminé</Button>
        </Stack>
      </Stack>
    </Popover>
  );
};
