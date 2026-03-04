/**
 * voice-picker.ts — Single source of truth for TTS voice selection.
 *
 * Algorithm:
 *  1. Load device voices via Speech.getAvailableVoicesAsync()
 *  2. Filter by language (es accepts: es-*, en accepts: en-*)
 *  3. Score each candidate deterministically
 *  4. Return best { language, voiceIdentifier } or null if none found
 *  5. Cache result in AsyncStorage per (language + voiceList hash)
 *
 * Scoring (higher = better):
 *   +40  quality === 'Enhanced' or 'Premium' (iOS)
 *   +20  female indicators in name (Paulina, Mónica, Sandy, etc.)
 *   -10  name contains 'compact' (lower quality tier on iOS)
 *   -20  name contains 'robot', 'default'
 *   +5   preferred locale (es-419 / es-MX / es-US  > es-ES) for Spanish
 *        preferred locale (en-US > en-GB/other) for English
 */

import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PickedVoice {
  language: string;       // BCP-47 tag to pass to Speech.speak()
  voiceIdentifier: string;
  name: string;
  quality: string;
  isFallback: boolean;    // true if no good voice found, using device default
  score: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = 'tts_voice_v2_';
const CACHE_HASH_KEY_PREFIX = 'tts_voice_hash_v2_';

/**
 * Female name indicators (Spanish and common voices across platforms).
 * Names are lower-cased before matching.
 */
const FEMALE_NAME_INDICATORS = [
  'paulina', 'mónica', 'monica', 'sandy', 'luciana', 'valeria', 'sofía', 'sofia',
  'isabella', 'carmen', 'rosa', 'laura', 'ana', 'maria', 'paula', 'elena',
  'pilar', 'conchita', 'ioana', 'lupe', 'angelica', 'catalina', 'estrella',
  // English
  'samantha', 'karen', 'victoria', 'fiona', 'tessa', 'moira', 'veena',
  'allison', 'ava', 'susan', 'zoe', 'kate',
];

/**
 * Locale preference order for Spanish.
 * Higher index = more preferred.
 */
const ES_LOCALE_PREFERENCE: string[] = [
  'es-ES',      // 0 — castilian, lower preference
  'es-US',      // 1
  'es-419',     // 2 — Latin American
  'es-MX',      // 3 — Mexican Spanish (best for this app)
];

/**
 * BCP-47 language tags to use when calling Speech.speak()
 * Maps our internal language code to a concrete tag.
 */
const SPEAK_LANGUAGE_TAG: Record<string, string> = {
  es: 'es-419',
  en: 'en-US',
};

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreVoice(voice: Speech.Voice, langCode: 'en' | 'es'): number {
  let score = 0;
  const nameLower = (voice.name ?? '').toLowerCase();
  const idLower = (voice.identifier ?? '').toLowerCase();
  const qualityLower = ((voice as any).quality ?? '').toLowerCase();

  // Quality bonus
  if (qualityLower === 'enhanced' || qualityLower === 'premium') {
    score += 40;
  }

  // Female name bonus
  if (FEMALE_NAME_INDICATORS.some((f) => nameLower.includes(f))) {
    score += 20;
  }

  // Penalise low-quality tier names
  if (nameLower.includes('compact') || idLower.includes('compact')) {
    score -= 10;
  }
  if (nameLower.includes('robot') || nameLower.includes('default')) {
    score -= 20;
  }

  // Locale preference for Spanish
  if (langCode === 'es') {
    const prefIdx = ES_LOCALE_PREFERENCE.indexOf(voice.language);
    if (prefIdx >= 0) {
      score += prefIdx * 3; // 0..9 bonus
    }
  }

  // Locale preference for English: prefer en-US
  if (langCode === 'en') {
    if (voice.language === 'en-US') score += 5;
  }

  return score;
}

// ─── Hash helper (simple, deterministic) ────────────────────────────────────

function hashVoiceList(voices: Speech.Voice[]): string {
  // Use count + sorted identifiers as a cheap fingerprint
  const ids = voices
    .map((v) => v.identifier)
    .sort()
    .join(',');
  // djb2-like hash
  let hash = 5381;
  for (let i = 0; i < ids.length; i++) {
    hash = ((hash << 5) + hash) ^ ids.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return `${voices.length}_${hash}`;
}

// ─── Core function ───────────────────────────────────────────────────────────

/**
 * Picks the best available voice for the given language code.
 *
 * Returns a PickedVoice with explicit language + voiceIdentifier so every
 * Speech.speak() call can pass both parameters without relying on system defaults.
 *
 * If no acceptable voice exists, returns a PickedVoice with isFallback=true
 * and voiceIdentifier = '' (caller should still pass language but omit voice).
 *
 * Results are cached in AsyncStorage and invalidated when the voice list changes.
 */
export async function pickBestVoice(langCode: 'en' | 'es'): Promise<PickedVoice> {
  try {
    // 1. Get available voices
    const allVoices = await Speech.getAvailableVoicesAsync();

    // 2. Compute hash to detect OS voice list changes
    const currentHash = hashVoiceList(allVoices);
    const hashKey = `${CACHE_HASH_KEY_PREFIX}${langCode}`;
    const cacheKey = `${CACHE_KEY_PREFIX}${langCode}`;

    // 3. Check cache
    const [cachedHash, cachedVoiceJson] = await Promise.all([
      AsyncStorage.getItem(hashKey),
      AsyncStorage.getItem(cacheKey),
    ]);

    if (cachedHash === currentHash && cachedVoiceJson) {
      const cached = JSON.parse(cachedVoiceJson) as PickedVoice;
      // Verify cached voice still exists on device
      const stillExists = allVoices.some((v) => v.identifier === cached.voiceIdentifier);
      if (stillExists) {
        if (__DEV__) {
          console.log(
            `[VoicePicker] Using cached voice for "${langCode}": ` +
            `${cached.name} | ${cached.voiceIdentifier} | quality: ${cached.quality} | score: ${cached.score}`
          );
        }
        return cached;
      }
    }

    // 4. Filter voices by language
    const langPrefix = langCode === 'es' ? 'es' : 'en';
    const candidates = allVoices.filter((v) => v.language?.startsWith(langPrefix));

    if (candidates.length === 0) {
      // No matching language voice at all — full fallback
      const fallback: PickedVoice = {
        language: SPEAK_LANGUAGE_TAG[langCode],
        voiceIdentifier: '',
        name: 'System Default',
        quality: 'unknown',
        isFallback: true,
        score: -999,
      };
      if (__DEV__) {
        console.warn(`[VoicePicker] No voices found for language "${langCode}". Using system default.`);
      }
      return fallback;
    }

    // 5. Score all candidates and sort descending
    const scored = candidates.map((v) => ({
      voice: v,
      score: scoreVoice(v, langCode),
    }));
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const quality = (best.voice as any).quality ?? 'unknown';
    const isFallback = best.score < 0; // negative score means only bad options available

    const result: PickedVoice = {
      language: best.voice.language ?? SPEAK_LANGUAGE_TAG[langCode],
      voiceIdentifier: best.voice.identifier,
      name: best.voice.name ?? best.voice.identifier,
      quality,
      isFallback,
      score: best.score,
    };

    if (__DEV__) {
      console.log(
        `[VoicePicker] Selected voice for "${langCode}": ` +
        `${result.name} | ${result.voiceIdentifier} | lang: ${result.language} | quality: ${quality} | score: ${result.score}`
      );
      // Log top 3 for debugging
      scored.slice(0, 3).forEach((s, i) => {
        console.log(
          `  #${i + 1}: ${s.voice.name} (${s.voice.identifier}) ` +
          `lang=${s.voice.language} quality=${(s.voice as any).quality ?? '?'} score=${s.score}`
        );
      });
    }

    // 6. Cache result
    await Promise.all([
      AsyncStorage.setItem(hashKey, currentHash),
      AsyncStorage.setItem(cacheKey, JSON.stringify(result)),
    ]);

    return result;
  } catch (err) {
    // Last-resort fallback
    console.error('[VoicePicker] Error picking voice:', err);
    return {
      language: SPEAK_LANGUAGE_TAG[langCode],
      voiceIdentifier: '',
      name: 'System Default',
      quality: 'unknown',
      isFallback: true,
      score: -999,
    };
  }
}

/**
 * Clears the cached voice selection for a language (or all if omitted).
 * Use when the user explicitly resets their voice choice.
 */
export async function resetVoiceCache(langCode?: 'en' | 'es'): Promise<void> {
  if (langCode) {
    await Promise.all([
      AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${langCode}`),
      AsyncStorage.removeItem(`${CACHE_HASH_KEY_PREFIX}${langCode}`),
    ]);
  } else {
    await Promise.all([
      AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}en`),
      AsyncStorage.removeItem(`${CACHE_HASH_KEY_PREFIX}en`),
      AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}es`),
      AsyncStorage.removeItem(`${CACHE_HASH_KEY_PREFIX}es`),
    ]);
  }
  if (__DEV__) {
    console.log(`[VoicePicker] Cache cleared for: ${langCode ?? 'all'}`);
  }
}

/**
 * Returns Speech.SpeechOptions with language + voice pre-filled
 * from the best available voice. Pass extra options to merge.
 */
export async function buildSpeechOptions(
  langCode: 'en' | 'es',
  extra: Omit<Speech.SpeechOptions, 'language' | 'voice'> & {
    onFallback?: (picked: PickedVoice) => void;
  } = {}
): Promise<{ options: Speech.SpeechOptions; picked: PickedVoice }> {
  const picked = await pickBestVoice(langCode);

  const { onFallback, ...rest } = extra;

  if (picked.isFallback && onFallback) {
    onFallback(picked);
  }

  const options: Speech.SpeechOptions = {
    ...rest,
    language: picked.language,
  };

  if (picked.voiceIdentifier) {
    options.voice = picked.voiceIdentifier;
  }

  return { options, picked };
}
