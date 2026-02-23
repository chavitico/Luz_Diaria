// Bible Passage Service
// Fetches Bible passages from API and caches them in the database

import { prisma } from "./prisma";

// Book name mappings for normalization
const BOOK_MAPPINGS: Record<string, { en: string; es: string; apiKey: string }> = {
  // Old Testament
  genesis: { en: "Genesis", es: "Génesis", apiKey: "GEN" },
  génesis: { en: "Genesis", es: "Génesis", apiKey: "GEN" },
  exodo: { en: "Exodus", es: "Éxodo", apiKey: "EXO" },
  éxodo: { en: "Exodus", es: "Éxodo", apiKey: "EXO" },
  exodus: { en: "Exodus", es: "Éxodo", apiKey: "EXO" },
  levitico: { en: "Leviticus", es: "Levítico", apiKey: "LEV" },
  levítico: { en: "Leviticus", es: "Levítico", apiKey: "LEV" },
  leviticus: { en: "Leviticus", es: "Levítico", apiKey: "LEV" },
  numeros: { en: "Numbers", es: "Números", apiKey: "NUM" },
  números: { en: "Numbers", es: "Números", apiKey: "NUM" },
  numbers: { en: "Numbers", es: "Números", apiKey: "NUM" },
  deuteronomio: { en: "Deuteronomy", es: "Deuteronomio", apiKey: "DEU" },
  deuteronomy: { en: "Deuteronomy", es: "Deuteronomio", apiKey: "DEU" },
  josue: { en: "Joshua", es: "Josué", apiKey: "JOS" },
  josué: { en: "Joshua", es: "Josué", apiKey: "JOS" },
  joshua: { en: "Joshua", es: "Josué", apiKey: "JOS" },
  jueces: { en: "Judges", es: "Jueces", apiKey: "JDG" },
  judges: { en: "Judges", es: "Jueces", apiKey: "JDG" },
  rut: { en: "Ruth", es: "Rut", apiKey: "RUT" },
  ruth: { en: "Ruth", es: "Rut", apiKey: "RUT" },
  "1samuel": { en: "1 Samuel", es: "1 Samuel", apiKey: "1SA" },
  "1 samuel": { en: "1 Samuel", es: "1 Samuel", apiKey: "1SA" },
  "2samuel": { en: "2 Samuel", es: "2 Samuel", apiKey: "2SA" },
  "2 samuel": { en: "2 Samuel", es: "2 Samuel", apiKey: "2SA" },
  "1reyes": { en: "1 Kings", es: "1 Reyes", apiKey: "1KI" },
  "1 reyes": { en: "1 Kings", es: "1 Reyes", apiKey: "1KI" },
  "1kings": { en: "1 Kings", es: "1 Reyes", apiKey: "1KI" },
  "1 kings": { en: "1 Kings", es: "1 Reyes", apiKey: "1KI" },
  "2reyes": { en: "2 Kings", es: "2 Reyes", apiKey: "2KI" },
  "2 reyes": { en: "2 Kings", es: "2 Reyes", apiKey: "2KI" },
  "2kings": { en: "2 Kings", es: "2 Reyes", apiKey: "2KI" },
  "2 kings": { en: "2 Kings", es: "2 Reyes", apiKey: "2KI" },
  "1cronicas": { en: "1 Chronicles", es: "1 Crónicas", apiKey: "1CH" },
  "1 cronicas": { en: "1 Chronicles", es: "1 Crónicas", apiKey: "1CH" },
  "1 crónicas": { en: "1 Chronicles", es: "1 Crónicas", apiKey: "1CH" },
  "1chronicles": { en: "1 Chronicles", es: "1 Crónicas", apiKey: "1CH" },
  "1 chronicles": { en: "1 Chronicles", es: "1 Crónicas", apiKey: "1CH" },
  "2cronicas": { en: "2 Chronicles", es: "2 Crónicas", apiKey: "2CH" },
  "2 cronicas": { en: "2 Chronicles", es: "2 Crónicas", apiKey: "2CH" },
  "2 crónicas": { en: "2 Chronicles", es: "2 Crónicas", apiKey: "2CH" },
  "2chronicles": { en: "2 Chronicles", es: "2 Crónicas", apiKey: "2CH" },
  "2 chronicles": { en: "2 Chronicles", es: "2 Crónicas", apiKey: "2CH" },
  esdras: { en: "Ezra", es: "Esdras", apiKey: "EZR" },
  ezra: { en: "Ezra", es: "Esdras", apiKey: "EZR" },
  nehemias: { en: "Nehemiah", es: "Nehemías", apiKey: "NEH" },
  nehemías: { en: "Nehemiah", es: "Nehemías", apiKey: "NEH" },
  nehemiah: { en: "Nehemiah", es: "Nehemías", apiKey: "NEH" },
  ester: { en: "Esther", es: "Ester", apiKey: "EST" },
  esther: { en: "Esther", es: "Ester", apiKey: "EST" },
  job: { en: "Job", es: "Job", apiKey: "JOB" },
  salmos: { en: "Psalms", es: "Salmos", apiKey: "PSA" },
  salmo: { en: "Psalms", es: "Salmos", apiKey: "PSA" },
  psalms: { en: "Psalms", es: "Salmos", apiKey: "PSA" },
  psalm: { en: "Psalms", es: "Salmos", apiKey: "PSA" },
  proverbios: { en: "Proverbs", es: "Proverbios", apiKey: "PRO" },
  proverbs: { en: "Proverbs", es: "Proverbios", apiKey: "PRO" },
  eclesiastes: { en: "Ecclesiastes", es: "Eclesiastés", apiKey: "ECC" },
  eclesiastés: { en: "Ecclesiastes", es: "Eclesiastés", apiKey: "ECC" },
  ecclesiastes: { en: "Ecclesiastes", es: "Eclesiastés", apiKey: "ECC" },
  cantares: { en: "Song of Solomon", es: "Cantares", apiKey: "SNG" },
  "cantar de los cantares": { en: "Song of Solomon", es: "Cantares", apiKey: "SNG" },
  "song of solomon": { en: "Song of Solomon", es: "Cantares", apiKey: "SNG" },
  isaias: { en: "Isaiah", es: "Isaías", apiKey: "ISA" },
  isaías: { en: "Isaiah", es: "Isaías", apiKey: "ISA" },
  isaiah: { en: "Isaiah", es: "Isaías", apiKey: "ISA" },
  jeremias: { en: "Jeremiah", es: "Jeremías", apiKey: "JER" },
  jeremías: { en: "Jeremiah", es: "Jeremías", apiKey: "JER" },
  jeremiah: { en: "Jeremiah", es: "Jeremías", apiKey: "JER" },
  lamentaciones: { en: "Lamentations", es: "Lamentaciones", apiKey: "LAM" },
  lamentations: { en: "Lamentations", es: "Lamentaciones", apiKey: "LAM" },
  ezequiel: { en: "Ezekiel", es: "Ezequiel", apiKey: "EZK" },
  ezekiel: { en: "Ezekiel", es: "Ezequiel", apiKey: "EZK" },
  daniel: { en: "Daniel", es: "Daniel", apiKey: "DAN" },
  oseas: { en: "Hosea", es: "Oseas", apiKey: "HOS" },
  hosea: { en: "Hosea", es: "Oseas", apiKey: "HOS" },
  joel: { en: "Joel", es: "Joel", apiKey: "JOL" },
  amos: { en: "Amos", es: "Amós", apiKey: "AMO" },
  amós: { en: "Amos", es: "Amós", apiKey: "AMO" },
  abdias: { en: "Obadiah", es: "Abdías", apiKey: "OBA" },
  abdías: { en: "Obadiah", es: "Abdías", apiKey: "OBA" },
  obadiah: { en: "Obadiah", es: "Abdías", apiKey: "OBA" },
  jonas: { en: "Jonah", es: "Jonás", apiKey: "JON" },
  jonás: { en: "Jonah", es: "Jonás", apiKey: "JON" },
  jonah: { en: "Jonah", es: "Jonás", apiKey: "JON" },
  miqueas: { en: "Micah", es: "Miqueas", apiKey: "MIC" },
  micah: { en: "Micah", es: "Miqueas", apiKey: "MIC" },
  nahum: { en: "Nahum", es: "Nahúm", apiKey: "NAM" },
  nahúm: { en: "Nahum", es: "Nahúm", apiKey: "NAM" },
  habacuc: { en: "Habakkuk", es: "Habacuc", apiKey: "HAB" },
  habakkuk: { en: "Habakkuk", es: "Habacuc", apiKey: "HAB" },
  sofonias: { en: "Zephaniah", es: "Sofonías", apiKey: "ZEP" },
  sofonías: { en: "Zephaniah", es: "Sofonías", apiKey: "ZEP" },
  zephaniah: { en: "Zephaniah", es: "Sofonías", apiKey: "ZEP" },
  hageo: { en: "Haggai", es: "Hageo", apiKey: "HAG" },
  haggai: { en: "Haggai", es: "Hageo", apiKey: "HAG" },
  zacarias: { en: "Zechariah", es: "Zacarías", apiKey: "ZEC" },
  zacarías: { en: "Zechariah", es: "Zacarías", apiKey: "ZEC" },
  zechariah: { en: "Zechariah", es: "Zacarías", apiKey: "ZEC" },
  malaquias: { en: "Malachi", es: "Malaquías", apiKey: "MAL" },
  malaquías: { en: "Malachi", es: "Malaquías", apiKey: "MAL" },
  malachi: { en: "Malachi", es: "Malaquías", apiKey: "MAL" },
  // New Testament
  mateo: { en: "Matthew", es: "Mateo", apiKey: "MAT" },
  matthew: { en: "Matthew", es: "Mateo", apiKey: "MAT" },
  marcos: { en: "Mark", es: "Marcos", apiKey: "MRK" },
  mark: { en: "Mark", es: "Marcos", apiKey: "MRK" },
  lucas: { en: "Luke", es: "Lucas", apiKey: "LUK" },
  luke: { en: "Luke", es: "Lucas", apiKey: "LUK" },
  juan: { en: "John", es: "Juan", apiKey: "JHN" },
  john: { en: "John", es: "Juan", apiKey: "JHN" },
  hechos: { en: "Acts", es: "Hechos", apiKey: "ACT" },
  acts: { en: "Acts", es: "Hechos", apiKey: "ACT" },
  romanos: { en: "Romans", es: "Romanos", apiKey: "ROM" },
  romans: { en: "Romans", es: "Romanos", apiKey: "ROM" },
  "1corintios": { en: "1 Corinthians", es: "1 Corintios", apiKey: "1CO" },
  "1 corintios": { en: "1 Corinthians", es: "1 Corintios", apiKey: "1CO" },
  "1corinthians": { en: "1 Corinthians", es: "1 Corintios", apiKey: "1CO" },
  "1 corinthians": { en: "1 Corinthians", es: "1 Corintios", apiKey: "1CO" },
  "2corintios": { en: "2 Corinthians", es: "2 Corintios", apiKey: "2CO" },
  "2 corintios": { en: "2 Corinthians", es: "2 Corintios", apiKey: "2CO" },
  "2corinthians": { en: "2 Corinthians", es: "2 Corintios", apiKey: "2CO" },
  "2 corinthians": { en: "2 Corinthians", es: "2 Corintios", apiKey: "2CO" },
  galatas: { en: "Galatians", es: "Gálatas", apiKey: "GAL" },
  gálatas: { en: "Galatians", es: "Gálatas", apiKey: "GAL" },
  galatians: { en: "Galatians", es: "Gálatas", apiKey: "GAL" },
  efesios: { en: "Ephesians", es: "Efesios", apiKey: "EPH" },
  ephesians: { en: "Ephesians", es: "Efesios", apiKey: "EPH" },
  filipenses: { en: "Philippians", es: "Filipenses", apiKey: "PHP" },
  philippians: { en: "Philippians", es: "Filipenses", apiKey: "PHP" },
  colosenses: { en: "Colossians", es: "Colosenses", apiKey: "COL" },
  colossians: { en: "Colossians", es: "Colosenses", apiKey: "COL" },
  "1tesalonicenses": { en: "1 Thessalonians", es: "1 Tesalonicenses", apiKey: "1TH" },
  "1 tesalonicenses": { en: "1 Thessalonians", es: "1 Tesalonicenses", apiKey: "1TH" },
  "1thessalonians": { en: "1 Thessalonians", es: "1 Tesalonicenses", apiKey: "1TH" },
  "1 thessalonians": { en: "1 Thessalonians", es: "1 Tesalonicenses", apiKey: "1TH" },
  "2tesalonicenses": { en: "2 Thessalonians", es: "2 Tesalonicenses", apiKey: "2TH" },
  "2 tesalonicenses": { en: "2 Thessalonians", es: "2 Tesalonicenses", apiKey: "2TH" },
  "2thessalonians": { en: "2 Thessalonians", es: "2 Tesalonicenses", apiKey: "2TH" },
  "2 thessalonians": { en: "2 Thessalonians", es: "2 Tesalonicenses", apiKey: "2TH" },
  "1timoteo": { en: "1 Timothy", es: "1 Timoteo", apiKey: "1TI" },
  "1 timoteo": { en: "1 Timothy", es: "1 Timoteo", apiKey: "1TI" },
  "1timothy": { en: "1 Timothy", es: "1 Timoteo", apiKey: "1TI" },
  "1 timothy": { en: "1 Timothy", es: "1 Timoteo", apiKey: "1TI" },
  "2timoteo": { en: "2 Timothy", es: "2 Timoteo", apiKey: "2TI" },
  "2 timoteo": { en: "2 Timothy", es: "2 Timoteo", apiKey: "2TI" },
  "2timothy": { en: "2 Timothy", es: "2 Timoteo", apiKey: "2TI" },
  "2 timothy": { en: "2 Timothy", es: "2 Timoteo", apiKey: "2TI" },
  tito: { en: "Titus", es: "Tito", apiKey: "TIT" },
  titus: { en: "Titus", es: "Tito", apiKey: "TIT" },
  filemon: { en: "Philemon", es: "Filemón", apiKey: "PHM" },
  filemón: { en: "Philemon", es: "Filemón", apiKey: "PHM" },
  philemon: { en: "Philemon", es: "Filemón", apiKey: "PHM" },
  hebreos: { en: "Hebrews", es: "Hebreos", apiKey: "HEB" },
  hebrews: { en: "Hebrews", es: "Hebreos", apiKey: "HEB" },
  santiago: { en: "James", es: "Santiago", apiKey: "JAS" },
  james: { en: "James", es: "Santiago", apiKey: "JAS" },
  "1pedro": { en: "1 Peter", es: "1 Pedro", apiKey: "1PE" },
  "1 pedro": { en: "1 Peter", es: "1 Pedro", apiKey: "1PE" },
  "1peter": { en: "1 Peter", es: "1 Pedro", apiKey: "1PE" },
  "1 peter": { en: "1 Peter", es: "1 Pedro", apiKey: "1PE" },
  "2pedro": { en: "2 Peter", es: "2 Pedro", apiKey: "2PE" },
  "2 pedro": { en: "2 Peter", es: "2 Pedro", apiKey: "2PE" },
  "2peter": { en: "2 Peter", es: "2 Pedro", apiKey: "2PE" },
  "2 peter": { en: "2 Peter", es: "2 Pedro", apiKey: "2PE" },
  "1juan": { en: "1 John", es: "1 Juan", apiKey: "1JN" },
  "1 juan": { en: "1 John", es: "1 Juan", apiKey: "1JN" },
  "1john": { en: "1 John", es: "1 Juan", apiKey: "1JN" },
  "1 john": { en: "1 John", es: "1 Juan", apiKey: "1JN" },
  "2juan": { en: "2 John", es: "2 Juan", apiKey: "2JN" },
  "2 juan": { en: "2 John", es: "2 Juan", apiKey: "2JN" },
  "2john": { en: "2 John", es: "2 Juan", apiKey: "2JN" },
  "2 john": { en: "2 John", es: "2 Juan", apiKey: "2JN" },
  "3juan": { en: "3 John", es: "3 Juan", apiKey: "3JN" },
  "3 juan": { en: "3 John", es: "3 Juan", apiKey: "3JN" },
  "3john": { en: "3 John", es: "3 Juan", apiKey: "3JN" },
  "3 john": { en: "3 John", es: "3 Juan", apiKey: "3JN" },
  judas: { en: "Jude", es: "Judas", apiKey: "JUD" },
  jude: { en: "Jude", es: "Judas", apiKey: "JUD" },
  apocalipsis: { en: "Revelation", es: "Apocalipsis", apiKey: "REV" },
  revelation: { en: "Revelation", es: "Apocalipsis", apiKey: "REV" },
};

export interface ParsedReference {
  book: string;
  bookKey: string;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number | null;
  verseEnd: number | null;
  referenceDisplay: string;
  refKey: string;
}

/**
 * Clean a Bible reference by removing prepositions and extra text
 */
function cleanBibleReference(reference: string): string {
  let cleaned = reference.trim();

  // Remove common prepositions at the start (Spanish and English)
  // "En Efesios 4:32" -> "Efesios 4:32"
  // "In John 3:16" -> "John 3:16"
  cleaned = cleaned.replace(/^(en|in|from|de|según|segun|see|ver)\s+/i, "");

  return cleaned.trim();
}

/**
 * Parse a Bible reference string into structured data
 * Examples: "Lucas 10:25-37", "Juan 3:16", "1 Reyes 3:28", "Salmos 23:1-6"
 * Also supports chapter-only: "2 Samuel 11", "Salmo 51", "Génesis 37"
 */
export function parseReference(reference: string): ParsedReference | null {
  // Clean up the reference (remove prepositions, etc.)
  const cleaned = cleanBibleReference(reference);

  // Try full format first: "Book Chapter:Verse(-VerseEnd)"
  const fullRegex = /^(\d?\s*[A-Za-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]+)?)\s+(\d+):(\d+)(?:[-–](\d+))?$/i;
  const fullMatch = cleaned.match(fullRegex);

  // Fallback: chapter-only format "Book Chapter" (no verse)
  const chapterOnlyRegex = /^(\d?\s*[A-Za-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]+)?)\s+(\d+)$/i;
  const chapterMatch = !fullMatch ? cleaned.match(chapterOnlyRegex) : null;

  const match = fullMatch || chapterMatch;
  if (!match) {
    console.log(`[Bible] Could not parse reference: "${reference}"`);
    return null;
  }

  const isChapterOnly = !fullMatch && !!chapterMatch;
  const bookPart = match[1];
  const chapterStr = match[2];
  const verseStartStr = fullMatch ? match[3] : undefined;
  const verseEndStr = fullMatch ? match[4] : undefined;

  if (!bookPart || !chapterStr) {
    console.log(`[Bible] Missing required parts in reference: "${reference}"`);
    return null;
  }

  const bookNormalized = bookPart.toLowerCase().trim().replace(/\s+/g, " ");

  // Find the book in mappings
  const bookInfo = BOOK_MAPPINGS[bookNormalized] || BOOK_MAPPINGS[bookNormalized.replace(/\s/g, "")];
  if (!bookInfo) {
    console.log(`[Bible] Unknown book: "${bookPart}"`);
    return null;
  }

  const chapterStart = parseInt(chapterStr, 10);
  // For chapter-only refs, default to verse 1 (will fetch full chapter beginning)
  const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : 1;
  const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : null;

  // For chapter-only refs, use a special refKey that won't collide with verse refs
  const refKey = isChapterOnly
    ? `${bookInfo.apiKey.toLowerCase()}_${chapterStart}_chapter`
    : createRefKey(bookInfo.apiKey, chapterStart, verseStart, verseEnd);

  return {
    book: bookPart.trim(),
    bookKey: bookInfo.apiKey,
    chapterStart,
    verseStart,
    chapterEnd: verseEnd ? chapterStart : null,
    verseEnd,
    referenceDisplay: cleaned,
    refKey,
  };
}

/**
 * Create a normalized reference key for caching
 */
function createRefKey(bookKey: string, chapter: number, verseStart: number, verseEnd: number | null): string {
  if (verseEnd && verseEnd !== verseStart) {
    return `${bookKey.toLowerCase()}_${chapter}_${verseStart}-${verseEnd}`;
  }
  return `${bookKey.toLowerCase()}_${chapter}_${verseStart}`;
}

/**
 * Get book name in the specified language
 */
export function getBookName(bookKey: string, lang: "en" | "es"): string {
  for (const [, info] of Object.entries(BOOK_MAPPINGS)) {
    if (info.apiKey === bookKey) {
      return info[lang];
    }
  }
  return bookKey;
}

/**
 * Fetch Bible passage from API.bible
 * Uses the free API.bible service
 */
async function fetchFromBibleAPI(
  bookKey: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  lang: "en" | "es"
): Promise<string | null> {
  // Bible IDs for API.bible
  // Spanish: Reina Valera 1909 = "592420522e16049f-01"
  // English: King James Version = "de4e12af7f28f599-02"
  const bibleId = lang === "es" ? "592420522e16049f-01" : "de4e12af7f28f599-02";

  // Build verse reference
  const verseRef = verseEnd ? `${bookKey}.${chapter}.${verseStart}-${bookKey}.${chapter}.${verseEnd}` : `${bookKey}.${chapter}.${verseStart}`;

  const apiKey = process.env.BIBLE_API_KEY;

  if (!apiKey) {
    console.log("[Bible] No BIBLE_API_KEY configured, using fallback method");
    return fetchFromBibleGateway(bookKey, chapter, verseStart, verseEnd, lang);
  }

  try {
    const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${verseRef}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`;

    const response = await fetch(url, {
      headers: {
        "api-key": apiKey,
      },
    });

    if (!response.ok) {
      console.log(`[Bible] API.bible error: ${response.status}`);
      return fetchFromBibleGateway(bookKey, chapter, verseStart, verseEnd, lang);
    }

    const data = (await response.json()) as { data?: { content?: string } };
    const content = data.data?.content;

    if (content) {
      // Clean up the text
      return cleanPassageText(content);
    }

    return null;
  } catch (error) {
    console.error("[Bible] Error fetching from API.bible:", error);
    return fetchFromBibleGateway(bookKey, chapter, verseStart, verseEnd, lang);
  }
}

/**
 * Fallback: Fetch from Bible Gateway (web scraping as backup)
 */
async function fetchFromBibleGateway(
  bookKey: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  lang: "en" | "es"
): Promise<string | null> {
  try {
    // Get book name for the URL
    const bookName = getBookName(bookKey, lang);
    const version = lang === "es" ? "RVR1960" : "KJV";
    const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;

    const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(bookName)}+${chapter}:${verseRange}&version=${version}`;

    console.log(`[Bible] Fetching from BibleGateway: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DailyLight/1.0)",
      },
    });

    if (!response.ok) {
      console.log(`[Bible] BibleGateway error: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract passage text from HTML
    // Look for the passage-text div
    const passageMatch = html.match(/<div class="passage-text"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    if (passageMatch && passageMatch[1]) {
      let text: string = passageMatch[1];
      // Remove HTML tags but keep verse numbers
      text = text.replace(/<sup[^>]*class="versenum"[^>]*>(\d+)<\/sup>/g, "[$1] ");
      text = text.replace(/<[^>]+>/g, " ");
      text = text.replace(/&nbsp;/g, " ");
      text = text.replace(/\s+/g, " ").trim();
      return text;
    }

    // Alternative extraction
    const altMatch = html.match(/<p class="[^"]*"[^>]*>([\s\S]*?)<\/p>/g);
    if (altMatch) {
      let text = altMatch.join(" ");
      text = text.replace(/<sup[^>]*>(\d+)<\/sup>/g, "[$1] ");
      text = text.replace(/<[^>]+>/g, " ");
      text = text.replace(/\s+/g, " ").trim();
      if (text.length > 20) {
        return text;
      }
    }

    console.log("[Bible] Could not extract passage from BibleGateway");
    return null;
  } catch (error) {
    console.error("[Bible] Error fetching from BibleGateway:", error);
    return null;
  }
}

/**
 * Clean passage text from API response
 */
function cleanPassageText(text: string): string {
  return text
    .replace(/\[(\d+)\]/g, "[$1] ") // Format verse numbers
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get Bible passage - checks cache first, then fetches from API
 */
export async function getBiblePassage(
  reference: string,
  lang: "en" | "es"
): Promise<{
  success: boolean;
  passage?: {
    referenceDisplay: string;
    text: string;
    book: string;
  };
  error?: string;
}> {
  try {
    // Parse the reference
    const parsed = parseReference(reference);
    if (!parsed) {
      return {
        success: false,
        error: lang === "es" ? "Referencia bíblica no válida" : "Invalid Bible reference",
      };
    }

    // Check database cache first
    const cached = await prisma.biblePassage.findUnique({
      where: {
        refKey_lang: {
          refKey: parsed.refKey,
          lang,
        },
      },
    });

    if (cached) {
      console.log(`[Bible] Cache hit for ${parsed.refKey} (${lang})`);
      return {
        success: true,
        passage: {
          referenceDisplay: cached.referenceDisplay,
          text: cached.text,
          book: cached.book,
        },
      };
    }

    // Fetch from API
    console.log(`[Bible] Cache miss, fetching ${parsed.refKey} (${lang})`);
    // For chapter-only references, fetch a reasonable span (verses 1–30) to give context
    const isChapterOnlyFetch = parsed.refKey.endsWith('_chapter');
    const fetchVerseStart = parsed.verseStart;
    const fetchVerseEnd = isChapterOnlyFetch ? 30 : parsed.verseEnd;
    const text = await fetchFromBibleAPI(
      parsed.bookKey,
      parsed.chapterStart,
      fetchVerseStart,
      fetchVerseEnd,
      lang
    );

    if (!text) {
      return {
        success: false,
        error: lang === "es" ? "No se pudo obtener el pasaje" : "Could not fetch passage",
      };
    }

    // Get proper book name for the language
    const bookName = getBookName(parsed.bookKey, lang);

    // Build display reference
    // For chapter-only refs (refKey ends with _chapter), show "Book Chapter"
    const isChapterOnly = parsed.refKey.endsWith('_chapter');
    const displayRef = isChapterOnly
      ? `${bookName} ${parsed.chapterStart}`
      : parsed.verseEnd
        ? `${bookName} ${parsed.chapterStart}:${parsed.verseStart}-${parsed.verseEnd}`
        : `${bookName} ${parsed.chapterStart}:${parsed.verseStart}`;

    // Cache in database
    await prisma.biblePassage.create({
      data: {
        refKey: parsed.refKey,
        lang,
        book: bookName,
        chapterStart: parsed.chapterStart,
        verseStart: parsed.verseStart,
        chapterEnd: parsed.chapterEnd,
        verseEnd: parsed.verseEnd,
        referenceDisplay: displayRef,
        text,
        source: "api",
      },
    });

    console.log(`[Bible] Cached passage: ${parsed.refKey} (${lang})`);

    return {
      success: true,
      passage: {
        referenceDisplay: displayRef,
        text,
        book: bookName,
      },
    };
  } catch (error) {
    console.error("[Bible] Error getting passage:", error);
    return {
      success: false,
      error: lang === "es" ? "Error al obtener el pasaje" : "Error fetching passage",
    };
  }
}
