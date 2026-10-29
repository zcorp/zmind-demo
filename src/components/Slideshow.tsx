import React, { useCallback, useEffect, useState } from 'react';
import { MindNode, NodesMap } from '../types';
import { NODE_ICON_COMPONENTS, PRIORITY_CONFIG } from '../constants/icons';
import { normalizeExternalUrl, resolveImageSource } from '../canvas/attachment-preview';

interface SlideshowProps {
  startNodeId: string;
  nodes: NodesMap;
  darkMode: boolean;
  palette: string[];
  canvasBackground: string;
  nodeText: string;
  onClose: () => void;
}

/** Build a depth-first ordered list of visible nodes starting from a root */
function buildSlides(nodes: NodesMap, rootId: string): MindNode[] {
  const slides: MindNode[] = [];
  const visit = (id: string) => {
    const n = nodes[id]; if (!n) return;
    slides.push(n);
    if (!n.collapsed) n.children.forEach(visit);
  };
  visit(rootId);
  return slides;
}

function nodeDepth(nodes: NodesMap, id: string): number {
  let d = 0, cur = nodes[id]?.parentId ?? null;
  while (cur) { d++; cur = nodes[cur]?.parentId ?? null; }
  return d;
}

export const Slideshow: React.FC<SlideshowProps> = ({
  startNodeId, nodes, darkMode, palette, canvasBackground, nodeText, onClose,
}) => {
  const slides  = buildSlides(nodes, startNodeId);
  const [idx, setIdx] = useState(0);

  const go = useCallback((dir: 1 | -1) => {
    setIdx(i => Math.max(0, Math.min(slides.length - 1, i + dir)));
  }, [slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'Home') { e.preventDefault(); setIdx(0); }
      if (e.key === 'End') { e.preventDefault(); setIdx(slides.length - 1); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onClose, slides.length]);

  if (!slides.length) return null;

  const slide   = slides[idx];
  const depth   = nodeDepth(nodes, slide.id);
  const colors = palette.length > 0 ? palette : ['#007c91'];
  const color   = slide.color ?? colors[depth % colors.length];
  const firstVisibleStep = Math.max(0, Math.min(idx - 3, slides.length - 7));
  const visibleSlides = slides.slice(firstVisibleStep, firstVisibleStep + 7);
  const priCfg  = slide.priority ? PRIORITY_CONFIG[slide.priority] : null;
  const Icon    = slide.icon && slide.icon !== 'none' ? NODE_ICON_COMPONENTS[slide.icon] : null;
  const children = slide.children.map(cid => nodes[cid]).filter(Boolean);
  const crumbs: string[] = [];
  let parentId = slide.parentId;
  while (parentId) {
    const parent = nodes[parentId];
    if (!parent) break;
    crumbs.unshift(parent.text);
    parentId = parent.parentId;
  }
  const bg = darkMode ? '#111522' : canvasBackground;
  const surface = darkMode ? '#1b2030' : '#ffffff';
  const text = darkMode ? '#eef1f7' : nodeText;
  const muted = darkMode ? '#aab4c4' : '#667085';
  const attachments = slide.attachments ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: `radial-gradient(ellipse at 50% 0%, ${color}1c 0%, transparent 58%), ${bg}`,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}
      role="dialog"
      aria-modal="true"
      aria-label={`Diaporama : ${slide.text}`}
    >
      <div style={{ height: 4, flexShrink: 0, background: `${color}22` }}>
        <div style={{ height: '100%', width: `${((idx + 1) / slides.length) * 100}%`, background: color, transition: 'width .25s ease' }} />
      </div>

      <div style={{
        height: 64, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, padding: '0 clamp(16px, 4vw, 48px)',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.14em', color, textTransform: 'uppercase' }}>Diaporama</div>
          <div style={{ color: muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>
            {crumbs.length ? crumbs.join('  /  ') : 'Présentation de la carte'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span aria-live="polite" style={{ fontSize: 12, color: muted, fontVariantNumeric: 'tabular-nums' }}>
            {idx + 1} <span style={{ opacity: .6 }}>/</span> {slides.length}
          </span>
          <button type="button" onClick={onClose} aria-label="Fermer le diaporama" title="Fermer (Échap)" style={{
            width: 38, height: 38, borderRadius: 12, border: `1px solid ${darkMode ? '#363d4d' : '#e5e7eb'}`,
            color: text, background: surface, cursor: 'pointer', fontSize: 21, lineHeight: 1,
          }}>×</button>
        </div>
      </div>

      <main
        key={slide.id}
        style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', overflowY: 'auto', padding: '24px 24px 32px',
          animation: 'slide-appear .24s ease both',
        }}
      >
        <style>{'@keyframes slide-appear { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }'}</style>
        <article style={{
          width: 'min(900px, 100%)', maxHeight: '100%', overflowY: 'auto',
          padding: 'clamp(24px, 5vw, 56px)', borderRadius: 28,
          background: surface,
          border: `1px solid ${darkMode ? '#30384a' : '#e8eaf0'}`,
          boxShadow: darkMode ? '0 24px 80px #0005' : '0 24px 80px #26334b16',
          textAlign: 'center',
        }}>
          <div style={{ width: 48, height: 4, borderRadius: 5, background: color, opacity: .75, margin: '0 auto 26px' }} />
          {Icon && <Icon sx={{ fontSize: 42, mb: 1.5, color }} />}
          {slide.number && (
            <div style={{ marginBottom: 10, color, fontSize: 12, fontWeight: 750, letterSpacing: '.12em' }}>
              {slide.number}
            </div>
          )}
          <h1 style={{
            margin: 0, fontSize: 'clamp(30px, 5vw, 58px)', fontWeight: 750,
            color: text, lineHeight: 1.12, letterSpacing: '-.035em', overflowWrap: 'anywhere',
          }}>
            {slide.text}
          </h1>

          {priCfg && priCfg.color !== 'transparent' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 18,
              padding: '6px 12px', borderRadius: 999, background: `${priCfg.color}18`,
              border: `1px solid ${priCfg.color}55`, fontSize: 12, color: priCfg.color, fontWeight: 650,
            }}>
              <span aria-hidden="true">●</span> {priCfg.label}
            </div>
          )}

          {slide.notes?.trim() && (
            <p style={{
              maxWidth: 680, margin: '24px auto 0', color: muted, fontSize: 'clamp(15px, 2vw, 19px)',
              lineHeight: 1.75, whiteSpace: 'pre-wrap', textAlign: 'left',
            }}>
              {slide.notes}
            </p>
          )}

          {children.length > 0 && (
            <section aria-label="Rubriques" style={{ marginTop: 30 }}>
              <div style={{ color: muted, fontSize: 10, fontWeight: 750, letterSpacing: '.13em', marginBottom: 12, textTransform: 'uppercase' }}>
                À retenir
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 10 }}>
                {children.map((child, childIndex) => {
                  const childColor = child.color ?? colors[childIndex % colors.length];
                  const ChildIcon = child.icon && child.icon !== 'none' ? NODE_ICON_COMPONENTS[child.icon] : null;
                  return (
                    <div key={child.id} style={{
                      minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 15,
                      background: `${childColor}12`, border: `1px solid ${childColor}40`,
                      color: text, fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere',
                    }}>
                      {ChildIcon && <ChildIcon sx={{ fontSize: 18, color: childColor, flexShrink: 0 }} />}
                      {child.text}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {attachments.length > 0 && (
            <section aria-label="Pièces jointes" style={{
              display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 26,
            }}>
              {attachments.map(attachment => {
                const image = attachment.type === 'image'
                  ? resolveImageSource(attachment.thumbnail) ?? resolveImageSource(attachment.value)
                  : null;
                const href = attachment.type === 'link' || attachment.type === 'video' || attachment.type === 'file'
                  ? normalizeExternalUrl(attachment.value)
                  : null;
                return image ? (
                  <a key={attachment.id} href={image.startsWith('http') ? image : undefined} target="_blank" rel="noopener noreferrer"
                    aria-label={`Ouvrir l’image ${attachment.name}`} style={{ display: 'block' }}>
                    <img src={image} alt={attachment.name} loading="lazy" style={{
                      maxHeight: 240, maxWidth: 'min(100%, 360px)', borderRadius: 16, objectFit: 'contain',
                      background: darkMode ? '#10131c' : '#f5f6f8', border: `1px solid ${darkMode ? '#363d4d' : '#e5e7eb'}`,
                    }} />
                    <div style={{ color: muted, fontSize: 11, marginTop: 5 }}>{attachment.name}</div>
                  </a>
                ) : (
                  <div key={attachment.id} style={{
                    padding: '8px 13px', borderRadius: 12, background: darkMode ? '#252b39' : '#f5f6f8',
                    color: muted, fontSize: 12,
                  }}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color, textDecoration: 'none' }}>
                        {attachment.name} ↗
                      </a>
                    ) : attachment.name}
                  </div>
                );
              })}
            </section>
          )}
        </article>
      </main>

      <footer style={{
        minHeight: 76, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '12px 12px 20px',
      }}>
        <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label="Diapositive précédente" title="Précédent (←)" style={navBtn(color, darkMode, idx === 0)}>
          ← <span style={{ fontSize: 11 }}>Précédent</span>
        </button>
        <div aria-label={`Progression : ${idx + 1} sur ${slides.length}`} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {visibleSlides.map((item, visibleIndex) => {
            const slideIndex = firstVisibleStep + visibleIndex;
            return (
            <button type="button" key={item.id} onClick={() => setIdx(slideIndex)}
              aria-label={`Aller à la diapositive ${slideIndex + 1} : ${item.text}`}
              aria-current={slideIndex === idx ? 'step' : undefined}
              style={{
                width: slideIndex === idx ? 22 : 7, height: 7, borderRadius: 99, padding: 0,
                border: 0, cursor: 'pointer', background: slideIndex === idx ? color : (darkMode ? '#566071' : '#c8cdd6'),
                transition: 'all .2s ease',
              }} />
            );
          })}
        </div>
        <button type="button" onClick={() => go(1)} disabled={idx === slides.length - 1} aria-label="Diapositive suivante" title="Suivant (→ ou espace)" style={navBtn(color, darkMode, idx === slides.length - 1)}>
          <span style={{ fontSize: 11 }}>Suivant</span> →
        </button>
      </footer>
    </div>
  );
};

function navBtn(color: string, darkMode: boolean, disabled: boolean): React.CSSProperties {
  return {
    minWidth: 88, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '0 9px', borderRadius: 12,
    background: disabled ? 'transparent' : `${color}18`,
    border: `1px solid ${disabled ? (darkMode ? '#30384a' : '#e3e5e9') : `${color}55`}`,
    color: disabled ? (darkMode ? '#626b7a' : '#a2a8b2') : color,
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 17, fontWeight: 600,
    transition: 'background .15s, color .15s',
  };
}
