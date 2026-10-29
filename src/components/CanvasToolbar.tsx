import React, { useState } from 'react';
import {
  Box, Checkbox, Chip, Divider, IconButton, InputAdornment, Menu, MenuItem,
  Paper, Slider, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AddCircleOutlineRounded, ArrowBackRounded, ArrowForwardRounded, AutoFixHighRounded,
  ExtensionRounded, MapOutlined, MoreHorizRounded,
  FilterListRounded, SearchRounded, SettingsOutlined, SlideshowRounded, LinkRounded,
} from '@mui/icons-material';
import { MapDocument, MindNode, NodePriority, NodeTextStyle, NodesMap } from '../types';
import { DocPluginPrefs } from '../types/index';
import type { NodeTextAttrs } from '../plugins/types';
import { ExportDropdown } from './UIHelpers';
import { TextFormattingPopover } from './TextFormattingPopover';
import type { SearchFilters } from '../canvas/search';

interface CanvasToolbarProps {
  doc: MapDocument;
  nodes: NodesMap;
  darkMode: boolean;
  svgRef: React.RefObject<SVGSVGElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  searchQ: string;
  setSearchQ: (q: string) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  searchMatchCount: number;
  activeSearchIndex: number;
  onNavigateSearchMatch: (direction: 1 | -1) => void;
  applyLayout: (spacingOverrides?: Partial<Pick<DocPluginPrefs, 'spacingH' | 'spacingV'>>) => void;
  onPluginPrefsChange: (docId: string, prefs: DocPluginPrefs) => void;
  selectedId: string | null;
  selectedNode: MindNode | null;
  selectedTextRange: { start: number; end: number } | null;
  selectedTextFormat: Partial<NodeTextStyle>;
  selectedTextDefaults: NodeTextAttrs;
  selCount: number;
  textFormattingAnchor: Element | null;
  onCloseTextFormatting: () => void;
  onApplyTextStyle: (changes: Partial<NodeTextStyle>) => void;
  onApplyParagraph: (changes: Partial<Pick<MindNode, 'textAlign' | 'textLineHeight' | 'textBullet'>>) => void;
  onResetTextFormatting: () => void;
  inspectorOpen: boolean;
  setInspectorOpen: (v: boolean) => void;
  insertOpen: boolean;
  setInsertOpen: (v: boolean) => void;
  minimapOpen: boolean;
  setMinimapOpen: (v: boolean) => void;
  setSlideshow: (id: string | null) => void;
  linkMode: boolean;
  setLinkMode: (v: boolean) => void;
  setLinkFrom: (id: string | null) => void;
  onOpenPluginPicker: () => void;
}

const iconButtonSx = (darkMode: boolean, active = false) => ({
  width: 34,
  height: 34,
  borderRadius: 2,
  color: active ? '#fff' : darkMode ? '#d9dced' : '#596253',
  bgcolor: active ? 'primary.main' : 'transparent',
  '&:hover': { bgcolor: active ? 'primary.dark' : darkMode ? '#2b2d42' : '#f0f2ed' },
});

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  doc, nodes, darkMode, svgRef, searchInputRef,
  searchQ, setSearchQ, searchFilters, setSearchFilters,
  searchMatchCount, activeSearchIndex, onNavigateSearchMatch,
  applyLayout, onPluginPrefsChange,
  selectedId, selectedNode, selectedTextRange, selectedTextFormat, selectedTextDefaults,
  selCount, textFormattingAnchor, onCloseTextFormatting,
  onApplyTextStyle, onApplyParagraph, onResetTextFormatting,
  inspectorOpen, setInspectorOpen,
  insertOpen, setInsertOpen,
  minimapOpen, setMinimapOpen,
  setSlideshow,
  linkMode, setLinkMode, setLinkFrom,
  onOpenPluginPicker,
}) => {
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [searchFilterAnchor, setSearchFilterAnchor] = useState<HTMLElement | null>(null);
  const bg = darkMode ? 'rgba(25,26,45,.96)' : 'rgba(255,255,255,.96)';
  const border = darkMode ? '#353750' : '#e5e8e1';
  const text = darkMode ? '#e5e7f2' : '#30372b';
  const muted = darkMode ? '#a0a3b8' : '#777f72';
  const priorityOptions: [NodePriority, string][] = [
    ['none', 'Sans priorité'],
    ['low', 'Faible'],
    ['medium', 'Moyenne'],
    ['high', 'Haute'],
    ['critical', 'Critique'],
  ];

  return (
    <>
      <Paper
        elevation={0}
        role="group"
        aria-label="Outils de la carte, défilement horizontal"
        tabIndex={0}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          const distance = Math.max(100, event.currentTarget.clientWidth * 0.75);
          if (event.key === 'ArrowRight' || event.key === 'PageDown') {
            event.preventDefault();
            event.currentTarget.scrollBy({ left: distance, behavior: 'auto' });
          } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault();
            event.currentTarget.scrollBy({ left: -distance, behavior: 'auto' });
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            event.currentTarget.scrollTo({
              left: event.key === 'Home' ? 0 : event.currentTarget.scrollWidth,
              behavior: 'auto',
            });
          }
        }}
        sx={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 400, maxWidth: 'calc(100% - 24px)', display: 'flex', alignItems: 'center',
          gap: .5, px: .75, py: .65, borderRadius: 3, border: '1px solid',
          borderColor: border, color: text, bgcolor: bg, backdropFilter: 'blur(14px)',
          boxShadow: darkMode ? '0 6px 24px rgba(0,0,0,.28)' : '0 6px 24px rgba(45,58,38,.10)',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          '@media (max-width: 600px)': {
            scrollbarWidth: 'thin',
            scrollbarColor: `${darkMode ? '#7f8bb2' : '#9da995'} transparent`,
            '&::-webkit-scrollbar': { display: 'block', height: 4 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: darkMode ? '#7f8bb2' : '#9da995',
              borderRadius: 4,
            },
          },
        }}
      >
        <TextField
          inputRef={searchInputRef}
          value={searchQ}
          onChange={event => setSearchQ(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && searchMatchCount > 0) {
              event.preventDefault();
              onNavigateSearchMatch(event.shiftKey ? -1 : 1);
            }
          }}
          placeholder="Rechercher"
          size="small"
          inputProps={{ 'aria-label': 'Rechercher dans cette carte' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
          sx={{
            width: { xs: 120, sm: 160 }, flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              height: 34, color: text, fontSize: 12.5, borderRadius: 2,
              bgcolor: darkMode ? '#202239' : '#f8f9f6',
              '& fieldset': { borderColor: border },
            },
            '& .MuiInputAdornment-root': { color: muted },
          }}
        />
        <Stack direction="row" spacing={0} alignItems="center" flexShrink={0}>
          <Typography
            variant="caption"
            aria-live="polite"
            sx={{ minWidth: 34, textAlign: 'center', color: muted, fontSize: 10.5 }}
          >
            {searchMatchCount > 0 && activeSearchIndex >= 0
              ? `${activeSearchIndex + 1}/${searchMatchCount}`
              : searchMatchCount}
          </Typography>
          <Tooltip title="Résultat précédent">
            <span>
              <IconButton
                size="small"
                aria-label="Résultat de recherche précédent"
                disabled={searchMatchCount === 0}
                onClick={() => onNavigateSearchMatch(-1)}
                sx={iconButtonSx(darkMode)}
              >
                <ArrowBackRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Résultat suivant">
            <span>
              <IconButton
                size="small"
                aria-label="Résultat de recherche suivant"
                disabled={searchMatchCount === 0}
                onClick={() => onNavigateSearchMatch(1)}
                sx={iconButtonSx(darkMode)}
              >
                <ArrowForwardRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Tooltip title="Filtres de recherche">
          <IconButton
            size="small"
            aria-label="Filtres de recherche"
            aria-haspopup="menu"
            aria-expanded={Boolean(searchFilterAnchor)}
            onClick={event => setSearchFilterAnchor(event.currentTarget)}
            sx={iconButtonSx(darkMode, Boolean(searchFilterAnchor))}
          >
            <FilterListRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={searchFilterAnchor}
          open={Boolean(searchFilterAnchor)}
          onClose={() => setSearchFilterAnchor(null)}
          slotProps={{
            paper: { sx: { minWidth: 200, borderRadius: 2, bgcolor: darkMode ? '#202239' : '#fff', color: text } },
          }}
        >
          {([
            ['titles', 'Titres'],
            ['notes', 'Notes'],
            ['tags', 'Étiquettes'],
            ['connections', 'Libellés des liens'],
            ['attachments', 'Pièces jointes'],
          ] as const).map(([field, label]) => (
            <MenuItem
              key={field}
              dense
              onClick={() => setSearchFilters({
                ...searchFilters,
                fields: { ...searchFilters.fields, [field]: !searchFilters.fields[field] },
              })}
            >
              <Checkbox size="small" checked={searchFilters.fields[field]} tabIndex={-1} disableRipple />
              <Typography variant="body2">{label}</Typography>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            dense
            onClick={() => setSearchFilters({ ...searchFilters, includeTasks: !searchFilters.includeTasks })}
          >
            <Checkbox size="small" checked={searchFilters.includeTasks} tabIndex={-1} disableRipple />
            <Typography variant="body2">Tâches</Typography>
          </MenuItem>
          <MenuItem
            dense
            onClick={() => setSearchFilters({ ...searchFilters, includeNonTasks: !searchFilters.includeNonTasks })}
          >
            <Checkbox size="small" checked={searchFilters.includeNonTasks} tabIndex={-1} disableRipple />
            <Typography variant="body2">Autres nœuds</Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            dense
            onClick={() => setSearchFilters({ ...searchFilters, includeExpanded: !searchFilters.includeExpanded })}
          >
            <Checkbox size="small" checked={searchFilters.includeExpanded} tabIndex={-1} disableRipple />
            <Typography variant="body2">Branches dépliées</Typography>
          </MenuItem>
          <MenuItem
            dense
            onClick={() => setSearchFilters({ ...searchFilters, includeCollapsed: !searchFilters.includeCollapsed })}
          >
            <Checkbox size="small" checked={searchFilters.includeCollapsed} tabIndex={-1} disableRipple />
            <Typography variant="body2">Branches repliées</Typography>
          </MenuItem>
          <Divider />
          {priorityOptions.map(([priority, label]) => (
            <MenuItem
              key={priority}
              dense
              onClick={() => setSearchFilters({
                ...searchFilters,
                priorities: {
                  ...searchFilters.priorities,
                  [priority]: !searchFilters.priorities[priority],
                },
              })}
            >
              <Checkbox size="small" checked={searchFilters.priorities[priority]} tabIndex={-1} disableRipple />
              <Typography variant="body2">{label}</Typography>
            </MenuItem>
          ))}
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ my: .4, mx: .25, borderColor: border }} />

        <Stack direction="row" spacing={.25} flexShrink={0}>
          <Tooltip title="Réorganiser la carte">
            <IconButton size="small" aria-label="Réorganiser la carte" onClick={() => applyLayout()}
              sx={{ ...iconButtonSx(darkMode), color: '#54865b' }}>
              <AutoFixHighRounded />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ my: .4, mx: .25, borderColor: border }} />

        {selCount > 1 && <Chip size="small" label={`${selCount} sélectionnés`} sx={{ height: 26, fontSize: 11, flexShrink: 0 }} />}

        <Tooltip title="Propriétés">
          <span>
            <IconButton
              size="small" aria-label="Propriétés" aria-pressed={inspectorOpen}
              disabled={!selectedId}
              onClick={() => { setInspectorOpen(!inspectorOpen); setInsertOpen(false); }}
              sx={iconButtonSx(darkMode, inspectorOpen)}
            ><SettingsOutlined /></IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Ajouter des éléments">
          <span>
            <IconButton
              size="small" aria-label="Ajouter des éléments" aria-pressed={insertOpen}
              disabled={!selectedId}
              onClick={() => { setInsertOpen(!insertOpen); setInspectorOpen(false); }}
              sx={iconButtonSx(darkMode, insertOpen)}
            ><AddCircleOutlineRounded /></IconButton>
          </span>
        </Tooltip>
        <Tooltip title={minimapOpen ? 'Masquer la vue d’ensemble' : 'Afficher la vue d’ensemble'}>
          <IconButton size="small" aria-label="Vue d’ensemble" aria-pressed={minimapOpen}
            onClick={() => setMinimapOpen(!minimapOpen)} sx={iconButtonSx(darkMode, minimapOpen)}>
            <MapOutlined />
          </IconButton>
        </Tooltip>
        {selectedId && (
          <Tooltip title="Présenter à partir de ce nœud">
            <IconButton size="small" aria-label="Lancer le diaporama" onClick={() => setSlideshow(selectedId)} sx={iconButtonSx(darkMode)}>
              <SlideshowRounded />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={linkMode ? 'Annuler la création de lien' : 'Relier deux nœuds'}>
          <IconButton
            size="small" aria-label={linkMode ? 'Annuler la création de lien' : 'Relier deux nœuds'}
            aria-pressed={linkMode}
            onClick={() => { setLinkMode(!linkMode); setLinkFrom(null); }}
            sx={iconButtonSx(darkMode, linkMode)}
          >
            <LinkRounded />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ my: .4, mx: .25, borderColor: border }} />
        <ExportDropdown svgRef={svgRef} doc={doc} darkMode={darkMode} nodes={nodes} />
        <Tooltip title="Réglages et thèmes">
          <IconButton size="small" aria-label="Réglages et thèmes" onClick={event => setMoreAnchor(event.currentTarget)} sx={iconButtonSx(darkMode)}>
            <MoreHorizRounded />
          </IconButton>
        </Tooltip>
      </Paper>

      <Menu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        slotProps={{
          paper: { sx: { width: 280, p: 1, borderRadius: 2.5, bgcolor: darkMode ? '#202239' : '#fff', color: text } },
        }}
      >
        <MenuItem
          disabled={!Object.values(nodes).some(node => node.parentId === null)}
          onClick={() => {
            const rootId = Object.values(nodes).find(node => node.parentId === null)?.id;
            if (rootId) setSlideshow(selectedId ?? rootId);
            setMoreAnchor(null);
          }}
        >
          <SlideshowRounded fontSize="small" sx={{ mr: 1.25, color: muted }} />
          {selectedId ? 'Présenter depuis la sélection' : 'Présenter toute la carte'}
        </MenuItem>
        <Divider sx={{ my: .5 }} />
        <MenuItem disabled sx={{ opacity: '1 !important', cursor: 'default', color: muted }}>
          <Typography variant="caption" sx={{ color: muted }}>ESPACEMENT</Typography>
        </MenuItem>
        {([
          ['Horizontal', 'spacingH'],
          ['Vertical', 'spacingV'],
        ] as const).map(([label, key]) => {
          const value = doc.pluginPrefs?.[key] ?? 1;
          return (
            <Box key={key} sx={{ px: 1.5, py: .75 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: .5 }}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="caption" color="text.secondary">{Math.round(value * 100)}%</Typography>
              </Stack>
              <Slider
                size="small" min={0.5} max={2.5} step={0.1} value={value}
                aria-label={`Espacement ${label.toLowerCase()}`}
                onChange={(_, nextValue) => {
                  if (typeof nextValue === 'number') {
                    onPluginPrefsChange(doc.id, { [key]: Math.round(nextValue * 10) / 10 });
                  }
                }}
                onChangeCommitted={(_, nextValue) => {
                  if (typeof nextValue === 'number') {
                    applyLayout({ [key]: Math.round(nextValue * 10) / 10 });
                  }
                }}
              />
            </Box>
          );
        })}
        <Divider sx={{ my: .5 }} />
        <MenuItem onClick={() => { setMoreAnchor(null); onOpenPluginPicker(); }}>
          <ExtensionRounded fontSize="small" sx={{ mr: 1.25, color: muted }} />
          Thèmes et plugins
        </MenuItem>
      </Menu>
      <TextFormattingPopover
        anchorEl={textFormattingAnchor}
        node={selectedNode}
        range={selectedTextRange}
        rangeFormat={selectedTextFormat}
        defaults={selectedTextDefaults}
        selectionCount={1}
        darkMode={darkMode}
        onApplyTextStyle={onApplyTextStyle}
        onApplyParagraph={onApplyParagraph}
        onResetFormatting={onResetTextFormatting}
        onClose={onCloseTextFormatting}
      />
    </>
  );
};
