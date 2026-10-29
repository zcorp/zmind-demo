import React, { useState } from 'react';
import {
  ArrowBackRounded, ArrowForwardRounded, AccountTreeOutlined, ArrowDropDownRounded,
  PlaylistAddRounded, SettingsRounded,
} from '@mui/icons-material';
import { Button, Divider, IconButton, Menu, MenuItem, Tooltip, useMediaQuery } from '@mui/material';
import { LearningStep } from '../canvas/learning-steps';

interface LearningStepsBarProps {
  steps: LearningStep[];
  activeStepId: string;
  focusMode: boolean;
  darkMode: boolean;
  mobile: boolean;
  onSelectStep: (id: string) => void;
  onToggleFocus: () => void;
  onManageSteps: () => void;
}

export function LearningStepsBar({
  steps, activeStepId, focusMode, darkMode, mobile, onSelectStep, onToggleFocus, onManageSteps,
}: LearningStepsBarProps) {
  const narrow = useMediaQuery('(max-width:360px)');
  const [stepMenuAnchor, setStepMenuAnchor] = useState<HTMLElement | null>(null);
  const activeIndex = steps.findIndex(step => step.id === activeStepId);
  const validActiveIndex = Math.max(0, activeIndex);
  const activeStep = steps[validActiveIndex];
  const background = darkMode ? 'rgba(22,20,42,0.96)' : 'rgba(255,255,255,0.97)';
  const border = darkMode ? '#343654' : '#dfe4eb';
  const text = darkMode ? '#e8eaf6' : '#253044';
  const muted = darkMode ? '#a4a8c0' : '#657084';
  const accent = darkMode ? '#b5cf9e' : '#007c91';

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: mobile ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : 14,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 315,
    border: `1px solid ${border}`,
    borderRadius: 14,
    background,
    boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,.4)' : '0 4px 16px rgba(25,38,64,.12)',
    backdropFilter: 'blur(10px)',
  };

  if (steps.length === 0) {
    return (
      <Button
        aria-label="Ajouter des étapes"
        onClick={onManageSteps}
        startIcon={<PlaylistAddRounded />}
        size="small"
        sx={{
          ...containerStyle,
          color: text,
          px: 1.5,
          py: 0.75,
          whiteSpace: 'nowrap',
          textTransform: 'none',
        }}
      >
        Ajouter des étapes
      </Button>
    );
  }

  const selectIndex = (index: number) => {
    if (steps[index]) onSelectStep(steps[index].id);
  };

  if (mobile) {
    return (
      <>
        <nav
          aria-label="Étapes d’apprentissage"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            width: 'calc(100% - 20px)',
            maxWidth: 420,
            padding: '4px 6px',
            boxSizing: 'border-box',
            ...containerStyle,
          }}
        >
          {!narrow && (
            <IconButton
              size="medium"
              aria-label="Étape précédente"
              disabled={validActiveIndex === 0}
              onClick={() => selectIndex(validActiveIndex - 1)}
              sx={{ color: text, '&.Mui-disabled': { color: muted, opacity: 0.4 } }}
            >
              <ArrowBackRounded />
            </IconButton>
          )}
          <Button
            aria-label={`Choisir une étape, étape ${validActiveIndex + 1} sur ${steps.length}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(stepMenuAnchor)}
            onClick={event => setStepMenuAnchor(event.currentTarget)}
            endIcon={<ArrowDropDownRounded />}
            sx={{
              color: accent,
              flex: '1 1 auto',
              minWidth: 0,
              maxWidth: narrow ? 'none' : 'calc(100% - 128px)',
              px: 1,
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {validActiveIndex + 1}/{steps.length} · {activeStep?.title}
            </span>
          </Button>
          {!narrow && (
            <IconButton
              size="medium"
              aria-label="Étape suivante"
              disabled={validActiveIndex === steps.length - 1}
              onClick={() => selectIndex(validActiveIndex + 1)}
              sx={{ color: text, '&.Mui-disabled': { color: muted, opacity: 0.4 } }}
            >
              <ArrowForwardRounded />
            </IconButton>
          )}
          <Tooltip title="Organiser les étapes">
            <IconButton
              size="medium"
              aria-label="Organiser les étapes"
              onClick={onManageSteps}
              sx={{ color: muted, flexShrink: 0 }}
            >
              <SettingsRounded />
            </IconButton>
          </Tooltip>
        </nav>
        <Menu
          anchorEl={stepMenuAnchor}
          open={Boolean(stepMenuAnchor)}
          onClose={() => setStepMenuAnchor(null)}
          PaperProps={{ sx: { maxWidth: 'calc(100vw - 32px)', maxHeight: '60vh' } }}
        >
          {steps.map((step, index) => (
            <MenuItem
              key={step.id}
              selected={step.id === activeStepId}
              onClick={() => {
                onSelectStep(step.id);
                setStepMenuAnchor(null);
              }}
              sx={{ minHeight: 48, maxWidth: 'calc(100vw - 48px)' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {index + 1}. {step.title}
              </span>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            onClick={() => {
              onToggleFocus();
              setStepMenuAnchor(null);
            }}
            sx={{ minHeight: 48 }}
          >
            <AccountTreeOutlined fontSize="small" style={{ marginRight: 12, color: focusMode ? accent : muted }} />
            {focusMode ? 'Afficher toute la carte' : 'Cibler l’étape'}
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <nav
      aria-label="Étapes d’apprentissage"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        maxWidth: 'min(850px, calc(100% - 24px))',
        padding: '6px 8px',
        ...containerStyle,
      }}
    >
      <Tooltip title="Étape précédente">
        <span style={{ display: mobile ? 'none' : undefined }}>
          <IconButton
            size="small"
            aria-label="Étape précédente"
            disabled={validActiveIndex === 0}
            onClick={() => selectIndex(validActiveIndex - 1)}
            sx={{ color: text, '&.Mui-disabled': { color: muted, opacity: 0.45 } }}
          >
            <ArrowBackRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <div
        role="group"
        aria-label="Choisir une étape"
        style={{ display: 'flex', alignItems: 'center', gap: 3, overflowX: 'auto', scrollbarWidth: 'thin' }}
      >
        {steps.map((step, index) => {
          const active = step.id === activeStepId;
          return (
            <button
              key={step.id}
              type="button"
              aria-pressed={active}
              aria-label={`Étape ${index + 1} sur ${steps.length} : ${step.title}`}
              onClick={() => onSelectStep(step.id)}
              style={{
                flex: '0 0 auto',
                border: `1px solid ${active ? accent : 'transparent'}`,
                borderRadius: 9,
                background: active ? (darkMode ? '#30334d' : '#edf5f2') : 'transparent',
                color: active ? accent : muted,
                padding: '6px 9px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 11.5,
                fontWeight: active ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ opacity: 0.72, marginRight: 4 }}>{index + 1}.</span>
              {step.title}
            </button>
          );
        })}
      </div>

      <Tooltip title="Étape suivante">
        <span style={{ display: mobile ? 'none' : undefined }}>
          <IconButton
            size="small"
            aria-label="Étape suivante"
            disabled={validActiveIndex === steps.length - 1}
            onClick={() => selectIndex(validActiveIndex + 1)}
            sx={{ color: text, '&.Mui-disabled': { color: muted, opacity: 0.45 } }}
          >
            <ArrowForwardRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <div aria-hidden="true" style={{ width: 1, height: 22, background: border, flexShrink: 0 }} />

      <Tooltip title={focusMode ? 'Afficher toute la carte' : 'Cibler l’étape'}>
        <IconButton
          size="small"
          aria-label={focusMode ? 'Afficher toute la carte' : 'Cibler l’étape'}
          aria-pressed={focusMode}
          onClick={onToggleFocus}
          sx={{ color: focusMode ? accent : muted, flexShrink: 0 }}
        >
          <AccountTreeOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Organiser les étapes">
        <IconButton size="small" aria-label="Organiser les étapes" onClick={onManageSteps} sx={{ color: muted, flexShrink: 0 }}>
          <SettingsRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      {!mobile && (
        <span style={{ color: muted, fontSize: 10.5, whiteSpace: 'nowrap' }}>
          {validActiveIndex + 1}/{steps.length}
        </span>
      )}
    </nav>
  );
}
