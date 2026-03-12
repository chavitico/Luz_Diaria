/**
 * Global Button Style Tokens
 *
 * These tokens define the canonical visual appearance for action buttons
 * across the entire app. They guarantee readability in both dark and light
 * mode by using fixed high-contrast color pairs instead of inheriting from
 * surrounding backgrounds.
 *
 * Rules:
 *  - PRIMARY:   solid brand fill, always-readable text via pickReadableTextColor
 *  - SECONDARY: neutral surface fill, visible border, dark readable text
 *  - DANGER:    solid red fill, always white text
 *  - GHOST:     transparent, primary-colored text
 *
 * Usage (inline style):
 *   import { BTN } from '@/lib/buttonStyles';
 *   <Pressable style={BTN.primary.container}><Text style={BTN.primary.label}>OK</Text></Pressable>
 *
 * Prefer using the <ActionButton> component when possible — it already uses
 * these semantics and adds press animations + accessibility roles.
 */

import { StyleSheet } from 'react-native';
import { pickReadableTextColor } from '@/lib/contrast';

// ─── Fixed-contrast palette ────────────────────────────────────────────────
//
// These are the fallback / baseline colors when you cannot use the full
// ActionButton component (e.g., inside a heavily customised modal). They work
// in both light and dark mode because they use opaque fills with guaranteed
// text contrast.

/** Solid neutral dark — always visible, works on any background. */
const NEUTRAL_DARK = '#1C1C1E';
/** Solid neutral light — always visible on dark overlays. */
const NEUTRAL_LIGHT = '#F2F2F7';
/** Danger red — universally recognisable, good contrast. */
const DANGER_RED = '#EF4444';
/** Danger red text — always white on red (ratio ~5.1:1). */
const DANGER_TEXT = '#FFFFFF';

// ─── Semantic tokens ──────────────────────────────────────────────────────

/** Minimum border radius used for action buttons (matches ActionButton md). */
export const BTN_RADIUS = 16;
/** Vertical padding for action buttons (md). */
export const BTN_PY = 14;
/** Horizontal padding for action buttons (md). */
export const BTN_PX = 20;

// ─── Helper: derive safe inline styles from a theme primary ───────────────

/**
 * Returns inline-style-compatible objects for a primary action button given
 * the theme primary color.  Use this when you cannot use <ActionButton>.
 *
 * @param primaryHex  - theme primary color, e.g. colors.primary
 * @param isDark      - current dark-mode flag
 */
export function getPrimaryButtonStyles(primaryHex: string, isDark: boolean) {
  const textColor = pickReadableTextColor(primaryHex);
  return {
    container: {
      backgroundColor: primaryHex,
      borderRadius: BTN_RADIUS,
      paddingVertical: BTN_PY,
      paddingHorizontal: BTN_PX,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    label: {
      color: textColor,
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
      textAlign: 'center' as const,
    },
  };
}

/**
 * Returns inline-style-compatible objects for a secondary action button.
 * Uses a neutral border + surface-like background that is always visible.
 *
 * @param primaryHex  - theme primary color (used for border tint)
 * @param isDark      - current dark-mode flag
 */
export function getSecondaryButtonStyles(primaryHex: string, isDark: boolean) {
  const bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#FFFFFF' : '#111111';
  const borderColor = isDark
    ? 'rgba(255,255,255,0.20)'
    : 'rgba(0,0,0,0.18)';
  return {
    container: {
      backgroundColor: bg,
      borderRadius: BTN_RADIUS,
      paddingVertical: BTN_PY,
      paddingHorizontal: BTN_PX,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor,
    },
    label: {
      color: textColor,
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
      textAlign: 'center' as const,
    },
  };
}

/**
 * Returns inline-style-compatible objects for a danger action button.
 * Always uses solid red fill with white text — never invisible.
 */
export function getDangerButtonStyles() {
  return {
    container: {
      backgroundColor: DANGER_RED,
      borderRadius: BTN_RADIUS,
      paddingVertical: BTN_PY,
      paddingHorizontal: BTN_PX,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    label: {
      color: DANGER_TEXT,
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
      textAlign: 'center' as const,
    },
  };
}

// ─── Static fallback styles (theme-agnostic) ──────────────────────────────
//
// Use these only when you have no access to theme colors at all.

export const BTN = StyleSheet.create({
  // Primary: dark pill — always readable on any modal overlay
  primaryContainer: {
    backgroundColor: NEUTRAL_DARK,
    borderRadius: BTN_RADIUS,
    paddingVertical: BTN_PY,
    paddingHorizontal: BTN_PX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Secondary: light pill — always readable on dark modal overlays
  secondaryContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BTN_RADIUS,
    paddingVertical: BTN_PY,
    paddingHorizontal: BTN_PX,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  secondaryLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Danger: red
  dangerContainer: {
    backgroundColor: DANGER_RED,
    borderRadius: BTN_RADIUS,
    paddingVertical: BTN_PY,
    paddingHorizontal: BTN_PX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLabel: {
    color: DANGER_TEXT,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
