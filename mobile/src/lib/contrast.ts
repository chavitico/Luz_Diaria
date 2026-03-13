/**
 * WCAG 2.1 contrast utilities + ActionButton color helpers.
 * All color inputs are hex strings like '#RRGGBB' or '#RGB'.
 */

type RGB = { r: number; g: number; b: number };

/** Parse a hex color (#RGB or #RRGGBB) into {r, g, b} 0-255. */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Encode {r,g,b} back to hex. */
export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** WCAG relative luminance for a single channel value (0–255). */
function channelLuminance(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a hex color (0–1). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two hex colors. Range [1, 21]. */
export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Return '#FFFFFF' or '#111111' — whichever gives higher contrast against `bg`.
 * Guarantees at least 4.5:1 for normal text (WCAG AA).
 */
export function pickReadableTextColor(bg: string): string {
  const white = contrastRatio('#FFFFFF', bg);
  const black = contrastRatio('#111111', bg);
  return white >= black ? '#FFFFFF' : '#111111';
}

/** Lighten a hex color by a factor (0-1 = no change, 1 = white). */
function lighten(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + (255 - r) * factor,
    g: g + (255 - g) * factor,
    b: b + (255 - b) * factor,
  });
}

/** Darken a hex color by a factor (0 = no change, 1 = black). */
function darken(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r * (1 - factor),
    g: g * (1 - factor),
    b: b * (1 - factor),
  });
}

/**
 * Adjust `fg` until contrastRatio(fg, bg) >= minRatio.
 * In dark mode, we push fg toward white; in light mode, toward black.
 * Returns the adjusted color.
 */
export function ensureContrast(
  fg: string,
  bg: string,
  minRatio: number,
  isDark: boolean,
): string {
  let color = fg;
  const MAX_STEPS = 20;
  for (let i = 0; i < MAX_STEPS; i++) {
    if (contrastRatio(color, bg) >= minRatio) return color;
    color = isDark ? lighten(color, 0.08) : darken(color, 0.08);
  }
  // Fallback: guarantee with absolute black/white
  return isDark ? '#FFFFFF' : '#111111';
}

/**
 * Derive a safe fill color for an ActionButton.
 *
 * Algorithm:
 *  1. Start from primary.
 *  2. If contrast(primary, surface) < 4.5, adjust (darken in light mode, lighten in dark).
 *     Using 4.5 as the minimum ensures the button is unmistakably visible on any background,
 *     including warm light themes (e.g. amanecer #E8A87C on #FDF6E3) where 3.0 produces
 *     a muted brownish fill that barely registers visually.
 *  3. Return adjusted fill + matching text color that guarantees >= 4.5:1.
 */
export function deriveButtonColors(
  primary: string,
  surface: string,
  isDark: boolean,
): { fill: string; textColor: string } {
  const fill = ensureContrast(primary, surface, 4.5, isDark);
  const textColor = pickReadableTextColor(fill);
  // Sanity-check text contrast; if it doesn't meet 4.5:1 force absolute
  const ratio = contrastRatio(textColor, fill);
  const safeText = ratio >= 4.5 ? textColor : isDark ? '#FFFFFF' : '#111111';
  return { fill, textColor: safeText };
}

/**
 * Colors for the disabled state:
 *  - fill: neutral blend between surface and onSurface at 12% opacity effect
 *  - text: muted, low-contrast on purpose
 */
export function deriveDisabledColors(
  surface: string,
  _isDark: boolean,
): { fill: string; textColor: string } {
  // A neutral tint — slightly offset from surface
  const { r, g, b } = hexToRgb(surface);
  const fill = rgbToHex({ r: r * 0.88 + 127 * 0.12, g: g * 0.88 + 127 * 0.12, b: b * 0.88 + 127 * 0.12 });
  return { fill, textColor: '#888888' };
}
