import AsyncStorage from '@react-native-async-storage/async-storage';

const LEDGER_KEY = 'points_ledger_v1';
const MAX_ENTRIES = 50;

export type LedgerKind =
  | 'devotional'
  | 'promo_code'
  | 'purchase'
  | 'claim'
  | 'challenge'
  | 'chest'
  | 'mission'
  | 'admin';

export interface LedgerEntry {
  id: string;
  ts: number;
  delta: number;
  kind: LedgerKind;
  title: string;
  detail: string;
}

export async function getLedgerEntries(): Promise<LedgerEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LedgerEntry[];
  } catch {
    return [];
  }
}

export async function addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'ts'>): Promise<void> {
  try {
    const current = await getLedgerEntries();
    const newEntry: LedgerEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
    };
    const updated = [newEntry, ...current].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(LEDGER_KEY, JSON.stringify(updated));
  } catch {
    // silently fail — ledger is best-effort
  }
}

/** Returns a human-readable relative time string in Spanish */
export function relativeTime(ts: number, language: 'es' | 'en' = 'es'): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (language === 'en') {
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
  }

  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

/** Icon name and color hint for each kind */
export function ledgerKindMeta(
  kind: LedgerKind,
  delta: number
): { icon: string; colorHint: 'positive' | 'negative' | 'neutral' } {
  const colorHint = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  const iconMap: Record<LedgerKind, string> = {
    devotional: 'BookOpen',
    promo_code: 'Tag',
    purchase: 'ShoppingBag',
    claim: 'Trophy',
    challenge: 'Zap',
    chest: 'Gift',
    mission: 'Target',
    admin: 'Shield',
  };
  return { icon: iconMap[kind] ?? 'Coins', colorHint };
}
