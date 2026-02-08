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
});

const syncUserSchema = z.object({
  points: z.number().int().nonnegative().optional(),
  streakCurrent: z.number().int().nonnegative().optional(),
  streakBest: z.number().int().nonnegative().optional(),
  devotionalsCompleted: z.number().int().nonnegative().optional(),
  totalTimeSeconds: z.number().int().nonnegative().optional(),
  lastActiveAt: z.string().datetime().optional(),
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
  type: z.enum(['theme', 'frame', 'title', 'music']),
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

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// POST /user/register - Register new user with unique nickname
gamificationRouter.post(
  "/user/register",
  zValidator("json", registerUserSchema),
  async (c) => {
    try {
      const { nickname, avatarId } = c.req.valid("json");
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
        return c.json({ error: "User not found" }, 404);
      }

      const updateData: Record<string, unknown> = {};

      if (data.points !== undefined) updateData.points = data.points;
      if (data.streakCurrent !== undefined) updateData.streakCurrent = data.streakCurrent;
      if (data.streakBest !== undefined) updateData.streakBest = data.streakBest;
      if (data.devotionalsCompleted !== undefined) updateData.devotionalsCompleted = data.devotionalsCompleted;
      if (data.totalTimeSeconds !== undefined) updateData.totalTimeSeconds = data.totalTimeSeconds;
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

// POST /points/award - Award points with daily cap checking
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
          dailyActions.shareCount = currentCount + 1;
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
          // Check if this specific devotional was already completed
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

      const newTotal = user.points + pointsAwarded;

      await prisma.user.update({
        where: { id: userId },
        data: {
          points: newTotal,
          dailyActions: JSON.stringify(dailyActions),
        },
      });

      return c.json({
        success: true,
        pointsAwarded,
        newTotal,
        message,
      });
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
