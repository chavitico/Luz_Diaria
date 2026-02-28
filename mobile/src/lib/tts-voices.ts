// Curated TTS Voices - only high-quality, natural voices for devotional content
// These voices are optimized for calm, meditative reading experiences

import * as Speech from 'expo-speech';

export interface CuratedVoice {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  isDefault?: boolean;
  voicePatterns: string[]; // Patterns to match against available device voices
  language: 'en' | 'es' | 'both';
  tone: 'gentle' | 'calm' | 'warm' | 'deep';
}

// Curated Spanish voices for devotional content
export const CURATED_VOICES_ES: CuratedVoice[] = [
  {
    id: 'default',
    name: 'System Default',
    nameEs: 'Voz del Sistema',
    description: 'Your device\'s default voice',
    descriptionEs: 'La voz predeterminada de tu dispositivo',
    isDefault: true,
    voicePatterns: [],
    language: 'both',
    tone: 'calm',
  },
  {
    id: 'meditation_soft',
    name: 'Soft Meditation',
    nameEs: 'Meditacion Suave',
    description: 'Warm, gentle voice for prayer and night reading',
    descriptionEs: 'Voz calida y suave, ideal para oracion y lectura nocturna',
    voicePatterns: [
      'com.apple.ttsbundle.Monica-compact',
      'com.apple.voice.compact.es-ES.Monica',
      'com.apple.eloquence.es-ES.Grandma',
      'es-ES-Standard-A', // Google female
      'es-MX-Standard-A',
      'Monica',
      'Paulina',
    ],
    language: 'es',
    tone: 'gentle',
  },
  {
    id: 'narrator_devotional',
    name: 'Devotional Narrator',
    nameEs: 'Narrador Devocional',
    description: 'Deep, peaceful voice for stories and reflections',
    descriptionEs: 'Voz profunda y serena para historias y reflexiones',
    voicePatterns: [
      'com.apple.ttsbundle.Jorge-compact',
      'com.apple.voice.compact.es-ES.Jorge',
      'com.apple.eloquence.es-ES.Grandpa',
      'es-ES-Standard-B', // Google male
      'es-MX-Standard-B',
      'Jorge',
      'Diego',
    ],
    language: 'es',
    tone: 'deep',
  },
  {
    id: 'latina_pastoral',
    name: 'Latina Pastoral',
    nameEs: 'Voz Pastoral Latina',
    description: 'Warm, pastoral Latin American voice — ideal for biblical narration',
    descriptionEs: 'Voz cálida y pastoral latinoamericana — ideal para narración bíblica',
    voicePatterns: [
      // iOS Latin American (warm, neutral accent)
      'com.apple.ttsbundle.Paulina-compact',
      'com.apple.voice.compact.es-MX.Paulina',
      'com.apple.voice.premium.es-MX.Paulina',
      'com.apple.eloquence.es-MX.Rocko',
      'com.apple.eloquence.es-MX.Sandy',
      // Fallback to any Latin American ES voice
      'es-MX',
      'es-419',
      'Paulina',
      'Luciana',
      'es-US',
    ],
    language: 'es',
    tone: 'warm',
  },
];

// Curated English voices for devotional content
export const CURATED_VOICES_EN: CuratedVoice[] = [
  {
    id: 'default',
    name: 'System Default',
    nameEs: 'Voz del Sistema',
    description: 'Your device\'s default voice',
    descriptionEs: 'La voz predeterminada de tu dispositivo',
    isDefault: true,
    voicePatterns: [],
    language: 'both',
    tone: 'calm',
  },
  {
    id: 'meditation_soft',
    name: 'Soft Meditation',
    nameEs: 'Meditacion Suave',
    description: 'Warm, gentle voice for prayer and night reading',
    descriptionEs: 'Voz calida y suave, ideal para oracion y lectura nocturna',
    voicePatterns: [
      'com.apple.ttsbundle.Samantha-compact',
      'com.apple.voice.compact.en-US.Samantha',
      'com.apple.eloquence.en-US.Grandma',
      'en-US-Standard-C', // Google female
      'en-US-Standard-E',
      'Samantha',
      'Karen',
    ],
    language: 'en',
    tone: 'gentle',
  },
  {
    id: 'narrator_devotional',
    name: 'Devotional Narrator',
    nameEs: 'Narrador Devocional',
    description: 'Deep, peaceful voice for stories and reflections',
    descriptionEs: 'Voz profunda y serena para historias y reflexiones',
    voicePatterns: [
      'com.apple.ttsbundle.Daniel-compact',
      'com.apple.voice.compact.en-GB.Daniel',
      'com.apple.eloquence.en-US.Grandpa',
      'en-US-Standard-B', // Google male
      'en-US-Standard-D',
      'Daniel',
      'Alex',
    ],
    language: 'en',
    tone: 'deep',
  },
];

// Helper function to get curated voices for a language
export function getCuratedVoices(language: 'en' | 'es'): CuratedVoice[] {
  return language === 'es' ? CURATED_VOICES_ES : CURATED_VOICES_EN;
}

// Helper function to find the best matching device voice for a curated voice
export function findMatchingDeviceVoice(
  curatedVoice: CuratedVoice,
  availableVoices: Speech.Voice[],
  language: 'en' | 'es'
): Speech.Voice | undefined {
  if (curatedVoice.id === 'default') return undefined;

  const langPrefix = language === 'es' ? 'es' : 'en';

  // Try to match against voice patterns
  for (const pattern of curatedVoice.voicePatterns) {
    const match = availableVoices.find(v =>
      (v.identifier.includes(pattern) || v.name?.includes(pattern)) &&
      v.language.startsWith(langPrefix)
    );
    if (match) return match;
  }

  // Fallback: find any voice in the correct language
  return availableVoices.find(v => v.language.startsWith(langPrefix));
}

// Helper function to get device voice identifier for a curated voice ID
export function getDeviceVoiceIdentifier(
  curatedVoiceId: string,
  availableVoices: Speech.Voice[],
  language: 'en' | 'es'
): string | undefined {
  if (curatedVoiceId === 'default' || !availableVoices.length) {
    return undefined;
  }

  // Find the curated voice by ID
  const curatedVoices = getCuratedVoices(language);
  const curatedVoice = curatedVoices.find(v => v.id === curatedVoiceId);

  if (!curatedVoice) {
    // Fallback to default behavior
    return undefined;
  }

  // Find matching device voice for the curated voice
  const deviceVoice = findMatchingDeviceVoice(curatedVoice, availableVoices, language);
  return deviceVoice?.identifier;
}

// Preview text for voice testing
export function getPreviewText(language: 'en' | 'es'): string {
  return language === 'es'
    ? 'El Señor es mi pastor, nada me faltara.'
    : 'The Lord is my shepherd, I shall not want.';
}

/**
 * Adds natural pauses after numbered points in text for better TTS readability.
 * Converts "1. First point. 2. Second point." to "1. First point. ... 2. Second point."
 * The ellipsis creates a natural pause when spoken by TTS engines.
 */
export function addTTSPausesForNumberedPoints(text: string): string {
  // Pattern matches:
  // - End of a sentence (. or !) followed by whitespace
  // - Then a number followed by a period (e.g., "2.", "3.")
  // We insert a pause (ellipsis) before the number
  return text.replace(/([.!])\s+(\d+\.)/g, '$1 ... $2');
}

// Map of small numbers to Spanish words for natural TTS reading
const SPANISH_NUMBERS: Record<number, string> = {
  1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
  6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
  11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
  16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
  20: 'veinte', 21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés',
  24: 'veinticuatro', 25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete',
  28: 'veintiocho', 29: 'veintinueve', 30: 'treinta',
};

/**
 * Converts a number to its Spanish spoken form if it's in the small number map.
 * Falls back to the numeric string for larger numbers.
 */
function numberToSpanishWord(n: number): string {
  return SPANISH_NUMBERS[n] ?? String(n);
}

/**
 * Preprocesses text to ensure TTS engines pronounce numbers naturally,
 * inserting pauses and converting small integers to spoken words so they
 * don't run together with adjacent words.
 *
 * Examples:
 *   "liberaciónDOS" or "liberación2"  → "liberación… dos"
 *   "Salmo ciento cincuentaDOS"       → "Salmo ciento cincuenta… dos"
 *   "capítulo 3, versículo 5"         → "capítulo tres, versículo cinco"
 *   standalone "2"                     → "dos"
 *
 * The ellipsis ("…") creates a natural auditory pause on iOS/Android TTS.
 */
export function preprocessNumbersForTTS(text: string): string {
  let result = text;

  // 1. Insert "… " between a letter directly followed by a digit (no space)
  //    e.g. "liberación2" → "liberación… 2"
  result = result.replace(/([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])(\d)/g, '$1… $2');

  // 2. Insert " …" between a digit directly followed by a letter (no space)
  //    e.g. "2da" → "2 …da" (edge case ordinal suffix)
  result = result.replace(/(\d)([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])/g, '$1 …$2');

  // 3. Convert standalone small integers to Spanish spoken words with surrounding pauses
  //    " 2 " → " dos " — this avoids robotic digit-by-digit reading
  result = result.replace(/(^|\s)(\d{1,2})(\s|[.,;:!?]|$)/g, (_m, pre, numStr, suf) => {
    const n = parseInt(numStr, 10);
    const word = numberToSpanishWord(n);
    return `${pre}${word}${suf}`;
  });

  // 4. For larger isolated numbers (3+ digits not already converted), wrap with pauses
  result = result.replace(/(^|\s)(\d{3,})(\s|[.,;:!?]|$)/g, '$1… $2 …$3');

  return result;
}

/**
 * Sanitizes text before sending to TTS engine.
 * Removes cross-reference garbage injected by Bible APIs/scrapers and
 * other annotations that should not be read aloud.
 */
export function sanitizeForTTS(text: string): string {
  let result = text;

  // Remove footnote/cross-reference markers like (A), (B), (C), ...
  result = result.replace(/\([A-Z]\)/g, '');

  // Remove common BibleGateway UI strings that leak into passage text
  result = result.replace(/Read full chapter/gi, '');
  result = result.replace(/Cross references/gi, '');
  result = result.replace(/in all (Spanish|English|Portuguese|French|German) translations/gi, '');
  result = result.replace(/New International Version/gi, '');
  result = result.replace(/King James Version/gi, '');
  result = result.replace(/Reina[- ]Valera/gi, '');
  result = result.replace(/Nueva Versión Internacional/gi, '');

  // Remove dangling square-bracket verse numbers that TTS might read oddly: [25] → ""
  // (The modal formats them as "25 " but TTS might receive them raw)
  result = result.replace(/\[\d+\]\s?/g, '');

  // Collapse multiple spaces / newlines
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}
