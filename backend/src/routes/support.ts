import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { getLatestSnapshotForUser } from "../streak-snapshot-service";

const supportRouter = new Hono();

const createTicketSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["streak_missing", "devotional_not_counted"]),
  claimedStreak: z.number().int().min(0),
  claimedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

supportRouter.post(
  "/ticket",
  zValidator("json", createTicketSchema),
  async (c) => {
    const { userId, type, claimedStreak, claimedDate } = c.req.valid("json");

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, streakCurrent: true, devotionalsCompleted: true },
    });

    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    // Look for most recent snapshot (yesterday or day before)
    const snapshot = await getLatestSnapshotForUser(userId);

    const beforeState = JSON.stringify({
      streakCurrent: user.streakCurrent,
      devotionalsCompleted: user.devotionalsCompleted,
    });

    let status: "open" | "auto_fixed" | "needs_human" = "open";
    let resolutionNote: string | null = null;
    let afterState = beforeState;

    if (!snapshot) {
      // No snapshot available — escalate
      status = "needs_human";
      resolutionNote = "No snapshot available for verification. Manual review required.";
      console.warn(`[Support] Ticket for user ${userId}: no snapshot found. Escalating.`);
    } else {
      const snapshotStreak = snapshot.streak;
      const diff = Math.abs(snapshotStreak - claimedStreak);

      if (snapshotStreak >= 1 && diff <= 1) {
        // Auto-fix: adjust streak to claimedStreak, never decrease
        const newStreak = Math.max(claimedStreak, user.streakCurrent);

        await prisma.user.update({
          where: { id: userId },
          data: {
            streakCurrent: newStreak,
            ...(newStreak > user.streakCurrent
              ? {}
              : {}),
          },
        });

        afterState = JSON.stringify({
          streakCurrent: newStreak,
          devotionalsCompleted: user.devotionalsCompleted,
        });

        status = "auto_fixed";
        resolutionNote = `Auto-fixed using snapshot from ${snapshot.snapshotDate}. Snapshot streak: ${snapshotStreak}, claimed: ${claimedStreak}, applied: ${newStreak}.`;
        console.log(`[Support] Auto-fixed ticket for user ${userId}: streak ${user.streakCurrent} → ${newStreak}`);
      } else {
        // Difference too large or snapshot too low — escalate
        status = "needs_human";
        resolutionNote = `Snapshot streak (${snapshotStreak}) vs claimed (${claimedStreak}) diff=${diff}. Needs manual review.`;
        console.warn(`[Support] Ticket for user ${userId}: diff too large (snapshot=${snapshotStreak}, claimed=${claimedStreak}). Escalating.`);
      }
    }

    // Create the ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        type,
        claimedStreak,
        claimedDate,
        status,
        resolutionNote,
        beforeState,
        afterState,
      },
    });

    return c.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        resolutionNote: ticket.resolutionNote,
        autoFixed: ticket.status === "auto_fixed",
      },
    });
  }
);

// GET /api/support/tickets/:userId - get all tickets for a user
supportRouter.get("/tickets/:userId", async (c) => {
  const userId = c.req.param("userId");
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return c.json({ tickets });
});

// GET /api/support/admin/tickets - get all tickets (admin view)
supportRouter.get("/admin/tickets", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      type: true,
      claimedStreak: true,
      claimedDate: true,
      status: true,
      resolutionNote: true,
      beforeState: true,
      afterState: true,
      createdAt: true,
    },
  });
  return c.json({ tickets });
});

export { supportRouter };
