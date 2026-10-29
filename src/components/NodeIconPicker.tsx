import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { RemoveCircleOutlineRounded } from '@mui/icons-material';
import type { NodeIcon } from '../types';
import { ICON_CATEGORIES, ICON_LABELS, NODE_ICON_COMPONENTS } from '../constants/icons';

interface NodeIconPickerProps {
  value?: NodeIcon;
  darkMode: boolean;
  onChange: (icon: NodeIcon) => void;
  compact?: boolean;
}

export function NodeIconPicker({ value, darkMode, onChange, compact = false }: NodeIconPickerProps) {
  const border = darkMode ? '#3b3e60' : '#e1e5ed';
  const surface = darkMode ? '#13142a' : '#f7f8fb';
  const selectedBorder = darkMode ? '#5bd5e6' : '#007c91';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1 : 1.5 }}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Choisir une icône
        </Typography>
        <Tooltip title="Aucune icône">
          <IconButton
            size="small"
            aria-label="Retirer l’icône"
            aria-pressed={!value || value === 'none'}
            onClick={() => onChange('none')}
            sx={{
              width: compact ? 30 : 36,
              height: compact ? 30 : 36,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: !value || value === 'none' ? selectedBorder : border,
              bgcolor: !value || value === 'none' ? (darkMode ? '#252847' : '#edf2e8') : surface,
              color: 'text.secondary',
              fontSize: compact ? 12 : 14,
            }}
          >
            <RemoveCircleOutlineRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
        <Box key={category}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{
            display: 'block',
            mb: 0.5,
            fontSize: compact ? 10 : 11,
            letterSpacing: '.035em',
          }}>
            {category}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 30 : 36}px, 1fr))`, gap: 0.5 }}>
            {icons.map(icon => {
              const Icon = NODE_ICON_COMPONENTS[icon];
              if (!Icon) return null;
              return (
                <Tooltip key={icon} title={ICON_LABELS[icon]}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Choisir l’icône ${ICON_LABELS[icon]}`}
                      aria-pressed={value === icon}
                      onClick={() => onChange(icon)}
                      sx={{
                        width: compact ? 30 : 36,
                        height: compact ? 30 : 36,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: value === icon ? selectedBorder : border,
                        bgcolor: value === icon ? (darkMode ? '#252847' : '#edf2e8') : surface,
                        color: darkMode ? '#d9deef' : '#46505d',
                        '&:hover': { bgcolor: darkMode ? '#252847' : '#edf2e8' },
                      }}
                    >
                      <Icon fontSize={compact ? 'small' : 'medium'} />
                    </IconButton>
                  </span>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
