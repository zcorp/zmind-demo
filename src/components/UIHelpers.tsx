import React, { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { MapDocument, NodesMap } from '../types';
import { exportSVG, exportPNG, exportPDF, exportMinderJSON, exportMarkdownFile, exportRasterImage, exportPrint } from '../formats/Export';
import { MinderJSON } from '../formats/MinderJSON';
import { downloadOPML, parseOPML } from '../formats/OPML';
import { parseMarkdown } from '../formats/Markdown';
import { downloadFreeMind, parseFreeMind } from '../formats/FreeMind';
import { downloadMermaid, parseMermaid } from '../formats/Mermaid';
import { downloadXMind, parseXMind } from '../formats/XMind';
import { downloadOrgMode, parseOrgMode } from '../formats/OrgMode';
import { downloadCSV, parseCSV } from '../formats/CSV';
import { downloadPlantUML, parsePlantUML } from '../formats/PlantUML';
import { downloadOutliner, parseOutliner } from '../formats/Outliner';
import { downloadYEd, parseYEd } from '../formats/YEd';
import { downloadPlainText, parsePlainText } from '../formats/PlainText';

// ─────────────────────────────────────────────────────────────────────────────
// UIHelpers.tsx — shared UI primitives used by MapCanvas and MindMapFinal.
// ─────────────────────────────────────────────────────────────────────────────

function ExportDropdown({ svgRef, doc, darkMode, nodes }: {
  svgRef: React.RefObject<SVGSVGElement>;
  doc: MapDocument; darkMode: boolean; nodes: NodesMap;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const border = darkMode ? '#30325a' : '#dde3f0';
  const bg     = darkMode ? 'rgba(26,26,46,0.97)' : 'rgba(255,255,255,0.97)';
  const text   = darkMode ? '#dde0f8' : '#1a1a2e';
  const muted  = darkMode ? '#6070a0' : '#8090b8';

  const items = [
    { id: 'imp',  label: '📥 Import .minder' },
    { id: 'exp',  label: '📤 Export .minder' },
    { id: 'imp-opml', label: '📥 Import OPML' },
    { id: 'exp-opml', label: '📤 Export OPML' },
    { id: 'imp-md', label: '📥 Import Markdown' },
    { id: 'imp-text', label: '📥 Import texte brut (.txt)' },
    { id: 'exp-text', label: '📤 Export texte brut (.txt)' },
    { id: 'imp-mm', label: '📥 Import FreeMind / Freeplane (.mm)' },
    { id: 'exp-mm', label: '📤 Export FreeMind / Freeplane (.mm)' },
    { id: 'imp-mmd', label: '📥 Import Mermaid' },
    { id: 'exp-mmd', label: '📤 Export Mermaid' },
    { id: 'imp-xmind', label: '📥 Import XMind (.xmind)' },
    { id: 'exp-xmind', label: '📤 Export XMind (.xmind)' },
    { id: 'imp-org', label: '📥 Import Org-mode (.org)' },
    { id: 'exp-org', label: '📤 Export Org-mode (.org)' },
    { id: 'imp-csv', label: '📥 Import CSV' },
    { id: 'exp-csv', label: '📤 Export CSV' },
    { id: 'imp-puml', label: '📥 Import PlantUML mindmap' },
    { id: 'exp-puml', label: '📤 Export PlantUML mindmap' },
    { id: 'imp-outliner', label: '📥 Import Outliner' },
    { id: 'exp-outliner', label: '📤 Export Outliner' },
    { id: 'imp-graphml', label: '📥 Import GraphML / yEd' },
    { id: 'exp-graphml', label: '📤 Export GraphML / yEd' },
    { id: 'svg',  label: '🎨 SVG' },
    { id: 'pngs', label: '🖼  PNG Standard' },
    { id: 'pngh', label: '🖼  PNG HD' },
    { id: 'pngt', label: '🔲 PNG Transparent' },
    { id: 'pdfs', label: '📄 PDF Standard' },
    { id: 'pdfh', label: '📄 PDF HD' },
    { id: 'bmp', label: '🖼 BMP' },
    { id: 'jpeg', label: '🖼 JPEG' },
    { id: 'webp', label: '🖼 WebP' },
    { id: 'print', label: '🖨 Imprimer…' },
    { id: 'md',   label: '📝 Markdown' },
  ];

  const handle = async (id: string) => {
    setAnchorEl(null);
    const el = svgRef.current;
    switch (id) {
      case 'imp': {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.minder,.json';
        inp.onchange = () => {
          const f = inp.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = ev => {
            try {
              const content = ev.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier Minder est illisible.');
              const importedNodes = MinderJSON.deserialize(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: importedNodes },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier Minder.');
            }
          };
          r.onerror = () => alert(r.error?.message ?? 'Impossible de lire le fichier Minder.');
          r.readAsText(f);
        };
        inp.click(); break;
      }
      case 'imp-opml': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.opml,.xml,text/x-opml,application/xml,text/xml';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier OPML est illisible.');
              const imported = parseOPML(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier OPML.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier OPML.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-md': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,text/markdown,text/plain';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier Markdown est illisible.');
              const imported = parseMarkdown(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier Markdown.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier Markdown.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-text': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,text/plain';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier texte est illisible.');
              const imported = parsePlainText(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier texte.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier texte.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-mm': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mm,application/xml,text/xml';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier .mm est illisible.');
              const imported = parseFreeMind(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: {
                  docId: doc.id,
                  nodes: imported.nodes,
                  title: imported.title,
                  freeEdges: imported.freeEdges,
                },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier FreeMind/Freeplane.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier .mm.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-mmd': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mmd,.mermaid,text/plain';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier Mermaid est illisible.');
              const imported = parseMermaid(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier Mermaid.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier Mermaid.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-xmind': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xmind,application/vnd.xmind.workbook,application/zip';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (!(content instanceof ArrayBuffer)) throw new Error('Le contenu du fichier XMind est illisible.');
              const imported = parseXMind(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: {
                  docId: doc.id,
                  nodes: imported.nodes,
                  title: imported.title,
                  freeEdges: imported.freeEdges,
                },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier XMind.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier XMind.');
          reader.readAsArrayBuffer(file);
        };
        input.click();
        break;
      }
      case 'imp-org': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.org,text/plain';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier Org-mode est illisible.');
              const imported = parseOrgMode(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier Org-mode.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier Org-mode.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-csv': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv,text/plain';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier CSV est illisible.');
              const imported = parseCSV(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier CSV.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier CSV.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-puml': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.puml,.plantuml,text/plain';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier PlantUML est illisible.');
              const imported = parsePlantUML(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier PlantUML.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier PlantUML.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-outliner': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.outliner,application/xml,text/xml';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier Outliner est illisible.');
              const imported = parseOutliner(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: { docId: doc.id, nodes: imported.nodes, title: imported.title },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier Outliner.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier Outliner.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'imp-graphml': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.graphml,application/xml,text/xml';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Le contenu du fichier GraphML est illisible.');
              const imported = parseYEd(content);
              window.dispatchEvent(new CustomEvent('minder:import', {
                detail: {
                  docId: doc.id,
                  nodes: imported.nodes,
                  title: imported.title,
                  freeEdges: imported.freeEdges,
                },
              }));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Impossible d’importer ce fichier GraphML.');
            }
          };
          reader.onerror = () => alert(reader.error?.message ?? 'Impossible de lire le fichier GraphML.');
          reader.readAsText(file);
        };
        input.click();
        break;
      }
      case 'exp':  exportMinderJSON(nodes, doc.title); break;
      case 'exp-opml': downloadOPML(nodes, doc.title); break;
      case 'exp-mm': downloadFreeMind(nodes, doc.title, doc.freeEdges ?? []); break;
      case 'exp-mmd': downloadMermaid(nodes, doc.title); break;
      case 'exp-xmind': downloadXMind(nodes, doc.title, doc.freeEdges ?? []); break;
      case 'exp-org': downloadOrgMode(nodes, doc.title); break;
      case 'exp-csv': downloadCSV(nodes, doc.title); break;
      case 'exp-puml': downloadPlantUML(nodes, doc.title); break;
      case 'exp-outliner': downloadOutliner(nodes, doc.title); break;
      case 'exp-graphml': downloadYEd(nodes, doc.title, doc.freeEdges ?? []); break;
      case 'exp-text': downloadPlainText(nodes, doc.title); break;
      case 'svg':  if (el) await exportSVG({ svgEl: el, title: doc.title, darkMode }); break;
      case 'pngs': if (el) await exportPNG({ svgEl: el, title: doc.title, darkMode, quality: 'standard' }); break;
      case 'pngh': if (el) await exportPNG({ svgEl: el, title: doc.title, darkMode, quality: 'hd' }); break;
      case 'pngt': if (el) await exportPNG({ svgEl: el, title: doc.title, darkMode, quality: 'hd', transparent: true }); break;
      case 'pdfs': if (el) await exportPDF({ svgEl: el, title: doc.title, darkMode, quality: 'standard' }); break;
      case 'pdfh': if (el) await exportPDF({ svgEl: el, title: doc.title, darkMode, quality: 'hd' }); break;
      case 'jpeg': if (el) await exportRasterImage({ svgEl: el, title: doc.title, darkMode, format: 'jpeg' }); break;
      case 'webp': if (el) await exportRasterImage({ svgEl: el, title: doc.title, darkMode, format: 'webp' }); break;
      case 'bmp': if (el) await exportRasterImage({ svgEl: el, title: doc.title, darkMode, format: 'bmp' }); break;
      case 'print': if (el) await exportPrint({ svgEl: el, title: doc.title, darkMode }); break;
      case 'md':   exportMarkdownFile(nodes, doc.title); break;
    }
  };

  return (
    <>
      <TBtn
        active={open}
        onClick={event => setAnchorEl(anchor => anchor ? null : event.currentTarget)}
        dark={darkMode}
        title="Export"
        aria-label="Ouvrir les options d’import et d’export"
      >
        ⬇ ▾
      </TBtn>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: bg,
              color: text,
              border: `1px solid ${border}`,
              borderRadius: 2.5,
              minWidth: 240,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 'calc(100dvh - 24px)',
              overflowY: 'auto',
              boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        {items.map(it => (
          <MenuItem
            key={it.id}
            onClick={() => { void handle(it.id); }}
            sx={{
              minHeight: 34,
              py: .75,
              fontSize: 12.5,
              color: text,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: darkMode ? '#2a2d4a' : '#f0f4ff' },
            }}
          >
            {it.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ─── Tiny button helpers ──────────────────────────────────────────────────────

function TBtn({ children, active, disabled, onClick, title, 'aria-label': ariaLabel, dark, accent }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string; 'aria-label'?: string; dark: boolean; accent?: string;
}) {
  const border = dark ? '#30325a' : '#dde3f0';
  const bg2    = accent ?? '#4f8ef7';
  return (
    <button title={title} aria-label={ariaLabel} disabled={disabled} onClick={onClick}
      style={{
        padding: '5px 9px', borderRadius: 7,
        border: `1.5px solid ${active ? bg2 : border}`,
        background: active ? bg2 : (disabled ? 'transparent' : (dark ? '#22243c' : '#f8f9fc')),
        color: active ? '#fff' : (disabled ? (dark ? '#40406a' : '#b0b8d0') : (dark ? '#dde0f8' : '#1a1a2e')),
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12.5, fontFamily: 'inherit', opacity: disabled ? 0.4 : 1,
        transition: 'all 0.12s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function TSep({ dark }: { dark: boolean }) {
  return <div style={{ width: 1, height: 18, background: dark ? '#30325a' : '#dde3f0', margin: '0 2px', flexShrink: 0 }} />;
}

function cornerBtn(darkMode: boolean, active: boolean): React.CSSProperties {
  return {
    width: 34, height: 34, borderRadius: 8,
    border: `1.5px solid ${active ? '#4f8ef7' : (darkMode ? '#30325a' : '#dde3f0')}`,
    background: active ? '#4f8ef7' : (darkMode ? '#22243c' : '#fff'),
    color: active ? '#fff' : (darkMode ? '#dde0f8' : '#1a1a2e'),
    cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.13s',
  };
}

export { ExportDropdown, TBtn, TSep, cornerBtn };
