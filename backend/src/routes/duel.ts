// Duel Route — Duelo de Sabiduría backend endpoints
// POST /api/duel/start    — create a new duel match, returns user ranking
// POST /api/duel/complete — complete a match, award points, update ranking
// GET  /api/duel/stats/:userId   — basic stats
// GET  /api/duel/ranking/:userId — full ranking data
// GET  /api/duel/online-count    — approximate online player count

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

const duelRouter = new Hono();

const POINTS_WIN = 40;
const POINTS_LOSS = 10;
const DAILY_REWARD_CAP = 10; // max fully-rewarded duels per day

/** ELO-style rating changes */
const RATING_WIN = 25;
const RATING_LOSS = 15;
const RATING_MIN = 500;

// ─── POST /api/duel/start ──────────────────────────────────────────────────────
duelRouter.post(
  "/start",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      questionIds: z.array(z.string()).optional(),
      isBotMatch: z.boolean().optional().default(true),
    })
  ),
  async (c) => {
    const { userId, questionIds, isBotMatch } = c.req.valid("json");

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          duelRating: true,
          duelWins: true,
          duelLosses: true,
          duelWinStreak: true,
          duelBestStreak: true,
          duelRewardCount: true,
          duelRewardDate: true,
        },
      });
      if (!user) return c.json({ error: "User not found" }, 404);

      const match = await prisma.duelMatch.create({
        data: {
          player1UserId: userId,
          player2UserId: isBotMatch ? "bot:juanito" : userId,
          status: "in_progress",
          questions: JSON.stringify(questionIds ?? []),
          isBotMatch: isBotMatch ?? true,
        },
      });

      // Calculate how many rewarded duels are left today
      const today = new Date().toISOString().slice(0, 10);
      const rewardCountToday =
        user.duelRewardDate === today ? user.duelRewardCount : 0;
      const rewardedDuelsLeft = Math.max(0, DAILY_REWARD_CAP - rewardCountToday);

      return c.json({
        matchId: match.id,
        isBotMatch: match.isBotMatch,
        opponentName: match.isBotMatch ? "Juanito Bot" : null,
        userRating: user.duelRating,
        duelWins: user.duelWins,
        duelLosses: user.duelLosses,
        duelWinStreak: user.duelWinStreak,
        rewardedDuelsLeft,
      });
    } catch (err) {
      console.error("[Duel] Error starting match:", err);
      return c.json({ error: "Failed to start match" }, 500);
    }
  }
);

// ─── POST /api/duel/complete ───────────────────────────────────────────────────
duelRouter.post(
  "/complete",
  zValidator(
    "json",
    z.object({
      matchId: z.string(),
      userId: z.string(),
      outcome: z.enum(["win", "loss", "draw"]),
      player1Score: z.number().int().min(0).optional().default(0),
      player2Score: z.number().int().min(0).optional().default(0),
    })
  ),
  async (c) => {
    const { matchId, userId, outcome, player1Score, player2Score } = c.req.valid("json");

    try {
      const match = await prisma.duelMatch.findUnique({ where: { id: matchId } });
      if (!match) return c.json({ error: "Match not found" }, 404);

      if (match.status === "completed") {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { points: true, duelRating: true, duelWins: true, duelLosses: true, duelWinStreak: true },
        });
        return c.json({
          success: true,
          alreadyCompleted: true,
          pointsAwarded: match.pointsAwarded,
          newTotal: user?.points ?? 0,
          capReached: false,
          rewardedDuelsLeft: 0,
          duelRating: user?.duelRating ?? 1000,
          duelWins: user?.duelWins ?? 0,
          duelLosses: user?.duelLosses ?? 0,
          duelWinStreak: user?.duelWinStreak ?? 0,
          ratingChange: match.ratingChange,
        });
      }

      // Fetch current user stats for ranking update
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          duelRating: true,
          duelWins: true,
          duelLosses: true,
          duelWinStreak: true,
          duelBestStreak: true,
          duelRewardCount: true,
          duelRewardDate: true,
        },
      });
      if (!user) return c.json({ error: "User not found" }, 404);

      // ── Daily reward cap ──────────────────────────────────────────────────
      const today = new Date().toISOString().slice(0, 10);
      const rewardCountToday =
        user.duelRewardDate === today ? user.duelRewardCount : 0;
      const capReached = rewardCountToday >= DAILY_REWARD_CAP;

      // Points: full if under cap, 0 after cap
      const pointsAwarded = capReached ? 0 : (outcome === "win" ? POINTS_WIN : POINTS_LOSS);

      // ── Rating update ─────────────────────────────────────────────────────
      const ratingChange = outcome === "win" ? RATING_WIN : -RATING_LOSS;
      const newRating = Math.max(RATING_MIN, user.duelRating + ratingChange);

      // ── Win/loss streak ───────────────────────────────────────────────────
      const newWins = outcome === "win" ? user.duelWins + 1 : user.duelWins;
      const newLosses = outcome === "loss" ? user.duelLosses + 1 : user.duelLosses;
      const newStreak = outcome === "win" ? user.duelWinStreak + 1 : 0;
      const newBestStreak = Math.max(user.duelBestStreak, newStreak);
      const newRewardCount = capReached ? rewardCountToday : rewardCountToday + 1;

      const winnerUserId = outcome === "win" ? userId : (match.isBotMatch ? "bot:juanito" : null);

      // Update match
      await prisma.duelMatch.update({
        where: { id: matchId },
        data: {
          status: "completed",
          player1Score,
          player2Score,
          winnerUserId,
          pointsAwarded,
          ratingChange,
          completedAt: new Date(),
        },
      });

      // Update user ranking + points
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: pointsAwarded },
          pointsEarnedTotal: { increment: pointsAwarded },
          duelRating: newRating,
          duelWins: newWins,
          duelLosses: newLosses,
          duelWinStreak: newStreak,
          duelBestStreak: newBestStreak,
          duelRewardCount: newRewardCount,
          duelRewardDate: today,
        },
        select: { points: true },
      });

      // Ledger entry (idempotent)
      await prisma.pointLedger.upsert({
        where: {
          userId_ledgerId: {
            userId,
            ledgerId: `duel_${matchId}`,
          },
        },
        create: {
          userId,
          ledgerId: `duel_${matchId}`,
          type: outcome === "win" ? "duel_win" : "duel_loss",
          dateId: today,
          amount: pointsAwarded,
          metadata: JSON.stringify({ matchId, outcome, capReached, ratingChange }),
        },
        update: {},
      });

      const rewardedDuelsLeft = Math.max(0, DAILY_REWARD_CAP - newRewardCount);

      return c.json({
        success: true,
        pointsAwarded,
        newTotal: updatedUser.points,
        outcome,
        capReached,
        rewardedDuelsLeft,
        duelRating: newRating,
        duelWins: newWins,
        duelLosses: newLosses,
        duelWinStreak: newStreak,
        ratingChange,
      });
    } catch (err) {
      console.error("[Duel] Error completing match:", err);
      return c.json({ error: "Failed to complete match" }, 500);
    }
  }
);

// ─── GET /api/duel/stats/:userId ───────────────────────────────────────────────
duelRouter.get("/stats/:userId", async (c) => {
  const userId = c.req.param("userId");

  try {
    const [total, wins, user] = await Promise.all([
      prisma.duelMatch.count({
        where: { player1UserId: userId, status: "completed" },
      }),
      prisma.duelMatch.count({
        where: { player1UserId: userId, status: "completed", winnerUserId: userId },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          duelRating: true,
          duelWins: true,
          duelLosses: true,
          duelWinStreak: true,
          duelBestStreak: true,
        },
      }),
    ]);

    return c.json({
      totalMatches: total,
      wins,
      losses: total - wins,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      duelRating: user?.duelRating ?? 1000,
      duelWinStreak: user?.duelWinStreak ?? 0,
      duelBestStreak: user?.duelBestStreak ?? 0,
    });
  } catch (err) {
    console.error("[Duel] Error fetching stats:", err);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ─── GET /api/duel/ranking/:userId ─────────────────────────────────────────────
duelRouter.get("/ranking/:userId", async (c) => {
  const userId = c.req.param("userId");

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        duelRating: true,
        duelWins: true,
        duelLosses: true,
        duelWinStreak: true,
        duelBestStreak: true,
        duelRewardCount: true,
        duelRewardDate: true,
        nickname: true,
      },
    });
    if (!user) return c.json({ error: "User not found" }, 404);

    const today = new Date().toISOString().slice(0, 10);
    const rewardCountToday = user.duelRewardDate === today ? user.duelRewardCount : 0;
    const rewardedDuelsLeft = Math.max(0, DAILY_REWARD_CAP - rewardCountToday);

    // Rank by duelRating (higher = better rank)
    const rank = await prisma.user.count({
      where: { duelRating: { gt: user.duelRating } },
    });

    return c.json({
      duelRating: user.duelRating,
      duelWins: user.duelWins,
      duelLosses: user.duelLosses,
      duelWinStreak: user.duelWinStreak,
      duelBestStreak: user.duelBestStreak,
      rewardedDuelsLeft,
      globalRank: rank + 1, // 1-indexed
    });
  } catch (err) {
    console.error("[Duel] Error fetching ranking:", err);
    return c.json({ error: "Failed to fetch ranking" }, 500);
  }
});

// ─── GET /api/duel/online-count ────────────────────────────────────────────────
// Returns the number of users active in the last 5 minutes.
// Used by the Home duel card to show live player count.
duelRouter.get("/online-count", async (c) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await prisma.user.count({
      where: {
        lastActiveAt: { gte: fiveMinutesAgo },
      },
    });

    // Return at least 1 (the current user) to avoid "0 jugadores"
    return c.json({ count: Math.max(1, count) });
  } catch (err) {
    console.error("[Duel] Error fetching online count:", err);
    return c.json({ count: 1 });
  }
});

export { duelRouter };
