export const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const sanitized = hex.replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => char + char)
          .join('')
      : sanitized.slice(0, 6);
  const bigint = parseInt(normalized, 16);
  if (Number.isNaN(bigint)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const ensureOpaque = (color, fallback = '#fff') => {
  if (!color || typeof color !== 'string') {
    return fallback;
  }
  const normalized = color.replace(/\s+/g, '');
  const rgbaMatch = normalized.match(/^rgba?\(([-\d.]+),([-\d.]+),([-\d.]+)(?:,([-\d.]+))?\)$/i);
  if (rgbaMatch) {
    const r = Math.round(Number(rgbaMatch[1]));
    const g = Math.round(Number(rgbaMatch[2]));
    const b = Math.round(Number(rgbaMatch[3]));
    if ([r, g, b].every((value) => !Number.isNaN(value))) {
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  if (normalized.startsWith('#')) {
    return color;
  }
  return fallback;
};

export const getGlassGradientColors = (colors) => [
  hexToRgba(colors.sky, 0.35),
  hexToRgba(colors.emerald, 0.35),
];

export const getGlassBorderColor = (colors) => hexToRgba(colors.sky, 0.45);
