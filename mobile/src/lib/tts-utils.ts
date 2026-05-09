// Bible book translations from English to Spanish
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  'Genesis': 'Genesis',
  'Exodus': 'Exodo',
  'Leviticus': 'Levitico',
  'Numbers': 'Numeros',
  'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josue',
  'Judges': 'Jueces',
  'Ruth': 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Cronicas',
  '2 Chronicles': '2 Cronicas',
  'Ezra': 'Esdras',
  'Nehemiah': 'Nehemias',
  'Esther': 'Ester',
  'Job': 'Job',
  'Psalm': 'Salmo',
  'Psalms': 'Salmos',
  'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastes',
  'Song of Solomon': 'Cantares',
  'Song of Songs': 'Cantares',
  'Isaiah': 'Isaias',
  'Jeremiah': 'Jeremias',
  'Lamentations': 'Lamentaciones',
  'Ezekiel': 'Ezequiel',
  'Daniel': 'Daniel',
  'Hosea': 'Oseas',
  'Joel': 'Joel',
  'Amos': 'Amos',
  'Obadiah': 'Abdias',
  'Jonah': 'Jonas',
  'Micah': 'Miqueas',
  'Nahum': 'Nahum',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sofonias',
  'Haggai': 'Hageo',
  'Zechariah': 'Zacarias',
  'Malachi': 'Malaquias',
  'Matthew': 'Mateo',
  'Mark': 'Marcos',
  'Luke': 'Lucas',
  'John': 'Juan',
  'Acts': 'Hechos',
  'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  'Galatians': 'Galatas',
  'Ephesians': 'Efesios',
  'Philippians': 'Filipenses',
  'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  'Titus': 'Tito',
  'Philemon': 'Filemon',
  'Hebrews': 'Hebreos',
  'James': 'Santiago',
  '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro',
  '1 John': '1 Juan',
  '2 John': '2 Juan',
  '3 John': '3 Juan',
  'Jude': 'Judas',
  'Revelation': 'Apocalipsis',
};

// Translate Bible reference from English to Spanish
export function translateBibleReference(reference: string): string {
  let result = reference;
  // Sort by length descending to match longer names first (e.g., "1 Corinthians" before "Corinthians")
  const sortedEntries = Object.entries(BIBLE_BOOK_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [english, spanish] of sortedEntries) {
    if (result.includes(english)) {
      result = result.replace(english, spanish);
      break;
    }
  }
  return result;
}

// Normalize Bible references for TTS to speak chapter:verse correctly
// Converts "Génesis 3:28" → "Génesis, capítulo 3, versículo 28"
// Converts "1 Samuel 3:4-5" → "Primera de Samuel, capítulo 3, versículos del 4 al 5"
// Converts "2 Samuel 11"    → "Segunda de Samuel, capítulo 11"
// Converts "Salmo 51"       → "Salmo, capítulo 51"
// RULE: ALL numbered books use feminine form (Primera/Segunda/Tercera — never Primero/Segundo)
export function normalizeBibleRefForTTS(text: string, language: 'en' | 'es'): string {
  if (language !== 'es') {
    // For English, convert chapter:verse to "chapter X verse Y" or "chapter X verses Y through Z"
    // Also handle numbered books: "2 Samuel 11" → "Second Samuel, chapter 11"
    const enNumberedBooks = ['Samuel', 'Kings', 'Chronicles', 'Corinthians', 'Thessalonians', 'Timothy', 'Peter', 'John'];
    const enOrdinals: Record<string, string> = { '1': 'First', '2': 'Second', '3': 'Third' };
    let result = text;
    // Numbered book + chapter + optional :verse
    const enBookPattern = new RegExp(
      `(^|[\\s,;.("'])([123])\\s+(${enNumberedBooks.join('|')})\\s+(\\d+)(?::(\\d+)(?:[-–](\\d+))?)?([\\s,;.)"']|$)`,
      'g'
    );
    result = result.replace(enBookPattern, (_m, pre, num, book, chap, vs, vsEnd, suf) => {
      const ord = enOrdinals[num] ?? num;
      if (vs) {
        const verseText = vsEnd ? `verses ${vs} through ${vsEnd}` : `verse ${vs}`;
        return `${pre}${ord} ${book}, chapter ${chap}, ${verseText}${suf}`;
      }
      return `${pre}${ord} ${book}, chapter ${chap}${suf}`;
    });
    // Plain chapter:verse
    result = result.replace(/(\d+):(\d+)(?:[-–](\d+))?/g, (_m, chapter, verseStart, verseEnd) => {
      if (verseEnd) return `chapter ${chapter} verses ${verseStart} through ${verseEnd}`;
      return `chapter ${chapter} verse ${verseStart}`;
    });
    return result;
  }

  // SPANISH — ALL numbered Bible books use feminine ordinals (no exceptions)
  // Guard: 1 → Primera de, 2 → Segunda de, 3 → Tercera de
  const spanishOrdinals: Record<string, string> = {
    '1': 'Primera de',
    '2': 'Segunda de',
    '3': 'Tercera de',
  };

  // List of Bible book names in Spanish (to identify Bible references vs regular numbers)
  const spanishBibleBooks = [
    'Génesis', 'Genesis', 'Éxodo', 'Exodo', 'Levítico', 'Levitico', 'Números', 'Numeros',
    'Deuteronomio', 'Josué', 'Josue', 'Jueces', 'Rut', 'Samuel', 'Reyes', 'Crónicas', 'Cronicas',
    'Esdras', 'Nehemías', 'Nehemias', 'Ester', 'Job', 'Salmos', 'Salmo', 'Proverbios',
    'Eclesiastés', 'Eclesiastes', 'Cantares', 'Isaías', 'Isaias', 'Jeremías', 'Jeremias',
    'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Amos', 'Abdías', 'Abdias',
    'Jonás', 'Jonas', 'Miqueas', 'Nahúm', 'Nahum', 'Habacuc', 'Sofonías', 'Sofonias',
    'Hageo', 'Zacarías', 'Zacarias', 'Malaquías', 'Malaquias',
    'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', 'Corintios', 'Gálatas', 'Galatas',
    'Efesios', 'Filipenses', 'Colosenses', 'Tesalonicenses', 'Timoteo', 'Tito', 'Filemón', 'Filemon',
    'Hebreos', 'Santiago', 'Pedro', 'Judas', 'Apocalipsis'
  ];

  // Pre-sanitize dirty formats like "1 Samuel:3:4" → "1 Samuel 3:4"
  let result = text.replace(
    new RegExp(
      `([123])?\\s*(${spanishBibleBooks.join('|')}):(\\d+)`,
      'gi'
    ),
    (_m, num, book, chap) => num ? `${num} ${book} ${chap}` : `${book} ${chap}`
  );

  // Pattern for chapter:verse references (with optional verse range)
  const bibleRefWithVersePattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+):(\\d+)` + // Chapter:verse
    `(?:[-–](\\d+))?` + // Optional verse range end
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefWithVersePattern, (_match, prefix, num, book, chapter, verseStart, verseEnd, suffix) => {
    let expandedBook = book;
    if (num) {
      expandedBook = `${spanishOrdinals[num] ?? `${num}ª de`} ${book}`;
    }
    const verseText = verseEnd
      ? `versículos del ${verseStart} al ${verseEnd}`
      : `versículo ${verseStart}`;
    return `${prefix}${expandedBook}, capítulo ${chapter}, ${verseText}${suffix}`;
  });

  // Pattern for chapter-only references (no :verse part)
  // Matches: "2 Samuel 11", "Salmo 51", "Génesis 37"
  const bibleRefChapterOnlyPattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+)` + // Chapter number
    `(?![:\\d])` + // NOT followed by : or digit (avoid double-matching chapter:verse)
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefChapterOnlyPattern, (_match, prefix, num, book, chapter, suffix) => {
    let expandedBook = book;
    if (num) {
      expandedBook = `${spanishOrdinals[num] ?? `${num}ª de`} ${book}`;
    }
    return `${prefix}${expandedBook}, capítulo ${chapter}${suffix}`;
  });

  return result;
}

// Helper to convert Bible references to spoken form
export function formatBibleReferenceForSpeech(reference: string, language: 'en' | 'es'): string {
  const spanishConversions: Record<string, string> = {
    '1 Pedro': 'Primera de Pedro',
    '2 Pedro': 'Segunda de Pedro',
    '1 Juan': 'Primera de Juan',
    '2 Juan': 'Segunda de Juan',
    '3 Juan': 'Tercera de Juan',
    '1 Corintios': 'Primera de Corintios',
    '2 Corintios': 'Segunda de Corintios',
    '1 Tesalonicenses': 'Primera de Tesalonicenses',
    '2 Tesalonicenses': 'Segunda de Tesalonicenses',
    '1 Timoteo': 'Primera de Timoteo',
    '2 Timoteo': 'Segunda de Timoteo',
    '1 Reyes': 'Primera de Reyes',
    '2 Reyes': 'Segunda de Reyes',
    '1 Samuel': 'Primera de Samuel',
    '2 Samuel': 'Segunda de Samuel',
    '1 Cronicas': 'Primera de Cronicas',
    '2 Cronicas': 'Segunda de Cronicas',
  };

  const englishConversions: Record<string, string> = {
    '1 Peter': 'First Peter',
    '2 Peter': 'Second Peter',
    '1 John': 'First John',
    '2 John': 'Second John',
    '3 John': 'Third John',
    '1 Corinthians': 'First Corinthians',
    '2 Corinthians': 'Second Corinthians',
    '1 Thessalonians': 'First Thessalonians',
    '2 Thessalonians': 'Second Thessalonians',
    '1 Timothy': 'First Timothy',
    '2 Timothy': 'Second Timothy',
    '1 Kings': 'First Kings',
    '2 Kings': 'Second Kings',
    '1 Samuel': 'First Samuel',
    '2 Samuel': 'Second Samuel',
    '1 Chronicles': 'First Chronicles',
    '2 Chronicles': 'Second Chronicles',
  };

  const conversions = language === 'es' ? spanishConversions : englishConversions;
  let result = reference;
  for (const [key, value] of Object.entries(conversions)) {
    if (result.includes(key)) {
      result = result.replace(key, value);
      break;
    }
  }

  // Apply chapter:verse normalization for TTS
  result = normalizeBibleRefForTTS(result, language);

  return result;
}
