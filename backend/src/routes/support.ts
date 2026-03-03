import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { getLatestSnapshotForUser } from "../streak-snapshot-service";
import { requireRole } from "../middleware/rbac";

const supportRouter = new Hono();

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketType =
  | "streak_missing"
  | "devotional_not_counted"
  | "audio_tts"
  | "notification"
  | "reward_drop";

type TicketStatus = "open" | "auto_fixed" | "needs_human" | "closed";

interface BotPreview {
  summary: string;
  userMessageEs: string;
  userMessageEn: string;
  action: "auto_fixed" | "needs_human" | "info_only";
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  userId: z.string().min(1),
  type: z.enum([
    "streak_missing",
    "devotional_not_counted",
    "audio_tts",
    "notification",
    "reward_drop",
  ]),
  // Kept for backward compat
  claimedStreak: z.number().int().min(0).optional().default(0),
  claimedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .default(() => new Date().toISOString().split("T")[0]!),
  // New flexible payload
  clientClaim: z.record(z.unknown()).optional().default({}),
});

// ─── Helper: build BotPreview ─────────────────────────────────────────────────

function buildBotPreview(
  type: TicketType,
  status: TicketStatus,
  resolutionNote: string | null,
  claimedStreak: number,
  clientClaim: Record<string, unknown>
): BotPreview {
  switch (type) {
    case "streak_missing": {
      if (status === "auto_fixed") {
        return {
          summary: `Racha corregida automáticamente (claimed: ${claimedStreak})`,
          userMessageEs: `¡Tu racha fue restaurada! El sistema detectó una pequeña diferencia y la corrigió de forma automática. Tu racha no disminuirá.`,
          userMessageEn: `Your streak has been restored! The system detected a small discrepancy and fixed it automatically. Your streak is safe.`,
          action: "auto_fixed",
        };
      }
      return {
        summary: `Racha perdida — requiere revisión manual`,
        userMessageEs: `Hola, recibimos tu reporte sobre tu racha. La diferencia detectada es demasiado grande para una corrección automática, por lo que un moderador revisará tu caso pronto. Gracias por reportarlo.`,
        userMessageEn: `Hello, we received your streak report. The detected difference is too large for an automatic fix, so a moderator will review your case soon. Thank you for reporting it.`,
        action: "needs_human",
      };
    }
    case "devotional_not_counted": {
      if (status === "auto_fixed") {
        return {
          summary: `Devocional reconocido automáticamente`,
          userMessageEs: `Tu devocional fue registrado correctamente. Si el conteo no se refleja de inmediato, cierra y abre la app.`,
          userMessageEn: `Your devotional was registered correctly. If the count doesn't show immediately, close and reopen the app.`,
          action: "auto_fixed",
        };
      }
      return {
        summary: `Devocional no contado — requiere revisión`,
        userMessageEs: `Recibimos tu reporte. No encontramos una forma automática de verificar tu devocional del día indicado. Un moderador revisará tu caso. Gracias.`,
        userMessageEn: `We received your report. We couldn't automatically verify your devotional for the indicated day. A moderator will review your case. Thank you.`,
        action: "needs_human",
      };
    }
    case "audio_tts": {
      const issue = (clientClaim.issue as string) || "unknown";
      const device = (clientClaim.device as string) || "no especificado";
      const os = (clientClaim.os as string) || "no especificado";
      const steps =
        issue === "no_sound"
          ? "1) Verifica que el volumen del dispositivo esté activo. 2) Cierra y abre la app. 3) Ve a Ajustes > Sonido y asegúrate de que la música esté activada."
          : issue === "repeats"
          ? "1) Cierra y abre la app. 2) Si persiste, ve a Ajustes del sistema > Apps > Luz Diaria > Borrar caché."
          : issue === "cuts"
          ? "1) Verifica tu conexión a internet. 2) El audio puede cortarse si la señal es débil. Intenta con WiFi."
          : "1) Cierra y abre la app. 2) Verifica tu conexión a internet.";
      return {
        summary: `Audio/TTS: ${issue} (${os}/${device})`,
        userMessageEs: `Hola, recibimos tu reporte de audio (${issue}). Pasos a seguir: ${steps} Si el problema persiste, escríbenos y lo escalaremos.`,
        userMessageEn: `Hello, we received your audio report (${issue}). Steps to try: ${steps} If the issue persists, let us know and we'll escalate it.`,
        action: "info_only",
      };
    }
    case "notification": {
      const issue = (clientClaim.issue as string) || "unknown";
      const hour = clientClaim.scheduledHour;
      const enabled = clientClaim.enabled;
      const stepsEs =
        issue === "not_received"
          ? `1) Verifica que las notificaciones estén activadas en Ajustes > Notificaciones. 2) Hora programada: ${hour !== undefined ? hour + ":00" : "no registrada"}. 3) En iOS, ve a Configuración > Luz Diaria > Notificaciones y confirma que estén habilitadas.`
          : issue === "late"
          ? `Las notificaciones pueden llegar tarde si el sistema operativo las agrupa. Esto es normal en iOS con el modo bajo consumo activo.`
          : `Si recibes notificaciones duplicadas, por favor cierra sesión y vuelve a activarlas en Ajustes > Notificaciones.`;
      return {
        summary: `Notificación: ${issue} (habilitado: ${enabled ?? "?"})`,
        userMessageEs: `Hola, recibimos tu reporte de notificaciones (${issue}). ${stepsEs}`,
        userMessageEn: `Hello, we received your notification report (${issue}). Please check your device notification settings and make sure notifications are enabled for Luz Diaria.`,
        action: "info_only",
      };
    }
    case "reward_drop": {
      const issue = (clientClaim.issue as string) || "unknown";
      const dropId = (clientClaim.dropId as string) || "";
      return {
        summary: `Regalo/Drop: ${issue}${dropId ? " (dropId: " + dropId.slice(0, 8) + ")" : ""}`,
        userMessageEs: `Hola, recibimos tu reporte sobre el regalo (${issue}). ${
          issue === "not_received"
            ? "Los regalos pueden tardar hasta 24 horas en aparecer. Si transcurrido ese tiempo no aparece, un moderador revisará tu cuenta."
            : "Si el cofre no abre, cierra y abre la app. Si el problema persiste, un moderador revisará manualmente."
        }`,
        userMessageEn: `Hello, we received your gift/drop report (${issue}). ${
          issue === "not_received"
            ? "Gifts can take up to 24 hours to appear. If it still doesn't show after that time, a moderator will review your account."
            : "If the chest won't open, close and reopen the app. If the issue persists, a moderator will review it manually."
        }`,
        action: "needs_human",
      };
    }
    default:
      return {
        summary: "Ticket recibido",
        userMessageEs: "Tu reporte fue recibido y será revisado.",
        userMessageEn: "Your report has been received and will be reviewed.",
        action: "info_only",
      };
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/support/ticket — create a ticket
supportRouter.post(
  "/ticket",
  zValidator("json", createTicketSchema),
  async (c) => {
    const { userId, type, claimedStreak, claimedDate, clientClaim } =
      c.req.valid("json");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, streakCurrent: true, devotionalsCompleted: true },
    });

    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }

    const snapshot = await getLatestSnapshotForUser(userId);

    const beforeState = JSON.stringify({
      streakCurrent: user.streakCurrent,
      devotionalsCompleted: user.devotionalsCompleted,
    });

    let status: TicketStatus = "open";
    let resolutionNote: string | null = null;
    let afterState = beforeState;

    // Auto-fix logic: only for streak_missing and devotional_not_counted
    if (type === "streak_missing" || type === "devotional_not_counted") {
      if (!snapshot) {
        status = "needs_human";
        resolutionNote =
          "No snapshot available for verification. Manual review required.";
        console.warn(
          `[Support] Ticket for user ${userId}: no snapshot found. Escalating.`
        );
      } else {
        const snapshotStreak = snapshot.streak;
        const diff = Math.abs(snapshotStreak - claimedStreak);

        if (snapshotStreak >= 1 && diff <= 1) {
          const newStreak = Math.max(claimedStreak, user.streakCurrent);

          await prisma.user.update({
            where: { id: userId },
            data: { streakCurrent: newStreak },
          });

          afterState = JSON.stringify({
            streakCurrent: newStreak,
            devotionalsCompleted: user.devotionalsCompleted,
          });

          status = "auto_fixed";
          resolutionNote = `Auto-fixed using snapshot from ${snapshot.snapshotDate}. Snapshot streak: ${snapshotStreak}, claimed: ${claimedStreak}, applied: ${newStreak}.`;
          console.log(
            `[Support] Auto-fixed ticket for user ${userId}: streak ${user.streakCurrent} → ${newStreak}`
          );
        } else {
          status = "needs_human";
          resolutionNote = `Snapshot streak (${snapshotStreak}) vs claimed (${claimedStreak}) diff=${diff}. Needs manual review.`;
          console.warn(
            `[Support] Ticket for user ${userId}: diff too large (snapshot=${snapshotStreak}, claimed=${claimedStreak}). Escalating.`
          );
        }
      }
    } else {
      // For audio/notification/reward_drop: no auto-fix, always info_only / needs_human
      status = "needs_human";
      resolutionNote = `${type} issue reported. Awaiting moderator review.`;
    }

    const botPreview = buildBotPreview(
      type as TicketType,
      status,
      resolutionNote,
      claimedStreak,
      clientClaim as Record<string, unknown>
    );

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        type,
        claimedStreak,
        claimedDate,
        clientClaim: JSON.stringify(clientClaim),
        status,
        resolutionNote,
        beforeState,
        afterState,
        botPreview: JSON.stringify(botPreview),
      },
    });

    return c.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        resolutionNote: ticket.resolutionNote,
        autoFixed: ticket.status === "auto_fixed",
        botPreview,
      },
    });
  }
);

// GET /api/support/tickets/:userId — user's own tickets
supportRouter.get("/tickets/:userId", async (c) => {
  const userId = c.req.param("userId");
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return c.json({ tickets });
});

// GET /api/support/admin/tickets — admin view with systemSnapshot enrichment
supportRouter.get("/admin/tickets", requireRole("MODERATOR"), async (c) => {
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
      clientClaim: true,
      status: true,
      resolutionNote: true,
      beforeState: true,
      afterState: true,
      botPreview: true,
      createdAt: true,
    },
  });

  // Enrich each ticket with systemSnapshot
  const today = new Date().toISOString().split("T")[0]!;
  const enriched = await Promise.all(
    tickets.map(async (ticket) => {
      // Fetch user info
      const user = await prisma.user.findUnique({
        where: { id: ticket.userId },
        select: {
          id: true,
          nickname: true,
          avatarId: true,
          countryCode: true,
          streakCurrent: true,
          dailyActions: true,
        },
      });

      // Latest snapshot
      const snapshot = await getLatestSnapshotForUser(ticket.userId);

      // Today's devotional completion
      const todayCompletion = await prisma.devotionalCompletion.findFirst({
        where: { userId: ticket.userId, devotionalDate: today },
        select: { completedAt: true, devotionalDate: true },
      });

      // Last devotional completion
      const lastCompletion = await prisma.devotionalCompletion.findFirst({
        where: { userId: ticket.userId },
        orderBy: { completedAt: "desc" },
        select: { devotionalDate: true, completedAt: true },
      });

      // Last gift received
      const lastGift = await prisma.userGift.findFirst({
        where: { userId: ticket.userId },
        orderBy: { createdAt: "desc" },
        select: { giftDropId: true, createdAt: true },
      });

      // Parse notification settings from dailyActions if available
      let notificationsEnabled: boolean | undefined;
      let notificationsHour: number | undefined;
      try {
        const actions = JSON.parse(user?.dailyActions ?? "{}") as Record<
          string,
          unknown
        >;
        if (typeof actions.notificationsEnabled === "boolean") {
          notificationsEnabled = actions.notificationsEnabled;
        }
        if (typeof actions.notificationsHour === "number") {
          notificationsHour = actions.notificationsHour;
        }
      } catch {
        // ignore
      }

      const systemSnapshot = {
        nickname: user?.nickname ?? ticket.userId.slice(0, 12),
        avatarId: user?.avatarId,
        country: user?.countryCode,
        currentStreak: user?.streakCurrent,
        lastSnapshotDate: snapshot?.snapshotDate,
        lastSnapshotStreak: snapshot?.streak,
        devotionalTodayExists: !!todayCompletion,
        devotionalLastClaimDate: lastCompletion?.devotionalDate ?? null,
        notificationsEnabled,
        notificationsHour,
        lastGiftDropId: lastGift?.giftDropId ?? null,
        lastGiftDropAt: lastGift?.createdAt?.toISOString() ?? null,
      };

      // Parse JSON fields safely
      let parsedBotPreview: BotPreview | null = null;
      let parsedClientClaim: Record<string, unknown> = {};
      try {
        parsedBotPreview = JSON.parse(ticket.botPreview || "{}") as BotPreview;
      } catch {}
      try {
        parsedClientClaim = JSON.parse(ticket.clientClaim || "{}") as Record<
          string,
          unknown
        >;
      } catch {}

      // If old tickets have no botPreview, generate on the fly
      if (!parsedBotPreview?.summary) {
        parsedBotPreview = buildBotPreview(
          ticket.type as TicketType,
          ticket.status as TicketStatus,
          ticket.resolutionNote ?? null,
          ticket.claimedStreak,
          parsedClientClaim
        );
      }

      return {
        ...ticket,
        clientClaim: parsedClientClaim,
        botPreview: parsedBotPreview,
        systemSnapshot,
      };
    })
  );

  return c.json({ tickets: enriched });
});

// POST /api/support/admin/compensate — create a targeted GiftDrop and UserGift for a user
supportRouter.post(
  "/admin/compensate",
  requireRole("MODERATOR"),
  zValidator(
    "json",
    z.object({
      ticketId: z.string().min(1),
      targetUserId: z.string().min(1),
      title: z.string().min(1),
      message: z.string().min(1),
      rewardType: z.enum(["CHEST", "THEME", "TITLE", "AVATAR", "ITEM"]),
      rewardId: z.string().min(1),
    })
  ),
  async (c) => {
    const { ticketId, targetUserId, title, message, rewardType, rewardId } =
      c.req.valid("json");

    const adminUserId = c.req.header("X-User-Id") ?? "unknown";

    // Verify target user exists
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      return c.json({ success: false, error: "Target user not found" }, 404);
    }

    // Create GiftDrop targeted to this user
    const giftDrop = await prisma.giftDrop.create({
      data: {
        title,
        message,
        rewardType,
        rewardId,
        audienceType: "USER_IDS",
        audienceUserIds: JSON.stringify([targetUserId]),
        isActive: true,
      },
    });

    // Create UserGift record
    await prisma.userGift.create({
      data: {
        userId: targetUserId,
        giftDropId: giftDrop.id,
        status: "PENDING",
      },
    });

    // Update ticket status to closed + note
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "closed",
        resolutionNote: `Compensated with gift drop ${giftDrop.id} by admin ${adminUserId}`,
      },
    });

    console.log(
      `[Support] Compensate: admin ${adminUserId} created gift ${giftDrop.id} for user ${targetUserId} (ticket ${ticketId})`
    );

    return c.json({ success: true, giftDropId: giftDrop.id });
  }
);

export { supportRouter };
