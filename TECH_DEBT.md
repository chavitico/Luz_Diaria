# Tech Debt — Fase 1 (as of 2026-03-05)

Generated after Architecture + Cleanup Pass. No code changes proposed here —
all items are documented for Phase 2 prioritization.

---

## 1. Large Files (refactor candidates)

| File | Lines | Risk | Notes |
|---|---|---|---|
| `src/app/(tabs)/store.tsx` | **7,476** | 🔴 High | Single file: 40+ components, all store logic, modals, animations. Needs split. |
| `backend/src/routes/gamification.ts` | **2,729** | 🟡 Medium | All gamification endpoints in one file. Split by domain. |
| `src/lib/constants.ts` | **2,412** | 🟡 Medium | Mixes catalog data, theming, collections, bundles. Separate by concern. |
| `src/app/(tabs)/index.tsx` | **2,300** | 🟡 Medium | Home + TTS + devotional logic. Extract TTS hook + devotional viewer. |
| `src/app/(tabs)/settings.tsx` | **2,026** | 🟡 Medium | Settings + sub-modals. Extract modals. |
| `backend/src/routes/support.ts` | **1,243** | 🟢 Low | Admin support management. Acceptable. |

### Proposed split for `store.tsx` (Phase 2)
```
store/
├── StoreScreen.tsx          # Root screen + modal orchestration (~500 lines)
├── components/
│   ├── BundleCard.tsx
│   ├── SeasonBanner.tsx
│   ├── LaunchEventBanner.tsx
│   ├── AvatarCard.tsx
│   ├── ThemeCard.tsx
│   └── ChestModal.tsx
├── hooks/
│   ├── useStoreNavigation.ts    # pendingAdventureNav + useEffect
│   ├── useBundlePurchase.ts
│   └── useStoreSectionModal.ts
└── constants/
    └── store-catalog.ts         # STORE_BUNDLES, ITEM_COLLECTIONS, etc.
```

---

## 2. Duplicated Constants

### Rarity color maps (defined independently in 3+ places)

| File | Variable | Values |
|---|---|---|
| `src/lib/constants.ts` | `RARITY_COLORS` | Exported, used in store.tsx |
| `src/app/admin/gifts.tsx:78` | `RARITY_COLORS` | Local copy, same values |
| `src/app/admin/moderators.tsx:122` | `RARITY_COLOR` | Local copy, slightly different key casing |
| `src/app/(tabs)/store.tsx:977` | Inline ternary | `epic=#A855F7, rare=#3B82F6, common=#22C55E` — hardcoded, doesn't use `RARITY_COLORS` |

**Fix:** admin files should import from `src/lib/constants.ts`. Inline ternary in store.tsx line 977 should use `RARITY_COLORS[rarity]`.

### Avatar emoji maps

Referenced across: `CommunityGiftFlowModal.tsx`, `ShareableProfileCard.tsx`, `GiftSendModal.tsx`, `settings.tsx`, `store.tsx`, `prayer.tsx`, `admin/moderators.tsx`, `admin/gifts.tsx`.

`src/lib/constants.ts` appears to be the canonical source. Verify all files import from there rather than defining locally.

---

## 3. Potential Architectural Improvements (Phase 2)

### A. Store screen split (highest priority)
`store.tsx` at 7,476 lines is a maintenance liability. A single typo can trigger a full re-bundle. Split into domain-specific component files and custom hooks (see plan above).

### B. Backend rate limiting
No rate limiting detected on any route. Vulnerable endpoints:
- `POST /api/gifts` — gift creation (guarded by points, but no request rate limit)
- `POST /api/prayer` — prayer creation
- `POST /api/gamification/user/:id/sync` — called on every community load

**Proposed:** Add `hono-rate-limiter` or a simple in-memory token bucket per userId.

### C. Session expiration logic
`heartbeatSessionId` stored in Zustand/AsyncStorage has no TTL or expiration check. If the backend expires a session server-side, the client keeps sending stale session IDs silently. Consider adding a `sessionExpiredAt` field server-side and returning a `401` or `session_expired` flag.

### D. Two AppState listeners in the same component tree
`_layout.tsx` and `community.tsx` each register an `AppState` listener. They handle different concerns so it's not broken, but it's inefficient and hard to trace.

**Proposed:** Centralize all AppState handling in `_layout.tsx` (or a dedicated `useAppLifecycle` hook) and expose callbacks via context or events.

### E. Modal state management
Multi-step modals (`CommunityGiftFlowModal`, future gift flows) use multiple `useState` calls that can get out of sync. For modals with 3+ steps, `useReducer` gives cleaner state transitions and easier testing.

### F. Shared types between mobile and backend
Types like `GiftRarity`, `ItemType`, `Season`, `Bundle` are defined independently in both mobile (`src/lib/types.ts`) and backend (`routes/gamification.ts`). A shared types package (or even a copied `shared/types.ts`) would prevent drift.

---

## 4. Dead / Placeholder Files

| File | Status | Action |
|---|---|---|
| `src/app/modal.tsx` | Placeholder, no content | Delete or implement |
| `src/app/logo-preview.tsx` | 648 lines, dev/preview tool | Guard with `__DEV__` route or remove from prod build |
| `src/app/theme-stress.tsx` | Dev stress-test screen | Same as above |
| `backend/src/seed-store-items.ts` | 1,054 lines, one-time seed | Move to `scripts/` folder, not in `src/` |
| `backend/src/seed-seasons.ts` | 363 lines, one-time seed | Same as above |

---

## 5. Minor Cleanup (low effort, low risk)

- `console.log` in `devotional/[date].tsx` and `library.tsx` — not yet wrapped in `__DEV__`
- `expo-av` deprecation warning — migrate to `expo-audio` before SDK 54 (breaking change)
- Inline `rarityColor` ternary in `store.tsx:977` — replace with `RARITY_COLORS[rarity]`
- Admin-only files import local `RARITY_COLORS` — replace with import from `constants.ts`

---

## 6. Not Touching (out of scope / risky)

The following were audited and found safe but intentionally left unchanged:

- AppState listener pattern in `community.tsx` (stable ref, intentional empty deps)
- `syncedRef` pattern (prevents double-sync on mount)
- `heartbeatInFlightRef` (safe boolean mutex, proper try/finally)
- `lastResumeRef` cooldown (10s debounce on community resume)
- All subscription cleanups (verified `.remove()` / `unsub()` in all effects)

---

*Next review: before Phase 2 kickoff. Owner: TBD.*
