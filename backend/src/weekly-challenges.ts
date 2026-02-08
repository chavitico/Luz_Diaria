import { prisma } from './prisma';

// ISO week calculation
export function getCurrentWeekId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((dayOfYear + oneJan.getDay() + 1) / 7);
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

// Get start of current week (Monday 00:00 UTC)
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
  return monday;
}

// Get end of current week (Sunday 23:59:59 UTC)
export function getWeekEnd(): Date {
  const start = getWeekStart();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

// Challenge templates
const CHALLENGE_TEMPLATES = [
  {
    type: 'devotional_complete',
    goalCount: 5,
    rewardPoints: 200,
    titleEn: 'Weekly Reader',
    titleEs: 'Lector Semanal',
    descriptionEn: 'Complete 5 devotionals this week',
    descriptionEs: 'Completa 5 devocionales esta semana',
  },
  {
    type: 'devotional_complete',
    goalCount: 7,
    rewardPoints: 350,
    titleEn: 'Perfect Week',
    titleEs: 'Semana Perfecta',
    descriptionEn: 'Complete all 7 devotionals this week',
    descriptionEs: 'Completa los 7 devocionales de esta semana',
  },
  {
    type: 'share',
    goalCount: 3,
    rewardPoints: 150,
    titleEn: 'Light Sharer',
    titleEs: 'Compartidor de Luz',
    descriptionEn: 'Share the devotional 3 times this week',
    descriptionEs: 'Comparte el devocional 3 veces esta semana',
  },
  {
    type: 'share',
    goalCount: 5,
    rewardPoints: 250,
    titleEn: 'Spreading Joy',
    titleEs: 'Esparciendo Alegría',
    descriptionEn: 'Share the devotional 5 times this week',
    descriptionEs: 'Comparte el devocional 5 veces esta semana',
  },
  {
    type: 'prayer',
    goalCount: 5,
    rewardPoints: 200,
    titleEn: 'Faithful Prayer',
    titleEs: 'Oración Fiel',
    descriptionEn: 'Confirm prayer 5 times this week',
    descriptionEs: 'Confirma tu oración 5 veces esta semana',
  },
  {
    type: 'prayer',
    goalCount: 7,
    rewardPoints: 400,
    titleEn: 'Prayer Warrior',
    titleEs: 'Guerrero de Oración',
    descriptionEn: 'Confirm prayer every day this week',
    descriptionEs: 'Confirma tu oración todos los días de esta semana',
  },
];

export async function generateWeeklyChallenges(): Promise<void> {
  const weekId = getCurrentWeekId();
  const startDate = getWeekStart();
  const endDate = getWeekEnd();

  console.log(`[Challenges] Checking challenges for week ${weekId}`);

  // Check if challenges exist for this week
  const existingChallenges = await prisma.weeklyChallenge.findMany({
    where: { weekId },
  });

  if (existingChallenges.length > 0) {
    console.log(`[Challenges] Challenges already exist for week ${weekId}`);
    return;
  }

  // Select 2 random challenges (different types if possible)
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected: typeof CHALLENGE_TEMPLATES = [];
  const usedTypes = new Set<string>();

  for (const template of shuffled) {
    if (selected.length >= 2) break;
    if (!usedTypes.has(template.type) || selected.length === 1) {
      selected.push(template);
      usedTypes.add(template.type);
    }
  }

  // Create challenges
  for (let i = 0; i < selected.length; i++) {
    const template = selected[i];
    if (!template) continue;

    await prisma.weeklyChallenge.create({
      data: {
        weekId,
        challengeIndex: i,
        type: template.type,
        goalCount: template.goalCount,
        rewardPoints: template.rewardPoints,
        titleEn: template.titleEn,
        titleEs: template.titleEs,
        descriptionEn: template.descriptionEn,
        descriptionEs: template.descriptionEs,
        startDate,
        endDate,
      },
    });
  }

  console.log(`[Challenges] Created ${selected.length} challenges for week ${weekId}`);
}

// Initialize challenges on app start
export async function initializeWeeklyChallenges(): Promise<void> {
  try {
    await generateWeeklyChallenges();
  } catch (error) {
    console.error('[Challenges] Failed to initialize weekly challenges:', error);
  }
}
