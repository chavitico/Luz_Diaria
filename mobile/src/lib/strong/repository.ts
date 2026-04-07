// Strong's Concordance — Repository Layer
//
// This layer decouples all Strong data access from the raw data sources.
// UI and service code must ONLY access Strong data through this interface —
// never by importing mockData.ts directly.
//
// ─── Architecture overview ────────────────────────────────────────────────────
//
//  ┌──────────────────────────────────────────────────────────────────────────┐
//  │  UI (bible.tsx, StrongSheet.tsx)                                         │
//  │       ↓ imports only from service.ts                                     │
//  │  service.ts  ──→  IStrongRepository  ←─── MockStrongRepository  (now)   │
//  │                                      ←─── SQLiteStrongRepository (later) │
//  │                   mockData.ts  ← MockStrongRepository only               │
//  └──────────────────────────────────────────────────────────────────────────┘
//
// ─── Scaling strategy (Etapa 3+) ─────────────────────────────────────────────
//
//  Option A — Bundled JSON blocks (recommended for offline-first MVP):
//    Split the full Strong dataset (~8 800 Hebrew + ~5 600 Greek entries) into
//    language/testament blocks (e.g. strong_ot_h0001-h2000.json). Lazy-load the
//    relevant block when the user enters a testament. Keep a small LRU cache in
//    memory (e.g. last 30 entries). Total storage: ~8 MB, zero server cost.
//
//    Migration path: implement `JsonBlockStrongRepository` that satisfies
//    IStrongRepository, swap the singleton assignment below. Zero changes to
//    service.ts or UI code.
//
//  Option B — SQLite via expo-sqlite (recommended when user library is large):
//    Pre-bundle a SQLite DB with the full Strong dataset. Use expo-sqlite
//    FTS5 for full-text search across definitions. Async API — service.ts
//    helper functions will need async variants (already prepared via AsyncStorage
//    pattern used for favorites). Typical DB size: ~12 MB.
//
//    Migration path: implement `SQLiteStrongRepository` satisfying
//    IStrongRepository, swap the singleton. Only service.ts async wrappers
//    need updating; UI is unaffected.
//
//  Decision criteria:
//    - Offline required + simple lookup → Option A (JSON blocks)
//    - Full-text search + annotations needed → Option B (SQLite)
//
// ─────────────────────────────────────────────────────────────────────────────

import type { StrongEntry, VerseWordLink } from './types';
import { STRONG_ENTRIES, VERSE_STRONG_LINKS } from './mockData';

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
   * Returns up to `limit` results (default 20).
   * Intended for a future search screen; currently backed by in-memory scan.
   */
  searchEntries(query: string, limit?: number): StrongEntry[];
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

  searchEntries(query: string, limit = 20): StrongEntry[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: StrongEntry[] = [];
    for (const entry of Object.values(STRONG_ENTRIES)) {
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
// To swap in a different backing store (SQLite, JSON blocks, remote API):
//   1. Implement a class that satisfies IStrongRepository
//   2. Replace `new MockStrongRepository()` with your new class
//   3. No other files need to change.

export const strongRepository: IStrongRepository = new MockStrongRepository();
