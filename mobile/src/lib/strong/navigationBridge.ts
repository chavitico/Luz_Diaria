// ─── Strong Navigation Bridge ─────────────────────────────────────────────────
// Lightweight module-level store for pending Bible navigation triggered from
// the Strong occurrences screen. The bible tab reads and consumes this on focus.

interface BibleNavTarget {
  bookId: string;
  chapter: number;
  verse: number;
}

let pending: BibleNavTarget | null = null;

/** Call before navigating to /(tabs)/bible to tell it where to go. */
export function setStrongNavTarget(bookId: string, chapter: number, verse: number): void {
  pending = { bookId, chapter, verse };
}

/** Call inside bible.tsx useFocusEffect — returns and clears the pending nav. */
export function consumeStrongNavTarget(): BibleNavTarget | null {
  const p = pending;
  pending = null;
  return p;
}
