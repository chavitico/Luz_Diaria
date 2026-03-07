/**
 * card-image-cache.ts
 *
 * Hybrid local/remote image caching for biblical card artwork.
 *
 * Strategy:
 * - Images are downloaded to the device's document directory under
 *   "card_images/<filename>.png" and persisted across app launches.
 * - On every image request the cache is consulted first; if a local file
 *   exists its file:// URI is returned immediately (fast path).
 * - If no local file exists the remote URL is returned so the UI renders
 *   immediately, and the download is queued in the background.
 * - Downloads are deduplicated via an in-flight Map so concurrent callers
 *   never issue two downloads for the same image.
 * - All errors are swallowed — this is a best-effort optimisation.
 *
 * Collection download status:
 *   'not_downloaded' | 'downloading' | 'downloaded'
 *
 * Usage:
 *   const uri = await resolveCardImageUri(card);   // fast: returns best available
 *   await downloadCollection('inicial');            // background batch download
 *   const status = getCollectionStatus('pascua');   // for optional UI badge
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BIBLICAL_CARDS, type BiblicalCard, getEventSetCards } from './biblical-cards';

// ─── Storage ─────────────────────────────────────────────────────────────────
const CACHE_DIR = `${FileSystem.documentDirectory}card_images/`;
const STATUS_KEY = 'card_image_cache_status_v1';

export type CollectionStatus = 'not_downloaded' | 'downloading' | 'downloaded';

// In-memory state — reset each app launch but repopulated from disk quickly
const localPathCache: Map<string, string> = new Map(); // cardId → local file:// URI
const inFlight: Map<string, Promise<string | null>> = new Map(); // url → promise
let collectionStatusCache: Record<string, CollectionStatus> = {};
let cacheInitialised = false;
let initialisationPromise: Promise<void> | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a remote URL to a stable local filename */
function urlToFilename(url: string): string {
  // Use the last path segment, stripping query strings
  const base = url.split('?')[0];
  const segments = base.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  // Ensure it ends with an image extension
  return last.includes('.') ? last : `${last}.png`;
}

/** Full local path for a URL */
function localPath(url: string): string {
  return `${CACHE_DIR}${urlToFilename(url)}`;
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Ensure the cache directory exists and scan disk for already-downloaded files.
 * Call this once at app start (or lazily before first use).
 * It is idempotent and concurrent-safe.
 */
async function ensureInitialised(): Promise<void> {
  if (cacheInitialised) return;
  if (initialisationPromise) return initialisationPromise;

  initialisationPromise = (async () => {
    try {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Populate localPathCache from what's on disk
      const cards = Object.values(BIBLICAL_CARDS).filter((c) => !!c.imageUrl);
      await Promise.all(
        cards.map(async (card) => {
          if (!card.imageUrl) return;
          const path = localPath(card.imageUrl);
          const info = await FileSystem.getInfoAsync(path);
          if (info.exists) {
            localPathCache.set(card.id, info.uri);
          }
        })
      );

      // Restore collection statuses from AsyncStorage
      try {
        const raw = await AsyncStorage.getItem(STATUS_KEY);
        if (raw) collectionStatusCache = JSON.parse(raw);
      } catch {
        collectionStatusCache = {};
      }

      cacheInitialised = true;
      console.log(`[CardImageCache] Initialised — ${localPathCache.size} image(s) already on disk`);
    } catch (e) {
      console.warn('[CardImageCache] Init error (non-fatal):', e);
      cacheInitialised = true; // don't retry forever
    }
  })();

  return initialisationPromise;
}

// ─── Single-image resolution ──────────────────────────────────────────────────

/**
 * Download a single card image to disk (deduplicates concurrent calls).
 * Returns the local file:// URI on success, null on failure.
 */
async function downloadImage(card: BiblicalCard): Promise<string | null> {
  if (!card.imageUrl) return null;

  const url = card.imageUrl;

  // Already cached locally?
  const cached = localPathCache.get(card.id);
  if (cached) return cached;

  // Deduplicate concurrent downloads
  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      const dest = localPath(url);
      const result = await FileSystem.downloadAsync(url, dest);
      if (result.status === 200) {
        localPathCache.set(card.id, result.uri);
        console.log(`[CardImageCache] Downloaded ${card.id}`);
        return result.uri;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
}

/**
 * Resolve the best available URI for a card's artwork.
 *
 * Fast path (sync-ish): if already in memory cache, returns local URI.
 * Slow path: awaits disk check + possibly triggers background download.
 *
 * In practice callers should call this and render whatever comes back;
 * the result is either a local file:// URI (instant) or the remote URL
 * (which the Image component will fetch normally).
 *
 * The download is always kicked off in the background so next time it
 * will be the fast path.
 */
export async function resolveCardImageUri(card: BiblicalCard): Promise<string | null> {
  if (!card.imageUrl) return null;

  await ensureInitialised();

  // Check in-memory cache first (fastest)
  const inMemory = localPathCache.get(card.id);
  if (inMemory) return inMemory;

  // Return remote URL immediately but kick off background download
  // Fire-and-forget so it doesn't block the caller
  downloadImage(card).catch(() => {});

  return card.imageUrl; // fall back to remote while download happens
}

/**
 * Synchronous version — returns the local URI if already in memory, else null.
 * Use this for initial render; pair with the async version for background fetch.
 */
export function resolveCardImageUriSync(card: BiblicalCard): string | null {
  if (!card.imageUrl) return null;
  return localPathCache.get(card.id) ?? null;
}

// ─── Collection-level download ─────────────────────────────────────────────

type CollectionId = 'inicial' | 'pascua';

function getCollectionCards(collectionId: CollectionId): BiblicalCard[] {
  if (collectionId === 'inicial') {
    const { ALL_CARD_IDS } = require('./biblical-cards') as typeof import('./biblical-cards');
    return ALL_CARD_IDS
      .map((id) => BIBLICAL_CARDS[id])
      .filter((c): c is BiblicalCard => !!c && c.inStandardPool === true && !c.eventSet);
  }
  if (collectionId === 'pascua') {
    return getEventSetCards('pascua_2026');
  }
  return [];
}

async function persistStatus(collectionId: string, status: CollectionStatus) {
  collectionStatusCache[collectionId] = status;
  try {
    await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(collectionStatusCache));
  } catch {
    // non-fatal
  }
}

/**
 * Returns the current download status for a collection.
 * Synchronous — uses in-memory state (populated after ensureInitialised).
 */
export function getCollectionStatus(collectionId: CollectionId): CollectionStatus {
  return collectionStatusCache[collectionId] ?? 'not_downloaded';
}

/**
 * Start background download for all images in a collection.
 * Non-blocking — returns immediately.
 * Safe to call multiple times (deduplicates via inFlight map and status check).
 *
 * Order: visible cards first (by array order), then remaining.
 */
export function downloadCollection(collectionId: CollectionId): void {
  // Don't await — fire and forget
  _downloadCollectionAsync(collectionId).catch(() => {});
}

async function _downloadCollectionAsync(collectionId: CollectionId): Promise<void> {
  await ensureInitialised();

  const current = collectionStatusCache[collectionId] ?? 'not_downloaded';
  if (current === 'downloading' || current === 'downloaded') return;

  const cards = getCollectionCards(collectionId).filter((c) => !!c.imageUrl);
  if (cards.length === 0) return;

  // Check if already all downloaded
  const allCached = cards.every((c) => localPathCache.has(c.id));
  if (allCached) {
    await persistStatus(collectionId, 'downloaded');
    return;
  }

  await persistStatus(collectionId, 'downloading');
  console.log(`[CardImageCache] Starting download for collection '${collectionId}' (${cards.length} images)`);

  // Download all images in parallel — 20 small PNGs saturate quickly but complete faster
  // than sequential batches on both fast and slow connections.
  await Promise.allSettled(cards.map((c) => downloadImage(c)));
  const completed = cards.filter((c) => localPathCache.has(c.id)).length;
  console.log(`[CardImageCache] ${collectionId}: ${completed}/${cards.length} images`);

  // Verify
  const allDone = cards.every((c) => localPathCache.has(c.id));
  await persistStatus(collectionId, allDone ? 'downloaded' : 'not_downloaded');
  console.log(`[CardImageCache] Collection '${collectionId}' download complete — status: ${allDone ? 'downloaded' : 'partial'}`);
}

/**
 * Pre-warm the cache on app start.
 * Call this early (e.g. in _layout.tsx) so disk scan runs before the album opens.
 * Non-blocking.
 */
export function initCardImageCache(): void {
  ensureInitialised().catch(() => {});
}

/**
 * Returns a hook-friendly object mapping cardId → local URI (or null).
 * The map is populated lazily as images are resolved.
 * Designed to be used from components that want to listen for updates via state.
 */
export async function resolveCollectionUris(
  collectionId: CollectionId
): Promise<Map<string, string>> {
  await ensureInitialised();
  const cards = getCollectionCards(collectionId).filter((c) => !!c.imageUrl);
  const result = new Map<string, string>();
  for (const card of cards) {
    const local = localPathCache.get(card.id);
    if (local) result.set(card.id, local);
  }
  return result;
}
