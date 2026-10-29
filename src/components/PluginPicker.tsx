// ─────────────────────────────────────────────────────────────────────────────
// src/components/PluginPicker.tsx
//
// Floating panel to browse and activate plugins by category.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper, Tab as MuiTab, Tabs, Tooltip, Typography,
} from '@mui/material';
import {
  ArrowBackRounded, BrushOutlined, CloseRounded, DashboardCustomizeOutlined,
  ImageOutlined, PaletteOutlined, WidgetsOutlined,
} from '@mui/icons-material';
import {
  getThemes, getBackgrounds, getLayouts, getTemplates, getStyles,
} from '../plugins/usePlugins';
import { PluginNode, TemplatePlugin, TemplateOptions } from '../plugins/types';
import {
  BackgroundPreview, LayoutPreview, StylePreview, TemplatePreview, ThemePreview,
} from './PluginPreviews';

type PickerTab = 'theme' | 'background' | 'layout' | 'style' | 'template';

interface PluginPickerProps {
  darkMode:           boolean;
  activeThemeId:      string;
  activeBackgroundId: string;
  activeLayoutId:     string;
  activeStyleId:      string;
  onSetTheme:         (id: string) => void;
  onSetBackground:    (id: string) => void;
  onSetLayout:        (id: string) => void;
  onSetStyle:         (id: string) => void;
  onApplyTemplate:    (plugin: TemplatePlugin, opts: TemplateOptions) => void;
  onClose:            () => void;
}

export const PluginPicker: React.FC<PluginPickerProps> = ({
  darkMode,
  activeThemeId, activeBackgroundId, activeLayoutId, activeStyleId,
  onSetTheme, onSetBackground, onSetLayout, onSetStyle,
  onApplyTemplate, onClose,
}) => {
  const [tab, setTab] = useState<PickerTab>('theme');
  const activeTheme = getThemes().find(theme => theme.meta.id === activeThemeId) ?? getThemes()[0];
  const activeThemeColors = activeTheme.getColors();

  const bg     = darkMode ? '#1a1c3a' : '#ffffff';
  const border = darkMode ? '#2e3060' : '#e0e6f4';
  const text   = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted  = darkMode ? '#a4a8c0' : '#687184';
  const accent = '#007c91';
  const accentLight = darkMode ? '#b5cf9e' : accent;

  const TABS: { id: PickerTab; label: string; icon: React.ReactElement }[] = [
    { id: 'theme',      label: 'Thème',       icon: <PaletteOutlined /> },
    { id: 'background', label: 'Fond',        icon: <ImageOutlined /> },
    { id: 'layout',     label: 'Disposition', icon: <DashboardCustomizeOutlined /> },
    { id: 'style',      label: 'Style',       icon: <BrushOutlined /> },
    { id: 'template',   label: 'Modèles',     icon: <WidgetsOutlined /> },
  ];

  return (
    <Paper component="section" elevation={0} aria-label="Thèmes et modèles" sx={{
      position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
      zIndex: 600,
      bgcolor: bg, border: `1px solid ${border}`, borderRadius: 3,
      boxShadow: darkMode ? '0 12px 48px rgba(0,0,0,0.7)' : '0 12px 40px rgba(79,142,247,0.15)',
      width: { xs: 'calc(100vw - 24px)', sm: tab === 'template' ? 840 : 560 },
      maxWidth: 'calc(100vw - 24px)', maxHeight: 'min(780px, calc(100vh - 80px))',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color={text}>Personnaliser la carte</Typography>
          <Typography variant="caption" color={muted}>Voyez le rendu, puis choisissez.</Typography>
        </Box>
        <Tooltip title="Fermer">
          <IconButton size="small" aria-label="Fermer les thèmes et modèles" onClick={onClose} sx={{ color: muted }}>
            <CloseRounded />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, value: PickerTab) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Catégories de personnalisation"
        sx={{
          px: 1, minHeight: 48, borderBottom: `1px solid ${border}`, flexShrink: 0,
          '& .MuiTab-root': { minHeight: 48, minWidth: 74, textTransform: 'none', fontSize: 11.5, color: muted },
          '& .Mui-selected': { color: `${accentLight} !important`, fontWeight: 700 },
          '& .MuiTabs-indicator': { bgcolor: accentLight },
        }}
      >
        {TABS.map(item => (
          <MuiTab key={item.id} value={item.id} label={item.label} icon={item.icon} iconPosition="start" />
        ))}
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.75 }}>

        {/* THEME */}
        {tab === 'theme' && (
          <PluginGrid>
            {getThemes().map(p => (
              <PluginCard
                key={p.meta.id}
                id={p.meta.id}
                name={getPluginLabel(p.meta.id, p.meta.name)}
                description={getPluginDescription(p.meta.id, p.meta.description)}
                active={p.meta.id === activeThemeId}
                darkMode={darkMode}
                badge={p.isDark ? 'Sombre' : 'Clair'}
                badgeColor={p.isDark ? '#9b59b6' : '#f5a623'}
                preview={<ThemePreview theme={p} />}
                onClick={() => onSetTheme(p.meta.id)}
              />
            ))}
          </PluginGrid>
        )}

        {/* BACKGROUND */}
        {tab === 'background' && (
          <PluginGrid>
            {getBackgrounds().map(p => (
              <PluginCard
                key={p.meta.id}
                id={p.meta.id}
                name={getPluginLabel(p.meta.id, p.meta.name)}
                description={getPluginDescription(p.meta.id, p.meta.description)}
                active={p.meta.id === activeBackgroundId}
                darkMode={darkMode}
                preview={(
                  <BackgroundPreview
                    background={p}
                    darkMode={activeTheme.isDark}
                    canvasBackground={activeThemeColors.canvasBackground}
                    nodeFill={activeThemeColors.nodeFill}
                    nodeBorder={activeThemeColors.nodeBorder}
                  />
                )}
                onClick={() => onSetBackground(p.meta.id)}
              />
            ))}
          </PluginGrid>
        )}

        {/* LAYOUT */}
        {tab === 'layout' && (
          <PluginGrid>
            {getLayouts().map(p => (
              <PluginCard
                key={p.meta.id}
                id={p.meta.id}
                name={getPluginLabel(p.meta.id, p.meta.name)}
                description={getPluginDescription(p.meta.id, p.meta.description)}
                active={p.meta.id === activeLayoutId}
                darkMode={darkMode}
                preview={<LayoutPreview layout={p} />}
                onClick={() => onSetLayout(p.meta.id)}
              />
            ))}
          </PluginGrid>
        )}

        {/* STYLE */}
        {tab === 'style' && (
          <PluginGrid>
            {getStyles().map(p => (
              <PluginCard
                key={p.meta.id}
                id={p.meta.id}
                name={getPluginLabel(p.meta.id, p.meta.name)}
                description={getPluginDescription(p.meta.id, p.meta.description)}
                active={p.meta.id === activeStyleId}
                darkMode={darkMode}
                preview={<StylePreview style={p} darkMode={darkMode} />}
                onClick={() => onSetStyle(p.meta.id)}
              />
            ))}
          </PluginGrid>
        )}

        {/* TEMPLATES */}
        {tab === 'template' && (
          <TemplatePicker
            darkMode={darkMode}
            accent={accent}
            accentLight={accentLight}
            border={border}
            text={text}
            muted={muted}
            onApplyTemplate={onApplyTemplate}
          />
        )}

      </Box>
    </Paper>
  );
};

// ─── Template Picker ─────────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = {
  education: { label: 'Apprendre' },
  enterprise: { label: 'Projets' },
  personal: { label: 'Vie perso' },
  creative: { label: 'Créer' },
  other: { label: 'Autres' },
  project: { label: 'Projet ZMIND' },
} as const;

type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES;

function TemplatePicker({ darkMode, accent, accentLight, border, text, muted, onApplyTemplate }: {
  darkMode: boolean; accent: string; accentLight: string; border: string; text: string; muted: string;
  onApplyTemplate: (plugin: TemplatePlugin, opts: TemplateOptions) => void;
}) {
  const [activeCategory, setActiveCategory] = React.useState<TemplatePlugin['category'] | null>(null);
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const allTemplates = getTemplates();
  const availableCategories = Object.keys(TEMPLATE_CATEGORIES)
    .filter(category => allTemplates.some(template => template.category === category)) as TemplatePlugin['category'][];

  const filtered = allTemplates.filter(t => {
    const matchCategory = !activeCategory || t.category === activeCategory;
    const searchableText = normalizeSearch(`${t.meta.name} ${t.meta.description} ${t.preview.join(' ')}`);
    return matchCategory && searchableText.includes(normalizeSearch(search));
  });
  const selectedTemplate = filtered.find(template => template.meta.id === selectedId);
  const selectedNodes = React.useMemo(
    () => selectedTemplate?.build({ originX: 500, originY: 300, parentId: null }),
    [selectedTemplate]
  );
  const selectedRoot = selectedNodes && Object.values(selectedNodes).find(node => node.parentId === null);
  const selectedBranches = selectedRoot?.children
    .map(id => selectedNodes?.[id])
    .filter((branch): branch is PluginNode => Boolean(branch)) ?? [];
  const totalNodes = selectedNodes ? Object.keys(selectedNodes).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: darkMode ? 'linear-gradient(125deg,#252747,#30264a)' : 'linear-gradient(125deg,#f1f5e9,#f2edff)',
        border: `1px solid ${border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 16, fontWeight: 750, color: text }}>
          <TemplateSparkle color={accent} />
          Une bonne idée pour commencer
        </div>
        <div style={{ marginTop: 4, color: muted, fontSize: 12.5, lineHeight: 1.5 }}>
          Choisissez un modèle, explorez sa structure, puis créez une nouvelle carte sans toucher à celle qui est ouverte.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: muted }}
          >
            <circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.5 15.5 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Rechercher un modèle"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedId(null);
            }}
            placeholder="Ex. histoire, révision, projet…"
            style={{
              padding: '10px 12px 10px 36px', borderRadius: 9, width: '100%',
              border: `1px solid ${border}`, boxSizing: 'border-box',
              background: darkMode ? '#13142a' : '#f8f9fc',
              color: text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <CategoryChip
            label={`Tous · ${allTemplates.length}`}
            active={!activeCategory}
            accent={accent}
            darkMode={darkMode}
            muted={muted}
            onClick={() => {
              setActiveCategory(null);
              setSelectedId(null);
            }}
          />
          {availableCategories.map(category => {
            const config = TEMPLATE_CATEGORIES[category];
            const count = allTemplates.filter(template => template.category === category).length;
            return (
              <CategoryChip
                key={category}
                label={`${config.label} · ${count}`}
                category={category}
                active={activeCategory === category}
                accent={accent}
                darkMode={darkMode}
                muted={muted}
                onClick={() => {
                  setActiveCategory(activeCategory === category ? null : category);
                  setSelectedId(null);
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography variant="subtitle2" fontWeight={700} color={text}>À vous de choisir</Typography>
          <Typography variant="caption" color={muted}>{filtered.length} modèle{filtered.length === 1 ? '' : 's'}</Typography>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '20px 0', textAlign: 'center', color: muted, fontSize: 13 }}>
            Aucun modèle trouvé
          </div>
        )}
        {filtered.map(p => (
          <ButtonBase
            key={p.meta.id}
            component="div"
            role="button"
            tabIndex={0}
            aria-label={`Voir le modèle ${p.meta.name}`}
            aria-pressed={selectedId === p.meta.id}
            title="Cliquer pour découvrir ce modèle"
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedId(p.meta.id);
              }
            }}
            onClick={() => setSelectedId(p.meta.id)}
            sx={{
              display: 'block', width: '100%', p: 1.25, borderRadius: 2.5,
              border: '1px solid',
              borderColor: selectedId === p.meta.id ? accentLight : border,
              bgcolor: selectedId === p.meta.id
                ? (darkMode ? '#1e2242' : '#f0f5e9')
                : (darkMode ? '#17192f' : '#fff'),
              backgroundImage: darkMode
                ? 'linear-gradient(145deg, rgba(89,96,150,.12), transparent 60%)'
                : 'linear-gradient(145deg, #fff 20%, #f7f9f3)',
              textAlign: 'left',
              boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,.12)' : '0 5px 16px rgba(65,78,48,.07)',
              transition: 'transform .16s ease, box-shadow .16s ease, border-color .16s ease',
              '&:hover': {
                borderColor: accentLight,
                bgcolor: darkMode ? '#191c35' : '#f5f7f1',
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? '0 9px 22px rgba(0,0,0,.22)' : '0 10px 24px rgba(65,78,48,.14)',
              },
              '&:focus-visible': { outline: '2px solid', outlineColor: accentLight, outlineOffset: 2 },
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: text }}>
                  {p.meta.name}
                </div>
                <div style={{ color: muted, fontSize: 10.5, marginTop: 2 }}>
                  <TemplateCategoryIcon category={p.category} color={muted} />
                  {' '}{TEMPLATE_CATEGORIES[p.category].label}
                  {' · '}{p.preview.length} rubriques
                </div>
              </div>
              <span aria-hidden="true" style={{
                width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center',
                background: darkMode ? '#282a48' : '#edf2e8',
              }}>
                <TemplateCategoryIcon category={p.category} color={accent} size={20} />
              </span>
            </div>
            <TemplatePreview template={p} darkMode={darkMode} />
            <div style={{ minHeight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 11.5, color: muted, lineHeight: 1.45 }}>{p.meta.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, color: muted }}>{p.preview.length} idées pour démarrer</span>
                <span style={{ fontSize: 11, color: accentLight, fontWeight: 700 }}>Découvrir le modèle&nbsp; →</span>
              </div>
            </div>
          </ButtonBase>
        ))}
        </div>
      </div>

      <Dialog
        open={Boolean(selectedTemplate)}
        onClose={() => setSelectedId(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: darkMode ? '#1a1c3a' : '#fff', color: text, borderRadius: 3 } }}
      >
        {selectedTemplate && (
          <>
            <DialogTitle sx={{ pb: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box>
                  <Typography variant="overline" color={muted}>
                    <TemplateCategoryIcon category={selectedTemplate.category} color={muted} />
                    {' '}{TEMPLATE_CATEGORIES[selectedTemplate.category].label}
                  </Typography>
                  <Typography variant="h6" component="div" fontWeight={750}>{selectedTemplate.meta.name}</Typography>
                  <Typography variant="body2" color={muted}>{selectedTemplate.meta.description}</Typography>
                </Box>
                <IconButton aria-label="Fermer l’aperçu du modèle" onClick={() => setSelectedId(null)} size="small">
                  <span aria-hidden="true" style={{ fontSize: 21, lineHeight: 1 }}>×</span>
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: border }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(240px, 1fr) minmax(240px, 1fr)' }, gap: 2 }}>
                <Box>
                  <TemplatePreview template={selectedTemplate} darkMode={darkMode} size="detail" />
                  <Typography variant="caption" color={muted}>{totalNodes} nœuds prêts à personnaliser</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Ce que contient le modèle</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {selectedBranches.map(branch => {
                      const examples = branch.children
                        .map(id => {
                          const child = selectedNodes?.[id];
                          if (!child) return null;
                          const details = child.children
                            .map(childId => selectedNodes?.[childId]?.text)
                            .filter((label): label is string => Boolean(label))
                            .slice(0, 2);
                          return details.length ? `${child.text} → ${details.join(', ')}` : child.text;
                        })
                        .filter((label): label is string => Boolean(label))
                        .slice(0, 3);
                      return (
                        <Box key={branch.id} sx={{
                          p: 1, borderRadius: 1.5,
                          bgcolor: darkMode ? '#232541' : '#f5f3f8',
                        }}>
                          <Typography variant="body2" fontWeight={650}>{branch.text}</Typography>
                          {examples.length > 0 && (
                            <Typography variant="caption" color={muted}>{examples.join(' · ')}</Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color={muted}>
                Une nouvelle carte sera créée ; celle que vous utilisez restera intacte.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button
                  variant="text"
                  startIcon={<ArrowBackRounded />}
                  onClick={() => setSelectedId(null)}
                  sx={{ flexShrink: 0, textTransform: 'none', color: muted }}
                >
                  Retour aux modèles
                </Button>
                <Button
                  variant="contained"
                  onClick={() => onApplyTemplate(selectedTemplate, { originX: 500, originY: 300, parentId: null })}
                  sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 700, bgcolor: accent, '&:hover': { bgcolor: accentLight } }}
                >
                  Créer ma carte
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}

function CategoryChip({
  label,
  category,
  active,
  accent,
  darkMode,
  muted,
  onClick,
}: {
  label: string;
  category?: TemplateCategory;
  active: boolean;
  accent: string;
  darkMode: boolean;
  muted: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: '6px 10px', borderRadius: 14,
        border: active ? `1px solid ${accent}` : '1px solid transparent',
        background: active ? accent : (darkMode ? '#1e2040' : '#f0f2f7'),
        color: active ? '#fff' : muted,
        cursor: 'pointer', fontSize: 11.5, fontWeight: active ? 700 : 500,
        fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      {category && <TemplateCategoryIcon category={category} color="currentColor" />}
      {category && ' '}
      {label}
    </button>
  );
}

function TemplateCategoryIcon({ category, color, size = 14 }: {
  category: TemplateCategory;
  color: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: '-2px', color, flexShrink: 0 }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {category === 'education' && (
        <>
          <path d="M12 6.2C9.6 4.7 6.5 4.5 3.8 5.6v12.1c2.8-1 5.6-.7 8.2.9 2.6-1.6 5.4-1.9 8.2-.9V5.6c-2.7-1.1-5.8-.9-8.2.6Z" />
          <path d="M12 6.3v12.2M6.5 8.4c1.4-.2 2.6 0 3.7.6m7.3-.6c-1.4-.2-2.6 0-3.7.6" />
        </>
      )}
      {category === 'enterprise' && (
        <>
          <path d="M12 6.5v4m0 0H6.5v4m5.5-4h5.5v4" />
          <rect x="9.5" y="3" width="5" height="4" rx="1.2" />
          <rect x="4" y="14" width="5" height="5" rx="1.2" />
          <rect x="15" y="14" width="5" height="5" rx="1.2" />
        </>
      )}
      {category === 'personal' && (
        <>
          <circle cx="12" cy="7.5" r="3" />
          <path d="M5.5 20c.4-3.7 2.8-5.8 6.5-5.8s6.1 2.1 6.5 5.8" />
        </>
      )}
      {category === 'creative' && (
        <>
          <path d="m4 17.8-.8 3 3-.8L19.6 6.6a2.1 2.1 0 0 0-3-3L4 17.8Z" />
          <path d="m14.9 5.3 3 3M4 17.8l3 3" />
        </>
      )}
      {category === 'other' && (
        <>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M8 6h8M6 8v8m12-8v8M8 18h8" />
        </>
      )}
      {category === 'project' && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <path d="M10 6.5h4M6.5 10v4m11-4v4M10 17.5h4" />
        </>
      )}
    </svg>
  );
}

function TemplateSparkle({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" width="18" height="18" fill="none">
      <path d="M10 1.8 12 8l6.2 2-6.2 2-2 6.2L8 12l-6.2-2L8 8l2-6.2Z" fill={color} opacity=".82" />
      <circle cx="16.5" cy="3.5" r="1" fill={color} />
    </svg>
  );
}

function normalizeSearch(value: string): string {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PluginGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
      {children}
    </Box>
  );
}

function getPluginLabel(id: string, fallback: string): string {
  const labels: Record<string, string> = {
    natural: 'Nature',
    'ocean-light': 'Océan',
    'forest-dark': 'Forêt',
    'sunset-warm': 'Coucher de soleil',
    'midnight-ink': 'Nuit profonde',
    paper: 'Papier doux',
    'dot-grid': 'Points',
    wave: 'Vagues',
    crosshatch: 'Quadrillage',
    'mindmap-balanced': 'Carte équilibrée',
    'tree-vertical': 'Arbre vertical',
    'tree-left': 'Arbre vers la gauche',
    'tree-right': 'Arbre vers la droite',
    'tree-radial': 'Radial',
    'timeline-horizontal': 'Chronologie',
    fishbone: 'Causes et effets',
    'rounded-card': 'Cartes arrondies',
    'playful-cards': 'Cartes pastel',
    'sticky-notes': 'Notes adhésives',
    brutalist: 'Géométrique',
    'minimal-line': 'Ligne légère',
  };
  return labels[id] ?? fallback;
}

function getPluginDescription(id: string, fallback: string): string {
  const descriptions: Record<string, string> = {
    playful: 'Fond crème et branches aux couleurs vives.',
    natural: 'Fond chaud, olive et tons terre.',
    'ocean-light': 'Bleu, sable et touches turquoise.',
    'forest-dark': 'Verts profonds et accents lumineux.',
    'sunset-warm': 'Orange, ambre et corail.',
    'midnight-ink': 'Fond sombre et palette néon.',
    paper: 'Grain léger sur papier chaud.',
    'dot-grid': 'Repères discrets pour se situer.',
    wave: 'Lignes souples et apaisantes.',
    crosshatch: 'Grille régulière pour structurer.',
    'mindmap-balanced': 'Sujet au centre, branches équilibrées selon leur contenu.',
    'tree-vertical': 'Le sujet en haut, avec les branches qui descendent par niveaux.',
    'tree-left': 'Le sujet à droite, avec les branches qui se développent vers la gauche.',
    'tree-right': 'Le sujet à gauche, avec les branches qui se développent vers la droite.',
    'tree-radial': 'Les branches rayonnent autour du sujet central.',
    'timeline-horizontal': 'Étapes alignées dans le temps.',
    fishbone: 'Causes reliées à un même effet.',
    'rounded-card': 'Cartes douces, texte bien détaché.',
    'playful-cards': 'Racine vive, branches colorées.',
    'sticky-notes': 'Notes colorées façon pense-bête.',
    brutalist: 'Formes nettes et contrastes marqués.',
    'minimal-line': 'Moins de cadres, plus d’espace.',
  };
  return descriptions[id] ?? fallback;
}

function PluginCard({
  id, name, description, active, darkMode, badge, badgeColor, preview, onClick,
}: {
  id: string; name: string; description: string; active: boolean;
  darkMode: boolean; badge?: string; badgeColor?: string;
  preview?: React.ReactNode; onClick: () => void;
}) {
  const border = darkMode ? '#2e3060' : '#e0e6f4';
  const text   = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted  = darkMode ? '#a4a8c0' : '#687184';
  const accent = '#007c91';
  const accentLight = darkMode ? '#b5cf9e' : accent;

  return (
    <Paper
      role="button"
      tabIndex={0}
      variant="outlined"
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        p: 1.25, borderRadius: 2.5, textAlign: 'left', color: text,
        borderWidth: active ? 2 : 1, borderColor: active ? accentLight : border,
        bgcolor: active ? (darkMode ? '#1e2242' : '#edf2e8') : (darkMode ? '#13142a' : '#f8f9fc'),
        cursor: 'pointer', transition: 'all .13s', position: 'relative',
        '&:hover': { borderColor: accentLight, bgcolor: active ? undefined : darkMode ? '#191c35' : '#f5f7f1' },
        '&:focus-visible': { outline: '2px solid', outlineColor: accentLight, outlineOffset: 2 },
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 18, height: 18, borderRadius: '50%',
          background: accent, color: '#fff',
          fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700,
        }}>✓</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: text }}>{name}</span>
        {badge && (
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 10,
            background: (badgeColor ?? accent) + '25',
            color: badgeColor ?? accent, fontWeight: 600,
          }}>{badge}</span>
        )}
      </div>
      {preview}
      <div style={{ fontSize: 11.5, color: muted, lineHeight: 1.35, minHeight: 30 }}>{description}</div>
    </Paper>
  );
}
