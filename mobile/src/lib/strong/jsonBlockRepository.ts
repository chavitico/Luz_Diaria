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
  // ── Old Testament (39 books) ─────────────────────────────────────────────
  GEN: () => require('./alignment/align_GEN.json'),
  EXO: () => require('./alignment/align_EXO.json'),
  LEV: () => require('./alignment/align_LEV.json'),
  NUM: () => require('./alignment/align_NUM.json'),
  DEU: () => require('./alignment/align_DEU.json'),
  JOS: () => require('./alignment/align_JOS.json'),
  JDG: () => require('./alignment/align_JDG.json'),
  RUT: () => require('./alignment/align_RUT.json'),
  '1SA': () => require('./alignment/align_1SA.json'),
  '2SA': () => require('./alignment/align_2SA.json'),
  '1KI': () => require('./alignment/align_1KI.json'),
  '2KI': () => require('./alignment/align_2KI.json'),
  '1CH': () => require('./alignment/align_1CH.json'),
  '2CH': () => require('./alignment/align_2CH.json'),
  EZR: () => require('./alignment/align_EZR.json'),
  NEH: () => require('./alignment/align_NEH.json'),
  EST: () => require('./alignment/align_EST.json'),
  JOB: () => require('./alignment/align_JOB.json'),
  PSA: () => require('./alignment/align_PSA.json'),
  PRO: () => require('./alignment/align_PRO.json'),
  ECC: () => require('./alignment/align_ECC.json'),
  SNG: () => require('./alignment/align_SNG.json'),
  ISA: () => require('./alignment/align_ISA.json'),
  JER: () => require('./alignment/align_JER.json'),
  LAM: () => require('./alignment/align_LAM.json'),
  EZK: () => require('./alignment/align_EZK.json'),
  DAN: () => require('./alignment/align_DAN.json'),
  HOS: () => require('./alignment/align_HOS.json'),
  JOE: () => require('./alignment/align_JOE.json'),
  AMO: () => require('./alignment/align_AMO.json'),
  OBA: () => require('./alignment/align_OBA.json'),
  JON: () => require('./alignment/align_JON.json'),
  MIC: () => require('./alignment/align_MIC.json'),
  NAH: () => require('./alignment/align_NAH.json'),
  HAB: () => require('./alignment/align_HAB.json'),
  ZEP: () => require('./alignment/align_ZEP.json'),
  HAG: () => require('./alignment/align_HAG.json'),
  ZEC: () => require('./alignment/align_ZEC.json'),
  MAL: () => require('./alignment/align_MAL.json'),
  // ── New Testament (27 books) ─────────────────────────────────────────────
  MAT: () => require('./alignment/align_MAT.json'),
  MRK: () => require('./alignment/align_MRK.json'),
  LUK: () => require('./alignment/align_LUK.json'),
  JHN: () => require('./alignment/align_JHN.json'),
  ACT: () => require('./alignment/align_ACT.json'),
  ROM: () => require('./alignment/align_ROM.json'),
  '1CO': () => require('./alignment/align_1CO.json'),
  '2CO': () => require('./alignment/align_2CO.json'),
  GAL: () => require('./alignment/align_GAL.json'),
  EPH: () => require('./alignment/align_EPH.json'),
  PHP: () => require('./alignment/align_PHP.json'),
  COL: () => require('./alignment/align_COL.json'),
  '1TH': () => require('./alignment/align_1TH.json'),
  '2TH': () => require('./alignment/align_2TH.json'),
  '1TI': () => require('./alignment/align_1TI.json'),
  '2TI': () => require('./alignment/align_2TI.json'),
  TIT: () => require('./alignment/align_TIT.json'),
  PHM: () => require('./alignment/align_PHM.json'),
  HEB: () => require('./alignment/align_HEB.json'),
  JAS: () => require('./alignment/align_JAS.json'),
  '1PE': () => require('./alignment/align_1PE.json'),
  '2PE': () => require('./alignment/align_2PE.json'),
  '1JN': () => require('./alignment/align_1JN.json'),
  '2JN': () => require('./alignment/align_2JN.json'),
  '3JN': () => require('./alignment/align_3JN.json'),
  JUD: () => require('./alignment/align_JUD.json'),
  REV: () => require('./alignment/align_REV.json'),
};

/**
 * Returns true if the given book has Strong alignment data (all chapters covered).
 * Uses the ALIGNMENT_LOADERS registry as the source of truth — no static chapter list needed.
 */
export function hasStrongCoverage(bookId: string, _chapter: number): boolean {
  return bookId in ALIGNMENT_LOADERS;
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
    // Uses NFD normalization to strip diacritics (e.g. "emphysao" matches "emphysáō").
    if (results.length < limit) {
      const stripDiacritics = (s: string) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const qEn = stripDiacritics(query.toLowerCase());

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
            stripDiacritics(raw.transliteration.toLowerCase()).includes(qEn) ||
            stripDiacritics(raw.shortDefinition.toLowerCase()).includes(qEn) ||
            stripDiacritics(raw.longDefinition.toLowerCase()).includes(qEn)
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
