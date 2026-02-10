// Gamification API service - connects to backend gamification endpoints
// Handles user profiles, points, store, inventory, and weekly challenges

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// Types
export interface StoreItem {
  id: string;
  type: 'theme' | 'frame' | 'music' | 'title' | 'avatar';
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  pricePoints: number;
  assetRef: string;
  rarity: 'common' | 'rare' | 'epic';
  metadata: string; // JSON string for themes
  available: boolean;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarId: string;
  frameId: string | null;
  titleId: string | null;
  themeId: string;
  selectedMusicId: string;
  points: number;
  streakCurrent: number;
  streakBest: number;
  devotionalsCompleted: number;
  totalTimeSeconds: number;
  lastActiveAt: string | null;
  inventory: Array<{
    itemId: string;
    acquiredAt: string;
    source: string;
    item: StoreItem;
  }>;
}

export interface WeeklyChallenge {
  id: string;
  weekId: string;
  challengeIndex: number;
  type: 'devotional_complete' | 'share' | 'prayer';
  goalCount: number;
  rewardPoints: number;
  rewardItemId: string | null;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  startDate: string;
  endDate: string;
}

export interface WeeklyProgress {
  id: string;
  challengeId: string;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  challenge: WeeklyChallenge;
}

export interface PointsResult {
  success: boolean;
  pointsAwarded: number;
  newTotal: number;
  message?: string;
}

export type PointAction = 'devotional_complete' | 'share' | 'prayer' | 'tts_complete' | 'streak_bonus' | 'favorite';

// API Functions

export const gamificationApi = {
  // User
  async registerUser(nickname: string, avatarId?: string): Promise<UserProfile> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, avatarId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to register user');
    }
    return res.json();
  },

  async getUser(userId: string): Promise<UserProfile> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async syncUser(userId: string, data: {
    points?: number;
    streakCurrent?: number;
    streakBest?: number;
    devotionalsCompleted?: number;
    totalTimeSeconds?: number;
    lastActiveAt?: string;
  }): Promise<UserProfile> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to sync user');
    return res.json();
  },

  async checkNickname(nickname: string): Promise<{ available: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/nickname/check/${encodeURIComponent(nickname)}`);
    if (!res.ok) throw new Error('Failed to check nickname');
    return res.json();
  },

  // Points
  async awardPoints(userId: string, action: PointAction, metadata?: any): Promise<PointsResult> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/points/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, metadata }),
    });
    if (!res.ok) {
      const error = await res.json();
      return { success: false, pointsAwarded: 0, newTotal: 0, message: error.error };
    }
    return res.json();
  },

  // Store
  async getStoreItems(type?: string): Promise<StoreItem[]> {
    const url = type
      ? `${BACKEND_URL}/api/gamification/store/items?type=${type}`
      : `${BACKEND_URL}/api/gamification/store/items`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch store items');
    return res.json();
  },

  async getInventory(userId: string): Promise<Array<{ itemId: string; item: StoreItem; source: string }>> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/inventory/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; item?: StoreItem; newPoints?: number; error?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/store/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    return data;
  },

  async equipItem(userId: string, type: 'theme' | 'frame' | 'title' | 'music', itemId: string | null): Promise<UserProfile> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, itemId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to equip item');
    }
    return res.json();
  },

  // Challenges
  async getCurrentChallenges(): Promise<WeeklyChallenge[]> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/challenges/current`);
    if (!res.ok) throw new Error('Failed to fetch challenges');
    return res.json();
  },

  async getChallengeProgress(userId: string): Promise<WeeklyProgress[]> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/challenges/progress/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch challenge progress');
    return res.json();
  },

  async updateChallengeProgress(userId: string, type: 'devotional_complete' | 'share' | 'prayer'): Promise<{
    updated: WeeklyProgress[];
    completed: boolean[];
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/challenges/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    // If user not found (404), return empty result instead of throwing
    // This handles users created in offline mode who aren't registered with backend
    if (res.status === 404) {
      return { updated: [], completed: [] };
    }
    if (!res.ok) throw new Error('Failed to update challenge progress');
    return res.json();
  },

  async claimChallengeReward(userId: string, challengeId: string): Promise<{
    success: boolean;
    pointsAwarded: number;
    itemAwarded?: StoreItem;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/challenges/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, challengeId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to claim reward');
    }
    return res.json();
  },
};
