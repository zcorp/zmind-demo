import React, { useRef, useState } from 'react';
import { Box, ButtonBase, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { AddRounded, CloseRounded } from '@mui/icons-material';

export interface Tab {
  id: string;
  title: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, title: string) => void;
  darkMode: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs, activeId, onSelect, onAdd, onClose, onRename, darkMode,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const skipBlur = useRef(false);
  const border = darkMode ? '#2b2d42' : '#e5e8e1';
  const text = darkMode ? '#e5e7f2' : '#30372b';
  const muted = darkMode ? '#9a9db4' : '#777f72';

  const startRename = (tab: Tab) => {
    skipBlur.current = false;
    setRenamingId(tab.id);
    setRenameVal(tab.title);
  };

  const commitRename = (id: string, fromKeyboard = false) => {
    if (!fromKeyboard && skipBlur.current) {
      skipBlur.current = false;
      return;
    }
    if (fromKeyboard) skipBlur.current = true;
    const title = renameVal.trim();
    if (title) onRename(id, title);
    setRenamingId(null);
  };

  const cancelRename = () => {
    skipBlur.current = true;
    setRenamingId(null);
  };

  return (
    <Box
      role="tablist"
      aria-label="Cartes ouvertes"
      sx={{
        display: 'flex', alignItems: 'center', gap: .75, px: 1.5, height: 46,
        flexShrink: 0, overflow: 'hidden', bgcolor: darkMode ? '#191a2d' : '#f8f9f6',
        borderBottom: '1px solid', borderColor: border,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, flex: 1, minWidth: 0, height: '100%', overflowX: 'auto' }}>
        {tabs.map(tab => {
          const active = tab.id === activeId;
          const renaming = renamingId === tab.id;
          return (
            <Stack key={tab.id} direction="row" alignItems="center" sx={{
              height: 34, flexShrink: 0, borderRadius: 2, px: .5,
              bgcolor: active ? (darkMode ? '#282a42' : '#fff') : 'transparent',
              border: '1px solid', borderColor: active ? border : 'transparent',
              boxShadow: active && !darkMode ? '0 1px 3px rgba(30,40,25,.05)' : 'none',
            }}>
              {renaming ? (
                <TextField
                  autoFocus size="small" value={renameVal}
                  onChange={event => setRenameVal(event.target.value)}
                  onBlur={() => commitRename(tab.id)}
                  onKeyDown={event => {
                    event.stopPropagation();
                    if (event.key === 'Enter') commitRename(tab.id, true);
                    if (event.key === 'Escape') cancelRename();
                  }}
                  inputProps={{ 'aria-label': 'Nouveau nom de la carte' }}
                  sx={{
                    width: 140,
                    '& .MuiInputBase-root': { height: 28, color: text, fontSize: 12.5 },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  }}
                />
              ) : (
                <ButtonBase
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelect(tab.id)}
                  onDoubleClick={() => startRename(tab)}
                  sx={{
                    maxWidth: 180, height: '100%', px: 1, borderRadius: 1,
                    justifyContent: 'flex-start', color: active ? text : muted,
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                  }}
                >
                  <Typography noWrap variant="body2" sx={{ fontWeight: active ? 650 : 450, fontSize: 12.5 }}>
                    {tab.title}
                  </Typography>
                </ButtonBase>
              )}
              {tabs.length > 1 && !renaming && (
                <Tooltip title={`Fermer ${tab.title}`}>
                  <IconButton
                    size="small"
                    aria-label={`Fermer ${tab.title}`}
                    onClick={() => onClose(tab.id)}
                    sx={{ width: 24, height: 24, color: muted, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <CloseRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        })}
      </Box>
      <Tooltip title="Nouvelle carte">
        <IconButton
          size="small" aria-label="Nouvelle carte" onClick={onAdd}
          sx={{
            ml: .25, flexShrink: 0, color: muted,
            border: '1px dashed', borderColor: border, borderRadius: 2,
            bgcolor: darkMode ? '#191a2d' : '#f8f9f6',
          }}
        >
          <AddRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
