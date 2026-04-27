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
  'senor': 'H136',

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
  'firmamento': 'H7549',
  'semilla': 'H2233',
  'arbol': 'H6086',

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
  'maldad': 'H7451',
  'iniquidad': 'H5771',
  'transgresion': 'H6588',
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
  'palabras': 'H1697',
  'mandamiento': 'H4687',
  'mandamientos': 'H4687',
  'nombre': 'H8034',
  'estatutos': 'H2706',
  'estatuto': 'H2706',

  // People / family
  'hombre': 'H120',
  'hijo': 'H1121',
  'hijos': 'H1121',
  'pueblo': 'H5971',
  'rey': 'H4428',
  'reina': 'H4436',
  'naciones': 'H1471',
  'nacion': 'H1471',
  'extranjero': 'H1616',
  'israel': 'H3478',
  'juda': 'H3063',

  // Roles / ministry
  'sacerdote': 'H3548',
  'sacerdotes': 'H3548',
  'levita': 'H3881',
  'levitas': 'H3881',
  'profeta': 'H5030',
  'profetas': 'H5030',
  'ungido': 'H4899',
  'mesias': 'H4899',

  // Covenant / promises
  'pacto': 'H1285',
  'descendencia': 'H2233',
  'sangre': 'H1818',
  'pan': 'H3899',
  'casa': 'H1004',
  'principio': 'H7225',
  'herencia': 'H5159',
  'heredar': 'H5157',

  // Worship / temple
  'tabernaculo': 'H4908',
  'templo': 'H1964',
  'altar': 'H4196',
  'sacrificio': 'H2077',
  'ofrenda': 'H4503',
  'holocausto': 'H5930',
  'expiacion': 'H3722',
  'adoracion': 'H7812',
  'adorar': 'H7812',
  'sion': 'H6726',
  'jerusalen': 'H3389',

  // Creation acts
  'creo': 'H1254',

  // Angels
  'angel': 'H4397',
  'angeles': 'H4397',

  // Praise / prayer
  'alabar': 'H1984',
  'alabad': 'H1984',
  'alabado': 'H1984',
  'alabanza': 'H8416',
  'cantar': 'H7891',
  'cantad': 'H7891',
  'bendicion': 'H1293',
  'bendito': 'H1288',
  'orar': 'H6419',
  'oracion': 'H8605',
  'temor': 'H3374',

  // Prophecy / wisdom
  'sabiduria': 'H2451',
  'entendimiento': 'H998',
  'ciencia': 'H1847',
  'vision': 'H2377',
  'sueno': 'H2472',

  // Strength / protection
  'roca': 'H6697',
  'fortaleza': 'H4581',
  'escudo': 'H4043',
  'poder': 'H2428',
  'fuerza': 'H5797',
  'fuerte': 'H1368',
  'poderoso': 'H1368',
  'enemigo': 'H341',
  'enemigos': 'H341',
  'guerra': 'H4421',
  'espada': 'H2719',
  'monte': 'H2022',
  'montes': 'H2022',

  // Trust / hope
  'confiar': 'H982',
  'confianza': 'H982',
  'esperar': 'H6960',
  'esperanza': 'H8615',

  // Repentance / return
  'arrepentirse': 'H7725',
  'arrepentios': 'H7725',
  'convertirse': 'H7725',

  // Salvation / redemption
  'juicio': 'H4941',
  'redimir': 'H1350',
  'redencion': 'H1353',
  'redentor': 'H1350',
  'socorro': 'H5826',
  'ayuda': 'H5826',
  'librar': 'H5337',

  // Obedience
  'oye': 'H8085',
  'oigan': 'H8085',
  'escucha': 'H8085',
  'escuchad': 'H8085',
  'escuchen': 'H8085',
  'obedece': 'H8085',
  'obedecid': 'H8085',
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

  // Life / death / resurrection
  'vida': 'G2222',
  'muerte': 'G2288',
  'muerto': 'G2288',
  'muertos': 'G2288',
  'resurreccion': 'G386',
  'resucito': 'G1453',
  'resucitar': 'G1453',
  'resucitado': 'G1453',
  'carne': 'G4561',
  'alma': 'G5590',
  'corazon': 'G2588',
  'cuerpo': 'G4983',

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
  'amemos': 'G25',
  'amar': 'G25',
  'amaba': 'G25',

  // Believe
  'cree': 'G4100',
  'creen': 'G4100',
  'creer': 'G4100',
  'creeis': 'G4100',
  'creido': 'G4100',
  'creamos': 'G4100',
  'creyeron': 'G4100',
  'creyendo': 'G4100',

  // Peace / joy
  'paz': 'G1515',
  'gozo': 'G5479',
  'alegria': 'G5479',

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
  'misericordia': 'G1656',
  'perdon': 'G859',
  'perdonar': 'G863',
  'perdonad': 'G863',
  'perdonados': 'G863',

  // Law / word
  'ley': 'G3551',
  'palabra': 'G3056',
  'verbo': 'G3056',
  'nombre': 'G3686',
  'mandamiento': 'G1785',
  'mandamientos': 'G1785',
  'promesa': 'G1860',
  'pacto': 'G1242',

  // People
  'hombre': 'G444',
  'hombres': 'G444',
  'hijo': 'G5207',
  'hijos': 'G5207',
  'hermano': 'G80',
  'hermanos': 'G80',
  'rey': 'G935',
  'pueblo': 'G2992',
  'naciones': 'G1484',
  'gentiles': 'G1484',
  'judios': 'G2453',
  'judio': 'G2453',
  'israel': 'G2474',

  // Special NT terms
  'unigenito': 'G3439',
  'eterna': 'G166',
  'eterno': 'G166',
  'eternamente': 'G166',
  'reino': 'G932',
  'angel': 'G32',
  'angeles': 'G32',
  'principio': 'G746',
  'pan': 'G740',
  'sangre': 'G129',
  'cruz': 'G4716',
  'evangelio': 'G2098',

  // Church / ministry
  'iglesia': 'G1577',
  'iglesias': 'G1577',
  'discipulo': 'G3101',
  'discipulos': 'G3101',
  'apostol': 'G652',
  'apostoles': 'G652',
  'profeta': 'G4396',
  'profetas': 'G4396',
  'sacerdote': 'G2409',
  'sacerdotes': 'G2409',
  'pastor': 'G4166',

  // Worship
  'templo': 'G2411',
  'orar': 'G4336',
  'oracion': 'G4335',
  'oraciones': 'G4335',

  // Power / wisdom
  'poder': 'G1411',
  'sabiduria': 'G4678',
  'conocimiento': 'G1108',

  // Baptism
  'bautismo': 'G908',
  'bautizar': 'G907',
  'bautizado': 'G907',

  // Repentance / judgment
  'arrepentimiento': 'G3341',
  'arrepentios': 'G3340',
  'arrepentirse': 'G3340',
  'juicio': 'G2920',
  'obediencia': 'G5218',

  // Enemy / spiritual warfare
  'diablo': 'G1228',
  'satanas': 'G4567',
  'demonio': 'G1140',
  'demonios': 'G1140',

  // Signs / miracles
  'senal': 'G4592',
  'senales': 'G4592',
  'milagro': 'G4592',
  'milagros': 'G4592',
  'testimonio': 'G3141',
  'testigo': 'G3144',
  'testigos': 'G3144',

  // Eschatology
  'venida': 'G3952',
  'retorno': 'G3952',
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
// Stage 1: Full NT coverage (all 27 books, all chapters)
// Stage OT: Selective key chapters from major OT books

const r = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

const PLAN: { file: string; bookId: string; chapters: number[] }[] = [
  // ── NT: Complete coverage ────────────────────────────────────────────────
  { file: 'align_MAT.json', bookId: 'MAT', chapters: r(28) },
  { file: 'align_MRK.json', bookId: 'MRK', chapters: r(16) },
  { file: 'align_LUK.json', bookId: 'LUK', chapters: r(24) },
  { file: 'align_JHN.json', bookId: 'JHN', chapters: r(21) },
  { file: 'align_ACT.json', bookId: 'ACT', chapters: r(28) },
  { file: 'align_ROM.json', bookId: 'ROM', chapters: r(16) },
  { file: 'align_1CO.json', bookId: '1CO', chapters: r(16) },
  { file: 'align_2CO.json', bookId: '2CO', chapters: r(13) },
  { file: 'align_GAL.json', bookId: 'GAL', chapters: r(6) },
  { file: 'align_EPH.json', bookId: 'EPH', chapters: r(6) },
  { file: 'align_PHP.json', bookId: 'PHP', chapters: r(4) },
  { file: 'align_COL.json', bookId: 'COL', chapters: r(4) },
  { file: 'align_1TH.json', bookId: '1TH', chapters: r(5) },
  { file: 'align_2TH.json', bookId: '2TH', chapters: r(3) },   // NEW
  { file: 'align_1TI.json', bookId: '1TI', chapters: r(6) },   // NEW
  { file: 'align_2TI.json', bookId: '2TI', chapters: r(4) },
  { file: 'align_TIT.json', bookId: 'TIT', chapters: r(3) },   // NEW
  { file: 'align_PHM.json', bookId: 'PHM', chapters: [1] },    // NEW
  { file: 'align_HEB.json', bookId: 'HEB', chapters: r(13) },
  { file: 'align_JAS.json', bookId: 'JAS', chapters: r(5) },
  { file: 'align_1PE.json', bookId: '1PE', chapters: r(5) },
  { file: 'align_2PE.json', bookId: '2PE', chapters: r(3) },   // NEW
  { file: 'align_1JN.json', bookId: '1JN', chapters: r(5) },
  { file: 'align_2JN.json', bookId: '2JN', chapters: [1] },    // NEW
  { file: 'align_3JN.json', bookId: '3JN', chapters: [1] },    // NEW
  { file: 'align_JUD.json', bookId: 'JUD', chapters: [1] },    // NEW
  { file: 'align_REV.json', bookId: 'REV', chapters: r(22) },

  // ── OT: Complete all books and chapters ─────────────────────────────────
  { file: 'align_GEN.json', bookId: 'GEN', chapters: r(50) },
  { file: 'align_EXO.json', bookId: 'EXO', chapters: r(40) },
  { file: 'align_LEV.json', bookId: 'LEV', chapters: r(27) },
  { file: 'align_NUM.json', bookId: 'NUM', chapters: r(36) },
  { file: 'align_DEU.json', bookId: 'DEU', chapters: r(34) },
  { file: 'align_JOS.json', bookId: 'JOS', chapters: r(24) },
  { file: 'align_JDG.json', bookId: 'JDG', chapters: r(21) },   // NEW
  { file: 'align_RUT.json', bookId: 'RUT', chapters: r(4) },    // NEW
  { file: 'align_1SA.json', bookId: '1SA', chapters: r(31) },   // NEW
  { file: 'align_2SA.json', bookId: '2SA', chapters: r(24) },   // NEW
  { file: 'align_1KI.json', bookId: '1KI', chapters: r(22) },   // NEW
  { file: 'align_2KI.json', bookId: '2KI', chapters: r(25) },   // NEW
  { file: 'align_1CH.json', bookId: '1CH', chapters: r(29) },   // NEW
  { file: 'align_2CH.json', bookId: '2CH', chapters: r(36) },   // NEW
  { file: 'align_EZR.json', bookId: 'EZR', chapters: r(10) },   // NEW
  { file: 'align_NEH.json', bookId: 'NEH', chapters: r(13) },   // NEW
  { file: 'align_EST.json', bookId: 'EST', chapters: r(10) },   // NEW
  { file: 'align_JOB.json', bookId: 'JOB', chapters: r(42) },   // NEW
  { file: 'align_PSA.json', bookId: 'PSA', chapters: r(150) },
  { file: 'align_PRO.json', bookId: 'PRO', chapters: r(31) },
  { file: 'align_ECC.json', bookId: 'ECC', chapters: r(12) },   // NEW
  { file: 'align_SNG.json', bookId: 'SNG', chapters: r(8) },    // NEW
  { file: 'align_ISA.json', bookId: 'ISA', chapters: r(66) },
  { file: 'align_JER.json', bookId: 'JER', chapters: r(52) },
  { file: 'align_LAM.json', bookId: 'LAM', chapters: r(5) },    // NEW
  { file: 'align_EZK.json', bookId: 'EZK', chapters: r(48) },
  { file: 'align_DAN.json', bookId: 'DAN', chapters: r(12) },
  { file: 'align_HOS.json', bookId: 'HOS', chapters: r(14) },   // NEW
  { file: 'align_JOE.json', bookId: 'JOE', chapters: r(3) },    // NEW
  { file: 'align_AMO.json', bookId: 'AMO', chapters: r(9) },    // NEW
  { file: 'align_OBA.json', bookId: 'OBA', chapters: [1] },     // NEW
  { file: 'align_JON.json', bookId: 'JON', chapters: r(4) },    // NEW
  { file: 'align_MIC.json', bookId: 'MIC', chapters: r(7) },    // NEW
  { file: 'align_NAH.json', bookId: 'NAH', chapters: r(3) },    // NEW
  { file: 'align_HAB.json', bookId: 'HAB', chapters: r(3) },    // NEW
  { file: 'align_ZEP.json', bookId: 'ZEP', chapters: r(3) },    // NEW
  { file: 'align_HAG.json', bookId: 'HAG', chapters: r(2) },    // NEW
  { file: 'align_ZEC.json', bookId: 'ZEC', chapters: r(14) },   // NEW
  { file: 'align_MAL.json', bookId: 'MAL', chapters: r(4) },    // NEW
];

// ─── Main ────────────────────────────────────────────────────────────────────

let totalVerses = 0;
let totalLinks = 0;
let totalFiles = 0;

for (const { file, bookId, chapters } of PLAN) {
  process.stdout.write(`\n📖 ${file} (${bookId}, ${chapters.length} chapters)\n`);
  const { versesAdded, linksAdded } = await extendAlignmentFile(file, bookId, chapters);
  totalVerses += versesAdded;
  totalLinks += linksAdded;
  totalFiles++;
  process.stdout.write(`   +${versesAdded} verses, +${linksAdded} links\n`);
}

process.stdout.write(`\n✅ Done! ${totalFiles} files, +${totalVerses} verses, +${totalLinks} links\n`);
