import { Hono } from "hono";

const app = new Hono();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
const LIBRETRANSLATE_URL = "https://libretranslate.de/translate";

async function translateWithLibreTranslate(text: string, targetLanguage: "es" | "en"): Promise<string> {
  const sourceLang = targetLanguage === "es" ? "en" : "es";
  const response = await fetch(LIBRETRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLanguage,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate failed: ${response.status}`);
  }

  const data = await response.json() as any;
  if (!data.translatedText) {
    throw new Error("LibreTranslate returned no text");
  }
  return data.translatedText.trim();
}

app.post("/", async (c) => {
  const body = await c.req.json<{ text: string; targetLanguage: "es" | "en" }>();
  const { text, targetLanguage } = body;

  if (!text || !targetLanguage) {
    return c.json({ error: "Missing text or targetLanguage" }, 400);
  }

  const targetLabel = targetLanguage === "es" ? "Spanish" : "English";
  const prompt = `Translate the following testimony to ${targetLabel}. Return ONLY the translated text, no quotes, no explanation:\n\n${text}`;

  // 1. Try primary (Anthropic)
  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const translatedText = data.content?.[0]?.text?.trim() ?? "";
        if (translatedText) {
          return c.json({ translatedText });
        }
      }
    } catch (_) {
      // fall through to LibreTranslate
    }
  }

  // 2. Fallback: LibreTranslate (free, no API key required)
  try {
    const translatedText = await translateWithLibreTranslate(text, targetLanguage);
    return c.json({ translatedText });
  } catch (_) {
    return c.json({ error: "Translation failed" }, 502);
  }
});

export const translateRouter = app;
