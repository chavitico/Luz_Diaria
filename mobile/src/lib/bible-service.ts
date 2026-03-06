// Bible Passage Service for the mobile app
// Handles fetching passages from the backend with local caching

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithTimeout } from './fetch';

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
 * Known Bible book names (Spanish + English) used to anchor reference detection.
 * Ordered from longest to shortest to avoid partial matches.
 */
const BIBLE_BOOK_NAMES_ES = [
  'Génesis', 'Genesis', 'Éxodo', 'Exodo', 'Levítico', 'Levitico', 'Números', 'Numeros',
  'Deuteronomio', 'Josué', 'Josue', 'Jueces', 'Rut', 'Esdras', 'Nehemías', 'Nehemias',
  'Ester', 'Job', 'Salmos', 'Salmo', 'Proverbios', 'Eclesiastés', 'Eclesiastes',
  'Cantares', 'Isaías', 'Isaias', 'Jeremías', 'Jeremias', 'Lamentaciones',
  'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Amos', 'Abdías', 'Abdias',
  'Jonás', 'Jonas', 'Miqueas', 'Nahúm', 'Nahum', 'Habacuc', 'Sofonías', 'Sofonias',
  'Hageo', 'Zacarías', 'Zacarias', 'Malaquías', 'Malaquias',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos',
  'Corintios', 'Gálatas', 'Galatas', 'Efesios', 'Filipenses', 'Colosenses',
  'Tesalonicenses', 'Timoteo', 'Tito', 'Filemón', 'Filemon',
  'Hebreos', 'Santiago', 'Pedro', 'Judas', 'Apocalipsis',
  // Numbered books (book part only, number handled separately)
  'Samuel', 'Reyes', 'Crónicas', 'Cronicas',
];

const BIBLE_BOOK_NAMES_EN = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges',
  'Ruth', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm', 'Proverbs',
  'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
  'John', 'Acts', 'Romans', 'Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', 'Thessalonians', 'Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', 'Peter', 'Jude', 'Revelation',
  'Samuel', 'Kings', 'Chronicles',
];

const ALL_BOOK_NAMES = [...new Set([...BIBLE_BOOK_NAMES_ES, ...BIBLE_BOOK_NAMES_EN])]
  .sort((a, b) => b.length - a.length); // longest first to prevent partial matches

/**
 * Build a regex pattern to match Bible references in text.
 * Supports:
 * - "Lucas 10:25-37" or "Lucas 10:25–37" (dash or en-dash)
 * - "Juan 3:16"
 * - "1 Reyes 3:28", "2 Corintios 5:17"
 * - References in parentheses: "(Lucas 10:25-37)"
 * - Chapter-only references: "Salmo 51", "2 Samuel 11", "Génesis 37"
 * - Ranges with en-dash: "Marcos 4:30–32"
 */
function buildBibleReferenceRegex(): RegExp {
  const bookPattern = ALL_BOOK_NAMES.join('|');
  // Matches: optional (  optional leading digit+space  bookName  chapter  optional :verse(-verseEnd)  optional )
  return new RegExp(
    `\\(?` +                                    // optional opening paren
    `([123]\\s+)?` +                            // optional number prefix: "1 ", "2 ", "3 "
    `(${bookPattern})` +                         // book name
    `\\s+(\\d+)` +                              // chapter number
    `(?::(\\d+)(?:[-–](\\d+))?)?` +            // optional :verse(-verseEnd)
    `\\)?`,                                     // optional closing paren
    'g'
  );
}

const BIBLE_REFERENCE_REGEX = buildBibleReferenceRegex();
// Note: BIBLE_REFERENCE_REGEX is defined here for potential external use.
// findReferencesInText() rebuilds a fresh regex each call to avoid stale lastIndex state.

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

  // We need to rebuild the regex each call to reset lastIndex
  const regex = buildBibleReferenceRegex();

  let match;
  while ((match = regex.exec(text)) !== null) {
    // Avoid matching things like "Juan 3 años" — require the match to be followed by
    // a non-word character (or end of string) to reduce false positives on chapter-only refs
    const afterMatch = text[match.index + match[0].length];
    if (afterMatch && /[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(afterMatch)) {
      // Likely a false positive — part of a larger word
      continue;
    }

    // Also skip if the character before is a letter (partial word match)
    if (match.index > 0 && /[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(text[match.index - 1]!)) {
      continue;
    }

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
    const response = await fetchWithTimeout(url);

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
