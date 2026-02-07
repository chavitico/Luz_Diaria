// Core types for the devotional app

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  points: number;
  streakCurrent: number;
  streakBest: number;
  totalTime: number; // in seconds
  devotionalsCompleted: number;
  favorites: string[]; // devotional dates
  createdAt: number;
  lastActiveDate: string;
  purchasedItems: string[];
  settings: UserSettings;
}

export interface UserSettings {
  theme: ThemeOption;
  language: Language;
  musicEnabled: boolean;
  musicVolume: number;
  notificationsEnabled: boolean;
  streakReminders: boolean;
  ttsVoice: string;
  ttsSpeed: number;
}

export type ThemeOption = 'dawn' | 'dusk' | 'ocean' | 'forest' | 'rose';
export type Language = 'en' | 'es';

export interface Devotional {
  date: string; // YYYY-MM-DD
  title: string;
  titleEs: string;
  imageUrl: string;
  bibleVerse: string;
  bibleVerseEs: string;
  bibleReference: string;
  bibleReferenceEs: string;
  reflection: string;
  reflectionEs: string;
  story: string;
  storyEs: string;
  biblicalCharacter: string;
  biblicalCharacterEs: string;
  application: string;
  applicationEs: string;
  prayer: string;
  prayerEs: string;
  topic: string;
  topicEs: string;
}

export interface UserProgress {
  odotionalDate: string;
  completed: boolean;
  timeSpent: number; // seconds
  completedAt?: number;
}

export interface StoreItem {
  id: string;
  type: 'avatar' | 'customization' | 'nickname_change';
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  imageUrl: string;
  price: number;
  category: string;
}

export interface DevotionalSection {
  key: string;
  title: string;
  titleEs: string;
  content: string;
  contentEs: string;
  expanded: boolean;
}

// Gamification constants
export const POINTS = {
  COMPLETE_DEVOTIONAL: 50,
  STREAK_BONUS_5: 100,
  STREAK_BONUS_10: 250,
  STREAK_BONUS_30: 1000,
  FAVORITE_DEVOTIONAL: 10,
  DAILY_ENGAGEMENT: 25,
} as const;

export const COMPLETION_REQUIREMENTS = {
  MIN_TIME_SECONDS: 180, // 3 minutes
  SCROLL_TO_BOTTOM: true,
} as const;
