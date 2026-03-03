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

// ─── Helper: resolve badges to display objects ────────────────────────────────
async function resolveUserBadges(userId: string) {
  const storeItems = await prisma.storeItem.findMany({
    where: { type: "badge" },
    select: { id: true, nameEs: true, nameEn: true },
  });
  const catalog = new Map(storeItems.map(i => [i.id, i]));

  const inventory = await prisma.userInventory.findMany({
    where: { userId, item: { type: "badge" } },
    include: { item: true },
  });

  return inventory.map(inv => {
    const cat = catalog.get(inv.itemId);
    if (cat) return { id: inv.itemId, code: inv.itemId, displayNameEs: cat.nameEs, displayNameEn: cat.nameEn, unknown: false };
    const remapped = BADGE_REMAP[inv.itemId];
    const rc = remapped ? catalog.get(remapped) : undefined;
    if (rc)  return { id: inv.itemId, code: inv.itemId, displayNameEs: rc.nameEs,  displayNameEn: rc.nameEn,  unknown: false };
    return { id: inv.itemId, code: inv.itemId, displayNameEs: `Desconocido: ${inv.itemId}`, displayNameEn: `Unknown: ${inv.itemId}`, unknown: true };
  });
}

// ─── GET /api/admin/users/:id — single user detail (OWNER) ───────────────────
adminRouter.get("/users/:id", requireRole("OWNER"), async (c) => {
  try {
    const userId = c.req.param("id");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return c.json({ error: "User not found" }, 404);

    const [badges, completionsLast7] = await Promise.all([
      resolveUserBadges(userId),
      prisma.devotionalCompletion.count({ where: { userId, devotionalDate: { gte: sevenDaysAgo } } }),
    ]);

    return c.json({
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      countryCode: user.countryCode,
      streakCurrent: user.streakCurrent,
      streakBest: user.streakBest,
      devotionalsCompleted: user.devotionalsCompleted,
      completionsLast7Days: completionsLast7,
      points: user.points,
      lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : null,
      activeBadgeId: user.activeBadgeId,
      badges,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[AdminUsers] Error fetching user detail:", err);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// ─── PATCH /api/admin/users/:id — partial update (OWNER) ─────────────────────
const patchUserSchema = z.object({
  points:        z.number().int().min(0).optional(),
  countryCode:   z.string().length(2).toUpperCase().optional(),
  streakCurrent: z.number().int().min(0).optional(),
  role:          z.enum(["USER", "MODERATOR"]).optional(), // can't set OWNER
  forceStreakDecrease: z.boolean().optional(), // must be true to allow lowering streak
});

adminRouter.patch(
  "/users/:id",
  requireRole("OWNER"),
  zValidator("json", patchUserSchema),
  async (c) => {
    try {
      const targetId = c.req.param("id");
      const actorId  = c.req.header("X-User-Id") as string;
      const body     = c.req.valid("json");

      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) return c.json({ success: false, error: "User not found" }, 404);
      if (target.role === "OWNER" && body.role) {
        return c.json({ success: false, error: "Cannot change role of an OWNER" }, 400);
      }
      if (targetId === actorId && body.role) {
        return c.json({ success: false, error: "Cannot change your own role" }, 400);
      }

      // Streak decrease safeguard
      if (body.streakCurrent !== undefined && body.streakCurrent < target.streakCurrent) {
        if (!body.forceStreakDecrease) {
          return c.json({ success: false, error: "STREAK_DECREASE_REQUIRES_CONFIRM" }, 400);
        }
      }

      const before: Record<string, unknown> = {};
      const after:  Record<string, unknown> = {};
      const updateData: Record<string, unknown> = {};

      if (body.points !== undefined && body.points !== target.points) {
        before.points = target.points; after.points = body.points;
        updateData.points = body.points;
      }
      if (body.countryCode !== undefined && body.countryCode !== target.countryCode) {
        before.countryCode = target.countryCode; after.countryCode = body.countryCode;
        updateData.countryCode = body.countryCode;
      }
      if (body.streakCurrent !== undefined && body.streakCurrent !== target.streakCurrent) {
        before.streakCurrent = target.streakCurrent; after.streakCurrent = body.streakCurrent;
        updateData.streakCurrent = body.streakCurrent;
        // If new streak is higher, also update streakBest
        if (body.streakCurrent > target.streakBest) updateData.streakBest = body.streakCurrent;
      }
      if (body.role && body.role !== target.role) {
        before.role = target.role; after.role = body.role;
        updateData.role = body.role;
      }

      if (Object.keys(updateData).length === 0) {
        return c.json({ success: true, message: "Nothing changed" });
      }

      await prisma.user.update({ where: { id: targetId }, data: updateData });

      await prisma.adminAuditLog.create({
        data: {
          actorUserId:  actorId,
          targetUserId: targetId,
          action:       `PATCH_USER:${JSON.stringify(after)}`.slice(0, 200),
          beforeRole:   String(before.role ?? target.role),
          afterRole:    String(after.role  ?? target.role),
        },
      });

      console.log(`[AdminUsers] PATCH user ${target.nickname}: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
      return c.json({ success: true, changes: { before, after } });
    } catch (err) {
      console.error("[AdminUsers] Error patching user:", err);
      return c.json({ error: "Failed to update user" }, 500);
    }
  }
);

// ─── GET /api/admin/badges — all available badge items (OWNER) ───────────────
adminRouter.get("/badges", requireRole("OWNER"), async (c) => {
  try {
    const badges = await prisma.storeItem.findMany({
      where: { type: "badge" },
      select: { id: true, nameEs: true, nameEn: true, rarity: true },
      orderBy: { nameEs: "asc" },
    });
    return c.json({ badges: badges.map(b => ({
      id: b.id, code: b.id,
      displayNameEs: b.nameEs,
      displayNameEn: b.nameEn,
      rarity: b.rarity,
    })) });
  } catch (err) {
    console.error("[AdminUsers] Error fetching badges:", err);
    return c.json({ error: "Failed to fetch badges" }, 500);
  }
});

// ─── PUT /api/admin/users/:id/badges — add/remove badges (OWNER) ─────────────
const badgesSchema = z.object({
  add:    z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
});

adminRouter.put(
  "/users/:id/badges",
  requireRole("OWNER"),
  zValidator("json", badgesSchema),
  async (c) => {
    try {
      const targetId = c.req.param("id");
      const actorId  = c.req.header("X-User-Id") as string;
      const { add = [], remove = [] } = c.req.valid("json");

      const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, nickname: true } });
      if (!target) return c.json({ success: false, error: "User not found" }, 404);

      // Validate all add IDs exist in catalog
      if (add.length > 0) {
        const found = await prisma.storeItem.findMany({ where: { id: { in: add }, type: "badge" }, select: { id: true } });
        const foundIds = new Set(found.map(f => f.id));
        const invalid = add.filter(id => !foundIds.has(id));
        if (invalid.length > 0) return c.json({ success: false, error: `Unknown badge IDs: ${invalid.join(", ")}` }, 400);
      }

      const added: string[] = [];
      const removed: string[] = [];

      for (const itemId of add) {
        const res = await prisma.userInventory.upsert({
          where:  { userId_itemId: { userId: targetId, itemId } },
          update: {},
          create: { userId: targetId, itemId, source: "admin_grant" },
        });
        if (res) added.push(itemId);
      }

      for (const itemId of remove) {
        try {
          await prisma.userInventory.delete({ where: { userId_itemId: { userId: targetId, itemId } } });
          removed.push(itemId);
          // Clear activeBadgeId if it was this badge
          await prisma.user.updateMany({ where: { id: targetId, activeBadgeId: itemId }, data: { activeBadgeId: null } });
        } catch { /* already gone — ignore */ }
      }

      if (added.length > 0 || removed.length > 0) {
        const summary = [
          added.length   > 0 ? `+[${added.join(",")}]`   : "",
          removed.length > 0 ? `-[${removed.join(",")}]` : "",
        ].filter(Boolean).join(" ");
        await prisma.adminAuditLog.create({
          data: { actorUserId: actorId, targetUserId: targetId, action: `BADGES:${summary}`.slice(0, 200), beforeRole: "", afterRole: "" },
        });
      }

      console.log(`[AdminUsers] badges for ${target.nickname}: added=${added.join(",")} removed=${removed.join(",")}`);
      return c.json({ success: true, added, removed });
    } catch (err) {
      console.error("[AdminUsers] Error updating badges:", err);
      return c.json({ error: "Failed to update badges" }, 500);
    }
  }
);

