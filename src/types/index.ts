// ─── Core node type ───────────────────────────────────────────────────────────

export type NodePriority = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'open' | 'done';
export type NodeBorderStyle = 'solid' | 'dashed' | 'dotted';
export type NodeShapeVariant = 'rounded' | 'capsule' | 'rectangle' | 'parallelogram' | 'hexagon' | 'underline';
export type NodeTextAlign = 'left' | 'center' | 'right';
export type NodeTextBullet = 'disc' | 'circle' | 'square';
export type NodeTextLineHeight = 1 | 1.25 | 1.5 | 2;
export interface NodeTextFormat {
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
}
export type NodeTextStyle = Omit<NodeTextFormat, 'start' | 'end'>;
export type AttachmentPosition = 'top' | 'bottom' | 'left' | 'right';
export const MAX_NODE_ATTACHMENT_SIZE = 220;
export type NodeIcon =
  | 'none' | 'star' | 'check' | 'warning' | 'info' | 'idea' | 'question'
  | 'flag' | 'heart' | 'fire' | 'lock' | 'person' | 'clock' | 'target'
  | 'book' | 'chart' | 'code' | 'globe' | 'mail' | 'pin'
  | 'calendar' | 'trophy' | 'leaf' | 'building' | 'camera' | 'music'
  | 'rocket' | 'puzzle' | 'lab' | 'coffee' | 'home' | 'phone';

export interface NodeAttachment {
  id: string;
  type: 'image' | 'link' | 'video' | 'file' | 'equation';
  name: string;
  value: string;      // URL, data-URI, or text
  thumbnail?: string; // data-URI for images
}

export interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  collapsed: boolean;
  // Styling
  color?: string;
  bgColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderStyle?: NodeBorderStyle;
  nodeShape?: NodeShapeVariant;
  textFormats?: NodeTextFormat[];
  textAlign?: NodeTextAlign;
  textLineHeight?: NodeTextLineHeight;
  textBullet?: NodeTextBullet;
  // Content
  notes?: string;
  icon?: NodeIcon;
  priority?: NodePriority;
  taskStatus?: TaskStatus;
  number?: string;          // manual numbering label e.g. "1.2.3"
  attachments?: NodeAttachment[];
  attachmentPosition?: AttachmentPosition;
  attachmentSize?: number;
  // Category tags
  tags?: string[];
}

export type NodesMap = Record<string, MindNode>;

// ─── Document ─────────────────────────────────────────────────────────────────

export type DocCategory = 'thoughts' | 'files' | 'shared';

export interface DocPluginPrefs {
  themeId?:      string;
  backgroundId?: string;
  layoutId?:     string;
  styleId?:      string;
  spacingH?:     number;   // horizontal spacing multiplier (default 1.0)
  spacingV?:     number;   // vertical spacing multiplier (default 1.0)
}

export interface MapDocument {
  id: string;
  title: string;
  nodes: NodesMap;
  category: DocCategory;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  shared?: boolean;
  /** Plugin preferences scoped to this document */
  pluginPrefs?: DocPluginPrefs;
  /** Source template and selected lesson for guided learning maps */
  learningPathTemplateId?: string;
  /** Ordered top-level node IDs used as steps in a guided map */
  learningStepIds?: string[];
  learningStepId?: string;
  /** Free-form edges between any two nodes (cross-links) */
  freeEdges?: FreeEdge[];
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

export interface ClipboardEntry {
  rootId: string;
  nodes: NodesMap; // subtree flat copy
}


// ─── Free edges (cross-links between any two nodes) ──────────────────────────

export interface FreeEdge {
  id:     string;
  from:   string;   // node id
  to:     string;   // node id
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  width?: number;
}

// ─── Context menu ─────────────────────────────────────────────────────────────

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
  children?: ContextMenuItem[];
}
