// Bible Passage Service for the mobile app
// Handles fetching passages from the backend with local caching

import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const CACHE_KEY_PREFIX = 'bible_passage_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache for current session
const memoryCache = new Map<string, { text: string; referenceDisplay: string; book: string; timestamp: number }>();

export interface BiblePassage {
  referenceDisplay: string;
  text: string;
  book: string;
}

export interface ParsedReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  fullReference: string;
}

/**
 * Regex pattern to match Bible references in text
 * Supports:
 * - "Lucas 10:25-37" or "Lucas 10:25–37" (dash or en-dash)
 * - "Juan 3:16"
 * - "1 Reyes 3:28", "2 Corintios 5:17"
 * - References in parentheses: "(Lucas 10:25-37)"
 */
const BIBLE_REFERENCE_REGEX = /(?:\()?(\d?\s*[A-Za-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]+)?)\s+(\d+):(\d+)(?:[-–](\d+))?(?:\))?/g;

/**
 * Clean a Bible reference by removing prepositions and extra text
 */
function cleanBibleReference(reference: string): string {
  // Remove parentheses
  let cleaned = reference.replace(/[()]/g, '').trim();

  // Remove common prepositions at the start (Spanish and English)
  // "En Efesios 4:32" -> "Efesios 4:32"
  // "In John 3:16" -> "John 3:16"
  cleaned = cleaned.replace(/^(en|in|from|de|según|segun|see|ver)\s+/i, '');

  return cleaned.trim();
}

/**
 * Parse a single Bible reference string
 */
export function parseReference(reference: string): ParsedReference | null {
  // Clean the reference
  const cleaned = cleanBibleReference(reference);

  const regex = /^(\d?\s*[A-Za-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]+)?)\s+(\d+):(\d+)(?:[-–](\d+))?$/i;
  const match = cleaned.match(regex);

  if (!match) {
    return null;
  }

  const book = match[1]?.trim();
  const chapter = match[2];
  const verseStart = match[3];
  const verseEnd = match[4];

  if (!book || !chapter || !verseStart) {
    return null;
  }

  return {
    book,
    chapter: parseInt(chapter, 10),
    verseStart: parseInt(verseStart, 10),
    verseEnd: verseEnd ? parseInt(verseEnd, 10) : null,
    fullReference: cleaned,
  };
}

/**
 * Find all Bible references in a text string
 * Returns array of { reference, startIndex, endIndex }
 */
export function findReferencesInText(text: string): Array<{ reference: string; startIndex: number; endIndex: number }> {
  const references: Array<{ reference: string; startIndex: number; endIndex: number }> = [];

  let match;
  const regex = new RegExp(BIBLE_REFERENCE_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    references.push({
      reference: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return references;
}

/**
 * Create a cache key for a reference
 */
function getCacheKey(reference: string, lang: 'en' | 'es'): string {
  const cleaned = cleanBibleReference(reference);
  const normalized = cleaned
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[-–]/g, '-')
    .replace(/:/g, '_');
  return `${CACHE_KEY_PREFIX}${lang}_${normalized}`;
}

/**
 * Get passage from memory cache
 */
function getFromMemoryCache(reference: string, lang: 'en' | 'es'): BiblePassage | null {
  const key = getCacheKey(reference, lang);
  const cached = memoryCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
    return {
      referenceDisplay: cached.referenceDisplay,
      text: cached.text,
      book: cached.book,
    };
  }

  return null;
}

/**
 * Save passage to memory cache
 */
function saveToMemoryCache(reference: string, lang: 'en' | 'es', passage: BiblePassage): void {
  const key = getCacheKey(reference, lang);
  memoryCache.set(key, {
    ...passage,
    timestamp: Date.now(),
  });
}

/**
 * Get passage from persistent cache (AsyncStorage)
 */
async function getFromPersistentCache(reference: string, lang: 'en' | 'es'): Promise<BiblePassage | null> {
  try {
    const key = getCacheKey(reference, lang);
    const cached = await AsyncStorage.getItem(key);

    if (cached) {
      const parsed = JSON.parse(cached) as { passage: BiblePassage; timestamp: number };
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        // Also save to memory cache
        saveToMemoryCache(reference, lang, parsed.passage);
        return parsed.passage;
      }
    }

    return null;
  } catch (error) {
    console.error('[Bible] Error reading from persistent cache:', error);
    return null;
  }
}

/**
 * Save passage to persistent cache
 */
async function saveToPersistentCache(reference: string, lang: 'en' | 'es', passage: BiblePassage): Promise<void> {
  try {
    const key = getCacheKey(reference, lang);
    await AsyncStorage.setItem(key, JSON.stringify({
      passage,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('[Bible] Error saving to persistent cache:', error);
  }
}

/**
 * Fetch a Bible passage
 * Checks caches first, then fetches from backend API
 */
export async function fetchBiblePassage(
  reference: string,
  lang: 'en' | 'es'
): Promise<{ success: boolean; passage?: BiblePassage; error?: string }> {
  // 1. Check memory cache
  const memoryCached = getFromMemoryCache(reference, lang);
  if (memoryCached) {
    console.log('[Bible] Memory cache hit:', reference);
    return { success: true, passage: memoryCached };
  }

  // 2. Check persistent cache
  const persistentCached = await getFromPersistentCache(reference, lang);
  if (persistentCached) {
    console.log('[Bible] Persistent cache hit:', reference);
    return { success: true, passage: persistentCached };
  }

  // 3. Fetch from backend API
  try {
    console.log('[Bible] Fetching from API:', reference, lang);

    const url = `${BACKEND_URL}/api/bible/passage?reference=${encodeURIComponent(reference)}&lang=${lang}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      return {
        success: false,
        error: errorData.error || (lang === 'es' ? 'Error al obtener el pasaje' : 'Error fetching passage'),
      };
    }

    const data = await response.json() as { success: boolean; passage?: BiblePassage; error?: string };

    if (data.success && data.passage) {
      // Cache the result
      saveToMemoryCache(reference, lang, data.passage);
      await saveToPersistentCache(reference, lang, data.passage);

      console.log('[Bible] Cached passage:', reference);
      return { success: true, passage: data.passage };
    }

    return {
      success: false,
      error: data.error || (lang === 'es' ? 'Pasaje no encontrado' : 'Passage not found'),
    };
  } catch (error) {
    console.error('[Bible] Error fetching passage:', error);
    return {
      success: false,
      error: lang === 'es' ? 'Sin conexión. Intenta de nuevo.' : 'No connection. Try again.',
    };
  }
}

/**
 * Clear all cached passages (for debugging/maintenance)
 */
export async function clearBibleCache(): Promise<void> {
  memoryCache.clear();

  try {
    const keys = await AsyncStorage.getAllKeys();
    const bibleKeys = keys.filter(k => k.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(bibleKeys);
    console.log('[Bible] Cache cleared');
  } catch (error) {
    console.error('[Bible] Error clearing cache:', error);
  }
}
