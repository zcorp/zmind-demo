import React from 'react';
// ─────────────────────────────────────────────────────────────────────────────
// src/canvas/useMapHistory.ts
// Provides undo/redo/mutate with a capped history stack.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { NodesMap } from '../types';
import { HIST_LIM } from './constants';

interface UseMapHistoryOptions {
  docId:         string;
  nodesRef:      React.MutableRefObject<NodesMap>;
  onNodesChange: (docId: string, nodes: NodesMap) => void;
  setSavedAt:    (t: number) => void;
}

export interface MapHistoryApi {
  pushHist: (snap: NodesMap) => void;
  reset:    (snap: NodesMap) => void;
  mutate:   (fn: (prev: NodesMap) => NodesMap) => void;
  undo:     () => void;
  redo:     () => void;
  histI:    number;
  histLen:  number;
  canUndo:  boolean;
  canRedo:  boolean;
}

export function useMapHistory({
  docId, nodesRef, onNodesChange, setSavedAt,
}: UseMapHistoryOptions): MapHistoryApi {
  const histRef = useRef<NodesMap[]>([]);
  const histIdx = useRef(-1);
  const [histLen, setHistLen] = useState(0);
  const [histI,   setHistI]   = useState(-1);

  const pushHist = useCallback((snap: NodesMap) => {
    const sl = histRef.current.slice(0, histIdx.current + 1);
    sl.push(JSON.parse(JSON.stringify(snap)));
    if (sl.length > HIST_LIM) sl.shift();
    histRef.current = sl;
    histIdx.current = sl.length - 1;
    setHistLen(sl.length);
    setHistI(sl.length - 1);
  }, []);

  const reset = useCallback((snap: NodesMap) => {
    histRef.current = [JSON.parse(JSON.stringify(snap))];
    histIdx.current = 0;
    setHistLen(1);
    setHistI(0);
    setSavedAt(Date.now());
  }, [setSavedAt]);

  const mutate = useCallback((fn: (prev: NodesMap) => NodesMap) => {
    const next = fn(nodesRef.current);
    pushHist(next);
    onNodesChange(docId, next);
    setSavedAt(Date.now());
  }, [pushHist, nodesRef, onNodesChange, docId, setSavedAt]);

  const undo = useCallback(() => {
    if (histIdx.current > 0) {
      histIdx.current--;
      setHistI(histIdx.current);
      onNodesChange(docId, JSON.parse(JSON.stringify(histRef.current[histIdx.current])));
    }
  }, [onNodesChange, docId]);

  const redo = useCallback(() => {
    if (histIdx.current < histRef.current.length - 1) {
      histIdx.current++;
      setHistI(histIdx.current);
      onNodesChange(docId, JSON.parse(JSON.stringify(histRef.current[histIdx.current])));
    }
  }, [onNodesChange, docId]);

  return {
    pushHist, reset, mutate, undo, redo,
    histI, histLen,
    canUndo: histI > 0,
    canRedo: histI < histLen - 1 && histLen > 0,
  };
}
