import { STORE_BUNDLES, DEFAULT_AVATARS, ITEM_COLLECTIONS, AVATAR_FRAMES, PURCHASABLE_THEMES, SPIRITUAL_TITLES } from '@/lib/constants';
import { StoreItem } from '@/lib/gamification-api';

// ─── Bundle Sort Utility ─────────────────────────────────────────────────────
// Sorting rules for STORE_BUNDLES entries:
//   1. Season-active bundles (seasonId in activeSeasonIds) — first
//   2. Incomplete/not-owned bundles — before completed
//   3. Within each group: newest releasedAt DESC, then id ASC (stable)
//   4. comingSoon is treated same as incomplete (shows UI blocked)

export function sortBundlesForUser(
  bundles: typeof STORE_BUNDLES[string][],
  ownedItemIds: string[],
  activeSeasonIds: string[],
  devLog = false
): typeof STORE_BUNDLES[string][] {
  type Scored = {
    bundle: typeof STORE_BUNDLES[string];
    isSeasonActive: boolean;
    isLaunch: boolean;
    isIncomplete: boolean;
    releasedMs: number;
  };

  const scored: Scored[] = bundles.map((b) => {
    const meta = (() => { try { return JSON.parse((b as any).metadata ?? '{}'); } catch { return {}; } })();
    const bundleSeasonId: string | undefined = (b as any).seasonId ?? meta?.seasonId;
    const isSeasonActive = bundleSeasonId ? activeSeasonIds.includes(bundleSeasonId) : false;
    const isLaunch = !!(b as any).isLaunchEvent;

    // A bundle is "incomplete" if the user doesn't own ALL items
    const allItems: string[] = b.items ?? [];
    const ownsAll = allItems.length > 0 && allItems.every((id) => ownedItemIds.includes(id));
    const isIncomplete = !ownsAll || (b as any).comingSoon === true;

    // releasedAt: from meta or item field or fallback to 0 (oldest)
    const releasedMs =
      (b as any).releasedAt instanceof Date
        ? ((b as any).releasedAt as Date).getTime()
        : typeof (b as any).releasedAt === 'string'
        ? new Date((b as any).releasedAt).getTime()
        : 0;

    return { bundle: b, isSeasonActive, isLaunch, isIncomplete, releasedMs };
  });

  scored.sort((a, b) => {
    // 1. Season-active bundles first
    if (a.isSeasonActive !== b.isSeasonActive) return a.isSeasonActive ? -1 : 1;
    // 2. Launch event bundle second (permanent featured)
    if (a.isLaunch !== b.isLaunch) return a.isLaunch ? -1 : 1;
    // 3. Incomplete/not-owned before completed
    if (a.isIncomplete !== b.isIncomplete) return a.isIncomplete ? -1 : 1;
    // 4. Newest releasedAt first within same group
    if (b.releasedMs !== a.releasedMs) return b.releasedMs - a.releasedMs;
    // 5. Stable tie-break by id
    return a.bundle.id < b.bundle.id ? -1 : 1;
  });

  if (__DEV__ && devLog) {
    const activeCount = scored.filter((s) => s.isSeasonActive).length;
    const launchCount = scored.filter((s) => s.isLaunch).length;
    const incompleteCount = scored.filter((s) => s.isIncomplete).length;
    const top5 = scored.slice(0, 5).map((s) => ({
      id: s.bundle.id,
      seasonActive: s.isSeasonActive,
      launch: s.isLaunch,
      incomplete: s.isIncomplete,
      releasedAt: s.releasedMs ? new Date(s.releasedMs).toISOString().slice(0, 10) : 'none',
    }));
    console.log(
      `[BundleSort] total=${scored.length} seasonActive=${activeCount} launch=${launchCount} incomplete=${incompleteCount}`,
      '\n[BundleSort] top5:', JSON.stringify(top5)
    );
  }

  return scored.map((s) => s.bundle);
}

// ─── Helpers to resolve item metadata from any item type ─────────────────────
export function resolveCollectionItem(itemId: string): {
  name: string;
  nameEs: string;
  type: 'avatar' | 'frame' | 'title' | 'theme';
  emoji?: string;
  color?: string;
} {
  // Check avatars
  const defaultAvatar = DEFAULT_AVATARS.find(a => a.id === itemId);
  if (defaultAvatar) {
    return { name: defaultAvatar.name, nameEs: defaultAvatar.nameEs, type: 'avatar', emoji: defaultAvatar.emoji };
  }
  // Check frames
  if (AVATAR_FRAMES[itemId]) {
    const f = AVATAR_FRAMES[itemId];
    return { name: f.name, nameEs: f.nameEs, type: 'frame', color: f.color };
  }
  // Check titles
  if (SPIRITUAL_TITLES[itemId]) {
    const t = SPIRITUAL_TITLES[itemId];
    return { name: t.name, nameEs: t.nameEs, type: 'title', emoji: '👑' };
  }
  // Check themes
  if (PURCHASABLE_THEMES[itemId]) {
    const th = PURCHASABLE_THEMES[itemId];
    return { name: th.name, nameEs: th.nameEs, type: 'theme', color: th.colors?.primary };
  }
  // Fallback
  const label = itemId.replace(/(avatar_|frame_|title_|theme_)(v2_|l2_)?/g, '').replace(/_/g, ' ');
  return { name: label, nameEs: label, type: itemId.startsWith('frame') ? 'frame' : itemId.startsWith('title') ? 'title' : itemId.startsWith('theme') ? 'theme' : 'avatar' };
}

// Compute which avatar IDs are "NEW" (isNewEligible && not seen)
export function computeNewAvatarIds(seenMap: Record<string, boolean>): Set<string> {
  const result = new Set<string>();
  for (const av of DEFAULT_AVATARS as readonly (typeof DEFAULT_AVATARS[0])[]) {
    const isNewEligible = (av as { isNewEligible?: boolean }).isNewEligible;
    if (isNewEligible && !seenMap[av.id]) {
      result.add(av.id);
    }
  }
  return result;
}

// 14-day window for releasedAt-based "new" detection
export const NEW_ITEM_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function computeNewStoreItemIds(storeItems: StoreItem[], seenMap: Record<string, boolean>): Set<string> {
  const result = new Set<string>();
  const now = Date.now();
  for (const item of storeItems) {
    if (seenMap[item.id]) continue;
    // Item is new if: explicit isNew flag OR released in last 14 days
    const isNewFlag = (item as any).isNew === true;
    const releasedAt = item.releasedAt ? new Date(item.releasedAt).getTime() : null;
    const isRecentRelease = releasedAt !== null && (now - releasedAt) < NEW_ITEM_WINDOW_MS;
    if (isNewFlag || isRecentRelease) {
      result.add(item.id);
    }
  }
  return result;
}
