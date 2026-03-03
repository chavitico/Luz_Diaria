import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { env, IS_PROD } from "./env";
import { initDatabase } from "./db-init";
import { sampleRouter } from "./routes/sample";
import { devotionalRouter } from "./routes/devotional";
import { gamificationRouter } from "./routes/gamification";
import { bibleRouter } from "./routes/bible";
import { prayerRouter } from "./routes/prayer";
import { brandingRouter } from "./routes/branding";
import { supportRouter } from "./routes/support";
import { giftsRouter } from "./routes/gifts";
import { adminRouter } from "./routes/admin-users";
import { adminBackupRouter } from "./routes/admin-backup";
import { startDevotionalCron } from "./cron";
import { initializeWeeklyChallenges } from "./weekly-challenges";
import { seedPromoCodes } from "./seed-promo-codes";
import { seedBadges } from "./seed-badges";
import { runStartupSanityCheck, runDailyBackup } from "./backup-service";
import { logger } from "hono/logger";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint (includes APP_ENV so clients can verify)
app.get("/health", (c) =>
  c.json({ status: "ok", appEnv: env.APP_ENV, isProd: IS_PROD })
);

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/devotional", devotionalRouter);
app.route("/api/gamification", gamificationRouter);
app.route("/api/bible", bibleRouter);
app.route("/api/prayer", prayerRouter);
app.route("/api/branding", brandingRouter);
app.route("/api/support", supportRouter);
app.route("/api/gifts", giftsRouter);
app.route("/api/admin", adminRouter);
app.route("/api/admin/backups", adminBackupRouter);

// Prod guard: block any request to reset/nuke endpoints
app.all("/api/admin/reset*", (c) => {
  if (IS_PROD) {
    console.error("[Guard] ⛔ Destructive reset endpoint blocked in production.");
    return c.json({ error: "Forbidden in production" }, 403);
  }
  return c.json({ error: "Not found" }, 404);
});

// Initialize DB + run startup checks + start cron
initDatabase().then(async () => {
  // Sanity check: prod will exit if tables are unexpectedly empty
  await runStartupSanityCheck();

  startDevotionalCron();
  initializeWeeklyChallenges();
  seedPromoCodes();
  seedBadges();

  // Run an initial backup shortly after startup (non-blocking)
  setTimeout(async () => {
    try {
      await runDailyBackup();
    } catch (err) {
      console.error("[Startup] Failed to run initial backup:", err);
    }
  }, 30_000); // 30 seconds after startup
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120, // 2 minutes timeout for long requests like AI generation
};
