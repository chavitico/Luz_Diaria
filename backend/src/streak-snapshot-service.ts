import { prisma } from "./prisma";

function getTodayDateUTC(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]!;
}

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().split("T")[0]!;
}

/**
 * Generate snapshots for ALL users for a given date.
 * Idempotent: upserts by (snapshotDate, userId).
 */
export async function generateStreakSnapshots(snapshotDate: string): Promise<void> {
  console.log(`[StreakSnapshot] Generating snapshots for ${snapshotDate}...`);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      streakCurrent: true,
      dailyActions: true,
      devotionalsCompleted: true,
    },
  });

  let count = 0;
  for (const user of users) {
    let lastDevotionalDateCompleted: string | null = null;
    try {
      const actions = JSON.parse(user.dailyActions || "{}") as Record<string, unknown>;
      if (typeof actions.devotionalDate === "string") {
        lastDevotionalDateCompleted = actions.devotionalDate;
      } else if (Array.isArray(actions.devotionalDates) && actions.devotionalDates.length > 0) {
        const sorted = [...actions.devotionalDates].sort().reverse();
        lastDevotionalDateCompleted = sorted[0] as string;
      }
    } catch {
      // ignore parse error
    }

    await prisma.streakSnapshot.upsert({
      where: {
        snapshotDate_userId: { snapshotDate, userId: user.id },
      },
      create: {
        snapshotDate,
        userId: user.id,
        streak: user.streakCurrent,
        lastDevotionalDateCompleted,
        totalDevotionalsCompleted: user.devotionalsCompleted,
      },
      update: {
        streak: user.streakCurrent,
        lastDevotionalDateCompleted,
        totalDevotionalsCompleted: user.devotionalsCompleted,
      },
    });
    count++;
  }

  // Cleanup: keep only today, yesterday, and day before yesterday (last 3 days)
  // Never delete today
  const today = getTodayDateUTC();
  await prisma.streakSnapshot.deleteMany({
    where: {
      snapshotDate: {
        lt: getDateString(2), // delete anything older than 2 days ago
      },
      NOT: {
        snapshotDate: today,
      },
    },
  });

  console.log(`[StreakSnapshot] Generated ${count} snapshots for ${snapshotDate}`);
}

/**
 * Get the most recent available snapshot for a user (prefers yesterday, falls back to day-before-yesterday).
 */
export async function getLatestSnapshotForUser(userId: string): Promise<{
  snapshotDate: string;
  streak: number;
  lastDevotionalDateCompleted: string | null;
  totalDevotionalsCompleted: number;
} | null> {
  const yesterday = getDateString(1);
  const dayBefore = getDateString(2);

  // Try yesterday first, then day before
  for (const date of [yesterday, dayBefore]) {
    const snap = await prisma.streakSnapshot.findUnique({
      where: { snapshotDate_userId: { snapshotDate: date, userId } },
    });
    if (snap) {
      return {
        snapshotDate: snap.snapshotDate,
        streak: snap.streak,
        lastDevotionalDateCompleted: snap.lastDevotionalDateCompleted,
        totalDevotionalsCompleted: snap.totalDevotionalsCompleted,
      };
    }
  }
  return null;
}
