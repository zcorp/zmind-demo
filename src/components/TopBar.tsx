import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Divider, IconButton, InputBase, Stack, Tooltip, Typography,
} from '@mui/material';
import {
  CheckCircleOutlineRounded, DarkModeRounded, DownloadRounded, EditOutlined,
  ExtensionRounded, LightModeRounded, RedoRounded, UndoRounded,
} from '@mui/icons-material';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  title: string;
  darkMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  savedAt?: number;
  onUndo: () => void;
  onRedo: () => void;
  onToggleDark: () => void;
  onOpenPlugins: () => void;
  onOpenExport: () => void;
  onRenameDoc: (title: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title, darkMode, canUndo, canRedo, savedAt,
  onUndo, onRedo, onToggleDark, onOpenPlugins, onOpenExport, onRenameDoc,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(title);
  const [saveLabel, setSaveLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const skipTitleBlur = useRef(false);

  useEffect(() => setTitleVal(title), [title]);

  useEffect(() => {
    if (!savedAt) return;
    const diff = Date.now() - savedAt;
    if (diff < 3000) {
      setSaveLabel('Enregistré');
      const timer = setTimeout(() => setSaveLabel('Enregistré automatiquement'), 2500);
      return () => clearTimeout(timer);
    }
    setSaveLabel('Enregistré automatiquement');
  }, [savedAt]);

  const bg = darkMode ? '#151629' : '#fff';
  const border = darkMode ? '#2b2d42' : '#e5e8e1';
  const text = darkMode ? '#e5e7f2' : '#30372b';
  const muted = darkMode ? '#a0a3b8' : '#777f72';

  const saveTitle = (fromKeyboard = false) => {
    if (!fromKeyboard && skipTitleBlur.current) {
      skipTitleBlur.current = false;
      return;
    }
    if (fromKeyboard) skipTitleBlur.current = true;
    const nextTitle = titleVal.trim();
    if (nextTitle && nextTitle !== title) onRenameDoc(nextTitle);
    else setTitleVal(title);
    setEditingTitle(false);
  };

  const startTitleEdit = () => {
    skipTitleBlur.current = false;
    setEditingTitle(true);
  };

  return (
    <Box sx={{
      minHeight: 54, flexShrink: 0, display: 'flex', alignItems: 'center',
      px: { xs: 1, sm: 2 }, gap: { xs: .5, sm: 1 },
      color: text, bgcolor: bg, borderBottom: '1px solid', borderColor: border, zIndex: 600,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: .25 }}>
        {editingTitle ? (
          <InputBase
            inputRef={inputRef}
            autoFocus
            value={titleVal}
            onChange={event => setTitleVal(event.target.value)}
            onBlur={() => saveTitle()}
            onKeyDown={event => {
              event.stopPropagation();
              if (event.key === 'Enter') saveTitle(true);
              if (event.key === 'Escape') {
                skipTitleBlur.current = true;
                setTitleVal(title);
                setEditingTitle(false);
              }
            }}
            inputProps={{ 'aria-label': 'Nom de la carte' }}
            sx={{
              px: 1, py: .35, minWidth: 100, maxWidth: 240,
              border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5,
              color: text, fontWeight: 650, fontSize: 14,
            }}
          />
        ) : (
          <>
            <Button
              onDoubleClick={startTitleEdit}
              color="inherit"
              sx={{
                minWidth: 0, px: 1, justifyContent: 'flex-start', color: text,
                '&:hover': { bgcolor: darkMode ? '#202239' : '#f5f6f2' },
              }}
            >
              <Typography noWrap fontWeight={650} fontSize={14} maxWidth={{ xs: 120, sm: 220 }}>
                {title}
              </Typography>
            </Button>
            <Tooltip title="Renommer la carte">
              <IconButton size="small" aria-label="Renommer la carte" onClick={startTitleEdit}
                sx={{ color: muted, width: 28, height: 28 }}>
                <EditOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
        {saveLabel && (
          <Stack direction="row" spacing={.5} alignItems="center" sx={{ ml: .5, display: { xs: 'none', sm: 'flex' }, color: muted }}>
            <CheckCircleOutlineRounded sx={{ fontSize: 15, color: '#54865b' }} />
            <Typography variant="caption" noWrap>{saveLabel}</Typography>
          </Stack>
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      <Tooltip title="Annuler (Ctrl+Z)">
        <span>
          <IconButton aria-label="Annuler" disabled={!canUndo} onClick={onUndo} sx={{ color: text }}>
            <UndoRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Rétablir (Ctrl+Y)">
        <span>
          <IconButton aria-label="Rétablir" disabled={!canRedo} onClick={onRedo} sx={{ color: text }}>
            <RedoRounded />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ my: 1.4, borderColor: border }} />

      <Tooltip title={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}>
        <IconButton aria-label={darkMode ? 'Mode clair' : 'Mode sombre'} onClick={onToggleDark} sx={{ color: text }}>
          {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Thèmes et plugins">
        <IconButton aria-label="Thèmes et plugins" onClick={onOpenPlugins} sx={{ color: text }}>
          <ExtensionRounded />
        </IconButton>
      </Tooltip>
      <UserMenu darkMode={darkMode} />
      <Button
        variant="contained"
        size="small"
        onClick={onOpenExport}
        startIcon={<DownloadRounded />}
        sx={{ ml: { xs: 0, sm: .5 }, px: { xs: 1, sm: 1.5 }, minWidth: { xs: 40, sm: 'auto' } }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exporter</Box>
      </Button>
    </Box>
  );
};
