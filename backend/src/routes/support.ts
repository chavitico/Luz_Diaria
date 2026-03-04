import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import {
  getBestSnapshotForUser,
  getSnapshotById,
  getCRDateString,
} from "../streak-snapshot-service";
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
  // Snapshot comparison data for admin display
  snapshotComparison?: {
    snapshotDate: string | null;
    snapshotId: string | null;
    snapshotStreak: number | null;
    currentStreak: number;
    claimedStreak: number;
    diffDays: number | null;
    devotionalTodayCR: boolean;
    lastDevotionalDate: string | null;
    escalationReason: string;
  };
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
  claimedStreak: z.number().int().min(0).optional().default(0),
  claimedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .default(() => getCRDateString(0)),
  clientClaim: z.record(z.string(), z.unknown()).optional().default({}),
});

// ─── Helper: build BotPreview ─────────────────────────────────────────────────

function buildBotPreview(
  type: TicketType,
  status: TicketStatus,
  resolutionNote: string | null,
  claimedStreak: number,
  clientClaim: Record<string, unknown>,
  snapshotComparison?: BotPreview["snapshotComparison"]
): BotPreview {
  const base: Pick<BotPreview, "snapshotComparison"> = { snapshotComparison };

  switch (type) {
    case "streak_missing": {
      if (status === "auto_fixed") {
        return {
          summary: `Racha corregida automáticamente (claimed: ${claimedStreak})`,
          userMessageEs: `¡Tu racha fue restaurada! El sistema detectó una pequeña diferencia y la corrigió de forma automática. Tu racha no disminuirá.`,
          userMessageEn: `Your streak has been restored! The system detected a small discrepancy and fixed it automatically. Your streak is safe.`,
          action: "auto_fixed",
          ...base,
        };
      }
      return {
        summary: `Racha perdida — requiere revisión manual`,
        userMessageEs: `Hola, recibimos tu reporte sobre tu racha. La diferencia detectada es demasiado grande para una corrección automática, por lo que un moderador revisará tu caso pronto. Gracias por reportarlo.`,
        userMessageEn: `Hello, we received your streak report. The detected difference is too large for an automatic fix, so a moderator will review your case soon. Thank you for reporting it.`,
        action: "needs_human",
        ...base,
      };
    }
    case "devotional_not_counted": {
      if (status === "auto_fixed") {
        return {
          summary: `Devocional reconocido automáticamente`,
          userMessageEs: `Tu devocional fue registrado correctamente. Si el conteo no se refleja de inmediato, cierra y abre la app.`,
          userMessageEn: `Your devotional was registered correctly. If the count doesn't show immediately, close and reopen the app.`,
          action: "auto_fixed",
          ...base,
        };
      }
      return {
        summary: `Devocional no contado — requiere revisión`,
        userMessageEs: `Recibimos tu reporte. No encontramos una forma automática de verificar tu devocional del día indicado. Un moderador revisará tu caso. Gracias.`,
        userMessageEn: `We received your report. We couldn't automatically verify your devotional for the indicated day. A moderator will review your case. Thank you.`,
        action: "needs_human",
        ...base,
      };
    }
    case "audio_tts": {
      const issue = (clientClaim.issue as string) || "unknown";
      const device = (clientClaim.device as string) || "no especificado";
      const os = (clientClaim.os as string) || "no especificado";
      const ttsVoiceName = (clientClaim.ttsVoiceName as string) || "";
      const ttsVoiceIdentifier = (clientClaim.ttsVoiceIdentifier as string) || "";
      const ttsNeedsUserAction = !!(clientClaim.ttsNeedsUserAction);
      const ttsVoiceScore = typeof clientClaim.ttsVoiceScore === "number" ? clientClaim.ttsVoiceScore : null;

      // voz_rara: special case — provide iOS voice install steps, never auto-fix
      if (issue === "voz_rara") {
        const voiceInfo = ttsVoiceName
          ? `Voz seleccionada: "${ttsVoiceName}"${ttsVoiceScore !== null ? ` (score: ${ttsVoiceScore})` : ""}.`
          : "No se pudo detectar la voz del dispositivo.";

        const userMessageEs =
          `Hola 👋 Recibimos tu reporte sobre la voz de narración. ` +
          `Esta app usa las voces nativas de iOS, y algunos dispositivos no tienen instalada una voz de alta calidad en español.\n\n` +
          `📲 *Para instalar una mejor voz:*\n` +
          `1. Ve a Ajustes → Accesibilidad → Contenido hablado → Voces\n` +
          `2. Elige *Español (México)* o *Español (Latinoamérica)*\n` +
          `3. Descarga *"Paulina"* (o la mejor voz disponible) y actívala\n` +
          `4. Cierra completamente la app y vuelve a abrirla\n\n` +
          `Si después de esto la voz sigue sonando rara, mándanos una grabación de pantalla corta junto con tu versión de iOS y modelo de iPhone. Con gusto lo revisamos.`;

        const userMessageEn =
          `Hi 👋 We received your report about the narration voice. ` +
          `This app uses iOS native voices, and some devices don't have a high-quality Spanish voice installed.\n\n` +
          `📲 *To install a better voice:*\n` +
          `1. Go to Settings → Accessibility → Spoken Content → Voices\n` +
          `2. Choose *Spanish (Mexico)* or *Spanish (Latin America)*\n` +
          `3. Download *"Paulina"* (or the best available voice) and enable it\n` +
          `4. Fully close the app and reopen it\n\n` +
          `If the voice still sounds robotic after this, send us a short screen recording along with your iOS version and iPhone model.`;

        return {
          summary: `Audio/TTS: voz_rara (${os}) | voz: ${ttsVoiceName || "?"} | score: ${ttsVoiceScore ?? "?"} | needsAction: ${ttsNeedsUserAction}`,
          userMessageEs,
          userMessageEn,
          action: "info_only",
          ...base,
        };
      }

      // Standard audio issues
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
        ...base,
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
        ...base,
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
        ...base,
      };
    }
    default:
      return {
        summary: "Ticket recibido",
        userMessageEs: "Tu reporte fue recibido y será revisado.",
        userMessageEn: "Your report has been received and will be reviewed.",
        action: "info_only",
        ...base,
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

    // Use CR today as the ticket reference date (for snapshot lookup)
    const ticketDateCR = getCRDateString(0);

    // Find the best snapshot at or before today
    const snapshot = await getBestSnapshotForUser(userId, ticketDateCR);

    const beforeState = JSON.stringify({
      streakCurrent: user.streakCurrent,
      devotionalsCompleted: user.devotionalsCompleted,
    });

    let status: TicketStatus = "open";
    let resolutionNote: string | null = null;
    let afterState = beforeState;
    let escalationReason = "No auto-fix attempted";

    // Build snapshot comparison for admin display
    const snapshotComparison: BotPreview["snapshotComparison"] = {
      snapshotDate: snapshot?.snapshotDate ?? null,
      snapshotId: snapshot?.id ?? null,
      snapshotStreak: snapshot?.streak ?? null,
      currentStreak: user.streakCurrent,
      claimedStreak,
      diffDays: snapshot ? Math.abs(snapshot.streak - claimedStreak) : null,
      devotionalTodayCR: false, // set below for devotional tickets
      lastDevotionalDate: snapshot?.lastDevotionalDateCompleted ?? null,
      escalationReason: "",
    };

    // Auto-fix logic: only for streak_missing and devotional_not_counted
    if (type === "streak_missing" || type === "devotional_not_counted") {
      if (!snapshot) {
        status = "needs_human";
        escalationReason = "No snapshot found for this user";
        resolutionNote = `Sin snapshot disponible para verificación. Revisión manual requerida.`;
        console.warn(`[Support] Ticket for ${userId}: no snapshot found. Escalating.`);
      } else {
        const snapshotStreak = snapshot.streak;
        const diff = Math.abs(snapshotStreak - claimedStreak);

        if (type === "streak_missing") {
          if (snapshotStreak >= 1 && diff <= 1) {
            // Safe: restore to the higher of snapshot vs current
            const newStreak = Math.max(snapshotStreak, user.streakCurrent);
            await prisma.user.update({
              where: { id: userId },
              data: {
                streakCurrent: newStreak,
                ...(newStreak > user.streakCurrent ? {} : {}),
              },
            });
            afterState = JSON.stringify({
              streakCurrent: newStreak,
              devotionalsCompleted: user.devotionalsCompleted,
            });
            status = "auto_fixed";
            escalationReason = "";
            resolutionNote = `Auto-corregido con snapshot del ${snapshot.snapshotDate}. Snapshot=${snapshotStreak}, claimed=${claimedStreak}, aplicado=${newStreak}.`;
            console.log(`[Support] Auto-fixed streak for ${userId}: ${user.streakCurrent}→${newStreak}`);
          } else {
            status = "needs_human";
            escalationReason =
              snapshotStreak < 1
                ? `Snapshot streak is 0 (user had no streak at snapshot time)`
                : `Diff too large: snapshot=${snapshotStreak}, claimed=${claimedStreak}, diff=${diff}`;
            resolutionNote = `Snapshot del ${snapshot.snapshotDate}: racha=${snapshotStreak}, reclamado=${claimedStreak}, diff=${diff}. Requiere revisión.`;
            console.warn(`[Support] Ticket ${userId}: diff=${diff}, escalating.`);
          }
        } else {
          // devotional_not_counted: check if snapshot's lastDevotionalDate matches claimedDate
          const snapshotDevDate = snapshot.lastDevotionalDateCompleted;
          const todayCompletion = await prisma.devotionalCompletion.findFirst({
            where: { userId, devotionalDate: claimedDate },
          });

          snapshotComparison.devotionalTodayCR = !!todayCompletion;

          if (todayCompletion) {
            // DB already has the completion — no need to do anything
            status = "auto_fixed";
            escalationReason = "";
            resolutionNote = `Devocional del ${claimedDate} ya registrado en la base de datos.`;
          } else if (snapshotDevDate === claimedDate) {
            // Snapshot shows devotional was done that day — idempotently create the completion
            await prisma.devotionalCompletion.upsert({
              where: { userId_devotionalDate: { userId, devotionalDate: claimedDate } },
              create: { userId, devotionalDate: claimedDate, completedAt: new Date() },
              update: {},
            });
            afterState = JSON.stringify({
              streakCurrent: user.streakCurrent,
              devotionalsCompleted: user.devotionalsCompleted + 1,
            });
            status = "auto_fixed";
            escalationReason = "";
            resolutionNote = `Devocional del ${claimedDate} verificado por snapshot (${snapshot.snapshotDate}) y registrado.`;
            console.log(`[Support] Auto-fixed devotional for ${userId} on ${claimedDate}`);
          } else {
            status = "needs_human";
            escalationReason =
              !snapshotDevDate
                ? `Snapshot no tiene fecha de devocional registrada`
                : `Snapshot lastDevotionalDate=${snapshotDevDate} no coincide con claimedDate=${claimedDate}`;
            resolutionNote = `Snapshot del ${snapshot.snapshotDate}: lastDev=${snapshotDevDate ?? "null"}, reclamado=${claimedDate}. Sin evidencia para auto-corregir.`;
            console.warn(`[Support] Devotional ticket ${userId}: evidence mismatch, escalating.`);
          }
        }
      }
    } else {
      // For audio/notification/reward_drop: always needs_human
      status = "needs_human";
      escalationReason = `${type} — no auto-fix available`;
      resolutionNote = `Problema tipo ${type} reportado. En espera de revisión de moderador.`;
    }

    snapshotComparison.escalationReason = escalationReason;

    const botPreview = buildBotPreview(
      type as TicketType,
      status,
      resolutionNote,
      claimedStreak,
      clientClaim as Record<string, unknown>,
      snapshotComparison
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
        snapshotDate: snapshot?.snapshotDate ?? null,
        snapshotId: snapshot?.id ?? null,
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
        snapshotDate: ticket.snapshotDate,
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
      snapshotDate: true,
      snapshotId: true,
      createdAt: true,
    },
  });

  const today = getCRDateString(0);

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

      // Get the snapshot that was attached at creation time (stable reference)
      // If no snapshotId stored, fall back to a fresh lookup for display purposes
      let displaySnapshot: {
        id: string;
        snapshotDate: string;
        streak: number;
        lastDevotionalDateCompleted: string | null;
        totalDevotionalsCompleted: number;
      } | null = null;

      if (ticket.snapshotId) {
        displaySnapshot = await getSnapshotById(ticket.snapshotId);
      }
      if (!displaySnapshot) {
        // Fallback: find best snapshot at or before ticket creation date
        const ticketDateCR = ticket.createdAt.toISOString().split("T")[0]!;
        displaySnapshot = await getBestSnapshotForUser(ticket.userId, ticketDateCR);
      }

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
        const actions = JSON.parse(user?.dailyActions ?? "{}") as Record<string, unknown>;
        if (typeof actions.notificationsEnabled === "boolean") {
          notificationsEnabled = actions.notificationsEnabled;
        }
        if (typeof actions.notificationsHour === "number") {
          notificationsHour = actions.notificationsHour;
        }
      } catch { /* ignore */ }

      const systemSnapshot = {
        nickname: user?.nickname ?? ticket.userId.slice(0, 12),
        avatarId: user?.avatarId,
        country: user?.countryCode,
        currentStreak: user?.streakCurrent,
        // Snapshot linked at ticket creation
        linkedSnapshotId: displaySnapshot?.id ?? null,
        linkedSnapshotDate: displaySnapshot?.snapshotDate ?? null,
        linkedSnapshotStreak: displaySnapshot?.streak ?? null,
        linkedSnapshotDevDate: displaySnapshot?.lastDevotionalDateCompleted ?? null,
        // Legacy fields kept for UI compat
        lastSnapshotDate: displaySnapshot?.snapshotDate,
        lastSnapshotStreak: displaySnapshot?.streak,
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
        parsedClientClaim = JSON.parse(ticket.clientClaim || "{}") as Record<string, unknown>;
      } catch {}

      // Rebuild botPreview for old tickets that have no snapshotComparison
      if (!parsedBotPreview?.summary) {
        parsedBotPreview = buildBotPreview(
          ticket.type as TicketType,
          ticket.status as TicketStatus,
          ticket.resolutionNote ?? null,
          ticket.claimedStreak,
          parsedClientClaim
        );
      }

      // Inject live snapshotComparison if missing (old tickets)
      if (parsedBotPreview && !parsedBotPreview.snapshotComparison && displaySnapshot) {
        parsedBotPreview.snapshotComparison = {
          snapshotDate: displaySnapshot.snapshotDate,
          snapshotId: displaySnapshot.id,
          snapshotStreak: displaySnapshot.streak,
          currentStreak: user?.streakCurrent ?? 0,
          claimedStreak: ticket.claimedStreak,
          diffDays: Math.abs(displaySnapshot.streak - ticket.claimedStreak),
          devotionalTodayCR: !!todayCompletion,
          lastDevotionalDate: displaySnapshot.lastDevotionalDateCompleted,
          escalationReason: ticket.resolutionNote ?? "",
        };
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

// POST /api/support/admin/compensate
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

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      return c.json({ success: false, error: "Target user not found" }, 404);
    }

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

    await prisma.userGift.create({
      data: { userId: targetUserId, giftDropId: giftDrop.id, status: "PENDING" },
    });

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "closed",
        resolutionNote: `Compensado con regalo ${giftDrop.id} por admin ${adminUserId}`,
      },
    });

    console.log(`[Support] Compensate: admin ${adminUserId} → gift ${giftDrop.id} for ${targetUserId} (ticket ${ticketId})`);
    return c.json({ success: true, giftDropId: giftDrop.id });
  }
);

// PATCH /api/support/admin/tickets/:id/resolve — manually resolve or reject a ticket
supportRouter.patch(
  "/admin/tickets/:id/resolve",
  requireRole("MODERATOR"),
  zValidator(
    "json",
    z.object({
      resolution: z.enum(["resolved", "rejected"]),
      note: z.string().max(500).optional(),
      // For streak resolution: optionally specify the streak to apply
      applyStreak: z.number().int().min(0).optional(),
    })
  ),
  async (c) => {
    const ticketId = c.req.param("id");
    const { resolution, note, applyStreak } = c.req.valid("json");
    const adminUserId = c.req.header("X-User-Id") ?? "unknown";

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, userId: true, type: true, snapshotId: true, claimedStreak: true, claimedDate: true },
    });
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    if (ticket.status === "closed") return c.json({ success: false, error: "Ticket already closed" }, 400);

    let appliedChange: string | null = null;

    if (resolution === "resolved") {
      // For streak tickets: apply a safe restore if requested
      if (
        (ticket.type === "streak_missing") &&
        applyStreak !== undefined &&
        applyStreak > 0
      ) {
        const user = await prisma.user.findUnique({
          where: { id: ticket.userId },
          select: { streakCurrent: true, streakBest: true },
        });
        if (user) {
          // Only increase streak, never decrease it via this path
          const safeStreak = Math.max(applyStreak, user.streakCurrent);
          const newBest = Math.max(safeStreak, user.streakBest);
          await prisma.user.update({
            where: { id: ticket.userId },
            data: { streakCurrent: safeStreak, streakBest: newBest },
          });
          appliedChange = `Racha corregida manualmente: ${user.streakCurrent}→${safeStreak}`;
          console.log(`[Support] Manual streak fix for ${ticket.userId}: ${user.streakCurrent}→${safeStreak}`);
        }
      }

      // For devotional tickets: idempotently add the completion record
      if (ticket.type === "devotional_not_counted" && ticket.claimedDate) {
        const existing = await prisma.devotionalCompletion.findFirst({
          where: { userId: ticket.userId, devotionalDate: ticket.claimedDate },
        });
        if (!existing) {
          await prisma.devotionalCompletion.upsert({
            where: { userId_devotionalDate: { userId: ticket.userId, devotionalDate: ticket.claimedDate } },
            create: { userId: ticket.userId, devotionalDate: ticket.claimedDate, completedAt: new Date() },
            update: {},
          });
          appliedChange = `Devocional del ${ticket.claimedDate} registrado manualmente`;
          console.log(`[Support] Manual devotional fix for ${ticket.userId} on ${ticket.claimedDate}`);
        } else {
          appliedChange = `Devocional del ${ticket.claimedDate} ya existía`;
        }
      }
    }

    const resolutionNote =
      resolution === "resolved"
        ? `Resuelto manualmente por admin ${adminUserId}${appliedChange ? ". " + appliedChange : ""}${note ? ". Nota: " + note : ""}`
        : `Rechazado por admin ${adminUserId}${note ? ". Motivo: " + note : ""}`;

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "closed", resolutionNote },
    });

    console.log(`[Support] Ticket ${ticketId} ${resolution} by admin ${adminUserId}`);
    return c.json({ success: true, appliedChange });
  }
);

export { supportRouter };
