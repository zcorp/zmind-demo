import React from 'react';
// ─────────────────────────────────────────────────────────────────────────────
// src/canvas/useMapKeyboard.ts
// Keyboard shortcut handler for the canvas.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { NodesMap, ClipboardEntry } from '../types';
import { genId } from './helpers';
import { spawnChildPos, allDesc, rebalanceSiblings } from './helpers';

interface KeyboardOptions {
  editingId:       string | null;
  focusSearch:     () => void;
  selectedId:      string | null;
  selectedIds:     Set<string>;
  linkMode:        boolean;
  nodesRef:        React.MutableRefObject<NodesMap>;
  panRef:          React.MutableRefObject<{ x: number; y: number }>;
  scaleRef:        React.MutableRefObject<number>;
  clipBoard:       ClipboardEntry | null;
  docId:           string;

  undo:            () => void;
  redo:            () => void;
  mutate:          (fn: (p: NodesMap) => NodesMap) => void;
  onNodesChange:   (docId: string, nodes: NodesMap) => void;
  setPan:          (p: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setScale:        (s: number) => void;
  setSelectedId:   (id: string | null) => void;
  setSelectedIds:  (ids: Set<string>) => void;
  setEditingId:    (id: string | null) => void;
  setCtxMenu:      (m: null) => void;
  setLinkMode:     (v: boolean) => void;
  setLinkFrom:     (id: string | null) => void;
  setClipBoard:    (c: ClipboardEntry | null) => void;
  copyNodes:       (rootId: string) => ClipboardEntry;
  pasteNodes:      (clip: ClipboardEntry, targetParentId: string) => void;
}

export function isSearchFocusShortcut(
  event: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'key'>,
): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f';
}

export function useMapKeyboard(opts: KeyboardOptions) {
  const {
    editingId, selectedId, selectedIds, linkMode,
    focusSearch,
    nodesRef, panRef, scaleRef, clipBoard, docId,
    undo, redo, mutate, onNodesChange,
    setPan, setScale, setSelectedId, setSelectedIds,
    setEditingId, setCtxMenu, setLinkMode, setLinkFrom,
    setClipBoard, copyNodes, pasteNodes,
  } = opts;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const ctrl = e.ctrlKey || e.metaKey;

      // ── Global shortcuts ──────────────────────────────────────────────────
      if (isSearchFocusShortcut(e)) {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (ctrl && e.key === 's') { e.preventDefault(); return; }
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(Object.keys(nodesRef.current)));
        return;
      }
      if (ctrl && e.key === 'c' && selectedId) {
        e.preventDefault();
        setClipBoard(copyNodes(selectedId));
        return;
      }
      if (ctrl && e.key === 'v' && clipBoard && selectedId) {
        e.preventDefault();
        pasteNodes(clipBoard, selectedId);
        return;
      }
      if (ctrl && e.key === 'd' && selectedId) {
        e.preventDefault();
        const clip = copyNodes(selectedId);
        const n = nodesRef.current[selectedId];
        if (n?.parentId) pasteNodes(clip, n.parentId);
        return;
      }

      // ── Arrow keys: pan canvas or move node ───────────────────────────────
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : 12;
        const dx = e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0;
        const dy = e.key === 'ArrowUp'   ? step : e.key === 'ArrowDown'  ? -step : 0;

        if (ctrl && selectedId && nodesRef.current[selectedId]) {
          const moveAmt = 10;
          const mx = e.key === 'ArrowRight' ? moveAmt : e.key === 'ArrowLeft'  ? -moveAmt : 0;
          const my = e.key === 'ArrowDown'  ? moveAmt : e.key === 'ArrowUp'    ? -moveAmt : 0;
          const cur = nodesRef.current;
          const ids = selectedIds.size > 1 ? [...selectedIds] : [selectedId];
          let updated = { ...cur };
          ids.forEach(id => {
            if (updated[id]) updated[id] = { ...updated[id], x: updated[id].x + mx, y: updated[id].y + my };
          });
          onNodesChange(docId, updated);
        } else {
          setPan(p => ({ x: p.x + dx, y: p.y + dy }));
          panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
        }
        return;
      }

      // ── Zoom ─────────────────────────────────────────────────────────────
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const ns = Math.min(6, scaleRef.current * 1.15);
        scaleRef.current = ns; setScale(ns); return;
      }
      if (e.key === '-') {
        e.preventDefault();
        const ns = Math.max(0.1, scaleRef.current * 0.87);
        scaleRef.current = ns; setScale(ns); return;
      }
      if (ctrl && e.key === '0') {
        e.preventDefault(); setScale(1); setPan({ x: 0, y: 0 }); return;
      }

      // ── Escape ────────────────────────────────────────────────────────────
      if (e.key === 'Escape') {
        if (linkMode) { setLinkMode(false); setLinkFrom(null); return; }
        setSelectedId(null); setSelectedIds(new Set()); setCtxMenu(null); return;
      }

      // ── Node-specific (require selection) ────────────────────────────────
      const sel = selectedId;
      if (!sel || !nodesRef.current[sel]) return;
      const node = nodesRef.current[sel];

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (!node.parentId) return;
        const toDeleteRoots = selectedIds.size > 1 ? [...selectedIds] : [sel];
        mutate(p => {
          const n = { ...p };
          const toRemove = new Set<string>();
          toDeleteRoots.filter(id => n[id]?.parentId).forEach(id =>
            allDesc(n, id).forEach(d => toRemove.add(d))
          );
          toRemove.forEach(id => {
            const nd = n[id]; if (!nd?.parentId) return;
            const par = n[nd.parentId];
            if (par) n[nd.parentId] = { ...par, children: par.children.filter(c => c !== id) };
            delete n[id];
          });
          return n;
        });
        setSelectedId(null); setSelectedIds(new Set());

      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nid = genId();
        mutate(p => {
          const sp = spawnChildPos(p, node.id);
          const next = {
            ...p,
            [nid]: { id: nid, text: 'Nouveau', x: sp.x, y: sp.y, parentId: node.id, children: [], collapsed: false },
            [node.id]: { ...node, children: [...node.children, nid] },
          };
          return rebalanceSiblings(next, node.id);
        });
        setSelectedId(nid);
        setSelectedIds(new Set([nid]));
        setTimeout(() => setEditingId(nid), 30);

      } else if (e.key === 'F2') {
        e.preventDefault();
        setEditingId(sel);

      } else if (e.key === ' ' || e.key === 'Tab') {
        e.preventDefault();
        if (!node.children.length) return;
        mutate(p => ({ ...p, [node.id]: { ...node, collapsed: !node.collapsed } }));
      }
    };

    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [
    editingId, focusSearch, selectedId, selectedIds, linkMode,
    undo, redo, mutate, onNodesChange, docId, clipBoard,
    copyNodes, pasteNodes,
  ]);
}
