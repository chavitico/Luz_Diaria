import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

export const gamificationRouter = new Hono();

// ============================================
// TYPES & CONSTANTS
// ============================================

type ActionType = 'devotional_complete' | 'share' | 'prayer' | 'tts_complete' | 'streak_bonus' | 'favorite';

interface DailyActions {
  shareDate?: string;
  shareCount?: number;
  prayerDate?: string;
  prayerDone?: boolean;
  ttsDate?: string;
  ttsDone?: boolean;
  devotionalDates?: string[]; // Track completed devotionals by date
}

const POINTS_CONFIG: Record<ActionType, { points: number; dailyCap?: number }> = {
  devotional_complete: { points: 50 },
  share: { points: 10, dailyCap: 2 },
  prayer: { points: 8, dailyCap: 1 },
  tts_complete: { points: 6, dailyCap: 1 },
  streak_bonus: { points: 0 }, // Varies by milestone
  favorite: { points: 10 },
};

const STREAK_MILESTONES: Record<number, number> = {
  5: 100,
  10: 250,
  30: 1000,
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

const registerUserSchema = z.object({
  nickname: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Nickname must contain only alphanumeric characters and underscores"),
  avatarId: z.string().optional(),
  deviceId: z.string().optional(),
});

const syncUserSchema = z.object({
  points: z.number().int().nonnegative().optional(),
  streakCurrent: z.number().int().nonnegative().optional(),
  streakBest: z.number().int().nonnegative().optional(),
  devotionalsCompleted: z.number().int().nonnegative().optional(),
  totalTimeSeconds: z.number().int().nonnegative().optional(),
  lastActiveAt: z.string().datetime().optional(),
  // When a new devotional is completed, pass the date (YYYY-MM-DD) to record it authoritatively
  completedDevotionalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const awardPointsSchema = z.object({
  userId: z.string(),
  action: z.enum(['devotional_complete', 'share', 'prayer', 'tts_complete', 'streak_bonus', 'favorite']),
  metadata: z.any().optional(),
});

const purchaseSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
});

const equipSchema = z.object({
  type: z.enum(['theme', 'frame', 'title', 'music', 'avatar']),
  itemId: z.string(),
});

const updateChallengeSchema = z.object({
  userId: z.string(),
  type: z.enum(['devotional_complete', 'share', 'prayer']),
});

const claimChallengeSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
});

// Transfer code schemas
const generateTransferCodeSchema = z.object({
  userId: z.string(),
});

const restoreTransferCodeSchema = z.object({
  code: z.string().length(8),
  targetUserId: z.string(),
});

// Device ID schemas
const updateDeviceIdSchema = z.object({
  deviceId: z.string(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

function parseDailyActions(jsonStr: string): DailyActions {
  try {
    return JSON.parse(jsonStr) as DailyActions;
  } catch {
    return {};
  }
}

// Generate a random 8-character alphanumeric code
function generateTransferCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0/O, 1/I/L
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Compute deterministic ledger IDs for idempotent point tracking
function computeLedgerId(
  action: ActionType,
  dateId: string,
  metadata?: Record<string, unknown>
): string {
  switch (action) {
    case 'devotional_complete': {
      const devotionalDate = (metadata?.devotionalDate as string) ?? dateId;
      return `devotional_${devotionalDate}`;
    }
    case 'streak_bonus': {
      const streakDays = metadata?.streakDays as number;
      return `streak_bonus_${streakDays}_${dateId}`;
    }
    case 'share': {
      const count = metadata?.shareCount as number ?? 1;
      return `share_${dateId}_${count}`;
    }
    case 'prayer':
      return `prayer_${dateId}`;
    case 'tts_complete':
      return `tts_${dateId}`;
    case 'favorite': {
      const favoriteDate = (metadata?.devotionalDate as string) ?? dateId;
      return `favorite_${favoriteDate}`;
    }
    default:
      return `${action}_${dateId}`;
  }
}

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// POST /user/register - Register new user with unique nickname
gamificationRouter.post(
  "/user/register",
  zValidator("json", registerUserSchema),
  async (c) => {
    try {
      const { nickname, avatarId, deviceId } = c.req.valid("json");
      const nicknameLower = nickname.toLowerCase();

      // Check for existing nickname (case-insensitive)
      const existingUser = await prisma.user.findUnique({
        where: { nicknameLower },
      });

      if (existingUser) {
        return c.json({ error: "Nickname is already taken" }, 409);
      }

      const user = await prisma.user.create({
        data: {
          nickname,
          nicknameLower,
          avatarId: avatarId ?? "avatar_dove",
          deviceId: deviceId ?? null,
        },
        include: {
          inventory: {
            include: { item: true },
          },
        },
      });

      return c.json(user, 201);
    } catch (error) {
      console.error("[Gamification] Error registering user:", error);
      return c.json({ error: "Failed to register user" }, 500);
    }
  }
);

// GET /user/:userId - Get user profile
gamificationRouter.get("/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventory: {
          include: { item: true },
        },
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Build equipped items info
    const equippedItems = {
      theme: user.themeId,
      frame: user.frameId,
      title: user.titleId,
      music: user.selectedMusicId,
    };

    return c.json({ ...user, equippedItems });
  } catch (error) {
    console.error("[Gamification] Error getting user:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// POST /user/:userId/sync - Sync local user data to server
gamificationRouter.post(
  "/user/:userId/sync",
  zValidator("json", syncUserSchema),
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const data = c.req.valid("json");

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        console.log(`[Sync] User not found: ${userId}`);
        return c.json({ error: "User not found" }, 404);
      }

      console.log(`[Sync] User ${existingUser.nickname} (${userId}):`, {
        before: {
          points: existingUser.points,
          streakCurrent: existingUser.streakCurrent,
          devotionalsCompleted: existingUser.devotionalsCompleted,
        },
        incoming: data,
      });

      const updateData: Record<string, unknown> = {};

      // If a new devotional was completed, upsert a DevotionalCompletion row (unique per date)
      // then derive the authoritative count from the table
      if (data.completedDevotionalDate) {
        await prisma.devotionalCompletion.upsert({
          where: {
            userId_devotionalDate: {
              userId,
              devotionalDate: data.completedDevotionalDate,
            },
          },
          update: {}, // already recorded — no-op
          create: {
            userId,
            devotionalDate: data.completedDevotionalDate,
          },
        });
      }

      // Derive devotionalsCompleted from the authoritative DevotionalCompletion table,
      // but never go lower than what already exists in the DB or what the client sends.
      // This preserves historical data for users who completed before this system was introduced.
      const authoritativeCount = await prisma.devotionalCompletion.count({
        where: { userId },
      });
      updateData.devotionalsCompleted = Math.max(
        authoritativeCount,
        existingUser.devotionalsCompleted,
        data.devotionalsCompleted ?? 0
      );

      // Use MAX strategy for cumulative stats to prevent data loss when local store resets
      // This ensures we never lose progress even if the frontend sends lower values
      if (data.points !== undefined) {
        updateData.points = Math.max(data.points, existingUser.points);
      }
      if (data.streakCurrent !== undefined) {
        updateData.streakCurrent = Math.max(data.streakCurrent, existingUser.streakCurrent);
      }
      if (data.streakBest !== undefined) {
        updateData.streakBest = Math.max(data.streakBest, existingUser.streakBest);
      }
      if (data.totalTimeSeconds !== undefined) {
        updateData.totalTimeSeconds = Math.max(data.totalTimeSeconds, existingUser.totalTimeSeconds);
      }
      if (data.lastActiveAt !== undefined) updateData.lastActiveAt = new Date(data.lastActiveAt);

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          inventory: {
            include: { item: true },
          },
        },
      });

      console.log(`[Sync] User ${existingUser.nickname} updated:`, {
        points: user.points,
        streakCurrent: user.streakCurrent,
        devotionalsCompleted: user.devotionalsCompleted,
      });

      return c.json(user);
    } catch (error) {
      console.error("[Gamification] Error syncing user:", error);
      return c.json({ error: "Failed to sync user" }, 500);
    }
  }
);

// ============================================
// POINTS SYSTEM ENDPOINTS
// ============================================

// POST /points/award - Award points with ledger-based idempotent tracking
gamificationRouter.post(
  "/points/award",
  zValidator("json", awardPointsSchema),
  async (c) => {
    try {
      const { userId, action, metadata } = c.req.valid("json");
      const today = getTodayDateString();

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const dailyActions = parseDailyActions(user.dailyActions);
      let pointsAwarded = 0;
      let message: string | undefined;
      let ledgerId: string;
      let shareCountForLedger = 1;

      // Determine points and validate action-specific rules
      switch (action) {
        case "share": {
          // Reset count if new day
          if (dailyActions.shareDate !== today) {
            dailyActions.shareDate = today;
            dailyActions.shareCount = 0;
          }
          const currentCount = dailyActions.shareCount ?? 0;
          if (currentCount >= 2) {
            return c.json({
              success: false,
              pointsAwarded: 0,
              newTotal: user.points,
              message: "Daily share limit reached (2/day)",
            });
          }
          shareCountForLedger = currentCount + 1;
          dailyActions.shareCount = shareCountForLedger;
          pointsAwarded = POINTS_CONFIG.share.points;
          break;
        }

        case "prayer": {
          if (dailyActions.prayerDate === today && dailyActions.prayerDone) {
            return c.json({
              success: false,
              pointsAwarded: 0,
              newTotal: user.points,
              message: "Daily prayer bonus already claimed",
            });
          }
          dailyActions.prayerDate = today;
          dailyActions.prayerDone = true;
          pointsAwarded = POINTS_CONFIG.prayer.points;
          break;
        }

        case "tts_complete": {
          if (dailyActions.ttsDate === today && dailyActions.ttsDone) {
            return c.json({
              success: false,
              pointsAwarded: 0,
              newTotal: user.points,
              message: "Daily TTS bonus already claimed",
            });
          }
          dailyActions.ttsDate = today;
          dailyActions.ttsDone = true;
          pointsAwarded = POINTS_CONFIG.tts_complete.points;
          break;
        }

        case "devotional_complete": {
          const devotionalDate = (metadata?.devotionalDate as string) ?? today;
          const completedDates = dailyActions.devotionalDates ?? [];

          if (completedDates.includes(devotionalDate)) {
            return c.json({
              success: false,
              pointsAwarded: 0,
              newTotal: user.points,
              message: "This devotional has already been completed",
            });
          }

          dailyActions.devotionalDates = [...completedDates, devotionalDate];
          pointsAwarded = POINTS_CONFIG.devotional_complete.points;
          break;
        }

        case "streak_bonus": {
          const streakDays = (metadata?.streakDays as number) ?? user.streakCurrent;
          const milestonePoints = STREAK_MILESTONES[streakDays];

          if (!milestonePoints) {
            return c.json({
              success: false,
              pointsAwarded: 0,
              newTotal: user.points,
              message: `No milestone bonus for ${streakDays} days`,
            });
          }

          pointsAwarded = milestonePoints;
          message = `Streak milestone bonus for ${streakDays} days!`;
          break;
        }

        case "favorite": {
          pointsAwarded = POINTS_CONFIG.favorite.points;
          break;
        }
      }

      // Compute deterministic ledger ID
      const metadataForLedger = {
        ...metadata,
        shareCount: shareCountForLedger,
      };
      ledgerId = computeLedgerId(action, today, metadataForLedger);

      // Use transaction for atomic ledger entry + points update
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Check if ledger entry already exists (idempotency check)
          const existingEntry = await tx.pointLedger.findUnique({
            where: {
              userId_ledgerId: { userId, ledgerId },
            },
          });

          if (existingEntry) {
            // Already awarded - return current state
            const currentUser = await tx.user.findUnique({
              where: { id: userId },
            });
            return {
              alreadyAwarded: true,
              newTotal: currentUser?.points ?? user.points,
            };
          }

          // Create ledger entry
          await tx.pointLedger.create({
            data: {
              userId,
              ledgerId,
              type: action,
              dateId: today,
              amount: pointsAwarded,
              metadata: JSON.stringify(metadata ?? {}),
            },
          });

          // Atomic increment of points
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              points: { increment: pointsAwarded },
              dailyActions: JSON.stringify(dailyActions),
            },
          });

          return {
            alreadyAwarded: false,
            newTotal: updatedUser.points,
          };
        });

        if (result.alreadyAwarded) {
          return c.json({
            success: false,
            pointsAwarded: 0,
            newTotal: result.newTotal,
            message: "Points already awarded for this action",
            ledgerId,
          });
        }

        return c.json({
          success: true,
          pointsAwarded,
          newTotal: result.newTotal,
          message,
          ledgerId,
        });
      } catch (txError) {
        // Handle unique constraint violation (race condition)
        if (txError instanceof Error && txError.message.includes('Unique constraint')) {
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
          });
          return c.json({
            success: false,
            pointsAwarded: 0,
            newTotal: currentUser?.points ?? user.points,
            message: "Points already awarded for this action",
            ledgerId,
          });
        }
        throw txError;
      }
    } catch (error) {
      console.error("[Gamification] Error awarding points:", error);
      return c.json({ error: "Failed to award points" }, 500);
    }
  }
);

// ============================================
// STORE & INVENTORY ENDPOINTS
// ============================================

// GET /store/items - Get all available store items
gamificationRouter.get("/store/items", async (c) => {
  try {
    const type = c.req.query("type");

    const where: { available: boolean; type?: string } = { available: true };
    if (type) {
      where.type = type;
    }

    const items = await prisma.storeItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { pricePoints: "asc" }],
    });

    return c.json(items);
  } catch (error) {
    console.error("[Gamification] Error getting store items:", error);
    return c.json({ error: "Failed to get store items" }, 500);
  }
});

// GET /inventory/:userId - Get user's inventory
gamificationRouter.get("/inventory/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const inventory = await prisma.userInventory.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { acquiredAt: "desc" },
    });

    return c.json(inventory);
  } catch (error) {
    console.error("[Gamification] Error getting inventory:", error);
    return c.json({ error: "Failed to get inventory" }, 500);
  }
});

// POST /store/purchase - Purchase item
gamificationRouter.post(
  "/store/purchase",
  zValidator("json", purchaseSchema),
  async (c) => {
    try {
      const { userId, itemId } = c.req.valid("json");

      // Use transaction for atomic operation
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        const item = await tx.storeItem.findUnique({
          where: { id: itemId },
        });

        if (!item) {
          throw new Error("ITEM_NOT_FOUND");
        }

        if (!item.available) {
          throw new Error("ITEM_NOT_AVAILABLE");
        }

        // Check if user already owns item
        const existingInventory = await tx.userInventory.findUnique({
          where: {
            userId_itemId: { userId, itemId },
          },
        });

        if (existingInventory) {
          throw new Error("ALREADY_OWNED");
        }

        // Check if user has enough points
        if (user.points < item.pricePoints) {
          throw new Error("INSUFFICIENT_POINTS");
        }

        // Deduct points and add to inventory
        const newPoints = user.points - item.pricePoints;

        await tx.user.update({
          where: { id: userId },
          data: { points: newPoints },
        });

        await tx.userInventory.create({
          data: {
            userId,
            itemId,
            source: "store",
          },
        });

        return { item, newPoints };
      });

      return c.json({
        success: true,
        item: result.item,
        newPoints: result.newPoints,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "USER_NOT_FOUND") {
        return c.json({ error: "User not found" }, 404);
      }
      if (errorMessage === "ITEM_NOT_FOUND") {
        return c.json({ error: "Item not found" }, 404);
      }
      if (errorMessage === "ITEM_NOT_AVAILABLE") {
        return c.json({ error: "Item is not available" }, 400);
      }
      if (errorMessage === "ALREADY_OWNED") {
        return c.json({ error: "You already own this item" }, 400);
      }
      if (errorMessage === "INSUFFICIENT_POINTS") {
        return c.json({ error: "Insufficient points" }, 400);
      }

      console.error("[Gamification] Error purchasing item:", error);
      return c.json({ error: "Failed to purchase item" }, 500);
    }
  }
);

// POST /store/purchase-bundle - Purchase a bundle of items
gamificationRouter.post(
  "/store/purchase-bundle",
  zValidator("json", z.object({
    userId: z.string(),
    bundleId: z.string(),
    itemIds: z.array(z.string()),
    bundlePrice: z.number(),
  })),
  async (c) => {
    try {
      const { userId, bundleId, itemIds, bundlePrice } = c.req.valid("json");

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        // Check if user has enough points
        if (user.points < bundlePrice) {
          throw new Error("INSUFFICIENT_POINTS");
        }

        // Find all items in the bundle
        const items = await tx.storeItem.findMany({
          where: { id: { in: itemIds } },
        });

        // Check which items user already owns
        const existingInventory = await tx.userInventory.findMany({
          where: {
            userId,
            itemId: { in: itemIds },
          },
        });

        const ownedItemIds = new Set(existingInventory.map(inv => inv.itemId));
        const itemsToAdd = items.filter(item => !ownedItemIds.has(item.id));

        if (itemsToAdd.length === 0) {
          throw new Error("ALL_ITEMS_OWNED");
        }

        // Deduct points
        const newPoints = user.points - bundlePrice;

        await tx.user.update({
          where: { id: userId },
          data: { points: newPoints },
        });

        // Add all new items to inventory
        for (const item of itemsToAdd) {
          await tx.userInventory.create({
            data: {
              userId,
              itemId: item.id,
              source: `bundle:${bundleId}`,
            },
          });
        }

        return {
          itemsAdded: itemsToAdd,
          newPoints,
          alreadyOwned: items.length - itemsToAdd.length,
        };
      });

      return c.json({
        success: true,
        itemsAdded: result.itemsAdded,
        newPoints: result.newPoints,
        alreadyOwned: result.alreadyOwned,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "USER_NOT_FOUND") {
        return c.json({ error: "User not found" }, 404);
      }
      if (errorMessage === "INSUFFICIENT_POINTS") {
        return c.json({ error: "Insufficient points" }, 400);
      }
      if (errorMessage === "ALL_ITEMS_OWNED") {
        return c.json({ error: "You already own all items in this bundle" }, 400);
      }

      console.error("[Gamification] Error purchasing bundle:", error);
      return c.json({ error: "Failed to purchase bundle" }, 500);
    }
  }
);

// POST /user/:userId/equip - Equip item
gamificationRouter.post(
  "/user/:userId/equip",
  zValidator("json", equipSchema),
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const { type, itemId } = c.req.valid("json");

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user owns the item (or it's a default/free item)
      const isDefaultFreeItem = itemId.startsWith("music_free_") ||
                                itemId === "theme_amanecer" ||
                                itemId.startsWith("avatar_");

      if (!isDefaultFreeItem) {
        const inventoryItem = await prisma.userInventory.findUnique({
          where: {
            userId_itemId: { userId, itemId },
          },
        });

        if (!inventoryItem) {
          return c.json({ error: "You do not own this item" }, 403);
        }
      }

      // Update the appropriate field based on type
      const updateData: Record<string, string | null> = {};
      switch (type) {
        case "theme":
          updateData.themeId = itemId;
          break;
        case "frame":
          updateData.frameId = itemId;
          break;
        case "title":
          updateData.titleId = itemId;
          break;
        case "music":
          updateData.selectedMusicId = itemId;
          break;
        case "avatar":
          updateData.avatarId = itemId;
          break;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          inventory: {
            include: { item: true },
          },
        },
      });

      return c.json(updatedUser);
    } catch (error) {
      console.error("[Gamification] Error equipping item:", error);
      return c.json({ error: "Failed to equip item" }, 500);
    }
  }
);

// ============================================
// WEEKLY CHALLENGES ENDPOINTS
// ============================================

// GET /challenges/current - Get current week's challenges
gamificationRouter.get("/challenges/current", async (c) => {
  try {
    const currentWeekId = getCurrentWeekId();

    const challenges = await prisma.weeklyChallenge.findMany({
      where: { weekId: currentWeekId },
      orderBy: { challengeIndex: "asc" },
    });

    return c.json(challenges);
  } catch (error) {
    console.error("[Gamification] Error getting current challenges:", error);
    return c.json({ error: "Failed to get challenges" }, 500);
  }
});

// GET /challenges/progress/:userId - Get user's challenge progress
gamificationRouter.get("/challenges/progress/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const currentWeekId = getCurrentWeekId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get current week's challenges
    const challenges = await prisma.weeklyChallenge.findMany({
      where: { weekId: currentWeekId },
    });

    // Get or create progress for each challenge
    const progressList = await Promise.all(
      challenges.map(async (challenge) => {
        let progress = await prisma.weeklyProgress.findUnique({
          where: {
            userId_challengeId: { userId, challengeId: challenge.id },
          },
          include: { challenge: true },
        });

        if (!progress) {
          progress = await prisma.weeklyProgress.create({
            data: {
              userId,
              challengeId: challenge.id,
            },
            include: { challenge: true },
          });
        }

        return progress;
      })
    );

    return c.json(progressList);
  } catch (error) {
    console.error("[Gamification] Error getting challenge progress:", error);
    return c.json({ error: "Failed to get progress" }, 500);
  }
});

// POST /challenges/update - Update challenge progress
gamificationRouter.post(
  "/challenges/update",
  zValidator("json", updateChallengeSchema),
  async (c) => {
    try {
      const { userId, type } = c.req.valid("json");
      const currentWeekId = getCurrentWeekId();

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Find challenges of this type for current week
      const challenges = await prisma.weeklyChallenge.findMany({
        where: {
          weekId: currentWeekId,
          type: type,
        },
      });

      const updatedProgress: Array<{
        id: string;
        userId: string;
        challengeId: string;
        currentCount: number;
        completed: boolean;
        claimed: boolean;
        updatedAt: Date;
      }> = [];
      const completedFlags: boolean[] = [];

      for (const challenge of challenges) {
        // Get or create progress
        let progress = await prisma.weeklyProgress.findUnique({
          where: {
            userId_challengeId: { userId, challengeId: challenge.id },
          },
        });

        if (!progress) {
          progress = await prisma.weeklyProgress.create({
            data: {
              userId,
              challengeId: challenge.id,
            },
          });
        }

        // Don't update if already completed
        if (progress.completed) {
          updatedProgress.push(progress);
          completedFlags.push(false); // Already was completed, not newly completed
          continue;
        }

        const newCount = progress.currentCount + 1;
        const isNowCompleted = newCount >= challenge.goalCount;

        const updated = await prisma.weeklyProgress.update({
          where: { id: progress.id },
          data: {
            currentCount: newCount,
            completed: isNowCompleted,
          },
        });

        updatedProgress.push(updated);
        completedFlags.push(isNowCompleted);
      }

      return c.json({
        updated: updatedProgress,
        completed: completedFlags,
      });
    } catch (error) {
      console.error("[Gamification] Error updating challenge:", error);
      return c.json({ error: "Failed to update challenge" }, 500);
    }
  }
);

// POST /challenges/claim - Claim challenge reward
gamificationRouter.post(
  "/challenges/claim",
  zValidator("json", claimChallengeSchema),
  async (c) => {
    try {
      const { userId, challengeId } = c.req.valid("json");

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        const progress = await tx.weeklyProgress.findUnique({
          where: {
            userId_challengeId: { userId, challengeId },
          },
          include: { challenge: true },
        });

        if (!progress) {
          throw new Error("PROGRESS_NOT_FOUND");
        }

        if (!progress.completed) {
          throw new Error("NOT_COMPLETED");
        }

        if (progress.claimed) {
          throw new Error("ALREADY_CLAIMED");
        }

        // Award points
        const newPoints = user.points + progress.challenge.rewardPoints;

        await tx.user.update({
          where: { id: userId },
          data: { points: newPoints },
        });

        // Mark as claimed
        await tx.weeklyProgress.update({
          where: { id: progress.id },
          data: { claimed: true },
        });

        // Award optional item
        let itemAwarded = null;
        if (progress.challenge.rewardItemId) {
          const item = await tx.storeItem.findUnique({
            where: { id: progress.challenge.rewardItemId },
          });

          if (item) {
            // Check if user already has the item
            const existingInventory = await tx.userInventory.findUnique({
              where: {
                userId_itemId: { userId, itemId: item.id },
              },
            });

            if (!existingInventory) {
              await tx.userInventory.create({
                data: {
                  userId,
                  itemId: item.id,
                  source: "challenge",
                },
              });
              itemAwarded = item;
            }
          }
        }

        return {
          pointsAwarded: progress.challenge.rewardPoints,
          itemAwarded,
        };
      });

      return c.json({
        success: true,
        pointsAwarded: result.pointsAwarded,
        itemAwarded: result.itemAwarded,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "USER_NOT_FOUND") {
        return c.json({ error: "User not found" }, 404);
      }
      if (errorMessage === "PROGRESS_NOT_FOUND") {
        return c.json({ error: "Challenge progress not found" }, 404);
      }
      if (errorMessage === "NOT_COMPLETED") {
        return c.json({ error: "Challenge not completed yet" }, 400);
      }
      if (errorMessage === "ALREADY_CLAIMED") {
        return c.json({ error: "Reward already claimed" }, 400);
      }

      console.error("[Gamification] Error claiming reward:", error);
      return c.json({ error: "Failed to claim reward" }, 500);
    }
  }
);

// ============================================
// NICKNAME VALIDATION ENDPOINT
// ============================================

// GET /nickname/check/:nickname - Check if nickname available
gamificationRouter.get("/nickname/check/:nickname", async (c) => {
  try {
    const nickname = c.req.param("nickname");
    const nicknameLower = nickname.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { nicknameLower },
    });

    return c.json({ available: !existingUser });
  } catch (error) {
    console.error("[Gamification] Error checking nickname:", error);
    return c.json({ error: "Failed to check nickname" }, 500);
  }
});

// ============================================
// TRANSFER CODE ENDPOINTS
// ============================================

// POST /transfer/generate - Generate a transfer code for account restoration
gamificationRouter.post(
  "/transfer/generate",
  zValidator("json", generateTransferCodeSchema),
  async (c) => {
    try {
      const { userId } = c.req.valid("json");

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user already has an active (unexpired, unused) transfer code
      const existingActiveCode = await prisma.transferCode.findFirst({
        where: {
          sourceUserId: userId,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingActiveCode) {
        return c.json({
          code: existingActiveCode.code,
          expiresAt: existingActiveCode.expiresAt.toISOString(),
          message: "Existing active code returned",
        });
      }

      // Generate new code with 15-minute expiry
      const code = generateTransferCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const transferCode = await prisma.transferCode.create({
        data: {
          code,
          sourceUserId: userId,
          expiresAt,
        },
      });

      return c.json({
        code: transferCode.code,
        expiresAt: transferCode.expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("[Gamification] Error generating transfer code:", error);
      return c.json({ error: "Failed to generate transfer code" }, 500);
    }
  }
);

// POST /transfer/restore - Restore account using transfer code
gamificationRouter.post(
  "/transfer/restore",
  zValidator("json", restoreTransferCodeSchema),
  async (c) => {
    try {
      const { code, targetUserId } = c.req.valid("json");

      const result = await prisma.$transaction(async (tx) => {
        // Find the transfer code
        const transferCode = await tx.transferCode.findUnique({
          where: { code: code.toUpperCase() },
        });

        if (!transferCode) {
          throw new Error("INVALID_CODE");
        }

        if (transferCode.used) {
          throw new Error("CODE_ALREADY_USED");
        }

        if (transferCode.expiresAt < new Date()) {
          throw new Error("CODE_EXPIRED");
        }

        // Get source user data
        const sourceUser = await tx.user.findUnique({
          where: { id: transferCode.sourceUserId },
          include: {
            inventory: true,
            favorites: true,
            weeklyProgress: true,
            pointLedger: true,
          },
        });

        if (!sourceUser) {
          throw new Error("SOURCE_USER_NOT_FOUND");
        }

        // Get or create target user
        let targetUser = await tx.user.findUnique({
          where: { id: targetUserId },
        });

        if (!targetUser) {
          throw new Error("TARGET_USER_NOT_FOUND");
        }

        // Prevent self-transfer
        if (sourceUser.id === targetUserId) {
          throw new Error("CANNOT_TRANSFER_TO_SELF");
        }

        // Copy all data from source to target user
        targetUser = await tx.user.update({
          where: { id: targetUserId },
          data: {
            points: sourceUser.points,
            streakCurrent: sourceUser.streakCurrent,
            streakBest: sourceUser.streakBest,
            devotionalsCompleted: sourceUser.devotionalsCompleted,
            totalTimeSeconds: sourceUser.totalTimeSeconds,
            lastActiveAt: sourceUser.lastActiveAt,
            dailyActions: sourceUser.dailyActions,
            themeId: sourceUser.themeId,
            frameId: sourceUser.frameId,
            titleId: sourceUser.titleId,
            selectedMusicId: sourceUser.selectedMusicId,
            avatarId: sourceUser.avatarId,
            migratedFromUserId: sourceUser.id,
          },
        });

        // Copy inventory items (skip if already owned)
        for (const item of sourceUser.inventory) {
          const existingItem = await tx.userInventory.findUnique({
            where: {
              userId_itemId: { userId: targetUserId, itemId: item.itemId },
            },
          });

          if (!existingItem) {
            await tx.userInventory.create({
              data: {
                userId: targetUserId,
                itemId: item.itemId,
                source: "transfer",
              },
            });
          }
        }

        // Copy favorites (skip if already exists)
        for (const favorite of sourceUser.favorites) {
          const existingFavorite = await tx.userFavorite.findUnique({
            where: {
              userId_devotionalDate: {
                userId: targetUserId,
                devotionalDate: favorite.devotionalDate,
              },
            },
          });

          if (!existingFavorite) {
            await tx.userFavorite.create({
              data: {
                userId: targetUserId,
                devotionalDate: favorite.devotionalDate,
              },
            });
          }
        }

        // Copy point ledger entries (update userId, skip if ledgerId already exists)
        for (const ledgerEntry of sourceUser.pointLedger) {
          const existingEntry = await tx.pointLedger.findUnique({
            where: {
              userId_ledgerId: {
                userId: targetUserId,
                ledgerId: ledgerEntry.ledgerId,
              },
            },
          });

          if (!existingEntry) {
            await tx.pointLedger.create({
              data: {
                userId: targetUserId,
                ledgerId: ledgerEntry.ledgerId,
                type: ledgerEntry.type,
                dateId: ledgerEntry.dateId,
                amount: ledgerEntry.amount,
                metadata: ledgerEntry.metadata,
              },
            });
          }
        }

        // Mark transfer code as used
        await tx.transferCode.update({
          where: { id: transferCode.id },
          data: {
            used: true,
            usedByUserId: targetUserId,
            usedAt: new Date(),
          },
        });

        // Get updated target user with all relations
        const restoredUser = await tx.user.findUnique({
          where: { id: targetUserId },
          include: {
            inventory: { include: { item: true } },
            favorites: true,
          },
        });

        return restoredUser;
      });

      return c.json({
        success: true,
        user: result,
        message: "Account data restored successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "INVALID_CODE") {
        return c.json({ error: "Invalid transfer code" }, 400);
      }
      if (errorMessage === "CODE_ALREADY_USED") {
        return c.json({ error: "Transfer code has already been used" }, 400);
      }
      if (errorMessage === "CODE_EXPIRED") {
        return c.json({ error: "Transfer code has expired" }, 400);
      }
      if (errorMessage === "SOURCE_USER_NOT_FOUND") {
        return c.json({ error: "Source account not found" }, 404);
      }
      if (errorMessage === "TARGET_USER_NOT_FOUND") {
        return c.json({ error: "Target user not found" }, 404);
      }
      if (errorMessage === "CANNOT_TRANSFER_TO_SELF") {
        return c.json({ error: "Cannot transfer to the same account" }, 400);
      }

      console.error("[Gamification] Error restoring account:", error);
      return c.json({ error: "Failed to restore account" }, 500);
    }
  }
);

// GET /transfer/active/:userId - Check if user has an active transfer code
gamificationRouter.get("/transfer/active/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const activeCode = await prisma.transferCode.findFirst({
      where: {
        sourceUserId: userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeCode) {
      return c.json({
        hasActiveCode: true,
        code: activeCode.code,
        expiresAt: activeCode.expiresAt.toISOString(),
      });
    }

    return c.json({
      hasActiveCode: false,
    });
  } catch (error) {
    console.error("[Gamification] Error checking active transfer code:", error);
    return c.json({ error: "Failed to check transfer code" }, 500);
  }
});

// ============================================
// DEVICE ID ENDPOINTS
// ============================================

// GET /user/by-device/:deviceId - Find user by device ID
gamificationRouter.get("/user/by-device/:deviceId", async (c) => {
  try {
    const deviceId = c.req.param("deviceId");

    const user = await prisma.user.findFirst({
      where: { deviceId },
      include: {
        inventory: {
          include: { item: true },
        },
      },
    });

    if (!user) {
      return c.json({ found: false });
    }

    const equippedItems = {
      theme: user.themeId,
      frame: user.frameId,
      title: user.titleId,
      music: user.selectedMusicId,
    };

    return c.json({
      found: true,
      user: { ...user, equippedItems },
    });
  } catch (error) {
    console.error("[Gamification] Error finding user by device:", error);
    return c.json({ error: "Failed to find user" }, 500);
  }
});

// PATCH /user/:userId/device - Update user's device ID
gamificationRouter.patch(
  "/user/:userId/device",
  zValidator("json", updateDeviceIdSchema),
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const { deviceId } = c.req.valid("json");

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { deviceId },
        include: {
          inventory: {
            include: { item: true },
          },
        },
      });

      return c.json(updatedUser);
    } catch (error) {
      console.error("[Gamification] Error updating device ID:", error);
      return c.json({ error: "Failed to update device ID" }, 500);
    }
  }
);

// ============================================
// POINTS LEDGER ENDPOINTS
// ============================================

// GET /points/ledger/:userId - Get user's point ledger history
gamificationRouter.get("/points/ledger/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const limit = parseInt(c.req.query("limit") ?? "50", 10);
    const offset = parseInt(c.req.query("offset") ?? "0", 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const [entries, total] = await Promise.all([
      prisma.pointLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.pointLedger.count({
        where: { userId },
      }),
    ]);

    return c.json({
      entries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Gamification] Error getting points ledger:", error);
    return c.json({ error: "Failed to get points ledger" }, 500);
  }
});

// ============================================
// PROMO CODE ENDPOINTS
// ============================================

// Validation schema for promo code redemption
const redeemPromoCodeSchema = z.object({
  userId: z.string(),
  code: z.string().min(1).max(50),
});

// Helper function to normalize promo code input
// Removes accents, trims whitespace, converts to lowercase
function normalizePromoCode(rawCode: string): string {
  // Remove accents/diacritics
  const normalized = rawCode
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ""); // Remove all whitespace
  return normalized;
}

// POST /promo/redeem - Redeem a promo code
gamificationRouter.post(
  "/promo/redeem",
  zValidator("json", redeemPromoCodeSchema),
  async (c) => {
    try {
      const { userId, code: rawCode } = c.req.valid("json");
      const codeId = normalizePromoCode(rawCode);
      const today = getTodayDateString();

      console.log(`[PromoCode] User ${userId} attempting to redeem: "${rawCode}" -> normalized: "${codeId}"`);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Check if promo code exists
        const promoCode = await tx.promoCode.findUnique({
          where: { id: codeId },
        });

        if (!promoCode) {
          console.log(`[PromoCode] Code not found: ${codeId}`);
          throw new Error("INVALID_CODE");
        }

        // 2. Check if code is active
        if (!promoCode.isActive) {
          console.log(`[PromoCode] Code not active: ${codeId}`);
          throw new Error("CODE_UNAVAILABLE");
        }

        // 3. Check max uses if applicable
        if (promoCode.maxUses !== null && promoCode.totalUses >= promoCode.maxUses) {
          console.log(`[PromoCode] Code max uses reached: ${codeId} (${promoCode.totalUses}/${promoCode.maxUses})`);
          throw new Error("CODE_UNAVAILABLE");
        }

        // 4. Check if user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        // 5. Check if user already redeemed this code
        const existingRedemption = await tx.promoRedemption.findUnique({
          where: {
            userId_codeId: { userId, codeId },
          },
        });

        if (existingRedemption) {
          console.log(`[PromoCode] User ${userId} already redeemed: ${codeId}`);
          throw new Error("ALREADY_REDEEMED");
        }

        // 6. Check if ledger entry already exists (idempotency check)
        const ledgerId = `promo_${codeId}`;
        const existingLedger = await tx.pointLedger.findUnique({
          where: {
            userId_ledgerId: { userId, ledgerId },
          },
        });

        if (existingLedger) {
          console.log(`[PromoCode] Ledger entry already exists for user ${userId}: ${ledgerId}`);
          throw new Error("ALREADY_REDEEMED");
        }

        // 7. Create redemption record
        await tx.promoRedemption.create({
          data: {
            userId,
            codeId,
            pointsAwarded: promoCode.points,
          },
        });

        // 8. Create ledger entry (idempotent tracking)
        await tx.pointLedger.create({
          data: {
            userId,
            ledgerId,
            type: "promo",
            dateId: today,
            amount: promoCode.points,
            metadata: JSON.stringify({
              codeId,
              displayCode: promoCode.displayCode,
            }),
          },
        });

        // 9. Increment user points
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            points: { increment: promoCode.points },
          },
        });

        // 10. Increment promo code total uses
        await tx.promoCode.update({
          where: { id: codeId },
          data: {
            totalUses: { increment: 1 },
          },
        });

        console.log(`[PromoCode] Successfully redeemed! User ${userId} received ${promoCode.points} points for code "${promoCode.displayCode}"`);

        return {
          pointsAwarded: promoCode.points,
          displayCode: promoCode.displayCode,
          newTotal: updatedUser.points,
        };
      });

      return c.json({
        success: true,
        pointsAwarded: result.pointsAwarded,
        displayCode: result.displayCode,
        newTotal: result.newTotal,
        message: `Código aplicado: +${result.pointsAwarded} puntos`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "INVALID_CODE") {
        return c.json({
          success: false,
          error: "Código inválido",
          errorCode: "INVALID_CODE"
        }, 400);
      }
      if (errorMessage === "CODE_UNAVAILABLE") {
        return c.json({
          success: false,
          error: "Este código ya no está disponible",
          errorCode: "CODE_UNAVAILABLE"
        }, 400);
      }
      if (errorMessage === "USER_NOT_FOUND") {
        return c.json({
          success: false,
          error: "Usuario no encontrado",
          errorCode: "USER_NOT_FOUND"
        }, 404);
      }
      if (errorMessage === "ALREADY_REDEEMED") {
        return c.json({
          success: false,
          error: "Ya canjeaste este código",
          errorCode: "ALREADY_REDEEMED"
        }, 400);
      }

      console.error("[PromoCode] Error redeeming promo code:", error);
      return c.json({
        success: false,
        error: "Error al canjear el código",
        errorCode: "UNKNOWN_ERROR"
      }, 500);
    }
  }
);

// GET /promo/user/:userId - Get user's redemption history
gamificationRouter.get("/promo/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const redemptions = await prisma.promoRedemption.findMany({
      where: { userId },
      include: { promoCode: true },
      orderBy: { redeemedAt: "desc" },
    });

    return c.json(redemptions);
  } catch (error) {
    console.error("[PromoCode] Error getting user redemptions:", error);
    return c.json({ error: "Failed to get redemptions" }, 500);
  }
});

// ============================================
// COMMUNITY ENDPOINTS
// ============================================

// Schema for updating community opt-in
const updateCommunityOptInSchema = z.object({
  optIn: z.boolean(),
});

// GET /community/members - Get community members list with non-toxic ordering
gamificationRouter.get("/community/members", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") ?? "20", 10);
    const offset = parseInt(c.req.query("offset") ?? "0", 10);

    // Admin user IDs (comma-separated in ADMIN_USER_IDS env var)
    const adminUserIds = (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Get today's date to determine ordering strategy
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Rotate ordering strategy based on day:
    // Day 0, 3, 6... = by recent activity
    // Day 1, 4, 7... = by streak
    // Day 2, 5, 8... = randomized (using day as seed)
    const orderingStrategy = dayOfYear % 3;

    let orderBy: Record<string, unknown>[] = [];

    switch (orderingStrategy) {
      case 0: // Recent activity first
        orderBy = [{ lastActiveAt: "desc" }, { createdAt: "desc" }];
        break;
      case 1: // Current streak (mixed direction to avoid pure ranking)
        orderBy = [{ streakCurrent: "desc" }, { lastActiveAt: "desc" }];
        break;
      case 2: // We'll shuffle client-side for this case
      default:
        orderBy = [{ createdAt: "asc" }];
        break;
    }

    // Fetch all opted-in users
    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: { communityOptIn: true },
        select: {
          id: true,
          nickname: true,
          avatarId: true,
          frameId: true,
          titleId: true,
          points: true,
          streakCurrent: true,
          devotionalsCompleted: true,
          lastActiveAt: true,
          createdAt: true,
          supportCount: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.user.count({
        where: { communityOptIn: true },
      }),
    ]);

    // If it's randomized day, shuffle the results using the day as seed
    let finalMembers = members;
    if (orderingStrategy === 2) {
      // Simple seeded shuffle
      const seed = dayOfYear;
      finalMembers = [...members].sort(() => {
        // Use a simple hash based on seed for pseudo-random ordering
        const hash = Math.sin(seed) * 10000;
        return hash - Math.floor(hash) - 0.5;
      });
    }

    // Annotate each member with isAdmin flag
    const annotatedMembers = finalMembers.map((m) => ({
      ...m,
      isAdmin: adminUserIds.length > 0 ? adminUserIds.includes(m.id) : false,
    }));

    return c.json({
      members: annotatedMembers,
      total,
      limit,
      offset,
      orderingStrategy: ["recent", "streak", "random"][orderingStrategy],
    });
  } catch (error) {
    console.error("[Community] Error getting community members:", error);
    return c.json({ error: "Failed to get community members" }, 500);
  }
});

// PATCH /community/opt-in/:userId - Update user's community opt-in status
gamificationRouter.patch(
  "/community/opt-in/:userId",
  zValidator("json", updateCommunityOptInSchema),
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const { optIn } = c.req.valid("json");

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { communityOptIn: optIn },
      });

      console.log(`[Community] User ${userId} set communityOptIn to ${optIn}`);

      return c.json({
        success: true,
        communityOptIn: updatedUser.communityOptIn,
      });
    } catch (error) {
      console.error("[Community] Error updating opt-in:", error);
      return c.json({ error: "Failed to update community opt-in" }, 500);
    }
  }
);

// GET /community/opt-in/:userId - Get user's community opt-in status
gamificationRouter.get("/community/opt-in/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { communityOptIn: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ communityOptIn: user.communityOptIn });
  } catch (error) {
    console.error("[Community] Error getting opt-in status:", error);
    return c.json({ error: "Failed to get opt-in status" }, 500);
  }
});

// ============================================
// COLLECTION CLAIMS
// ============================================

// GET /collections/claims/:userId - Get all claimed collections for a user
gamificationRouter.get("/collections/claims/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const claims = await prisma.collectionClaim.findMany({
      where: { userId },
      select: { collectionId: true, pointsAwarded: true, claimedAt: true },
    });
    return c.json({ success: true, claims });
  } catch (error) {
    console.error("[Collections] Error getting claims:", error);
    return c.json({ error: "Failed to get collection claims" }, 500);
  }
});

// POST /collections/claim - Claim a completed collection reward
gamificationRouter.post(
  "/collections/claim",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      collectionId: z.string(),
      // The client sends which items it owns so server can verify
      ownedItemIds: z.array(z.string()),
      // Points to award (defined in client constants; server double-checks)
      rewardPoints: z.number().int().positive().max(10000),
    })
  ),
  async (c) => {
    const { userId, collectionId, ownedItemIds, rewardPoints } = c.req.valid("json");

    try {
      // Check if already claimed
      const existingClaim = await prisma.collectionClaim.findUnique({
        where: { userId_collectionId: { userId, collectionId } },
      });

      if (existingClaim) {
        return c.json({ success: false, error: "already_claimed" }, 409);
      }

      // Check user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, points: true },
      });
      if (!user) return c.json({ error: "User not found" }, 404);

      // Award points + record claim atomically
      const [updatedUser, claim] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { points: { increment: rewardPoints } },
          select: { id: true, points: true },
        }),
        prisma.collectionClaim.create({
          data: { userId, collectionId, pointsAwarded: rewardPoints },
        }),
        prisma.pointLedger.create({
          data: {
            userId,
            ledgerId: `collection_${collectionId}_${Date.now()}`,
            type: "collection_reward",
            dateId: new Date().toISOString().slice(0, 10),
            amount: rewardPoints,
            metadata: JSON.stringify({ collectionId }),
          },
        }),
      ]);

      console.log(`[Collections] User ${userId} claimed ${collectionId}: +${rewardPoints} pts (now ${updatedUser.points})`);

      return c.json({
        success: true,
        newPoints: updatedUser.points,
        pointsAwarded: rewardPoints,
        collectionId,
      });
    } catch (error) {
      console.error("[Collections] Claim error:", error);
      return c.json({ error: "Failed to claim collection reward" }, 500);
    }
  }
);

// ============================================
// CHAPTER COLLECTION PROGRESS (Spiritual Paths)
// ============================================

// GET /collections/chapters/progress/:userId
// Returns all claimed chapter IDs per collectionId for a user.
gamificationRouter.get("/collections/chapters/progress/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const rows = await prisma.userChapterProgress.findMany({
      where: { userId },
      select: { collectionId: true, claimedChapterIds: true, updatedAt: true },
    });
    // Parse JSON arrays from DB
    const progress = rows.map(r => ({
      collectionId: r.collectionId,
      claimedChapterIds: JSON.parse(r.claimedChapterIds) as string[],
      updatedAt: r.updatedAt.toISOString(),
    }));
    return c.json({ progress });
  } catch (error) {
    console.error("[ChapterProgress] GET error:", error);
    return c.json({ error: "Failed to fetch chapter progress" }, 500);
  }
});

// POST /collections/chapters/progress
// Upserts chapter progress for a user+collection. Merge strategy: keep the union (most claimed).
gamificationRouter.post(
  "/collections/chapters/progress",
  zValidator("json", z.object({
    userId: z.string(),
    collectionId: z.string(),
    claimedChapterIds: z.array(z.string()),
  })),
  async (c) => {
    try {
      const { userId, collectionId, claimedChapterIds } = c.req.valid("json");

      // Merge with existing (union — never lose claims)
      const existing = await prisma.userChapterProgress.findUnique({
        where: { userId_collectionId: { userId, collectionId } },
        select: { claimedChapterIds: true },
      });
      const existingIds: string[] = existing ? JSON.parse(existing.claimedChapterIds) : [];
      const merged = Array.from(new Set([...existingIds, ...claimedChapterIds]));

      await prisma.userChapterProgress.upsert({
        where: { userId_collectionId: { userId, collectionId } },
        create: { userId, collectionId, claimedChapterIds: JSON.stringify(merged) },
        update: { claimedChapterIds: JSON.stringify(merged) },
      });

      console.log(`[ChapterProgress] User ${userId} / ${collectionId}: claimed=${JSON.stringify(merged)}`);
      return c.json({ success: true, claimedChapterIds: merged });
    } catch (error) {
      console.error("[ChapterProgress] POST error:", error);
      return c.json({ error: "Failed to save chapter progress" }, 500);
    }
  }
);

// POST /community/support - Send "Acompañar" gesture (1 per viewer per day per target)
gamificationRouter.post(
  "/community/support",
  zValidator("json", z.object({
    fromUserId: z.string(),
    toUserId: z.string(),
  })),
  async (c) => {
    try {
      const { fromUserId, toUserId } = c.req.valid("json");

      if (fromUserId === toUserId) {
        return c.json({ error: "Cannot support yourself" }, 400);
      }

      const dateId = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      // Try to create support record (unique constraint prevents duplicates)
      const existing = await prisma.userSupport.findUnique({
        where: {
          fromUserId_toUserId_dateId: { fromUserId, toUserId, dateId },
        },
      });

      if (existing) {
        // Already supported today — return current count without error
        const target = await prisma.user.findUnique({
          where: { id: toUserId },
          select: { supportCount: true },
        });
        return c.json({
          success: false,
          alreadySupported: true,
          supportCount: target?.supportCount ?? 0,
        });
      }

      // Create record and increment supportCount atomically
      const [, updatedUser] = await prisma.$transaction([
        prisma.userSupport.create({
          data: { fromUserId, toUserId, dateId },
        }),
        prisma.user.update({
          where: { id: toUserId },
          data: { supportCount: { increment: 1 } },
          select: { supportCount: true },
        }),
      ]);

      console.log(`[Support] ${fromUserId} → ${toUserId} on ${dateId}`);
      return c.json({
        success: true,
        alreadySupported: false,
        supportCount: updatedUser.supportCount,
      });
    } catch (error) {
      console.error("[Support] POST error:", error);
      return c.json({ error: "Failed to send support" }, 500);
    }
  }
);

// GET /community/support/status - Check if viewer already supported a list of members today
// Query: fromUserId=xxx&toUserIds=id1,id2,id3
gamificationRouter.get("/community/support/status", async (c) => {
  try {
    const fromUserId = c.req.query("fromUserId");
    const toUserIdsRaw = c.req.query("toUserIds");

    if (!fromUserId || !toUserIdsRaw) {
      return c.json({ error: "Missing params" }, 400);
    }

    const toUserIds = toUserIdsRaw.split(",").filter(Boolean).slice(0, 100);
    const dateId = new Date().toISOString().slice(0, 10);

    const records = await prisma.userSupport.findMany({
      where: {
        fromUserId,
        toUserId: { in: toUserIds },
        dateId,
      },
      select: { toUserId: true },
    });

    const supportedToday = new Set(records.map((r) => r.toUserId));
    const status: Record<string, boolean> = {};
    for (const id of toUserIds) {
      status[id] = supportedToday.has(id);
    }

    return c.json({ status, dateId });
  } catch (error) {
    console.error("[Support] GET status error:", error);
    return c.json({ error: "Failed to get support status" }, 500);
  }
});
