import { generateTodayDevotional, generateDevotionalForDate } from "./devotional-service";
import { generateWeeklyChallenges } from "./weekly-challenges";
import { generateTodayDailyPrayer } from "./prayer-service";
import { generateStreakSnapshots } from "./streak-snapshot-service";
import { runDailyBackup } from "./backup-service";

// Costa Rica timezone is UTC-6
// 4:00 AM Costa Rica = 10:00 AM UTC
const CRON_HOUR_UTC = 10;
const CRON_MINUTE = 0;

// Number of historical days to seed on startup
const SEED_DAYS = 7;

let cronInterval: ReturnType<typeof setInterval> | null = null;

function getNextRunTime(): Date {
  const now = new Date();
  const next = new Date(now);

  next.setUTCHours(CRON_HOUR_UTC, CRON_MINUTE, 0, 0);

  // If we've already passed today's scheduled time, schedule for tomorrow
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

function getCostaRicaTime(): string {
  return new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica" });
}

async function runCronJob(): Promise<void> {
  console.log(`[Cron] Running devotional generation at ${getCostaRicaTime()} (Costa Rica time)`);

  try {
    await generateTodayDevotional();
    console.log(`[Cron] Devotional generation completed successfully`);
  } catch (error) {
    console.error(`[Cron] Failed to generate devotional:`, error);
  }

  // Generate daily prayer (includes community prayer requests)
  try {
    await generateTodayDailyPrayer();
    console.log(`[Cron] Daily prayer generation completed successfully`);
  } catch (error) {
    console.error(`[Cron] Failed to generate daily prayer:`, error);
  }

  // Check for new week challenges at midnight UTC on Mondays
  const now = new Date();
  if (now.getUTCDay() === 1 && now.getUTCHours() === 0) {
    try {
      await generateWeeklyChallenges();
      console.log(`[Cron] Weekly challenges check completed`);
    } catch (error) {
      console.error(`[Cron] Failed to generate weekly challenges:`, error);
    }
  }

  // Generate daily streak snapshots for all users
  try {
    const today = new Date().toISOString().split("T")[0]!;
    await generateStreakSnapshots(today);
    console.log(`[Cron] Streak snapshots generated successfully`);
  } catch (error) {
    console.error(`[Cron] Failed to generate streak snapshots:`, error);
  }

  // Run daily backup after all other cron tasks
  try {
    await runDailyBackup();
    console.log(`[Cron] Daily backup completed successfully`);
  } catch (error) {
    console.error(`[Cron] Failed to run daily backup:`, error);
  }
}

export function startDevotionalCron(): void {
  console.log(`[Cron] Starting devotional cron job`);
  console.log(`[Cron] Scheduled to run daily at 4:00 AM Costa Rica (10:00 AM UTC)`);

  const nextRun = getNextRunTime();
  const msUntilNextRun = nextRun.getTime() - Date.now();

  console.log(`[Cron] Next run scheduled for: ${nextRun.toISOString()} (${Math.round(msUntilNextRun / 1000 / 60)} minutes from now)`);

  // Set initial timeout for first run
  setTimeout(() => {
    runCronJob();

    // After first run, set up daily interval (24 hours)
    cronInterval = setInterval(runCronJob, 24 * 60 * 60 * 1000);
    console.log(`[Cron] Daily interval set up for every 24 hours`);
  }, msUntilNextRun);

  // Also run immediately on startup if no devotional exists for today
  console.log(`[Cron] Checking if today's devotional exists...`);
  runCronJob();

  // Seed historical devotionals in the background
  seedHistoricalDevotionals();
}

async function seedHistoricalDevotionals(): Promise<void> {
  console.log(`[Seed] Starting to seed ${SEED_DAYS} days of historical devotionals...`);

  for (let i = 1; i <= SEED_DAYS; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]!;

    try {
      console.log(`[Seed] Generating devotional for ${dateStr}...`);
      await generateDevotionalForDate(dateStr);
    } catch (error) {
      console.error(`[Seed] Failed to generate devotional for ${dateStr}:`, error);
    }
  }

  console.log(`[Seed] Historical devotional seeding completed`);
}

export function stopDevotionalCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log(`[Cron] Devotional cron job stopped`);
  }
}
