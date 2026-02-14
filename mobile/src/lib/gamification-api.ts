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

  /**
   * Ensures user exists in backend. Creates if not found.
   * Used for users created in offline mode who need to sync with backend.
   */
  async ensureUserExists(user: {
    id: string;
    nickname: string;
    avatar?: string;
    points?: number;
    streakCurrent?: number;
    streakBest?: number;
    devotionalsCompleted?: number;
    totalTime?: number;
  }): Promise<UserProfile | null> {
    try {
      // First, try to get the user
      const res = await fetch(`${BACKEND_URL}/api/gamification/user/${user.id}`);

      if (res.ok) {
        // User exists, return profile
        return res.json();
      }

      if (res.status === 404) {
        // User doesn't exist, create them
        console.log('[Gamification] User not found, registering:', user.id);

        // Register with the user's existing ID by directly inserting (we need a special endpoint)
        // For now, we'll create a new user and they'll need to use that ID
        // Actually, let's try registering with their nickname
        const registerRes = await fetch(`${BACKEND_URL}/api/gamification/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: user.nickname,
            avatarId: user.avatar || 'avatar_dove',
          }),
        });

        if (registerRes.ok) {
          const newUser = await registerRes.json() as UserProfile;
          console.log('[Gamification] Created new backend user:', newUser.id);
          return newUser;
        }

        // If nickname is taken, try with a suffix
        if (registerRes.status === 409) {
          const suffix = Math.random().toString(36).substring(2, 6);
          const newNickname = `${user.nickname.slice(0, 12)}_${suffix}`;

          const retryRes = await fetch(`${BACKEND_URL}/api/gamification/user/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nickname: newNickname,
              avatarId: user.avatar || 'avatar_dove',
            }),
          });

          if (retryRes.ok) {
            const newUser = await retryRes.json() as UserProfile;
            console.log('[Gamification] Created backend user with new nickname:', newUser.id);
            return newUser;
          }
        }

        console.error('[Gamification] Failed to create backend user');
        return null;
      }

      throw new Error('Failed to fetch user');
    } catch (error) {
      console.error('[Gamification] Error ensuring user exists:', error);
      return null;
    }
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

  // Transfer Code Methods
  async generateTransferCode(userId: string): Promise<{ code: string; expiresAt: string }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/transfer/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to generate transfer code');
    return res.json();
  },

  async restoreWithCode(code: string, targetUserId: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/transfer/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, targetUserId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to restore');
    }
    return res.json();
  },

  async getActiveTransferCode(userId: string): Promise<{ hasActiveCode: boolean; code?: string; expiresAt?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/transfer/active/${userId}`);
    if (!res.ok) throw new Error('Failed to check transfer code');
    return res.json();
  },

  async getUserByDeviceId(deviceId: string): Promise<UserProfile | null> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/by-device/${deviceId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to find user');
    return res.json();
  },

  async updateDeviceId(userId: string, deviceId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}/device`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    if (!res.ok) throw new Error('Failed to update device ID');
  },
};
