import { Hono } from "hono";
import { prisma } from "../prisma";

const adminStatsRouter = new Hono();

// GET /api/admin/stats?period=day|week|month|year|all
adminStatsRouter.get("/", async (c) => {
  const requesterId = c.req.header("X-User-Id");
  if (!requesterId) return c.json({ error: "Unauthorized" }, 401);

  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true },
  });
  if (requester?.role !== "OWNER") return c.json({ error: "Forbidden" }, 403);

  const period = c.req.query("period") ?? "all";
  const now = new Date();
  let since: Date | undefined;

  if (period === "day") since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (period === "week") since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (period === "month") since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  else if (period === "year") since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const df = since ? { gte: since } : undefined;

  const [
    nuevosUsuarios,
    visitas,
    tiempoResult,
    devocionales,
    duelosPersona,
    duelosBot,
    estudios,
    puntosAsigResult,
    puntosConsResult,
    sobresTotal,
    sobresGratis,
    onlineUsers,
    totalUsers,
  ] = await Promise.all([
    prisma.user.count({ where: df ? { createdAt: df } : {} }),
    prisma.userSession.count({ where: df ? { startedAt: df } : {} }),
    prisma.userSession.aggregate({
      where: df ? { startedAt: df } : {},
      _sum: { totalSeconds: true },
    }),
    prisma.devotionalCompletion.count({ where: df ? { completedAt: df } : {} }),
    prisma.duelMatch.count({
      where: {
        isBotMatch: false,
        status: "completed",
        ...(df ? { createdAt: df } : {}),
      },
    }),
    prisma.duelMatch.count({
      where: {
        isBotMatch: true,
        status: "completed",
        ...(df ? { createdAt: df } : {}),
      },
    }),
    prisma.pointLedger.count({ where: { type: 'study_complete', ...(df ? { createdAt: df } : {}) } }),
    prisma.pointLedger.aggregate({
      where: { amount: { gt: 0 }, ...(df ? { createdAt: df } : {}) },
      _sum: { amount: true },
    }),
    prisma.pointLedger.aggregate({
      where: { amount: { lt: 0 }, ...(df ? { createdAt: df } : {}) },
      _sum: { amount: true },
    }),
    prisma.pointLedger.count({
      where: { type: 'pack_open', ...(df ? { createdAt: df } : {}) },
    }),
    prisma.pointLedger.count({
      where: {
        type: 'pack_open',
        metadata: { contains: '"free"' },
        ...(df ? { createdAt: df } : {}),
      },
    }),
    prisma.user.findMany({
      where: { lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      select: {
        id: true,
        nickname: true,
        role: true,
        countryCode: true,
        lastSeenAt: true,
      },
      orderBy: { lastSeenAt: "desc" },
      take: 30,
    }),
    prisma.user.count(),
  ]);

  return c.json({
    period,
    stats: {
      nuevosUsuarios,
      totalUsers,
      visitas,
      tiempoAppSeconds: tiempoResult._sum.totalSeconds ?? 0,
      devocionales,
      duelosPersona,
      duelosBot,
      estudios,
      puntosAsignados: puntosAsigResult._sum.amount ?? 0,
      puntosConsumidos: Math.abs(puntosConsResult._sum.amount ?? 0),
      sobresTotal,
      sobresGratis,
    },
    onlineUsers,
  });
});

export { adminStatsRouter };
