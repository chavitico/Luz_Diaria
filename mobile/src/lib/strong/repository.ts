// Strong's Concordance — Repository Layer
//
// This layer decouples all Strong data access from the raw data sources.
// UI and service code must ONLY access Strong data through this interface —
// never by importing mockData.ts or block files directly.
//
// ─── Architecture overview ────────────────────────────────────────────────────
//
//  ┌──────────────────────────────────────────────────────────────────────────┐
//  │  UI (bible.tsx, StrongSheet.tsx)                                         │
//  │       ↓ imports only from service.ts                                     │
//  │  service.ts  ──→  IStrongRepository  ←─── JsonBlockStrongRepository (✓) │
//  │                                      ←─── SQLiteStrongRepository (later) │
//  │             JsonBlockStrongRepository ──→ data/strong_*.json (15 blocks) │
//  │             JsonBlockStrongRepository ──→ mockData.ts (verse links only) │
//  └──────────────────────────────────────────────────────────────────────────┘
//
// ─── Dataset status ───────────────────────────────────────────────────────────
//
//  ✅  Strong entries (H1–H8674, G1–G5624): loaded from JSON blocks (real data)
//  ⏳  Verse word links: still from mockData.ts (needs alignment data in Etapa 4)
//  ⏳  relatedVerses per entry: empty until alignment data (Etapa 4)
//
// ─── To swap the backing store ────────────────────────────────────────────────
//
//  1. Implement a class that satisfies IStrongRepository
//  2. Replace the singleton assignment at the bottom of this file
//  3. No other files need to change
//
// ─────────────────────────────────────────────────────────────────────────────

import type { StrongEntry, VerseWordLink } from './types';
import { STRONG_ENTRIES, VERSE_STRONG_LINKS } from './mockData';
import { JsonBlockStrongRepository } from './jsonBlockRepository';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IStrongRepository {
  /** Look up a single Strong entry by its canonical ID (e.g. "H430", "G25"). */
  getEntryById(strongId: string): StrongEntry | null;

  /** Return all word links for a given verse (format: "{BOOK}_{ch}_{v}"). */
  getVerseWordLinks(verseId: string): VerseWordLink[];

  /**
   * Return the list of related verse references for a Strong entry.
   * These are human-readable strings such as "Génesis 1:1".
   */
  getRelatedVerses(strongId: string): string[];

  /**
   * Search entries by query string (id, transliteration, or definition).
   * - Exact ID match (H430, g25) is handled as a fast path.
   * - options.language narrows the scan to Hebrew or Greek blocks only.
   * - options.limit caps results (default 50).
   */
  searchEntries(query: string, options?: { limit?: number; language?: 'Hebrew' | 'Greek' }): StrongEntry[];
}

// ─── Mock implementation ──────────────────────────────────────────────────────

/**
 * MockStrongRepository — backed by the static mockData.ts dataset.
 * Satisfies IStrongRepository. Replace or extend for production data.
 */
class MockStrongRepository implements IStrongRepository {
  getEntryById(strongId: string): StrongEntry | null {
    return STRONG_ENTRIES[strongId] ?? null;
  }

  getVerseWordLinks(verseId: string): VerseWordLink[] {
    return VERSE_STRONG_LINKS[verseId] ?? [];
  }

  getRelatedVerses(strongId: string): string[] {
    return STRONG_ENTRIES[strongId]?.relatedVerses ?? [];
  }

  searchEntries(query: string, options?: { limit?: number; language?: 'Hebrew' | 'Greek' }): StrongEntry[] {
    if (!query.trim()) return [];
    const limit = options?.limit ?? 50;
    const lang = options?.language;
    const q = query.toLowerCase();
    const results: StrongEntry[] = [];
    for (const entry of Object.values(STRONG_ENTRIES)) {
      if (lang && entry.language !== lang) continue;
      if (
        entry.id.toLowerCase().includes(q) ||
        entry.transliteration.toLowerCase().includes(q) ||
        entry.shortDefinition.toLowerCase().includes(q) ||
        entry.longDefinition.toLowerCase().includes(q)
      ) {
        results.push(entry);
        if (results.length >= limit) break;
      }
    }
    return results;
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────────
// Active: JsonBlockStrongRepository — reads from 15 bundled JSON block files.
// Fallback: MockStrongRepository — kept for testing and development only.
//
// To switch back to mock (e.g. during tests):
//   export const strongRepository: IStrongRepository = new MockStrongRepository();

export const strongRepository: IStrongRepository = new JsonBlockStrongRepository();
