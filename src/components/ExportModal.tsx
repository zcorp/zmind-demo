import React, { useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import {
  CheckCircleRounded, CodeRounded, DownloadRounded, ImageOutlined,
  PictureAsPdfOutlined, PrintOutlined, SvgIconComponent, TextSnippetOutlined,
} from '@mui/icons-material';

type ExportFormat = 'png' | 'png-hd' | 'png-transparent' | 'svg' | 'pdf' | 'pdf-hd' | 'bmp' | 'jpeg' | 'webp' | 'print' | 'minder' | 'markdown' | 'plaintext' | 'opml' | 'freemind' | 'mermaid' | 'xmind' | 'org' | 'csv' | 'plantuml' | 'outliner' | 'graphml';
type ExportCategory = 'visual' | 'native' | 'exchange';

interface ExportModalProps {
  darkMode: boolean;
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
}

const FORMATS: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: SvgIconComponent;
  category: ExportCategory;
}[] = [
  { id: 'png', label: 'PNG', description: 'Image standard', icon: ImageOutlined, category: 'visual' },
  { id: 'png-hd', label: 'PNG HD', description: 'Haute résolution (3×)', icon: ImageOutlined, category: 'visual' },
  { id: 'png-transparent', label: 'PNG transparent', description: 'Sans arrière-plan', icon: ImageOutlined, category: 'visual' },
  { id: 'svg', label: 'SVG', description: 'Vectoriel, net à toute taille', icon: CodeRounded, category: 'visual' },
  { id: 'pdf', label: 'PDF', description: 'Prêt à imprimer', icon: PictureAsPdfOutlined, category: 'visual' },
  { id: 'pdf-hd', label: 'PDF HD', description: 'Haute qualité', icon: PictureAsPdfOutlined, category: 'visual' },
  { id: 'bmp', label: 'BMP', description: 'Image bitmap non compressée', icon: ImageOutlined, category: 'visual' },
  { id: 'jpeg', label: 'JPEG', description: 'Image compressée, fond opaque', icon: ImageOutlined, category: 'visual' },
  { id: 'webp', label: 'WebP', description: 'Image compacte, fond opaque', icon: ImageOutlined, category: 'visual' },
  { id: 'print', label: 'Imprimer', description: 'Ouvrir les options d’impression', icon: PrintOutlined, category: 'visual' },
  { id: 'minder', label: 'Fichier .minder', description: 'Format éditable Minder', icon: TextSnippetOutlined, category: 'native' },
  { id: 'markdown', label: 'Markdown', description: 'Texte structuré', icon: TextSnippetOutlined, category: 'exchange' },
  { id: 'plaintext', label: 'Texte brut', description: 'Plan hiérarchique .txt', icon: TextSnippetOutlined, category: 'exchange' },
  { id: 'opml', label: 'OPML', description: 'Partager la hiérarchie et les notes', icon: CodeRounded, category: 'exchange' },
  { id: 'freemind', label: 'FreeMind / Freeplane', description: 'Format XML .mm éditable', icon: CodeRounded, category: 'exchange' },
  { id: 'mermaid', label: 'Mermaid', description: 'Mindmap Mermaid (.mmd)', icon: CodeRounded, category: 'exchange' },
  { id: 'xmind', label: 'XMind', description: 'Format éditable .xmind', icon: CodeRounded, category: 'exchange' },
  { id: 'org', label: 'Org-mode', description: 'Plan structuré .org', icon: TextSnippetOutlined, category: 'exchange' },
  { id: 'csv', label: 'CSV', description: 'Tableau hiérarchique avec notes', icon: TextSnippetOutlined, category: 'exchange' },
  { id: 'plantuml', label: 'PlantUML', description: 'Mindmap PlantUML (.puml)', icon: CodeRounded, category: 'exchange' },
  { id: 'outliner', label: 'Outliner', description: 'XML structuré .outliner', icon: CodeRounded, category: 'exchange' },
  { id: 'graphml', label: 'GraphML / yEd', description: 'Graphe éditable .graphml', icon: CodeRounded, category: 'exchange' },
];

export const ExportModal: React.FC<ExportModalProps> = ({ onExport, onClose }) => {
  const [selected, setSelected] = useState<ExportFormat>('png');
  const [category, setCategory] = useState<ExportCategory>('visual');
  const formats = FORMATS.filter(format => format.category === category);
  const selectedFormat = FORMATS.find(format => format.id === selected);

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby="export-dialog-title"
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3, maxHeight: 'calc(100dvh - 32px)' } }}
    >
      <DialogTitle id="export-dialog-title" sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{
            width: 38, height: 38, display: 'grid', placeItems: 'center',
            borderRadius: 2, color: 'primary.main', bgcolor: 'primary.light',
          }}>
            <DownloadRounded />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Exporter la carte</Typography>
            <Typography variant="body2" color="text.secondary">Choisissez le format de votre fichier.</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important', overflowY: 'auto' }}>
        <Tabs
          value={category}
          onChange={(_, nextCategory: ExportCategory) => {
            setCategory(nextCategory);
            const firstFormat = FORMATS.find(format => format.category === nextCategory);
            if (firstFormat) setSelected(firstFormat.id);
          }}
          variant="fullWidth"
          aria-label="Catégories de formats d’export"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="visual" label="Visuels" />
          <Tab value="native" label="Fichier Minder" />
          <Tab value="exchange" label="Texte et échange" />
        </Tabs>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          {formats.map(({ id, label, description, icon: Icon }) => {
            const active = selected === id;
            return (
              <Paper
                key={id}
                component="button"
                type="button"
                variant="outlined"
                aria-pressed={active}
                onClick={() => setSelected(id)}
                sx={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: 1.25,
                  p: 1.5, textAlign: 'left', cursor: 'pointer', borderRadius: 2.5,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? 'primary.main' : 'divider',
                  bgcolor: active ? 'primary.light' : 'background.paper',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.light' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                }}
              >
                <Box sx={{
                  width: 36, height: 36, flexShrink: 0, display: 'grid', placeItems: 'center',
                  borderRadius: 1.75, bgcolor: 'background.paper', color: active ? 'primary.main' : 'text.secondary',
                }}>
                  <Icon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={650}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{description}</Typography>
                </Box>
                {active && <CheckCircleRounded color="primary" sx={{ ml: 'auto', fontSize: 19, flexShrink: 0 }} />}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          Format choisi : {selectedFormat?.label}
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadRounded />}
          onClick={() => { onExport(selected); onClose(); }}
        >
          Exporter
        </Button>
      </DialogActions>
    </Dialog>
  );
};
