// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/types.ts
//
// MINDER PLUGIN SYSTEM — Shared contracts
//
// This file is the single source of truth for all plugin interfaces.
// Every plugin must conform to one of these interfaces.
// Do NOT add imports from the rest of the project here.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared primitives ────────────────────────────────────────────────────────

/** A flat node as stored in NodesMap */
export interface PluginNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  collapsed: boolean;
  color?: string;
  bgColor?: string;
  textFormats?: Array<{
    start: number;
    end: number;
    fontFamily?: string;
    fontSize?: number;
    textBold?: boolean;
    textItalic?: boolean;
    textUnderline?: boolean;
    textStrikethrough?: boolean;
    textColor?: string;
    textBackgroundColor?: string;
  }>;
  textAlign?: 'left' | 'center' | 'right';
  textLineHeight?: 1 | 1.25 | 1.5 | 2;
  textBullet?: 'disc' | 'circle' | 'square';
  borderRadius?: number;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  nodeShape?: 'rounded' | 'capsule' | 'rectangle' | 'parallelogram' | 'hexagon' | 'underline';
  attachmentPosition?: 'top' | 'bottom' | 'left' | 'right';
  attachmentSize?: number;
  attachments?: Array<{
    id: string;
    type: 'image' | 'link' | 'video' | 'file' | 'equation';
    name: string;
    value: string;
    thumbnail?: string;
  }>;
  notes?: string;
  icon?: string;
  priority?: string;
  number?: string;
  tags?: string[];
}

export type PluginNodesMap = Record<string, PluginNode>;

/** Read-only context passed to every plugin at call time */
export interface PluginContext {
  /** Current dark mode state */
  darkMode: boolean;
  /** Viewport width in px */
  viewportWidth: number;
  /** Viewport height in px */
  viewportHeight: number;
  /** The id of the root node (parentId === null) */
  rootId: string | null;
}

// ─── Base metadata (all plugins must carry this) ──────────────────────────────

export interface PluginMeta {
  /** Unique machine-readable identifier. kebab-case. e.g. "forest-dark" */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description (≤ 120 chars) */
  description: string;
  /** Plugin category — determines where it appears in the UI */
  type: 'theme' | 'background' | 'layout' | 'template' | 'style';
  /** Semantic version string e.g. "1.0.0" */
  version: string;
  /** Author name or "ai-generated" */
  author: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME PLUGIN
// Controls: background color, node colors, branch colors, text colors
// Does NOT touch node positions or geometry.
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  /** SVG / page background */
  canvasBackground: string;
  /** Default node fill */
  nodeFill: string;
  /** Default node border */
  nodeBorder: string;
  /** Node label text */
  nodeText: string;
  /** Border/accent when a node is selected */
  nodeSelected: string;
  /** Dot-grid or pattern color */
  dotGrid: string;
  /** Array of branch/accent colors, cycled by depth. Min 4 entries. */
  palette: string[];
  /** Status-bar / muted text */
  mutedText: string;
}

export interface ThemePlugin {
  meta: PluginMeta & { type: 'theme' };
  /** Whether this theme is intended for dark environments */
  isDark: boolean;
  /** Returns the full color set. Must be a pure function — no side effects. */
  getColors(): ThemeColors;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND PLUGIN
// Controls: what is rendered behind the node graph in the SVG.
// Receives the SVG <defs> element and the canvas dimensions.
// Returns an SVG string (content only, no <svg> wrapper).
// ─────────────────────────────────────────────────────────────────────────────

export interface BackgroundOptions {
  width: number;
  height: number;
  darkMode: boolean;
  /** Accent color pulled from the active theme */
  accentColor: string;
  /** Base color pulled from the active theme */
  canvasBackground: string;
  /** Pattern color pulled from the active theme */
  dotGridColor: string;
  /** Current pan offset — use to make patterns follow pan */
  panX: number;
  panY: number;
}

export type BackgroundRenderOptions = Omit<
  BackgroundOptions,
  'canvasBackground' | 'dotGridColor'
>;

export interface BackgroundPlugin {
  meta: PluginMeta & { type: 'background' };
  /**
   * Returns an SVG fragment string (elements only, no wrapper).
   * This fragment is injected BEFORE the node <g> in the SVG.
   * It MUST be self-contained (inline styles only, no external refs).
   * Example return: '<rect width="100%" .../><line .../>'
   */
  render(options: BackgroundOptions): string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT PLUGIN
// Controls: x/y position of every node.
// Receives the node tree, returns a position map.
// Must NOT mutate input nodes.
// ─────────────────────────────────────────────────────────────────────────────

export interface LayoutOptions {
  /** Bounding box of the target viewport */
  viewportWidth: number;
  viewportHeight: number;
  /** Suggested node bounding box */
  nodeWidth: number;
  nodeHeight: number;
  /** Extra spacing multiplier (default 1.0) */
  spacing: number;
  /** Horizontal spacing multiplier (defaults to `spacing`) */
  spacingH?: number;
}

export interface LayoutPlugin {
  meta: PluginMeta & { type: 'layout' };
  /**
   * Pure function. Takes the complete nodes map + options.
   * Returns a new map of { id → { x, y } } for ALL nodes.
   * Nodes absent from the result keep their current position.
   * MUST NOT mutate `nodes`.
   */
  apply(
    nodes: Readonly<PluginNodesMap>,
    rootId: string,
    options: LayoutOptions
  ): Map<string, { x: number; y: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE PLUGIN
// Produces a ready-to-use NodesMap from scratch.
// Used when creating a new document or inserting a subtree.
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateOptions {
  /** Where to anchor the root of this template in world coordinates */
  originX: number;
  originY: number;
  /** If provided, the template root becomes a child of this node */
  parentId: string | null;
}

export interface TemplatePlugin {
  meta: PluginMeta & { type: 'template' };
  /** Visual category shown in the UI picker */
  category: 'enterprise' | 'education' | 'personal' | 'creative' | 'other' | 'project';
  /** Short label for each top-level branch — displayed as preview chips */
  preview: string[];
  /**
   * Pure function. Returns a complete NodesMap.
   * IDs must be generated inside using a provided generator to avoid
   * collisions. Use the helper `makeId` exported from this file.
   * MUST NOT read from global state.
   */
  build(options: TemplateOptions): PluginNodesMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE PLUGIN
// Controls: how individual nodes are rendered (shape, stroke, text style…).
// Returns SVG attribute objects — no DOM mutations.
// ─────────────────────────────────────────────────────────────────────────────

/** SVG attributes for the node background rect/shape */
export interface NodeShapeAttrs {
  rx: number;
  ry: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  shape?: 'parallelogram' | 'hexagon';
}

/** SVG attributes for the node label <text> */
export interface NodeTextAttrs {
  fontSize: number;
  fontWeight: string | number;
  fontFamily: string;
  fill: string;
  fontStyle?: string;
  textDecoration?: string;
  letterSpacing?: string;
  textTransform?: string;
}

/** SVG attributes for the connection <path> */
export interface EdgeAttrs {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray?: string;
  /** SVG path "d" generator — receives start/end coords */
  pathFn?: (x1: number, y1: number, x2: number, y2: number) => string;
}

export interface StylePlugin {
  meta: PluginMeta & { type: 'style' };
  /**
   * Returns shape attrs for a given node.
   * `depth` = 0 for root. `isSelected` is true when the node is active.
   * `accentColor` = color from the active theme palette at this depth.
   * Must return a complete NodeShapeAttrs — no partial objects.
   */
  getNodeShape(node: Readonly<PluginNode>, depth: number, isSelected: boolean, accentColor: string): NodeShapeAttrs;
  /** Returns text attrs for a given node. Must return a complete NodeTextAttrs. */
  getNodeText(node: Readonly<PluginNode>, depth: number, darkMode: boolean): NodeTextAttrs;
  /** Returns edge attrs for connections. */
  getEdge(depth: number, accentColor: string): EdgeAttrs;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY — flat union for the plugin store
// ─────────────────────────────────────────────────────────────────────────────

export type AnyPlugin =
  | ThemePlugin
  | BackgroundPlugin
  | LayoutPlugin
  | TemplatePlugin
  | StylePlugin;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: id generator for use inside template plugins
// ─────────────────────────────────────────────────────────────────────────────

let _seq = 0;
export function makeId(prefix = 'p'): string {
  _seq = (_seq + 1) % 1_000_000;
  return `${prefix}_${Date.now()}_${_seq}`;
}
