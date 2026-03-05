import { useTextScale } from './store';

/**
 * Hook that returns sFont(px) — a function that scales any pixel size
 * by the user's global text zoom setting (0.85 – 1.40, default 1.0).
 *
 * Usage in components:
 *   const { sFont } = useScaledFont();
 *   <Text style={{ fontSize: sFont(16) }}>Hello</Text>
 */
export function useScaledFont() {
  const textScale = useTextScale();
  const sFont = (px: number) => Math.round(px * textScale);
  return { sFont, textScale };
}
