// Helper to check if a daily action is available
export function isDailyActionAvailable(
  actionDate: string | undefined,
  actionCount: number | undefined,
  maxCount: number,
  today: string
): { available: boolean; count: number } {
  if (!actionDate || actionDate !== today) {
    // New day, reset count
    return { available: true, count: 0 };
  }
  const currentCount = actionCount ?? 0;
  return { available: currentCount < maxCount, count: currentCount };
}

// Helper to check if a one-time daily action is done
export function isDailyActionDone(
  actionDate: string | undefined,
  actionDone: boolean | undefined,
  today: string
): boolean {
  if (!actionDate || actionDate !== today) {
    return false;
  }
  return actionDone ?? false;
}
