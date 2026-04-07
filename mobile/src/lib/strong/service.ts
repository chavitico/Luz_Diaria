// Strong's Concordance — Data Service
// MVP: resolves StrongEntry and VerseWordLink from mock dataset.
// TODO: Replace mock lookups with real API/dataset calls.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STRONG_ENTRIES,
  VERSE_STRONG_LINKS,
  STRONG_FAVORITES_KEY,
} from './mockData';
import type { StrongEntry, VerseWordLink, VerseToken } from './types';

// ─── Verse lookup ──────────────────────────────────────────────────────────────

/** Returns all word links for a given verse, or empty array if none. */
export function getVerseWordLinks(verseId: string): VerseWordLink[] {
  return VERSE_STRONG_LINKS[verseId] ?? [];
}

/** Returns the StrongEntry for a given id, or null if not found. */
export function getStrongEntry(strongId: string): StrongEntry | null {
  return STRONG_ENTRIES[strongId] ?? null;
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

/**
 * Tokenizes a verse string into an array of VerseToken objects.
 * Splits on whitespace, preserving word positions for Strong linking.
 * Strips punctuation from the word for comparison but keeps it in display.
 */
export function tokenizeVerse(text: string): VerseToken[] {
  const parts = text.split(' ');
  return parts.map((word, index) => ({
    word,
    hasSpace: index < parts.length - 1,
    index,
    strongId: undefined, // populated by enrichTokens
  }));
}

/**
 * Enriches an array of VerseToken with strongId references from the links map.
 * Matching is done by wordIndex (position), which is the most reliable for MVP.
 */
export function enrichTokensWithStrong(
  tokens: VerseToken[],
  links: VerseWordLink[]
): VerseToken[] {
  if (links.length === 0) return tokens;
  const linkMap: Record<number, string> = {};
  for (const link of links) {
    linkMap[link.wordIndex] = link.strongId;
  }
  return tokens.map(token =>
    linkMap[token.index] != null
      ? { ...token, strongId: linkMap[token.index] }
      : token
  );
}

// ─── Favorites ────────────────────────────────────────────────────────────────

/** Load the set of favorited Strong IDs from AsyncStorage. */
export async function loadStrongFavorites(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STRONG_FAVORITES_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/** Toggle the favorite status of a Strong entry and persist it. */
export async function toggleStrongFavorite(
  strongId: string,
  currentFavorites: Set<string>
): Promise<Set<string>> {
  const next = new Set(currentFavorites);
  if (next.has(strongId)) {
    next.delete(strongId);
  } else {
    next.add(strongId);
  }
  try {
    await AsyncStorage.setItem(
      STRONG_FAVORITES_KEY,
      JSON.stringify([...next])
    );
  } catch {}
  return next;
}

// ─── Strong Mode persistence ──────────────────────────────────────────────────

const STRONG_MODE_KEY = 'bible_strong_mode_v1';

/** Persist Strong Mode active state across sessions. */
export async function saveStrongModeState(active: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STRONG_MODE_KEY, active ? '1' : '0');
  } catch {}
}

/** Load the persisted Strong Mode active state. */
export async function loadStrongModeState(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STRONG_MODE_KEY);
    return val === '1';
  } catch {
    return false;
  }
}
