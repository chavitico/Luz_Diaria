// Global app state store using Zustand

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserSettings, ThemeOption, Language, UserProgress, DailyActions } from './types';
import { THEMES, DEFAULT_AVATARS, PURCHASABLE_THEMES } from './constants';

interface AppState {
  // User state
  user: User | null;
  isOnboarded: boolean;

  // UI state
  currentTheme: ThemeOption;
  isDarkMode: boolean;

  // Progress tracking
  todayProgress: UserProgress | null;
  sessionStartTime: number | null;
  heartbeatSessionId: string | null; // Server-assigned session ID for heartbeat tracking

  // Gamification state
  inventoryItems: string[]; // List of owned item IDs (cached from backend)
  equippedTheme: string; // Currently equipped theme ID
  equippedFrame: string | null;
  equippedTitle: string | null;
  equippedMusic: string;

  // Actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setOnboarded: (value: boolean) => void;
  setTheme: (theme: ThemeOption) => void;
  setDarkMode: (value: boolean) => void;
  setTodayProgress: (progress: UserProgress | null) => void;
  startSession: () => void;
  endSession: () => number; // returns elapsed seconds
  setHeartbeatSessionId: (id: string | null) => void;
  addPoints: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addFavorite: (devotionalDate: string) => void;
  removeFavorite: (devotionalDate: string) => void;
  purchaseItem: (itemId: string, price: number) => boolean;
  reset: () => void;

  // Gamification actions
  setInventory: (items: string[]) => void;
  addToInventory: (itemId: string) => void;
  equipTheme: (themeId: string) => void;
  equipFrame: (frameId: string | null) => void;
  equipTitle: (titleId: string | null) => void;
  equipMusic: (musicId: string) => void;
  updateDailyActions: (actions: Partial<DailyActions>) => void;

  // Gift new-item tracking
  newGiftItemIds: string[];
  addNewGiftItem: (itemId: string) => void;
  clearNewGiftItem: (itemId: string) => void;

  // Resume tick — incremented each time the app returns to foreground.
  // Non-persisted. Screens subscribe to react to app-resume events.
  resumeTick: number;
  bumpResumeTick: () => void;

  // Root-level pack reveal request — set after Store sheet fully closes,
  // consumed by _layout.tsx PackRevealOverlay (rendered above all navigation).
  packRevealRequest: {
    drawnCard: { cardId: string; wasNew: boolean };
    packType: 'sobre_biblico' | 'pack_pascua';
  } | null;
  requestPackReveal: (req: { drawnCard: { cardId: string; wasNew: boolean }; packType: 'sobre_biblico' | 'pack_pascua' }) => void;
  clearPackRevealRequest: () => void;
}

const initialUserSettings: UserSettings = {
  theme: 'dawn',
  language: 'es',
  musicEnabled: false,
  musicVolume: 0.18,
  notificationsEnabled: true,
  streakReminders: true,
  ttsVoice: 'default',
  ttsSpeed: 1.0,
  ttsVolume: 1.0,
  textScale: 1.0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarded: false,
      currentTheme: 'dawn',
      isDarkMode: false,
      todayProgress: null,
      sessionStartTime: null,
      heartbeatSessionId: null,

      // Gamification initial state
      inventoryItems: [],
      equippedTheme: 'theme_amanecer',
      equippedFrame: null,
      equippedTitle: null,
      equippedMusic: 'music_free_1',

      // Gift new-item tracking
      newGiftItemIds: [],

      // Resume tick — transient, starts at 0 each launch
      resumeTick: 0,

      // Pack reveal request — transient, starts null each launch
      packRevealRequest: null,

      setUser: (user) => set({ user }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      updateSettings: (settings) => set((state) => ({
        user: state.user
          ? { ...state.user, settings: { ...state.user.settings, ...settings } }
          : null,
      })),

      setOnboarded: (value) => set({ isOnboarded: value }),

      setTheme: (theme) => set({ currentTheme: theme }),

      setDarkMode: (value) => set({ isDarkMode: value }),

      setTodayProgress: (progress) => set({ todayProgress: progress }),

      startSession: () => set({ sessionStartTime: Date.now() }),

      endSession: () => {
        const { sessionStartTime, user } = get();
        if (!sessionStartTime) return 0;

        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);

        if (user) {
          set({
            user: { ...user, totalTime: user.totalTime + elapsed },
            sessionStartTime: null,
          });
        }

        return elapsed;
      },

      setHeartbeatSessionId: (id) => set({ heartbeatSessionId: id }),

      addPoints: (amount) => set((state) => ({
        user: state.user
          ? { ...state.user, points: state.user.points + amount }
          : null,
      })),

      incrementStreak: () => set((state) => {
        if (!state.user) return state;
        const newStreak = state.user.streakCurrent + 1;
        return {
          user: {
            ...state.user,
            streakCurrent: newStreak,
            streakBest: Math.max(newStreak, state.user.streakBest),
          },
        };
      }),

      resetStreak: () => set((state) => ({
        user: state.user
          ? { ...state.user, streakCurrent: 0 }
          : null,
      })),

      addFavorite: (devotionalDate) => set((state) => {
        if (!state.user) return { user: null };
        // Only add valid YYYY-MM-DD dates, clean any invalid entries
        const validDate = /^\d{4}-\d{2}-\d{2}$/.test(devotionalDate) ? devotionalDate : null;
        if (!validDate) return { user: state.user };
        const cleanFavorites = (state.user.favorites ?? []).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
        if (cleanFavorites.includes(validDate)) return { user: { ...state.user, favorites: cleanFavorites } };
        return { user: { ...state.user, favorites: [...cleanFavorites, validDate] } };
      }),

      removeFavorite: (devotionalDate) => set((state) => {
        if (!state.user) return { user: null };
        // Clean any invalid entries while removing
        const cleanFavorites = (state.user.favorites ?? []).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== devotionalDate);
        return { user: { ...state.user, favorites: cleanFavorites } };
      }),

      purchaseItem: (itemId, price) => {
        const { user } = get();
        if (!user || user.points < price) return false;

        set({
          user: {
            ...user,
            points: user.points - price,
            purchasedItems: [...user.purchasedItems, itemId],
          },
        });
        return true;
      },

      // Gamification actions
      setInventory: (items) => set({ inventoryItems: items }),

      addToInventory: (itemId) => set((state) => ({
        inventoryItems: [...state.inventoryItems, itemId],
      })),

      equipTheme: (themeId) => set((state) => ({
        user: state.user ? { ...state.user, themeId } : null,
      })),

      equipFrame: (frameId) => set((state) => ({
        user: state.user ? { ...state.user, frameId } : null,
      })),

      equipTitle: (titleId) => set((state) => ({
        user: state.user ? { ...state.user, titleId } : null,
      })),

      equipMusic: (musicId) => set((state) => ({
        user: state.user ? { ...state.user, selectedMusicId: musicId } : null,
      })),

      updateDailyActions: (actions) => set((state) => ({
        user: state.user
          ? { ...state.user, dailyActions: { ...state.user.dailyActions, ...actions } }
          : null,
      })),

      addNewGiftItem: (itemId) => set((state) => ({
        newGiftItemIds: state.newGiftItemIds.includes(itemId)
          ? state.newGiftItemIds
          : [...state.newGiftItemIds, itemId],
      })),

      clearNewGiftItem: (itemId) => set((state) => ({
        newGiftItemIds: state.newGiftItemIds.filter(id => id !== itemId),
      })),

      bumpResumeTick: () => set((state) => ({ resumeTick: state.resumeTick + 1 })),

      requestPackReveal: (req) => set({ packRevealRequest: req }),
      clearPackRevealRequest: () => set({ packRevealRequest: null }),

      reset: () => set({
        user: null,
        isOnboarded: false,
        currentTheme: 'dawn',
        isDarkMode: false,
        todayProgress: null,
        sessionStartTime: null,
        heartbeatSessionId: null,
        inventoryItems: [],
      }),
    }),
    {
      name: 'daily-light-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        currentTheme: state.currentTheme,
        isDarkMode: state.isDarkMode,
        inventoryItems: state.inventoryItems,
        newGiftItemIds: state.newGiftItemIds,
        heartbeatSessionId: state.heartbeatSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.user) return;
        // Clean up any invalid (NaN-NaN-NaN) favorites after store rehydration
        if (state.user.favorites) {
          const clean = state.user.favorites.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
          if (clean.length !== state.user.favorites.length) {
            state.user.favorites = clean;
          }
        }
        // Clean up invalid lastActiveDate (NaN-NaN-NaN) so streak logic works correctly
        if (state.user.lastActiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(state.user.lastActiveDate)) {
          state.user.lastActiveDate = '';
        }
      },
    }
  )
);

// Selector hooks for optimal performance
export const useUser = () => useAppStore((s) => s.user);
export const useIsOnboarded = () => useAppStore((s) => s.isOnboarded);
export const useCurrentTheme = () => useAppStore((s) => s.currentTheme);
export const useIsDarkMode = () => useAppStore((s) => s.isDarkMode);
export const useUserPoints = () => useAppStore((s) => s.user?.points ?? 0);
export const useUserStreak = () => useAppStore((s) => s.user?.streakCurrent ?? 0);
export const useUserFavorites = () => useAppStore((s) => s.user?.favorites ?? [] as string[]);
export const useUserSettings = () => useAppStore((s) => s.user?.settings ?? initialUserSettings);
export const useLanguage = () => useAppStore((s) => s.user?.settings?.language ?? 'es');
export const useTextScale = () => useAppStore((s) => s.user?.settings?.textScale ?? 1.0);

// Gamification selector hooks
export const useEquippedTheme = () => useAppStore((s) => s.user?.themeId ?? 'theme_amanecer');
export const useEquippedFrame = () => useAppStore((s) => s.user?.frameId ?? null);
export const useEquippedTitle = () => useAppStore((s) => s.user?.titleId ?? null);
export const useEquippedMusic = () => useAppStore((s) => s.user?.selectedMusicId ?? 'music_free_1');
export const useUserDailyActions = () => useAppStore((s) => s.user?.dailyActions ?? {});
export const useInventory = () => useAppStore((s) => s.inventoryItems);

// Pack reveal request — consumed by root-level PackRevealOverlay in _layout.tsx
export const usePackRevealRequest = () => useAppStore((s) => s.packRevealRequest);
export const useRequestPackReveal = () => useAppStore((s) => s.requestPackReveal);
export const useClearPackRevealRequest = () => useAppStore((s) => s.clearPackRevealRequest);

// Helper: returns '#FFFFFF' or '#1A1A1A' depending on which gives better contrast on the given hex bg
export function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.45 ? '#1A1A1A' : '#FFFFFF';
}

// Helper to get theme colors
export const useThemeColors = () => {
  const user = useUser();
  const isDark = useIsDarkMode();

  // Use equipped theme from user, fallback to 'theme_amanecer'
  const themeId = user?.themeId || 'theme_amanecer';
  const theme = PURCHASABLE_THEMES[themeId] || PURCHASABLE_THEMES['theme_amanecer'];

  return {
    primary: theme.colors.primary,
    primaryText: getContrastText(theme.colors.primary), // always-readable text on primary bg
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    background: isDark ? theme.colors.backgroundDark : theme.colors.background,
    surface: isDark ? theme.colors.surfaceDark : theme.colors.surface,
    text: isDark ? theme.colors.textDark : theme.colors.text,
    textMuted: isDark ? theme.colors.textMutedDark : theme.colors.textMuted,
  };
};
