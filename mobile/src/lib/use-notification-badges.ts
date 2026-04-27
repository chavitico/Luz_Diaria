import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './store';
import { gamificationApi } from './gamification-api';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const SEEN_COMMENT_LIKES_KEY = 'notif_seen_comment_likes_count';

export function useNotificationBadges(userId: string | undefined) {
  const setNotificationBadges = useAppStore((s) => s.setNotificationBadges);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!userId) return;
    try {
      const counts = await gamificationApi.getBadgeCounts(userId);
      // Read stored "seen" count for comment likes
      const storedStr = await AsyncStorage.getItem(SEEN_COMMENT_LIKES_KEY);
      const seenCount = storedStr ? parseInt(storedStr, 10) : 0;
      // Only surface new comment likes above the last-seen baseline
      const newLikes = Math.max(0, counts.recentCommentLikesCount - seenCount);
      setNotificationBadges({ ...counts, recentCommentLikesCount: newLikes });
    } catch {
      // Silently ignore network errors — badges are non-critical
    }
  }, [userId, setNotificationBadges]);

  // Poll on mount and every 2 minutes
  useEffect(() => {
    fetchBadges();
    timerRef.current = setInterval(fetchBadges, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchBadges]);

  // Re-fetch on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchBadges();
    });
    return () => sub.remove();
  }, [fetchBadges]);
}

// Call this when the user opens the Hoy tab so comment-like badge clears
export async function markCommentLikesSeen(currentCount: number) {
  await AsyncStorage.setItem(SEEN_COMMENT_LIKES_KEY, String(currentCount));
}
