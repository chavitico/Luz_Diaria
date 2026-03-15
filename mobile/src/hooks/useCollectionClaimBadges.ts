import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ITEM_COLLECTIONS, DEFAULT_AVATARS } from '@/lib/constants';

// ─── useCollectionClaimBadges hook ───────────────────────────────────────────
const SEEN_STORAGE_KEY = 'seen_claimable_collections_v1';

export function useCollectionClaimBadges(
  collections: typeof ITEM_COLLECTIONS,
  purchasedItems: string[],
  claimedCollectionIds: Set<string>
) {
  // seenMap: collectionId → timestamp when user last marked it as seen
  const [seenMap, setSeenMap] = useState<Record<string, number>>({});
  // claimableSince: collectionId → timestamp when we first detected it became claimable
  const [claimableSince, setClaimableSince] = useState<Record<string, number>>({});

  // Load persisted seen map on mount
  useEffect(() => {
    AsyncStorage.getItem(SEEN_STORAGE_KEY).then(raw => {
      if (raw) {
        try { setSeenMap(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
  }, []);

  // Derive claimable collection IDs
  const claimableIds = useMemo(() => {
    return Object.values(collections)
      .filter(col => {
        const owned = col.items.filter(itemId => {
          if (purchasedItems.includes(itemId)) return true;
          const av = DEFAULT_AVATARS.find(a => a.id === itemId);
          return av && !('price' in av);
        });
        return owned.length === col.items.length && !claimedCollectionIds.has(col.id);
      })
      .map(col => col.id);
  }, [collections, purchasedItems, claimedCollectionIds]);

  // When a new collection becomes claimable, record the timestamp if not already tracked
  useEffect(() => {
    const now = Date.now();
    setClaimableSince(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of claimableIds) {
        if (!next[id]) { next[id] = now; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [claimableIds]);

  // newClaimableIds: claimable AND (never seen OR seen before it became claimable)
  const newClaimableIds = useMemo(() => {
    const result = new Set<string>();
    for (const id of claimableIds) {
      const seen = seenMap[id] ?? 0;
      const since = claimableSince[id] ?? Date.now();
      if (seen < since) result.add(id);
    }
    return result;
  }, [claimableIds, seenMap, claimableSince]);

  const pendingClaimsCount = claimableIds.length;

  // Call this when the user enters the Collections tab
  const markClaimablesSeen = useCallback(async () => {
    const now = Date.now();
    const next: Record<string, number> = { ...seenMap };
    for (const id of claimableIds) {
      next[id] = now;
    }
    setSeenMap(next);
    await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
  }, [seenMap, claimableIds]);

  return { pendingClaimsCount, newClaimableIds, markClaimablesSeen };
}
