import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
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
import { startDevotionalCron } from "./cron";
import { initializeWeeklyChallenges } from "./weekly-challenges";
import { seedPromoCodes } from "./seed-promo-codes";
import { seedBadges } from "./seed-badges";
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

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

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

// Start cron job for daily devotional generation
// Initialize DB schema first (handles fresh DB or missing columns)
initDatabase().then(() => {
  startDevotionalCron();
  initializeWeeklyChallenges();
  seedPromoCodes();
  seedBadges();
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 120, // 2 minutes timeout for long requests like AI generation
};
