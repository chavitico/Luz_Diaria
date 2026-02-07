import { Hono } from "hono";
import {
  generateTodayDevotional,
  generateDevotionalForDate,
  getTodayDevotional,
  getDevotionalByDate,
  getAllDevotionals,
} from "../devotional-service";

export const devotionalRouter = new Hono();

// Get today's devotional
devotionalRouter.get("/today", async (c) => {
  try {
    const devotional = await getTodayDevotional();

    if (!devotional) {
      // Generate if not exists
      await generateTodayDevotional();
      const newDevotional = await getTodayDevotional();
      return c.json(newDevotional);
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
