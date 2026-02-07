import { generateTodayDevotional } from "./devotional-service";

// Costa Rica timezone is UTC-6
// 4:00 AM Costa Rica = 10:00 AM UTC
const CRON_HOUR_UTC = 10;
const CRON_MINUTE = 0;

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
}

export function stopDevotionalCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log(`[Cron] Devotional cron job stopped`);
  }
}
