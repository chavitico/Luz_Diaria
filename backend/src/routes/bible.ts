// Bible passage routes
import { Hono } from "hono";
import { getBiblePassage } from "../bible-service";

export const bibleRouter = new Hono();

/**
 * GET /api/bible/passage
 * Fetch a Bible passage by reference
 * Query params:
 *   - reference: The Bible reference (e.g., "Lucas 10:25-37", "Juan 3:16")
 *   - lang: Language code ("en" or "es")
 */
bibleRouter.get("/passage", async (c) => {
  const reference = c.req.query("reference");
  const lang = (c.req.query("lang") || "es") as "en" | "es";

  if (!reference) {
    return c.json(
      {
        success: false,
        error: lang === "es" ? "Referencia requerida" : "Reference required",
      },
      400
    );
  }

  console.log(`[Bible API] Request for: "${reference}" (${lang})`);

  const result = await getBiblePassage(reference, lang);

  if (!result.success) {
    return c.json(result, 404);
  }

  return c.json(result);
});

/**
 * POST /api/bible/passage
 * Alternative endpoint for fetching passages (useful for complex references)
 * Body: { reference: string, lang: "en" | "es" }
 */
bibleRouter.post("/passage", async (c) => {
  const body = await c.req.json<{ reference?: string; lang?: "en" | "es" }>();
  const { reference, lang = "es" } = body;

  if (!reference) {
    return c.json(
      {
        success: false,
        error: lang === "es" ? "Referencia requerida" : "Reference required",
      },
      400
    );
  }

  console.log(`[Bible API] POST request for: "${reference}" (${lang})`);

  const result = await getBiblePassage(reference, lang);

  if (!result.success) {
    return c.json(result, 404);
  }

  return c.json(result);
});
