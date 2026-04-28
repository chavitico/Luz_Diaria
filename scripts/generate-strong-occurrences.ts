/**
 * Generates strong_occurrence_index.json — a pre-built inverted index mapping
 * every Strong ID to the sorted list of verse labels where it appears.
 *
 * Run from the workspace root:
 *   bun run scripts/generate-strong-occurrences.ts
 *
 * Output: mobile/src/lib/strong/data/strong_occurrence_index.json
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// ── Book code → Spanish name ──────────────────────────────────────────────────

const BOOK_NAMES: Record<string, string> = {
  GEN: 'Génesis',    EXO: 'Éxodo',       LEV: 'Levítico',
  NUM: 'Números',    DEU: 'Deuteronomio', JOS: 'Josué',
  JDG: 'Jueces',     RUT: 'Rut',         '1SA': '1 Samuel',
  '2SA': '2 Samuel', '1KI': '1 Reyes',   '2KI': '2 Reyes',
  '1CH': '1 Crónicas', '2CH': '2 Crónicas', EZR: 'Esdras',
  NEH: 'Nehemías',   EST: 'Ester',       JOB: 'Job',
  PSA: 'Salmos',     PRO: 'Proverbios',  ECC: 'Eclesiastés',
  SNG: 'Cantares',   ISA: 'Isaías',      JER: 'Jeremías',
  LAM: 'Lamentaciones', EZK: 'Ezequiel', DAN: 'Daniel',
  HOS: 'Oseas',      JOE: 'Joel',        AMO: 'Amós',
  OBA: 'Abdías',     JON: 'Jonás',       MIC: 'Miqueas',
  NAH: 'Nahúm',      HAB: 'Habacuc',     ZEP: 'Sofonías',
  HAG: 'Hageo',      ZEC: 'Zacarías',    MAL: 'Malaquías',
  MAT: 'Mateo',      MRK: 'Marcos',      LUK: 'Lucas',
  JHN: 'Juan',       ACT: 'Hechos',      ROM: 'Romanos',
  '1CO': '1 Corintios', '2CO': '2 Corintios', GAL: 'Gálatas',
  EPH: 'Efesios',    PHP: 'Filipenses',  COL: 'Colosenses',
  '1TH': '1 Tesalonicenses', '2TH': '2 Tesalonicenses',
  '1TI': '1 Timoteo', '2TI': '2 Timoteo', TIT: 'Tito',
  PHM: 'Filemón',    HEB: 'Hebreos',     JAS: 'Santiago',
  '1PE': '1 Pedro',  '2PE': '2 Pedro',   '1JN': '1 Juan',
  '2JN': '2 Juan',   '3JN': '3 Juan',    JUD: 'Judas',
  REV: 'Apocalipsis',
};

// ── Sort order for canonical book ordering ────────────────────────────────────

const BOOK_ORDER: string[] = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA',
  '1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO',
  'ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOE','AMO',
  'OBA','JON','MIC','NAH','HAB','ZEP','HAG','ZEC','MAL',
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH',
  'PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS',
  '1PE','2PE','1JN','2JN','3JN','JUD','REV',
];
const BOOK_INDEX = Object.fromEntries(BOOK_ORDER.map((b, i) => [b, i]));

function verseSort(a: string, b: string): number {
  // "Génesis 2:7" → parse book, chapter, verse
  const parse = (s: string) => {
    const m = s.match(/^(.+)\s+(\d+):(\d+)$/);
    if (!m) return { bi: 999, ch: 0, vs: 0 };
    // Find book id by reverse lookup
    const bookId = Object.entries(BOOK_NAMES).find(([, n]) => n === m[1])?.[0] ?? '';
    return { bi: BOOK_INDEX[bookId] ?? 999, ch: parseInt(m[2], 10), vs: parseInt(m[3], 10) };
  };
  const pa = parse(a), pb = parse(b);
  if (pa.bi !== pb.bi) return pa.bi - pb.bi;
  if (pa.ch !== pb.ch) return pa.ch - pb.ch;
  return pa.vs - pb.vs;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const alignDir = join(import.meta.dir, '../mobile/src/lib/strong/alignment');
const outFile  = join(import.meta.dir, '../mobile/src/lib/strong/data/strong_occurrence_index.json');

const index = new Map<string, Set<string>>();
let totalLinks = 0;

const files = readdirSync(alignDir).filter(f => f.startsWith('align_') && f.endsWith('.json'));
console.log(`Processing ${files.length} alignment files...`);

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(alignDir, file), 'utf8')) as
    Record<string, Array<{ strongId: string }>>;

  for (const [verseId, links] of Object.entries(raw)) {
    const parts = verseId.split('_');
    const bookCode = parts.slice(0, -2).join('_') || parts[0];
    const chapter  = parseInt(parts[parts.length - 2], 10);
    const verse    = parseInt(parts[parts.length - 1], 10);
    const bookName = BOOK_NAMES[bookCode];
    if (!bookName) continue;
    const label = `${bookName} ${chapter}:${verse}`;

    for (const link of links) {
      if (!link.strongId) continue;
      let set = index.get(link.strongId);
      if (!set) { set = new Set(); index.set(link.strongId, set); }
      set.add(label);
      totalLinks++;
    }
  }
}

// Build output object with sorted verse lists
const output: Record<string, string[]> = {};
for (const [strongId, verses] of index.entries()) {
  output[strongId] = Array.from(verses).sort(verseSort);
}

writeFileSync(outFile, JSON.stringify(output), 'utf8');

const totalEntries = Object.keys(output).length;
const fileSize = (JSON.stringify(output).length / 1024).toFixed(0);
console.log(`Done!`);
console.log(`  Strong IDs indexed: ${totalEntries.toLocaleString()}`);
console.log(`  Total verse links:  ${totalLinks.toLocaleString()}`);
console.log(`  Output size:        ${fileSize} KB`);
console.log(`  Written to:         ${outFile}`);
