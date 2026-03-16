// Duel Route — Duelo de Sabiduría backend endpoints
// POST /api/duel/start   — create a new duel match
// POST /api/duel/complete — complete a match and award points

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

const duelRouter = new Hono();

const POINTS_WIN = 40;
const POINTS_LOSS = 10;

// ─── POST /api/duel/start ──────────────────────────────────────────────────────
// Creates a new duel match. For the initial version, always bot matches.
// Returns matchId so the client can track and later complete it.
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
      // Verify user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      const match = await prisma.duelMatch.create({
        data: {
          player1UserId: userId,
          player2UserId: isBotMatch ? "bot:juanito" : userId,
          status: "in_progress",
          questions: JSON.stringify(questionIds ?? []),
          isBotMatch: isBotMatch ?? true,
        },
      });

      return c.json({
        matchId: match.id,
        isBotMatch: match.isBotMatch,
        opponentName: match.isBotMatch ? "Juanito Bot" : null,
      });
    } catch (err) {
      console.error("[Duel] Error starting match:", err);
      return c.json({ error: "Failed to start match" }, 500);
    }
  }
);

// ─── POST /api/duel/complete ───────────────────────────────────────────────────
// Completes a match and awards points to the player.
// outcome: 'win' | 'loss' | 'draw'
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
      // Check match exists and belongs to the user
      const match = await prisma.duelMatch.findUnique({ where: { id: matchId } });
      if (!match) {
        return c.json({ error: "Match not found" }, 404);
      }
      if (match.status === "completed") {
        // Already completed — return existing result (idempotent)
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
        return c.json({
          success: true,
          alreadyCompleted: true,
          pointsAwarded: match.pointsAwarded,
          newTotal: user?.points ?? 0,
        });
      }

      // Calculate points
      const pointsAwarded = outcome === "win" ? POINTS_WIN : POINTS_LOSS;
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
          completedAt: new Date(),
        },
      });

      // Award points to the user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: pointsAwarded },
          pointsEarnedTotal: { increment: pointsAwarded },
        },
        select: { points: true },
      });

      // Add ledger entry for idempotency + audit trail
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
          dateId: new Date().toISOString().slice(0, 10),
          amount: pointsAwarded,
          metadata: JSON.stringify({ matchId, outcome }),
        },
        update: {}, // No-op if already exists
      });

      return c.json({
        success: true,
        pointsAwarded,
        newTotal: updatedUser.points,
        outcome,
      });
    } catch (err) {
      console.error("[Duel] Error completing match:", err);
      return c.json({ error: "Failed to complete match" }, 500);
    }
  }
);

// ─── GET /api/duel/stats/:userId ───────────────────────────────────────────────
// Returns basic duel stats for a user (wins, losses, total played)
duelRouter.get("/stats/:userId", async (c) => {
  const userId = c.req.param("userId");

  try {
    const [total, wins] = await Promise.all([
      prisma.duelMatch.count({
        where: { player1UserId: userId, status: "completed" },
      }),
      prisma.duelMatch.count({
        where: { player1UserId: userId, status: "completed", winnerUserId: userId },
      }),
    ]);

    return c.json({
      totalMatches: total,
      wins,
      losses: total - wins,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    });
  } catch (err) {
    console.error("[Duel] Error fetching stats:", err);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

export { duelRouter };
