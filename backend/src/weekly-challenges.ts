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
  // ── Traditional challenges ──────────────────────────────────────────────────
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

// Duel challenge templates — always included every week (2 selected)
const DUEL_CHALLENGE_TEMPLATES = [
  {
    type: 'duel_play',
    goalCount: 1,
    rewardPoints: 50,
    titleEn: 'First Duel',
    titleEs: 'Primer Duelo',
    descriptionEn: 'Play your first duel this week',
    descriptionEs: 'Juega tu primer duelo esta semana',
  },
  {
    type: 'duel_play',
    goalCount: 5,
    rewardPoints: 120,
    titleEn: 'Biblical Training',
    titleEs: 'Entrenamiento Bíblico',
    descriptionEn: 'Play 5 duels this week',
    descriptionEs: 'Juega 5 duelos esta semana',
  },
  {
    type: 'duel_win',
    goalCount: 3,
    rewardPoints: 150,
    titleEn: 'Apprentice Duelist',
    titleEs: 'Duelista Aprendiz',
    descriptionEn: 'Win 3 duels this week',
    descriptionEs: 'Gana 3 duelos esta semana',
  },
  {
    type: 'duel_play',
    goalCount: 10,
    rewardPoints: 200,
    titleEn: 'Knowledge in Action',
    titleEs: 'Conocimiento en Acción',
    descriptionEn: 'Play 10 duels this week',
    descriptionEs: 'Juega 10 duelos esta semana',
  },
  {
    type: 'duel_win',
    goalCount: 5,
    rewardPoints: 250,
    titleEn: 'Biblical Strategist',
    titleEs: 'Estratega Bíblico',
    descriptionEn: 'Win 5 duels this week',
    descriptionEs: 'Gana 5 duelos esta semana',
  },
  {
    type: 'duel_win_streak',
    goalCount: 3,
    rewardPoints: 300,
    titleEn: 'Wisdom Streak',
    titleEs: 'Racha de Sabiduría',
    descriptionEn: 'Win 3 duels in a row',
    descriptionEs: 'Gana 3 duelos consecutivos',
  },
  {
    type: 'duel_play',
    goalCount: 20,
    rewardPoints: 350,
    titleEn: 'Duel Master',
    titleEs: 'Maestro del Duelo',
    descriptionEn: 'Play 20 duels this week',
    descriptionEs: 'Juega 20 duelos esta semana',
  },
  {
    type: 'duel_win',
    goalCount: 10,
    rewardPoints: 500,
    titleEn: 'Weekly Champion',
    titleEs: 'Campeón Semanal',
    descriptionEn: 'Win 10 duels this week',
    descriptionEs: 'Gana 10 duelos esta semana',
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

  // Select 2 traditional (different types) + 2 duel (different types) = 4 total
  const shuffledTraditional = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const shuffledDuel = [...DUEL_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);

  const pickDistinct = (pool: typeof CHALLENGE_TEMPLATES, count: number) => {
    const picked: typeof CHALLENGE_TEMPLATES = [];
    const usedTypes = new Set<string>();
    for (const t of pool) {
      if (picked.length >= count) break;
      if (!usedTypes.has(t.type)) {
        picked.push(t);
        usedTypes.add(t.type);
      }
    }
    // Fill remaining slots even if types overlap
    for (const t of pool) {
      if (picked.length >= count) break;
      if (!picked.includes(t)) picked.push(t);
    }
    return picked;
  };

  const selected = [
    ...pickDistinct(shuffledTraditional, 2),
    ...pickDistinct(shuffledDuel, 2),
  ];

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
