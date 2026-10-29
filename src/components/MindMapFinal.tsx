// ─────────────────────────────────────────────────────────────────────────────
// src/components/MindMapFinal.tsx
//
// Root application shell. Manages documents, dark mode and global listeners.
// The heavy canvas logic lives in MapCanvas.tsx and src/canvas/*.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMediaQuery } from '@mui/material';
import { Theme } from '../core/Theme';
import { MapDocument, NodesMap, DocCategory } from '../types';
import { DocPluginPrefs } from '../types/index';
import { TemplatePlugin, TemplateOptions } from '../plugins/types';
import { createDefaultPluginPrefs, resolvePluginPrefs } from '../plugins/usePlugins';
import { Sidebar } from './Sidebar';
import { TabBar, Tab } from './TabBar';
import { PluginPicker } from './PluginPicker';
import { MapCanvas } from './MapCanvas';
import { KEY_DOCS, KEY_UI } from '../canvas/constants';
import { makeDefaultDoc } from '../canvas/helpers';
import { useAuth } from '../hooks/useAuth';
import { checkFreeLimit, UpgradeBanner } from './PlanGate';
import { startCheckout } from '../lib/stripe';

// ─────────────────────────────────────────────────────────────────────────────

export default function MindMapFinal() {
  const isMobile = useMediaQuery('(max-width:600px), (max-height:500px)', { noSsr: true });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_UI) ?? '{}').dark ?? false; }
    catch { return false; }
  });

  const [docs, setDocs] = useState<MapDocument[]>(() => {
    try {
      const saved = localStorage.getItem(KEY_DOCS);
      if (saved) {
        const arr = JSON.parse(saved);
        if (arr?.length) {
          const defaults = createDefaultPluginPrefs();
          return arr.map((doc: MapDocument) => ({
            ...doc,
            pluginPrefs: { ...defaults, ...(doc.pluginPrefs ?? {}) },
          }));
        }
      }
    } catch { /* */ }
    return [{ ...makeDefaultDoc('thoughts'), pluginPrefs: createDefaultPluginPrefs() }];
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(KEY_DOCS);
      const arr = JSON.parse(saved ?? '[]');
      return arr[0]?.id ?? '';
    } catch { return ''; }
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [pluginPickerOpen, setPluginPickerOpen] = useState(false);
  const [limitBanner, setLimitBanner] = useState<'docs' | 'nodes' | null>(null);

  const { isPro, session } = useAuth();

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () => localStorage.setItem(KEY_DOCS, JSON.stringify(docs)),
      800
    );
  }, [docs]);

  useEffect(() => {
    localStorage.setItem(KEY_UI, JSON.stringify({ dark: darkMode }));
    (darkMode ? Theme.dark() : Theme.light()).apply();
  }, [darkMode]);

  // ── Global event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const onImport = (e: Event) => {
      const { docId, nodes, title, freeEdges } = (e as CustomEvent).detail;
      setDocs(d => d.map(doc => doc.id === docId
        ? {
            ...doc,
            nodes,
            freeEdges: Array.isArray(freeEdges) ? freeEdges : [],
            ...(typeof title === 'string' ? { title } : {}),
            updatedAt: Date.now(),
          }
        : doc));
    };
    window.addEventListener('minder:import', onImport);
    return () => window.removeEventListener('minder:import', onImport);
  }, []);

  useEffect(() => {
    const onFreeEdges = (e: Event) => {
      const { docId, freeEdges } = (e as CustomEvent).detail;
      setDocs(d => d.map(doc => doc.id === docId ? { ...doc, freeEdges, updatedAt: Date.now() } : doc));
    };
    window.addEventListener('minder:free-edges', onFreeEdges);
    return () => window.removeEventListener('minder:free-edges', onFreeEdges);
  }, []);

  // ── Document operations ────────────────────────────────────────────────────
  const onNodesChange = useCallback((docId: string, nodes: NodesMap) => {
    setDocs(d => d.map(doc => doc.id === docId ? { ...doc, nodes, updatedAt: Date.now() } : doc));
  }, []);

  const onPluginPrefsChange = useCallback((docId: string, prefs: DocPluginPrefs) => {
    setDocs(d => d.map(doc =>
      doc.id === docId
        ? { ...doc, pluginPrefs: { ...(doc.pluginPrefs ?? {}), ...prefs } }
        : doc
    ));
  }, []);

  const onLearningStepChange = useCallback((docId: string, stepId: string) => {
    setDocs(d => d.map(doc => doc.id === docId ? { ...doc, learningStepId: stepId } : doc));
  }, []);

  const onLearningStepsChange = useCallback((docId: string, stepIds: string[]) => {
    setDocs(d => d.map(doc => {
      if (doc.id !== docId) return doc;
      const activeStepId = stepIds.includes(doc.learningStepId ?? '')
        ? doc.learningStepId
        : stepIds[0];
      return { ...doc, learningStepIds: stepIds, learningStepId: activeStepId };
    }));
  }, []);

  const createDoc = (category: DocCategory): MapDocument => ({
    ...makeDefaultDoc(category),
    pluginPrefs: createDefaultPluginPrefs(),
  });

  const addDoc = (category: DocCategory) => {
    if (!checkFreeLimit('docs', docs.length, isPro)) {
      setLimitBanner('docs');
      setTimeout(() => setLimitBanner(null), 5000);
      return;
    }
    const doc = createDoc(category);
    setDocs(d => [...d, doc]);
    setActiveDocId(doc.id);
  };

  const closeTab = (id: string) => {
    setDocs(d => {
      const next = d.filter(doc => doc.id !== id);
      if (activeDocId === id) setActiveDocId(next[0]?.id ?? '');
      return next;
    });
  };

  const renameDoc = (id: string, title: string) => {
    setDocs(d => d.map(doc => doc.id === id ? { ...doc, title } : doc));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const tabs: Tab[] = docs.map(d => ({ id: d.id, title: d.title }));
  const activeDoc   = docs.find(d => d.id === activeDocId) ?? docs[0];
  const activePluginPrefs = resolvePluginPrefs(activeDoc?.pluginPrefs, darkMode);
  const bg          = darkMode ? '#1a1a2e' : '#f4f6fb';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: bg, overflow: 'hidden' }}>
      <Sidebar
        docs={docs} activeDocId={activeDocId} darkMode={darkMode}
        onSelect={setActiveDocId} onNew={addDoc}
        onDelete={closeTab} onRename={renameDoc}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TabBar
          tabs={tabs} activeId={activeDocId}
          onSelect={setActiveDocId} onAdd={() => addDoc('files')}
          onClose={closeTab} onRename={renameDoc} darkMode={darkMode}
        />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeDoc && (
            <MapCanvas
              key={activeDoc.id}
              doc={activeDoc}
              darkMode={darkMode}
              onNodesChange={onNodesChange}
              onPluginPrefsChange={onPluginPrefsChange}
              onLearningStepChange={onLearningStepChange}
              onLearningStepsChange={onLearningStepsChange}
              onOpenPluginPicker={() => setPluginPickerOpen(o => !o)}
              onToggleDark={() => setDarkMode((d: boolean) => !d)}
              onRenameDoc={renameDoc}
            />
          )}
        </div>
      </div>

      {pluginPickerOpen && activeDoc && (
        <PluginPicker
          darkMode={darkMode}
          activeThemeId={activePluginPrefs.themeId}
          activeBackgroundId={activePluginPrefs.backgroundId}
          activeLayoutId={activePluginPrefs.layoutId}
          activeStyleId={activePluginPrefs.styleId}
          onSetTheme={id => onPluginPrefsChange(activeDoc.id, { themeId: id })}
          onSetBackground={id => onPluginPrefsChange(activeDoc.id, { backgroundId: id })}
          onSetLayout={id => onPluginPrefsChange(activeDoc.id, { layoutId: id })}
          onSetStyle={id => onPluginPrefsChange(activeDoc.id, { styleId: id })}
          onApplyTemplate={(plugin: TemplatePlugin, opts: TemplateOptions) => {
            if (!checkFreeLimit('docs', docs.length, isPro)) {
              setLimitBanner('docs');
              setTimeout(() => setLimitBanner(null), 5000);
              return;
            }
            const newNodes = plugin.build({ ...opts, parentId: null }) as NodesMap;
            if (!checkFreeLimit('nodes', Object.keys(newNodes).length, isPro)) {
              setLimitBanner('nodes');
              setTimeout(() => setLimitBanner(null), 5000);
              return;
            }
            const root = Object.values(newNodes).find(node => node.parentId === null);
            const firstLearningStepId = root?.children.find(id => /^Étape \d+/.test(newNodes[id]?.text ?? ''));
            const isLearningPath = plugin.meta.id === 'angular-learning-path'
              || plugin.meta.id === 'hexagonal-architecture-project';
            const newDoc = {
              ...createDoc('files'),
              title: plugin.meta.name,
              nodes: newNodes,
              ...(isLearningPath && firstLearningStepId
                ? {
                    learningPathTemplateId: plugin.meta.id,
                    learningStepIds: root?.children.filter(id => /^Étape \d+/.test(newNodes[id]?.text ?? '')) ?? [],
                    learningStepId: firstLearningStepId,
                  }
                : {}),
              updatedAt: Date.now(),
            };
            setDocs(currentDocs => [...currentDocs, newDoc]);
            setActiveDocId(newDoc.id);
            setPluginPickerOpen(false);
          }}
          onClose={() => setPluginPickerOpen(false)}
        />
      )}
      {limitBanner && (
        <UpgradeBanner
          type={limitBanner}
          onUpgrade={() => {
            if (session) startCheckout('pro', session.user.email, session.access_token);
            else window.location.hash = '/auth';
          }}
        />
      )}
    </div>
  );
}
