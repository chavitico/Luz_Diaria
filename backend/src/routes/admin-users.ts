import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { requireRole } from "../middleware/rbac";

export const adminRouter = new Hono();

// ─── List users (OWNER only) ──────────────────────────────────────────────────
// GET /api/admin/users?search=xxx
adminRouter.get("/users", requireRole("OWNER"), async (c) => {
  try {
    const search = c.req.query("search")?.trim().toLowerCase() ?? "";

    const users = await prisma.user.findMany({
      where: search
        ? { nicknameLower: { contains: search } }
        : undefined,
      select: {
        id: true,
        nickname: true,
        role: true,
        avatarId: true,
        createdAt: true,
      },
      orderBy: { nicknameLower: "asc" },
      take: 100,
    });

    return c.json({ users });
  } catch (err) {
    console.error("[AdminUsers] Error listing users:", err);
    return c.json({ error: "Failed to list users" }, 500);
  }
});

// ─── Change user role (OWNER only) ───────────────────────────────────────────
// PATCH /api/admin/users/:id/role
const changeRoleSchema = z.object({
  role: z.enum(["USER", "MODERATOR"]), // OWNER cannot be set via this endpoint
});

adminRouter.patch(
  "/users/:id/role",
  requireRole("OWNER"),
  zValidator("json", changeRoleSchema),
  async (c) => {
    try {
      const targetId = c.req.param("id");
      const { role: newRole } = c.req.valid("json");

      // Actor identity comes from the validated X-User-Id header
      const actorId = c.req.header("X-User-Id") as string;
      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, nickname: true },
      });

      if (!actor) {
        return c.json({ success: false, error: "Forbidden" }, 403);
      }

      // Prevent self-modification
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

      // Protect OWNER accounts from being changed
      if (target.role === "OWNER") {
        return c.json({ success: false, error: "Cannot modify an OWNER account" }, 400);
      }

      if (target.role === newRole) {
        return c.json({ success: true, user: target, message: "Role unchanged" });
      }

      // Update role
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role: newRole },
        select: { id: true, nickname: true, role: true },
      });

      // Audit log
      await prisma.adminAuditLog.create({
        data: {
          actorUserId: actorId,
          targetUserId: targetId,
          action: "SET_ROLE",
          beforeRole: target.role,
          afterRole: newRole,
        },
      });

      console.log(
        `[AdminUsers] ${actor.nickname} (${actorId}) changed role of ${target.nickname} (${targetId}): ${target.role} => ${newRole}`
      );

      return c.json({ success: true, user: updated });
    } catch (err) {
      console.error("[AdminUsers] Error changing role:", err);
      return c.json({ error: "Failed to change role" }, 500);
    }
  }
);
