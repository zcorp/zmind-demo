// ─────────────────────────────────────────────────────────────────────────────
// src/canvas/InlineEditor.tsx
// SVG foreignObject input for editing node text inline.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import type { NodeTextStyle } from '../types';

interface InlineEditorProps {
  initialText: string;
  onCommit:    (text: string) => void;
  onSelectionChange: (selection: { start: number; end: number }) => void;
  onDraftChange: (text: string) => void;
  textStyle: Partial<NodeTextStyle>;
  onCancel:    () => void;
  darkMode?:   boolean;
  nodeW?:      number;
  nodeH?:      number;
}

export function InlineEditor({
  initialText, onCommit, onSelectionChange, onDraftChange, textStyle, onCancel,
  darkMode = false, nodeW = 134, nodeH = 40,
}: InlineEditorProps) {
  const [v, setV] = useState(initialText);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
    onSelectionChange({ start: 0, end: initialText.length });
  }, []);

  const reportSelection = (input: HTMLInputElement) => {
    onSelectionChange({
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
    });
  };

  return (
    <foreignObject x={0} y={0} width={nodeW} height={nodeH}>
      <input
        ref={ref}
        value={v}
        onChange={e => {
          setV(e.target.value);
          onDraftChange(e.target.value);
        }}
        onSelect={event => {
          reportSelection(event.currentTarget);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit(v.trim() || initialText); }
          if (e.key === 'Escape') onCancel();
          e.stopPropagation();
        }}
        onBlur={event => {
          reportSelection(event.currentTarget);
          if (event.relatedTarget instanceof HTMLElement
            && event.relatedTarget.closest('[data-text-formatting-popover]')) return;
          onCommit(v.trim() || initialText);
        }}
        style={{
          width: '100%', height: '100%', padding: '0 12px',
          border: '2px solid #4f8ef7', borderRadius: 10,
          background: textStyle.textBackgroundColor ?? (darkMode ? '#1e2040' : '#fff'),
          color: textStyle.textColor ?? (darkMode ? '#e8eaf6' : '#111'),
          fontSize: textStyle.fontSize ?? 13,
          fontFamily: textStyle.fontFamily ?? 'inherit',
          fontWeight: textStyle.textBold ? 700 : 400,
          fontStyle: textStyle.textItalic ? 'italic' : 'normal',
          textDecoration: [
            textStyle.textUnderline ? 'underline' : '',
            textStyle.textStrikethrough ? 'line-through' : '',
          ].filter(Boolean).join(' ') || 'none',
          outline: 'none', boxSizing: 'border-box', textAlign: 'center',
        }}
      />
    </foreignObject>
  );
}
