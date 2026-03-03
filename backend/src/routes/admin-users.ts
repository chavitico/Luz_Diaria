import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { requireRole } from "../middleware/rbac";

export const adminRouter = new Hono();

// ─── Known badge ID remap table (old id → new id) ─────────────────────────────
// Add mappings here if badges were renamed/migrated.
const BADGE_REMAP: Record<string, string> = {
  // Example: badge_old_id: "badge_new_id"
};

// ─── List users with rich stats (MODERATOR+) ─────────────────────────────────
// GET /api/admin/users?search=xxx&role=USER|MODERATOR|OWNER&activeOnly=true&hasIssues=true
adminRouter.get("/users", requireRole("MODERATOR"), async (c) => {
  try {
    const search    = c.req.query("search")?.trim().toLowerCase() ?? "";
    const roleFilter= c.req.query("role") ?? "";
    const activeOnly= c.req.query("activeOnly") === "true";
    const hasIssues = c.req.query("hasIssues") === "true";

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const users = await prisma.user.findMany({
      where: {
        ...(search   ? { nicknameLower: { contains: search } } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      },
      include: {
        inventory: {
          where:   { item: { type: "badge" } },
          include: { item: true },
        },
      },
      orderBy: { nicknameLower: "asc" },
      take: 200,
    });

    // Fetch store items for badge name resolution
    const storeItems = await prisma.storeItem.findMany({
      where: { type: "badge" },
      select: { id: true, nameEn: true, nameEs: true },
    });
    const badgeCatalog = new Map(storeItems.map(i => [i.id, i]));

    // Per-user: count completions in last 7 days
    const completionRows = await prisma.devotionalCompletion.groupBy({
      by: ["userId"],
      where: { devotionalDate: { gte: sevenDaysAgo } },
      _count: { userId: true },
    });
    const recent7Map = new Map(completionRows.map(r => [r.userId, r._count.userId]));

    type BadgeInfo = { id: string; nameEs: string; nameEn: string; unknown: boolean };
    type UserRow = {
      id: string;
      nickname: string;
      role: string;
      countryCode: string | null;
      streakCurrent: number;
      streakBest: number;
      devotionalsCompleted: number;
      completionsLast7Days: number;
      points: number;
      lastActiveAt: string | null;
      activeBadgeId: string | null;
      badges: BadgeInfo[];
      hasIssues: boolean;
      createdAt: string;
    };

    const rows: UserRow[] = users.map(u => {
      const badges: BadgeInfo[] = u.inventory.map(inv => {
        const catalogItem = badgeCatalog.get(inv.itemId);
        if (catalogItem) {
          return { id: inv.itemId, nameEs: catalogItem.nameEs, nameEn: catalogItem.nameEn, unknown: false };
        }
        // Try remap
        const remapped = BADGE_REMAP[inv.itemId];
        const remappedItem = remapped ? badgeCatalog.get(remapped) : undefined;
        if (remappedItem) {
          return { id: inv.itemId, nameEs: remappedItem.nameEs, nameEn: remappedItem.nameEn, unknown: false };
        }
        return { id: inv.itemId, nameEs: `Desconocido: ${inv.itemId}`, nameEn: `Unknown: ${inv.itemId}`, unknown: true };
      });

      const userHasIssues = badges.some(b => b.unknown);

      return {
        id:                   u.id,
        nickname:             u.nickname,
        role:                 u.role,
        countryCode:          u.countryCode,
        streakCurrent:        u.streakCurrent,
        streakBest:           u.streakBest,
        devotionalsCompleted: u.devotionalsCompleted,
        completionsLast7Days: recent7Map.get(u.id) ?? 0,
        points:               u.points,
        lastActiveAt:         u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
        activeBadgeId:        u.activeBadgeId,
        badges,
        hasIssues:            userHasIssues,
        createdAt:            u.createdAt.toISOString(),
      };
    });

    // Active-only filter: had completions in last 7 days
    const filtered = rows.filter(r => {
      if (activeOnly && r.completionsLast7Days === 0) return false;
      if (hasIssues  && !r.hasIssues)                return false;
      return true;
    });

    return c.json({ users: filtered });
  } catch (err) {
    console.error("[AdminUsers] Error listing users:", err);
    return c.json({ error: "Failed to list users" }, 500);
  }
});

// ─── Change user role (OWNER only) ───────────────────────────────────────────
const changeRoleSchema = z.object({
  role: z.enum(["USER", "MODERATOR"]),
});

adminRouter.patch(
  "/users/:id/role",
  requireRole("OWNER"),
  zValidator("json", changeRoleSchema),
  async (c) => {
    try {
      const targetId = c.req.param("id");
      const { role: newRole } = c.req.valid("json");
      const actorId = c.req.header("X-User-Id") as string;

      if (targetId === actorId) {
        return c.json({ success: false, error: "Cannot change your own role" }, 400);
      }

      const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, role: true, nickname: true },
      });

      if (!target) {
        return c.json({ success: false, error: "User not found" }, 404);
      }
      if (target.role === "OWNER") {
        return c.json({ success: false, error: "Cannot modify an OWNER account" }, 400);
      }
      if (target.role === newRole) {
        return c.json({ success: true, user: target, message: "Role unchanged" });
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role: newRole },
        select: { id: true, nickname: true, role: true },
      });

      await prisma.adminAuditLog.create({
        data: { actorUserId: actorId, targetUserId: targetId, action: "SET_ROLE", beforeRole: target.role, afterRole: newRole },
      });

      console.log(`[AdminUsers] Role change: ${target.nickname} ${target.role} => ${newRole}`);
      return c.json({ success: true, user: updated });
    } catch (err) {
      console.error("[AdminUsers] Error changing role:", err);
      return c.json({ error: "Failed to change role" }, 500);
    }
  }
);

// ─── Compensate user: grant points or grant a store item (OWNER only) ─────────
const compensateSchema = z.object({
  type: z.enum(["points", "item"]),
  points: z.number().int().min(1).max(100000).optional(),
  itemId: z.string().optional(),
  reason: z.string().max(200).optional(),
});

adminRouter.post(
  "/users/:id/compensate",
  requireRole("OWNER"),
  zValidator("json", compensateSchema),
  async (c) => {
    try {
      const targetId = c.req.param("id");
      const { type, points, itemId, reason } = c.req.valid("json");
      const actorId = c.req.header("X-User-Id") as string;

      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) return c.json({ success: false, error: "User not found" }, 404);

      if (type === "points") {
        if (!points || points < 1) return c.json({ success: false, error: "Points must be >= 1" }, 400);

        await prisma.$transaction([
          prisma.user.update({ where: { id: targetId }, data: { points: { increment: points } } }),
          prisma.pointLedger.create({
            data: {
              userId:   targetId,
              ledgerId: `admin_grant_${targetId}_${Date.now()}`,
              type:     "admin_grant",
              dateId:   new Date().toISOString().split("T")[0] as string,
              amount:   points,
              metadata: JSON.stringify({ reason: reason ?? "Compensación admin" }),
            },
          }),
        ]);

        await prisma.adminAuditLog.create({
          data: { actorUserId: actorId, targetUserId: targetId, action: "GRANT_POINTS", beforeRole: "", afterRole: "" },
        });

        console.log(`[AdminUsers] Compensate ${target.nickname}: +${points} pts`);
        return c.json({ success: true, message: `Granted ${points} points to ${target.nickname}` });
      }

      if (type === "item") {
        if (!itemId) return c.json({ success: false, error: "itemId required" }, 400);

        const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
        if (!item) return c.json({ success: false, error: "Item not found in catalog" }, 404);

        await prisma.userInventory.upsert({
          where: { userId_itemId: { userId: targetId, itemId } },
          update: {},
          create: { userId: targetId, itemId, source: "admin_grant" },
        });

        await prisma.adminAuditLog.create({
          data: { actorUserId: actorId, targetUserId: targetId, action: `GRANT_ITEM:${itemId}`, beforeRole: "", afterRole: "" },
        });

        console.log(`[AdminUsers] Compensate ${target.nickname}: item ${itemId}`);
        return c.json({ success: true, message: `Granted item "${item.nameEs}" to ${target.nickname}` });
      }

      return c.json({ success: false, error: "Invalid type" }, 400);
    } catch (err) {
      console.error("[AdminUsers] Error compensating:", err);
      return c.json({ error: "Failed to compensate" }, 500);
    }
  }
);

// ─── Fix badges: remove unknown codes, apply remap table (OWNER only) ────────
adminRouter.post(
  "/users/:id/fix-badges",
  requireRole("OWNER"),
  async (c) => {
    try {
      const targetId = c.req.param("id");
      const actorId  = c.req.header("X-User-Id") as string;

      const target = await prisma.user.findUnique({
        where: { id: targetId },
        include: { inventory: { where: { item: { type: "badge" } }, include: { item: true } } },
      });
      if (!target) return c.json({ success: false, error: "User not found" }, 404);

      const storeItems = await prisma.storeItem.findMany({ where: { type: "badge" }, select: { id: true } });
      const validIds   = new Set(storeItems.map(i => i.id));

      const removed: string[] = [];
      const remapped: Array<{ from: string; to: string }> = [];

      for (const inv of target.inventory) {
        if (!validIds.has(inv.itemId)) {
          const remapTo = BADGE_REMAP[inv.itemId];
          if (remapTo && validIds.has(remapTo)) {
            // Grant the remapped badge, delete old
            await prisma.userInventory.upsert({
              where:  { userId_itemId: { userId: targetId, itemId: remapTo } },
              update: {},
              create: { userId: targetId, itemId: remapTo, source: "fix_badges" },
            });
            await prisma.userInventory.delete({
              where: { userId_itemId: { userId: targetId, itemId: inv.itemId } },
            });
            remapped.push({ from: inv.itemId, to: remapTo });
          } else {
            // No remap — just remove invalid badge
            await prisma.userInventory.delete({
              where: { userId_itemId: { userId: targetId, itemId: inv.itemId } },
            });
            removed.push(inv.itemId);
          }
        }
      }

      // Fix activeBadgeId if it's now invalid
      if (target.activeBadgeId && !validIds.has(target.activeBadgeId)) {
        await prisma.user.update({ where: { id: targetId }, data: { activeBadgeId: null } });
      }

      const summary = [
        removed.length  > 0 ? `Removed: ${removed.join(", ")}` : "",
        remapped.length > 0 ? `Remapped: ${remapped.map(r => `${r.from}→${r.to}`).join(", ")}` : "",
      ].filter(Boolean).join(" | ") || "No changes needed";

      if (removed.length > 0 || remapped.length > 0) {
        await prisma.adminAuditLog.create({
          data: { actorUserId: actorId, targetUserId: targetId, action: `FIX_BADGES:${summary}`.slice(0, 200), beforeRole: "", afterRole: "" },
        });
      }

      console.log(`[AdminUsers] fix-badges ${target.nickname}: ${summary}`);
      return c.json({ success: true, removed, remapped, message: summary });
    } catch (err) {
      console.error("[AdminUsers] Error fixing badges:", err);
      return c.json({ error: "Failed to fix badges" }, 500);
    }
  }
);

// ─── Get store items (for compensate modal) (MODERATOR+) ─────────────────────
adminRouter.get("/store-items", requireRole("MODERATOR"), async (c) => {
  try {
    const items = await prisma.storeItem.findMany({
      select: { id: true, nameEs: true, nameEn: true, type: true, rarity: true, pricePoints: true },
      orderBy: [{ type: "asc" }, { nameEs: "asc" }],
    });
    return c.json({ items });
  } catch (err) {
    console.error("[AdminUsers] Error fetching store items:", err);
    return c.json({ error: "Failed to fetch store items" }, 500);
  }
});
