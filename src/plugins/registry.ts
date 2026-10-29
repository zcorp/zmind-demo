// ─────────────────────────────────────────────────────────────────────────────
// src/plugins/registry.ts
//
// Central registry.  To add a plugin:
//   1. Drop the file in the right subfolder.
//   2. Import it here and add to ALL_PLUGINS.
//   3. Done — the UI picks it up automatically.
// ─────────────────────────────────────────────────────────────────────────────

import {
  AnyPlugin,
  ThemePlugin,
  BackgroundPlugin,
  LayoutPlugin,
  TemplatePlugin,
  StylePlugin,
} from './types';

// ── Themes ────────────────────────────────────────────────────────────────────
import { ForestDarkTheme }    from './theme/forest-dark';
import { OceanLightTheme }    from './theme/ocean-light';
import { SunsetWarmTheme }    from './theme/sunset-warm';
import { MidnightInkTheme }   from './theme/midnight-ink';
import { NaturalTheme }       from './theme/gitmind-natural';
import { PlayfulTheme }       from './theme/playful';
import { MinderLightTheme }    from './theme/minder-light';
import { MinderDarkTheme }     from './theme/minder-dark';
import { SolarizedLightTheme } from './theme/solarized-light';
import { SolarizedDarkTheme }  from './theme/solarized-dark';

// ── Backgrounds ───────────────────────────────────────────────────────────────
import { DotGridBackground }    from './background/dot-grid';
import { WaveBackground }       from './background/wave';
import { CrosshatchBackground } from './background/crosshatch';
import { PaperBackground }     from './background/paper';
import { PlainBackground }     from './background/plain';

// ── Layouts ───────────────────────────────────────────────────────────────────
import { MindMapLayout }   from './layout/mindmap';
import { TimelineLayout }  from './layout/timeline';
import { FishboneLayout }  from './layout/fishbone';
import {
  LeftTreeLayout, RadialTreeLayout, RightTreeLayout, VerticalTreeLayout,
} from './layout/tree-directions';

// ── Templates ─────────────────────────────────────────────────────────────────
import { SwotTemplate }          from './templates/swot';
import { WeeklyReviewTemplate }  from './templates/weekly-review';
import { OkrTemplate }           from './templates/okr';
import { ALL_LIBRARY_TEMPLATES }  from './templates/library';

// ── Styles ────────────────────────────────────────────────────────────────────
import { RoundedCardStyle }  from './style/rounded-card';
import { BrutalistStyle }    from './style/brutalist';
import { MinimalLineStyle }  from './style/minimal-line';
import { StickyNotesStyle }  from './style/sticky-notes';
import { PlayfulCardsStyle } from './style/playful-cards';
import { MinderUnderlinedStyle } from './style/minder-underlined';
import { MinderSquareStyle } from './style/minder-square';
import { MinderPillStyle } from './style/minder-pill';
import { MinderFlowStyle } from './style/minder-flow';

// ── Master list ───────────────────────────────────────────────────────────────

const ALL_PLUGINS: AnyPlugin[] = [
  // themes
  PlayfulTheme,        // default for light documents
  MinderLightTheme,
  MinderDarkTheme,
  SolarizedLightTheme,
  SolarizedDarkTheme,
  NaturalTheme,
  OceanLightTheme,
  ForestDarkTheme,
  SunsetWarmTheme,
  MidnightInkTheme,
  // backgrounds
  PaperBackground,     // default
  PlainBackground,
  DotGridBackground,
  WaveBackground,
  CrosshatchBackground,
  // layouts
  MindMapLayout,
  VerticalTreeLayout,
  LeftTreeLayout,
  RightTreeLayout,
  RadialTreeLayout,
  TimelineLayout,
  FishboneLayout,
  // templates
  SwotTemplate,
  WeeklyReviewTemplate,
  OkrTemplate,
  // library templates (education, music, sport, astronomy, etc.)
  ...ALL_LIBRARY_TEMPLATES,
  // styles
  RoundedCardStyle,
  PlayfulCardsStyle,   // default for new documents
  StickyNotesStyle,
  BrutalistStyle,
  MinimalLineStyle,
  MinderUnderlinedStyle,
  MinderSquareStyle,
  MinderPillStyle,
  MinderFlowStyle,
];

// ── Type guards ───────────────────────────────────────────────────────────────

export const isTheme      = (p: AnyPlugin): p is ThemePlugin      => p.meta.type === 'theme';
export const isBackground = (p: AnyPlugin): p is BackgroundPlugin  => p.meta.type === 'background';
export const isLayout     = (p: AnyPlugin): p is LayoutPlugin      => p.meta.type === 'layout';
export const isTemplate   = (p: AnyPlugin): p is TemplatePlugin    => p.meta.type === 'template';
export const isStyle      = (p: AnyPlugin): p is StylePlugin       => p.meta.type === 'style';

// ── Typed accessors ───────────────────────────────────────────────────────────

export function getThemes():      ThemePlugin[]      { return ALL_PLUGINS.filter(isTheme); }
export function getBackgrounds(): BackgroundPlugin[]  { return ALL_PLUGINS.filter(isBackground); }
export function getLayouts():     LayoutPlugin[]      { return ALL_PLUGINS.filter(isLayout); }
export function getTemplates():   TemplatePlugin[]    { return ALL_PLUGINS.filter(isTemplate); }
export function getStyles():      StylePlugin[]       { return ALL_PLUGINS.filter(isStyle); }

export function getById(id: string): AnyPlugin | undefined {
  return ALL_PLUGINS.find(p => p.meta.id === id);
}

export function getThemeById(id: string): ThemePlugin | undefined {
  return getThemes().find(p => p.meta.id === id);
}

export function getBackgroundById(id: string): BackgroundPlugin | undefined {
  return getBackgrounds().find(p => p.meta.id === id);
}

export function getLayoutById(id: string): LayoutPlugin | undefined {
  return getLayouts().find(p => p.meta.id === id);
}

export function getStyleById(id: string): StylePlugin | undefined {
  return getStyles().find(p => p.meta.id === id);
}
