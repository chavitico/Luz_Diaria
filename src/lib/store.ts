// Global app state store using Zustand

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserSettings, ThemeOption, Language, UserProgress } from './types';
import { THEMES, DEFAULT_AVATARS } from './constants';

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
  addPoints: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addFavorite: (devotionalDate: string) => void;
  removeFavorite: (devotionalDate: string) => void;
  purchaseItem: (itemId: string, price: number) => boolean;
  reset: () => void;
}

const initialUserSettings: UserSettings = {
  theme: 'dawn',
  language: 'en',
  musicEnabled: true,
  musicVolume: 0.5,
  notificationsEnabled: true,
  streakReminders: true,
  ttsVoice: 'default',
  ttsSpeed: 1.0,
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

      addFavorite: (devotionalDate) => set((state) => ({
        user: state.user
          ? { ...state.user, favorites: [...state.user.favorites, devotionalDate] }
          : null,
      })),

      removeFavorite: (devotionalDate) => set((state) => ({
        user: state.user
          ? { ...state.user, favorites: state.user.favorites.filter(d => d !== devotionalDate) }
          : null,
      })),

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

      reset: () => set({
        user: null,
        isOnboarded: false,
        currentTheme: 'dawn',
        isDarkMode: false,
        todayProgress: null,
        sessionStartTime: null,
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
      }),
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
export const useUserFavorites = () => useAppStore((s) => s.user?.favorites ?? []);
export const useUserSettings = () => useAppStore((s) => s.user?.settings ?? initialUserSettings);
export const useLanguage = () => useAppStore((s) => s.user?.settings?.language ?? 'en');

// Helper to get theme colors
export const useThemeColors = () => {
  const theme = useCurrentTheme();
  const isDark = useIsDarkMode();
  const colors = THEMES[theme];

  return {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    background: isDark ? colors.backgroundDark : colors.background,
    surface: isDark ? colors.surfaceDark : colors.surface,
    text: isDark ? colors.textDark : colors.text,
    textMuted: isDark ? colors.textMutedDark : colors.textMuted,
  };
};
