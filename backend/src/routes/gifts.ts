import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireRole } from "../middleware/rbac";

export const giftsRouter = new Hono();

// ============================================
// SCHEMAS
// ============================================

const pendingGiftSchema = z.object({
  userId: z.string(),
});

const claimGiftSchema = z.object({
  userId: z.string(),
  giftDropId: z.string(),
});

const createGiftDropSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  rewardType: z.enum(["CHEST", "THEME", "TITLE", "AVATAR", "ITEM"]),
  rewardId: z.string().min(1),
  audienceType: z.enum(["ALL_USERS", "USER_IDS"]),
  audienceUserIds: z.array(z.string()).optional().default([]),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(false),
});

const updateGiftDropSchema = z.object({
  isActive: z.boolean().optional(),
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
});

const publishGiftDropSchema = z.object({
  giftDropId: z.string(),
});

// ============================================
// USER ENDPOINTS
// ============================================

// GET /api/gifts/pending?userId=xxx - Get first pending gift for user
giftsRouter.get("/pending", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const userGift = await prisma.userGift.findFirst({
      where: {
        userId,
        status: "PENDING",
        giftDrop: {
          isActive: true,
        },
      },
      include: {
        giftDrop: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!userGift) {
      return c.json({ gift: null });
    }

    // Try to fetch the item name from StoreItem if rewardId is a store item ID
    let rewardItemName: string | null = null;
    const { rewardType, rewardId } = userGift.giftDrop;
    if (rewardType !== "CHEST") {
      try {
        const storeItem = await prisma.storeItem.findUnique({
          where: { id: rewardId },
          select: { nameEs: true, nameEn: true },
        });
        if (storeItem) {
          rewardItemName = `${storeItem.nameEs} / ${storeItem.nameEn}`;
        }
      } catch {
        // non-critical
      }
    }

    return c.json({
      gift: {
        userGiftId: userGift.id,
        giftDropId: userGift.giftDropId,
        title: userGift.giftDrop.title,
        message: userGift.giftDrop.message,
        rewardType: userGift.giftDrop.rewardType,
        rewardId: userGift.giftDrop.rewardId,
        rewardItemNameEs: rewardItemName ? rewardItemName.split(' / ')[0] : null,
        rewardItemNameEn: rewardItemName ? rewardItemName.split(' / ')[1] : null,
        createdAt: userGift.createdAt,
      },
    });
  } catch (error) {
    console.error("[Gifts] Error getting pending gift:", error);
    return c.json({ error: "Failed to get pending gift" }, 500);
  }
});

// POST /api/gifts/claim - Claim a gift
giftsRouter.post("/claim", zValidator("json", claimGiftSchema), async (c) => {
  try {
    const { userId, giftDropId } = c.req.valid("json");

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Find the pending UserGift
    const userGift = await prisma.userGift.findUnique({
      where: { userId_giftDropId: { userId, giftDropId } },
      include: { giftDrop: true },
    });

    if (!userGift) {
      return c.json({ error: "Gift not found" }, 404);
    }

    if (userGift.status !== "PENDING") {
      return c.json({ error: "Gift already claimed or dismissed" }, 400);
    }

    const { rewardType, rewardId } = userGift.giftDrop;

    // Apply reward based on type
    await prisma.$transaction(async (tx) => {
      // Mark as claimed
      await tx.userGift.update({
        where: { id: userGift.id },
        data: { status: "CLAIMED", claimedAt: new Date() },
      });

      if (rewardType === "CHEST") {
        const chestItem = await tx.storeItem.findUnique({ where: { id: rewardId } });
        if (chestItem) {
          await tx.userInventory.upsert({
            where: { userId_itemId: { userId, itemId: rewardId } },
            create: { userId, itemId: rewardId, source: "gift" },
            update: {},
          });
        } else {
          const pointsAmount = parseInt(rewardId, 10);
          if (!isNaN(pointsAmount) && pointsAmount > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { points: { increment: pointsAmount } },
            });
          }
        }
      } else {
        const item = await tx.storeItem.findUnique({ where: { id: rewardId } });
        if (item) {
          await tx.userInventory.upsert({
            where: { userId_itemId: { userId, itemId: rewardId } },
            create: { userId, itemId: rewardId, source: "gift" },
            update: {},
          });
        }
      }
    });

    return c.json({
      success: true,
      granted: { rewardType, rewardId },
    });
  } catch (error) {
    console.error("[Gifts] Error claiming gift:", error);
    return c.json({ error: "Failed to claim gift" }, 500);
  }
});

// ============================================
// ADMIN ENDPOINTS (OWNER only)
// ============================================

// GET /api/gifts/admin/list - List last 20 gift drops
giftsRouter.get("/admin/list", requireRole("OWNER"), async (c) => {
  try {
    const giftDrops = await prisma.giftDrop.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { userGifts: true },
        },
      },
    });

    const result = giftDrops.map((gd) => ({
      id: gd.id,
      title: gd.title,
      message: gd.message,
      rewardType: gd.rewardType,
      rewardId: gd.rewardId,
      audienceType: gd.audienceType,
      audienceUserIds: JSON.parse(gd.audienceUserIds || "[]"),
      startsAt: gd.startsAt,
      endsAt: gd.endsAt,
      isActive: gd.isActive,
      createdAt: gd.createdAt,
      totalRecipients: gd._count.userGifts,
    }));

    return c.json(result);
  } catch (error) {
    console.error("[Gifts] Error listing gift drops:", error);
    return c.json({ error: "Failed to list gift drops" }, 500);
  }
});

// POST /api/gifts/admin/create - Create a new GiftDrop (OWNER only)
giftsRouter.post("/admin/create", requireRole("OWNER"), zValidator("json", createGiftDropSchema), async (c) => {
  try {
    const data = c.req.valid("json");

    const giftDrop = await prisma.giftDrop.create({
      data: {
        title: data.title,
        message: data.message,
        rewardType: data.rewardType,
        rewardId: data.rewardId,
        audienceType: data.audienceType,
        audienceUserIds: JSON.stringify(data.audienceUserIds || []),
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        isActive: data.isActive ?? false,
      },
    });

    return c.json({ success: true, giftDrop });
  } catch (error) {
    console.error("[Gifts] Error creating gift drop:", error);
    return c.json({ error: "Failed to create gift drop" }, 500);
  }
});

// PATCH /api/gifts/admin/:id - Update gift drop (OWNER only)
giftsRouter.patch("/admin/:id", requireRole("OWNER"), zValidator("json", updateGiftDropSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const giftDrop = await prisma.giftDrop.update({
      where: { id },
      data: {
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.message ? { message: data.message } : {}),
      },
    });

    return c.json({ success: true, giftDrop });
  } catch (error) {
    console.error("[Gifts] Error updating gift drop:", error);
    return c.json({ error: "Failed to update gift drop" }, 500);
  }
});

// POST /api/gifts/admin/publish - Distribute UserGift records to recipients (OWNER only)
giftsRouter.post("/admin/publish", requireRole("OWNER"), zValidator("json", publishGiftDropSchema), async (c) => {
  try {
    const { giftDropId } = c.req.valid("json");

    const giftDrop = await prisma.giftDrop.findUnique({ where: { id: giftDropId } });
    if (!giftDrop) {
      return c.json({ error: "GiftDrop not found" }, 404);
    }

    let targetUserIds: string[] = [];

    if (giftDrop.audienceType === "ALL_USERS") {
      const users = await prisma.user.findMany({ select: { id: true } });
      targetUserIds = users.map((u) => u.id);
    } else {
      targetUserIds = JSON.parse(giftDrop.audienceUserIds || "[]");
    }

    if (targetUserIds.length === 0) {
      return c.json({ success: true, created: 0, message: "No recipients found" });
    }

    let created = 0;
    for (const userId of targetUserIds) {
      const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!userExists) continue;

      const existing = await prisma.userGift.findUnique({
        where: { userId_giftDropId: { userId, giftDropId } },
      });

      if (!existing) {
        await prisma.userGift.create({
          data: { userId, giftDropId, status: "PENDING" },
        });
        created++;
      }
    }

    await prisma.giftDrop.update({
      where: { id: giftDropId },
      data: { isActive: true },
    });

    return c.json({ success: true, created, total: targetUserIds.length });
  } catch (error) {
    console.error("[Gifts] Error publishing gift drop:", error);
    return c.json({ error: "Failed to publish gift drop" }, 500);
  }
});

// GET /api/gifts/admin/store-items - List store items for reward picker (OWNER only)
giftsRouter.get("/admin/store-items", requireRole("OWNER"), async (c) => {
  try {
    const items = await prisma.storeItem.findMany({
      where: { available: true },
      select: { id: true, type: true, nameEs: true, nameEn: true, rarity: true },
      orderBy: [{ type: "asc" }, { nameEs: "asc" }],
    });
    return c.json(items);
  } catch (error) {
    console.error("[Gifts] Error getting store items:", error);
    return c.json({ error: "Failed to get store items" }, 500);
  }
});

// DELETE /api/gifts/admin/:id - Delete a gift drop (OWNER only)
giftsRouter.delete("/admin/:id", requireRole("OWNER"), async (c) => {
  try {
    const id = c.req.param("id");
    await prisma.giftDrop.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error("[Gifts] Error deleting gift drop:", error);
    return c.json({ error: "Failed to delete gift drop" }, 500);
  }
});
