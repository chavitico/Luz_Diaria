// Bible API client — loads chapters and verses from our backend
// The backend integrates API.bible (with BibleGateway fallback) and caches results

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BibleChapterData, BibleVerse, BibleSearchResult, BibleLastRead } from './types';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const CHAPTER_CACHE_PREFIX = 'bible_chapter_v1_';
const LAST_READ_KEY = 'bible_last_read_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — Bible text is immutable

// ─── In-memory session cache ──────────────────────────────────────────────────
const sessionCache = new Map<string, BibleChapterData>();

function chapterCacheKey(bookId: string, chapter: number, lang: string): string {
  return `${CHAPTER_CACHE_PREFIX}${bookId}_${chapter}_${lang}`;
}

// ─── Persistent cache ─────────────────────────────────────────────────────────
async function readFromDisk(key: string): Promise<BibleChapterData | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: BibleChapterData; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeToDisk(key: string, data: BibleChapterData): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // silent — disk cache is optional
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all verses of a Bible chapter.
 * Order of resolution: session cache → disk cache → backend → error.
 */
export async function fetchBibleChapter(
  bookId: string,
  chapter: number,
  lang: 'en' | 'es' = 'es'
): Promise<{ success: true; data: BibleChapterData } | { success: false; error: string }> {
  const key = chapterCacheKey(bookId, chapter, lang);

  // 1. Session cache
  const inMemory = sessionCache.get(key);
  if (inMemory) {
    console.log(`[Bible] Session cache hit: ${bookId} ${chapter} (${lang})`);
    return { success: true, data: inMemory };
  }

  // 2. Disk cache
  const onDisk = await readFromDisk(key);
  if (onDisk) {
    console.log(`[Bible] Disk cache hit: ${bookId} ${chapter} (${lang})`);
    sessionCache.set(key, onDisk);
    return { success: true, data: onDisk };
  }

  // 3. Backend
  try {
    console.log(`[Bible] Fetching from backend: ${bookId} ${chapter} (${lang})`);
    const url = `${BACKEND_URL}/api/bible/chapter?bookId=${encodeURIComponent(bookId)}&chapter=${chapter}&lang=${lang}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      return { success: false, error: err.error ?? 'Error al cargar el capítulo' };
    }

    const json = await res.json() as {
      success: boolean;
      bookName: string;
      chapter: number;
      verses: BibleVerse[];
      error?: string;
    };

    if (!json.success || !json.verses?.length) {
      return { success: false, error: json.error ?? 'Capítulo no disponible' };
    }

    const data: BibleChapterData = {
      bookId,
      bookName: json.bookName,
      chapter: json.chapter,
      verses: json.verses,
      lang,
    };

    // Cache
    sessionCache.set(key, data);
    await writeToDisk(key, data);

    return { success: true, data };
  } catch (e) {
    console.error('[Bible] Fetch error:', e);
    return { success: false, error: 'Sin conexión. Intenta de nuevo.' };
  }
}

/**
 * getBibleVerse — test / utility function.
 * Returns the text of a single verse, or null if not available.
 *
 * Example: getBibleVerse('GEN', 1, 1)  →  "En el principio creó Dios los cielos y la tierra."
 */
export async function getBibleVerse(
  bookId: string,
  chapter: number,
  verse: number,
  lang: 'en' | 'es' = 'es'
): Promise<string | null> {
  const result = await fetchBibleChapter(bookId, chapter, lang);
  if (!result.success) return null;
  const found = result.data.verses.find(v => v.number === verse);
  return found?.text ?? null;
}

/**
 * Validation helper — logs Genesis 1:1 to confirm the data pipeline is working.
 * Call this at app startup or from a test button.
 */
export async function validateBibleDataLoad(): Promise<void> {
  console.log('[Bible] Validating data load — fetching Genesis 1:1...');
  const text = await getBibleVerse('GEN', 1, 1, 'es');
  if (text) {
    console.log('[Bible] ✓ Genesis 1:1 loaded:', text);
  } else {
    console.warn('[Bible] ✗ Genesis 1:1 FAILED — check backend or network');
  }
}

/**
 * Clear all locally cached Bible chapters (for dev/maintenance).
 */
export async function clearBibleChapterCache(): Promise<void> {
  sessionCache.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const bibleKeys = keys.filter(k => k.startsWith(CHAPTER_CACHE_PREFIX));
    await AsyncStorage.multiRemove(bibleKeys);
    console.log('[Bible] Chapter cache cleared');
  } catch {
    // ignore
  }
}

// ─── Last-read persistence ─────────────────────────────────────────────────────

export async function saveLastRead(data: BibleLastRead): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(data));
  } catch {
    // silent
  }
}

export async function loadLastRead(): Promise<BibleLastRead | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_READ_KEY);
    return raw ? (JSON.parse(raw) as BibleLastRead) : null;
  } catch {
    return null;
  }
}

// ─── Verse content search ──────────────────────────────────────────────────────

/**
 * Search Bible verse content on the backend.
 * Searches through cached devotional verses and Bible passages.
 * Returns up to `limit` matching results.
 */
export async function searchBibleVerses(
  query: string,
  lang: 'en' | 'es' = 'es',
  limit = 15
): Promise<BibleSearchResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const url = `${BACKEND_URL}/api/bible/search?q=${encodeURIComponent(query)}&lang=${lang}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { results?: BibleSearchResult[] };
    return json.results ?? [];
  } catch {
    return [];
  }
}
