/**
 * Duel SFX System
 * ───────────────
 * Preload → playSound("name") → no-lag, no-overlap, no-block.
 *
 * Usage:
 *   import { preloadDuelSounds, unloadDuelSounds, playSound, setSfxEnabled } from '@/lib/audio';
 */

import { Audio } from 'expo-av';

// ── Sound catalogue ────────────────────────────────────────────────────────────
export type SoundName =
  | 'tap'
  | 'tick'
  | 'tick_fast'
  | 'searching'
  | 'match_found'
  | 'correct'
  | 'wrong'
  | 'win'
  | 'lose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SOUND_FILES: Record<SoundName, any> = {
  tap:         require('../../../assets/audio/tap.wav'),
  tick:        require('../../../assets/audio/tick.wav'),
  tick_fast:   require('../../../assets/audio/tick.wav'),   // same file, tighter debounce
  searching:   require('../../../assets/audio/tick.wav'),   // subtle pulse during matchmaking
  match_found: require('../../../assets/audio/match_found.wav'),
  correct:     require('../../../assets/audio/correct.wav'),
  wrong:       require('../../../assets/audio/wrong.wav'),
  win:         require('../../../assets/audio/win.wav'),
  lose:        require('../../../assets/audio/lose.wav'),
};

// ── Volume map (0–1) ──────────────────────────────────────────────────────────
const VOLUMES: Record<SoundName, number> = {
  tap:         0.55,
  tick:        0.50,
  tick_fast:   0.65,
  searching:   0.25,   // subtle — not annoying
  match_found: 0.65,
  correct:     0.65,
  wrong:       0.60,
  win:         0.70,
  lose:        0.60,
};

// ── Debounce map (ms) — prevents spam ────────────────────────────────────────
const DEBOUNCE_MS: Record<SoundName, number> = {
  tap:         120,
  tick:        900,
  tick_fast:   350,    // allows ~2 ticks per second
  searching:   1800,   // ~2 s between pulses
  match_found: 2000,
  correct:     500,
  wrong:       500,
  win:         3000,
  lose:        3000,
};

// ── Internal state ─────────────────────────────────────────────────────────────
const loadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};
const lastPlayTime: Partial<Record<SoundName, number>> = {};
let sfxEnabled = true;
let isLoaded = false;
let isLoading = false;

// ── Public API ─────────────────────────────────────────────────────────────────

/** Call once when entering the duel lobby to warm up all SFX. */
export async function preloadDuelSounds(): Promise<void> {
  if (isLoaded || isLoading) return;
  isLoading = true;
  try {
    const entries = Object.entries(SOUND_FILES) as [SoundName, number][];
    await Promise.all(
      entries.map(async ([name, file]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(file, {
            volume: VOLUMES[name],
            shouldPlay: false,
          });
          loadedSounds[name] = sound;
        } catch {
          // graceful degradation — sound just won't play
        }
      }),
    );
    isLoaded = true;
  } catch {
    // silent
  } finally {
    isLoading = false;
  }
}

/** Call when leaving the duel flow to free memory. */
export async function unloadDuelSounds(): Promise<void> {
  isLoaded = false;
  isLoading = false;
  const sounds = Object.values(loadedSounds) as Audio.Sound[];
  await Promise.all(sounds.map((s) => s.unloadAsync().catch(() => {})));
  (Object.keys(loadedSounds) as SoundName[]).forEach((k) => {
    delete loadedSounds[k];
  });
}

/** Respect the global SFX toggle from user settings. */
export function setSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
}

/**
 * Play a named sound effect.
 * - Fire-and-forget (does not block UI)
 * - Debounced to prevent rapid overlapping calls
 * - Silently ignored if not yet preloaded or sfx is disabled
 */
export function playSound(name: SoundName): void {
  if (!sfxEnabled) return;

  const now = Date.now();
  const debounce = DEBOUNCE_MS[name];
  const last = lastPlayTime[name] ?? 0;
  if (now - last < debounce) return;
  lastPlayTime[name] = now;

  const sound = loadedSounds[name];
  if (!sound) return;

  // Rewind to start then play — non-blocking
  sound
    .setPositionAsync(0)
    .then(() => sound.playAsync())
    .catch(() => {}); // silently swallow playback errors
}
