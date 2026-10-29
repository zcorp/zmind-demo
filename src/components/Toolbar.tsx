import React, { useState } from 'react';
import { LayoutType } from '../core/Layout';

interface ToolbarProps {
  layoutType: LayoutType;
  onLayoutTypeChange: (type: LayoutType) => void;
  onApplyLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSearch: (query: string) => void;
  onToggleInspector: () => void;
  inspectorOpen: boolean;
  onExportMinder: () => void;
  onImportMinder: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportMarkdown: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const {
    layoutType, onLayoutTypeChange, onApplyLayout,
    onUndo, onRedo, canUndo, canRedo,
    onSearch, onToggleInspector, inspectorOpen,
    onExportMinder, onImportMinder, onExportSVG, onExportPNG, onExportMarkdown,
    darkMode, onToggleDarkMode,
  } = props;

  const [searchVal, setSearchVal] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const bg     = darkMode ? 'rgba(26,26,46,0.97)' : 'rgba(255,255,255,0.97)';
  const border = darkMode ? '#3a3c5a' : '#e0e6f0';
  const text   = darkMode ? '#e8eaf6' : '#1a1a2e';
  const muted  = darkMode ? '#6070a0' : '#8090b8';

  const btn = (active = false, disabled = false, accent?: string): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 7,
    border: `1.5px solid ${active ? (accent || '#4f8ef7') : border}`,
    background: active ? (accent || '#4f8ef7') : (disabled ? 'transparent' : (darkMode ? '#23243a' : '#f8f9fc')),
    color: active ? '#fff' : (disabled ? muted : text),
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12.5, fontFamily: 'inherit',
    opacity: disabled ? 0.45 : 1,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.13s',
  });

  const sep = () => (
    <div style={{ width: 1, height: 18, background: border, margin: '0 3px', flexShrink: 0 }} />
  );

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 500,
      background: bg, border: `1px solid ${border}`,
      padding: '7px 10px', borderRadius: 12,
      boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.55)' : '0 4px 20px rgba(79,142,247,0.13)',
      display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap',
      backdropFilter: 'blur(10px)',
      maxWidth: 'calc(100vw - 320px)',
    }}>
      {/* History */}
      <button onClick={onUndo} disabled={!canUndo} style={btn(false, !canUndo)} title="Annuler (Ctrl+Z)">↶</button>
      <button onClick={onRedo} disabled={!canRedo} style={btn(false, !canRedo)} title="Rétablir (Ctrl+Y)">↷</button>

      {sep()}

      {/* Search */}
      <input
        type="text" placeholder="🔍 Rechercher…"
        value={searchVal}
        onChange={e => { setSearchVal(e.target.value); onSearch(e.target.value); }}
        style={{
          padding: '5px 10px', border: `1.5px solid ${border}`, borderRadius: 7,
          background: darkMode ? '#23243a' : '#f8f9fc', color: text,
          fontSize: 12.5, outline: 'none', width: 120, fontFamily: 'inherit',
        }}
      />

      {sep()}

      {/* Layout */}
      <span style={{ fontSize: 11, color: muted, marginRight: 1 }}>Layout</span>
      {([
        [LayoutType.Tree,      '↓', 'Arbre bas'],
        [LayoutType.TreeLeft,  '←', 'Arbre gauche'],
        [LayoutType.TreeRight, '→', 'Arbre droite'],
        [LayoutType.Radial,    '⊙', 'Radial'],
      ] as [LayoutType, string, string][]).map(([type, icon, title]) => (
        <button key={type} onClick={() => onLayoutTypeChange(type)}
          style={btn(layoutType === type)} title={title}>
          {icon}
        </button>
      ))}
      <button onClick={onApplyLayout}
        style={{ ...btn(false), background: '#22c55e', color: '#fff', border: '1.5px solid #22c55e' }}
        title="Appliquer le layout">

      </button>

      {sep()}

      {/* Export dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setExportOpen(o => !o)}
          style={btn(exportOpen)}
          title="Exporter / Importer"
        >
          ⬇ Export ▾
        </button>
        {exportOpen && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              background: bg, border: `1px solid ${border}`,
              borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
              minWidth: 170, zIndex: 600,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
            onMouseLeave={() => setExportOpen(false)}
          >
            {[
              { label: '📥 Import .minder', action: onImportMinder },
              { label: '📤 Export .minder', action: onExportMinder },
              { label: '🖼  Export SVG', action: onExportSVG },
              { label: '🖼  Export PNG', action: onExportPNG },
              { label: '📝 Export Markdown', action: onExportMarkdown },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={() => { action(); setExportOpen(false); }}
                style={{
                  padding: '9px 14px', background: 'none', border: 'none',
                  textAlign: 'left', cursor: 'pointer', fontSize: 13,
                  color: text, fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = darkMode ? '#2a2d4a' : '#f0f4ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {sep()}

      {/* Dark mode */}
      <button onClick={onToggleDarkMode} style={btn(darkMode)} title="Thème sombre">
        {darkMode ? '☀' : '🌙'}
      </button>

      {/* Inspector toggle */}
      <button onClick={onToggleInspector} style={btn(inspectorOpen)} title="Panneau propriétés">

      </button>
    </div>
  );
};
