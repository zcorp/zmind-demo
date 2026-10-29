import React from 'react';
// ─────────────────────────────────────────────────────────────────────────────
// src/canvas/useNodeActions.ts
//
// Node action hooks: copy/paste subtrees, context-menu action dispatch.
// Extracted from MapCanvas to keep it under 600 lines.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { NodesMap, MapDocument, ClipboardEntry } from '../types';
export interface MenuAction {
  id: string; label: string; icon: string;
  shortcut?: string; disabled?: boolean; danger?: boolean;
  divider?: boolean; submenu?: MenuAction[];
}
import { genId, allDesc, spawnChildPos, spawnSiblingPos, rebalanceSiblings } from './helpers';
import { exportSVG, exportPNG, exportPDF, exportMinderJSON, exportMarkdownFile, exportRasterImage, exportPrint } from '../formats/Export';
import { downloadPlainText } from '../formats/PlainText';

interface NodeActionsOptions {
  nodesRef:       React.MutableRefObject<NodesMap>;
  doc:            MapDocument;
  darkMode:       boolean;
  svgRef:         React.RefObject<SVGSVGElement>;
  selectedIds:    Set<string>;
  clipBoard:      ClipboardEntry | null;
  histI:          number;
  histLen:        number;
  mutate:         (fn: (p: NodesMap) => NodesMap) => void;
  undo:           () => void;
  redo:           () => void;
  onNodesChange:  (docId: string, nodes: NodesMap) => void;
  setSelectedId:  (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  setEditingId:   (id: string | null) => void;
  setClipBoard:   (c: ClipboardEntry | null) => void;
  setInspectorOpen: (v: boolean) => void;
  setInspectorTab: (tab: 'style' | 'content' | 'info') => void;
  setInsertOpen:    (v: boolean) => void;
  setSlideshow:     (id: string | null) => void;
  setSearchQ:       (q: string) => void;
  setLinkMode:      (v: boolean) => void;
  setLinkFrom:      (id: string | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useCopyPaste(opts: Pick<NodeActionsOptions,
  'nodesRef' | 'mutate' | 'setSelectedId' | 'setSelectedIds' | 'setEditingId'
>) {
  const { nodesRef, mutate } = opts;

  const copyNodes = useCallback((rootId: string): ClipboardEntry => {
    const cur = nodesRef.current;
    const sub: NodesMap = {};
    allDesc(cur, rootId).forEach(id => { if (cur[id]) sub[id] = JSON.parse(JSON.stringify(cur[id])); });
    return { rootId, nodes: sub };
  }, [nodesRef]);

  const pasteNodes = useCallback((clip: ClipboardEntry, targetParentId: string) => {
    const idMap: Record<string, string> = {};
    const remap = (id: string) => { if (!idMap[id]) idMap[id] = genId(); return idMap[id]; };

    mutate(prev => {
      const next = { ...prev };
      const newRootId = remap(clip.rootId);
      const parent    = next[targetParentId];

      Object.values(clip.nodes).forEach(cn => {
        const nid     = remap(cn.id);
        const nParent = cn.id === clip.rootId
          ? targetParentId
          : (cn.parentId ? remap(cn.parentId) : null);
        next[nid] = { ...cn, id: nid, parentId: nParent, children: cn.children.map(remap), x: cn.x + 30, y: cn.y + 30 };
      });

      if (parent) {
        next[targetParentId] = { ...parent, children: [...parent.children, newRootId] };
      }
      return next;
    });
  }, [mutate]);

  return { copyNodes, pasteNodes };
}

// ─────────────────────────────────────────────────────────────────────────────

export function buildCtxActions(
  nodeId: string,
  nodes: NodesMap,
  clipBoard: ClipboardEntry | null,
  selectedIds: Set<string>,
  histI: number,
  histLen: number,
): MenuAction[] {
  const node      = nodes[nodeId];
  const isRoot    = !node?.parentId;
  const hasClip   = !!clipBoard;
  const multiCount = selectedIds.size > 1 ? selectedIds.size : 0;

  return [
    { id: 'edit',        label: 'Éditer',              icon: '✏️', shortcut: 'F2' },
    { id: 'add-sibling', label: 'Même niveau',         icon: '➕', shortcut: '⇧↵', disabled: isRoot },
    { id: 'add-child',   label: 'Niveau inférieur',    icon: '⤵', shortcut: '↵' },
    { id: 'divider1', label: '', icon: '', divider: true },
    { id: 'insert',      label: 'Insérer…',            icon: '📎' },
    { id: 'format',      label: 'Format',              icon: '🎨', submenu: [
      { id: 'fmt-color',    label: 'Couleur',      icon: '🔵' },
      { id: 'fmt-priority', label: 'Priorité',     icon: '🎯' },
      { id: 'fmt-icon',     label: 'Icône',        icon: '🏷' },
      { id: 'fmt-number',   label: 'Numérotation', icon: '🔢' },
    ]},
    { id: 'divider2', label: '', icon: '', divider: true },
    { id: 'copy',       label: multiCount > 1 ? `Copier (${multiCount} nœuds)` : 'Copier', icon: '📋', shortcut: '⌘C' },
    { id: 'paste',      label: 'Coller (enfant)',      icon: '📌', shortcut: '⌘V', disabled: !hasClip },
    { id: 'duplicate',  label: 'Dupliquer',            icon: '⎘',  shortcut: '⌘D' },
    { id: 'divider3', label: '', icon: '', divider: true },
    { id: 'select-all',      label: 'Tout sélectionner',      icon: '⬜', shortcut: '⌘A' },
    { id: 'select-subtree',  label: 'Sélectionner sous-arbre', icon: '🌿' },
    { id: 'apply-to-selection', label: 'Appliquer couleur à la sélection', icon: '🎨', disabled: multiCount < 2 },
    { id: 'divider4', label: '', icon: '', divider: true },
    { id: 'link-free',   label: 'Créer un lien libre…', icon: '🔗' },
    { id: 'slideshow',   label: 'Diaporama',            icon: '▶️' },
    { id: 'search',      label: 'Rechercher dans…',     icon: '🔍' },
    { id: 'divider5', label: '', icon: '', divider: true },
    { id: 'export-node', label: 'Exporter…', icon: '⬇', submenu: [
      { id: 'exp-minder',  label: 'Fichier .minder',  icon: '💾' },
      { id: 'exp-md',      label: 'Markdown',         icon: '📝' },
      { id: 'exp-text',    label: 'Texte brut (.txt)', icon: '📝' },
      { id: 'exp-png-std', label: 'PNG Standard',     icon: '🖼' },
      { id: 'exp-png-hd',  label: 'PNG HD',           icon: '🖼' },
      { id: 'exp-png-tr',  label: 'PNG Transparent',  icon: '🔲' },
      { id: 'exp-svg',     label: 'SVG',              icon: '🎨' },
      { id: 'exp-pdf-std', label: 'PDF Standard',     icon: '📄' },
      { id: 'exp-pdf-hd',  label: 'PDF HD',           icon: '📄' },
      { id: 'exp-jpeg',    label: 'JPEG',             icon: '🖼' },
      { id: 'exp-webp',    label: 'WebP',             icon: '🖼' },
      { id: 'exp-bmp',     label: 'BMP',              icon: '🖼' },
      { id: 'exp-print',   label: 'Imprimer…',        icon: '🖨' },
    ]},
    { id: 'share',      label: 'Partager…',            icon: '🔗' },
    { id: 'divider6', label: '', icon: '', divider: true },
    { id: 'undo',  label: 'Annuler',    icon: '↶', shortcut: '⌘Z', disabled: histI <= 0 },
    { id: 'redo',  label: 'Rétablir',   icon: '↷', shortcut: '⌘Y', disabled: histI >= histLen - 1 },
    { id: 'save',  label: 'Sauvegarder', icon: '💾', shortcut: '⌘S' },
    { id: 'divider7', label: '', icon: '', divider: true },
    { id: 'delete', label: multiCount > 1 ? `Supprimer (${multiCount})` : 'Supprimer', icon: '🗑', danger: true, disabled: isRoot },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────

export function useCtxAction(opts: NodeActionsOptions & {
  copyNodes:  (rootId: string) => ClipboardEntry;
  pasteNodes: (clip: ClipboardEntry, targetParentId: string) => void;
}) {
  const {
    nodesRef, doc, darkMode, svgRef, selectedIds, clipBoard,
    mutate, undo, redo, onNodesChange,
    setSelectedId, setSelectedIds, setEditingId, setClipBoard,
    setInspectorOpen, setInspectorTab, setInsertOpen, setSlideshow, setSearchQ,
    setLinkMode, setLinkFrom, copyNodes, pasteNodes,
  } = opts;

  const handleCtxAction = useCallback((actionId: string, nodeId: string) => {
    const node = nodesRef.current[nodeId]; if (!node) return;

    switch (actionId) {
      case 'edit': setEditingId(nodeId); break;

      case 'add-child': {
        const nid = genId();
        mutate(p => {
          const sp = spawnChildPos(p, nodeId);
          const next = {
            ...p,
            [nid]: { id: nid, text: 'Nouveau', x: sp.x, y: sp.y, parentId: nodeId, children: [], collapsed: false },
            [nodeId]: { ...node, children: [...node.children, nid] },
          };
          return rebalanceSiblings(next, nodeId);
        });
        setSelectedId(nid); setTimeout(() => setEditingId(nid), 30);
        break;
      }

      case 'add-sibling': {
        if (!node.parentId) break;
        const par = nodesRef.current[node.parentId]; if (!par) break;
        const nid = genId();
        mutate(p => {
          const sp = spawnSiblingPos(p, nodeId);
          const next = {
            ...p,
            [nid]: { id: nid, text: 'Nouveau', x: sp.x, y: sp.y, parentId: node.parentId, children: [], collapsed: false },
            [node.parentId!]: { ...par, children: [...par.children, nid] },
          };
          return rebalanceSiblings(next, node.parentId!);
        });
        setSelectedId(nid); setTimeout(() => setEditingId(nid), 30);
        break;
      }

      case 'delete': {
        const toDeleteRoots = selectedIds.size > 1 ? [...selectedIds] : [nodeId];
        const nonRoots = toDeleteRoots.filter(id => nodesRef.current[id]?.parentId);
        if (!nonRoots.length) break;
        mutate(p => {
          const n = { ...p };
          const toRemove = new Set<string>();
          nonRoots.forEach(id => allDesc(n, id).forEach(d => toRemove.add(d)));
          toRemove.forEach(id => {
            const nd = n[id]; if (!nd?.parentId) return;
            const par = n[nd.parentId];
            if (par) n[nd.parentId] = { ...par, children: par.children.filter(c => c !== id) };
            delete n[id];
          });
          return n;
        });
        setSelectedId(null); setSelectedIds(new Set());
        break;
      }

      case 'copy':
        setClipBoard(selectedIds.size > 1
          ? copyNodes([...selectedIds][0])
          : copyNodes(nodeId));
        break;

      case 'paste':
        if (!clipBoard) break;
        pasteNodes(clipBoard, nodeId);
        break;

      case 'duplicate': {
        const clip = copyNodes(nodeId);
        if (node.parentId) pasteNodes(clip, node.parentId);
        break;
      }

      case 'select-all':
        setSelectedIds(new Set(Object.keys(nodesRef.current)));
        break;

      case 'select-subtree':
        setSelectedIds(new Set(allDesc(nodesRef.current, nodeId)));
        break;

      case 'apply-to-selection': {
        const color = nodesRef.current[nodeId]?.color;
        if (!color) break;
        mutate(p => {
          const n = { ...p };
          selectedIds.forEach(id => { if (n[id]) n[id] = { ...n[id], color }; });
          return n;
        });
        break;
      }

      case 'link-free':   setLinkMode(true); setLinkFrom(nodeId); break;
      case 'insert':      setInsertOpen(true); setInspectorOpen(false); break;
      case 'fmt-color':
        setSelectedId(nodeId);
        setSelectedIds(new Set([nodeId]));
        setInspectorTab('style');
        setInspectorOpen(true);
        break;
      case 'fmt-priority': case 'fmt-icon': case 'fmt-number':
        setSelectedId(nodeId);
        setSelectedIds(new Set([nodeId]));
        setInspectorTab('content');
        setInspectorOpen(true);
        break;
      case 'slideshow':   setSlideshow(nodeId); break;
      case 'search':      setSearchQ(node.text); break;
      case 'undo':        undo(); break;
      case 'redo':        redo(); break;
      case 'save':        localStorage.setItem('minder_manual_save', JSON.stringify(nodesRef.current)); break;
      case 'share':       navigator.clipboard.writeText(window.location.href).catch(() => {}); break;
      case 'exp-minder':  exportMinderJSON(nodesRef.current, doc.title); break;
      case 'exp-md':      exportMarkdownFile(nodesRef.current, doc.title); break;
      case 'exp-text':    downloadPlainText(nodesRef.current, doc.title); break;
      case 'exp-svg':     if (svgRef.current) exportSVG({ svgEl: svgRef.current, title: doc.title, darkMode }); break;
      case 'exp-png-std': if (svgRef.current) exportPNG({ svgEl: svgRef.current, title: doc.title, darkMode, quality: 'standard' }); break;
      case 'exp-png-hd':  if (svgRef.current) exportPNG({ svgEl: svgRef.current, title: doc.title, darkMode, quality: 'hd' }); break;
      case 'exp-png-tr':  if (svgRef.current) exportPNG({ svgEl: svgRef.current, title: doc.title, darkMode, quality: 'hd', transparent: true }); break;
      case 'exp-pdf-std': if (svgRef.current) exportPDF({ svgEl: svgRef.current, title: doc.title, darkMode, quality: 'standard' }); break;
      case 'exp-pdf-hd':  if (svgRef.current) exportPDF({ svgEl: svgRef.current, title: doc.title, darkMode, quality: 'hd' }); break;
      case 'exp-jpeg':    if (svgRef.current) exportRasterImage({ svgEl: svgRef.current, title: doc.title, darkMode, format: 'jpeg' }); break;
      case 'exp-webp':    if (svgRef.current) exportRasterImage({ svgEl: svgRef.current, title: doc.title, darkMode, format: 'webp' }); break;
      case 'exp-bmp':     if (svgRef.current) exportRasterImage({ svgEl: svgRef.current, title: doc.title, darkMode, format: 'bmp' }); break;
      case 'exp-print':   if (svgRef.current) exportPrint({ svgEl: svgRef.current, title: doc.title, darkMode }); break;
    }
  }, [nodesRef, doc, darkMode, svgRef, selectedIds, clipBoard, mutate, undo, redo,
      onNodesChange, setSelectedId, setSelectedIds, setEditingId, setClipBoard,
      setInspectorOpen, setInspectorTab, setInsertOpen, setSlideshow, setSearchQ,
      setLinkMode, setLinkFrom, copyNodes, pasteNodes]);

  return { handleCtxAction };
}
