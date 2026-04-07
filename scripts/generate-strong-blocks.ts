#!/usr/bin/env bun
/**
 * generate-strong-blocks.ts
 *
 * Splits the raw OpenScriptures Strong dictionary JSON into fixed-size blocks
 * that can be lazy-loaded by JsonBlockStrongRepository inside the mobile app.
 *
 * Usage:
 *   bun run scripts/generate-strong-blocks.ts
 *
 * Inputs (from previous fetch step):
 *   backend/data/strongs/strongs-hebrew-dictionary.json
 *   backend/data/strongs/strongs-greek-dictionary.json
 *
 * Outputs (to mobile app data directory):
 *   mobile/src/lib/strong/data/strong_h_0001_1000.json
 *   mobile/src/lib/strong/data/strong_h_1001_2000.json
 *   ...
 *   mobile/src/lib/strong/data/strong_g_0001_1000.json
 *   ...
 *   mobile/src/lib/strong/data/block-manifest.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ─── Raw types from OpenScriptures ────────────────────────────────────────────

interface RawHebrewEntry {
  lemma: string;
  xlit: string;
  pron: string;
  derivation: string;
  strongs_def: string;
  kjv_def: string;
}

interface RawGreekEntry {
  lemma: string;
  translit: string;
  derivation: string;
  strongs_def: string;
  kjv_def: string;
}

// ─── Output type stored in block files ───────────────────────────────────────

export interface BlockStrongEntry {
  id: string;
  testament: 'OT' | 'NT';
  language: 'Hebrew' | 'Greek';
  lemmaOriginal: string;
  transliteration: string;
  pronunciation?: string;
  grammarCategory: string;
  shortDefinition: string;
  longDefinition: string;
  kjvRenderings: string[];
  occurrencesCount: number; // 0 = not yet mapped; will be filled from alignment data
  relatedVerses: string[];  // empty until verse-link dataset is integrated
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BLOCK_SIZE = 1000;
const ROOT = join(import.meta.dir, '..');
const OUT_DIR = join(ROOT, 'mobile/src/lib/strong/data');

mkdirSync(OUT_DIR, { recursive: true });

// ─── Grammar category inference ──────────────────────────────────────────────
// Strong's doesn't include a POS tag in the raw data; we infer from KJV
// renderings and derivation text. This is intentionally simple — the field
// is useful for display even when approximate.

function inferGrammarCategory(
  kjv_def: string,
  derivation: string,
  strongs_def: string,
  lang: 'Hebrew' | 'Greek'
): string {
  const s = ((kjv_def ?? '') + ' ' + (derivation ?? '') + ' ' + (strongs_def ?? '')).toLowerCase();
  if (/\bproper name\b/.test(s)) return lang === 'Hebrew' ? 'Nombre propio' : 'Nombre propio';
  if (/\bpronoun\b/.test(s)) return 'Pronombre';
  if (/\bparticle\b/.test(s)) return 'Partícula';
  if (/\bpreposition\b/.test(s)) return 'Preposición';
  if (/\bconjunction\b/.test(s)) return 'Conjunción';
  if (/\badverb\b/.test(s)) return 'Adverbio';
  if (/\badjective\b/.test(s)) return 'Adjetivo';
  if (/\ba primitive root\b/.test((derivation ?? '').toLowerCase()) || /\bverb\b/.test(s)) return 'Verbo';
  if (/\bfeminine\b/.test(s)) return lang === 'Hebrew' ? 'Sustantivo femenino' : 'Sustantivo';
  if (/\bmasculine\b/.test(s)) return lang === 'Hebrew' ? 'Sustantivo masculino' : 'Sustantivo';
  if (/\bnoun\b/.test(s)) return 'Sustantivo';
  return 'Palabra';
}

function cleanText(s: string): string {
  return (s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\{[^}]*\}/g, '') // strip {note} markers
    .trim();
}

// ─── Process Hebrew ───────────────────────────────────────────────────────────

function processHebrew() {
  console.log('📖  Processing Hebrew dictionary…');
  const raw: Record<string, RawHebrewEntry> = JSON.parse(
    readFileSync(join(ROOT, 'backend/data/strongs/strongs-hebrew-dictionary.json'), 'utf-8')
  );

  const entries: BlockStrongEntry[] = Object.entries(raw).map(([id, r]) => ({
    id,
    testament: 'OT',
    language: 'Hebrew',
    lemmaOriginal: r.lemma ?? '',
    transliteration: r.xlit ?? '',
    pronunciation: r.pron ?? '',
    grammarCategory: inferGrammarCategory(r.kjv_def, r.derivation, r.strongs_def, 'Hebrew'),
    shortDefinition: cleanText(r.strongs_def).slice(0, 120),
    longDefinition: [cleanText(r.derivation), cleanText(r.strongs_def)].filter(Boolean).join(' ').slice(0, 600),
    kjvRenderings: cleanText(r.kjv_def).split(',').map(s => s.trim()).filter(Boolean),
    occurrencesCount: 0,
    relatedVerses: [],
  }));

  return writeBlocks('h', entries, (id) => {
    const n = parseInt(id.replace('H', ''), 10);
    return isNaN(n) ? 0 : n;
  });
}

// ─── Process Greek ────────────────────────────────────────────────────────────

function processGreek() {
  console.log('📖  Processing Greek dictionary…');
  const raw: Record<string, RawGreekEntry> = JSON.parse(
    readFileSync(join(ROOT, 'backend/data/strongs/strongs-greek-dictionary.json'), 'utf-8')
  );

  const entries: BlockStrongEntry[] = Object.entries(raw).map(([id, r]) => ({
    id,
    testament: 'NT',
    language: 'Greek',
    lemmaOriginal: r.lemma ?? '',
    transliteration: r.translit ?? '',
    grammarCategory: inferGrammarCategory(r.kjv_def, r.derivation, r.strongs_def, 'Greek'),
    shortDefinition: cleanText(r.strongs_def).slice(0, 120),
    longDefinition: [cleanText(r.derivation), cleanText(r.strongs_def)].filter(Boolean).join(' ').slice(0, 600),
    kjvRenderings: cleanText(r.kjv_def).split(',').map(s => s.trim()).filter(Boolean),
    occurrencesCount: 0,
    relatedVerses: [],
  }));

  return writeBlocks('g', entries, (id) => {
    const n = parseInt(id.replace('G', ''), 10);
    return isNaN(n) ? 0 : n;
  });
}

// ─── Block writer ─────────────────────────────────────────────────────────────

interface BlockManifestEntry {
  blockId: string;
  lang: 'h' | 'g';
  start: number;
  end: number;
  count: number;
  filename: string;
}

function writeBlocks(
  lang: 'h' | 'g',
  entries: BlockStrongEntry[],
  getNum: (id: string) => number
): BlockManifestEntry[] {
  entries.sort((a, b) => getNum(a.id) - getNum(b.id));

  const manifest: BlockManifestEntry[] = [];
  let blockStart = 0;

  while (blockStart < entries.length) {
    const blockEnd = Math.min(blockStart + BLOCK_SIZE, entries.length);
    const slice = entries.slice(blockStart, blockEnd);

    const firstNum = getNum(slice[0].id);
    const lastNum  = getNum(slice[slice.length - 1].id);

    const padded = (n: number) => String(n).padStart(4, '0');
    const blockId = `${lang}_${padded(firstNum)}_${padded(lastNum)}`;
    const filename = `strong_${blockId}.json`;
    const outPath  = join(OUT_DIR, filename);

    // Block file: object keyed by Strong ID for O(1) lookup
    const blockObj: Record<string, BlockStrongEntry> = {};
    for (const e of slice) blockObj[e.id] = e;

    writeFileSync(outPath, JSON.stringify(blockObj));

    const sizeKB = (Buffer.byteLength(JSON.stringify(blockObj)) / 1024).toFixed(1);
    console.log(`  ✓  ${filename}  (${slice.length} entries, ${sizeKB} KB)`);

    manifest.push({ blockId, lang, start: firstNum, end: lastNum, count: slice.length, filename });
    blockStart = blockEnd;
  }

  return manifest;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const hebrewManifest = processHebrew();
const greekManifest  = processGreek();
const fullManifest   = [...hebrewManifest, ...greekManifest];

writeFileSync(
  join(OUT_DIR, 'block-manifest.json'),
  JSON.stringify(fullManifest, null, 2)
);

console.log(`\n✅  Done — ${fullManifest.length} blocks written to ${OUT_DIR}`);
console.log(`   Hebrew: ${hebrewManifest.length} blocks`);
console.log(`   Greek:  ${greekManifest.length} blocks`);
