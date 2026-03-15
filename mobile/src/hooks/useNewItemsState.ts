import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreItem } from '@/lib/gamification-api';
import { DEFAULT_AVATARS } from '@/lib/constants';

// ─── NEW Items State Hook ─────────────────────────────────────────────────────
// Stores { [itemId]: true } in AsyncStorage. Computed in-memory, zero backend queries.
export const NEW_ITEMS_SEEN_KEY = 'store_new_items_seen_v1';

// 14-day window for releasedAt-based "new" detection
export const NEW_ITEM_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function useNewItemsState() {
  const [seenMap, setSeenMap] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NEW_ITEMS_SEEN_KEY)
      .then(raw => {
        if (raw) setSeenMap(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const markSeen = useCallback(async (itemId: string) => {
    setSeenMap(prev => {
      if (prev[itemId]) return prev; // already seen, no change
      const next = { ...prev, [itemId]: true };
      // Persist async, fire and forget
      AsyncStorage.setItem(NEW_ITEMS_SEEN_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    console.log('[NewItems] Marked seen:', itemId);
  }, []);

  return { seenMap, markSeen, isLoaded };
}

// Compute which avatar IDs are "NEW" (isNewEligible && not seen)
export function computeNewAvatarIds(seenMap: Record<string, boolean>): Set<string> {
  const result = new Set<string>();
  for (const av of DEFAULT_AVATARS as readonly (typeof DEFAULT_AVATARS[0])[]) {
    const isNewEligible = (av as { isNewEligible?: boolean }).isNewEligible;
    if (isNewEligible && !seenMap[av.id]) {
      result.add(av.id);
    }
  }
  return result;
}

export function computeNewStoreItemIds(storeItems: StoreItem[], seenMap: Record<string, boolean>): Set<string> {
  const result = new Set<string>();
  const now = Date.now();
  for (const item of storeItems) {
    if (seenMap[item.id]) continue;
    // Item is new if: explicit isNew flag OR released in last 14 days
    const isNewFlag = (item as any).isNew === true;
    const releasedAt = item.releasedAt ? new Date(item.releasedAt).getTime() : null;
    const isRecentRelease = releasedAt !== null && (now - releasedAt) < NEW_ITEM_WINDOW_MS;
    if (isNewFlag || isRecentRelease) {
      result.add(item.id);
    }
  }
  return result;
}
