#!/usr/bin/env bun
// generate-alignment.ts
// Fetches chapters from the local backend Bible API and auto-generates
// alignment JSON files (verseId → VerseWordLink[]) for key theological terms.
//
// Strategy: keyword matching — for each verse token, strip punctuation,
// normalize (lowercase + accent strip), and look up in a testament-aware map.
//
// Preserves existing manually-curated entries (does not overwrite).
// Run from workspace root: bun run scripts/generate-alignment.ts

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const BACKEND = 'http://localhost:3000';
const OUT_DIR = join(import.meta.dir, '../mobile/src/lib/strong/alignment');

// ─── Testament classification ────────────────────────────────────────────────

const OT_BOOKS = new Set([
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT',
  '1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA',
  'PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOE','AMO',
  'OBA','JON','MIC','NAH','HAB','ZEP','HAG','ZEC','MAL',
]);

// ─── Text normalization ──────────────────────────────────────────────────────

/** Strip accents, lowercase */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Remove punctuation/footnotes from a token so we can keyword-match it */
function clean(token: string): string {
  return token
    .replace(/\[.*?\]/g, '')              // [6†], [a], etc.
    .replace(/[.,;:!?(){}¡¿*""''""«»†‡]/g, '')
    .trim();
}

// ─── Keyword maps ────────────────────────────────────────────────────────────
// Hebrew keywords (OT)

const OT: Record<string, string> = {
  // Divine names
  'dios': 'H430',
  'jehova': 'H3068',
  'senor': 'H136',       // Adonai (standalone "Señor" in OT)

  // Creation / cosmos
  'tierra': 'H776',
  'cielos': 'H8064',
  'cielo': 'H8064',
  'aguas': 'H4325',
  'agua': 'H4325',
  'luz': 'H216',
  'tinieblas': 'H2822',
  'mar': 'H3220',
  'mares': 'H3220',

  // Spirit / soul / life
  'espiritu': 'H7307',
  'alma': 'H5315',
  'vida': 'H2416',
  'viviente': 'H2416',
  'corazon': 'H3820',
  'carne': 'H1320',

  // Death
  'muerte': 'H4194',
  'muerto': 'H4194',
  'muertos': 'H4194',

  // Time
  'dia': 'H3117',
  'dias': 'H3117',
  'noche': 'H3915',
  'manana': 'H1242',

  // Moral / theological
  'gloria': 'H3519',
  'santo': 'H6918',
  'santa': 'H6918',
  'santos': 'H6918',
  'bueno': 'H2896',
  'buena': 'H2896',
  'buenas': 'H2896',
  'malo': 'H7451',
  'mala': 'H7451',
  'justicia': 'H6664',
  'justo': 'H6662',
  'misericordia': 'H2617',
  'paz': 'H7965',
  'verdad': 'H571',
  'amor': 'H157',
  'salvacion': 'H3444',
  'pecado': 'H2403',
  'pecados': 'H2403',

  // Law / word
  'ley': 'H8451',
  'palabra': 'H1697',
  'mandamiento': 'H4687',
  'mandamientos': 'H4687',
  'nombre': 'H8034',

  // People / family
  'hombre': 'H120',
  'hijo': 'H1121',
  'hijos': 'H1121',
  'pueblo': 'H5971',
  'rey': 'H4428',
  'naciones': 'H1471',

  // Covenant / promises
  'pacto': 'H1285',
  'descendencia': 'H2233',
  'sangre': 'H1818',
  'pan': 'H3899',
  'casa': 'H1004',
  'principio': 'H7225',

  // Creation acts
  'creo': 'H1254',       // "creó" normalizes to "creo" after accent strip

  // Angels
  'angel': 'H4397',
  'angeles': 'H4397',

  // Worship
  'adoracion': 'H7812',
  'temor': 'H3374',
  'alabanza': 'H8416',
  'bendicion': 'H1293',
};

// Greek keywords (NT)

const NT: Record<string, string> = {
  // Divine persons
  'jesus': 'G2424',
  'cristo': 'G5547',
  'dios': 'G2316',
  'padre': 'G3962',
  'senor': 'G2962',
  'espiritu': 'G4151',

  // Cosmos
  'mundo': 'G2889',
  'cielo': 'G3772',
  'cielos': 'G3772',
  'tierra': 'G1093',
  'luz': 'G5457',
  'tinieblas': 'G4655',
  'agua': 'G5204',
  'aguas': 'G5204',

  // Life / death
  'vida': 'G2222',
  'muerte': 'G2288',
  'muerto': 'G2288',
  'muertos': 'G2288',
  'resurreccion': 'G386',
  'carne': 'G4561',
  'alma': 'G5590',
  'corazon': 'G2588',

  // Faith / grace / truth
  'fe': 'G4102',
  'gracia': 'G5485',
  'verdad': 'G225',
  'esperanza': 'G1680',
  'amor': 'G26',
  'amo': 'G25',
  'amaron': 'G25',
  'aman': 'G25',
  'amad': 'G25',

  // Believe
  'cree': 'G4100',
  'creen': 'G4100',
  'creer': 'G4100',
  'creeis': 'G4100',
  'creido': 'G4100',
  'creamos': 'G4100',

  // Peace / joy
  'paz': 'G1515',
  'gozo': 'G5479',

  // Moral / theological
  'gloria': 'G1391',
  'santo': 'G40',
  'santa': 'G40',
  'santos': 'G40',
  'justo': 'G1342',
  'justicia': 'G1343',
  'pecado': 'G266',
  'pecados': 'G266',
  'salvacion': 'G4991',
  'salvo': 'G4982',
  'gracia': 'G5485',

  // Law / word
  'ley': 'G3551',
  'palabra': 'G3056',
  'verbo': 'G3056',
  'nombre': 'G3686',

  // People
  'hombre': 'G444',
  'hombres': 'G444',
  'hijo': 'G5207',
  'hijos': 'G5207',
  'hermano': 'G80',
  'hermanos': 'G80',
  'rey': 'G935',

  // Special NT terms
  'unigenito': 'G3439',
  'eterna': 'G166',
  'eterno': 'G166',
  'reino': 'G932',
  'angel': 'G32',
  'angeles': 'G32',
  'principio': 'G746',
  'pan': 'G740',
  'sangre': 'G129',
  'promesa': 'G1860',
  'misericordia': 'G1656',
  'verdad': 'G225',
};

// ─── Core logic ──────────────────────────────────────────────────────────────

interface VerseWordLink {
  verseId: string;
  wordIndex: number;
  displayedWord: string;
  strongId: string;
}

type AlignmentMap = Record<string, VerseWordLink[]>;

function generateLinks(verseId: string, text: string, isOT: boolean): VerseWordLink[] {
  const map = isOT ? OT : NT;
  const tokens = text.split(' ');
  const links: VerseWordLink[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const cleaned = clean(raw);
    if (!cleaned) continue;
    const key = norm(cleaned);
    const strongId = map[key];
    if (strongId) {
      links.push({ verseId, wordIndex: i, displayedWord: raw, strongId });
    }
  }
  return links;
}

async function fetchChapter(bookId: string, chapter: number): Promise<{ number: number; text: string }[]> {
  const url = `${BACKEND}/api/bible/chapter?bookId=${bookId}&chapter=${chapter}&lang=es&version=RVR60`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${bookId} ${chapter}`);
  const data = (await res.json()) as { verses: { number: number; text: string }[] };
  return data.verses;
}

async function extendAlignmentFile(
  file: string,
  bookId: string,
  chapters: number[],
): Promise<{ versesAdded: number; linksAdded: number }> {
  const filePath = join(OUT_DIR, file);
  const existing: AlignmentMap = existsSync(filePath)
    ? JSON.parse(readFileSync(filePath, 'utf-8'))
    : {};

  const isOT = OT_BOOKS.has(bookId);
  let versesAdded = 0;
  let linksAdded = 0;

  for (const chapter of chapters) {
    let verses: { number: number; text: string }[];
    try {
      verses = await fetchChapter(bookId, chapter);
    } catch (e) {
      process.stderr.write(`  ⚠️  Skip ${bookId} ${chapter}: ${e}\n`);
      continue;
    }

    for (const v of verses) {
      const verseId = `${bookId}_${chapter}_${v.number}`;
      if (existing[verseId]?.length) continue; // preserve manual entries
      const links = generateLinks(verseId, v.text, isOT);
      if (links.length > 0) {
        existing[verseId] = links;
        versesAdded++;
        linksAdded += links.length;
      }
    }
    process.stdout.write(`  ${bookId} ${chapter} ✓\n`);
  }

  writeFileSync(filePath, JSON.stringify(existing, null, 2));
  return { versesAdded, linksAdded };
}

// ─── Plan ────────────────────────────────────────────────────────────────────

const PLAN: { file: string; bookId: string; chapters: number[] }[] = [
  // ── Already existing files — extend with more chapters ──────────────────
  {
    file: 'align_GEN.json', bookId: 'GEN',
    chapters: [2,3,4,5,6,7,8,9,10,11,12,15,17,18,19,22,24,25,28,32,37,39,41,45,50],
  },
  {
    file: 'align_EXO.json', bookId: 'EXO',
    chapters: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,32,33,34,40],
  },
  {
    file: 'align_PSA.json', bookId: 'PSA',
    chapters: [1,2,8,16,19,22,24,25,27,31,32,34,37,46,51,63,84,90,91,96,100,103,104,107,110,116,119,121,130,133,139,145,146,150],
  },
  {
    file: 'align_JHN.json', bookId: 'JHN',
    chapters: [2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,21],
  },
  {
    file: 'align_ROM.json', bookId: 'ROM',
    chapters: [1,2,3,4,5,6,7,9,10,11,12,13,14,15,16],
  },

  // ── New books ────────────────────────────────────────────────────────────
  {
    file: 'align_ISA.json', bookId: 'ISA',
    chapters: [1,6,7,9,11,25,26,35,40,41,42,43,44,45,46,49,50,52,53,54,55,56,58,60,61,65,66],
  },
  {
    file: 'align_MAT.json', bookId: 'MAT',
    chapters: [1,2,3,4,5,6,7,8,11,16,17,18,20,22,24,25,26,27,28],
  },
  {
    file: 'align_MRK.json', bookId: 'MRK',
    chapters: [1,2,5,8,10,12,14,15,16],
  },
  {
    file: 'align_LUK.json', bookId: 'LUK',
    chapters: [1,2,3,4,6,9,10,11,12,15,18,19,22,23,24],
  },
  {
    file: 'align_ACT.json', bookId: 'ACT',
    chapters: [1,2,3,4,7,10,13,15,16,17,26,27,28],
  },
  {
    file: 'align_1CO.json', bookId: '1CO',
    chapters: [1,2,3,6,10,11,12,13,15],
  },
  {
    file: 'align_2CO.json', bookId: '2CO',
    chapters: [3,4,5,6,9,12],
  },
  {
    file: 'align_GAL.json', bookId: 'GAL',
    chapters: [1,2,3,4,5,6],
  },
  {
    file: 'align_EPH.json', bookId: 'EPH',
    chapters: [1,2,3,4,5,6],
  },
  {
    file: 'align_PHP.json', bookId: 'PHP',
    chapters: [1,2,3,4],
  },
  {
    file: 'align_COL.json', bookId: 'COL',
    chapters: [1,2,3,4],
  },
  {
    file: 'align_1TH.json', bookId: '1TH',
    chapters: [4,5],
  },
  {
    file: 'align_HEB.json', bookId: 'HEB',
    chapters: [1,2,4,6,9,10,11,12,13],
  },
  {
    file: 'align_JAS.json', bookId: 'JAS',
    chapters: [1,2,3,4,5],
  },
  {
    file: 'align_1PE.json', bookId: '1PE',
    chapters: [1,2,3,4,5],
  },
  {
    file: 'align_1JN.json', bookId: '1JN',
    chapters: [1,2,3,4,5],
  },
  {
    file: 'align_REV.json', bookId: 'REV',
    chapters: [1,3,4,5,7,12,14,19,20,21,22],
  },
  {
    file: 'align_PRO.json', bookId: 'PRO',
    chapters: [1,2,3,4,8,9,10,14,15,16,17,18,22,31],
  },
  {
    file: 'align_JER.json', bookId: 'JER',
    chapters: [1,17,29,31,32,33],
  },
  {
    file: 'align_EZK.json', bookId: 'EZK',
    chapters: [36,37],
  },
  {
    file: 'align_DAN.json', bookId: 'DAN',
    chapters: [1,2,3,6,7,9],
  },
  {
    file: 'align_DEU.json', bookId: 'DEU',
    chapters: [6,7,8,28,29,30,32,33,34],
  },
  {
    file: 'align_NUM.json', bookId: 'NUM',
    chapters: [6,23,24],
  },
  {
    file: 'align_LEV.json', bookId: 'LEV',
    chapters: [19,26],
  },
  {
    file: 'align_JOS.json', bookId: 'JOS',
    chapters: [1,24],
  },
  {
    file: 'align_2TI.json', bookId: '2TI',
    chapters: [3,4],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

let totalVerses = 0;
let totalLinks = 0;
let totalFiles = 0;

for (const { file, bookId, chapters } of PLAN) {
  process.stdout.write(`\n📖 ${file} (${bookId}, chapters: ${chapters.join(',')})\n`);
  const { versesAdded, linksAdded } = await extendAlignmentFile(file, bookId, chapters);
  totalVerses += versesAdded;
  totalLinks += linksAdded;
  totalFiles++;
  process.stdout.write(`   +${versesAdded} verses, +${linksAdded} links\n`);
}

process.stdout.write(`\n✅ Done! ${totalFiles} files, +${totalVerses} verses, +${totalLinks} links\n`);
