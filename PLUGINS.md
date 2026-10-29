# Minder Plugin System — Reference for AI Generation

> **Version:** 1.0
> **Status:** Stable
> Copy this document as context when asking any AI to generate a plugin.

---

## 1. What a plugin is

A plugin is a **single TypeScript file** that exports **one named const** conforming to one of five interfaces defined in `src/plugins/types.ts`.

```
src/plugins/
├── types.ts          ← interfaces, PluginNode, makeId — READ ONLY
├── registry.ts       ← import your file here + add to array
├── theme/            ← ThemePlugin files
├── background/       ← BackgroundPlugin files
├── layout/           ← LayoutPlugin files
├── templates/        ← TemplatePlugin files
└── style/            ← StylePlugin files
```

To add a plugin:
1. Drop the file in the right subfolder.
2. Import it in `registry.ts` and add it to `ALL_PLUGINS`.
3. Done — no other changes needed.

---

## 2. Mandatory structure (all plugins)

Every plugin must have exactly this shape:

```typescript
export const MyPlugin: SomePlugin = {
  meta: {
    id:          'my-plugin-id',   // kebab-case, unique across all plugins
    name:        'My Plugin',      // human-readable, title-case
    description: 'One sentence.', // ≤ 120 chars
    type:        'theme',          // must match the parent interface
    version:     '1.0.0',
    author:      'your-name',      // or 'ai-generated'
  },
  // ... interface-specific fields
};
```

**Invariants (ALL plugin types):**
- ✅ One exported const per file
- ✅ No default exports
- ✅ No imports except from `'../types'`
- ✅ No `console.log` / `console.error` in production code
- ✅ No `window`, `document`, `localStorage` access
- ✅ No `Math.random()` directly — use `makeId()` for IDs
- ✅ All functions must be pure (same input → same output)
- ✅ Never mutate the `nodes` argument passed to `apply()` or `build()`

---

## 3. Interface reference

### 3.1 ThemePlugin

Controls colors only. No geometry. No DOM.

```typescript
interface ThemePlugin {
  meta: PluginMeta & { type: 'theme' };
  isDark: boolean;
  getColors(): ThemeColors;
}

interface ThemeColors {
  canvasBackground: string;  // SVG / page background
  nodeFill:         string;  // default node fill
  nodeBorder:       string;  // default node stroke
  nodeText:         string;  // label text color
  nodeSelected:     string;  // accent when selected
  dotGrid:          string;  // background pattern color
  mutedText:        string;  // status bar / secondary text
  palette:          string[]; // min 4 entries, cycled by depth
}
```

**Rules:**
- All color values → valid CSS hex (`#rrggbb`)
- `palette` must have ≥ 4 entries
- `getColors()` must be a pure function

---

### 3.2 BackgroundPlugin

Renders behind the node graph.

```typescript
interface BackgroundPlugin {
  meta: PluginMeta & { type: 'background' };
  render(options: BackgroundOptions): string;
}

interface BackgroundOptions {
  width:       number;
  height:      number;
  darkMode:    boolean;
  accentColor: string;
  panX:        number;  // current pan offset — for tiling patterns
  panY:        number;
}
```

**Rules:**
- `render()` returns an **SVG fragment string** — elements only, no `<svg>` wrapper
- Only inline attributes — no `<style>` blocks, no `href` to external resources
- Must work at any width/height
- No JavaScript inside the SVG string
- Use `panX % gridSize` to make tiling patterns follow the viewport

---

### 3.3 LayoutPlugin

Computes node positions.

```typescript
interface LayoutPlugin {
  meta: PluginMeta & { type: 'layout' };
  apply(
    nodes:   Readonly<PluginNodesMap>,
    rootId:  string,
    options: LayoutOptions
  ): Map<string, { x: number; y: number }>;
}

interface LayoutOptions {
  viewportWidth:  number;
  viewportHeight: number;
  nodeWidth:      number;
  nodeHeight:     number;
  spacing:        number;  // spacing multiplier, default 1.0
}
```

**Rules:**
- `apply()` must be **pure** — never mutate `nodes`
- Return a `Map<string, {x,y}>` with an entry for **every** node id
- Nodes with missing entries keep their existing position (defensive fallback in caller)
- No D3, no external layout libraries — implement the algorithm from scratch
- Defensive check: `if (!rootId || !nodes[rootId]) return new Map()`
- Use `viewportWidth/2` and `viewportHeight/2` as the default center

---

### 3.4 TemplatePlugin

Produces a new NodesMap from scratch.

```typescript
interface TemplatePlugin {
  meta:     PluginMeta & { type: 'template' };
  category: 'enterprise' | 'education' | 'personal' | 'creative' | 'other';
  preview:  string[];  // top-level branch labels for the UI preview chips
  build(options: TemplateOptions): PluginNodesMap;
}

interface TemplateOptions {
  originX:  number;       // x position of the root node
  originY:  number;       // y position of the root node
  parentId: string | null; // null for a standalone document root
}
```

**Rules:**
- Use `makeId(prefix)` from `'../types'` for **all** node IDs — never `Date.now()` alone
- Every node in the result must have consistent `parentId` ↔ `children` references
- `parentId` of the root node must be `opts.parentId` (may be null)
- `preview` must match the top-level branch labels in `build()`
- Nodes may include image attachments with HTTPS URLs; the editor also supports
  local raster images, which it stores as data URLs. Remote images require an
  internet connection.
- Use `makeId()` for attachment IDs as well as node IDs.
- All positions are absolute world coordinates relative to `originX/Y`

The built-in illustrated templates include a plant life cycle, a historical
timeline, a solar-system atlas, and a story storyboard. Their gallery previews
use different compositions (timeline, orbit, or scene panels) rather than
reusing the same generic tree. Remote image templates should use distinct,
direct HTTPS image URLs and keep thumbnail-sized sources where possible.

Nodes may also carry text formatting. `textFormats` stores character ranges
with optional `fontFamily`, `fontSize`, `textBold`, `textItalic`,
`textUnderline`, `textStrikethrough`, `textColor`, and `textBackgroundColor`
properties. Paragraph-level `textAlign`, `textLineHeight`, and `textBullet`
apply to the full node label. The editor validates and preserves these
properties in `.minder` files.

---

### 3.5 StylePlugin

Controls visual rendering attributes per node.

```typescript
interface StylePlugin {
  meta: PluginMeta & { type: 'style' };
  getNodeShape(node, depth, isSelected, accentColor): NodeShapeAttrs;
  getNodeText(node, depth, darkMode): NodeTextAttrs;
  getEdge(depth, accentColor): EdgeAttrs;
}

interface NodeShapeAttrs {
  rx: number; ry: number;       // border radius (0 = square)
  fill: string;                 // node background
  stroke: string;               // border color
  strokeWidth: number;
  strokeDasharray?: string;     // optional dash pattern e.g. "6,3"
}

interface NodeTextAttrs {
  fontSize:       number;
  fontWeight:     string | number;
  fontFamily:     string;
  fill:           string;
  letterSpacing?: string;
  textTransform?: string;
}

interface EdgeAttrs {
  stroke:          string;
  strokeWidth:     number;
  strokeOpacity:   number;
  strokeDasharray?: string;
  pathFn?: (x1: number, y1: number, x2: number, y2: number) => string;
}
```

**Rules:**
- All three methods must return **complete objects** — no partial returns
- `pathFn` is optional; if absent the canvas uses the default cubic Bézier
- `pathFn` must be a self-contained arrow function — no module-level closures
- Do not hardcode the accent color — use the `accentColor` parameter

---

## 4. Complete prompt templates for AI generation

Copy-paste these prompts to any AI. Fill in `[BRACKETS]`.

### Theme prompt

```
Generate a Minder ThemePlugin in TypeScript for the file
`src/plugins/theme/[filename].ts`.

The theme should evoke [mood/aesthetic e.g. "cyberpunk neon", "warm sunset",
"minimalist newspaper"].
It should be a [dark|light] theme.

Requirements:
- Export one named const: `export const [ConstName]: ThemePlugin`
- Import only: `import { ThemePlugin, ThemeColors } from '../types';`
- Implement `getColors()` as a pure function returning ThemeColors
- `palette` must have exactly 6 hex color entries
- All colors must be valid CSS hex strings (#rrggbb)
- Include `meta` with id, name, description, type: 'theme', version: '1.0.0', author: 'ai-generated'
- No side effects, no external dependencies, no console.log

Return only the TypeScript file content.
```

### Background prompt

```
Generate a Minder BackgroundPlugin in TypeScript for the file
`src/plugins/background/[filename].ts`.

The background should be [description e.g. "a diagonal hatching pattern",
"concentric circles that radiate from center", "a grid of small triangles"].

Requirements:
- Export one named const: `export const [ConstName]: BackgroundPlugin`
- Import only: `import { BackgroundPlugin, BackgroundOptions } from '../types';`
- `render(opts)` returns an SVG fragment string (no <svg> wrapper)
- Inline attributes only — no <style> blocks, no external refs
- Use `opts.darkMode` to select colors
- Use `opts.panX % gridSize` to tile patterns with pan
- Must work at any width/height
- No JavaScript inside the SVG string

Return only the TypeScript file content.
```

### Layout prompt

```
Generate a Minder LayoutPlugin in TypeScript for the file
`src/plugins/layout/[filename].ts`.

The layout algorithm should [describe the arrangement e.g. "place nodes in a
spiral from the center", "arrange nodes in a grid by depth level",
"cluster nodes by their tags field"].

Requirements:
- Export one named const: `export const [ConstName]: LayoutPlugin`
- Import only: `import { LayoutPlugin, LayoutOptions, PluginNodesMap } from '../types';`
- `apply(nodes, rootId, opts)` is a pure function — never mutate `nodes`
- Return `Map<string, {x, y}>` with an entry for every node id
- First defensive check: `if (!rootId || !nodes[rootId]) return new Map()`
- Use `opts.viewportWidth/2`, `opts.viewportHeight/2` as default center
- No external layout libraries — pure TypeScript algorithm only

Return only the TypeScript file content.
```

### Template prompt

```
Generate a Minder TemplatePlugin in TypeScript for the file
`src/plugins/templates/[filename].ts`.

The template should represent [topic e.g. "a product launch plan",
"an Agile sprint retrospective", "a study plan for an exam"].

Requirements:
- Export one named const: `export const [ConstName]: TemplatePlugin`
- Import: `import { TemplatePlugin, TemplateOptions, PluginNodesMap, makeId } from '../types';`
- category: one of 'enterprise' | 'education' | 'personal' | 'creative' | 'other'
- `preview`: array of top-level branch labels (3–6 entries)
- `build(opts)` is a pure function — no global state reads
- Use `makeId('prefix')` for all node IDs — never naked Date.now()
- Every node must have consistent parentId ↔ children references
- Positions are world coordinates relative to opts.originX / opts.originY
- Root node parentId must be opts.parentId

Return only the TypeScript file content.
```

### Style prompt

```
Generate a Minder StylePlugin in TypeScript for the file
`src/plugins/style/[filename].ts`.

The style should look [description e.g. "like sticky notes with a slight tilt",
"like terminal/CLI with green text on black", "like newspaper clippings"].

Requirements:
- Export one named const: `export const [ConstName]: StylePlugin`
- Import only: `import { StylePlugin, PluginNode, NodeShapeAttrs, NodeTextAttrs, EdgeAttrs } from '../types';`
- Implement all three methods: getNodeShape, getNodeText, getEdge
- Each method must return a COMPLETE object (all fields required)
- getNodeShape: use `accentColor` param for selected state, avoid hardcoded accents
- getNodeText: use `darkMode` to switch text colors
- getEdge: if customizing pathFn, write it as a self-contained arrow function
- No partial objects, no undefined fields, no DOM access

Return only the TypeScript file content.
```

---

## 5. Robustness rules (checklist before adding a plugin)

- [ ] No import other than `from '../types'`
- [ ] No access to `window`, `document`, `localStorage`
- [ ] No `console.log` / `console.warn` / `console.error`
- [ ] No `Math.random()` directly — use `makeId()` for IDs
- [ ] All methods are pure (no mutation of arguments)
- [ ] Default/fallback for every optional field
- [ ] `meta.id` is kebab-case and unique
- [ ] `meta.type` matches the parent interface
- [ ] TypeScript compiles with `npx tsc --noEmit` — zero errors

---

## 6. Registration (after creating a plugin)

Open `src/plugins/registry.ts` and:

```typescript
// 1. Add import at the top
import { MyCoolLayout } from './layout/my-cool-layout';

// 2. Add to ALL_PLUGINS array
const ALL_PLUGINS: AnyPlugin[] = [
  // ...existing...
  MyCoolLayout,   // ← add here
];
```

That's it. The UI reads from `getLayouts()`, `getThemes()`, etc. automatically.

---

## 7. Quick example (complete, copy-paste ready)

```typescript
// src/plugins/theme/sunset.ts
import { ThemePlugin, ThemeColors } from '../types';

export const SunsetTheme: ThemePlugin = {
  meta: {
    id: 'sunset', name: 'Sunset', type: 'theme', version: '1.0.0',
    description: 'Warm sunset gradation from amber to deep crimson.',
    author: 'ai-generated',
  },
  isDark: false,
  getColors(): ThemeColors {
    return {
      canvasBackground: '#fff8f0',
      nodeFill:         '#ffffff',
      nodeBorder:       '#f0c8a0',
      nodeText:         '#2a1000',
      nodeSelected:     '#e05c20',
      dotGrid:          '#ffe0c0',
      mutedText:        '#b08060',
      palette: ['#e05c20','#e0a020','#c04080','#8040c0','#4080e0','#20a060'],
    };
  },
};
```
