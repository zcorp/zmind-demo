import React, { useRef, useState } from 'react';
import {
  Alert, Box, Button, IconButton, Paper, Slider, Stack, Tab as MuiTab, Tabs, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import {
  AttachFileRounded, CloseRounded, DeleteOutlineRounded, EmojiEmotionsOutlined,
  FlagOutlined, FormatListNumberedRounded, GridViewRounded, ImageOutlined,
  InsertDriveFileOutlined, OpenInNewRounded, LightbulbOutlined,
} from '@mui/icons-material';
import { AttachmentPosition, MindNode, NodeAttachment, NodePriority } from '../types';
import { PRIORITY_CONFIG } from '../constants/icons';
import { normalizeExternalUrl, resolveImageSource } from '../canvas/attachment-preview';
import { MAX_NODE_ATTACHMENT_SIZE } from '../types';
import { NodeIconPicker } from './NodeIconPicker';

interface InsertPanelProps {
  node: MindNode | null;
  darkMode: boolean;
  onUpdate: (id: string, changes: Partial<MindNode>) => void;
  onClose: () => void;
}

type InsertTab = 'insert' | 'icon' | 'priority' | 'number' | 'template';

const TEMPLATES = {
  enterprise: [
    { label: 'SWOT',          nodes: ['Forces', 'Faiblesses', 'Opportunités', 'Menaces'] },
    { label: 'OKR',           nodes: ['Objectif', 'KR 1', 'KR 2', 'KR 3'] },
    { label: 'Réunion',       nodes: ['Ordre du jour', 'Décisions', 'Actions', 'Responsables'] },
    { label: 'Roadmap',       nodes: ['Q1', 'Q2', 'Q3', 'Q4'] },
    { label: 'Stratégie',     nodes: ['Vision', 'Mission', 'Valeurs', 'Priorités'] },
  ],
  education: [
    { label: 'Cours',         nodes: ['Introduction', 'Concepts clés', 'Exemples', 'Résumé'] },
    { label: 'Révision',      nodes: ['À retenir', 'Questions', 'Formules', 'Dates'] },
    { label: 'Dissertation',  nodes: ['Thèse', 'Argument 1', 'Argument 2', 'Conclusion'] },
    { label: 'Projet',        nodes: ['Problématique', 'Hypothèse', 'Méthode', 'Résultats'] },
    { label: 'Vocabulaire',   nodes: ['Terme', 'Définition', 'Exemple', 'Synonymes'] },
  ],
};
const PREVIEW_POSITIONS: { id: AttachmentPosition; label: string }[] = [
  { id: 'top', label: 'Haut' },
  { id: 'bottom', label: 'Bas' },
  { id: 'left', label: 'Gauche' },
  { id: 'right', label: 'Droite' },
];

export const InsertPanel: React.FC<InsertPanelProps> = ({
  node, darkMode, onUpdate, onClose,
}) => {
  const [tab, setTab]         = useState<InsertTab>('insert');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [equation, setEquation]   = useState('');
  const [videoUrl, setVideoUrl]   = useState('');
  const [imageUrl, setImageUrl]     = useState('');
  const [imageError, setImageError] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'enterprise' | 'education'>('enterprise');
  const normalizedLinkUrl = normalizeExternalUrl(linkUrl);
  const normalizedVideoUrl = normalizeExternalUrl(videoUrl);
  const hasImagePreview = Boolean(node?.attachments?.some(attachment => attachment.type === 'image'));
  const fileRef = useRef<HTMLInputElement>(null);

  const bg     = darkMode ? '#1e2040' : '#ffffff';
  const border = darkMode ? '#2e3060' : '#e8edf5';
  const text   = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted  = darkMode ? '#6070a0' : '#8090b8';
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: darkMode ? '#13142a' : '#f8f9fc',
      color: text,
      fontSize: 13,
      '& fieldset': { borderColor: border },
    },
    '& .MuiInputLabel-root': { color: muted },
  };

  if (!node) return null;

  const addAttachment = (att: Omit<NodeAttachment, 'id'>) => {
    const newAtt: NodeAttachment = { ...att, id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
    onUpdate(node.id, { attachments: [...(node.attachments ?? []), newAtt] });
  };

  const removeAttachment = (attId: string) => {
    onUpdate(node.id, { attachments: (node.attachments ?? []).filter(a => a.id !== attId) });
  };

  const tabs: { value: InsertTab; label: string; icon: React.ReactElement }[] = [
    { value: 'insert', label: 'Insérer', icon: <AttachFileRounded /> },
    { value: 'icon', label: 'Icône', icon: <EmojiEmotionsOutlined /> },
    { value: 'priority', label: 'Priorité', icon: <FlagOutlined /> },
    { value: 'number', label: 'Numéro', icon: <FormatListNumberedRounded /> },
    { value: 'template', label: 'Modèle', icon: <GridViewRounded /> },
  ];

  return (
    <Box component="aside" sx={{
      position: 'absolute', right: 0, bottom: 0, top: { xs: 60, sm: 0 }, width: { xs: 'min(320px, calc(100vw - 80px))', sm: 320 },
      bgcolor: bg, borderLeft: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column', zIndex: 400, color: text,
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.75, py: 1, borderBottom: `1px solid ${border}` }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Ajouter au nœud</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 240 }}>
            {node.text}
          </Typography>
        </Box>
        <Tooltip title="Fermer">
          <IconButton size="small" aria-label="Fermer le panneau" onClick={onClose} sx={{ color: muted }}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, value: InsertTab) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Options d’ajout au nœud"
        sx={{
          minHeight: 44, borderBottom: `1px solid ${border}`,
          '& .MuiTab-root': { minWidth: 60, minHeight: 44, px: 1, fontSize: 10.5, textTransform: 'none' },
          '& .MuiTab-iconWrapper': { mb: .25 },
        }}
      >
        {tabs.map(item => (
          <MuiTab key={item.value} value={item.value} label={item.label} icon={item.icon} />
        ))}
      </Tabs>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {/* ── INSERT TAB ── */}
        {tab === 'insert' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section label="Image" darkMode={darkMode}>
              <input ref={fileRef} type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  setImageError('');
                  if (!f.type.startsWith('image/') || f.type === 'image/svg+xml') {
                    setImageError('Choisissez une image PNG, JPEG, GIF, WebP, AVIF ou BMP.');
                    return;
                  }
                  if (f.size > 12 * 1024 * 1024) {
                    setImageError('Cette image dépasse la limite de 12 Mo.');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const dataUrl = ev.target?.result;
                    if (typeof dataUrl !== 'string') {
                      setImageError('Impossible de lire ce fichier image.');
                      return;
                    }
                    addAttachment({ type: 'image', name: f.name, value: dataUrl, thumbnail: dataUrl });
                  };
                  reader.onerror = () => setImageError('La lecture du fichier image a échoué.');
                  reader.readAsDataURL(f);
                }}
              />
              <Button fullWidth variant="outlined" size="small" startIcon={<ImageOutlined />}
                onClick={() => fileRef.current?.click()}>
                Choisir une image
              </Button>
                <Stack direction="row" spacing={.75} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="URL de l’image"
                    placeholder="https://exemple.fr/image.jpg"
                    value={imageUrl}
                    onChange={event => {
                      setImageUrl(event.target.value);
                      setImageError('');
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const url = normalizeExternalUrl(imageUrl);
                        if (!url) {
                          setImageError('Saisissez une URL d’image HTTP ou HTTPS valide.');
                          return;
                        }
                        addAttachment({ type: 'image', name: getImageName(url), value: url });
                        setImageUrl('');
                      }
                    }}
                    sx={fieldSx}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!imageUrl.trim()}
                    aria-label="Ajouter l’image depuis son URL"
                    onClick={() => {
                      const url = normalizeExternalUrl(imageUrl);
                      if (!url) {
                        setImageError('Saisissez une URL d’image HTTP ou HTTPS valide.');
                        return;
                      }
                      addAttachment({ type: 'image', name: getImageName(url), value: url });
                      setImageUrl('');
                      setImageError('');
                    }}
                    sx={{ minWidth: 48, textTransform: 'none' }}
                  >
                    Ajouter
                  </Button>
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: .5, color: muted }}>
                  Images locales stockées dans la carte ; les URL nécessitent une connexion Internet.
                </Typography>
                {imageError && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{imageError}</Alert>}
            </Section>

            {hasImagePreview && (
              <Section label="Aperçu de l’image" darkMode={darkMode}>
                <Typography variant="caption" sx={{ display: 'block', mb: .75, color: muted }}>
                  Position
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={node.attachmentPosition ?? 'right'}
                  aria-label="Position de l’aperçu de l’image"
                  onChange={(_, value: AttachmentPosition | null) => {
                    if (value !== null) onUpdate(node.id, { attachmentPosition: value });
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiToggleButton-root': {
                      flex: 1,
                      minWidth: 0,
                      px: .25,
                      fontSize: 10,
                      textTransform: 'none',
                      color: muted,
                      borderColor: border,
                      '&.Mui-selected': { color: text, bgcolor: darkMode ? '#343858' : '#e8efe2' },
                    },
                  }}
                >
                  {PREVIEW_POSITIONS.map(position => (
                    <ToggleButton key={position.id} value={position.id} aria-label={`Aperçu ${position.label.toLowerCase()}`}>
                      {position.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: muted, minWidth: 42 }}>Taille</Typography>
                  <Slider
                    min={24}
                    max={MAX_NODE_ATTACHMENT_SIZE}
                    step={8}
                    value={Math.max(24, Math.min(MAX_NODE_ATTACHMENT_SIZE, node.attachmentSize ?? 28))}
                    aria-label="Taille de l’aperçu de l’image"
                    onChangeCommitted={(_, value) => {
                      if (typeof value === 'number') onUpdate(node.id, { attachmentSize: value });
                    }}
                    sx={{ flex: 1, color: '#007c91' }}
                  />
                  <Typography variant="caption" sx={{ color: text, minWidth: 34, textAlign: 'right' }}>
                    {Math.max(24, Math.min(MAX_NODE_ATTACHMENT_SIZE, node.attachmentSize ?? 28))}px
                  </Typography>
                </Stack>
              </Section>
            )}

            <Section label="Lien hypertexte" darkMode={darkMode}>
              <Stack spacing={1}>
                <TextField size="small" fullWidth value={linkLabel}
                  onChange={e => setLinkLabel(e.target.value)}
                  placeholder="Texte du lien" aria-label="Texte du lien" sx={fieldSx} />
                <TextField size="small" fullWidth value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://…" aria-label="Adresse du lien" sx={fieldSx}
                  error={Boolean(linkUrl.trim()) && !normalizedLinkUrl}
                  helperText={linkUrl.trim() && !normalizedLinkUrl ? 'Saisissez une adresse HTTP ou HTTPS valide.' : undefined} />
              </Stack>
              <Button fullWidth size="small" variant="outlined" startIcon={<OpenInNewRounded />}
                disabled={!normalizedLinkUrl}
                onClick={() => {
                  if (!normalizedLinkUrl) return;
                  addAttachment({ type: 'link', name: linkLabel || normalizedLinkUrl, value: normalizedLinkUrl });
                  setLinkUrl(''); setLinkLabel('');
                }}
                sx={{ mt: 1 }}
              >
                Ajouter le lien
              </Button>
            </Section>

            <Section label="Note" darkMode={darkMode}>
              <TextField
                defaultValue={node.notes ?? ''}
                onBlur={e => onUpdate(node.id, { notes: e.target.value })}
                onKeyDown={e => e.stopPropagation()}
                multiline minRows={4} fullWidth size="small"
                placeholder="Votre note en Markdown…"
                aria-label="Note du nœud"
                sx={{ ...fieldSx, '& textarea': { resize: 'vertical' } }}
              />
            </Section>

            <Section label="Équation" darkMode={darkMode}>
              <TextField size="small" fullWidth value={equation} onChange={e => setEquation(e.target.value)}
                placeholder="E = mc²" aria-label="Équation" sx={fieldSx} />
              <Button fullWidth size="small" variant="outlined" startIcon={<InsertDriveFileOutlined />}
                disabled={!equation.trim()}
                onClick={() => {
                  if (!equation.trim()) return;
                  addAttachment({ type: 'equation', name: equation, value: equation });
                  setEquation('');
                }}
                sx={{ mt: 1 }}
              >
                Ajouter l’équation
              </Button>
            </Section>

            <Section label="Vidéo" darkMode={darkMode}>
              <TextField size="small" fullWidth value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="URL YouTube / Vimeo" aria-label="Adresse de la vidéo" sx={fieldSx}
                error={Boolean(videoUrl.trim()) && !normalizedVideoUrl}
                helperText={videoUrl.trim() && !normalizedVideoUrl ? 'Saisissez une adresse HTTP ou HTTPS valide.' : undefined} />
              <Button fullWidth size="small" variant="outlined" startIcon={<OpenInNewRounded />}
                disabled={!normalizedVideoUrl}
                onClick={() => {
                  if (!normalizedVideoUrl) return;
                  addAttachment({ type: 'video', name: videoUrl, value: normalizedVideoUrl });
                  setVideoUrl('');
                }}
                sx={{ mt: 1 }}
              >
                Ajouter la vidéo
              </Button>
            </Section>

            <Section label="Idée rapide" darkMode={darkMode}>
              <Button fullWidth variant="outlined" size="small" startIcon={<LightbulbOutlined />}
                onClick={() => onUpdate(node.id, { icon: 'idea' })}>
                Marquer comme idée
              </Button>
            </Section>

            {/* Attachments list */}
            {(node.attachments?.length ?? 0) > 0 && (
              <Section label="Pièces jointes" darkMode={darkMode}>
                {node.attachments?.map(att => (
                  <Paper key={att.id} variant="outlined" sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    p: .75, mb: .5, bgcolor: darkMode ? '#13142a' : '#f4f6fb',
                    borderColor: border,
                  }}>
                    <span style={{ fontSize: 16 }}>
                      {att.type === 'image' ? '🖼' : att.type === 'link' ? '🔗' : att.type === 'video' ? '🎥' : att.type === 'equation' ? '∑' : '📎'}
                    </span>
                    {att.type === 'image' && resolveImageSource(att.thumbnail ?? att.value) && (
                      <img src={resolveImageSource(att.thumbnail ?? att.value) ?? ''} alt={att.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                    )}
                    <Typography variant="caption" sx={{ flex: 1, minWidth: 0, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.name}
                    </Typography>
                    {(att.type === 'link' || att.type === 'video') && normalizeExternalUrl(att.value) && (
                      <IconButton component="a" href={normalizeExternalUrl(att.value)!} target="_blank" rel="noopener noreferrer"
                        size="small" aria-label={`Ouvrir ${att.name}`}>
                        <OpenInNewRounded fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton onClick={() => removeAttachment(att.id)} size="small"
                      aria-label={`Supprimer ${att.name}`} color="error">
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Section>
            )}
          </div>
        )}

        {/* ── ICON TAB ── */}
        {tab === 'icon' && (
          <div>
            <NodeIconPicker
              value={node.icon}
              darkMode={darkMode}
              onChange={icon => onUpdate(node.id, { icon })}
            />
          </div>
        )}

        {/* ── PRIORITY TAB ── */}
        {tab === 'priority' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.entries(PRIORITY_CONFIG) as [NodePriority, typeof PRIORITY_CONFIG[NodePriority]][]).map(([p, cfg]) => (
              <Button key={p} onClick={() => onUpdate(node.id, { priority: p })}
                variant={node.priority === p ? 'contained' : 'outlined'}
                color={p === 'high' || p === 'critical' ? 'error' : 'primary'}
                aria-pressed={node.priority === p}
                sx={{ justifyContent: 'flex-start', gap: 1.25, py: 1, borderColor: border,
                  bgcolor: node.priority === p ? undefined : (darkMode ? '#13142a' : '#f8f9fc'),
                  color: node.priority === p ? undefined : text }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.color === 'transparent' ? border : cfg.color, flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: node.priority === p ? 600 : 400 }}>{cfg.label}</span>
                {node.priority === p && <span aria-hidden="true" style={{ color: cfg.color, fontSize: 12 }}>✓</span>}
              </Button>
            ))}
          </div>
        )}

        {/* ── NUMBERING TAB ── */}
        {tab === 'number' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12.5, color: muted, margin: 0 }}>Numérotation manuelle du nœud</p>
            <TextField size="small" fullWidth
              defaultValue={node.number ?? ''}
              onBlur={e => onUpdate(node.id, { number: e.target.value.trim() || undefined })}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); e.stopPropagation(); }}
              placeholder="ex: 1.2.3 ou A1"
              aria-label="Numérotation du nœud"
              sx={fieldSx}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['1', '1.1', '1.1.1', 'A', 'A.1', 'I', 'II', 'a', 'b'].map(preset => (
                <Button key={preset} size="small" variant={node.number === preset ? 'contained' : 'outlined'}
                  onClick={() => onUpdate(node.id, { number: preset })}>
                  {preset}
                </Button>
              ))}
            </div>
            <Button onClick={() => onUpdate(node.id, { number: undefined })} variant="outlined" size="small">
              Retirer le numéro
            </Button>
          </div>
        )}

        {/* ── TEMPLATE TAB ── */}
        {tab === 'template' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['enterprise', 'education'] as const).map(cat => (
                <Button key={cat} fullWidth size="small"
                  variant={templateCategory === cat ? 'contained' : 'outlined'}
                  onClick={() => setTemplateCategory(cat)}>
                  {cat === 'enterprise' ? 'Entreprise' : 'Éducation'}
                </Button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TEMPLATES[templateCategory].map(tmpl => (
                <Button key={tmpl.label}
                  fullWidth variant="outlined"
                  onClick={() => {
                    // Emit a custom event that MindMapFinal will catch
                    window.dispatchEvent(new CustomEvent('minder:apply-template', {
                      detail: { nodeId: node.id, template: tmpl },
                    }));
                  }}
                  sx={{ p: 1.25, justifyContent: 'flex-start', textAlign: 'left',
                    bgcolor: darkMode ? '#13142a' : '#f8f9fc', borderColor: border }}>
                  <Box>
                  <Typography variant="body2" fontWeight={600} color={text}>{tmpl.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .25 }}>
                    {tmpl.nodes.join(' · ')}
                  </Typography>
                  </Box>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Box>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, darkMode, children }: { label: string; darkMode: boolean; children: React.ReactNode }) {
  const border = darkMode ? '#2e3060' : '#e8edf5';
  const muted  = darkMode ? '#6070a0' : '#8090b8';
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: border, p: 1.5 }}>
      <Typography variant="overline" sx={{ display: 'block', fontWeight: 700, color: muted, mb: 1, lineHeight: 1.3 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function getImageName(url: string): string {
  const parsed = new URL(url);
  const pathName = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
  return pathName && /\.[a-z\d]{2,5}$/i.test(pathName) ? pathName : parsed.hostname;
}
