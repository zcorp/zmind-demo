import type { NodeTextAttrs } from '../plugins/types';

type RGB = { red: number; green: number; blue: number; alpha: number };

const MIN_TEXT_CONTRAST = 4.5;

export function ensureReadableNodeText(
  text: NodeTextAttrs,
  nodeFill: string,
  canvasBackground: string,
): NodeTextAttrs {
  const fill = parseColor(nodeFill);
  const canvas = parseColor(canvasBackground);
  const foreground = parseColor(text.fill);
  if (!fill || !canvas || !foreground) return text;

  const effectiveBackground = composite(fill, canvas);
  if (contrastRatio(composite(foreground, effectiveBackground), effectiveBackground) >= MIN_TEXT_CONTRAST) {
    return text;
  }

  const darkText = { red: 17, green: 17, blue: 17, alpha: 1 };
  const lightText = { red: 255, green: 255, blue: 255, alpha: 1 };
  const readableColor = contrastRatio(darkText, effectiveBackground) >= contrastRatio(lightText, effectiveBackground)
    ? '#111111'
    : '#ffffff';

  return { ...text, fill: readableColor };
}

export function createHarmonizedNodeFills(accentColor: string, canvasBackground: string): string[] {
  const accent = parseColor(accentColor);
  const canvas = parseColor(canvasBackground);
  if (!accent || !canvas) return [];

  const base = composite(canvas, { red: 255, green: 255, blue: 255, alpha: 1 });
  const strengths = luminance(base) > 0.45
    ? [0.1, 0.18, 0.28, 0.4]
    : [0.18, 0.32, 0.46, 0.62];

  return strengths.map(strength => toHex({
    red: base.red + (accent.red - base.red) * strength,
    green: base.green + (accent.green - base.green) * strength,
    blue: base.blue + (accent.blue - base.blue) * strength,
    alpha: 1,
  }));
}

function parseColor(value: string): RGB | null {
  const color = value.trim().toLowerCase();
  if (color === 'transparent') return { red: 0, green: 0, blue: 0, alpha: 0 };

  const hex = color.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
  if (hex) {
    const expanded = hex.length <= 4
      ? [...hex].map(channel => channel + channel).join('')
      : hex;
    return {
      red: parseInt(expanded.slice(0, 2), 16),
      green: parseInt(expanded.slice(2, 4), 16),
      blue: parseInt(expanded.slice(4, 6), 16),
      alpha: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }

  const rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/);
  if (!rgb) return null;

  const [red, green, blue] = rgb.slice(1, 4).map(channel => Number(channel));
  const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]);
  if ([red, green, blue, alpha].some(channel => !Number.isFinite(channel))) return null;
  return {
    red: clamp(red, 0, 255),
    green: clamp(green, 0, 255),
    blue: clamp(blue, 0, 255),
    alpha: clamp(alpha, 0, 1),
  };
}

function composite(foreground: RGB, background: RGB): RGB {
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 };

  return {
    red: (foreground.red * foreground.alpha + background.red * background.alpha * (1 - foreground.alpha)) / alpha,
    green: (foreground.green * foreground.alpha + background.green * background.alpha * (1 - foreground.alpha)) / alpha,
    blue: (foreground.blue * foreground.alpha + background.blue * background.alpha * (1 - foreground.alpha)) / alpha,
    alpha,
  };
}

function contrastRatio(first: RGB, second: RGB): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(color: RGB): number {
  const channels = [color.red, color.green, color.blue].map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toHex(color: RGB): string {
  return `#${[color.red, color.green, color.blue]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}
