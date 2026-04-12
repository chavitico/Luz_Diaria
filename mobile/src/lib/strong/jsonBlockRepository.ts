// Strong's Concordance — JSON Block Repository
//
// Loads Strong entries from pre-built JSON block files (see data/ directory).
// Blocks are ~400 KB each. A block is required and parsed only on first access,
// then held in an in-memory cache for the lifetime of the app session.
//
// Spanish search is handled via SPANISH_GLOSS_INDEX (spanishIndex.ts):
//   query → normalizeEs() → scan gloss keys → fetch matching IDs from blocks
// English search scans transliteration + shortDefinition + longDefinition.
// Both result sets are merged and deduplicated before returning.
//
// Satisfies IStrongRepository. Drop-in replacement for MockStrongRepository.

import type { IStrongRepository } from './repository';
import type { StrongEntry, VerseWordLink, VerseAppearance } from './types';
import type { BlockStrongEntry } from './data/blockTypes';
import { VERSE_STRONG_LINKS } from './mockData'; // fallback for verses not in alignment files
import {
  normalizeEs,
  SPANISH_GLOSS_INDEX,
  SPANISH_GLOSS_KEYS,
} from './spanishIndex';
import { spanishLocaleRepository } from './spanishLocaleRepository';

// ─── Block registry ───────────────────────────────────────────────────────────
// Metro requires statically-analyzable require() calls.
// We wrap each in an arrow function so they're called lazily, not at module load.

const BLOCK_LOADERS: Record<string, () => Record<string, BlockStrongEntry>> = {
  h_0001_1000: () => require('./data/strong_h_0001_1000.json'),
  h_1001_2000: () => require('./data/strong_h_1001_2000.json'),
  h_2001_3000: () => require('./data/strong_h_2001_3000.json'),
  h_3001_4000: () => require('./data/strong_h_3001_4000.json'),
  h_4001_5000: () => require('./data/strong_h_4001_5000.json'),
  h_5001_6000: () => require('./data/strong_h_5001_6000.json'),
  h_6001_7000: () => require('./data/strong_h_6001_7000.json'),
  h_7001_8000: () => require('./data/strong_h_7001_8000.json'),
  h_8001_8674: () => require('./data/strong_h_8001_8674.json'),
  g_0001_1000: () => require('./data/strong_g_0001_1000.json'),
  g_1001_2000: () => require('./data/strong_g_1001_2000.json'),
  g_2001_3001: () => require('./data/strong_g_2001_3001.json'),
  g_3002_4101: () => require('./data/strong_g_3002_4101.json'),
  g_4102_5101: () => require('./data/strong_g_4102_5101.json'),
  g_5102_5624: () => require('./data/strong_g_5102_5624.json'),
};

// Block ranges — sorted for binary search
const HEBREW_BLOCKS: [string, number, number][] = [
  ['h_0001_1000', 1,    1000],
  ['h_1001_2000', 1001, 2000],
  ['h_2001_3000', 2001, 3000],
  ['h_3001_4000', 3001, 4000],
  ['h_4001_5000', 4001, 5000],
  ['h_5001_6000', 5001, 6000],
  ['h_6001_7000', 6001, 7000],
  ['h_7001_8000', 7001, 8000],
  ['h_8001_8674', 8001, 8674],
];

const GREEK_BLOCKS: [string, number, number][] = [
  ['g_0001_1000', 1,    1000],
  ['g_1001_2000', 1001, 2000],
  ['g_2001_3001', 2001, 3001],
  ['g_3002_4101', 3002, 4101],
  ['g_4102_5101', 4102, 5101],
  ['g_5102_5624', 5102, 5624],
];

// ─── Alignment registry ───────────────────────────────────────────────────────
// Maps book prefix → lazy loader for the alignment JSON file.
// Each file is a VerseStrongMap: Record<verseId, VerseWordLink[]>.

type AlignmentMap = Record<string, VerseWordLink[]>;

const ALIGNMENT_LOADERS: Record<string, () => AlignmentMap> = {
  // Original pilot books
  GEN: () => require('./alignment/align_GEN.json'),
  EXO: () => require('./alignment/align_EXO.json'),
  PSA: () => require('./alignment/align_PSA.json'),
  JHN: () => require('./alignment/align_JHN.json'),
  ROM: () => require('./alignment/align_ROM.json'),
  // OT expansions
  LEV: () => require('./alignment/align_LEV.json'),
  NUM: () => require('./alignment/align_NUM.json'),
  DEU: () => require('./alignment/align_DEU.json'),
  JOS: () => require('./alignment/align_JOS.json'),
  PRO: () => require('./alignment/align_PRO.json'),
  ISA: () => require('./alignment/align_ISA.json'),
  JER: () => require('./alignment/align_JER.json'),
  EZK: () => require('./alignment/align_EZK.json'),
  DAN: () => require('./alignment/align_DAN.json'),
  // NT expansions
  MAT: () => require('./alignment/align_MAT.json'),
  MRK: () => require('./alignment/align_MRK.json'),
  LUK: () => require('./alignment/align_LUK.json'),
  ACT: () => require('./alignment/align_ACT.json'),
  '1CO': () => require('./alignment/align_1CO.json'),
  '2CO': () => require('./alignment/align_2CO.json'),
  GAL: () => require('./alignment/align_GAL.json'),
  EPH: () => require('./alignment/align_EPH.json'),
  PHP: () => require('./alignment/align_PHP.json'),
  COL: () => require('./alignment/align_COL.json'),
  '1TH': () => require('./alignment/align_1TH.json'),
  HEB: () => require('./alignment/align_HEB.json'),
  JAS: () => require('./alignment/align_JAS.json'),
  '1PE': () => require('./alignment/align_1PE.json'),
  '1JN': () => require('./alignment/align_1JN.json'),
  REV: () => require('./alignment/align_REV.json'),
  '2TI': () => require('./alignment/align_2TI.json'),
};

// ─── Static coverage map ───────────────────────────────────────────────────────
// Pre-computed list of chapters (1-based) that have alignment data in each book.
// Generated from the actual alignment JSON files. Update when new data is added.

const STRONG_CHAPTER_COVERAGE: Record<string, Set<number>> = {
  GEN: new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]),
  EXO: new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]),
  LEV: new Set([19,26]),
  NUM: new Set([6,23,24]),
  DEU: new Set([6,7,8,28,29,30,31,32,33]),
  JOS: new Set([1,24]),
  PSA: new Set([1,2,8,16,19,22,23,24,25,27,32,33,34,37,46,51,90,91,100,103,107,119,121,127,130,139,145,146,147,148,149,150]),
  PRO: new Set([1,2,3,4,8,9,10,11,16,21,24,25,31]),
  ISA: new Set([1,6,7,9,11,25,26,35,40,41,42,43,44,45,46,48,49,50,51,52,53,55,58,60,61,64,65]),
  JER: new Set([1,17,29,31,32,33]),
  EZK: new Set([36,37]),
  DAN: new Set([1,2,3,6,7,9]),
  MAT: new Set([1,2,3,4,5,6,11,16,17,18,19,22,25,26,27,28]),
  MRK: new Set([1,2,5,8,10,11,14,15,16]),
  LUK: new Set([1,2,3,4,6,10,11,12,15,18,19,22,23,24]),
  JHN: new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),
  ACT: new Set([1,2,3,4,7,9,10,13,16,17,20,26,28]),
  ROM: new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
  '1CO': new Set([1,2,3,6,10,11,12,13,15]),
  '2CO': new Set([3,4,5,6,9,12]),
  GAL: new Set([1,2,3,4,5,6]),
  EPH: new Set([1,2,3,4,5,6]),
  PHP: new Set([1,2,3,4]),
  COL: new Set([1,2,3,4]),
  '1TH': new Set([4,5]),
  HEB: new Set([1,2,4,6,9,10,11,12,13]),
  JAS: new Set([1,2,3,4,5]),
  '1PE': new Set([1,2,3,4,5]),
  '1JN': new Set([1,2,3,4,5]),
  REV: new Set([1,3,4,5,7,8,12,19,21,22]),
  '2TI': new Set([3,4]),
};

/**
 * Returns true if the given book+chapter has Strong alignment data.
 * Use this to conditionally show/disable the Strong button in the UI.
 */
export function hasStrongCoverage(bookId: string, chapter: number): boolean {
  return STRONG_CHAPTER_COVERAGE[bookId]?.has(chapter) ?? false;
}

// ─── Adapter: BlockStrongEntry → StrongEntry ──────────────────────────────────
// Merges the base English entry with any available Spanish locale overlay.
// Spanish fields (shortDefinitionEs, longDefinitionEs, glossesEs) are set when
// a matching entry exists in locale/es/ — otherwise the fields remain undefined
// and the UI falls back to the English equivalents.

function toStrongEntry(b: BlockStrongEntry): StrongEntry {
  const es = spanishLocaleRepository.getOverlay(b.id);
  return {
    id:                 b.id,
    testament:          b.testament,
    lemmaOriginal:      b.lemmaOriginal,
    transliteration:    b.transliteration,
    language:           b.language,
    grammarCategory:    b.grammarCategory,
    shortDefinition:    b.shortDefinition,
    longDefinition:     b.longDefinition,
    occurrencesCount:   b.occurrencesCount,
    relatedVerses:      b.relatedVerses,
    isFavorite:         false, // managed externally by AsyncStorage
    // Spanish overlay (undefined when no locale entry exists)
    shortDefinitionEs:  es?.shortDefinitionEs,
    longDefinitionEs:   es?.longDefinitionEs,
    glossesEs:          es?.glossesEs,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class JsonBlockStrongRepository implements IStrongRepository {
  /** Loaded block data, keyed by blockId */
  private cache = new Map<string, Record<string, BlockStrongEntry>>();
  /** Loaded alignment data, keyed by book prefix (e.g. "GEN") */
  private alignmentCache = new Map<string, AlignmentMap>();

  // ── Block routing ─────────────────────────────────────────────────────────

  private resolveBlockId(strongId: string): string | null {
    const isHebrew = strongId.startsWith('H') || strongId.startsWith('h');
    const isGreek  = strongId.startsWith('G') || strongId.startsWith('g');
    if (!isHebrew && !isGreek) return null;

    const num = parseInt(strongId.slice(1), 10);
    if (isNaN(num)) return null;

    const blocks = isHebrew ? HEBREW_BLOCKS : GREEK_BLOCKS;
    for (const [id, start, end] of blocks) {
      if (num >= start && num <= end) return id;
    }
    return null;
  }

  private loadBlock(blockId: string): Record<string, BlockStrongEntry> {
    if (this.cache.has(blockId)) {
      return this.cache.get(blockId)!;
    }
    const loader = BLOCK_LOADERS[blockId];
    if (!loader) {
      console.warn('[Strong] no loader for block:', blockId);
      return {};
    }
    const data = loader();
    this.cache.set(blockId, data);
    return data;
  }

  // ── IStrongRepository ────────────────────────────────────────────────────

  getEntryById(strongId: string): StrongEntry | null {
    const blockId = this.resolveBlockId(strongId);
    if (!blockId) return null;
    const block = this.loadBlock(blockId);
    const raw = block[strongId];
    return raw ? toStrongEntry(raw) : null;
  }

  getVerseWordLinks(verseId: string): VerseWordLink[] {
    // Extract book prefix: "GEN_1_1" → "GEN"
    const bookPrefix = verseId.split('_')[0];
    const loader = ALIGNMENT_LOADERS[bookPrefix];

    if (loader) {
      // Lazy-load alignment file for this book
      let alignmentMap = this.alignmentCache.get(bookPrefix);
      if (!alignmentMap) {
        alignmentMap = loader();
        this.alignmentCache.set(bookPrefix, alignmentMap);
      }
      const links = alignmentMap[verseId];
      if (links && links.length > 0) return links;
    }

    // Fallback: mock data for verses not yet in alignment files
    return VERSE_STRONG_LINKS[verseId] ?? [];
  }

  getRelatedVerses(strongId: string): string[] {
    const entry = this.getEntryById(strongId);
    return entry?.relatedVerses ?? [];
  }

  searchEntries(query: string, options?: { limit?: number; language?: 'Hebrew' | 'Greek' }): StrongEntry[] {
    if (!query.trim()) return [];
    const limit = options?.limit ?? 50;
    const lang = options?.language;

    // ── Fast path: exact Strong ID (H430, g25) ────────────────────────────
    const normalized = query.trim().toUpperCase();
    if (/^[HG]\d+$/.test(normalized)) {
      const entry = this.getEntryById(normalized);
      return entry ? [entry] : [];
    }

    const seenIds = new Set<string>();
    const results: StrongEntry[] = [];

    const addEntry = (e: StrongEntry | null) => {
      if (!e || seenIds.has(e.id)) return;
      if (lang && e.language !== lang) return;
      seenIds.add(e.id);
      results.push(e);
    };

    // ── Phase 1: Spanish gloss index ──────────────────────────────────────
    // Normalize and match against Spanish keyword keys.
    // Exact match first, then prefix/substring match.
    const qEs = normalizeEs(query);

    // Exact key match
    if (SPANISH_GLOSS_INDEX[qEs]) {
      for (const id of SPANISH_GLOSS_INDEX[qEs]) {
        if (results.length >= limit) break;
        addEntry(this.getEntryById(id));
      }
    }

    // Substring match on remaining gloss keys (e.g. "amor" finds "amar", "amor de dios", …)
    if (results.length < limit) {
      for (const key of SPANISH_GLOSS_KEYS) {
        if (results.length >= limit) break;
        if (key === qEs) continue; // already handled above
        if (key.includes(qEs) || qEs.includes(key)) {
          for (const id of SPANISH_GLOSS_INDEX[key]) {
            if (results.length >= limit) break;
            addEntry(this.getEntryById(id));
          }
        }
      }
    }

    // ── Phase 2: English field scan ───────────────────────────────────────
    // Only loaded blocks are scanned first (already in cache); then unloaded.
    // Searches transliteration, shortDefinition, longDefinition.
    if (results.length < limit) {
      const qEn = query.toLowerCase();

      const blockIds = lang === 'Hebrew'
        ? Object.keys(BLOCK_LOADERS).filter(id => id.startsWith('h_'))
        : lang === 'Greek'
        ? Object.keys(BLOCK_LOADERS).filter(id => id.startsWith('g_'))
        : Object.keys(BLOCK_LOADERS);

      for (const blockId of blockIds) {
        if (results.length >= limit) break;
        const block = this.loadBlock(blockId);
        for (const raw of Object.values(block)) {
          if (results.length >= limit) break;
          if (
            raw.id.toLowerCase().includes(qEn) ||
            raw.transliteration.toLowerCase().includes(qEn) ||
            raw.shortDefinition.toLowerCase().includes(qEn) ||
            raw.longDefinition.toLowerCase().includes(qEn)
          ) {
            addEntry(toStrongEntry(raw));
          }
        }
      }
    }

    return results;
  }

  // ── Inverted index (strongId → appearances) ───────────────────────────────
  // Built lazily the first time getVerseAppearances() is called.
  // Scans all 5 alignment files once, then caches the result.

  private occurrenceIndex: Map<string, VerseAppearance[]> | null = null;

  private buildOccurrenceIndex(): void {
    const index = new Map<string, VerseAppearance[]>();
    for (const [bookPrefix, loader] of Object.entries(ALIGNMENT_LOADERS)) {
      let alignmentMap = this.alignmentCache.get(bookPrefix);
      if (!alignmentMap) {
        alignmentMap = loader();
        this.alignmentCache.set(bookPrefix, alignmentMap);
      }
      for (const [verseId, links] of Object.entries(alignmentMap)) {
        const parts = verseId.split('_');
        const bookId = parts[0];
        const chapter = parseInt(parts[1], 10);
        const verse = parseInt(parts[2], 10);
        for (const link of links) {
          const list = index.get(link.strongId) ?? [];
          list.push({ verseId, bookId, chapter, verse, displayedWord: link.displayedWord, wordIndex: link.wordIndex });
          index.set(link.strongId, list);
        }
      }
    }
    this.occurrenceIndex = index;
  }

  getVerseAppearances(strongId: string): VerseAppearance[] {
    if (!this.occurrenceIndex) this.buildOccurrenceIndex();
    return this.occurrenceIndex!.get(strongId) ?? [];
  }
}
