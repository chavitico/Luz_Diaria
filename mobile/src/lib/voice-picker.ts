/**
 * voice-picker.ts — Single source of truth for TTS voice selection.
 *
 * Voice Policy (Spanish):
 *   1. PREFERRED (iOS): Paulina (es-MX) > Monica (es-ES) > other non-Eloquence Apple voices
 *   2. PREFERRED (Android): female voices with correct locale, higher quality
 *   3. FALLBACK: any non-Eloquence Spanish voice available on device
 *   4. LAST RESORT: Eloquence voices (robotic, avoid if at all possible)
 *
 * Voice Lock:
 *   - Once a voice is chosen, it is cached in AsyncStorage per (langCode + device voice hash).
 *   - Same device will always use the same voice across sessions.
 *   - Cache invalidated only when: (a) voice list changes, or (b) user resets cache.
 *
 * Diagnostics (__DEV__ only):
 *   - Logs requested language, available voice count, top 5 candidates with scores+reasons,
 *     and the selected voiceIdentifier with reason.
 */

import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PickedVoice {
  language: string;          // BCP-47 tag to pass to Speech.speak()
  voiceIdentifier: string;
  name: string;
  quality: string;
  isFallback: boolean;       // true if no good voice found
  isEloquence: boolean;      // true if this is an Eloquence voice (last resort)
  preferredVoiceFound: boolean; // true if Paulina / Monica was available
  score: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = 'tts_voice_v3_';
const CACHE_HASH_KEY_PREFIX = 'tts_voice_hash_v3_';

/**
 * BCP-47 language tags to use when calling Speech.speak()
 */
const SPEAK_LANGUAGE_TAG: Record<string, string> = {
  es: 'es-MX',
  en: 'en-US',
};

// ─── Preferred Voice Policy ───────────────────────────────────────────────────

/**
 * iOS preferred voice identifiers for Spanish, in priority order.
 * Partial strings matched via .includes().
 */
const IOS_PREFERRED_ES: string[] = [
  // Paulina — es-MX, best option
  'com.apple.voice.premium.es-MX.Paulina',
  'com.apple.voice.enhanced.es-MX.Paulina',
  'com.apple.voice.compact.es-MX.Paulina',
  'com.apple.ttsbundle.Paulina-compact',
  // Monica — es-ES, second choice
  'com.apple.voice.premium.es-ES.Monica',
  'com.apple.voice.enhanced.es-ES.Monica',
  'com.apple.voice.compact.es-ES.Monica',
  'com.apple.ttsbundle.Monica-compact',
];

/** Name fragments (case-insensitive) that identify a "top tier" preferred voice */
const PREFERRED_VOICE_NAMES = ['paulina', 'monica', 'mónica'];

/**
 * Substring patterns that identify Eloquence voices (iOS synthetic, robotic).
 * These should be used only as absolute last resort.
 */
const ELOQUENCE_PATTERNS = [
  'com.apple.eloquence',
  'eloquence',
];

function isEloquenceVoice(voice: Speech.Voice): boolean {
  const id = (voice.identifier ?? '').toLowerCase();
  const name = (voice.name ?? '').toLowerCase();
  return ELOQUENCE_PATTERNS.some((p) => id.includes(p) || name.includes(p));
}

function isPreferredVoice(voice: Speech.Voice): boolean {
  const id = (voice.identifier ?? '').toLowerCase();
  const name = (voice.name ?? '').toLowerCase();
  return PREFERRED_VOICE_NAMES.some((n) => id.includes(n) || name.includes(n));
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Female name indicators (Spanish and common voices across platforms).
 * Names are lower-cased before matching.
 */
const FEMALE_NAME_INDICATORS = [
  'paulina', 'mónica', 'monica', 'luciana', 'valeria', 'sofía', 'sofia',
  'isabella', 'carmen', 'rosa', 'laura', 'ana', 'maria', 'paula', 'elena',
  'pilar', 'conchita', 'ioana', 'lupe', 'angelica', 'catalina', 'estrella',
  // English
  'samantha', 'karen', 'victoria', 'fiona', 'tessa', 'moira', 'veena',
  'allison', 'ava', 'susan', 'zoe', 'kate',
];

/**
 * Locale preference bonus for Spanish voices.
 * Higher value = more preferred.
 */
const ES_LOCALE_SCORE: Record<string, number> = {
  'es-MX':  12,   // Best: Mexican Spanish (target audience)
  'es-US':   9,   // Good: US Spanish
  'es-419':  8,   // Good: Latin American generic
  'es-ES':   4,   // Acceptable: Castilian
};

type ScoredCandidate = {
  voice: Speech.Voice;
  score: number;
  reasons: string[];
};

function scoreVoice(voice: Speech.Voice, langCode: 'en' | 'es'): ScoredCandidate {
  let score = 0;
  const reasons: string[] = [];
  const nameLower = (voice.name ?? '').toLowerCase();
  const idLower = (voice.identifier ?? '').toLowerCase();
  const qualityLower = ((voice as any).quality ?? '').toLowerCase();

  // ── Eloquence penalty: heavy negative so it's always last resort ──
  if (isEloquenceVoice(voice)) {
    score -= 200;
    reasons.push('eloquence:-200');
  }

  // ── Preferred voice (Paulina / Monica): strong boost ──
  if (langCode === 'es' && isPreferredVoice(voice)) {
    score += 150;
    reasons.push('preferred_voice:+150');
  }

  // ── iOS identifier match for top preferred voices ──
  if (langCode === 'es') {
    const prefIdx = IOS_PREFERRED_ES.findIndex((pattern) => idLower.includes(pattern.toLowerCase()));
    if (prefIdx >= 0) {
      // Earlier in list = higher priority; max bonus 50, decreasing by rank
      const bonus = Math.max(50 - prefIdx * 5, 5);
      score += bonus;
      reasons.push(`ios_preferred_${prefIdx}:+${bonus}`);
    }
  }

  // ── Quality tier bonus ──
  if (qualityLower === 'premium') {
    score += 30;
    reasons.push('premium:+30');
  } else if (qualityLower === 'enhanced') {
    score += 20;
    reasons.push('enhanced:+20');
  }

  // ── Female name bonus ──
  if (FEMALE_NAME_INDICATORS.some((f) => nameLower.includes(f))) {
    score += 15;
    reasons.push('female:+15');
  }

  // ── Compact penalty (lower quality tier) ──
  if (nameLower.includes('compact') || idLower.includes('compact')) {
    score -= 8;
    reasons.push('compact:-8');
  }

  // ── Robot / default penalty ──
  if (nameLower.includes('robot') || nameLower.includes('default')) {
    score -= 20;
    reasons.push('robot_default:-20');
  }

  // ── Locale preference ──
  if (langCode === 'es') {
    const localeScore = ES_LOCALE_SCORE[voice.language] ?? 0;
    if (localeScore > 0) {
      score += localeScore;
      reasons.push(`locale_${voice.language}:+${localeScore}`);
    }
  } else if (langCode === 'en') {
    if (voice.language === 'en-US') {
      score += 5;
      reasons.push('locale_en-US:+5');
    }
  }

  return { voice, score, reasons };
}

// ─── Hash helper (simple, deterministic) ────────────────────────────────────

function hashVoiceList(voices: Speech.Voice[]): string {
  const ids = voices
    .map((v) => v.identifier)
    .sort()
    .join(',');
  let hash = 5381;
  for (let i = 0; i < ids.length; i++) {
    hash = ((hash << 5) + hash) ^ ids.charCodeAt(i);
    hash = hash >>> 0;
  }
  return `${voices.length}_${hash}`;
}

// ─── Core function ───────────────────────────────────────────────────────────

/**
 * Picks the best available voice for the given language code.
 *
 * Voice selection priority (Spanish):
 *  1. Paulina (es-MX) if installed
 *  2. Monica (es-ES) if installed
 *  3. Best non-Eloquence Spanish voice (scored)
 *  4. Eloquence voices (absolute last resort)
 *
 * Voice Lock: result is cached per (langCode + voice list hash).
 * Same device will always get the same voice across sessions.
 */
export async function pickBestVoice(langCode: 'en' | 'es'): Promise<PickedVoice> {
  try {
    // 1. Get available voices
    const allVoices = await Speech.getAvailableVoicesAsync();

    if (__DEV__) {
      console.log(`[VoicePicker] Total device voices: ${allVoices.length}, requested lang: ${langCode}`);
    }

    // 2. Compute hash for Voice Lock
    const currentHash = hashVoiceList(allVoices);
    const hashKey = `${CACHE_HASH_KEY_PREFIX}${langCode}`;
    const cacheKey = `${CACHE_KEY_PREFIX}${langCode}`;

    // 3. Check Voice Lock cache
    const [cachedHash, cachedVoiceJson] = await Promise.all([
      AsyncStorage.getItem(hashKey),
      AsyncStorage.getItem(cacheKey),
    ]);

    if (cachedHash === currentHash && cachedVoiceJson) {
      const cached = JSON.parse(cachedVoiceJson) as PickedVoice;
      const stillExists = !cached.voiceIdentifier || allVoices.some((v) => v.identifier === cached.voiceIdentifier);
      if (stillExists) {
        if (__DEV__) {
          console.log(
            `[VoicePicker] VOICE LOCK — using cached: ${cached.name} | ${cached.voiceIdentifier}` +
            ` | quality: ${cached.quality} | score: ${cached.score}` +
            ` | eloquence: ${cached.isEloquence} | preferred: ${cached.preferredVoiceFound}`
          );
        }
        return cached;
      }
    }

    // 4. Filter by language prefix
    const langPrefix = langCode === 'es' ? 'es' : 'en';
    const candidates = allVoices.filter((v) => v.language?.startsWith(langPrefix));

    if (__DEV__) {
      console.log(`[VoicePicker] Spanish-matching voices found: ${candidates.length}`);
    }

    if (candidates.length === 0) {
      // No voices at all for this language — full fallback
      const fallback: PickedVoice = {
        language: SPEAK_LANGUAGE_TAG[langCode],
        voiceIdentifier: '',
        name: 'System Default',
        quality: 'unknown',
        isFallback: true,
        isEloquence: false,
        preferredVoiceFound: false,
        score: -999,
      };
      if (__DEV__) {
        console.warn(`[VoicePicker] No voices found for "${langCode}". Using system default.`);
      }
      return fallback;
    }

    // 5. Score all candidates
    const scored: ScoredCandidate[] = candidates.map((v) => scoreVoice(v, langCode));
    scored.sort((a, b) => b.score - a.score);

    if (__DEV__) {
      console.log(`[VoicePicker] Top 5 candidates for "${langCode}":`);
      scored.slice(0, 5).forEach((s, i) => {
        const qual = (s.voice as any).quality ?? '?';
        const eloquenceTag = isEloquenceVoice(s.voice) ? ' [ELOQUENCE]' : '';
        console.log(
          `  #${i + 1}: ${s.voice.name}${eloquenceTag}` +
          ` | id: ${s.voice.identifier}` +
          ` | lang: ${s.voice.language}` +
          ` | quality: ${qual}` +
          ` | score: ${s.score}` +
          ` | reasons: [${s.reasons.join(', ')}]`
        );
      });
    }

    // 6. Check if a preferred voice (Paulina / Monica) was found
    const preferredVoiceFound = scored.some((s) => isPreferredVoice(s.voice));

    const best = scored[0];
    const quality = (best.voice as any).quality ?? 'unknown';
    const eloquence = isEloquenceVoice(best.voice);
    // Mark as fallback if: only eloquence voices exist, or score is very negative
    const isFallback = eloquence || best.score < 0;

    const result: PickedVoice = {
      language: best.voice.language ?? SPEAK_LANGUAGE_TAG[langCode],
      voiceIdentifier: best.voice.identifier,
      name: best.voice.name ?? best.voice.identifier,
      quality,
      isFallback,
      isEloquence: eloquence,
      preferredVoiceFound,
      score: best.score,
    };

    if (__DEV__) {
      const reason = eloquence
        ? 'LAST RESORT — only Eloquence available'
        : preferredVoiceFound
          ? 'preferred voice (Paulina/Monica) selected'
          : 'best non-Eloquence voice selected';
      console.log(
        `[VoicePicker] SELECTED: "${result.name}" | ${result.voiceIdentifier}` +
        ` | lang: ${result.language} | quality: ${quality} | score: ${result.score}` +
        ` | reason: ${reason}`
      );
    }

    // 7. Save to Voice Lock cache
    await Promise.all([
      AsyncStorage.setItem(hashKey, currentHash),
      AsyncStorage.setItem(cacheKey, JSON.stringify(result)),
    ]);

    return result;
  } catch (err) {
    console.error('[VoicePicker] Error picking voice:', err);
    return {
      language: SPEAK_LANGUAGE_TAG[langCode],
      voiceIdentifier: '',
      name: 'System Default',
      quality: 'unknown',
      isFallback: true,
      isEloquence: false,
      preferredVoiceFound: false,
      score: -999,
    };
  }
}

/**
 * Clears the Voice Lock cache for a language (or all if omitted).
 * Call this when the user explicitly resets their voice choice or changes language.
 */
export async function resetVoiceCache(langCode?: 'en' | 'es'): Promise<void> {
  const langs: Array<'en' | 'es'> = langCode ? [langCode] : ['en', 'es'];
  await Promise.all(
    langs.flatMap((l) => [
      AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${l}`),
      AsyncStorage.removeItem(`${CACHE_HASH_KEY_PREFIX}${l}`),
      // Also clear old v2 keys to avoid stale data
      AsyncStorage.removeItem(`tts_voice_v2_${l}`),
      AsyncStorage.removeItem(`tts_voice_hash_v2_${l}`),
    ])
  );
  if (__DEV__) {
    console.log(`[VoicePicker] Voice Lock cache cleared for: ${langCode ?? 'all'}`);
  }
}

/**
 * Returns Speech.SpeechOptions with language + voice pre-filled.
 * onFallback is called when the selected voice is a fallback (no good voice found).
 * onEloquence is called specifically when the voice is Eloquence (robotic).
 * onPreferredMissing is called when preferred voice (Paulina/Monica) is not installed.
 */
export async function buildSpeechOptions(
  langCode: 'en' | 'es',
  extra: Omit<Speech.SpeechOptions, 'language' | 'voice'> & {
    onFallback?: (picked: PickedVoice) => void;
    onEloquence?: (picked: PickedVoice) => void;
    onPreferredMissing?: (picked: PickedVoice) => void;
  } = {}
): Promise<{ options: Speech.SpeechOptions; picked: PickedVoice }> {
  const picked = await pickBestVoice(langCode);

  const { onFallback, onEloquence, onPreferredMissing, ...rest } = extra;

  if (picked.isFallback && onFallback) {
    onFallback(picked);
  }
  if (picked.isEloquence && onEloquence) {
    onEloquence(picked);
  }
  // Notify if preferred voice not found (and we didn't already fire isFallback)
  if (!picked.preferredVoiceFound && langCode === 'es' && onPreferredMissing) {
    onPreferredMissing(picked);
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
