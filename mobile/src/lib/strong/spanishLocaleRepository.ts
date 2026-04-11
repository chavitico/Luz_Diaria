// spanishLocaleRepository.ts
// Lazy-loading repository for Spanish locale overlays.
//
// Architecture:
//   • JSON blocks mirror the base Strong dictionary ranges (same naming convention).
//   • Each block is a sparse map: only entries with Spanish data are included.
//   • Blocks are loaded lazily (require on first access) and cached in memory.
//   • getOverlay(strongId) returns the SpanishOverlay or null — callers fall back
//     to the English fields from the base StrongEntry when null is returned.
//
// Adding new entries:
//   1. Identify the correct block for the Strong ID.
//   2. Add the entry to that JSON file: { shortDefinitionEs, glossesEs, longDefinitionEs? }
//   3. No code changes needed — the loader discovers entries automatically.

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SpanishOverlay {
  shortDefinitionEs: string;
  longDefinitionEs?: string;
  glossesEs?: string[];
}

type BlockData = Record<string, SpanishOverlay>;

// ─── Block loaders (static require() for Metro bundler) ───────────────────────

const LOCALE_BLOCK_LOADERS: Record<string, () => BlockData> = {
  // Hebrew blocks (match base dictionary ranges)
  'es_h_0001_1000': () => require('./locale/es/strong_es_h_0001_1000.json'),
  'es_h_1001_2000': () => require('./locale/es/strong_es_h_1001_2000.json'),
  'es_h_2001_3000': () => require('./locale/es/strong_es_h_2001_3000.json'),
  'es_h_3001_4000': () => require('./locale/es/strong_es_h_3001_4000.json'),
  'es_h_4001_5000': () => require('./locale/es/strong_es_h_4001_5000.json'),
  'es_h_5001_6000': () => require('./locale/es/strong_es_h_5001_6000.json'),
  'es_h_6001_7000': () => require('./locale/es/strong_es_h_6001_7000.json'),
  'es_h_7001_8000': () => require('./locale/es/strong_es_h_7001_8000.json'),
  'es_h_8001_8674': () => require('./locale/es/strong_es_h_8001_8674.json'),
  // Greek blocks (match base dictionary ranges — same irregular boundaries)
  'es_g_0001_1000': () => require('./locale/es/strong_es_g_0001_1000.json'),
  'es_g_1001_2000': () => require('./locale/es/strong_es_g_1001_2000.json'),
  'es_g_2001_3001': () => require('./locale/es/strong_es_g_2001_3001.json'),
  'es_g_3002_4101': () => require('./locale/es/strong_es_g_3002_4101.json'),
  'es_g_4102_5101': () => require('./locale/es/strong_es_g_4102_5101.json'),
  'es_g_5102_5624': () => require('./locale/es/strong_es_g_5102_5624.json'),
};

// ─── Block key lookup ─────────────────────────────────────────────────────────

function getLocaleBlockKey(strongId: string): string {
  const isHebrew = strongId.startsWith('H');
  const num = parseInt(strongId.slice(1), 10);
  if (isNaN(num)) return '';

  if (isHebrew) {
    if (num <= 1000) return 'es_h_0001_1000';
    if (num <= 2000) return 'es_h_1001_2000';
    if (num <= 3000) return 'es_h_2001_3000';
    if (num <= 4000) return 'es_h_3001_4000';
    if (num <= 5000) return 'es_h_4001_5000';
    if (num <= 6000) return 'es_h_5001_6000';
    if (num <= 7000) return 'es_h_6001_7000';
    if (num <= 8000) return 'es_h_7001_8000';
    return 'es_h_8001_8674';
  } else {
    // Greek — mirrors the same irregular boundaries as the base dictionary
    if (num <= 1000) return 'es_g_0001_1000';
    if (num <= 2000) return 'es_g_1001_2000';
    if (num <= 3001) return 'es_g_2001_3001';
    if (num <= 4101) return 'es_g_3002_4101';
    if (num <= 5101) return 'es_g_4102_5101';
    return 'es_g_5102_5624';
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

class SpanishLocaleRepository {
  private cache = new Map<string, BlockData>();

  private loadBlock(blockKey: string): BlockData {
    if (this.cache.has(blockKey)) return this.cache.get(blockKey)!;
    const loader = LOCALE_BLOCK_LOADERS[blockKey];
    if (!loader) return {};
    const data: BlockData = loader();
    this.cache.set(blockKey, data);
    return data;
  }

  /** Returns the Spanish overlay for a Strong ID, or null if not available. */
  getOverlay(strongId: string): SpanishOverlay | null {
    const blockKey = getLocaleBlockKey(strongId);
    if (!blockKey) return null;
    const block = this.loadBlock(blockKey);
    return block[strongId] ?? null;
  }

  /** Returns true if a Spanish shortDefinition exists for this ID. */
  hasSpanish(strongId: string): boolean {
    return this.getOverlay(strongId) !== null;
  }

  /**
   * Returns coverage stats across all loaded blocks.
   * Only counts entries already loaded into the cache (does not force-load all blocks).
   */
  getCoverageStats(): { loaded: number; totalBlocks: number } {
    let loaded = 0;
    for (const [, block] of this.cache) {
      loaded += Object.keys(block).length;
    }
    return { loaded, totalBlocks: Object.keys(LOCALE_BLOCK_LOADERS).length };
  }
}

export const spanishLocaleRepository = new SpanishLocaleRepository();
