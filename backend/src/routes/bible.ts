// Bible passage routes
import { Hono } from "hono";
import {
  getBiblePassage,
  getBibleChapterVerses,
  BIBLE_BOOKS_LIST,
} from "../bible-service";

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

/**
 * GET /api/bible/books
 * Returns the static list of all 66 canonical Bible books with metadata.
 * Response: { books: BibleBookInfo[] }
 */
bibleRouter.get("/books", (c) => {
  return c.json({ books: BIBLE_BOOKS_LIST });
});

/**
 * GET /api/bible/chapter
 * Fetch every verse of a single Bible chapter.
 * Query params:
 *   - bookId  : USFM book identifier, e.g. "GEN", "MAT"  (required)
 *   - chapter : chapter number (required, integer >= 1)
 *   - lang    : "en" | "es"  (default "es")
 *
 * Response: { success, bookName, chapter, verses: [{number, text}] }
 */
bibleRouter.get("/chapter", async (c) => {
  const bookId = c.req.query("bookId");
  const chapterParam = c.req.query("chapter");
  const lang = (c.req.query("lang") || "es") as "en" | "es";

  if (!bookId) {
    return c.json(
      {
        success: false,
        error: lang === "es" ? "bookId es requerido" : "bookId is required",
      },
      400
    );
  }

  if (!chapterParam) {
    return c.json(
      {
        success: false,
        error: lang === "es" ? "chapter es requerido" : "chapter is required",
      },
      400
    );
  }

  const chapter = parseInt(chapterParam, 10);
  if (isNaN(chapter) || chapter < 1) {
    return c.json(
      {
        success: false,
        error:
          lang === "es"
            ? "chapter debe ser un número entero positivo"
            : "chapter must be a positive integer",
      },
      400
    );
  }

  console.log(`[Bible API] Chapter request: ${bookId} ${chapter} (${lang})`);

  const result = await getBibleChapterVerses(bookId, chapter, lang);

  if (!result.success) {
    return c.json(result, 404);
  }

  return c.json(result);
});
