import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MindNode, NodesMap, MapDocument, ClipboardEntry, NodeAttachment, NodeTextFormat, NodeTextStyle } from '../types';
import { FreeEdge } from '../types/index';
import { DocPluginPrefs } from '../types/index';

interface CanvasProps {
  doc:                 MapDocument;
  darkMode:            boolean;
  onNodesChange:       (docId: string, nodes: NodesMap) => void;
  onPluginPrefsChange: (docId: string, prefs: DocPluginPrefs) => void;
  onLearningStepChange: (docId: string, stepId: string) => void;
  onLearningStepsChange: (docId: string, stepIds: string[]) => void;
  onOpenPluginPicker:  () => void;
  onToggleDark:        () => void;
  onRenameDoc:         (docId: string, title: string) => void;
}
import { NODE_ICON_COMPONENTS, PRIORITY_CONFIG } from '../constants/icons';
import { exportSVG, exportPNG, exportPDF, exportMinderJSON, exportMarkdownFile, exportRasterImage, exportPrint } from '../formats/Export';
import { collapsedAncestors, searchMatches as findSearchMatches, type SearchFilters } from '../canvas/search';
import { wrapNodeLabelRanges } from '../canvas/node-label';
import { applyTextFormat, clampTextFormats, textFormatAt, textFormatSegments } from '../canvas/text-formatting';
import { ensureReadableNodeText } from '../canvas/color-contrast';
import { customNodeShapePath } from '../canvas/node-shape';
import { getNodeGeometry } from '../canvas/node-geometry';
import { normalizeExternalUrl, resolveImageSource } from '../canvas/attachment-preview';
import { toggleTaskStatus } from '../canvas/tasks';
import { downloadOPML } from '../formats/OPML';
import { downloadFreeMind } from '../formats/FreeMind';
import { downloadMermaid } from '../formats/Mermaid';
import { downloadXMind } from '../formats/XMind';
import { downloadOrgMode } from '../formats/OrgMode';
import { downloadCSV } from '../formats/CSV';
import { downloadPlantUML } from '../formats/PlantUML';
import { downloadOutliner } from '../formats/Outliner';
import { downloadYEd } from '../formats/YEd';
import { downloadPlainText } from '../formats/PlainText';
import { usePlugins, nodeDepth } from '../plugins/usePlugins';
import { Inspector, type InspectorTab } from './Inspector';
import { InsertPanel } from './InsertPanel';
import { applyNodeShapeOverrides } from '../plugins/node-shape-overrides';
import { ContextMenu, MenuAction } from './ContextMenu';
import { Slideshow } from './Slideshow';
import { Minimap } from './Minimap';
import { ZoomBar } from './ZoomBar';
import { TopBar } from './TopBar';
import { ExportModal } from './ExportModal';
import { HelpIcon } from './HelpIcon';
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { NODE_W, NODE_H } from '../canvas/constants';
import { genId, allDesc, visible, spawnChildPos, spawnSiblingPos, rebalanceSiblings } from '../canvas/helpers';
import { useMapHistory } from '../canvas/useMapHistory';
import { useMapKeyboard } from '../canvas/useMapKeyboard';
import { edgePorts, smartBezier } from '../canvas/edgeGeometry';
import { InlineEditor } from '../canvas/InlineEditor';
import { TBtn, TSep } from './UIHelpers';
import { CanvasToolbar } from './CanvasToolbar';
import { LearningStepsBar } from './LearningStepsBar';
import { LearningStepsDialog } from './LearningStepsDialog';
import { getLearningSteps, type LearningStep } from '../canvas/learning-steps';
import { useCopyPaste, useCtxAction, buildCtxActions } from '../canvas/useNodeActions';

// ─────────────────────────────────────────────────────────────────────────────
// MapCanvas — the interactive SVG mind-map editor for a single document.
// ─────────────────────────────────────────────────────────────────────────────

export function MapCanvas({
  doc, darkMode, onNodesChange, onPluginPrefsChange, onOpenPluginPicker,
  onLearningStepChange, onLearningStepsChange, onToggleDark, onRenameDoc,
}: CanvasProps) {
  const isMobile = useMediaQuery('(max-width:600px), (max-height:500px)', { noSsr: true });
  const svgRef    = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Plugin state — scoped to this document ────────────────────────────────
  const plugins = usePlugins(doc.pluginPrefs, darkMode);

  // ── Panel states ──────────────────────────────────────────────────────────
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('style');
  const [insertOpen,    setInsertOpen]    = useState(false);
  const [slideshow,     setSlideshow]     = useState<string | null>(null);
  const [minimapOpen,   setMinimapOpen]   = useState(!isMobile);
  const [learningFocusMode, setLearningFocusMode] = useState(
    doc.learningStepIds !== undefined ? doc.learningStepIds.length > 0 : Boolean(doc.learningPathTemplateId),
  );
  const [learningStepsDialogOpen, setLearningStepsDialogOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ attachment: NodeAttachment; source: string } | null>(null);
  const [hoveredId,       setHoveredId]       = useState<string | null>(null);
  const [savedAt,         setSavedAt]         = useState<number | undefined>(undefined);
  // Free edge linking mode
  const [linkMode,        setLinkMode]        = useState(false);
  const [linkFrom,        setLinkFrom]        = useState<string | null>(null);
  const freeEdges = doc.freeEdges ?? [];

  useEffect(() => {
    if (isMobile) setMinimapOpen(false);
  }, [isMobile]);

  // ── Node states ───────────────────────────────────────────────────────────
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [editingTextDraft, setEditingTextDraft] = useState<string | null>(null);
  const [editingTextFormats, setEditingTextFormats] = useState<NodeTextFormat[]>([]);
  const [textSelection, setTextSelection] = useState<{ nodeId: string; start: number; end: number } | null>(null);
  const [textFormattingAnchor, setTextFormattingAnchor] = useState<Element | null>(null);
  const [searchQ,       setSearchQ]       = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    fields: { titles: true, notes: false, tags: false, connections: false, attachments: false },
    includeTasks: true,
    includeNonTasks: true,
    includeCollapsed: true,
    includeExpanded: true,
    priorities: { none: true, low: true, medium: true, high: true, critical: true },
  });
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const activeSearchIndexRef = useRef(-1);

  // ── View states ───────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [pan,   setPan]   = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const panRef   = useRef({ x: 0, y: 0 });
  const nodesRef = useRef<NodesMap>(doc.nodes);
  scaleRef.current = scale;
  panRef.current   = pan;
  nodesRef.current = doc.nodes;

  // ── Rubber-band selection state ───────────────────────────────────────────
  const [rubberBand, setRubberBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const rbStart = useRef<{ x: number; y: number } | null>(null);

  // ── Interaction refs ──────────────────────────────────────────────────────
  const dragRef = useRef<{
    nodeId: string; sx: number; sy: number; mx: number; my: number;
    isMulti: boolean; initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const panGrab = useRef<{ sp: { x: number; y: number }; sm: { x: number; y: number } } | null>(null);
  const [dragging, setDragging] = useState(false);

  // ── Context menu ──────────────────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // ── Clipboard ─────────────────────────────────────────────────────────────
  const [clipBoard, setClipBoard] = useState<ClipboardEntry | null>(null);

  // ── History (via hook) ───────────────────────────────────────────────────
  const nodes = doc.nodes;
  const learningSteps = useMemo<LearningStep[]>(() => {
    return getLearningSteps(nodes, doc.learningStepIds, doc.learningPathTemplateId);
  }, [doc.learningPathTemplateId, doc.learningStepIds, nodes]);
  const activeLearningStepId = learningSteps.find(step => step.id === doc.learningStepId)?.id
    ?? learningSteps[0]?.id
    ?? '';
  const learningFocusNodeIds = useMemo(() => {
    const focused = new Set<string>();
    const root = Object.values(nodes).find(node => node.parentId === null);
    if (root) focused.add(root.id);
    const stack = activeLearningStepId ? [activeLearningStepId] : [];
    while (stack.length) {
      const id = stack.pop()!;
      if (focused.has(id)) continue;
      focused.add(id);
      stack.push(...(nodes[id]?.children ?? []));
    }
    return focused;
  }, [activeLearningStepId, nodes]);

  const { pushHist, reset: resetHistory, mutate, undo, redo, histI, histLen, canUndo, canRedo } = useMapHistory({
    docId: doc.id, nodesRef, onNodesChange, setSavedAt,
  });

  useEffect(() => {
    if (!editingId) {
      setEditingTextDraft(null);
      setEditingTextFormats([]);
      return;
    }
    const node = nodes[editingId];
    if (!node) return;
    setEditingTextDraft(node.text);
    setEditingTextFormats(node.textFormats ?? []);
  }, [editingId]);

  useEffect(() => {
    const onImport = (event: Event) => {
      const { docId, nodes: importedNodes } = (event as CustomEvent).detail ?? {};
      if (docId !== doc.id || !importedNodes) return;
      resetHistory(importedNodes);
      setSelectedId(null);
      setSelectedIds(new Set());
      setEditingId(null);
      setCtxMenu(null);
      setLinkMode(false);
      setLinkFrom(null);
    };
    window.addEventListener('minder:import', onImport);
    return () => window.removeEventListener('minder:import', onImport);
  }, [doc.id, resetHistory]);

  // ── Screen → world coordinate conversion ─────────────────────────────────
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: sx, y: sy };
    return {
      x: (sx - rect.left - panRef.current.x) / scaleRef.current,
      y: (sy - rect.top  - panRef.current.y) / scaleRef.current,
    };
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const f  = e.deltaY > 0 ? 0.9 : 1.1;
      const r  = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const p  = scaleRef.current;
      const n  = Math.max(0.1, Math.min(6, p * f));
      const nx = mx - (mx - panRef.current.x) * (n / p);
      const ny = my - (my - panRef.current.y) * (n / p);
      scaleRef.current = n; panRef.current = { x: nx, y: ny };
      setScale(n); setPan({ x: nx, y: ny });
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ── Template listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: Event) => {
      const { nodeId, template } = (e as CustomEvent).detail;
      const parent = nodesRef.current[nodeId]; if (!parent) return;
      mutate(prev => {
        const next = { ...prev };
        const newChildren: string[] = [];
        template.nodes.forEach((label: string) => {
          const nid = genId();
          const sp = spawnChildPos({ ...prev, ...next }, nodeId);
          next[nid] = { id: nid, text: label, x: sp.x, y: sp.y, parentId: nodeId, children: [], collapsed: false };
          newChildren.push(nid);
        });
        next[nodeId] = { ...parent, children: [...parent.children, ...newChildren] };
        return next;
      });
    };
    window.addEventListener('minder:apply-template', h);
    return () => window.removeEventListener('minder:apply-template', h);
  }, [mutate]);

  // ── Pointer handlers ──────────────────────────────────────────────────────

  const handleNodeClickForLink = useCallback((nodeId: string) => {
    if (!linkMode) return false;
    if (!linkFrom) {
      setLinkFrom(nodeId);
      return true;
    }
    if (linkFrom === nodeId) {
      setLinkFrom(null);
      return true;
    }
    // Create the free edge
    const edge: FreeEdge = {
      id:    `fe_${Date.now()}`,
      from:  linkFrom,
      to:    nodeId,
      style: 'dashed',
      width: 1.5,
    };
    window.dispatchEvent(new CustomEvent('minder:free-edges', {
      detail: { docId: doc.id, freeEdges: [...freeEdges, edge] },
    }));
    setLinkFrom(null);
    setLinkMode(false);
    return true;
  }, [linkMode, linkFrom, freeEdges, doc.id]);

  const onSvgDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (ctxMenu) { setCtxMenu(null); return; }
    if (e.button !== 0) return;
    const t = e.target as Element;
    const isBackground = t === svgRef.current
      || t.classList.contains('vp-bg')
      || t.closest('g')?.classList.contains('vp-bg');

    if (isBackground) {
      e.currentTarget.setPointerCapture(e.pointerId);
      if (e.shiftKey) {
        // Shift+drag = rubber-band selection
        const rect = svgRef.current!.getBoundingClientRect();
        rbStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setRubberBand({ x: rbStart.current.x, y: rbStart.current.y, w: 0, h: 0 });
      } else {
        panGrab.current = { sp: { ...panRef.current }, sm: { x: e.clientX, y: e.clientY } };
        if (!e.ctrlKey && !e.metaKey) {
          setSelectedId(null);
          setSelectedIds(new Set());
        }
        e.currentTarget.style.cursor = 'grabbing';
      }
    }
  }, [ctxMenu]);

  const onNodeDown = useCallback((e: React.PointerEvent<SVGGElement>, node: MindNode) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Link mode: first click sets source, second click creates free edge
    if (handleNodeClickForLink(node.id)) return;

    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl) {
      // Ctrl+click = toggle multi-selection
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setSelectedId(node.id);
      return;
    }

    // If this node is already in multi-selection, drag all
    const isMulti = selectedIds.has(node.id) && selectedIds.size > 1;
    setSelectedId(node.id);
    if (!isMulti) setSelectedIds(new Set([node.id]));

    const cur = nodesRef.current;
    const ids = isMulti ? [...selectedIds] : [node.id];
    const initialPositions: Record<string, { x: number; y: number }> = {};
    ids.forEach(id => { if (cur[id]) initialPositions[id] = { x: cur[id].x, y: cur[id].y }; });

    dragRef.current = {
      nodeId: node.id, sx: node.x, sy: node.y,
      mx: e.clientX, my: e.clientY,
      isMulti, initialPositions,
    };
    setDragging(true);
  }, [selectedIds]);

  const onMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    // Pan
    if (panGrab.current && !dragRef.current) {
      const dx = e.clientX - panGrab.current.sm.x;
      const dy = e.clientY - panGrab.current.sm.y;
      const np = { x: panGrab.current.sp.x + dx, y: panGrab.current.sp.y + dy };
      panRef.current = np; setPan(np);
    }

    // Rubber-band selection
    if (rbStart.current) {
      const rect = svgRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const rb = {
        x: Math.min(rbStart.current.x, cx),
        y: Math.min(rbStart.current.y, cy),
        w: Math.abs(cx - rbStart.current.x),
        h: Math.abs(cy - rbStart.current.y),
      };
      setRubberBand(rb);
      // Select all nodes inside rubber band (screen coords → world)
      const wx1 = (rb.x - panRef.current.x) / scaleRef.current;
      const wy1 = (rb.y - panRef.current.y) / scaleRef.current;
      const wx2 = wx1 + rb.w / scaleRef.current;
      const wy2 = wy1 + rb.h / scaleRef.current;
      const inside = new Set<string>();
      Object.values(nodesRef.current).forEach(n => {
        if (n.x >= wx1 && n.x <= wx2 && n.y >= wy1 && n.y <= wy2) inside.add(n.id);
      });
      setSelectedIds(inside);
      if (inside.size > 0) setSelectedId([...inside][0]);
    }

    // Drag node(s)
    if (dragRef.current) {
      const { nodeId, sx, sy, mx, my, isMulti, initialPositions } = dragRef.current;
      const dxWorld = (e.clientX - mx) / scaleRef.current;
      const dyWorld = (e.clientY - my) / scaleRef.current;
      const cur = nodesRef.current;
      let updated = { ...cur };
      if (isMulti) {
        Object.entries(initialPositions).forEach(([id, pos]) => {
          if (updated[id]) updated[id] = { ...updated[id], x: pos.x + dxWorld, y: pos.y + dyWorld };
        });
      } else {
        updated = { ...cur, [nodeId]: { ...cur[nodeId], x: sx + dxWorld, y: sy + dyWorld } };
      }
      onNodesChange(doc.id, updated);
    }
  }, [onNodesChange, doc.id]);

  const onUp = useCallback(() => {
    if (dragRef.current) pushHist(nodesRef.current);
    dragRef.current = null;
    panGrab.current = null;
    rbStart.current = null;
    setDragging(false);
    setRubberBand(null);
    if (svgRef.current) svgRef.current.style.cursor = '';
  }, [pushHist]);

  const onNodeCtx = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(nodeId);
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  // ── Copy/Paste helpers ────────────────────────────────────────────────────

  // ── Copy/Paste & Context Menu (via hooks) ───────────────────────────────
  const { copyNodes, pasteNodes } = useCopyPaste({ nodesRef, mutate, setSelectedId, setSelectedIds, setEditingId });

  const { handleCtxAction: _handleCtxAction } = useCtxAction({
    nodesRef, doc, darkMode, svgRef, selectedIds, clipBoard, histI, histLen,
    mutate, undo, redo, onNodesChange,
    setSelectedId, setSelectedIds, setEditingId, setClipBoard,
    setInspectorOpen, setInspectorTab, setInsertOpen, setSlideshow, setSearchQ,
    setLinkMode, setLinkFrom, copyNodes, pasteNodes,
  });

  const ctxActions = (nodeId: string) =>
    buildCtxActions(nodeId, nodes, clipBoard, selectedIds, histI, histLen);

  const handleCtxAction = useCallback((actionId: string) => {
    const nodeId = ctxMenu?.nodeId; if (!nodeId) return;
    _handleCtxAction(actionId, nodeId);
    setCtxMenu(null);
  }, [ctxMenu, _handleCtxAction]);

  useMapKeyboard({
    editingId, focusSearch: () => searchInputRef.current?.focus(), selectedId, selectedIds, linkMode,
    nodesRef, panRef, scaleRef, clipBoard, docId: doc.id,
    undo, redo, mutate, onNodesChange,
    setPan, setScale, setSelectedId, setSelectedIds,
    setEditingId, setCtxMenu, setLinkMode, setLinkFrom,
    setClipBoard, copyNodes, pasteNodes,
  });


  const applyLayout = useCallback((spacingOverrides?: Partial<Pick<DocPluginPrefs, 'spacingH' | 'spacingV'>>) => {
    const rootId = Object.values(nodesRef.current).find(n => !n.parentId)?.id ?? null;
    if (!rootId) return;
    const sw = svgRef.current?.clientWidth  ?? 900;
    const sh = svgRef.current?.clientHeight ?? 650;
    const spacingH = spacingOverrides?.spacingH ?? doc.pluginPrefs?.spacingH ?? 1.0;
    const spacingV = spacingOverrides?.spacingV ?? doc.pluginPrefs?.spacingV ?? 1.0;
    const nodeGeometries = Object.values(nodesRef.current).map(node =>
      getNodeGeometry(node, nodeDepth(nodesRef.current, node.id))
    );
    const nodeWidth = Math.max(NODE_W, ...nodeGeometries.map(geometry => geometry.width));
    const nodeHeight = Math.max(NODE_H, ...nodeGeometries.map(geometry => geometry.height));
    const pos = plugins.applyLayout(nodesRef.current as any, rootId, {
      viewportWidth: sw, viewportHeight: sh, nodeWidth, nodeHeight,
      spacing: spacingV,   // primary axis = vertical
      spacingH,
    } as any);
    if (!pos.size) return;
    const arr  = [...pos.values()];
    const minX = Math.min(...arr.map(p => p.x)), maxX = Math.max(...arr.map(p => p.x));
    const minY = Math.min(...arr.map(p => p.y)), maxY = Math.max(...arr.map(p => p.y));
    const ox = (sw - (maxX - minX)) / 2 - minX;
    const oy = (sh - (maxY - minY)) / 2 - minY;
    const layoutBounds = [...pos.entries()].map(([id, point]) => {
      const geometry = getNodeGeometry(nodesRef.current[id], nodeDepth(nodesRef.current, id));
      const x = point.x + ox, y = point.y + oy;
      return {
        left: x - geometry.width / 2,
        right: x + geometry.width / 2,
        top: y - geometry.height / 2,
        bottom: y + geometry.height / 2,
      };
    });
    const layoutMinX = Math.min(...layoutBounds.map(bounds => bounds.left)) - 40;
    const layoutMaxX = Math.max(...layoutBounds.map(bounds => bounds.right)) + 40;
    const layoutMinY = Math.min(...layoutBounds.map(bounds => bounds.top)) - 40;
    const layoutMaxY = Math.max(...layoutBounds.map(bounds => bounds.bottom)) + 40;
    const nextScale = Math.min(sw / (layoutMaxX - layoutMinX), sh / (layoutMaxY - layoutMinY), 2);
    const nextPan = {
      x: sw / 2 - ((layoutMinX + layoutMaxX) / 2) * nextScale,
      y: sh / 2 - ((layoutMinY + layoutMaxY) / 2) * nextScale,
    };
    mutate(p => {
      const n = { ...p };
      pos.forEach((pp, id) => { if (n[id]) n[id] = { ...n[id], x: pp.x + ox, y: pp.y + oy }; });
      return n;
    });
    scaleRef.current = nextScale;
    panRef.current = nextPan;
    setScale(nextScale);
    setPan(nextPan);
  }, [doc.id, doc.pluginPrefs, plugins, mutate]);

  const previousLayoutId = useRef(plugins.activeLayoutId);
  useEffect(() => {
    if (previousLayoutId.current === plugins.activeLayoutId) return;
    previousLayoutId.current = plugins.activeLayoutId;
    applyLayout();
  }, [plugins.activeLayoutId, applyLayout]);

  // edgePorts and smartBezier are imported from ../canvas/edgeGeometry

  // ── Render ────────────────────────────────────────────────────────────────
  const { colors } = plugins;
  const bg = colors.canvasBackground;
  const searchResults = useMemo(
    () => findSearchMatches(nodes, freeEdges, searchQ, searchFilters),
    [nodes, freeEdges, searchQ, searchFilters],
  );
  const matchedNodeIds = useMemo(
    () => new Set(searchResults.filter(result => result.type === 'node').map(result => result.id)),
    [searchResults],
  );
  const matchedConnectionIds = useMemo(
    () => new Set(searchResults.filter(result => result.type === 'connection').map(result => result.id)),
    [searchResults],
  );
  const orderedSearchMatches = searchResults;

  useEffect(() => {
    activeSearchIndexRef.current = -1;
    setActiveSearchIndex(-1);
  }, [searchQ, searchFilters]);

  const navigateSearchMatch = useCallback((direction: 1 | -1) => {
    if (orderedSearchMatches.length === 0) return;

    const currentIndex = activeSearchIndexRef.current;
    const nextIndex = currentIndex < 0
      ? direction === 1 ? 0 : orderedSearchMatches.length - 1
      : (currentIndex + direction + orderedSearchMatches.length) % orderedSearchMatches.length;
    const result = orderedSearchMatches[nextIndex];
    const edge = result.type === 'connection'
      ? freeEdges.find(candidate => candidate.id === result.id)
      : undefined;
    const nodeId = result.type === 'node' ? result.id : edge?.from;
    const target = nodeId ? nodesRef.current[nodeId] : undefined;
    const otherEndpoint = edge ? nodesRef.current[edge.to] : undefined;
    if (!target) return;

    const collapsed = [
      ...collapsedAncestors(nodesRef.current, target.id),
      ...(otherEndpoint ? collapsedAncestors(nodesRef.current, otherEndpoint.id) : []),
    ];
    if (collapsed.length > 0) {
      mutate(previous => {
        const next = { ...previous };
        for (const ancestorId of new Set(collapsed)) {
          next[ancestorId] = { ...next[ancestorId], collapsed: false };
        }
        return next;
      });
    }

    activeSearchIndexRef.current = nextIndex;
    setActiveSearchIndex(nextIndex);
    setSelectedId(target.id);
    setSelectedIds(new Set());

    const bounds = svgRef.current?.getBoundingClientRect();
    if (bounds) {
      const centerX = edge && otherEndpoint ? (target.x + otherEndpoint.x) / 2 : target.x;
      const centerY = edge && otherEndpoint ? (target.y + otherEndpoint.y) / 2 : target.y;
      const nextPan = {
        x: bounds.width / 2 - centerX * scaleRef.current,
        y: bounds.height / 2 - centerY * scaleRef.current,
      };
      panRef.current = nextPan;
      setPan(nextPan);
    }
  }, [orderedSearchMatches, freeEdges, mutate]);

  const getNodeAttrs = useCallback((n: MindNode, isSel: boolean) => {
    const depth  = nodeDepth(nodes, n.id);
    const accent = n.color ?? colors.palette[depth % colors.palette.length];
    const geometry = getNodeGeometry(n, depth);
    const baseShapeAttrs = plugins.getNodeShape(n, depth, isSel, accent);
    const shapeAttrs = applyNodeShapeOverrides(n, baseShapeAttrs);
    const baseTextAttrs = plugins.getNodeText(n, depth);
    const textAttrs = ensureReadableNodeText(baseTextAttrs, shapeAttrs.fill, colors.canvasBackground);
    return {
      depth, color: accent, ...geometry, baseShapeAttrs,
      shapeAttrs,
      textAttrs,
    };
  }, [nodes, colors, plugins]);

  const inspectorNode = selectedId ? nodes[selectedId] ?? null : null;
  const formatSelectedNode = inspectorNode
    ?? (selectedIds.size > 0 ? nodes[Array.from(selectedIds)[0]] ?? null : null);
  const toolbarFormatNode = formatSelectedNode && editingId === formatSelectedNode.id && editingTextDraft !== null
    ? { ...formatSelectedNode, text: editingTextDraft, textFormats: editingTextFormats }
    : formatSelectedNode;
  const selectedTextRange = toolbarFormatNode && textSelection?.nodeId === toolbarFormatNode.id
    ? { start: textSelection.start, end: textSelection.end }
    : null;
  const selectedTextFormat = selectedTextRange && toolbarFormatNode
    ? textFormatAt(toolbarFormatNode.textFormats, selectedTextRange.start)
    : {};
  const selectedTextDefaults = toolbarFormatNode
    ? plugins.getNodeText(toolbarFormatNode, nodeDepth(nodes, toolbarFormatNode.id))
    : {
        fontSize: 14,
        fontWeight: 400,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fill: darkMode ? '#dde0f8' : '#1a1a2e',
      };
  const inspectorBaseShape = inspectorNode
    ? getNodeAttrs(inspectorNode, true).baseShapeAttrs
    : null;
  const inspectorShapeDefaults = {
    radius: inspectorBaseShape?.rx ?? 10,
    width: inspectorBaseShape?.strokeWidth ?? 1.5,
    style: !inspectorBaseShape?.strokeDasharray || inspectorBaseShape.strokeDasharray === 'none-leaf'
      ? 'solid' as const
      : inspectorBaseShape.strokeDasharray === '2,2' ? 'dotted' as const : 'dashed' as const,
  };

  const renderConns = () =>
    Object.values(nodes)
      .filter(n => n.parentId && nodes[n.parentId] && visible(nodes, n.id))
      .map(n => {
        const p      = nodes[n.parentId!];
        const depth  = nodeDepth(nodes, n.id);
        const pDepth = nodeDepth(nodes, p.id);
        const accent = n.color ?? colors.palette[depth % colors.palette.length];
        const edge   = plugins.getEdge(depth, accent);

        const parentGeometry = getNodeGeometry(p, pDepth);
        const childGeometry = getNodeGeometry(n, depth);

        const { x1, y1, x2, y2 } = edgePorts(
          p.x, p.y, n.x, n.y,
          parentGeometry.width, parentGeometry.height,
          childGeometry.width, childGeometry.height,
        );
        const d = edge.pathFn ? edge.pathFn(x1, y1, x2, y2) : smartBezier(x1, y1, x2, y2);
        return (
          <path key={`c-${n.id}`} d={d} fill="none"
            stroke={edge.stroke} strokeWidth={edge.strokeWidth}
            strokeOpacity={edge.strokeOpacity * (learningFocusMode && !learningFocusNodeIds.has(n.id) ? 0.16 : 1)}
            strokeDasharray={edge.strokeDasharray}
          />
        );
      });

  const renderFreeEdges = () =>
    freeEdges.map((fe: FreeEdge) => {
      const fromNode = nodes[fe.from], toNode = nodes[fe.to];
      if (!fromNode || !toNode) return null;
      const accent = fe.color ?? colors.palette[2];
      const d = smartBezier(fromNode.x, fromNode.y, toNode.x, toNode.y);
      const dashArr = fe.style === 'dashed' ? '6,4' : fe.style === 'dotted' ? '2,4' : undefined;
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2 - 10;
      const isSearchMatch = matchedConnectionIds.has(fe.id);
      const isInLearningFocus = learningFocusNodeIds.has(fe.from) || learningFocusNodeIds.has(fe.to);
      return (
        <g key={fe.id} opacity={learningFocusMode && !isInLearningFocus ? 0.16 : 1}>
          <path d={d} fill="none" stroke={isSearchMatch ? '#f5a623' : accent}
            strokeWidth={(fe.width ?? 1.5) + (isSearchMatch ? 2 : 0)}
            strokeDasharray={dashArr} strokeOpacity={isSearchMatch ? 1 : 0.7}
            markerEnd={`url(#arrow-${fe.id})`}
          />
          {/* Arrow marker per edge */}
          <defs>
            <marker id={`arrow-${fe.id}`} viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke={accent} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>
          {/* Label */}
          {fe.label && (
            <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central"
              fontSize={11} fill={isSearchMatch ? '#f5a623' : accent}
              fontWeight={isSearchMatch ? 700 : 400}
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {fe.label}
            </text>
          )}
          {/* Delete handle */}
          <circle cx={midX} cy={midY} r={7} fill={darkMode ? '#1e2040' : '#fff'}
            stroke={accent} strokeWidth={1} strokeOpacity={0.5}
            style={{ cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('minder:free-edges', {
                detail: { docId: doc.id, freeEdges: freeEdges.filter(x => x.id !== fe.id) },
              }));
            }}
          />
          <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central"
            fontSize={9} fill={accent} style={{ pointerEvents: 'none', userSelect: 'none' }}>✕</text>
        </g>
      );
    });
  const renderNodesSVG = () =>
    Object.values(nodes)
      .filter(n => visible(nodes, n.id))
      .map(n => {
        const isSel      = n.id === selectedId || selectedIds.has(n.id);
        const isMultiSel = selectedIds.size > 1 && selectedIds.has(n.id);
        const isLinkSrc  = n.id === linkFrom;
        const isEdit     = n.id === editingId;
        const isHit  = matchedNodeIds.has(n.id);
        const {
          color, shapeAttrs, textAttrs, width: nodeW, height: nodeH,
          contentX, contentY, contentWidth, contentHeight, preview,
        } = getNodeAttrs(n, isSel);
        const priCfg = n.priority ? PRIORITY_CONFIG[n.priority] : null;
        const Icon   = n.icon && n.icon !== 'none' ? NODE_ICON_COMPONENTS[n.icon] : null;
        const hasCh  = n.children.length > 0;
        const nodeOpacity = learningFocusMode && !learningFocusNodeIds.has(n.id) ? 0.2 : 1;
        const imagePreview = n.attachments?.find(attachment =>
          attachment.type === 'image' &&
          (resolveImageSource(attachment.thumbnail) ?? resolveImageSource(attachment.value))
        );
        const externalAttachment = n.attachments?.find(attachment =>
          (attachment.type === 'link' || attachment.type === 'video') &&
          normalizeExternalUrl(attachment.value));
        const imageSource = imagePreview
          ? resolveImageSource(imagePreview.thumbnail) ?? resolveImageSource(imagePreview.value)
          : null;
        const externalHref = externalAttachment ? normalizeExternalUrl(externalAttachment.value) : null;
        const hasInlineMedia = Boolean(imageSource || externalHref);
        const mediaReservedRight = externalHref
          ? imageSource ? 68 : 38
          : hasCh ? 22 : 4;
        const toggleTask = () => mutate(previous => {
          const current = previous[n.id];
          if (!current?.taskStatus) return previous;
          return {
            ...previous,
            [n.id]: { ...current, taskStatus: toggleTaskStatus(current.taskStatus) },
          };
        });

        return (
          <g key={n.id}
            data-mind-node-id={n.id}
            transform={`translate(${n.x - nodeW / 2},${n.y - nodeH / 2})`}
            opacity={nodeOpacity}
            onPointerDown={e => onNodeDown(e, n)}
            onDoubleClick={e => {
              if (linkMode) return;
              e.stopPropagation();
              setSelectedId(n.id);
              setSelectedIds(new Set());
              setTextSelection({ nodeId: n.id, start: 0, end: n.text.length });
              setEditingId(n.id);
              setTextFormattingAnchor(e.currentTarget);
            }}
            onContextMenu={e => onNodeCtx(e, n.id)}
            onMouseEnter={() => setHoveredId(n.id)}
            onMouseLeave={() => setHoveredId(id => id === n.id ? null : id)}
            style={{ cursor: linkMode ? 'crosshair' : (dragging && dragRef.current?.nodeId === n.id) ? 'grabbing' : 'pointer' }}
          >
            {linkMode && <title>{isLinkSrc ? 'Source — cliquez sur la destination' : `Relier vers « ${n.text} »`}</title>}
            {/* Shadow — skip for root node */}
            {shapeAttrs.rx > 0 && shapeAttrs.rx < 18 && shapeAttrs.strokeDasharray !== 'none-leaf' && (
              shapeAttrs.shape
                ? <path d={customNodeShapePath(shapeAttrs.shape, nodeW, nodeH)} transform="translate(2 3)" fill="rgba(0,0,0,0.06)" />
                : <rect x={2} y={3} width={nodeW} height={nodeH} rx={shapeAttrs.rx} fill="rgba(0,0,0,0.06)" />
            )}
            {/* Link-source highlight ring */}
            {isLinkSrc && (
              shapeAttrs.shape
                ? <path d={customNodeShapePath(shapeAttrs.shape, nodeW + 8, nodeH + 8)} transform="translate(-4 -4)"
                    fill="none" stroke="#e05c7b" strokeWidth={2.5} strokeDasharray="5,3" opacity={0.85} />
                : <rect x={-4} y={-4} width={nodeW + 8} height={nodeH + 8}
                    rx={shapeAttrs.rx + 4} fill="none"
                    stroke="#e05c7b" strokeWidth={2.5} strokeDasharray="5,3" opacity={0.85}
                  />
            )}
            {/* Main body — hidden for minimal-line leaves */}
            {shapeAttrs.strokeDasharray !== 'none-leaf' && (
              shapeAttrs.shape
                ? <path d={customNodeShapePath(shapeAttrs.shape, nodeW, nodeH)}
                    fill={isHit ? '#fff9c4' : shapeAttrs.fill}
                    stroke={isMultiSel ? '#f5a623' : shapeAttrs.stroke}
                    strokeWidth={isMultiSel ? 2.5 : shapeAttrs.strokeWidth}
                    strokeDasharray={shapeAttrs.strokeDasharray}
                  />
                : <rect width={nodeW} height={nodeH}
                    rx={shapeAttrs.rx} ry={shapeAttrs.ry}
                    fill={isHit ? '#fff9c4' : shapeAttrs.fill}
                    stroke={isMultiSel ? '#f5a623' : shapeAttrs.stroke}
                    strokeWidth={isMultiSel ? 2.5 : shapeAttrs.strokeWidth}
                    strokeDasharray={shapeAttrs.strokeDasharray}
                  />
            )}
            {preview && imageSource && imagePreview && !isEdit && (
              <g
                transform={`translate(${preview.x},${preview.y})`}
                role="button"
                tabIndex={0}
                aria-label={`Agrandir l’image ${imagePreview.name}`}
                style={{ cursor: 'zoom-in' }}
                onPointerDown={event => event.stopPropagation()}
                onClick={event => {
                  event.stopPropagation();
                  setPreviewAttachment({ attachment: imagePreview, source: imageSource });
                }}
                onDoubleClick={event => event.stopPropagation()}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    setPreviewAttachment({ attachment: imagePreview, source: imageSource });
                  }
                }}
              >
                <image href={imageSource} width={preview.size} height={preview.size} preserveAspectRatio="xMidYMid slice" />
                <rect width={preview.size} height={preview.size}
                  rx={Math.min(6, preview.size / 6)} fill="none" stroke={color} strokeOpacity={0.6}
                  pointerEvents="none" />
                <title>{`Cliquer pour agrandir : ${imagePreview.name}`}</title>
              </g>
            )}
            <g transform={`translate(${contentX},${contentY})`}>
            {/* Leaf underline for minimal-line style */}
            {shapeAttrs.strokeDasharray === 'none-leaf' && (
              <line
                x1={4} y1={contentHeight - 1} x2={contentWidth - 4} y2={contentHeight - 1}
                stroke={isSel ? color : `${color}60`}
                strokeWidth={n.borderWidth ?? (isSel ? 1.5 : 1)}
                strokeDasharray={n.borderStyle === 'dashed' ? '6,4' : n.borderStyle === 'dotted' ? '2,2' : undefined}
              />
            )}
            {priCfg && priCfg.color !== 'transparent' && <circle cx={10} cy={8} r={4} fill={priCfg.color} />}
            {n.taskStatus && !isEdit && (
              <g
                transform={`translate(8,${contentHeight - 17})`}
                role="checkbox"
                aria-checked={n.taskStatus === 'done'}
                aria-label={`${n.taskStatus === 'done' ? 'Rouvrir' : 'Terminer'} la tâche « ${n.text} »`}
                tabIndex={0}
                onPointerDown={event => {
                  event.stopPropagation();
                }}
                onClick={event => {
                  event.stopPropagation();
                  toggleTask();
                }}
                onKeyDown={event => {
                  event.stopPropagation();
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    toggleTask();
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <rect width={10} height={10} rx={2} fill={n.taskStatus === 'done' ? color : 'none'} stroke={color} strokeWidth={1.5} />
                {n.taskStatus === 'done' && (
                  <path d="M2 5l2 2 4-5" fill="none" stroke="#fff" strokeWidth={1.5}
                    strokeLinecap="round" strokeLinejoin="round" />
                )}
              </g>
            )}
            {Icon && !isEdit && (
              <Icon x={13} y={contentHeight / 2 - 7} width={14} height={14}
                sx={{ color: n.color ?? color, pointerEvents: 'none' }} aria-hidden="true" />
            )}
            {n.number && !isEdit && (
              <text x={Icon ? 34 : 12} y={contentHeight / 2} dominantBaseline="central"
                fontSize={9.5} fill={color} fontWeight={700}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>{n.number}</text>
            )}
            {n.notes?.trim() && !isEdit && <circle cx={contentWidth - 7} cy={7} r={3.5} fill={color} opacity={0.7} />}
            {externalHref && !isEdit && (
              <a
                href={externalHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ouvrir ${externalAttachment?.name}`}
                onPointerDown={event => event.stopPropagation()}
                onClick={event => event.stopPropagation()}
                onDoubleClick={event => event.stopPropagation()}
                style={{ cursor: 'pointer' }}
              >
                <g transform={`translate(${contentWidth - (imageSource ? 64 : 34)},${Math.round((contentHeight - 18) / 2)})`}>
                  <rect width={18} height={18} rx={5} fill={shapeAttrs.fill} fillOpacity={0.9} stroke={color} strokeOpacity={0.55} />
                  <path d="M7.5 10.5 10.5 7.5 M6.2 7.4l1-1a2.1 2.1 0 0 1 3 3l-1 1 M11.8 10.6l-1 1a2.1 2.1 0 0 1-3-3l1-1"
                    fill="none" stroke={textAttrs.fill} strokeWidth="1.15" strokeLinecap="round" />
                  <title>{`Ouvrir ${externalAttachment?.name}`}</title>
                </g>
              </a>
            )}
            {(n.attachments?.length ?? 0) > 0 && !hasInlineMedia && !isEdit && (
              <text x={contentWidth - 14} y={contentHeight - 7} fontSize={9} fill={color}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>📎{n.attachments!.length}</text>
            )}
            {!isEdit && (() => {
              const txt  = n.text;
              const textLeft = Icon ? 28 : 16;
              const textRight = contentWidth - mediaReservedRight;
              const maxW = textRight - textLeft;
              const maxFontSize = Math.max(
                textAttrs.fontSize,
                ...(n.textFormats ?? []).map(format => format.fontSize ?? textAttrs.fontSize),
              );
              const chW = Math.max(7, maxFontSize * 0.62);
              const bullet = n.textBullet === 'disc' ? '• '
                : n.textBullet === 'circle' ? '◦ '
                  : n.textBullet === 'square' ? '▪ ' : '';
              const maxC = Math.max(8, Math.floor(maxW / chW));
              const lines = wrapNodeLabelRanges(txt, bullet ? Math.max(6, maxC - 2) : maxC)
                .map(line => ({
                  ...line,
                  segments: textFormatSegments(txt, line.start, line.end, n.textFormats),
                }));
              const textAlign = n.textAlign ?? 'center';
              const textAnchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';
              const tx = textAlign === 'left' ? textLeft + 3
                : textAlign === 'right' ? textRight - 3
                  : textLeft + maxW / 2;
              const lineH = maxFontSize * (n.textLineHeight ?? 1.25);
              const estimatedRunWidth = (segment: typeof lines[number]['segments'][number]) => {
                const fontSize = segment.style.fontSize ?? textAttrs.fontSize;
                return segment.text.length * fontSize * 0.56;
              };

              return (
                <g style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {lines.map((line, lineIndex) => {
                    const prefixSegments = lineIndex === 0 && bullet
                      ? [{ text: bullet, start: line.start, end: line.start, style: {} as typeof line.segments[number]['style'] }, ...line.segments]
                      : line.segments;
                    const totalWidth = prefixSegments.reduce((width, segment) => width + estimatedRunWidth(segment), 0);
                    let cursor = textAlign === 'left' ? tx : textAlign === 'right' ? tx - totalWidth : tx - totalWidth / 2;
                    const baseline = contentHeight / 2 + (lineIndex - (lines.length - 1) / 2) * lineH;
                    return (
                      <g key={`line-group-${lineIndex}`}>
                        {prefixSegments.map((segment, segmentIndex) => {
                          const format = segment.style;
                          const runSize = format.fontSize ?? textAttrs.fontSize;
                          const runWidth = estimatedRunWidth(segment);
                          const runX = cursor;
                          cursor += runWidth;
                          const readable = ensureReadableNodeText({
                            ...textAttrs,
                            fontSize: runSize,
                            fontFamily: format.fontFamily ?? textAttrs.fontFamily,
                            fontWeight: format.textBold === undefined
                              ? textAttrs.fontWeight
                              : format.textBold ? 700 : 400,
                            fontStyle: format.textItalic ? 'italic' : undefined,
                            textDecoration: [
                              format.textUnderline ? 'underline' : '',
                              format.textStrikethrough ? 'line-through' : '',
                            ].filter(Boolean).join(' ') || undefined,
                            fill: format.textColor ?? textAttrs.fill,
                          }, format.textBackgroundColor ?? shapeAttrs.fill, colors.canvasBackground);
                          return (
                            <g key={`run-${lineIndex}-${segmentIndex}`}>
                              {format.textBackgroundColor && (
                                <rect x={runX - 1} y={baseline - runSize * .58}
                                  width={runWidth + 2} height={runSize * 1.16} rx={2}
                                  fill={format.textBackgroundColor} />
                              )}
                              <text x={runX} y={baseline} textAnchor="start" dominantBaseline="central"
                                fill={readable.fill} fontSize={readable.fontSize}
                                fontFamily={readable.fontFamily} fontWeight={readable.fontWeight}
                                fontStyle={readable.fontStyle} textDecoration={readable.textDecoration}>
                                {segment.text}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              );
            })()}
            {isEdit && (
              <InlineEditor initialText={editingTextDraft ?? n.text}
                darkMode={darkMode}
                nodeW={contentWidth} nodeH={contentHeight}
                textStyle={selectedTextFormat}
                onDraftChange={text => {
                  setEditingTextDraft(text);
                  setEditingTextFormats(formats => clampTextFormats(formats, text.length));
                  setTextSelection(selection => selection?.nodeId === n.id
                    ? {
                        nodeId: n.id,
                        start: Math.min(selection.start, text.length),
                        end: Math.min(selection.end, text.length),
                      }
                    : selection);
                }}
                onSelectionChange={range => setTextSelection({ nodeId: n.id, ...range })}
                onCommit={t => {
                  mutate(previous => {
                    const current = previous[n.id];
                    return current
                      ? {
                          ...previous,
                          [n.id]: {
                            ...current,
                            text: t,
                            textFormats: clampTextFormats(editingTextFormats, t.length),
                          },
                        }
                      : previous;
                  });
                  setEditingId(null);
                  setTextFormattingAnchor(null);
                }}
                onCancel={() => {
                  setEditingId(null);
                  setTextFormattingAnchor(null);
                }}
              />
            )}
            {hasCh && (
              <g transform={`translate(${contentWidth - 11},${contentHeight / 2 - 9})`}
                role="button"
                tabIndex={0}
                aria-expanded={!n.collapsed}
                aria-label={n.collapsed ? `Déplier les ${n.children.length} enfants de ${n.text}` : `Replier les enfants de ${n.text}`}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation();
                  mutate(p => {
                    const current = p[n.id];
                    return current
                      ? { ...p, [n.id]: { ...current, collapsed: !current.collapsed } }
                      : p;
                  });
                }}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    mutate(p => {
                      const current = p[n.id];
                      return current
                        ? { ...p, [n.id]: { ...current, collapsed: !current.collapsed } }
                        : p;
                    });
                  }
                }}
                style={{ cursor: 'pointer' }}>
                <circle cx={9} cy={9} r={9} fill={color} opacity={0.88} />
                <text x={9} y={9} textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontSize={n.collapsed ? 9 : 13}>
                  {n.collapsed ? `+${n.children.length}` : '−'}
                </text>
              </g>
            )}
            </g>
          </g>
        );
      });

  // ── Fit-to-screen ──────────────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    const nodeList = Object.values(nodesRef.current);
    if (!nodeList.length || !svgRef.current) return;
    const geometries = nodeList.map(node => getNodeGeometry(node, nodeDepth(nodesRef.current, node.id)));
    const minX = Math.min(...nodeList.map((node, index) => node.x - geometries[index].width / 2)) - 40;
    const maxX = Math.max(...nodeList.map((node, index) => node.x + geometries[index].width / 2)) + 40;
    const minY = Math.min(...nodeList.map((node, index) => node.y - geometries[index].height / 2)) - 40;
    const maxY = Math.max(...nodeList.map((node, index) => node.y + geometries[index].height / 2)) + 40;
    const w = maxX - minX, h = maxY - minY;
    const sw = svgRef.current.clientWidth, sh = svgRef.current.clientHeight;
    const s = Math.min(sw / w, sh / h, 2);
    const nx = sw / 2 - (minX + w / 2) * s;
    const ny = sh / 2 - (minY + h / 2) * s;
    scaleRef.current = s; panRef.current = { x: nx, y: ny };
    setScale(s); setPan({ x: nx, y: ny });
  }, []);

  const centerOnLearningStep = useCallback((stepId: string) => {
    const currentNodes = nodesRef.current;
    const step = currentNodes[stepId];
    if (!step || !svgRef.current) return;
    const stack = [stepId];
    const branchNodes: MindNode[] = [];
    const visited = new Set<string>();
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = currentNodes[id];
      if (!node) continue;
      branchNodes.push(node);
      stack.push(...node.children);
    }
    const geometries = branchNodes.map(node => getNodeGeometry(node, nodeDepth(currentNodes, node.id)));
    const minX = Math.min(...branchNodes.map((node, index) => node.x - geometries[index].width / 2)) - 48;
    const maxX = Math.max(...branchNodes.map((node, index) => node.x + geometries[index].width / 2)) + 48;
    const minY = Math.min(...branchNodes.map((node, index) => node.y - geometries[index].height / 2)) - 48;
    const maxY = Math.max(...branchNodes.map((node, index) => node.y + geometries[index].height / 2)) + 48;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const viewportWidth = svgRef.current.clientWidth;
    const viewportHeight = svgRef.current.clientHeight;
    const nextScale = Math.min((viewportWidth - 80) / width, (viewportHeight - 100) / height, 1.8);
    if (!Number.isFinite(nextScale) || nextScale <= 0) return;
    const nextPan = {
      x: viewportWidth / 2 - (minX + width / 2) * nextScale,
      y: viewportHeight / 2 - (minY + height / 2) * nextScale,
    };
    scaleRef.current = nextScale;
    panRef.current = nextPan;
    setScale(nextScale);
    setPan(nextPan);
  }, []);

  const selectLearningStep = useCallback((stepId: string) => {
    onLearningStepChange(doc.id, stepId);
    setLearningFocusMode(true);
    if (stepId === activeLearningStepId) centerOnLearningStep(stepId);
  }, [activeLearningStepId, centerOnLearningStep, doc.id, onLearningStepChange]);

  const toggleLearningFocus = useCallback(() => {
    if (learningFocusMode) fitToScreen();
    else if (activeLearningStepId) centerOnLearningStep(activeLearningStepId);
    setLearningFocusMode(!learningFocusMode);
  }, [activeLearningStepId, centerOnLearningStep, fitToScreen, learningFocusMode]);

  const addLearningStep = useCallback(() => {
    const root = Object.values(nodesRef.current).find(node => node.parentId === null);
    if (!root) return;
    const id = genId();
    mutate(previous => {
      const parent = previous[root.id];
      if (!parent) return previous;
      const position = spawnChildPos(previous, root.id);
      return {
        ...previous,
        [id]: {
          id, text: 'Nouvelle étape', x: position.x, y: position.y,
          parentId: root.id, children: [], collapsed: false,
        },
        [root.id]: { ...parent, children: [...parent.children, id] },
      };
    });
    onLearningStepsChange(doc.id, [...learningSteps.map(step => step.id), id]);
    setLearningFocusMode(true);
    setLearningStepsDialogOpen(false);
    setSelectedId(id);
    setTimeout(() => setEditingId(id), 30);
  }, [doc.id, learningSteps, mutate, onLearningStepsChange]);

  const changeLearningSteps = useCallback((stepIds: string[]) => {
    onLearningStepsChange(doc.id, stepIds);
    setLearningFocusMode(stepIds.length > 0);
  }, [doc.id, onLearningStepsChange]);

  useEffect(() => {
    if (!activeLearningStepId) return;
    const frame = requestAnimationFrame(() => centerOnLearningStep(activeLearningStepId));
    return () => cancelAnimationFrame(frame);
  }, [activeLearningStepId, centerOnLearningStep]);

  useEffect(() => {
    if (!isMobile || activeLearningStepId) return;
    const frame = requestAnimationFrame(fitToScreen);
    return () => cancelAnimationFrame(frame);
  }, [activeLearningStepId, fitToScreen, isMobile]);

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = useCallback(async (format: string) => {
    const el = svgRef.current;
    switch (format) {
      case 'png':             if (el) await exportPNG({ svgEl: el, title: doc.title, darkMode, quality: 'standard' }); break;
      case 'png-hd':          if (el) await exportPNG({ svgEl: el, title: doc.title, darkMode, quality: 'hd' }); break;
      case 'png-transparent': if (el) await exportPNG({ svgEl: el, title: doc.title, darkMode, quality: 'hd', transparent: true }); break;
      case 'svg':             if (el) await exportSVG({ svgEl: el, title: doc.title, darkMode }); break;
      case 'pdf':             if (el) await exportPDF({ svgEl: el, title: doc.title, darkMode, quality: 'standard' }); break;
      case 'pdf-hd':          if (el) await exportPDF({ svgEl: el, title: doc.title, darkMode, quality: 'hd' }); break;
      case 'jpeg':            if (el) await exportRasterImage({ svgEl: el, title: doc.title, darkMode, format: 'jpeg' }); break;
      case 'webp':            if (el) await exportRasterImage({ svgEl: el, title: doc.title, darkMode, format: 'webp' }); break;
      case 'bmp':             if (el) await exportRasterImage({ svgEl: el, title: doc.title, darkMode, format: 'bmp' }); break;
      case 'print':           if (el) await exportPrint({ svgEl: el, title: doc.title, darkMode }); break;
      case 'minder':          exportMinderJSON(nodesRef.current, doc.title); break;
      case 'markdown':        exportMarkdownFile(nodesRef.current, doc.title); break;
      case 'plaintext':       downloadPlainText(nodesRef.current, doc.title); break;
      case 'opml':            downloadOPML(nodesRef.current, doc.title); break;
      case 'freemind':        downloadFreeMind(nodesRef.current, doc.title, doc.freeEdges ?? []); break;
      case 'mermaid':         downloadMermaid(nodesRef.current, doc.title); break;
      case 'xmind':           downloadXMind(nodesRef.current, doc.title, doc.freeEdges ?? []); break;
      case 'org':             downloadOrgMode(nodesRef.current, doc.title); break;
      case 'csv':             downloadCSV(nodesRef.current, doc.title); break;
      case 'plantuml':        downloadPlantUML(nodesRef.current, doc.title); break;
      case 'outliner':        downloadOutliner(nodesRef.current, doc.title); break;
      case 'graphml':         downloadYEd(nodesRef.current, doc.title, doc.freeEdges ?? []); break;
    }
  }, [doc, darkMode]);

  const selCount = selectedIds.size;

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <TopBar
        title={doc.title}
        darkMode={darkMode}
        canUndo={canUndo}
        canRedo={canRedo}
        savedAt={savedAt}
        onUndo={undo}
        onRedo={redo}
        onToggleDark={onToggleDark}
        onOpenPlugins={onOpenPluginPicker}
        onOpenExport={() => setExportModalOpen(true)}
        onRenameDoc={title => onRenameDoc(doc.id, title)}
      />

      {/* ── Canvas area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>

        {/* ── Floating toolbar ── */}
        <CanvasToolbar
          doc={doc}
          nodes={nodes}
          darkMode={darkMode}
          svgRef={svgRef}
          searchInputRef={searchInputRef}
          searchQ={searchQ}
          setSearchQ={setSearchQ}
          searchFilters={searchFilters}
          setSearchFilters={setSearchFilters}
          searchMatchCount={orderedSearchMatches.length}
          activeSearchIndex={activeSearchIndex}
          onNavigateSearchMatch={navigateSearchMatch}
          applyLayout={applyLayout}
          onPluginPrefsChange={onPluginPrefsChange}
          selectedId={selectedId}
          selectedNode={toolbarFormatNode}
          selectedTextRange={selectedTextRange}
          selectedTextFormat={selectedTextFormat}
          selectedTextDefaults={selectedTextDefaults}
          selCount={selCount}
          textFormattingAnchor={textFormattingAnchor}
          onCloseTextFormatting={() => setTextFormattingAnchor(null)}
          onApplyTextStyle={changes => {
            if (!formatSelectedNode || !selectedTextRange) return;
            if (editingId === formatSelectedNode.id) {
              setEditingTextFormats(formats => applyTextFormat(
                formats,
                selectedTextRange.start,
                selectedTextRange.end,
                changes,
                editingTextDraft?.length ?? formatSelectedNode.text.length,
              ));
              return;
            }
            mutate(previous => {
              const next = { ...previous };
              const current = next[formatSelectedNode.id];
              if (!current) return previous;
              next[current.id] = {
                ...current,
                textFormats: applyTextFormat(
                  current.textFormats,
                  selectedTextRange.start,
                  selectedTextRange.end,
                  changes,
                  current.text.length,
                ),
              };
              return next;
            });
          }}
          onResetTextFormatting={() => {
            if (!formatSelectedNode || !selectedTextRange) return;
            if (editingId === formatSelectedNode.id) {
              setEditingTextFormats(formats => applyTextFormat(
                formats,
                selectedTextRange.start,
                selectedTextRange.end,
                {
                  fontFamily: undefined,
                  fontSize: undefined,
                  textBold: undefined,
                  textItalic: undefined,
                  textUnderline: undefined,
                  textStrikethrough: undefined,
                  textColor: undefined,
                  textBackgroundColor: undefined,
                },
                editingTextDraft?.length ?? formatSelectedNode.text.length,
              ));
              mutate(previous => {
                const current = previous[formatSelectedNode.id];
                return current
                  ? {
                      ...previous,
                      [current.id]: {
                        ...current,
                        textAlign: 'center',
                        textLineHeight: 1.25,
                        textBullet: undefined,
                      },
                    }
                  : previous;
              });
              return;
            }
            mutate(previous => {
              const current = previous[formatSelectedNode.id];
              if (!current) return previous;
              return {
                ...previous,
                [current.id]: {
                  ...current,
                  textFormats: applyTextFormat(
                    current.textFormats,
                    selectedTextRange.start,
                    selectedTextRange.end,
                    {
                      fontFamily: undefined,
                      fontSize: undefined,
                      textBold: undefined,
                      textItalic: undefined,
                      textUnderline: undefined,
                      textStrikethrough: undefined,
                      textColor: undefined,
                      textBackgroundColor: undefined,
                    },
                    current.text.length,
                  ),
                  textAlign: 'center',
                  textLineHeight: 1.25,
                  textBullet: undefined,
                },
              };
            });
          }}
          onApplyParagraph={changes => {
            if (!formatSelectedNode) return;
            mutate(previous => {
              const current = previous[formatSelectedNode.id];
              return current
                ? { ...previous, [current.id]: { ...current, ...changes } }
                : previous;
            });
          }}
          inspectorOpen={inspectorOpen}
          setInspectorOpen={setInspectorOpen}
          insertOpen={insertOpen}
          setInsertOpen={setInsertOpen}
          minimapOpen={minimapOpen}
          setMinimapOpen={setMinimapOpen}
          setSlideshow={setSlideshow}
          linkMode={linkMode}
          setLinkMode={setLinkMode}
          setLinkFrom={setLinkFrom}
          onOpenPluginPicker={onOpenPluginPicker}
        />

        {/* ── Link mode banner ── */}
        {linkMode && (
          <div style={{
            position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
            background: linkFrom ? '#e05c7b' : '#f5a623',
            color: '#fff', padding: '6px 18px',
            borderRadius: 20, fontSize: 12.5, fontWeight: 600,
            zIndex: 410, pointerEvents: 'none',
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🔗</span>
            {linkFrom
              ? `Cliquez sur le nœud destination  ·  Esc pour annuler`
              : `Mode lien actif — cliquez sur le nœud source`}
          </div>
        )}

        {/* ── SVG canvas ── */}
        <svg
          ref={svgRef}
          style={{
            flex: 1, display: 'block', background: bg, userSelect: 'none',
            cursor: linkMode ? (linkFrom ? 'crosshair' : 'cell') : 'default',
            touchAction: 'none',
          }}
          onContextMenu={event => event.preventDefault()}
          onPointerDown={onSvgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <g
            className="vp-bg"
            style={{ pointerEvents: 'none' }}
            dangerouslySetInnerHTML={{ __html: plugins.renderBackground({
              width:       svgRef.current?.clientWidth  ?? 900,
              height:      svgRef.current?.clientHeight ?? 650,
              darkMode,
              accentColor: colors.palette[0],
              panX:        pan.x,
              panY:        pan.y,
            })}}
          />

          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
            {renderConns()}
            {renderFreeEdges()}
            {renderNodesSVG()}
          </g>

          {rubberBand && (
            <rect
              x={rubberBand.x} y={rubberBand.y}
              width={rubberBand.w} height={rubberBand.h}
              fill="rgba(79,142,247,0.08)"
              stroke="#4f8ef7" strokeWidth={1} strokeDasharray="4,3"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* ── Right panels ── */}
        {inspectorOpen && (
          <Inspector
            node={inspectorNode}
            nodes={nodes}
            darkMode={darkMode}
            accentPalette={colors.palette}
            canvasBackground={colors.canvasBackground}
            tab={inspectorTab}
            onTabChange={setInspectorTab}
            shapeDefaults={inspectorShapeDefaults}
            onUpdate={(id, changes) => {
              if (selectedIds.size > 1) {
                mutate(p => {
                  const n = { ...p };
                  selectedIds.forEach(sid => { if (n[sid]) n[sid] = { ...n[sid], ...changes }; });
                  return n;
                });
              } else {
                mutate(p => ({ ...p, [id]: { ...p[id], ...changes } }));
              }
            }}
            onDelete={id => {
              const n = nodes[id]; if (!n?.parentId) return;
              mutate(p => {
                const nx = { ...p };
                allDesc(nx, id).forEach(d => delete nx[d]);
                const par = nx[n.parentId!];
                if (par) nx[n.parentId!] = { ...par, children: par.children.filter(c => c !== id) };
                return nx;
              });
              setSelectedId(null); setSelectedIds(new Set());
            }}
            onAddChild={pid => {
              const par = nodes[pid]; if (!par) return;
              const nid = genId();
              mutate(p => ({
                ...p,
                [nid]: (() => { const sp = spawnChildPos(p, pid); return { id: nid, text: 'Nouveau', x: sp.x, y: sp.y, parentId: pid, children: [], collapsed: false }; })(),
                [pid]: { ...par, children: [...par.children, nid] },
              }));
              setSelectedId(nid); setTimeout(() => setEditingId(nid), 30);
            }}
            onClose={() => setInspectorOpen(false)}
          />
        )}

        {insertOpen && selectedId && (
          <InsertPanel
            node={nodes[selectedId] ?? null}
            darkMode={darkMode}
            onUpdate={(id, changes) => mutate(p => ({ ...p, [id]: { ...p[id], ...changes } }))}
            onClose={() => setInsertOpen(false)}
          />
        )}

        {/* ── Context menu ── */}
        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x} y={ctxMenu.y}
            actions={ctxActions(ctxMenu.nodeId)}
            onAction={handleCtxAction}
            onClose={() => setCtxMenu(null)}
            darkMode={darkMode}
          />
        )}

        {/* ── Slideshow ── */}
        {slideshow && (
          <Slideshow
            startNodeId={slideshow}
            nodes={nodes}
            darkMode={darkMode}
            palette={colors.palette}
            canvasBackground={colors.canvasBackground}
            nodeText={colors.nodeText}
            onClose={() => setSlideshow(null)}
          />
        )}

        {/* ── Minimap ── */}
        {minimapOpen && (
          <Minimap
          nodes={nodes}
            pan={pan} scale={scale}
            canvasW={svgRef.current?.clientWidth  ?? 900}
            canvasH={svgRef.current?.clientHeight ?? 650}
            darkMode={darkMode}
          selectedId={selectedId}
          colors={colors}
          getNodeShape={plugins.getNodeShape}
          getNodeText={plugins.getNodeText}
          getEdge={plugins.getEdge}
          onPanChange={np => { panRef.current = np; setPan(np); }}
        />
        )}

        {/* ── Zoom bar ── */}
        <ZoomBar
          scale={scale}
          darkMode={darkMode}
          onZoomIn={() => { const ns = Math.min(6, scaleRef.current * 1.2); scaleRef.current = ns; setScale(ns); }}
          onZoomOut={() => { const ns = Math.max(0.1, scaleRef.current * 0.83); scaleRef.current = ns; setScale(ns); }}
          onFitView={fitToScreen}
          onSetZoom={nextScale => {
            const bounds = svgRef.current?.getBoundingClientRect();
            const centerX = (bounds?.width ?? 0) / 2;
            const centerY = (bounds?.height ?? 0) / 2;
            const ratio = nextScale / scaleRef.current;
            const nextPan = {
              x: centerX - (centerX - panRef.current.x) * ratio,
              y: centerY - (centerY - panRef.current.y) * ratio,
            };
            scaleRef.current = nextScale;
            panRef.current = nextPan;
            setScale(nextScale);
            setPan(nextPan);
          }}
          onFullscreen={() => { if (document.fullscreenElement) document.exitFullscreen(); else containerRef.current?.requestFullscreen?.(); }}
        />

        <LearningStepsBar
          steps={learningSteps}
          activeStepId={activeLearningStepId}
          focusMode={learningFocusMode}
          darkMode={darkMode}
          mobile={isMobile}
          onSelectStep={selectLearningStep}
          onToggleFocus={toggleLearningFocus}
          onManageSteps={() => setLearningStepsDialogOpen(true)}
        />
        {learningStepsDialogOpen && (
          <LearningStepsDialog
            branches={Object.values(nodes).find(node => node.parentId === null)?.children
              .map(id => nodes[id])
              .filter((node): node is MindNode => Boolean(node))
              .map(node => ({
                id: node.id,
                title: node.text.replace(/^Étape \d+ · /, ''),
              })) ?? []}
            stepIds={learningSteps.map(step => step.id)}
            darkMode={darkMode}
            onStepIdsChange={changeLearningSteps}
            onAddStep={addLearningStep}
            onClose={() => setLearningStepsDialogOpen(false)}
          />
        )}

        {/* ── Export modal ── */}
        {exportModalOpen && (
          <ExportModal
            darkMode={darkMode}
            onExport={handleExport}
            onClose={() => setExportModalOpen(false)}
          />
        )}

        <Dialog
          open={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
          maxWidth="lg"
          fullWidth
          aria-labelledby="attachment-preview-title"
          PaperProps={{ sx: { borderRadius: 3, maxHeight: 'calc(100dvh - 32px)' } }}
        >
          <DialogTitle id="attachment-preview-title" sx={{ py: 1.25, pr: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="subtitle1" fontWeight={650} noWrap>
                {previewAttachment?.attachment.name ?? 'Aperçu de l’image'}
              </Typography>
              <IconButton
                size="small"
                aria-label="Fermer l’aperçu"
                onClick={() => setPreviewAttachment(null)}
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ display: 'grid', placeItems: 'center', p: { xs: 1, sm: 2 } }}>
            {previewAttachment && (
              <img
                src={previewAttachment.source}
                alt={previewAttachment.attachment.name}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: 'min(72vh, 760px)',
                  objectFit: 'contain',
                  borderRadius: 8,
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ── Help ── */}
        <HelpIcon darkMode={darkMode} />

        {/* ── Status bar ── */}
        <div style={{
          position: 'absolute', bottom: learningSteps.length ? (isMobile ? 118 : 72) : 58, left: '50%', transform: 'translateX(-50%)',
          background: darkMode ? 'rgba(22,20,42,0.92)' : 'rgba(255,254,251,0.94)',
          color: darkMode ? '#6070a0' : '#8a7e6a',
          padding: '3px 14px', borderRadius: 20, fontSize: 10.5,
          pointerEvents: 'none', backdropFilter: 'blur(6px)',
          whiteSpace: 'nowrap',
          border: `1px solid ${darkMode ? '#2e3060' : '#d4cbbf'}`,
        }}>
          {linkMode
            ? (linkFrom
                ? <>🔗 <strong style={{ color: '#e05c7b' }}>« {nodes[linkFrom]?.text ?? '?'} »</strong> → cliquez la destination · Esc annule</>
                : <>🔗 Mode lien actif — cliquez le nœud source</>)
            : <>
                {Object.keys(nodes).length} nœuds · {Math.round(scale * 100)}%
                {selCount > 1 ? ` · ${selCount} sél.` : selectedId && nodes[selectedId] ? ` · « ${nodes[selectedId].text} »` : ''}
                {freeEdges.length > 0 ? ` · ${freeEdges.length} lien${freeEdges.length > 1 ? 's' : ''} libre${freeEdges.length > 1 ? 's' : ''}` : ''}
                {searchQ ? ` · 🔍 ${orderedSearchMatches.length} résultat${orderedSearchMatches.length === 1 ? '' : 's'}` : ''}
                {clipBoard ? ' · 📋' : ''}
              </>
          }
        </div>
      </div>
    </div>
  );
}
