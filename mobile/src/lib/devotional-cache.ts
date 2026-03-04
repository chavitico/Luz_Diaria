/**
 * Devotional offline cache.
 *
 * Strategy:
 *  - Store each devotional keyed by date: "dev:YYYY-MM-DD"
 *  - On launch (online): prefetch today + next 6 days, store each
 *  - Offline access: return cached row for todayCR, or most-recent cached
 *  - Cache entries never expire (devotionals are canonical + immutable by date)
 *
 * Timezone note:
 *  The canonical date is always YYYY-MM-DD in America/Costa_Rica (UTC-6, no DST).
 *  We use Intl.DateTimeFormat as the primary method — it handles host DST correctly.
 *  The manual UTC-6 fallback is safe for CR because CR itself never observes DST.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Devotional } from './types';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === 'dev' || !process.env.EXPO_PUBLIC_APP_ENV;

export const KEY_PREFIX = 'dev:';
export const LAST_FETCHED_KEY = 'dev:__last_prefetch__';

// Re-prefetch at most once per 12 hours (avoids hammering on every app open)
const PREFETCH_INTERVAL_MS = 12 * 60 * 60 * 1000;

// ─── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns today's date in America/Costa_Rica timezone as YYYY-MM-DD.
 * Uses Intl.DateTimeFormat (handles host DST correctly).
 * Falls back to static UTC-6 offset — safe because CR has no DST.
 */
export function getCRToday(): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value ?? '';
    const m = parts.find(p => p.type === 'month')?.value ?? '';
    const d = parts.find(p => p.type === 'day')?.value ?? '';
    const result = `${y}-${m}-${d}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(result)) return result;
  } catch {}
  // Static UTC-6 fallback — Costa Rica never observes DST so this is always correct
  const crMs = Date.now() - 6 * 60 * 60 * 1000;
  const cr = new Date(crMs);
  return `${cr.getUTCFullYear()}-${String(cr.getUTCMonth() + 1).padStart(2, '0')}-${String(cr.getUTCDate()).padStart(2, '0')}`;
}

/** Offset a YYYY-MM-DD string by +N days, fully in UTC (no DST risk) */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

// ─── AsyncStorage helpers ──────────────────────────────────────────────────────

/** Persist a devotional to AsyncStorage */
export async function cacheDevotional(d: Devotional): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + d.date, JSON.stringify(d));
    if (IS_DEV) console.log(`[DevCache] Cached devotional for ${d.date}: "${d.title}"`);
  } catch (e) {
    if (IS_DEV) console.warn('[DevCache] Failed to cache devotional:', e);
  }
}

/** Read a devotional from cache by date */
export async function getCachedDevotional(date: string): Promise<Devotional | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + date);
    if (!raw) return null;
    return JSON.parse(raw) as Devotional;
  } catch {
    return null;
  }
}

/** Returns all cached dates (sorted ascending) */
export async function getCachedDates(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(k => k.startsWith(KEY_PREFIX) && k !== LAST_FETCHED_KEY)
      .map(k => k.slice(KEY_PREFIX.length))
      .sort();
  } catch {
    return [];
  }
}

/** Returns the last prefetch timestamp (ms) or null */
export async function getLastPrefetchTime(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_FETCHED_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

// ─── Network helpers ───────────────────────────────────────────────────────────

/** Fetch one devotional from server and cache it. Returns null on network error. */
async function fetchAndCache(date: string): Promise<Devotional | null> {
  try {
    // Always request by date so the key is deterministic and consistent
    // Use /today for todayCR (avoids the ?date= path and its 7-day window check)
    const today = getCRToday();
    const url = date === today
      ? `${BACKEND_URL}/api/devotional/today`
      : `${BACKEND_URL}/api/devotional?date=${date}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      if (IS_DEV) console.warn(`[DevCache] fetchAndCache(${date}): HTTP ${res.status}`);
      return null;
    }
    const d = await res.json() as Devotional;
    // Invariant: server must return a devotional with a date field
    if (!d || !d.date) {
      if (IS_DEV) console.warn(`[DevCache] fetchAndCache(${date}): response missing date field`);
      return null;
    }
    await cacheDevotional(d);
    return d;
  } catch (e) {
    if (IS_DEV) console.warn(`[DevCache] fetchAndCache(${date}) failed:`, e);
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Prefetch today + next 6 days from the server and persist to cache.
 * Throttled: runs at most once per PREFETCH_INTERVAL_MS (12h).
 * Partial failures are tolerated — successful dates are stored.
 * Call on app launch when online.
 */
export async function prefetchDevotionals(force = false): Promise<{
  fetched: number;
  total: number;
  dates: string[];
}> {
  const today = getCRToday();

  if (!force) {
    // Throttle check
    try {
      const last = await AsyncStorage.getItem(LAST_FETCHED_KEY);
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10);
        if (elapsed < PREFETCH_INTERVAL_MS) {
          if (IS_DEV) {
            console.log(`[DevCache] Prefetch skipped — last: ${Math.round(elapsed / 60000)}m ago`);
            console.log(`[DevCache] todayCR = ${today}`);
          }
          return { fetched: 0, total: 0, dates: [] };
        }
      }
    } catch {}
  }

  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  if (IS_DEV) console.log(`[DevCache] Prefetching ${dates.length} devotionals: ${dates.join(', ')}`);

  // Fetch all in parallel — partial failures are fine
  const results = await Promise.allSettled(dates.map(fetchAndCache));

  const fetched = results.filter(
    r => r.status === 'fulfilled' && r.value !== null
  ).length;

  if (IS_DEV) {
    results.forEach((r, i) => {
      const date = dates[i];
      if (r.status === 'fulfilled' && r.value) {
        console.log(`[DevCache] ✓ ${date}: "${r.value.title}"`);
      } else {
        console.warn(`[DevCache] ✗ ${date}: failed or null`);
      }
    });
    console.log(`[DevCache] Prefetch complete: ${fetched}/${dates.length}`);
  }

  try {
    await AsyncStorage.setItem(LAST_FETCHED_KEY, String(Date.now()));
  } catch {}

  return { fetched, total: dates.length, dates };
}

/**
 * Get today's devotional with offline fallback.
 *  1. Try network (and cache result).
 *  2. On failure: try cache for todayCR.
 *  3. Last resort: find the most recently cached date.
 * Returns null only if completely offline and no cache at all.
 */
export async function getDevotionalWithFallback(date?: string): Promise<{
  devotional: Devotional | null;
  fromCache: boolean;
  offline: boolean;
  cachedDate?: string; // set when returning a different date than requested
}> {
  const target = date ?? getCRToday();

  // 1. Try network
  const fresh = await fetchAndCache(target);
  if (fresh) {
    if (IS_DEV) console.log(`[DevCache] ${target} — served from NETWORK: "${fresh.title}"`);
    return { devotional: fresh, fromCache: false, offline: false };
  }

  if (IS_DEV) console.log(`[DevCache] ${target} — network failed, checking cache…`);

  // 2. Network failed — try exact cache hit
  const cached = await getCachedDevotional(target);
  if (cached) {
    if (IS_DEV) console.log(`[DevCache] ${target} — served from CACHE (exact): "${cached.title}"`);
    return { devotional: cached, fromCache: true, offline: true };
  }

  // 3. Find most recently cached devotional as graceful degradation
  const dates = await getCachedDates();
  // Prefer the most recent date that is <= today (don't show future devotionals as "today")
  const past = dates.filter(d => d <= target).reverse();
  const future = dates.filter(d => d > target);
  const candidates = [...past, ...future]; // past-first fallback

  for (const key of candidates) {
    const d = await getCachedDevotional(key);
    if (d) {
      if (IS_DEV) console.log(`[DevCache] ${target} — served FALLBACK from ${key}: "${d.title}"`);
      return { devotional: d, fromCache: true, offline: true, cachedDate: key };
    }
  }

  if (IS_DEV) console.warn(`[DevCache] ${target} — completely offline, no cache`);
  return { devotional: null, fromCache: false, offline: true };
}
