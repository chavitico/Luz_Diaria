import { prisma } from "./prisma";
import { env } from "./env";

// Topics for devotionals - cycles through these
const TOPICS = [
  { en: "Faith", es: "Fe" },
  { en: "Love", es: "Amor" },
  { en: "Hope", es: "Esperanza" },
  { en: "Peace", es: "Paz" },
  { en: "Joy", es: "Gozo" },
  { en: "Patience", es: "Paciencia" },
  { en: "Kindness", es: "Bondad" },
  { en: "Forgiveness", es: "Perdón" },
  { en: "Gratitude", es: "Gratitud" },
  { en: "Courage", es: "Valentía" },
  { en: "Trust", es: "Confianza" },
  { en: "Humility", es: "Humildad" },
  { en: "Wisdom", es: "Sabiduría" },
  { en: "Perseverance", es: "Perseverancia" },
  { en: "Compassion", es: "Compasión" },
  { en: "Grace", es: "Gracia" },
  { en: "Mercy", es: "Misericordia" },
  { en: "Obedience", es: "Obediencia" },
  { en: "Holiness", es: "Santidad" },
  { en: "Faithfulness", es: "Fidelidad" },
  { en: "Surrender", es: "Rendición" },
  { en: "Purpose", es: "Propósito" },
  { en: "Renewal", es: "Renovación" },
  { en: "Restoration", es: "Restauración" },
  { en: "Salvation", es: "Salvación" },
  { en: "Redemption", es: "Redención" },
  { en: "Praise", es: "Alabanza" },
  { en: "Worship", es: "Adoración" },
  { en: "Prayer", es: "Oración" },
  { en: "Community", es: "Comunidad" },
  { en: "Service", es: "Servicio" },
];

// Devotional images from Unsplash
const IMAGES = [
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80", // Sunrise over mountains
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80", // Golden field
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80", // Misty forest
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80", // Sunlight through trees
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80", // Ocean waves
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80", // Flowers
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80", // Mountain valley
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80", // Lake reflection
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80", // Waterfall
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", // Mountain sunrise
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80", // Forest path
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80", // Valley view
];

function getTodayDate(): string {
  // Use Costa Rica timezone (UTC-6) to get today's date
  const now = new Date();
  const costaRicaDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  const year = costaRicaDate.getFullYear();
  const month = String(costaRicaDate.getMonth() + 1).padStart(2, "0");
  const day = String(costaRicaDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTopicForDate(date: string): { en: string; es: string } {
  const dayOfYear = Math.floor(
    (new Date(date).getTime() - new Date(new Date(date).getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const topic = TOPICS[dayOfYear % TOPICS.length];
  return topic!;
}

function getImageForDate(date: string): string {
  const dayOfYear = Math.floor(
    (new Date(date).getTime() - new Date(new Date(date).getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const image = IMAGES[dayOfYear % IMAGES.length];
  return image!;
}

interface DevotionalContent {
  title: string;
  titleEs: string;
  bibleVerse: string;
  bibleVerseEs: string;
  bibleReference: string;
  bibleReferenceEs: string;
  reflection: string;
  reflectionEs: string;
  story: string;
  storyEs: string;
  biblicalCharacter: string;
  biblicalCharacterEs: string;
  application: string;
  applicationEs: string;
  prayer: string;
  prayerEs: string;
}

// Counter to track story style variation (persisted in-memory per server session)
let storyGenerationCount = 0;

async function generateDevotionalWithAI(topic: { en: string; es: string }): Promise<DevotionalContent> {
  storyGenerationCount++;

  // Determine story style variation based on count
  const useNoName = storyGenerationCount % 5 === 0; // 1 in 5: no names at all
  const useFirstPerson = storyGenerationCount % 10 === 0; // 1 in 10: first person "I felt..."
  const endWithQuestion = storyGenerationCount % 3 === 0; // ~1 in 3: end with a question instead of conclusion

  const storyStyleInstructions = `
STORY STYLE INSTRUCTIONS (follow these exactly):
${useNoName ? `- THIS STORY: Do NOT use any names. Only refer to characters as "una mujer", "un joven", "alguien que…", "ella", "él", etc.` : `- THIS STORY: Use uncommon or rare names (avoid overused names like María, Juan, Pedro, Ana). Consider names like Rebeca, Amara, Tadeo, Elías, Noa, Miriam, Isai, Lía, etc. Or mix a name for one character and descriptions for others.`}
${useFirstPerson ? `- THIS STORY: Write in FIRST PERSON ("Yo sentí…", "Recuerdo cuando…", "Fue una noche que…"). Make it feel like a personal testimony.` : `- THIS STORY: Write in third person, but from deep inside the character's emotional perspective. Prioritize inner emotions over external facts.`}
${endWithQuestion ? `- THIS STORY: Do NOT end with a conclusion or moral lesson. End with a powerful open question that invites the reader to reflect spiritually.` : `- THIS STORY: End with a moment of quiet encounter with God — not a moral lesson, but a felt truth.`}
`;

  const prompt = `You are a Christian devotional writer with a gift for deeply moving, spiritually intimate storytelling. Generate a complete daily devotional about the topic "${topic.en}" / "${topic.es}".

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):

{
  "title": "A compelling title in English (5-8 words)",
  "titleEs": "Same title in Spanish",
  "bibleVerse": "A relevant Bible verse in English with quotes around it",
  "bibleVerseEs": "Same verse in Spanish with quotes",
  "bibleReference": "Book Chapter:Verse in English (e.g., 'Psalm 23:1' or '1 Corinthians 13:4-7')",
  "bibleReferenceEs": "Same reference in Spanish with translated book name (e.g., 'Salmo 23:1' or '1 Corintios 13:4-7')",
  "reflection": "A deep, thoughtful reflection on the theme (3-4 paragraphs, about 200-250 words). Connect the Bible verse to daily life.",
  "reflectionEs": "Same reflection in Spanish",
  "story": "An inspiring story that illustrates the theme (3-4 paragraphs, about 200-250 words). Follow the STORY STYLE INSTRUCTIONS below. Prioritize internal emotions over external events. Write like an intimate testimony, not a documentary. Include at least one powerful phrase that invites spiritual reflection. Make the reader feel accompanied, not instructed. Focus on hope, comfort, living faith, and real encounter with God. Each story must feel unique and memorable.",
  "storyEs": "Same story in Spanish — translate naturally, preserving the emotional and spiritual tone",
  "biblicalCharacter": "A section about a biblical character who exemplified this virtue (2-3 paragraphs, about 150-200 words). Include specific Bible references.",
  "biblicalCharacterEs": "Same section in Spanish",
  "application": "Practical application steps for today (2-3 specific actions the reader can take). Be concrete and actionable.",
  "applicationEs": "Same application in Spanish",
  "prayer": "A heartfelt prayer related to the theme (about 100 words). Make it personal and intimate — a real conversation with God, not a formal prayer.",
  "prayerEs": "Same prayer in Spanish"
}

${storyStyleInstructions}

GLOBAL STORY GUIDELINES (always apply):
- Never repeat the same 3-4 common names across stories
- Prioritize internal emotions and spiritual states over external plot events
- Write as an intimate testimony, not a documentary chronicle
- Avoid long moralistic explanations — trust the reader
- Make the reader feel accompanied, never lectured
- Each story must feel unique, memorable, and touch the heart
- Focus on: hope, consolation, living faith, and real encounter with God
- The reflection and prayer should be deeply spiritual but accessible
- Spanish translations must be natural and emotionally resonant, not literal
- All content must be biblically sound and theologically accurate`;

  console.log(`[Devotional] Generating devotional for topic: ${topic.en}...`);

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
    console.error(`[Devotional] OpenAI API error: ${response.status} - ${errorText}`);
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
    console.error(`[Devotional] No text content in response:`, JSON.stringify(data, null, 2));
    throw new Error("No text content in OpenAI response");
  }

  // Clean the response - remove markdown code blocks if present
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
    const devotionalContent = JSON.parse(cleanedContent) as DevotionalContent;
    console.log(`[Devotional] Successfully generated devotional: "${devotionalContent.title}"`);
    return devotionalContent;
  } catch (parseError) {
    console.error(`[Devotional] Failed to parse JSON:`, cleanedContent.substring(0, 500));
    throw new Error("Failed to parse devotional content as JSON");
  }
}

export async function generateTodayDevotional(): Promise<void> {
  const today = getTodayDate();

  // Check if we already have today's devotional
  const existing = await prisma.devotional.findUnique({
    where: { date: today },
  });

  if (existing) {
    console.log(`[Devotional] Devotional for ${today} already exists: "${existing.title}"`);
    return;
  }

  const topic = getTopicForDate(today);
  const imageUrl = getImageForDate(today);

  try {
    const content = await generateDevotionalWithAI(topic);

    // Use upsert to avoid race conditions on server restart
    await prisma.devotional.upsert({
      where: { date: today },
      update: {}, // Don't update if exists
      create: {
        date: today,
        topic: topic.en,
        topicEs: topic.es,
        imageUrl,
        ...content,
      },
    });

    console.log(`[Devotional] Successfully created devotional for ${today}: "${content.title}"`);
  } catch (error) {
    // Ignore unique constraint errors (race condition from server restart)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      console.log(`[Devotional] Devotional for ${today} was created by another process`);
      return;
    }
    console.error(`[Devotional] Failed to generate devotional for ${today}:`, error);
    throw error;
  }
}

export async function generateDevotionalForDate(date: string): Promise<void> {
  // Check if we already have this devotional
  const existing = await prisma.devotional.findUnique({
    where: { date },
  });

  if (existing) {
    console.log(`[Devotional] Devotional for ${date} already exists: "${existing.title}"`);
    return;
  }

  const topic = getTopicForDate(date);
  const imageUrl = getImageForDate(date);

  try {
    const content = await generateDevotionalWithAI(topic);

    // Use upsert to avoid race conditions on server restart
    await prisma.devotional.upsert({
      where: { date },
      update: {}, // Don't update if exists
      create: {
        date,
        topic: topic.en,
        topicEs: topic.es,
        imageUrl,
        ...content,
      },
    });

    console.log(`[Devotional] Successfully created devotional for ${date}: "${content.title}"`);
  } catch (error) {
    // Ignore unique constraint errors (race condition from server restart)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      console.log(`[Devotional] Devotional for ${date} was created by another process`);
      return;
    }
    console.error(`[Devotional] Failed to generate devotional for ${date}:`, error);
    throw error;
  }
}

export async function getTodayDevotional() {
  const today = getTodayDate();
  return prisma.devotional.findUnique({
    where: { date: today },
  });
}

export async function getDevotionalByDate(date: string) {
  return prisma.devotional.findUnique({
    where: { date },
  });
}

export async function getAllDevotionals() {
  return prisma.devotional.findMany({
    orderBy: { date: "desc" },
  });
}
