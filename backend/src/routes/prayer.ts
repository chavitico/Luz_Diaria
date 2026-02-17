import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

export const prayerRouter = new Hono();

// ============================================
// TYPES & CONSTANTS
// ============================================

// Prayer categories (must match frontend constants)
const PRAYER_CATEGORIES = [
  'work', 'health', 'family', 'peace', 'wisdom',
  'studies', 'restoration', 'gratitude', 'salvation', 'strength'
] as const;

type PrayerCategoryKey = typeof PRAYER_CATEGORIES[number];

// Points configuration
const PRAYER_POINTS = {
  SUBMIT_REQUEST: 10,    // Once per day max
  PRAYED_FOR_COMMUNITY: 5, // Once per day max
  VISIT_TAB: 5,          // Once per day max
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get today's date string in Costa Rica timezone (UTC-6)
function getCostaRicaDateString(): string {
  const now = new Date();
  // Costa Rica is UTC-6
  const costaRicaTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  return costaRicaTime.toISOString().split('T')[0]!;
}

// Get current ISO week number in Costa Rica timezone
function getCostaRicaWeekId(): string {
  const now = new Date();
  const costaRicaTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  const startOfYear = new Date(costaRicaTime.getFullYear(), 0, 1);
  const days = Math.floor((costaRicaTime.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${costaRicaTime.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Get expiration date for a prayer request
function getExpirationDate(mode: 'daily' | 'weekly'): Date {
  const now = new Date();
  const costaRicaTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));

  if (mode === 'daily') {
    // Expires at next 4:00 AM Costa Rica time
    const nextMorning = new Date(costaRicaTime);
    nextMorning.setDate(nextMorning.getDate() + 1);
    nextMorning.setHours(4, 0, 0, 0);
    // Convert back to UTC
    return new Date(nextMorning.getTime() + (6 * 60 * 60 * 1000));
  } else {
    // Expires next Monday at 4:00 AM Costa Rica time
    const nextMonday = new Date(costaRicaTime);
    const dayOfWeek = nextMonday.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(4, 0, 0, 0);
    // Convert back to UTC
    return new Date(nextMonday.getTime() + (6 * 60 * 60 * 1000));
  }
}

// Get period ID based on mode
function getPeriodId(mode: 'daily' | 'weekly'): string {
  if (mode === 'daily') {
    return getCostaRicaDateString();
  }
  return getCostaRicaWeekId();
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const submitPrayerRequestSchema = z.object({
  userId: z.string(),
  categoryKey: z.enum(PRAYER_CATEGORIES),
  mode: z.enum(['daily', 'weekly']),
});

const prayedForCommunitySchema = z.object({
  userId: z.string(),
});

const updatePrayerDisplayOptInSchema = z.object({
  optIn: z.boolean(),
});

// ============================================
// PRAYER REQUEST ENDPOINTS
// ============================================

// POST /request - Submit or update a prayer request
prayerRouter.post(
  "/request",
  zValidator("json", submitPrayerRequestSchema),
  async (c) => {
    try {
      const { userId, categoryKey, mode } = c.req.valid("json");
      const periodId = getPeriodId(mode);
      const expiresAt = getExpirationDate(mode);
      const today = getCostaRicaDateString();

      const result = await prisma.$transaction(async (tx) => {
        // Get user data
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        // Upsert prayer request (one per user per period per mode)
        const prayerRequest = await tx.prayerRequest.upsert({
          where: {
            userId_periodId_mode: { userId, periodId, mode },
          },
          update: {
            categoryKey,
            expiresAt,
            nickname: user.prayerDisplayOptIn ? user.nickname : null,
            avatarId: user.avatarId,
            frameId: user.frameId,
            titleId: user.titleId,
            displayNameOptIn: user.prayerDisplayOptIn,
            updatedAt: new Date(),
          },
          create: {
            userId,
            periodId,
            mode,
            categoryKey,
            expiresAt,
            nickname: user.prayerDisplayOptIn ? user.nickname : null,
            avatarId: user.avatarId,
            frameId: user.frameId,
            titleId: user.titleId,
            displayNameOptIn: user.prayerDisplayOptIn,
          },
        });

        // Award points for submitting (once per day max)
        const ledgerId = `prayer_request_${today}`;
        const existingLedger = await tx.pointLedger.findUnique({
          where: {
            userId_ledgerId: { userId, ledgerId },
          },
        });

        let pointsAwarded = 0;
        if (!existingLedger) {
          await tx.pointLedger.create({
            data: {
              userId,
              ledgerId,
              type: "prayer_request",
              dateId: today,
              amount: PRAYER_POINTS.SUBMIT_REQUEST,
              metadata: JSON.stringify({ categoryKey, mode, periodId }),
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: { points: { increment: PRAYER_POINTS.SUBMIT_REQUEST } },
          });

          pointsAwarded = PRAYER_POINTS.SUBMIT_REQUEST;
        }

        return { prayerRequest, pointsAwarded };
      });

      return c.json({
        success: true,
        prayerRequest: result.prayerRequest,
        pointsAwarded: result.pointsAwarded,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "USER_NOT_FOUND") {
        return c.json({ error: "User not found" }, 404);
      }

      console.error("[Prayer] Error submitting prayer request:", error);
      return c.json({ error: "Failed to submit prayer request" }, 500);
    }
  }
);

// GET /request/:userId - Get user's active prayer requests
prayerRouter.get("/request/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const now = new Date();

    const requests = await prisma.prayerRequest.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ requests });
  } catch (error) {
    console.error("[Prayer] Error getting user prayer requests:", error);
    return c.json({ error: "Failed to get prayer requests" }, 500);
  }
});

// DELETE /request/:userId/:mode - Delete user's prayer request for current period
prayerRouter.delete("/request/:userId/:mode", async (c) => {
  try {
    const userId = c.req.param("userId");
    const mode = c.req.param("mode") as 'daily' | 'weekly';
    const periodId = getPeriodId(mode);

    await prisma.prayerRequest.deleteMany({
      where: { userId, periodId, mode },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("[Prayer] Error deleting prayer request:", error);
    return c.json({ error: "Failed to delete prayer request" }, 500);
  }
});

// ============================================
// COMMUNITY PRAYER REQUESTS ENDPOINTS
// ============================================

// GET /community - Get all active prayer requests for the community
prayerRouter.get("/community", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") ?? "50", 10);
    const offset = parseInt(c.req.query("offset") ?? "0", 10);
    const now = new Date();

    const [requests, total] = await Promise.all([
      prisma.prayerRequest.findMany({
        where: {
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          categoryKey: true,
          mode: true,
          nickname: true,
          avatarId: true,
          frameId: true,
          titleId: true,
          displayNameOptIn: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      prisma.prayerRequest.count({
        where: {
          expiresAt: { gt: now },
        },
      }),
    ]);

    return c.json({
      requests,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Prayer] Error getting community prayer requests:", error);
    return c.json({ error: "Failed to get community prayer requests" }, 500);
  }
});

// GET /summary - Get aggregated category counts for active requests
prayerRouter.get("/summary", async (c) => {
  try {
    const now = new Date();

    const requests = await prisma.prayerRequest.findMany({
      where: {
        expiresAt: { gt: now },
      },
      select: {
        categoryKey: true,
      },
    });

    // Aggregate counts by category
    const summary: Record<string, number> = {};
    for (const request of requests) {
      summary[request.categoryKey] = (summary[request.categoryKey] ?? 0) + 1;
    }

    return c.json({ summary, total: requests.length });
  } catch (error) {
    console.error("[Prayer] Error getting prayer summary:", error);
    return c.json({ error: "Failed to get prayer summary" }, 500);
  }
});

// ============================================
// DAILY PRAYER ENDPOINTS
// ============================================

// GET /daily/:dateId - Get daily prayer for a specific date
prayerRouter.get("/daily/:dateId", async (c) => {
  try {
    const dateId = c.req.param("dateId");

    const dailyPrayer = await prisma.dailyPrayer.findUnique({
      where: { dateId },
    });

    if (!dailyPrayer) {
      return c.json({ error: "Daily prayer not found" }, 404);
    }

    return c.json({
      ...dailyPrayer,
      includedCategories: JSON.parse(dailyPrayer.includedCategories),
      categoryStats: JSON.parse(dailyPrayer.categoryStats),
    });
  } catch (error) {
    console.error("[Prayer] Error getting daily prayer:", error);
    return c.json({ error: "Failed to get daily prayer" }, 500);
  }
});

// GET /daily/today - Get today's daily prayer
prayerRouter.get("/daily/today", async (c) => {
  try {
    const today = getCostaRicaDateString();

    const dailyPrayer = await prisma.dailyPrayer.findUnique({
      where: { dateId: today },
    });

    if (!dailyPrayer) {
      return c.json({ error: "Today's prayer not found", dateId: today }, 404);
    }

    return c.json({
      ...dailyPrayer,
      includedCategories: JSON.parse(dailyPrayer.includedCategories),
      categoryStats: JSON.parse(dailyPrayer.categoryStats),
    });
  } catch (error) {
    console.error("[Prayer] Error getting today's prayer:", error);
    return c.json({ error: "Failed to get today's prayer" }, 500);
  }
});

// ============================================
// "I PRAYED FOR THE COMMUNITY" ENDPOINT
// ============================================

// POST /prayed-for-community - Award points for praying for the community
prayerRouter.post(
  "/prayed-for-community",
  zValidator("json", prayedForCommunitySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid("json");
      const today = getCostaRicaDateString();

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        // Check if already prayed today
        const ledgerId = `prayed_community_${today}`;
        const existingLedger = await tx.pointLedger.findUnique({
          where: {
            userId_ledgerId: { userId, ledgerId },
          },
        });

        if (existingLedger) {
          return { alreadyPrayed: true, pointsAwarded: 0 };
        }

        // Award points
        await tx.pointLedger.create({
          data: {
            userId,
            ledgerId,
            type: "prayed_community",
            dateId: today,
            amount: PRAYER_POINTS.PRAYED_FOR_COMMUNITY,
            metadata: JSON.stringify({}),
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { points: { increment: PRAYER_POINTS.PRAYED_FOR_COMMUNITY } },
        });

        return { alreadyPrayed: false, pointsAwarded: PRAYER_POINTS.PRAYED_FOR_COMMUNITY };
      });

      if (result.alreadyPrayed) {
        return c.json({
          success: false,
          alreadyPrayed: true,
          message: "Already prayed for the community today",
        });
      }

      return c.json({
        success: true,
        pointsAwarded: result.pointsAwarded,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage === "USER_NOT_FOUND") {
        return c.json({ error: "User not found" }, 404);
      }

      console.error("[Prayer] Error recording community prayer:", error);
      return c.json({ error: "Failed to record community prayer" }, 500);
    }
  }
);

// GET /prayed-for-community/:userId - Check if user prayed today
prayerRouter.get("/prayed-for-community/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const today = getCostaRicaDateString();

    const ledgerId = `prayed_community_${today}`;
    const existingLedger = await prisma.pointLedger.findUnique({
      where: {
        userId_ledgerId: { userId, ledgerId },
      },
    });

    return c.json({ prayedToday: !!existingLedger });
  } catch (error) {
    console.error("[Prayer] Error checking community prayer status:", error);
    return c.json({ error: "Failed to check status" }, 500);
  }
});

// ============================================
// PRAYER DISPLAY OPT-IN ENDPOINTS
// ============================================

// PATCH /display-opt-in/:userId - Update user's prayer display opt-in status
prayerRouter.patch(
  "/display-opt-in/:userId",
  zValidator("json", updatePrayerDisplayOptInSchema),
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
        data: { prayerDisplayOptIn: optIn },
      });

      console.log(`[Prayer] User ${userId} set prayerDisplayOptIn to ${optIn}`);

      return c.json({
        success: true,
        prayerDisplayOptIn: updatedUser.prayerDisplayOptIn,
      });
    } catch (error) {
      console.error("[Prayer] Error updating display opt-in:", error);
      return c.json({ error: "Failed to update prayer display opt-in" }, 500);
    }
  }
);

// GET /display-opt-in/:userId - Get user's prayer display opt-in status
prayerRouter.get("/display-opt-in/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { prayerDisplayOptIn: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ prayerDisplayOptIn: user.prayerDisplayOptIn });
  } catch (error) {
    console.error("[Prayer] Error getting display opt-in status:", error);
    return c.json({ error: "Failed to get display opt-in status" }, 500);
  }
});
