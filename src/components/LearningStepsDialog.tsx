import React from 'react';
import {
  AddRounded, ArrowDownwardRounded, ArrowUpwardRounded,
} from '@mui/icons-material';
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip, useMediaQuery,
} from '@mui/material';
import { LearningStep } from '../canvas/learning-steps';

interface LearningStepsDialogProps {
  branches: LearningStep[];
  stepIds: string[];
  darkMode: boolean;
  onStepIdsChange: (stepIds: string[]) => void;
  onAddStep: () => void;
  onClose: () => void;
}

export function LearningStepsDialog({
  branches, stepIds, darkMode, onStepIdsChange, onAddStep, onClose,
}: LearningStepsDialogProps) {
  const compact = useMediaQuery('(max-width:600px)');
  const shortScreen = useMediaQuery('(max-height:520px)');
  const fullScreen = compact || shortScreen;
  const selectedIds = new Set(stepIds);
  const orderedSteps = stepIds
    .map(id => branches.find(branch => branch.id === id))
    .filter((step): step is LearningStep => Boolean(step));

  const toggleStep = (id: string) => {
    onStepIdsChange(selectedIds.has(id)
      ? stepIds.filter(stepId => stepId !== id)
      : [...stepIds, id]);
  };

  const moveStep = (id: string, offset: -1 | 1) => {
    const index = stepIds.indexOf(id);
    const nextIndex = index + offset;
    if (index < 0 || nextIndex < 0 || nextIndex >= stepIds.length) return;
    const nextIds = [...stepIds];
    [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
    onStepIdsChange(nextIds);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#1e2040' : '#fff',
          color: darkMode ? '#e8eaf6' : '#1a1a2e',
          backgroundImage: 'none',
          ...(fullScreen && {
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
          }),
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>Organiser les étapes</DialogTitle>
      <DialogContent sx={{ flex: 1, overscrollBehavior: 'contain' }}>
        <div style={{ color: darkMode ? '#a4a8c0' : '#657084', fontSize: 13, margin: '0 0 8px' }}>
          Sélectionnez les branches à suivre. Réordonnez les étapes avec les flèches ; les autres branches restent sur la carte.
        </div>
        {branches.length === 0 ? (
          <div style={{ padding: '18px 4px', color: darkMode ? '#a4a8c0' : '#657084', fontSize: 13 }}>
            Ajoutez une première étape pour commencer votre parcours.
          </div>
        ) : (
          <List dense disablePadding>
            {branches.map(branch => {
              const isStep = selectedIds.has(branch.id);
              const index = stepIds.indexOf(branch.id);
              return (
                <ListItem
                  key={branch.id}
                  disablePadding
                  secondaryAction={isStep ? (
                    <span>
                      <Tooltip title="Monter l’étape">
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Monter ${branch.title}`}
                            disabled={index === 0}
                            onClick={() => moveStep(branch.id, -1)}
                          >
                            <ArrowUpwardRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Descendre l’étape">
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Descendre ${branch.title}`}
                            disabled={index === stepIds.length - 1}
                            onClick={() => moveStep(branch.id, 1)}
                          >
                            <ArrowDownwardRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </span>
                  ) : undefined}
                >
                  <ListItemButton onClick={() => toggleStep(branch.id)} sx={{ minHeight: compact ? 56 : 44 }}>
                    <Checkbox checked={isStep} tabIndex={-1} disableRipple size="small" />
                    <ListItemText
                      primary={branch.title || 'Sans titre'}
                      secondary={isStep ? `Étape ${index + 1}` : undefined}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          flexDirection: compact ? 'column' : 'row',
          alignItems: compact ? 'stretch' : undefined,
          px: 3,
          pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
          pt: 1,
          borderTop: fullScreen ? `1px solid ${darkMode ? '#343654' : '#dfe4eb'}` : undefined,
          '& > button': compact ? { width: '100%', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' },
        }}
      >
        <Button startIcon={<AddRounded />} onClick={onAddStep}>
          Ajouter une étape
        </Button>
        <Button onClick={onClose}>Terminé</Button>
      </DialogActions>
    </Dialog>
  );
}
