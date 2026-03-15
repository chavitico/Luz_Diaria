import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gamificationApi } from '@/lib/gamification-api';
import { CHAPTER_COLLECTIONS } from '@/lib/constants';

// ─── Chapter Collection Progress Hook ────────────────────────────────────────
export const CHAPTER_PROGRESS_KEY = 'chapter_collection_progress_v1';

// Sync strategy:
//  1. On mount: load AsyncStorage (instant), then fetch backend.
//  2. Merge = union of both (never lose claims).
//  3. On claim: update memory + AsyncStorage immediately, then push to backend async.
export function useChapterCollectionProgress(userId?: string): {
  claimedChapterIds: Set<string>;
  claimChapter: (chapterId: string, collectionId: string) => Promise<void>;
  isLoaded: boolean;
} {
  const [claimedChapterIds, setClaimedChapterIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage + backend on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // 1. Local cache first
      let localIds: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(CHAPTER_PROGRESS_KEY);
        if (raw) localIds = JSON.parse(raw);
      } catch { /* ignore */ }

      if (!cancelled) {
        setClaimedChapterIds(new Set(localIds));
        setIsLoaded(true);
      }

      // 2. Backend merge (if logged in)
      if (!userId) return;
      try {
        const { progress } = await gamificationApi.getChapterProgress(userId);
        const backendIds: string[] = [];
        for (const row of progress) {
          backendIds.push(...row.claimedChapterIds);
        }
        if (backendIds.length === 0) return;

        // Merge: union of local + backend
        const merged = Array.from(new Set([...localIds, ...backendIds]));
        if (!cancelled && merged.length > localIds.length) {
          setClaimedChapterIds(new Set(merged));
          await AsyncStorage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify(merged));
          console.debug('[ChapterProgress] Merged from backend:', merged.length, 'chapters');
        }
      } catch (e) {
        console.debug('[ChapterProgress] Backend load failed (offline?):', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const claimChapter = useCallback(async (chapterId: string, collectionId: string) => {
    // 1. Optimistic update in memory
    let merged: string[] = [];
    setClaimedChapterIds(prev => {
      const next = new Set(prev);
      next.add(chapterId);
      merged = [...next];
      return next;
    });

    // 2. Persist locally
    try {
      const raw = await AsyncStorage.getItem(CHAPTER_PROGRESS_KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const updated = Array.from(new Set([...existing, chapterId]));
      await AsyncStorage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify(updated));
      merged = updated;
    } catch (e) {
      console.debug('[ChapterProgress] AsyncStorage save failed:', e);
    }

    // 3. Push to backend async (non-blocking)
    if (userId) {
      gamificationApi.saveChapterProgress({ userId, collectionId, claimedChapterIds: merged })
        .then(() => console.debug('[ChapterProgress] Backend sync ok for', collectionId))
        .catch(e => console.debug('[ChapterProgress] Backend sync failed:', e));
    }
  }, [userId]);

  return { claimedChapterIds, claimChapter, isLoaded };
}
