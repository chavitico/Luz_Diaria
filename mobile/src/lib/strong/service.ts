// Strong's Concordance — Data Service
// All Strong data access is routed through IStrongRepository (repository.ts).
// This keeps UI and feature code decoupled from the backing data source.
// To swap to a real dataset: update the singleton in repository.ts — nothing
// else needs to change.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BIBLE_BOOKS } from '@/lib/bible/books';
import { STRONG_FAVORITES_KEY } from './mockData';
import { strongRepository } from './repository';
import type { StrongEntry, VerseWordLink, VerseToken } from './types';

// ─── Verse lookup ──────────────────────────────────────────────────────────────

/** Returns all word links for a given verse, or empty array if none. */
export function getVerseWordLinks(verseId: string): VerseWordLink[] {
  return strongRepository.getVerseWordLinks(verseId);
}

/** Returns the StrongEntry for a given id, or null if not found. */
export function getStrongEntry(strongId: string): StrongEntry | null {
  return strongRepository.getEntryById(strongId);
}

// ─── Reference parser ─────────────────────────────────────────────────────────

export interface ParsedVerseRef {
  bookId: string;
  chapter: number;
  verse: number;
}

/**
 * Parses a human-readable verse reference (Spanish or English) into
 * { bookId, chapter, verse } suitable for loadChapter().
 *
 * Supported formats:
 *   "Génesis 1:1"        → { bookId: 'GEN', chapter: 1, verse: 1 }
 *   "Salmos 23:1"        → { bookId: 'PSA', chapter: 23, verse: 1 }
 *   "1 Juan 4:8"         → { bookId: '1JN', chapter: 4, verse: 8 }
 *   "Éxodo 1:10"         → { bookId: 'EXO', chapter: 1, verse: 10 }
 *   "Genesis 1:1"        (English names also accepted)
 *
 * Returns null if the reference cannot be parsed or the book is not found.
 * Logs a warning in that case so callers can track it.
 */
export function parseVerseReference(ref: string): ParsedVerseRef | null {
  // Match: <book name> <chapter>:<verse>  or  <book name> <chapter>
  const match = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) {
    console.warn('[Strong] parseVerseReference: unrecognised format →', ref);
    return null;
  }

  const rawBook = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verse   = match[3] != null ? parseInt(match[3], 10) : 1;

  if (isNaN(chapter) || chapter < 1 || isNaN(verse) || verse < 1) {
    console.warn('[Strong] parseVerseReference: invalid numbers →', ref);
    return null;
  }

  // Normalize: remove accent marks for a looser comparison
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normRaw = normalize(rawBook);

  const book = BIBLE_BOOKS.find(
    b => normalize(b.name) === normRaw || normalize(b.nameEn) === normRaw
  );

  if (!book) {
    console.warn('[Strong] parseVerseReference: book not found →', rawBook, '(from:', ref, ')');
    return null;
  }

  console.log('[Strong] parseVerseReference:', ref, '→', book.id, chapter, verse);
  return { bookId: book.id, chapter, verse };
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
