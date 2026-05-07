// metrics.ts — Lightweight analytics: TTS usage + tab screen time
// All calls are fire-and-forget; errors are swallowed silently.

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// Module-level dedup set — prevents flooding TTS events per session.
// Reset on every app launch (memory only).
const _trackedTTS = new Set<string>();

function getCRDateId(): string {
  const now = new Date();
  // Costa Rica is UTC-6
  const cr = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  return cr.toISOString().split('T')[0];
}

function post(body: object): void {
  fetch(`${BACKEND_URL}/api/metrics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

// Call once when user activates TTS. Deduped per user+screen per app session.
export function trackTTSUsed(
  userId: string | undefined,
  screen: 'devotional' | 'bible' | 'studies'
): void {
  if (!userId) return;
  const key = `${userId}:${screen}`;
  if (_trackedTTS.has(key)) return;
  _trackedTTS.add(key);
  post({ userId, type: 'tts_used', screen, seconds: 0, dateId: getCRDateId() });
}

// Add to any tab/screen component. Records time spent on that screen.
// Fires when the user navigates away; ignores visits shorter than 5 seconds.
export function useTabTimeTracking(screen: string, userId: string | undefined): void {
  const entryRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      entryRef.current = Date.now();
      return () => {
        if (!userId || !entryRef.current) return;
        const secs = Math.floor((Date.now() - entryRef.current) / 1000);
        entryRef.current = null;
        if (secs < 5) return;
        post({ userId, type: 'tab_time', screen, seconds: secs, dateId: getCRDateId() });
      };
    }, [userId, screen])
  );
}
