import React, { useRef, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, IconButton, InputAdornment, List, ListItemButton, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AddRounded, ArticleOutlined, AccessTimeRounded, ChevronLeftRounded,
  ChevronRightRounded, CreateNewFolderOutlined, DeleteOutlineRounded,
  FolderOutlined, GroupsOutlined, LightbulbOutlined,
  SearchRounded, EditOutlined,
} from '@mui/icons-material';
import { MapDocument, DocCategory } from '../types';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  docs: MapDocument[];
  activeDocId: string;
  darkMode: boolean;
  onSelect: (id: string) => void;
  onNew: (category: DocCategory) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const SECTIONS: {
  key: DocCategory | 'recent';
  label: string;
  icon: React.ReactElement;
}[] = [
  { key: 'thoughts', label: 'Mes pensées', icon: <LightbulbOutlined /> },
  { key: 'files', label: 'Mes cartes', icon: <FolderOutlined /> },
  { key: 'recent', label: 'Récents', icon: <AccessTimeRounded /> },
  { key: 'shared', label: 'Partagés', icon: <GroupsOutlined /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  docs, activeDocId, darkMode, onSelect, onNew, onDelete, onRename, collapsed, onToggle,
}) => {
  const [activeSection, setActiveSection] = useState<string>('thoughts');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MapDocument | null>(null);
  const skipRenameBlur = useRef(false);

  const bg = darkMode ? '#151629' : '#f5f6f2';
  const text = darkMode ? '#e5e7f2' : '#30372b';
  const muted = darkMode ? '#9a9db4' : '#777f72';
  const selectedBg = darkMode ? 'rgba(125,151,98,.19)' : 'rgba(83,107,63,.10)';
  const sortedByDate = [...docs].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  const sectionDocs = (() => {
    let filtered: MapDocument[];
    if (activeSection === 'recent') filtered = sortedByDate.slice(0, 10);
    else if (activeSection === 'shared') filtered = docs.filter(doc => doc.shared);
    else filtered = docs.filter(doc => doc.category === activeSection);
    if (search.trim()) filtered = filtered.filter(doc => doc.title.toLowerCase().includes(search.trim().toLowerCase()));
    return filtered;
  })();

  const countFor = (key: string) => key === 'recent'
    ? Math.min(sortedByDate.length, 10)
    : key === 'shared'
      ? docs.filter(doc => doc.shared).length
      : docs.filter(doc => doc.category === key).length;

  const beginRename = (doc: MapDocument) => {
    skipRenameBlur.current = false;
    setRenamingId(doc.id);
    setRenameVal(doc.title);
  };

  const commitRename = (id: string, fromKeyboard = false) => {
    if (!fromKeyboard && skipRenameBlur.current) {
      skipRenameBlur.current = false;
      return;
    }
    if (fromKeyboard) skipRenameBlur.current = true;
    const title = renameVal.trim();
    if (title) onRename(id, title);
    setRenamingId(null);
  };

  return (
    <Box component="aside" sx={{
      width: collapsed ? 64 : 252, flexShrink: 0, display: 'flex', flexDirection: 'column',
      bgcolor: bg, color: text, borderRight: '1px solid',
      borderColor: darkMode ? '#2b2d42' : 'divider', transition: 'width .18s ease',
      overflow: 'hidden',
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between"
        sx={{ height: 56, px: collapsed ? .5 : 2, borderBottom: '1px solid', borderColor: darkMode ? '#2b2d42' : 'divider' }}>
        <BrandLogo variant={collapsed ? 'mark' : 'horizontal'} dark={darkMode} height={collapsed ? 28 : 30} />
        <Tooltip title={collapsed ? 'Développer le panneau' : 'Réduire le panneau'} placement="right">
          <IconButton size="small" onClick={onToggle} aria-label={collapsed ? 'Développer le panneau' : 'Réduire le panneau'} sx={{ color: muted, p: .25 }}>
            {collapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
          </IconButton>
        </Tooltip>
      </Stack>

      {!collapsed ? (
        <>
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
            <TextField
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Rechercher une carte"
              size="small"
              fullWidth
              inputProps={{ 'aria-label': 'Rechercher une carte' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: darkMode ? '#202239' : '#fff', borderRadius: 2,
                  color: text, fontSize: 13,
                  '& fieldset': { borderColor: darkMode ? '#30334b' : '#e5e8e1' },
                },
                '& .MuiInputAdornment-root': { color: muted },
              }}
            />
          </Box>
          <List dense disablePadding sx={{ px: 1, pb: 1 }}>
            {SECTIONS.map(section => (
              <ListItemButton
                key={section.key}
                selected={activeSection === section.key}
                onClick={() => setActiveSection(section.key)}
                sx={{
                  minHeight: 38, borderRadius: 2, mb: .25, px: 1.25, color: muted,
                  '&.Mui-selected': { bgcolor: selectedBg, color: darkMode ? '#b7d1a2' : 'primary.dark' },
                  '&.Mui-selected:hover': { bgcolor: selectedBg },
                  '&:hover': { bgcolor: darkMode ? '#202239' : 'rgba(50,60,40,.045)' },
                }}
              >
                <Box sx={{ minWidth: 32, display: 'flex', alignItems: 'center' }}>{section.icon}</Box>
                <Typography variant="body2" sx={{ flex: 1, fontWeight: activeSection === section.key ? 650 : 450 }}>
                  {section.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'inherit', opacity: .7 }}>{countFor(section.key)}</Typography>
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ borderTop: '1px solid', borderColor: darkMode ? '#2b2d42' : 'divider', flex: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 1 }}>
            <Typography variant="overline" sx={{ px: 1, color: muted, fontSize: 10, letterSpacing: '.1em' }}>
              {activeSection === 'recent' ? 'RÉCEMMENT OUVERTES' : 'VOS CARTES'}
            </Typography>
            {sectionDocs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1.25, py: 2, fontSize: 12.5 }}>
                {search ? 'Aucun résultat.' : 'Rien ici pour le moment.'}
              </Typography>
            ) : (
              <Stack spacing={.35} sx={{ mt: .75 }}>
                {sectionDocs.map(doc => {
                  const isActive = doc.id === activeDocId;
                  const isRenaming = doc.id === renamingId;
                  return (
                    <Box key={doc.id} sx={{
                      display: 'flex', alignItems: 'center', gap: .25, borderRadius: 2,
                      bgcolor: isActive ? selectedBg : 'transparent',
                      '&:hover .doc-action': { opacity: 1 },
                    }}>
                      <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => !isRenaming && onSelect(doc.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (!isRenaming) onSelect(doc.id);
                          }
                        }}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0,
                          cursor: 'pointer', borderRadius: 2, p: 1,
                          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                        }}
                      >
                        <ArticleOutlined fontSize="small" sx={{ color: isActive ? 'primary.main' : muted, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {isRenaming ? (
                            <TextField
                              autoFocus
                              size="small"
                              value={renameVal}
                              onChange={event => setRenameVal(event.target.value)}
                              onBlur={() => commitRename(doc.id)}
                              onKeyDown={event => {
                                event.stopPropagation();
                                if (event.key === 'Enter') commitRename(doc.id, true);
                                if (event.key === 'Escape') {
                                  skipRenameBlur.current = true;
                                  setRenamingId(null);
                                }
                              }}
                              onClick={event => event.stopPropagation()}
                              inputProps={{ 'aria-label': 'Nouveau nom de la carte' }}
                              sx={{ '& input': { p: .5, fontSize: 12 } }}
                            />
                          ) : (
                            <>
                              <Typography noWrap variant="body2" sx={{ fontWeight: isActive ? 650 : 450, color: text, fontSize: 12.5 }}>
                                {doc.title}
                              </Typography>
                              <Typography noWrap variant="caption" sx={{ color: muted, fontSize: 10.5 }}>
                                {Object.keys(doc.nodes).length} nœuds{doc.updatedAt ? ` · ${relativeTime(doc.updatedAt)}` : ''}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                      {!isRenaming && (
                        <Stack direction="row" sx={{ pr: .5 }}>
                          <Tooltip title="Renommer">
                            <IconButton className="doc-action" size="small" aria-label={`Renommer ${doc.title}`}
                            onClick={() => beginRename(doc)} sx={{ opacity: isActive ? 1 : 0, color: muted, '&:focus-visible': { opacity: 1 } }}>
                              <EditOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={docs.length > 1 ? 'Supprimer la carte' : 'Gardez au moins une carte'}>
                            <span>
                              <IconButton className="doc-action" size="small" aria-label={`Supprimer ${doc.title}`}
                                disabled={docs.length <= 1}
                                onClick={() => setDeleteTarget(doc)}
                                sx={{ opacity: isActive ? 1 : 0, color: muted, '&:focus-visible': { opacity: 1 } }}>
                                <DeleteOutlineRounded sx={{ fontSize: 17 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: darkMode ? '#2b2d42' : 'divider' }}>
            <Button fullWidth variant="contained" startIcon={<AddRounded />}
              onClick={() => onNew(activeSection === 'recent' || activeSection === 'shared' ? 'files' : activeSection as DocCategory)}>
              Nouvelle carte
            </Button>
          </Box>
        </>
      ) : (
        <Stack alignItems="center" spacing={1} sx={{ pt: 1.5 }}>
          {SECTIONS.map(section => (
            <Tooltip key={section.key} title={section.label} placement="right">
              <IconButton
                aria-label={section.label}
                onClick={() => { setActiveSection(section.key); onToggle(); }}
                sx={{ color: activeSection === section.key ? 'primary.main' : muted }}
              >
                {section.icon}
              </IconButton>
            </Tooltip>
          ))}
          <Tooltip title="Nouvelle carte" placement="right">
            <IconButton color="primary" aria-label="Nouvelle carte" onClick={() => onNew('files')}>
              <CreateNewFolderOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        aria-labelledby="delete-map-title"
      >
        <DialogTitle id="delete-map-title">Supprimer cette carte ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            « {deleteTarget?.title} » sera supprimée de cet appareil. Cette action est définitive.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTarget) onDelete(deleteTarget.id);
              setDeleteTarget(null);
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'à l’instant';
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
