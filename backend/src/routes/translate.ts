import { Hono } from "hono";

const app = new Hono();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
const LIBRETRANSLATE_URL = "https://libretranslate.de/translate";

async function translateWithLibreTranslate(text: string, targetLanguage: "es" | "en"): Promise<string> {
  const sourceLang = targetLanguage === "es" ? "en" : "es";
  console.log(`[translate] Intentando LibreTranslate: ${sourceLang} → ${targetLanguage}`);
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
    const msg = await response.text().catch(() => "(sin cuerpo)");
    console.error(`[translate] LibreTranslate falló: status=${response.status} body=${msg}`);
    throw new Error(`LibreTranslate failed: ${response.status}`);
  }

  const data = await response.json() as any;
  if (!data.translatedText) {
    console.error("[translate] LibreTranslate no devolvió translatedText");
    throw new Error("LibreTranslate returned no text");
  }
  return data.translatedText.trim();
}

app.post("/", async (c) => {
  console.log("[translate] Request recibida");

  // Log API key presence without exposing it
  if (ANTHROPIC_API_KEY) {
    const masked = ANTHROPIC_API_KEY.slice(0, 10) + "…" + ANTHROPIC_API_KEY.slice(-4);
    console.log(`[translate] ANTHROPIC_API_KEY presente: ${masked}`);
  } else {
    console.log("[translate] ANTHROPIC_API_KEY NO configurada — usará fallback");
  }

  const body = await c.req.json<{ text: string; targetLanguage: "es" | "en" }>();
  const { text, targetLanguage } = body;

  if (!text || !targetLanguage) {
    console.warn("[translate] Faltan parámetros: text o targetLanguage");
    return c.json({ error: "Missing text or targetLanguage" }, 400);
  }

  console.log(`[translate] Texto a traducir (${text.length} chars), targetLanguage=${targetLanguage}`);

  const targetLabel = targetLanguage === "es" ? "Spanish" : "English";
  const prompt = `Translate the following testimony to ${targetLabel}. Return ONLY the translated text, no quotes, no explanation:\n\n${text}`;

  // 1. Try primary (Anthropic)
  if (ANTHROPIC_API_KEY) {
    console.log("[translate] Proveedor: Anthropic");
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
          console.log("[translate] Anthropic respondió OK");
          return c.json({ translatedText });
        }
        console.warn("[translate] Anthropic respondió OK pero sin texto en content[0]");
      } else {
        const errBody = await response.text().catch(() => "(sin cuerpo)");
        console.error(`[translate] Anthropic falló: status=${response.status} body=${errBody}`);
      }
    } catch (err) {
      console.error("[translate] Excepción llamando a Anthropic:", err instanceof Error ? err.message : err);
    }
  }

  // 2. Fallback: LibreTranslate (free, no API key required)
  console.log("[translate] Proveedor: LibreTranslate (fallback)");
  try {
    const translatedText = await translateWithLibreTranslate(text, targetLanguage);
    console.log("[translate] LibreTranslate respondió OK");
    return c.json({ translatedText });
  } catch (err) {
    console.error("[translate] Ambos proveedores fallaron:", err instanceof Error ? err.message : err);
    return c.json({ error: "Translation failed" }, 502);
  }
});

export const translateRouter = app;
