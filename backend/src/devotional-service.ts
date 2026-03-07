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
  // Intl.DateTimeFormat is the canonical, DST-safe way to get CR date
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value ?? '';
    const m = parts.find(p => p.type === 'month')?.value ?? '';
    const d = parts.find(p => p.type === 'day')?.value ?? '';
    const result = `${y}-${m}-${d}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(result)) return result;
  } catch {}
  // Static UTC-6 fallback — CR has no DST so this is always correct for CR time
  const crMs = Date.now() - 6 * 60 * 60 * 1000;
  const cr = new Date(crMs);
  return `${cr.getUTCFullYear()}-${String(cr.getUTCMonth() + 1).padStart(2, '0')}-${String(cr.getUTCDate()).padStart(2, '0')}`;
}

/** Returns the 1-based day-of-year for a YYYY-MM-DD string, computed entirely in UTC so the result is timezone-independent */
function dayOfYearUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = Date.UTC(y, m - 1, d);
  const jan1 = Date.UTC(y, 0, 1);
  return Math.round((target - jan1) / 86400000) + 1;
}

export function getTopicForDate(date: string): { en: string; es: string } {
  const idx = (dayOfYearUTC(date) - 1) % TOPICS.length;
  return TOPICS[idx]!;
}

function getImageForDate(date: string): string {
  const idx = (dayOfYearUTC(date) - 1) % IMAGES.length;
  return IMAGES[idx]!;
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

/** Extracts the protagonist first name from the opening of a story */
function extractProtagonistName(story: string): string | null {
  // Match the first capitalized word (2+ chars) that isn't a common non-name word
  const SKIP = new Set(['She','He','The','His','Her','They','When','As','It','In','On','At','An',
    'Una','Un','El','La','Los','Las','Era','Fue','Uno','Algo','Todo','Este','Esta','Esa',
    'That','This','There','Then','With','From','After','Before','While','During']);
  const words = story.slice(0, 300).match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})\b/g) ?? [];
  return words.find(w => !SKIP.has(w)) ?? null;
}

export async function generateDevotionalWithAI(
  topic: { en: string; es: string },
  usedNames: string[] = [],
): Promise<DevotionalContent> {
  storyGenerationCount++;

  // Determine story style variation based on count
  const useNoName = storyGenerationCount % 5 === 0; // 1 in 5: no names at all
  const useFirstPerson = storyGenerationCount % 10 === 0; // 1 in 10: first person "I felt..."
  const endWithQuestion = storyGenerationCount % 3 === 0; // ~1 in 3: end with a question instead of conclusion

  const storyStyleInstructions = `
=== INSTRUCCIONES ESPECÍFICAS PARA ESTA HISTORIA (seguir al pie de la letra) ===
${useNoName
  ? `IDENTIDAD DEL PROTAGONISTA: No uses nombres propios en absoluto. Refiere al protagonista únicamente como "una mujer", "un joven", "alguien que…", "ella", "él", "una madre", "un hombre mayor", etc. Esto hace que cualquier lector sienta que podría ser su propia historia.`
  : `IDENTIDAD DEL PROTAGONISTA: Usa un nombre POCO COMÚN o INUSUAL para el protagonista — evita absolutamente nombres comunes como María, Juan, Pedro, Ana, Carlos, Laura, José. Elige un nombre bíblico o inusual. Considera nombres como: Tadeo, Noa, Lía, Adara, Simei, Tomás, Hadasa, Zoe, Caleb, Débora, Rufina, Isamar, Leví, Jada, Eliú, Selah, Jairo, Neftalí, Abigaíl, Gersón, Tamar, Rut, Booz, Amós, Priscila, Aquila, Epafras, Tíquico, Onésimo, Clemente, Lidia, Febe, Dorcas, Cornelio, Esteban, Felipe, Bernabé. También puedes mezclar: nombre para el protagonista y descripciones para los demás.`}

${useFirstPerson
  ? `VOZ NARRATIVA: Escribe en PRIMERA PERSONA — como un testimonio personal íntimo. Usa frases como "Yo sentí…", "Recuerdo cuando…", "Fue una noche que…", "No supe cómo explicarlo, pero…", "Algo dentro de mí se quebró…". Debe sentirse como alguien contando su historia más vulnerable ante Dios.`
  : `VOZ NARRATIVA: Escribe en tercera persona, pero desde lo MÁS PROFUNDO del mundo interior del protagonista. No narres hechos externos — narra lo que él/ella sentía, temía, esperaba, callaba. El lector debe olvidar que está leyendo una historia y sentir que está dentro del alma de esa persona.`}

${endWithQuestion
  ? `CIERRE: NO termines con una conclusión, moraleja ni frase esperanzadora directa. Cierra con una PREGUNTA ESPIRITUAL PODEROSA Y ABIERTA que haga al lector detenerse y preguntarse algo sobre su propia fe, su propio corazón o su relación con Dios. La pregunta no debe ser retórica — debe sentirse genuina, profunda, casi incómoda en su honestidad.`
  : `CIERRE: Termina con UN INSTANTE QUIETO Y SAGRADO — no una lección, sino una verdad sentida. Un momento donde Dios y el protagonista están en silencio juntos, y en ese silencio todo cambia. Cierra con una frase breve, poderosa y esperanzadora que haga al lector sentir que Dios también está cerca de él.`}
`;

  const prompt = `Eres un escritor devocional cristiano con un don extraordinario para historias profundamente conmovedoras, espiritualmente íntimas y emocionalmente devastadoras en el mejor sentido — historias que hacen llorar, que restauran el alma, que hacen sentir a quien las lee que Dios lo vio, lo conoce y lo ama.

Genera un devocional diario completo sobre el tema "${topic.en}" / "${topic.es}".

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin markdown, sin bloques de código, solo JSON puro):

{
  "title": "Un título en inglés que capture la esencia emocional y espiritual del devocional (5-8 palabras). Evita títulos genéricos. Que sea memorable.",
  "titleEs": "Mismo título en español — que suene natural, poético y poderoso, no como traducción literal",
  "bibleVerse": "Un versículo bíblico relevante en inglés, entre comillas. Elige versículos que sean profundamente consoladores, transformadores o que generen impacto emocional real.",
  "bibleVerseEs": "Mismo versículo en español — versión Reina-Valera o NVI, entre comillas",
  "bibleReference": "Referencia bíblica en inglés (ej: 'Psalm 23:1' o '1 Corinthians 13:4-7')",
  "bibleReferenceEs": "Misma referencia en español con nombre del libro traducido (ej: 'Salmo 23:1' o '1 Corintios 13:4-7')",
  "reflection": "Una reflexión profunda, espiritual y accesible sobre el tema (3-4 párrafos, aprox. 200-250 palabras). NO expliques el versículo académicamente. Conecta la Escritura con el dolor real de las personas, con sus miedos cotidianos, con esos momentos de las 3am cuando todo parece perdido. Habla como alguien que ha sufrido y ha encontrado a Dios en el sufrimiento.",
  "reflectionEs": "Misma reflexión en español — que fluya de manera natural y emocionalmente resonante, no como traducción",
  "story": "UNA HISTORIA DEVOCIONAL INSPIRADORA E IMPACTANTE (3-4 párrafos, aprox. 220-270 palabras). SIGUE LAS INSTRUCCIONES DE ESTILO A CONTINUACIÓN. Esta historia debe sentirse como un TESTIMONIO REAL DE VIDA — no como una parábola ni un ejemplo ilustrativo. Debe tener: (1) un momento de crisis o quiebre genuino con detalles cotidianos concretos como lugar, hora, pequeño gesto; (2) una intervención clara y emocionante de Dios — puede ser a través de una oración, un versículo que llega en el momento justo, un acto de fe, un pequeño milagro o una transformación interior profunda; (3) una transformación visible del antes al después. Prioriza las emociones internas intensas: miedo, dolor, esperanza, culpa, alivio, gozo, fe renovada. Incluye al menos una frase que se quede grabada en el corazón del lector. El lector debe sentir que esto le pudo pasar a alguien como él.",
  "storyEs": "Misma historia en español — traducida de manera natural, preservando cada matiz emocional y espiritual. La versión en español debe sentirse tan íntima y poderosa como el original.",
  "biblicalCharacter": "Una sección sobre un personaje bíblico que ejemplificó esta virtud de manera profunda y humana (2-3 párrafos, aprox. 150-200 palabras). No hagas un resumen biográfico — muestra el momento de quiebre y transformación de ese personaje. Incluye referencias bíblicas específicas. Que el lector sienta que ese personaje también fue humano, frágil, y fue sostenido por Dios.",
  "biblicalCharacterEs": "Misma sección en español",
  "application": "2-3 aplicaciones prácticas para hoy — concretas, específicas y alcanzables. No ideales abstractos. Acciones reales que una persona puede hacer hoy, ahora, en su vida cotidiana. Escríbelas con calidez, no como mandatos.",
  "applicationEs": "Mismas aplicaciones en español",
  "prayer": "Una oración de aprox. 100-120 palabras. Que sea una conversación REAL, íntima y profunda con Dios — no un texto litúrgico formal. Que incluya el peso emocional del tema: nombra el dolor, el miedo o la esperanza. Que el lector sienta que alguien escribió esta oración desde sus propias rodillas, llorando y creyendo al mismo tiempo.",
  "prayerEs": "Misma oración en español — que fluya con naturalidad, emoción y fe auténtica"
}

${storyStyleInstructions}

=== LINEAMIENTOS GLOBALES (aplicar siempre, sin excepción) ===

TONO Y VOZ:
- Escribe como un testimonio íntimo y humano, NUNCA como un texto informativo o documental
- El lector debe sentir: "esto le pudo pasar a alguien como yo" — o incluso "esto ME pasó a mí"
- Prioriza emociones internas intensas: miedo real, dolor auténtico, esperanza frágil, culpa que aplasta, alivio que libera, gozo que sorprende, fe renovada contra toda lógica
- Evita explicaciones largas o moralizantes — la enseñanza debe surgir naturalmente de la historia
- Nunca "resuelvas" la historia demasiado rápido — deja respirar el dolor antes de la redención

DETALLES CONCRETOS:
- Incluye detalles cotidianos específicos que hagan la historia sentirse real: el lugar exacto, la hora del día, un gesto pequeño, una frase dicha en voz baja, el olor de algo, la textura de un momento
- Los detalles específicos son los que hacen llorar — no los conceptos abstractos

AUTENTICIDAD Y VARIEDAD:
- NUNCA repitas nombres comunes en múltiples historias
- Cada historia debe iniciar de manera diferente — varía la apertura: a veces con una imagen, a veces con una emoción, a veces con un diálogo, a veces con una pregunta, a veces con un objeto concreto
- Varía el ritmo: algunas historias pueden ser lentas y contemplativas, otras urgentes y angustiantes

CIERRE ESPIRITUAL:
- Todas las historias deben cerrar con una frase poderosa, breve y esperanzadora que haga sentir al lector que Dios está presente y cerca — incluso ahora mismo, mientras lee esto
- Que la última frase sea memorable: algo que el lector repita para sí mismo antes de dormir

OBJETIVO FINAL:
- Que cada historia se sienta ÚNICA, MEMORABLE e IMPACTANTE
- Que el lector NO sienta que leyó "otro devocional más", sino un TESTIMONIO QUE TOCÓ SU CORAZÓN
- Que después de leer, el lector quiera orar — o llorar — o simplemente quedarse en silencio ante Dios

IDIOMA Y CALIDAD:
- El español debe ser el idioma principal de calidad — natural, emocionalmente resonante, NUNCA traducción literal
- Todo el contenido debe ser bíblicamente sólido y teológicamente correcto
- Evita clichés religiosos gastados — busca expresiones frescas y auténticas`;

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
    // Normalize fields that GPT sometimes returns as arrays instead of strings
    if (Array.isArray(devotionalContent.application)) {
      devotionalContent.application = (devotionalContent.application as string[]).join('\n');
    }
    if (Array.isArray(devotionalContent.applicationEs)) {
      devotionalContent.applicationEs = (devotionalContent.applicationEs as string[]).join('\n');
    }
    console.log(`[Devotional] Successfully generated devotional: "${devotionalContent.title}"`);
    return devotionalContent;
  } catch (parseError) {
    console.error(`[Devotional] Failed to parse JSON (first 800 chars):`, cleanedContent.substring(0, 800));
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

  let topic = getTopicForDate(date);
  let imageUrl = getImageForDate(date);

  // Anti-duplicate guard: check the day before to avoid consecutive same topic/image
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const prevDt = new Date(Date.UTC(y, m - 1, d - 1));
  const prevDateStr = `${prevDt.getUTCFullYear()}-${String(prevDt.getUTCMonth() + 1).padStart(2, '0')}-${String(prevDt.getUTCDate()).padStart(2, '0')}`;
  const prevDevotional = await prisma.devotional.findUnique({ where: { date: prevDateStr } });

  if (prevDevotional && (prevDevotional.topic === topic.en || prevDevotional.imageUrl === imageUrl)) {
    // Skip to the next topic and image index
    const currentIdx = (dayOfYearUTC(date) - 1) % TOPICS.length;
    const nextIdx = (currentIdx + 1) % TOPICS.length;
    const nextImgIdx = (dayOfYearUTC(date) % IMAGES.length);
    topic = TOPICS[nextIdx]!;
    imageUrl = IMAGES[nextImgIdx]!;
    console.log(`[Devotional] Anti-duplicate: shifted topic for ${date} from "${prevDevotional.topic}" to "${topic.en}", image idx ${nextImgIdx}`);
  }

  try {
    // Fetch protagonist names used in recent devotionals (last 30 entries) for post-generation validation
    const recentDevotionals = await prisma.devotional.findMany({
      where: { date: { lte: date } },
      orderBy: { date: 'desc' },
      take: 30,
      select: { story: true },
    });
    const usedNames: string[] = [];
    for (const dev of recentDevotionals) {
      const name = extractProtagonistName(dev.story);
      if (name && !usedNames.includes(name)) usedNames.push(name);
    }
    console.log(`[Devotional] Used names for ${date}: ${usedNames.join(', ')}`);

    // Generate with up to 3 retries if protagonist name is a duplicate
    let content: DevotionalContent | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const candidate = await generateDevotionalWithAI(topic, usedNames);
      const generatedName = extractProtagonistName(candidate.story);
      const generatedNameEs = extractProtagonistName(candidate.storyEs ?? '');
      const isDuplicate = generatedName && usedNames.includes(generatedName);
      const isDuplicateEs = generatedNameEs && usedNames.includes(generatedNameEs);
      if (!isDuplicate && !isDuplicateEs) {
        content = candidate;
        if (generatedName) console.log(`[Devotional] Attempt ${attempt}: accepted name "${generatedName}"`);
        break;
      }
      console.log(`[Devotional] Attempt ${attempt}: name "${generatedName ?? generatedNameEs}" already used — retrying`);
    }
    if (!content) {
      // All retries exhausted — use last attempt anyway
      content = await generateDevotionalWithAI(topic, usedNames);
      console.warn(`[Devotional] All retries exhausted for ${date} — using last generated content`);
    }

    // Use upsert to avoid race conditions on server restart
    await prisma.devotional.upsert({
      where: { date },
      update: {}, // Don't update if exists
      create: {
        date,
        topic: topic.en,
        topicEs: topic.es,
        imageUrl,
        ...content!,
      },
    });

    console.log(`[Devotional] Successfully created devotional for ${date}: "${content!.title}"`);
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

/**
 * Guarantees devotionals exist for todayCR .. todayCR+6 (7 days ahead).
 * Generates ONLY missing dates sequentially; never overwrites existing rows.
 * Idempotent — safe to call at any time.
 */
export async function ensureDevotionalsAhead(days = 7): Promise<void> {
  const today = getTodayDate();

  for (let i = 0; i < days; i++) {
    // Compute target date by offsetting from today
    const [y, m, d] = today.split("-").map(Number) as [number, number, number];
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const dateStr = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;

    const existing = await prisma.devotional.findUnique({ where: { date: dateStr } });
    if (existing) {
      console.log(`[Ensure] Devotional for ${dateStr} already exists — skipping`);
      continue;
    }

    console.log(`[Ensure] Generating missing devotional for ${dateStr}…`);
    try {
      await generateDevotionalForDate(dateStr);
      console.log(`[Ensure] Devotional for ${dateStr} generated`);
    } catch (err) {
      // Non-fatal — log and continue so remaining dates are attempted
      console.error(`[Ensure] Failed to generate devotional for ${dateStr}:`, err);
    }
  }

  console.log(`[Ensure] ensureDevotionalsAhead(${days}) complete`);
}
