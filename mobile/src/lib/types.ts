// Core types for the devotional app

export interface UserSettings {
  theme: ThemeOption;
  language: Language;
  musicEnabled: boolean;
  musicVolume: number;
  notificationsEnabled: boolean;
  streakReminders: boolean;
  ttsVoice: string;
  ttsSpeed: number;
  ttsVolume: number;
  textScale: number; // 0.85 – 1.40, default 1.0
}

export type ThemeOption = string; // Theme IDs are dynamic (e.g. 'theme_amanecer', 'theme_promesa')
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

// Gamification Types
export interface DailyActions {
  shareDate?: string; // YYYY-MM-DD
  shareCount?: number;
  prayerDate?: string;
  prayerDone?: boolean;
  ttsDate?: string;
  ttsDone?: boolean;
}

export interface StoreItemType {
  id: string;
  type: 'theme' | 'frame' | 'music' | 'title' | 'avatar';
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  pricePoints: number;
  assetRef: string;
  rarity: 'common' | 'rare' | 'epic';
  metadata?: string;
  available: boolean;
}

export interface ThemeColors {
  primary: string;
  primaryDark?: string; // Dark-mode variant of primary. If omitted, resolver auto-adjusts contrast.
  secondary: string;
  accent: string;
  background: string;
  backgroundDark: string;
  surface: string;
  surfaceDark: string;
  text?: string;
  textDark?: string;
  textMuted?: string;
  textMutedDark?: string;
}

export interface WeeklyChallengeType {
  id: string;
  weekId: string;
  type: 'devotional_complete' | 'share' | 'prayer';
  goalCount: number;
  rewardPoints: number;
  rewardItemId?: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
}

export interface ChallengeProgressType {
  challengeId: string;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
}

// User interface with gamification fields
export type UserRole = 'USER' | 'MODERATOR' | 'OWNER';

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  role?: UserRole;
  frameId?: string | null; // equipped frame
  titleId?: string | null; // equipped title
  themeId?: string; // equipped theme (from store)
  selectedMusicId?: string; // equipped music track
  points: number;
  streakCurrent: number;
  streakBest: number;
  totalTime: number; // in seconds
  totalShares: number; // total devotionals shared
  devotionalsCompleted: number;
  favorites: string[]; // devotional dates
  createdAt: number;
  lastActiveDate: string;
  purchasedItems: string[];
  dailyActions?: DailyActions; // daily action tracking
  lastWeeklyChestClaimed?: string; // week ID when chest was last claimed (e.g., "2025-W07")
  settings: UserSettings;
}

// Gamification constants
export const POINTS = {
  COMPLETE_DEVOTIONAL: 50,
  STREAK_BONUS_5: 100,
  STREAK_BONUS_10: 250,
  STREAK_BONUS_30: 1000,
  FAVORITE_DEVOTIONAL: 10,
  DAILY_ENGAGEMENT: 25,
  // New point actions
  SHARE_DEVOTIONAL: 10,  // max 2/day
  PRAYER_CONFIRM: 8,     // max 1/day
  TTS_COMPLETE: 6,       // max 1/day
} as const;

export const COMPLETION_REQUIREMENTS = {
  MIN_TIME_SECONDS: 180, // 3 minutes
  SCROLL_TO_BOTTOM: true,
} as const;
