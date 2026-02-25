// seed-badges.ts — seeds badge StoreItems and auto-awards earned badges to all users
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BADGE_DEFINITIONS = [
  { id: 'badge_primer_paso', nameEn: 'First Step',        nameEs: 'Primer Paso',          descEn: 'Completed your first devotional', descEs: 'Completaste tu primer devocional',  rarity: 'common', icon: '🌱', milestoneType: 'devotionals', milestoneValue: 1     },
  { id: 'badge_semana',      nameEn: 'Week of Light',     nameEs: 'Semana de Luz',         descEn: '7 devotionals completed',         descEs: '7 devocionales completados',         rarity: 'common', icon: '📖', milestoneType: 'devotionals', milestoneValue: 7     },
  { id: 'badge_30_dias',     nameEn: 'Flame Keeper',      nameEs: 'Guardián de la Llama',  descEn: '30 devotionals completed',        descEs: '30 devocionales completados',        rarity: 'rare',   icon: '🕯️', milestoneType: 'devotionals', milestoneValue: 30    },
  { id: 'badge_100_dias',    nameEn: 'Centurion of Faith',nameEs: 'Centurión de Fe',       descEn: '100 devotionals completed',       descEs: '100 devocionales completados',       rarity: 'epic',   icon: '✨',  milestoneType: 'devotionals', milestoneValue: 100   },
  { id: 'badge_racha_7',     nameEn: 'On Fire',           nameEs: 'En Llamas',             descEn: '7-day streak',                    descEs: 'Racha de 7 días',                    rarity: 'common', icon: '🔥', milestoneType: 'streak',      milestoneValue: 7     },
  { id: 'badge_racha_30',    nameEn: 'Unstoppable',       nameEs: 'Imparable',             descEn: '30-day streak',                   descEs: 'Racha de 30 días',                   rarity: 'rare',   icon: '⚡', milestoneType: 'streak',      milestoneValue: 30    },
  { id: 'badge_1000_pts',    nameEn: 'Silver Seeker',     nameEs: 'Buscador de Plata',     descEn: 'Reached 1,000 points',            descEs: 'Alcanzaste 1,000 puntos',            rarity: 'common', icon: '🪙', milestoneType: 'points',      milestoneValue: 1000  },
  { id: 'badge_10000_pts',   nameEn: 'Gold Pilgrim',      nameEs: 'Peregrino de Oro',      descEn: 'Reached 10,000 points',           descEs: 'Alcanzaste 10,000 puntos',           rarity: 'rare',   icon: '👑', milestoneType: 'points',      milestoneValue: 10000 },
  { id: 'badge_50000_pts',   nameEn: 'Diamond Faithful',  nameEs: 'Fiel de Diamante',      descEn: 'Reached 50,000 points',           descEs: 'Alcanzaste 50,000 puntos',           rarity: 'epic',   icon: '💎', milestoneType: 'points',      milestoneValue: 50000 },
] as const;

export async function seedBadges() {
  try {
    // 1. Upsert all badge StoreItems
    let sortOrder = 9000; // high to stay at the end
    for (const b of BADGE_DEFINITIONS) {
      await prisma.storeItem.upsert({
        where: { id: b.id },
        update: {},
        create: {
          id: b.id,
          type: 'badge',
          nameEn: b.nameEn,
          nameEs: b.nameEs,
          descriptionEn: b.descEn,
          descriptionEs: b.descEs,
          pricePoints: 0,
          rarity: b.rarity,
          assetRef: b.id,
          metadata: JSON.stringify({ icon: b.icon, milestoneType: b.milestoneType, milestoneValue: b.milestoneValue }),
          sortOrder: sortOrder++,
          available: true,
        },
      });
    }
    console.log(`[Badges] Seeded ${BADGE_DEFINITIONS.length} badge store items`);

    // 2. Auto-award badges to all existing users based on their current stats
    const users = await prisma.user.findMany({
      select: { id: true, devotionalsCompleted: true, streakBest: true, points: true, activeBadgeId: true },
    });

    let awarded = 0;
    for (const user of users) {
      const toAward: string[] = [];

      for (const badge of BADGE_DEFINITIONS) {
        let qualifies = false;
        if (badge.milestoneType === 'devotionals' && user.devotionalsCompleted >= badge.milestoneValue) qualifies = true;
        if (badge.milestoneType === 'streak'      && user.streakBest >= badge.milestoneValue)           qualifies = true;
        if (badge.milestoneType === 'points'      && user.points >= badge.milestoneValue)               qualifies = true;

        if (qualifies) {
          // upsert into inventory (idempotent)
          await prisma.userInventory.upsert({
            where: { userId_itemId: { userId: user.id, itemId: badge.id } },
            update: {},
            create: { userId: user.id, itemId: badge.id, source: 'achievement' },
          });
          toAward.push(badge.id);
          awarded++;
        }
      }

      // Auto-set activeBadgeId to the highest-rarity badge if not already set
      if (!user.activeBadgeId && toAward.length > 0) {
        const rarityOrder = ['epic', 'rare', 'common'];
        const bestBadge = BADGE_DEFINITIONS
          .filter(b => toAward.includes(b.id))
          .sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity))[0];
        if (bestBadge) {
          await prisma.user.update({
            where: { id: user.id },
            data: { activeBadgeId: bestBadge.id },
          });
        }
      }
    }

    console.log(`[Badges] Auto-awarded ${awarded} badge(s) across ${users.length} user(s)`);
  } catch (err) {
    console.error('[Badges] Seeding error:', err);
  }
}

// Helper: check and award new badges for a single user after a stat update
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { devotionalsCompleted: true, streakBest: true, streakCurrent: true, points: true, activeBadgeId: true },
    });
    if (!user) return [];

    const newlyAwarded: string[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      let qualifies = false;
      if (badge.milestoneType === 'devotionals' && user.devotionalsCompleted >= badge.milestoneValue) qualifies = true;
      if (badge.milestoneType === 'streak'      && Math.max(user.streakBest, user.streakCurrent) >= badge.milestoneValue) qualifies = true;
      if (badge.milestoneType === 'points'      && user.points >= badge.milestoneValue)               qualifies = true;

      if (qualifies) {
        const result = await prisma.userInventory.upsert({
          where: { userId_itemId: { userId, itemId: badge.id } },
          update: {},
          create: { userId, itemId: badge.id, source: 'achievement' },
        });
        // Track if this is newly created (not just updated)
        if ((result as any)._count !== undefined || result.acquiredAt > new Date(Date.now() - 5000)) {
          newlyAwarded.push(badge.id);
        }
      }
    }

    return newlyAwarded;
  } catch {
    return [];
  }
}
