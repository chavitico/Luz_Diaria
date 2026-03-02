// Gamification API service - connects to backend gamification endpoints
// Handles user profiles, points, store, inventory, and weekly challenges

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// Types
export interface StoreItem {
  id: string;
  type: 'theme' | 'frame' | 'music' | 'title' | 'avatar' | 'badge';
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
  activeBadgeId: string | null;
  role: string;
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

export interface CommunityMember {
  id: string;
  nickname: string;
  avatarId: string;
  frameId: string | null;
  titleId: string | null;
  points: number;
  streakCurrent: number;
  devotionalsCompleted: number;
  lastActiveAt: string | null;
  createdAt: string;
  supportCount: number;
  isAdmin?: boolean;
  countryCode: string | null;
  showCountry: boolean;
  activeBadgeId: string | null;
}

// Prayer types
export interface PrayerRequest {
  id: string;
  userId: string;
  periodId: string;
  mode: 'daily' | 'weekly';
  categoryKey: string;
  nickname: string | null;
  avatarId: string | null;
  frameId: string | null;
  titleId: string | null;
  displayNameOptIn: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrayerRequestDisplay {
  id: string;
  categoryKey: string;
  mode: 'daily' | 'weekly';
  nickname: string | null;
  avatarId: string | null;
  frameId: string | null;
  titleId: string | null;
  displayNameOptIn: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface DailyPrayer {
  id: string;
  dateId: string;
  title: string;
  titleEs: string;
  prayerText: string;
  prayerTextEs: string;
  includedCategories: string[];
  categoryStats: Record<string, number>;
  totalRequests: number;
  createdAt: string;
}

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
    completedDevotionalDate?: string; // YYYY-MM-DD — triggers authoritative counter update
  }): Promise<UserProfile> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any)?.error || `Failed to sync user (${res.status})`);
    }
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

  async purchaseBundle(
    userId: string,
    bundleId: string,
    itemIds: string[],
    bundlePrice: number
  ): Promise<{ success: boolean; itemsAdded?: StoreItem[]; newPoints?: number; alreadyOwned?: number; error?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/store/purchase-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, bundleId, itemIds, bundlePrice }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    return data;
  },

  async equipItem(userId: string, type: 'theme' | 'frame' | 'title' | 'music' | 'avatar' | 'badge', itemId: string | null): Promise<UserProfile> {
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

  // Promo Code Methods
  async redeemPromoCode(userId: string, code: string): Promise<{
    success: boolean;
    pointsAwarded?: number;
    displayCode?: string;
    newTotal?: number;
    message?: string;
    error?: string;
    errorCode?: string;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/promo/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });
    return res.json();
  },

  async getUserPromoRedemptions(userId: string): Promise<Array<{
    id: string;
    codeId: string;
    pointsAwarded: number;
    redeemedAt: string;
    promoCode: {
      id: string;
      displayCode: string;
      points: number;
    };
  }>> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/promo/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch redemptions');
    return res.json();
  },

  // Community methods
  async getCommunityMembers(limit: number = 20, offset: number = 0): Promise<{
    members: CommunityMember[];
    total: number;
    limit: number;
    offset: number;
    orderingStrategy: 'recent' | 'streak' | 'random';
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/community/members?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch community members');
    return res.json();
  },

  async updateCommunityOptIn(userId: string, optIn: boolean): Promise<{ success: boolean; communityOptIn: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/community/opt-in/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn }),
    });
    if (!res.ok) throw new Error('Failed to update community opt-in');
    return res.json();
  },

  async getCommunityOptIn(userId: string): Promise<{ communityOptIn: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/community/opt-in/${userId}`);
    if (!res.ok) throw new Error('Failed to get community opt-in status');
    return res.json();
  },

  // Prayer API methods
  async submitPrayerRequest(
    userId: string,
    categoryKey: string,
    mode: 'daily' | 'weekly'
  ): Promise<{
    success: boolean;
    prayerRequest?: PrayerRequest;
    pointsAwarded: number;
    error?: string;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, categoryKey, mode }),
    });
    return res.json();
  },

  async getUserPrayerRequests(userId: string): Promise<{ requests: PrayerRequest[] }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/request/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user prayer requests');
    return res.json();
  },

  async deletePrayerRequest(userId: string, mode: 'daily' | 'weekly'): Promise<{ success: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/request/${userId}/${mode}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete prayer request');
    return res.json();
  },

  async getCommunityPrayerRequests(limit: number = 50, offset: number = 0): Promise<{
    requests: PrayerRequestDisplay[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/community?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch community prayer requests');
    return res.json();
  },

  async getPrayerSummary(): Promise<{ summary: Record<string, number>; total: number }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/summary`);
    if (!res.ok) throw new Error('Failed to fetch prayer summary');
    return res.json();
  },

  async getTodayDailyPrayer(): Promise<DailyPrayer | null> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/daily/today`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch today\'s daily prayer');
    return res.json();
  },

  async getDailyPrayerByDate(dateId: string): Promise<DailyPrayer | null> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/daily/${dateId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch daily prayer');
    return res.json();
  },

  async prayedForCommunity(userId: string): Promise<{
    success: boolean;
    alreadyPrayed?: boolean;
    pointsAwarded: number;
    message?: string;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/prayed-for-community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to record community prayer');
    return res.json();
  },

  async checkPrayedForCommunity(userId: string): Promise<{ prayedToday: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/prayed-for-community/${userId}`);
    if (!res.ok) throw new Error('Failed to check prayer status');
    return res.json();
  },

  async updatePrayerDisplayOptIn(userId: string, optIn: boolean): Promise<{ success: boolean; prayerDisplayOptIn: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/display-opt-in/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn }),
    });
    if (!res.ok) throw new Error('Failed to update prayer display opt-in');
    return res.json();
  },

  async getPrayerDisplayOptIn(userId: string): Promise<{ prayerDisplayOptIn: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/prayer/display-opt-in/${userId}`);
    if (!res.ok) throw new Error('Failed to get prayer display opt-in status');
    return res.json();
  },

  // ─── Country ────────────────────────────────────────────────────────────────

  async updateCountry(userId: string, params: { countryCode?: string | null; showCountry?: boolean }): Promise<{ success: boolean; countryCode: string | null; showCountry: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}/country`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to update country');
    return res.json();
  },

  async getCountry(userId: string): Promise<{ countryCode: string | null; showCountry: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/user/${userId}/country`);
    if (!res.ok) throw new Error('Failed to get country');
    return res.json();
  },

  // ─── Collection Claims ──────────────────────────────────────────────────────

  async getCollectionClaims(userId: string): Promise<{ claims: Array<{ collectionId: string; pointsAwarded: number; claimedAt: string }> }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/collections/claims/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch collection claims');
    return res.json();
  },

  async claimCollection(params: {
    userId: string;
    collectionId: string;
    ownedItemIds: string[];
    rewardPoints: number;
  }): Promise<{ success: boolean; newPoints: number; pointsAwarded: number; collectionId: string }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/collections/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || 'Failed to claim collection reward');
    }
    return res.json();
  },

  // ─── Chapter Collection Progress ────────────────────────────────────────────

  async getChapterProgress(userId: string): Promise<{
    progress: Array<{ collectionId: string; claimedChapterIds: string[]; updatedAt: string }>;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/collections/chapters/progress/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch chapter progress');
    return res.json();
  },

  async saveChapterProgress(params: {
    userId: string;
    collectionId: string;
    claimedChapterIds: string[];
  }): Promise<{ success: boolean; claimedChapterIds: string[] }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/collections/chapters/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to save chapter progress');
    return res.json();
  },

  // ─── Community Support (Acompañar) ─────────────────────────────────────────

  async sendSupport(fromUserId: string, toUserId: string): Promise<{
    success: boolean;
    alreadySupported: boolean;
    supportCount: number;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gamification/community/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId }),
    });
    if (!res.ok) throw new Error('Failed to send support');
    return res.json();
  },

  async getSupportStatus(fromUserId: string, toUserIds: string[]): Promise<{
    status: Record<string, boolean>;
    dateId: string;
  }> {
    if (!toUserIds.length) return { status: {}, dateId: '' };
    const params = new URLSearchParams({
      fromUserId,
      toUserIds: toUserIds.join(','),
    });
    const res = await fetch(`${BACKEND_URL}/api/gamification/community/support/status?${params}`);
    if (!res.ok) throw new Error('Failed to get support status');
    return res.json();
  },

  // ─── Gifts ──────────────────────────────────────────────────────────────────

  async getPendingGift(userId: string): Promise<{
    gift: {
      userGiftId: string;
      giftDropId: string;
      title: string;
      message: string;
      rewardType: 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';
      rewardId: string;
      createdAt: string;
    } | null;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/pending?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { gift: null };
    return res.json();
  },

  async claimGift(userId: string, giftDropId: string): Promise<{
    success: boolean;
    granted?: { rewardType: string; rewardId: string };
    error?: string;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, giftDropId }),
    });
    return res.json();
  },

  // ─── Admin Gifts ─────────────────────────────────────────────────────────────

  async adminListGiftDrops(userId: string): Promise<Array<{
    id: string;
    title: string;
    message: string;
    rewardType: string;
    rewardId: string;
    audienceType: string;
    audienceUserIds: string[];
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    createdAt: string;
    totalRecipients: number;
  }>> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/admin/list`, {
      headers: { 'X-User-Id': userId },
    });
    if (!res.ok) throw new Error('Failed to list gift drops');
    return res.json();
  },

  async adminCreateGiftDrop(userId: string, data: {
    title: string;
    message: string;
    rewardType: 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';
    rewardId: string;
    audienceType: 'ALL_USERS' | 'USER_IDS';
    audienceUserIds?: string[];
    isActive?: boolean;
  }): Promise<{ success: boolean; giftDrop: { id: string } }> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/admin/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create gift drop');
    return res.json();
  },

  async adminUpdateGiftDrop(userId: string, id: string, data: { isActive?: boolean; title?: string; message?: string }): Promise<{ success: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/admin/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update gift drop');
    return res.json();
  },

  async adminPublishGiftDrop(userId: string, giftDropId: string): Promise<{ success: boolean; created: number; total: number; message?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/admin/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ giftDropId }),
    });
    if (!res.ok) throw new Error('Failed to publish gift drop');
    return res.json();
  },

  async adminDeleteGiftDrop(userId: string, id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/admin/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId },
    });
    if (!res.ok) throw new Error('Failed to delete gift drop');
    return res.json();
  },

  async adminGetStoreItems(userId: string): Promise<Array<{
    id: string;
    type: string;
    nameEs: string;
    nameEn: string;
    rarity: string;
  }>> {
    const res = await fetch(`${BACKEND_URL}/api/gifts/admin/store-items`, {
      headers: { 'X-User-Id': userId },
    });
    if (!res.ok) throw new Error('Failed to get store items');
    return res.json();
  },
};
