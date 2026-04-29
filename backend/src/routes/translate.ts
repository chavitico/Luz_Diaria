import { Hono } from "hono";

const app = new Hono();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");

app.post("/", async (c) => {
  const body = await c.req.json<{ text: string; targetLanguage: "es" | "en" }>();
  const { text, targetLanguage } = body;

  if (!text || !targetLanguage) {
    return c.json({ error: "Missing text or targetLanguage" }, 400);
  }

  if (!ANTHROPIC_API_KEY) {
    return c.json({ error: "Translation service unavailable" }, 503);
  }

  const targetLabel = targetLanguage === "es" ? "Spanish" : "English";
  const prompt = `Translate the following testimony to ${targetLabel}. Return ONLY the translated text, no quotes, no explanation:\n\n${text}`;

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

  if (!response.ok) {
    return c.json({ error: "Translation failed" }, 502);
  }

  const data = await response.json() as any;
  const translatedText = data.content?.[0]?.text?.trim() ?? "";

  return c.json({ translatedText });
});

export const translateRouter = app;
