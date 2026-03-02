// Branding Service — runtime-configurable app branding
// Fetches from backend, falls back to local constants if unavailable.
// All share components and UI must read from this service.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const CACHE_KEY = 'app_branding_cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type WatermarkPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface AppBranding {
  appName: string;
  taglineEs: string;
  taglineEn: string;
  shareWatermarkEnabled: boolean;
  shareWatermarkPosition: WatermarkPosition;
}

export const DEFAULT_BRANDING: AppBranding = {
  appName: 'Luz Diaria',
  taglineEs: 'Un devocional para cada día',
  taglineEn: 'A devotional for every day',
  shareWatermarkEnabled: true,
  shareWatermarkPosition: 'bottom-left',
};

interface BrandingState {
  branding: AppBranding;
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchBranding: () => Promise<void>;
  updateBranding: (updates: Partial<AppBranding>, userId?: string) => Promise<boolean>;
  getTagline: (language: 'en' | 'es') => string;
}

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: DEFAULT_BRANDING,
  isLoading: false,
  lastFetchedAt: null,

  fetchBranding: async () => {
    const { lastFetchedAt, isLoading } = get();
    const now = Date.now();

    // Throttle: don't refetch if within TTL
    if (isLoading || (lastFetchedAt && now - lastFetchedAt < CACHE_TTL_MS)) {
      return;
    }

    set({ isLoading: true });

    try {
      // Try to load from AsyncStorage cache first (instant)
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < CACHE_TTL_MS) {
          set({ branding: { ...DEFAULT_BRANDING, ...data }, lastFetchedAt: timestamp, isLoading: false });
          // Still refresh in background if close to expiry (5 min)
          if (now - timestamp > 5 * 60 * 1000) {
            _fetchFromServer(set);
          }
          return;
        }
      }
    } catch {
      // AsyncStorage miss — proceed to fetch
    }

    await _fetchFromServer(set);
  },

  updateBranding: async (updates: Partial<AppBranding>, userId?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) headers['X-User-Id'] = userId;

      const res = await fetch(`${BACKEND_URL}/api/branding`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!res.ok) return false;

      const json = await res.json() as { success: boolean; branding: AppBranding };
      if (json.success) {
        const merged = { ...DEFAULT_BRANDING, ...json.branding };
        set({ branding: merged, lastFetchedAt: Date.now() });
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: merged, timestamp: Date.now() }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Branding] updateBranding error:', err);
      return false;
    }
  },

  getTagline: (language: 'en' | 'es') => {
    const { branding } = get();
    return language === 'es' ? branding.taglineEs : branding.taglineEn;
  },
}));

async function _fetchFromServer(set: (s: Partial<BrandingState>) => void) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let res: Response;
    try {
      res = await fetch(`${BACKEND_URL}/api/branding`, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { success: boolean; branding: AppBranding };
    if (json.success && json.branding) {
      const merged = { ...DEFAULT_BRANDING, ...json.branding };
      set({ branding: merged, lastFetchedAt: Date.now(), isLoading: false });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: merged, timestamp: Date.now() }));
      return;
    }
  } catch (err) {
    console.warn('[Branding] Failed to fetch from server, using defaults:', err);
  }
  set({ isLoading: false });
}

// Convenience hook for reading branding in components
export function useBranding() {
  return useBrandingStore(s => s.branding);
}

export function useBrandingTagline(language: 'en' | 'es') {
  return useBrandingStore(s => language === 'es' ? s.branding.taglineEs : s.branding.taglineEn);
}
