/**
 * Devotional offline cache.
 *
 * Strategy:
 *  - Store each devotional keyed by date: "dev:YYYY-MM-DD"
 *  - On launch (online): prefetch today + next 6 days, store each
 *  - On offline access: return cached row for todayCR, or last cached
 *  - Cache entries never expire (devotionals are canonical + immutable by date)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Devotional } from './types';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const KEY_PREFIX = 'dev:';
const LAST_FETCHED_KEY = 'dev:__last_prefetch__';
// Re-prefetch at most once per 12 hours (avoids hammering on every app open)
const PREFETCH_INTERVAL_MS = 12 * 60 * 60 * 1000;

/** Costa Rica today as YYYY-MM-DD */
export function getCRToday(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(new Date());
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
  } catch {}
  // Fallback: manual UTC-6
  const now = new Date();
  const cr = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  return `${cr.getUTCFullYear()}-${String(cr.getUTCMonth() + 1).padStart(2, '0')}-${String(cr.getUTCDate()).padStart(2, '0')}`;
}

/** Offset a YYYY-MM-DD string by +N days */
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/** Persist a devotional to AsyncStorage */
export async function cacheDevotional(d: Devotional): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + d.date, JSON.stringify(d));
  } catch {}
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

/** Fetch one devotional from server and cache it. Returns null on network error. */
async function fetchAndCache(date: string): Promise<Devotional | null> {
  try {
    const url = date === getCRToday()
      ? `${BACKEND_URL}/api/devotional/today`
      : `${BACKEND_URL}/api/devotional?date=${date}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json() as Devotional;
    if (d && d.date) {
      await cacheDevotional(d);
      return d;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Prefetch today + next 6 days from the server and persist to cache.
 * Runs at most once every PREFETCH_INTERVAL_MS. Call on app launch when online.
 */
export async function prefetchDevotionals(): Promise<void> {
  // Throttle: skip if recently prefetched
  try {
    const last = await AsyncStorage.getItem(LAST_FETCHED_KEY);
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10);
      if (elapsed < PREFETCH_INTERVAL_MS) {
        console.log(`[DevCache] Prefetch skipped (last: ${Math.round(elapsed / 60000)}m ago)`);
        return;
      }
    }
  } catch {}

  const today = getCRToday();
  console.log(`[DevCache] Prefetching 7 devotionals from ${today}…`);

  const results = await Promise.allSettled(
    Array.from({ length: 7 }, (_, i) => fetchAndCache(addDays(today, i)))
  );

  const ok = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
  console.log(`[DevCache] Prefetched ${ok}/7 devotionals`);

  try {
    await AsyncStorage.setItem(LAST_FETCHED_KEY, String(Date.now()));
  } catch {}
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
}> {
  const target = date ?? getCRToday();

  // 1. Try network
  const fresh = await fetchAndCache(target);
  if (fresh) return { devotional: fresh, fromCache: false, offline: false };

  // 2. Network failed — try exact cache hit
  const cached = await getCachedDevotional(target);
  if (cached) return { devotional: cached, fromCache: true, offline: true };

  // 3. Find any cached devotional (most recent)
  try {
    const keys = await AsyncStorage.getAllKeys();
    const devKeys = keys
      .filter(k => k.startsWith(KEY_PREFIX) && k !== LAST_FETCHED_KEY)
      .sort()
      .reverse(); // most recent date first
    for (const key of devKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw) as Devotional;
        return { devotional: d, fromCache: true, offline: true };
      }
    }
  } catch {}

  return { devotional: null, fromCache: false, offline: true };
}
