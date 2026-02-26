import { Hono } from "hono";
import {
  generateTodayDevotional,
  generateDevotionalForDate,
  getTodayDevotional,
  getDevotionalByDate,
  getAllDevotionals,
  generateDevotionalWithAI,
  getTopicForDate,
} from "../devotional-service";
import { prisma } from "../prisma";

// Category labels for the community prayer paragraph
const CATEGORY_LABELS: Record<string, { en: string; es: string }> = {
  work:        { en: "Work and Provision", es: "Trabajo y Provisión" },
  health:      { en: "Health",              es: "Salud" },
  family:      { en: "Family",              es: "Familia" },
  peace:       { en: "Peace",               es: "Paz" },
  wisdom:      { en: "Wisdom",              es: "Sabiduría" },
  studies:     { en: "Studies",             es: "Estudios" },
  restoration: { en: "Restoration",         es: "Restauración" },
  gratitude:   { en: "Gratitude",           es: "Gratitud" },
  salvation:   { en: "Salvation",           es: "Salvación" },
  strength:    { en: "Strength",            es: "Fortaleza" },
};

/**
 * Fetch the distinct active prayer categories (non-expired petitions)
 * and build a pastoral sentence to append to the devotional prayer.
 * Returns { en, es } or null if no active petitions.
 */
async function buildCommunityPrayerSentence(): Promise<{ en: string; es: string } | null> {
  try {
    const now = new Date();
    const activeRequests = await prisma.prayerRequest.findMany({
      where: { expiresAt: { gt: now } },
      select: { categoryKey: true },
    });

    if (activeRequests.length === 0) return null;

    // Deduplicate and sort deterministically
    const uniqueKeys = [...new Set(activeRequests.map((r) => r.categoryKey))].sort();
    if (uniqueKeys.length === 0) return null;

    const labelsEs = uniqueKeys
      .map((k) => CATEGORY_LABELS[k]?.es ?? k)
      .filter(Boolean);
    const labelsEn = uniqueKeys
      .map((k) => CATEGORY_LABELS[k]?.en ?? k)
      .filter(Boolean);

    // Build a natural list (Oxford-style)
    const joinEs = labelsEs.length === 1
      ? labelsEs[0]!
      : labelsEs.slice(0, -1).join(", ") + " y " + labelsEs[labelsEs.length - 1];
    const joinEn = labelsEn.length === 1
      ? labelsEn[0]!
      : labelsEn.slice(0, -1).join(", ") + " and " + labelsEn[labelsEn.length - 1];

    const es = `Hoy elevamos en oración a nuestra comunidad, presentando ante Dios las peticiones por ${joinEs}, confiando en que Él escucha y obra en cada corazón.`;
    const en = `Today we lift our community in prayer, presenting before God the petitions for ${joinEn}, trusting that He hears and works in every heart.`;

    return { en, es };
  } catch (err) {
    // Non-blocking — if this fails, we still return the devotional normally
    console.error("[API] Could not build community prayer sentence:", err);
    return null;
  }
}

export const devotionalRouter = new Hono();

// Get today's devotional
devotionalRouter.get("/today", async (c) => {
  try {
    let devotional = await getTodayDevotional();

    if (!devotional) {
      // Generate if not exists
      try {
        await generateTodayDevotional();
      } catch (genError) {
        // If generation failed, try to fetch again in case another request created it
        console.log("[API] Generation failed, checking if devotional was created by another request");
      }
      devotional = await getTodayDevotional();
    }

    if (!devotional) {
      return c.json({ error: "Failed to get or generate devotional" }, 500);
    }

    // Enrich prayer fields with a community prayer sentence (non-blocking)
    const communityPrayer = await buildCommunityPrayerSentence();
    if (communityPrayer) {
      return c.json({
        ...devotional,
        prayer: devotional.prayer + "\n\n" + communityPrayer.en,
        prayerEs: devotional.prayerEs + "\n\n" + communityPrayer.es,
      });
    }

    return c.json(devotional);
  } catch (error) {
    console.error("[API] Error getting today's devotional:", error);
    return c.json({ error: "Failed to get devotional" }, 500);
  }
});

// Get devotional by date
devotionalRouter.get("/date/:date", async (c) => {
  try {
    const date = c.req.param("date");
    const devotional = await getDevotionalByDate(date);

    if (!devotional) {
      return c.json({ error: "Devotional not found" }, 404);
    }

    return c.json(devotional);
  } catch (error) {
    console.error("[API] Error getting devotional by date:", error);
    return c.json({ error: "Failed to get devotional" }, 500);
  }
});

// Get all devotionals (for library)
devotionalRouter.get("/all", async (c) => {
  try {
    const devotionals = await getAllDevotionals();
    return c.json(devotionals);
  } catch (error) {
    console.error("[API] Error getting all devotionals:", error);
    return c.json({ error: "Failed to get devotionals" }, 500);
  }
});

// Generate today's devotional (can be called manually or by cron)
devotionalRouter.post("/generate/today", async (c) => {
  try {
    await generateTodayDevotional();
    const devotional = await getTodayDevotional();
    return c.json({ success: true, devotional });
  } catch (error) {
    console.error("[API] Error generating today's devotional:", error);
    return c.json({ error: "Failed to generate devotional" }, 500);
  }
});

// Generate devotional for specific date
devotionalRouter.post("/generate/:date", async (c) => {
  try {
    const date = c.req.param("date");
    await generateDevotionalForDate(date);
    const devotional = await getDevotionalByDate(date);
    return c.json({ success: true, devotional });
  } catch (error) {
    console.error("[API] Error generating devotional:", error);
    return c.json({ error: "Failed to generate devotional" }, 500);
  }
});

// Seed historical devotionals (generate for past N days)
devotionalRouter.post("/seed/:days", async (c) => {
  try {
    const days = parseInt(c.req.param("days"), 10);
    if (isNaN(days) || days < 1 || days > 30) {
      return c.json({ error: "Days must be between 1 and 30" }, 400);
    }

    const results: string[] = [];
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]!;

      try {
        await generateDevotionalForDate(dateStr);
        results.push(`${dateStr}: Generated`);
      } catch (err) {
        results.push(`${dateStr}: Failed - ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return c.json({ success: true, results });
  } catch (error) {
    console.error("[API] Error seeding devotionals:", error);
    return c.json({ error: "Failed to seed devotionals" }, 500);
  }
});

// Preview endpoint — generates N stories without saving to DB
// GET /api/devotional/preview?count=5
devotionalRouter.get("/preview", async (c) => {
  const countParam = c.req.query("count");
  const count = Math.min(Math.max(parseInt(countParam ?? "1", 10) || 1, 1), 10);

  // Start from tomorrow's date and go forward
  const results: Array<{ index: number; topic: string; topicEs: string; story: string; storyEs: string; title: string; titleEs: string }> = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + 1 + i); // tomorrow, day after, etc.
    const dateStr = date.toISOString().split("T")[0]!;
    const topic = getTopicForDate(dateStr);

    try {
      console.log(`[Preview] Generating preview #${i + 1} — topic: ${topic.es}`);
      const content = await generateDevotionalWithAI(topic);
      results.push({
        index: i + 1,
        topic: topic.en,
        topicEs: topic.es,
        title: content.title,
        titleEs: content.titleEs,
        story: content.story,
        storyEs: content.storyEs,
      });
    } catch (err) {
      errors.push({ index: i + 1, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return c.json({ generated: results.length, errors, results });
});
