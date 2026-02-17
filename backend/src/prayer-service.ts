import { prisma } from "./prisma";
import { env } from "./env";

// Prayer categories with translations (must match frontend constants)
const PRAYER_CATEGORIES: Record<string, { en: string; es: string }> = {
  work: { en: "Work / Provision", es: "Trabajo / Provisión" },
  health: { en: "Health", es: "Salud" },
  family: { en: "Family", es: "Familia" },
  peace: { en: "Peace / Anxiety", es: "Paz / Ansiedad" },
  wisdom: { en: "Wisdom / Direction", es: "Sabiduría / Dirección" },
  studies: { en: "Studies", es: "Estudios" },
  restoration: { en: "Restoration", es: "Restauración" },
  gratitude: { en: "Gratitude", es: "Gratitud" },
  salvation: { en: "Salvation", es: "Salvación" },
  strength: { en: "Strength", es: "Fortaleza" },
};

// Get today's date in Costa Rica timezone
function getCostaRicaDateString(): string {
  const now = new Date();
  const costaRicaTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  return costaRicaTime.toISOString().split('T')[0]!;
}

// Get yesterday's date in Costa Rica timezone
function getYesterdayCostaRicaDateString(): string {
  const now = new Date();
  const costaRicaTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  costaRicaTime.setDate(costaRicaTime.getDate() - 1);
  return costaRicaTime.toISOString().split('T')[0]!;
}

// Get current week ID
function getCostaRicaWeekId(): string {
  const now = new Date();
  const costaRicaTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  const startOfYear = new Date(costaRicaTime.getFullYear(), 0, 1);
  const days = Math.floor((costaRicaTime.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${costaRicaTime.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

interface PrayerContent {
  title: string;
  titleEs: string;
  prayerText: string;
  prayerTextEs: string;
}

async function generateDailyPrayerWithAI(
  categoryStats: Record<string, number>,
  nicknames: string[]
): Promise<PrayerContent> {
  // Build category list with counts
  const categoryList = Object.entries(categoryStats)
    .map(([key, count]) => {
      const cat = PRAYER_CATEGORIES[key];
      return cat ? `${cat.en} (${count} requests)` : null;
    })
    .filter(Boolean)
    .join(", ");

  const categoryListEs = Object.entries(categoryStats)
    .map(([key, count]) => {
      const cat = PRAYER_CATEGORIES[key];
      return cat ? `${cat.es} (${count} peticiones)` : null;
    })
    .filter(Boolean)
    .join(", ");

  // Limit nicknames to 10
  const limitedNicknames = nicknames.slice(0, 10);
  const nicknameList = limitedNicknames.length > 0
    ? limitedNicknames.join(", ")
    : null;

  const prompt = `You are a Christian prayer writer. Generate a community prayer for today that includes the prayer needs of the congregation.

${categoryList ? `Today's prayer categories from the community: ${categoryList}` : "No specific prayer requests were submitted today."}
${categoryListEs ? `(Spanish: ${categoryListEs})` : ""}
${nicknameList ? `Some community members who submitted requests: ${nicknameList}` : ""}

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):

{
  "title": "A compelling prayer title in English (4-7 words)",
  "titleEs": "Same title in Spanish",
  "prayerText": "A heartfelt community prayer in English (150-220 words). Address each prayer category mentioned naturally within the prayer. Make it personal, warm, and spiritually encouraging. Reference Bible verses where appropriate. End with 'Amén.'",
  "prayerTextEs": "Same prayer in Spanish, naturally translated (not literal). End with 'Amén.'"
}

Important guidelines:
- The prayer should feel like a pastor or spiritual leader praying over their congregation
- Include each prayer category naturally woven into the prayer
- If nicknames are provided, you may mention 1-3 of them naturally (e.g., "Lord, we lift up Maria and Juan...")
- The tone should be warm, intimate, and full of faith
- If no categories were submitted, generate a generic prayer of gratitude and guidance
- Spanish should be natural Latin American Spanish, not formal Castilian`;

  console.log(`[DailyPrayer] Generating daily prayer with categories: ${categoryList || 'none'}`);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: prompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[DailyPrayer] OpenAI API error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    output?: Array<{
      type: string;
      content?: Array<{ type: string; text?: string }>;
    }>;
  };

  // Extract the text content from the response
  let textContent = "";
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === "message" && item.content) {
        for (const content of item.content) {
          if (content.type === "output_text" && content.text) {
            textContent = content.text;
            break;
          }
        }
      }
    }
  }

  if (!textContent) {
    console.error(`[DailyPrayer] No text content in response:`, JSON.stringify(data, null, 2));
    throw new Error("No text content in OpenAI response");
  }

  // Clean the response
  let cleanedContent = textContent.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.slice(7);
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.slice(3);
  }
  if (cleanedContent.endsWith("```")) {
    cleanedContent = cleanedContent.slice(0, -3);
  }
  cleanedContent = cleanedContent.trim();

  try {
    const prayerContent = JSON.parse(cleanedContent) as PrayerContent;
    console.log(`[DailyPrayer] Successfully generated daily prayer: "${prayerContent.title}"`);
    return prayerContent;
  } catch (parseError) {
    console.error(`[DailyPrayer] Failed to parse JSON:`, cleanedContent.substring(0, 500));
    throw new Error("Failed to parse daily prayer content as JSON");
  }
}

export async function generateTodayDailyPrayer(): Promise<void> {
  const today = getCostaRicaDateString();
  const yesterday = getYesterdayCostaRicaDateString();
  const currentWeekId = getCostaRicaWeekId();

  // Check if we already have today's daily prayer
  const existing = await prisma.dailyPrayer.findUnique({
    where: { dateId: today },
  });

  if (existing) {
    console.log(`[DailyPrayer] Daily prayer for ${today} already exists: "${existing.title}"`);
    return;
  }

  // Fetch prayer requests from:
  // 1. Yesterday's daily requests (periodId = yesterday)
  // 2. Current week's weekly requests (periodId = currentWeekId)
  const requests = await prisma.prayerRequest.findMany({
    where: {
      OR: [
        { periodId: yesterday, mode: "daily" },
        { periodId: currentWeekId, mode: "weekly" },
      ],
    },
    select: {
      categoryKey: true,
      nickname: true,
      displayNameOptIn: true,
    },
  });

  // Aggregate category stats
  const categoryStats: Record<string, number> = {};
  const nicknames: string[] = [];

  for (const request of requests) {
    categoryStats[request.categoryKey] = (categoryStats[request.categoryKey] ?? 0) + 1;
    if (request.displayNameOptIn && request.nickname) {
      nicknames.push(request.nickname);
    }
  }

  const includedCategories = Object.keys(categoryStats);

  try {
    const content = await generateDailyPrayerWithAI(categoryStats, nicknames);

    await prisma.dailyPrayer.upsert({
      where: { dateId: today },
      update: {},
      create: {
        dateId: today,
        title: content.title,
        titleEs: content.titleEs,
        prayerText: content.prayerText,
        prayerTextEs: content.prayerTextEs,
        includedCategories: JSON.stringify(includedCategories),
        categoryStats: JSON.stringify(categoryStats),
        totalRequests: requests.length,
      },
    });

    console.log(`[DailyPrayer] Successfully created daily prayer for ${today}: "${content.title}" (${requests.length} requests)`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      console.log(`[DailyPrayer] Daily prayer for ${today} was created by another process`);
      return;
    }
    console.error(`[DailyPrayer] Failed to generate daily prayer for ${today}:`, error);
    throw error;
  }
}

export async function getTodayDailyPrayer() {
  const today = getCostaRicaDateString();
  const prayer = await prisma.dailyPrayer.findUnique({
    where: { dateId: today },
  });

  if (!prayer) return null;

  return {
    ...prayer,
    includedCategories: JSON.parse(prayer.includedCategories),
    categoryStats: JSON.parse(prayer.categoryStats),
  };
}

export async function getDailyPrayerByDate(dateId: string) {
  const prayer = await prisma.dailyPrayer.findUnique({
    where: { dateId },
  });

  if (!prayer) return null;

  return {
    ...prayer,
    includedCategories: JSON.parse(prayer.includedCategories),
    categoryStats: JSON.parse(prayer.categoryStats),
  };
}
