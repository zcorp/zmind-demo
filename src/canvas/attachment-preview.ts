export function normalizeExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function safeImageDataUrl(value: string | undefined): string | null {
  if (!value || !/^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,[a-z\d+/]+=*$/i.test(value)) {
    return null;
  }
  return value;
}

export function resolveImageSource(value: string | undefined): string | null {
  return safeImageDataUrl(value) ?? (value ? normalizeExternalUrl(value) : null);
}
