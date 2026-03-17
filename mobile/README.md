# Luz Diaria - Christian Daily Devotional App

A beautiful, cross-platform mobile app delivering daily Christian devotionals with faith, hope, and love messages.

## Branding

**App name:** `Luz Diaria` (fixed, non-translatable across all languages)

**Taglines:**
- Spanish (default): *Un devocional para cada día*
- English: *A devotional for every day*

### Visual Identity

**Concept:** A curved path converging toward a light point at the horizon — symbolizing walking daily with God, constancy, hope, and progressive restoration.

**Logo files:** `mobile/assets/logo/`
- `luz-diaria-icon.svg` — App icon (1024×1024, full color, suitable for App Store)
- `luz-diaria-icon-white.svg` — White-only icon (for dark/image backgrounds)
- `luz-diaria-color.svg` — Full logotype (isotipo + text, color)
- `luz-diaria-white.svg` — Full logotype (white version)

**Preview:** In the app, go to Settings → tap "Identidad visual" link at the bottom

**Color palette:**
| Name | Hex | Use |
|------|-----|-----|
| Verde Oscuro | `#2D4A38` | Primary text, dark accents |
| Verde Principal | `#4A7D5E` | Path, borders, primary |
| Verde Claro | `#7BAE8A` | Tagline, muted elements |
| Verde Suave | `#C8E0CE` | Ground, soft backgrounds |
| Dorado Cálido | `#F5D77A` | Light core, highlights |
| Ámbar | `#E8B84B` | Glow rays, warm accents |
| Fondo Claro | `#EAF3EE` | App backgrounds |

**Logo SVG component:** Implemented inline via `react-native-svg` in `src/app/logo-preview.tsx`
- `LuzDiariaIcon` — color isotipo
- `LuzDiariaIconWhite` — white isotipo
- `LuzDiariaLogotype` — color isotipo + text
- `LuzDiariaLogotypeWhite` — white isotipo + text

### Branding Architecture

- **Source of truth:** Backend SQLite (`AppBranding` table, row `id="app"`) — fetched at startup via `GET /api/branding`
- **Mobile service:** `src/lib/branding-service.ts` — Zustand store with 10-min AsyncStorage cache and automatic fallback to `DEFAULT_BRANDING`
- **Fallback constants:** `APP_BRANDING` in `src/lib/constants.ts` — used by SplashScreen and OnboardingScreen (no async needed)
- **Admin UI:** `/admin/branding` — tap the app logo in Settings 7 times (OWNER role only). Edits write back to `PUT /api/branding` with `X-User-Id` header for RBAC validation
- **Share images:** All 3 modes (long, WhatsApp card, 5-section) read from branding service; changes reflect without app restart

## Environment Separation (Dev vs Prod)

### APP_ENV

| Variable | Dev value | Prod value |
|---|---|---|
| `APP_ENV` (backend) | `dev` | `prod` |
| `EXPO_PUBLIC_APP_ENV` (mobile) | `dev` | `prod` |

- Set in `backend/.env` and `mobile/.env` / `mobile/.env.production`
- Defaults to `"dev"` if missing (safe default — never accidentally treat unknown as prod)
- `mobile/.env.production` is used by Expo when building production releases

## UI Components

### ActionButton (`src/components/ui/ActionButton.tsx`)

The **single canonical CTA component** for all call-to-action buttons in the app. Guarantees WCAG AA contrast in every theme.

**Contrast guarantees:**
- Button fill vs surface background: >= 3.0:1
- Label/icon color vs button fill: >= 4.5:1
- Double border + shadow for visual separation on any background

**Variants:** `primary` | `secondary` | `ghost` | `danger`
**Sizes:** `sm` | `md` | `lg`

**Icon prop:** accepts a render function `(color: string, size: number) => ReactNode` so the icon automatically receives the correct contrast color:
```tsx
<ActionButton
  label="Comprar"
  icon={(color, size) => <Coins size={size} color={color} />}
  onPress={handleBuy}
/>
```

**Contrast utilities (`src/lib/contrast.ts`):**
- `relativeLuminance(hex)` — WCAG relative luminance
- `contrastRatio(a, b)` — WCAG contrast ratio [1–21]
- `pickReadableTextColor(bg)` — returns `#FFFFFF` or `#111111`
- `ensureContrast(fg, bg, minRatio, isDark)` — adjusts color until ratio is met
- `deriveButtonColors(primary, surface, isDark)` — derives safe fill + text color

### Global Button Style Tokens (`src/lib/buttonStyles.ts`)

Shared helper functions for inline-styled buttons (when `ActionButton` cannot be used):
- `getPrimaryButtonStyles(primaryHex, isDark)` — safe fill + auto-contrast text
- `getSecondaryButtonStyles(primaryHex, isDark)` — neutral border + readable text
- `getDangerButtonStyles()` — solid red fill + white text
- `BTN` — static `StyleSheet` fallback tokens (theme-agnostic, for dark modal contexts)

**Rule:** All action buttons across the app must use one of:
1. `<ActionButton>` component (preferred)
2. `colors.primary` background + `colors.primaryText` text (not hardcoded `#FFF`)
3. `getPrimaryButtonStyles()` from `buttonStyles.ts` for inline cases

Never use hardcoded hex backgrounds (e.g. `#8B5CF6`) for action buttons — they break when users switch themes.

**DEV stress test:** Navigate to `/theme-stress` to visually verify contrast across all challenging backgrounds.

### Dev vs Prod behaviors

| Feature | DEV | PROD |
|---|---|---|
| DEV banner (red bar) | Shown | Hidden |
| Startup sanity check | Warns if tables empty | **Exits** if tables empty |
| Restore from backup | Allowed | **Blocked** |
| Destructive reset endpoints | 404 | **403 Blocked** |
| Backup creation | Yes | Yes |

### How to set up production

1. Add to production environment: `APP_ENV=prod`
2. Add to `mobile/.env.production`: `EXPO_PUBLIC_APP_ENV=prod`
3. Ensure `DATABASE_URL` points to a **separate** prod database file
4. Never run `prisma db push --force-reset` or any destructive migration in prod

---

## Backup System

### How it works

- **Automatic**: runs daily at 4:00 AM Costa Rica time (after the main cron job)
- **Startup backup**: runs 30 seconds after server startup
- **Location**: `backend/backups/YYYY-MM-DD/` (one folder per day)
- **Retention**: 7 rolling daily backups (oldest deleted automatically)

### What's backed up

- Users (profile, points, streaks, settings)
- Devotionals (full library)
- Streak snapshots
- Inventory (owned items)
- Devotional completions
- Support tickets
- Prayer requests
- Point ledger
- Collection claims + chapter progress
- Weekly progress
- User favorites + gifts

### Admin UI

Go to **Settings → tap "···" below Moderators** (OWNER only) → opens Backup screen.

- **"Crear backup ahora"** — triggers an immediate backup
- **List of backups** — shows last 7, with record counts
- **Restore (DEV only)** — tap ↩ to restore from a specific day

### API Endpoints (OWNER only)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/backups` | List all backups |
| GET | `/api/admin/backups/latest` | Download latest backup JSON |
| GET | `/api/admin/backups/:date` | Download specific backup |
| POST | `/api/admin/backups/run` | Trigger immediate backup |
| POST | `/api/admin/backups/restore` | Restore (DEV only, requires `confirm: "RESTORE_DEV_DATA"`) |

### Manual restore in PROD

1. `GET /api/admin/backups/latest` (with OWNER X-User-Id header) to download JSON
2. Restore data manually by re-importing or using a dev environment restore
3. Never use the automated restore in prod

---

## Role-Based Access Control (RBAC)

### User Roles

| Role | Value | Description |
|------|-------|-------------|
| User | `USER` | Default for all new accounts |
| Moderator | `MODERATOR` | Can view/respond support tickets |
| Owner | `OWNER` | Full admin access to all features |

### How to assign OWNER role

Set the `role` field directly in the SQLite database:
```sql
UPDATE User SET role = 'OWNER' WHERE nickname = 'YourNickname';
```

### Protected admin areas

| Feature | Required role | Access method |
|---------|--------------|---------------|
| Branding | OWNER | Tap logo 7× in Settings |
| Drops / Gifts | OWNER | Tap dots 7× in Settings |
| Support Tickets | MODERATOR+ | Tap version indicator 7× in Settings |

### Backend protection

All admin endpoints require `X-User-Id` header. The `requireRole` middleware in `backend/src/middleware/rbac.ts` looks up the user's role in the database and returns `403 Forbidden` with a log warning if access is denied.

- `PUT /api/branding` — OWNER only
- `GET/POST/PATCH/DELETE /api/gifts/admin/*` — OWNER only
- `GET /api/support/admin/tickets` — MODERATOR or OWNER


## Features

### Community Stats Header (2x2 Metrics Grid)
- Replaced "X caminando juntos" text with a 2×2 grid of global metrics:
  - **Usuarios activos** — users with `lastSeenAt >= now - 30 days`
  - **Devocionales** — total `SUM(devotionalsCompleted)` across all users
  - **Puntos ganados** — total earned (max of counter vs ledger sum)
  - **Puntos gastados** — total spent (max of counter vs ledger sum)
- Numbers formatted with `Intl.NumberFormat` (thousands separator)
- Skeleton placeholder while loading; fallback `—` on error
- Cached 60s server-side; React Query staleTime 60s

### Session Time Tracking (Server-Authoritative)
- New `UserSession` table in Prisma tracks each app session
- Heartbeat endpoint `POST /api/gamification/session/heartbeat`:
  - Creates new session on first heartbeat
  - Subsequent heartbeats: `delta = clamp(serverNow - lastSeenAt, 0, 60s)`
  - Atomically increments `User.totalTimeSeconds` and `User.lastSeenAt`
- Frontend heartbeat loop (every 30s when foreground):
  - Starts when user is authenticated and app is ready
  - Pauses when app goes to background
  - Resumes immediately on foreground with one heartbeat
  - Throttles: skips if request already in flight
  - `sessionId` persisted in Zustand/AsyncStorage for session continuity
- `User.pointsEarnedTotal` incremented on every `points/award`
- `User.pointsSpentTotal` incremented on every `store/purchase` and `store/purchase-bundle`

### Daily Devotional (Home Tab)
- One unique devotional per day for all users worldwide
- Beautiful hero image with devotional-style imagery
- Bible verse with citation
- **Continuous reading format** - all sections displayed without collapse
- **Tappable Bible References** - tap any reference like "(Lucas 10:25-37)" to view the full passage
  - Bottom sheet modal with passage text
  - Font size controls (+/-)
  - Copy and Share buttons
  - On-demand API fetch with local + persistent caching
  - Works offline for cached passages
- Completion tracking (3-minute read time - timer hidden from user)
- Favorite devotionals with heart icon
- **Share Options** - unified share system with 3 options across all screens (Today, Library, Devotional Detail):
  1. **Imagen completa (larga)** - full devotional as one long image
  2. **Imagen corta (versiculo)** - 1080x1080 square card with verse and thought of the day
  3. **5 imagenes (secciones)** - 5 separate 1080x1350 images, one per section (Cover, Verse, Reflection, Story, Application+Prayer)
- **Text-to-Speech (TTS)** - reads devotional aloud with section highlighting
  - Adjustable reading speed (0.5x - 2.0x)
  - Bible references spoken correctly — ALL numbered books use FEMININE form in Spanish:
    - `1 Samuel 3:4-5` → "Primera de Samuel, capítulo 3, versículos del 4 al 5"
    - `2 Reyes 5` → "Segunda de Reyes, capítulo 5" (never "Segundo/Primero")
    - `Salmo 51` → "Salmo, capítulo 51"
  - Handles dirty formats like `1 Samuel:3:4` (pre-sanitized before pattern matching)
  - Guard/log for unknown ordinals to prevent phonetic errors
- **Background music controls** - 5 instrumental Christian tracks
  - Piano Worship, Harp of Peace, Gentle Strings, Morning Prayer, Heavenly Piano
  - Volume control, track selection
  - Connected to global settings

### Library Tab
- Historical devotionals archive
- Filter by All or Favorites
- Thumbnail previews with dates and topics
- Tap to view full devotional
- **Continuous reading format** with collapsible overflow
- Full audio controls (TTS + Background Music)

### Store Tab (Premium UI)
- **Profile Header** with avatar (72px) + frame overlay, nickname, equipped title, points balance, gradient background
- **Weekly Challenges** - 2 rotating challenges per week with progress tracking and rewards
- **Weekly Chest** - Claim deterministic reward when all weekly challenges completed (random item or bonus points)
- **Promo Code Redemption** - "Canjear Codigo" expandable card
  - Text input for code entry
  - Server-validated redemption (one-time per user)
  - Success/error feedback with toast notification
  - Points instantly added to balance
- **Season Banner** — Shown automatically when an active season/event exists (date-range based). Displays `bannerTitle`, `bannerDescription`, and `accentColor` from the `Season` DB record.
- **Seasonal Items Sections** — In Avatares, Marcos, and Títulos tabs, seasonal items (from DB, linked via `seasonId`) appear at the top as a highlighted horizontal scroll section.
- **Seasonal Bundles** — In Paquetes tab, a "✝ Season" filter chip appears and seasonal adventure bundles from the DB render at the top with a `SeasonalAdventureCard`.
- **Progress Bars per Category** — Each CategoryCard shows `owned/total` with an animated progress bar
- **Subcategory Chip Selectors** — Each category has filter chips:
  - **Themes**: Todos | V2 Premium
  - **Frames**: Todos | V1 Básico | V2 Ilustrado
  - **Titles**: Todos | V1 Básico | V2 Citas Bíblicas
  - **Avatars**: Todos | V1 Básico | V2 Ilustrado
  - **Bundles**: Todos | Aventuras Bíblicas | ✝ Temporada (when active)
  - **Objetos Especiales**: Cartas Bíblicas | Tokens | Insignias

### Objetos Especiales (was "Tokens y Badges")
The `tokens` category has been renamed **Objetos Especiales** and reorganized into 3 subcategories:
1. **Cartas Bíblicas** — Contains the "Sobre Bíblico" card pack (2000 pts, repeatable)
2. **Tokens** — Contains "Pincel Mágico" (one-time nickname change, 15000 pts)
3. **Insignias** — Coming soon placeholder

### Biblical Cards System (Phase 1)
- **Store item:** `sobre_biblico` — 2000 pts, repeatable consumable. Each purchase draws 1 random card from the pool.
- **Card pool (Phase 1):** `david`, `moses`, `ark`
- **Inventory model:** `BiblicalCardInventory` table — `userId`, `cardId`, `owned`, `duplicates`
  - If user gets a new card: `owned = true`, `duplicates = 0`
  - If user gets a duplicate: `duplicates += 1`
- **Backend endpoint:** `GET /api/gamification/biblical-cards/:userId`
- **Purchase flow:** `POST /api/gamification/store/purchase` returns `drawnCard: { cardId, wasNew }` for `sobre_biblico`
- **Card reveal animation:** `CardRevealModal` — envelope appears → glow pulse → card reveal
- **Album screen:** `src/app/biblical-cards-album.tsx` — grid of all cards, owned = full art, unowned = "?" placeholder
  - Accessible from Settings → Mi Colección → Álbum Bíblico
- **Card data:** `src/lib/biblical-cards.ts` — `BIBLICAL_CARDS` record with all card definitions

### Pack Opening Animation System
- **Component:** `src/components/PackOpeningModal.tsx` — full pack opening state machine
- **Pack types:** `sobre_biblico` (Personajes Bíblicos), `pack_pascua` (Pascua), `pack_milagros` (Milagros de Jesús)
- **State machine:** idle → pack_appear → pack_ready → pack_zoom → pack_tearing → pack_open → card_back → card_flip → rarity_reveal → final
- **All 3 collections use PNG artwork** with transparent flag (white background removed via `resizeMode="contain"`)
- **Tear gesture:** horizontal drag tears top flap off envelope; TEAR_BASE_Y = 22% of card height
- **Timing:** `cardBackDelayMs: 2200`, `minPauseMs: 1200` applied to all collections
- **Assets (PNG):**
  - `assets/packs/sobre_biblico_pack.png` + `sobre_biblico_card_back.png` — Personajes Bíblicos golden pack
  - `assets/packs/pack_pascua_pack.png` + `pack_pascua_card_back.png` — Pascua red/gold pack
  - `assets/packs/pack_milagros_pack.png` + `pack_milagros_card_back.png` — Milagros dark blue pack
- **Store thumbnails:** All 3 collections use real PNG images (84×116) with matching glow shadows

### Card Definitions (Phase 1)
| id | Name | Category | Verse |
|----|------|----------|-------|
| david | David | Personajes | Hechos 13:22 |
| moses | Moisés | Personajes | Éxodo 3:10 |
| ark | Arca de Noé | Objetos | Génesis 6:14 |

### Phase 2 (NOT YET IMPLEMENTED)
- Trading system: only duplicate cards (`duplicates > 0`) will be tradable
- Users will be able to open trade requests, offer duplicate cards, accept/reject trades
- **6 Reward Categories**:
  - **Themes** (24 total: 6 original + 14 V2 premium + 4 chapter):
    - Original: Sunrise, Peaceful Night, Forest, Desert, Promise, Minimal
    - V2 Premium: Amanecer Dorado, Noche de Paz Profunda, Bosque Sereno, Desierto Suave, Promesa Violeta, Cielo de Gloria, Mar de Misericordia, Fuego del Espiritu, Jardin de Gracia, Olivo y Paz, Trono Azul, Lampara Encendida, Pergamino Antiguo, Luz Celestial
    - V2 themes have 5-color swatch preview + sample text "Aa"
  - **Avatar Frames** (35 total: 10 original + 12 V2 + 9 adventure + 4 chapter)
  - **Spiritual Titles** (42 total: 12 original + 5 chest + 4 chapter + 1 adventure + 20 V2 citas + 5 adventure V3):
    - **V2 — Citas Bíblicas** (20): Each has `bibleRef` field; shown in rarity color in PremiumTitleCard
    - Adventure titles (5–9): camino_en_el_mar, guardian_del_pacto, profeta_de_fuego, sonador_de_dios, apostol_de_las_naciones
  - **Avatars** (62 total: 8 free + 6 premium + 24 V2 + 18 Level 2 + 4 adventure V1 + 5 adventure V3):
    - Free: Dove, Sun, Star, Heart, Cross, Candle, Book, Praying
    - Premium V1: Rainbow, Crown, Angel, Olive, Lamb, Fish
    - **V2 Premium Collections** (4 mini-collections with 24 illustrated avatars)
    - **Level 2 — Identity & Calling** (3 collections, 18 avatars with spiritual meaning)
    - **Adventure V1** (4): Jonah, David, Esther, Daniel
    - **Adventure V3** (5): Moses, Noah, Elijah, Joseph, Paul — `animationReady: true`, `animationType: 'subtle_loop'`
    - L2 avatars carry `meaning`/`meaningEn` + `unlockType`/`unlockValue` shown in modal
    - V2 + L2 + Adv avatars have illustrated art rendering, glow, V2 badge
  - **Illustrated Avatars** (`src/components/IllustratedAvatar.tsx`):
    - All V2/L2/Adventure avatars render with unique `LinearGradient` backgrounds and geometric accent layers
    - 10 accent shape types: rays, stars, dots, rings, cross, waves, crown, flame, scroll, none
    - Used in store grid cards, item detail modal, and anywhere `PremiumAvatarCard` renders
    - Non-V2 avatars fall back to plain emoji rendering
  - **Bundles** (15 total: 3 original + 6 V2 + 9 adventure):
    - Original: Gratitude Kit, Divine Light Bundle, Pilgrim Collection
    - V2: Kit Gratitud V2, Kit Paz V2, Kit Fe V2, Kit Promesa V2, Kit Infantil, Paquete Naturaleza V2
    - **Aventuras Bíblicas** (9): Jonás(1), David(2), Ester(3), Daniel(4), Moisés(5), Noé(6), Elías(7), José(8), Pablo(9)
    - Adventures 3–9 marked `comingSoon: true` | Each: 2500 pts | collectionBonus: 600 | storyDays: 5
    - V2 bundles show "V2" badge; Adventure bundles appear under "Aventuras Bíblicas" subcategory chip
  - **Collections** (11 total: 4 original + 4 V2 + 3 Level 2, rebalanced rewards):
    - Original: Symbols of Faith (400 pts), Biblical Nature (500 pts), Frames of Light (550 pts), Titles of Service (600 pts)
    - V2: Simbolos de Fe V2 (700 pts), Naturaleza Biblica V2 (700 pts), Virtudes (650 pts), Kids (400 pts)
    - **Level 2**: Virtudes del Reino (800 pts), Los Llamados (900 pts), Simbolos Profundos (1000 pts)
    - **Server-authoritative claim system**: once complete, a "Reclamar / Claim" button appears
    - Claims stored in `CollectionClaim` table (unique per user+collection) — prevents double-claiming
    - Claiming triggers atomic Prisma transaction: points + ledger entry + claim record
    - Claimed state persists via `GET /api/gamification/collections/claims/:userId`
- **Item Detail Modal** with large preview:
  - Avatars: 120px illustrated preview (V2/L2/Adventure) or emoji circle
  - **L2 avatars show**: spiritual meaning card (bordered, italicized), unlock method badge (streak/devotionals/share), access type pill (FREE / PREMIUM / CHEST ONLY)
  - Frames: layered ring preview with hex color label
  - Themes: **mini app UI mockup** (200×155px) showing header, verse card, action button styled in the theme's colors
- **V2 Premium Features**:
  - V2 items marked with badge in cards
  - Enhanced visual styling (glow, borders, shadows)
  - 5-color preview for V2 themes
  - Locked items show blur overlay
- Rarity system with visual indicators:
  - **Common**: Gray tones, subtle border (150-400 pts)
  - **Rare**: Blue glow, star icon (400-900 pts)
  - **Epic**: Purple glow, gem icon (1200-5000 pts)
- Gradient backgrounds based on item rarity

### Community Tab
- **Respectful community progress display** - NOT a competitive leaderboard
- **Community header** with encouraging message: "Caminamos juntos" / "We walk together"
- **Member list** showing opted-in users as compact single-line rows:
  - Avatar (36px) with equipped frame
  - Nickname + descriptor chip (Admin/Tu/title) on same line
  - Inline metrics: book icon (devotionals), flame (streak), coin (points)
  - 🙏 prayer icon at far right (no text label) — tap animates with haptic + shows ✨ active state
  - Current user highlighted with "Tu" / "You" badge
- **"🙏 Acompañar" spiritual support gesture** (non-social, non-competitive):
  - Inline icon-only button (no "Acompañar en oración" label row)
  - Tap to send a silent prayer support to any community member
  - Haptic feedback (Light) on tap; icon transitions to 🙏✨ when active
  - Limit: 1 tap per viewer per day per member (enforced server-side via `UserSupport` table)
  - Displays cumulative `supportCount` next to icon
  - Optimistic UI update + scale/spring micro-animation
  - Disabled on own card; active state shown when already supported today
  - Backend: `POST /api/gamification/community/support` + `GET /api/gamification/community/support/status`
- **Non-toxic ordering** - Rotates daily between:
  - Recent activity (who's been active)
  - Current streak
  - Random shuffle (prevents fixed rankings)
- **Privacy-first**: Users must opt-in via Settings to appear
- **Empty state**: Encouraging message when no users have opted in
- **Pull-to-refresh** for latest community data

### Prayer Tab (Oración)
- **Simplified single-petition model** — one active petition per user at a time, no weekly concept
- **Mi Petición** section:
  - Dropdown category selector (10 categories), no free text
  - Saving replaces any existing petition atomically
  - Fixed 48-hour expiration from save time (live countdown shown)
  - Guardar disabled unless a category is selected
  - +10 points for submitting (once per day max)
- **"Ya oré hoy"** button: single daily prayer action, checkmark + spring animation on confirm (+5 pts)
- **Community display**: aggregated category counts with proportional bar chart — no usernames
- **Prayer Categories**:
  - Trabajo / Provisión (Work / Provision)
  - Salud (Health)
  - Familia (Family)
  - Paz / Ansiedad (Peace / Anxiety)
  - Sabiduría / Dirección (Wisdom / Direction)
  - Estudios (Studies)
  - Restauración (Restoration)
  - Gratitud (Gratitude)
  - Salvación (Salvation)
  - Fortaleza (Strength)
- **Community Requests**: View active requests from other users
  - Avatar + optional nickname (privacy setting)
  - Category chip with icon
  - Mode badge (Hoy / Semana)
- **Summary**: Aggregated category counts
- **"Ya oré hoy"** button: single action, checkmark + spring animation on confirm (+5 pts, once/day)
- **Privacy Setting**: "Mostrar mi nombre en oraciones" in Settings

### Prayer of the Day (Oración del Día)
- **AI-generated daily prayer** at 4:00 AM Costa Rica time
- Aggregates ALL currently active petition categories (no weekly split)
- Category-only input to AI — no usernames for privacy
- Displayed on Home screen after devotional content
- Bilingual (Spanish + English)

### Settings Tab
- **Enhanced Profile Card** with avatar + frame overlay
  - Equipped title display under nickname
  - Points balance and streak
  - Total shares count
  - Quick navigation to Store sections
  - **"Compartir mi progreso" button** — opens `ShareableProfileCard` modal
    - Generates a 1080×1350 (4:5) PNG card with: avatar (with frame ring), nickname, title badge, streak + devotionals stats, app branding, footer
    - Card background uses the user's equipped theme colors (gradient)
    - Captured offscreen with `react-native-view-shot`, shared via `expo-sharing`
    - Live scaled preview shown inside the bottom sheet before sharing
    - File: `src/components/ShareableProfileCard.tsx`
- **Community visibility toggle** - "Mostrarme en Comunidad" / "Show me in Community"
  - When enabled, user appears in Community tab
  - Shows nickname, avatar, frame, title, and progress stats
- Dark mode toggle (themes managed via Personalizar/Store)
- Language (English / Spanish)
- **Daily Notification Reminders**
  - Enable/disable push notifications
  - Customizable reminder time (time picker)
  - Test notification button
  - Notifications scheduled locally on device
- Streak reminders toggle
- **Background music global settings**
  - Enable/disable
  - Volume control (default: low)
- **Account Transfer** (Cross-Device Restore)
  - Generate Transfer Code: 8-character code, 15-minute expiry
  - Enter Transfer Code: Restore full account (points, inventory, progress) from another device
  - Debug User ID display for troubleshooting

### Gift Drops System
Admin-managed premium gift distribution to reward users.

**Database Models:**
- `GiftDrop` — admin-created gift with title, message, rewardType (CHEST/THEME/TITLE/AVATAR/ITEM), rewardId, audienceType (ALL_USERS/USER_IDS), isActive flag
- `UserGift` — per-user claim record: PENDING → CLAIMED or DISMISSED (unique per userId+giftDropId)

**Backend Endpoints (`/api/gifts/`):**
- `GET /pending?userId=xxx` — Returns first active PENDING gift for a user
- `POST /claim` — Claims a gift: marks CLAIMED, upserts item into UserInventory (or awards points for CHEST type)
- `GET /admin/list` — Last 20 gift drops with recipient counts
- `POST /admin/create` — Create new gift drop
- `PATCH /admin/:id` — Toggle active/update fields
- `POST /admin/publish` — Distribute UserGift PENDING records to audience (skips duplicates)
- `GET /admin/store-items` — Store items picker for reward selection

**Mobile (auto-popup):**
- Checks `GET /api/gifts/pending` on app start and every foreground resume
- `GiftModal` (`src/components/GiftModal.tsx`) — animated bottom sheet with:
  - Gift icon header + title + message
  - Animated reward preview (bouncing idle animation per reward type)
  - "¡Reclamar regalo!" primary CTA (amber, calls POST /claim, refreshes inventory/store queries)
  - "Más tarde" secondary button (closes modal, status stays PENDING)

**Admin UI:**
- Access: tap invisible footer in Settings 7 times → opens `/admin/gifts` modal
- Create form: title, message, reward type dropdown, reward ID picker (from store items list or manual input), audience selector (All/Specific IDs), active toggle
- List: last 20 drops with recipient count, active toggle, publish button
- Publish flow: confirms audience count before sending

### Peer-to-Peer Store Gift System
Users can send store items as gifts directly to other community members.

**DB Models:** `GiftTransaction`, `GiftNotification`
**Backend Endpoints (`/api/store/`):**
- `POST /gift` — Atomic: deduct sender points, add item to receiver inventory, create GiftTransaction + GiftNotification. Limits: 3/day, 20/week per sender.
- `GET /gift/notifications` — Unseen gift notifications for current user (includes item + sender info)
- `POST /gift/notifications/:id/accept` — Receiver accepts (marks seen, sets status "delivered")
- `POST /gift/notifications/:id/reject` — Receiver declines (marks seen only)
- `POST /gift/notifications/:id/seen` — Generic mark-seen
- `GET /gift/search-users?q=` — Search users by nickname prefix (min 2 chars, excludes self)
- `GET /gift/giftable-items?receiverId=&type=` — All purchasable items with `receiverOwns` flag

**Gift Flow (community screen):**
- Tap any community member card → `CommunityGiftFlowModal` opens
- Step 1: Category picker (avatar 🕊️ / marco 🖼️ / título 🏅) with available item counts
- Step 2: Rarity/tier picker (common/rare/epic) with LinearGradient, owned-by-receiver counts
- Step 3: Item cards — items receiver already owns shown greyed-out with "Ya tiene" badge (unselectable)
- Step 4: Confirm with cost summary, recipient chip, insufficient-points hint → send
- Step 5: Success animation with pulsing gift emoji

**ReceivedGiftModal (receiver side):**
- Shown on app start/foreground if unseen gift notifications exist
- Sparkle particle animation, rarity glow, item preview
- "Equipar ahora" → calls `/accept` endpoint (status → "delivered") then closes
- "Cerrar" → calls `/reject` endpoint (mark seen only) then closes
- Collection completion: item lands in inventory normally; client-side collection logic handles progress automatically

### Gamification System
- **Seasons / Events System** — DB-driven temporal content with automatic activation/deactivation:
  - `Season` table: `id`, `name`, `startDate`, `endDate`, `priority`, `storeSlot`, `bannerTitle`, `bannerDescription`, `accentColor`, `isActive`
  - `StoreItem` new fields: `category`, `subcategory`, `isNew`, `animationType`, `badge`, `bundleId`, `comingSoon`, `seasonId`, `releasedAt`
  - Seasonal items auto-appear in store when `now` is between `startDate` and `endDate`
  - `storeSlot` values: `featured_adventure`, `featured_store`, `season_event`
  - **Semana Santa (Easter) seed**: `season_easter` (2026-03-23 → 2026-04-06) with bundle `bundle_easter_path` + 3 reward items
  - Seed file: `backend/src/seed-seasons.ts` — runs at startup via `seedSeasons()`
- **Points earned for**:
  - Completing daily devotional: 50 pts
  - Sharing devotional: 10 pts (max 2/day)
  - Prayer confirmation: 8 pts (max 1/day)
  - TTS completion: 6 pts (max 1/day)
  - Favoriting devotionals: 10 pts
  - Streak bonuses: 100 pts (5-day), 250 pts (10-day), 1000 pts (30-day)
- **Weekly Challenges**: 2 challenges per week
  - Types: Complete devotionals, Share, Confirm prayer
  - Rewards: Points + optional exclusive items
- Streak tracking (current and best)
- Total devotionals completed
- Total shares count
- **Points awarded only once per devotional** (no duplicate points)
- **Daily Action Tracking** with caps to prevent farming
- **Points Ledger System** - Idempotent point tracking with deterministic ledger IDs ensures:
  - Points are awarded exactly once per action per user
  - Cross-device consistency (same user sees same points on phone/tablet)
  - No duplicate awards even with network retries

### Audio Features
- **Text-to-Speech (TTS)**
  - Play/Pause/Stop controls
  - Speed adjustment (0.5x - 2.0x)
  - Volume adjustment
  - Section highlighting during playback
  - Bible-optimized speech (converts "1 Pedro" to "Primera de Pedro")
  - **Curated Voice Selection** - 3 high-quality voices optimized for devotional content:
    - **System Default** (Recommended) - Your device's default voice
    - **Meditacion Suave** - Warm, gentle voice for prayer and night reading
    - **Narrador Devocional** - Deep, peaceful voice for stories and reflections
  - Voice preview button to test each voice before selecting
  - Voice selection persists across sessions
- **Background Music**
  - 5 instrumental Christian tracks
  - Volume control (synced with Settings)
  - Track selection

## Tech Stack

- **Framework**: Expo SDK 53 + React Native
- **Routing**: Expo Router (file-based)
- **State**: Zustand with AsyncStorage persistence
- **Server State**: TanStack React Query
- **Styling**: NativeWind (Tailwind CSS)
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native
- **Audio**: expo-speech (TTS), expo-av (Background Music)

## Project Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── index.tsx      # Home (Daily Devotional)
│   │   ├── library.tsx    # Library
│   │   ├── store.tsx      # Store
│   │   ├── community.tsx  # Community
│   │   ├── bible.tsx      # Bible Hub (home → testament → books → chapters → verses)
│   │   ├── prayer.tsx     # Prayer Requests
│   │   └── settings.tsx   # Settings
│   ├── devotional/
│   │   └── [date].tsx     # Devotional detail page
│   └── _layout.tsx        # Root layout
├── components/
│   ├── SplashScreen.tsx   # App splash
│   ├── OnboardingScreen.tsx # First-time setup
│   ├── BackgroundMusicProvider.tsx # Music context
│   ├── BibleReferenceText.tsx # Tappable Bible references in text
│   └── BiblePassageModal.tsx # Bottom sheet modal for Bible passages
└── lib/
    ├── constants.ts       # Themes, translations, avatars, prayer categories
    ├── firestore.ts       # Data services (mock)
    ├── store.ts           # Zustand state management
    ├── types.ts           # TypeScript definitions
    ├── notifications.ts   # Push notification service (expo-notifications)
    ├── bible-service.ts   # Bible passage fetching + caching
    ├── gamification-api.ts # Backend API client
    └── cn.ts              # Class name utility
```

## Onboarding Flow

1. Splash screen with app branding (2 seconds)
2. Nickname selection (unique, 3-15 characters)
3. Avatar selection from 8 default options

## Identity Single-Source-of-Truth

**Rule:** The backend `/api/gamification/me` response is the canonical source of truth for `userId`, `nickname`, and `role`.

**Bootstrap flow (every app launch):**
- `_layout.tsx` runs `bootstrapIdentity()` once when `appReady && isOnboarded`
- Calls `/me` with both `X-User-Id` (local) and `X-User-Nickname` (local) headers
- Backend tries ID lookup first, falls back to nickname if ID not found (handles offline onboarding)
- If backend returns a different `id`, `nickname`, or `role` → overwrites the Zustand store immediately
- All React Query caches are invalidated to refetch with the corrected identity

**Community sync safety:**
- `syncCurrentUser` in community.tsx only sends `nickname` to `syncUser` if the backend's `ensureUserExists` returned a canonical nickname
- Never pushes the local nickname directly — prevents stale local nickname from overwriting backend

**Debug panel (Settings → version footer → 5 taps):**
- Shows `IDENTITY CONSISTENT` (green) or `IDENTITY MISMATCH` (red) comparing store vs backend
- "Force sync identity from backend" button manually applies any corrections
- Shows exact backendURL, env/appEnv, community member count and nicknames
4. Welcome bonus: 100 points

## Theme Options

| Theme  | Style                    |
|--------|--------------------------|
| Dawn   | Warm peach/coral tones   |
| Dusk   | Dark purple/magenta      |
| Ocean  | Blue/teal coastal        |
| Forest | Green nature tones       |
| Rose   | Pink/red romantic        |

## Data Structure (Firestore-ready)

### Users Collection
- nickname, avatar, points
- streakCurrent, streakBest
- totalTime, totalShares, devotionalsCompleted
- favorites[], purchasedItems[]
- settings (theme, language, music, notifications, ttsSpeed, ttsVoice)

### Devotionals Collection
- date, title, imageUrl
- bibleVerse, bibleReference
- reflection, story, biblicalCharacter
- application, prayer
- topic (all in EN and ES)

## Future Enhancements

- [x] Text-to-Speech with section highlighting
- [x] Background music player UI
- [x] AI devotional generation (daily) - **GPT-4o generates new devotional every day at 4 AM Costa Rica**
- [x] Gamification system with themes, frames, titles, music unlocks
- [x] Weekly challenges with progress tracking
- [x] Share devotional feature with points
- [x] Prayer confirmation with daily tracking
- [x] **Local push notifications** - Daily reminder with customizable time
- [x] **Tappable Bible references** - View passage text on tap with caching
- [x] **Premium Store UI** - Collections, bundles, weekly chest, rarity system
- [x] **Cross-Device Account Transfer** - Transfer code flow for restoring progress
- [x] **Points Ledger** - Idempotent point tracking prevents duplicates
- [x] **Promo Code Redemption** - "Canjear Codigo" section in Store with server validation
- [x] **Community Tab** - Non-competitive community progress display with rotating order and opt-in privacy
- [x] **Prayer Tab** - Community prayer requests with privacy-safe categories, daily/weekly mode, and AI-generated daily prayer
- [ ] Actual background music audio files (upload via SOUNDS tab)
- [ ] Real image generation for devotionals

## Backend API

The app connects to a Hono backend with:

### Devotional Endpoints
- `GET /api/devotional/today` - Get today's devotional (generates if not exists)
- `GET /api/devotional/date/:date` - Get devotional by date
- `GET /api/devotional/all` - Get all devotionals for library
- `POST /api/devotional/generate/today` - Manually trigger generation

### Gamification Endpoints
- `POST /api/gamification/user/register` - Register new user with unique nickname
- `GET /api/gamification/user/:userId` - Get user profile with inventory
- `POST /api/gamification/user/:userId/sync` - Sync local user data to server
- `GET /api/gamification/nickname/check/:nickname` - Check nickname availability
- `POST /api/gamification/points/award` - Award points with daily cap checking
- `GET /api/gamification/store/items` - Get catalog items filtered by active seasons. Returns `{ items, activeSeasons }`. Items with `seasonId` outside active date range are excluded automatically.
- `GET /api/gamification/seasons/active` - Get currently active seasons (startDate ≤ now ≤ endDate)
- `GET /api/gamification/seasons/all` - Get all seasons (admin)
- `GET /api/gamification/inventory/:userId` - Get user's inventory
- `POST /api/gamification/store/purchase` - Purchase item
- `POST /api/gamification/user/:userId/equip` - Equip item (theme/frame/title/music)
- `GET /api/gamification/challenges/current` - Get current week's challenges
- `GET /api/gamification/challenges/progress/:userId` - Get user's challenge progress
- `POST /api/gamification/challenges/update` - Update challenge progress
- `POST /api/gamification/challenges/claim` - Claim challenge reward
- `GET /api/gamification/points/ledger/:userId` - Get point history with pagination

### Transfer Code Endpoints (Cross-Device)
- `POST /api/gamification/transfer/generate` - Generate 8-char transfer code (15-min expiry)
- `POST /api/gamification/transfer/restore` - Restore account using transfer code
- `GET /api/gamification/transfer/active/:userId` - Check for active transfer code

### Device ID Endpoints
- `GET /api/gamification/user/by-device/:deviceId` - Find user by device ID
- `PATCH /api/gamification/user/:userId/device` - Update user's device ID

### Promo Code Endpoints
- `POST /api/gamification/promo/redeem` - Redeem a promo code (server-validated, one-time per user)
- `GET /api/gamification/promo/user/:userId` - Get user's redemption history

### Community Endpoints
- `GET /api/gamification/community/members` - Get opted-in community members (paginated)
- `PATCH /api/gamification/community/opt-in/:userId` - Update user's community visibility
- `GET /api/gamification/community/opt-in/:userId` - Get user's community opt-in status

### Collection Claim Endpoints
- `GET /api/gamification/collections/claims/:userId` - Get all claimed collections for user
- `POST /api/gamification/collections/claim` - Claim a completed collection reward (server-authoritative, one-time per user+collection)

### Collection Card Reward Endpoints (Secret Card System)
- `POST /api/gamification/biblical-cards/collection-reward` - Grant secret card + bonus points for completing a card collection (idempotent, once per user per collection)
- `GET /api/gamification/biblical-cards/collection-reward/status/:userId` - Get list of collection card rewards already claimed by user

#### Collection Card Reward Logic
- **Trigger**: Completing all 14 cards in `pascua_2026` → grants `jesus_resucitado` (Legendary) + 1000 pts
- **Detection**: `useEffect` in album screen watches `cardInventory` changes; fires once per session via `claimedThisSession` ref
- **Idempotency**: `CollectionCardReward` table (unique on `userId+collectionId`); backend returns 409 if already claimed
- **Modal**: `CollectionCompleteModal` — gold gradient border, animated card glow pulse, bonus points chip, "Ver álbum" CTA
- **Secret card `jesus_resucitado`**: Legendary rarity, NOT in any pack pool (`inStandardPool: false`), no `eventSet`

### Prayer Endpoints
- `POST /api/prayer/request` - Submit or update a prayer request (category + mode)
- `GET /api/prayer/request/:userId` - Get user's active prayer requests
- `DELETE /api/prayer/request/:userId/:mode` - Delete user's prayer request
- `GET /api/prayer/community` - Get all active community prayer requests (paginated)
- `GET /api/prayer/summary` - Get aggregated category counts
- `GET /api/prayer/daily/today` - Get today's AI-generated prayer
- `GET /api/prayer/daily/:dateId` - Get daily prayer by date
- `POST /api/prayer/prayed-for-community` - Record "I prayed for community" action (+5 pts)
- `GET /api/prayer/prayed-for-community/:userId` - Check if user prayed today
- `PATCH /api/prayer/display-opt-in/:userId` - Update prayer display privacy setting
- `GET /api/prayer/display-opt-in/:userId` - Get prayer display privacy setting

### Promo Code System
- **Server-authoritative validation** - All redemptions validated via Prisma transaction
- **One-time per user enforcement** - Each code can only be redeemed once per user
- **Idempotent ledger tracking** - Prevents duplicate point awards
- **Input normalization** - Accepts codes with accents, spaces, and any case
- **Initial codes**:
  - `Fe` - 250 points
  - `Amor` - 300 points
  - `Cristo` - 5000 points

### Daily Generation Cron
- Runs automatically at **4:00 AM Costa Rica time (10:00 AM UTC)**
- Uses OpenAI GPT-4o to generate bilingual content (EN/ES)
- Topics cycle through 31 spiritual themes (Faith, Love, Hope, Peace, etc.)
- Stores in SQLite database via Prisma

### Weekly Challenge Generation
- Challenges generated at server startup and weekly on Mondays
- 2 challenges per week (different types when possible)
- Types: devotional_complete, share, prayer

### Bible Passage Endpoints
- `GET /api/bible/passage?reference=Lucas+10:25-37&lang=es` - Get Bible passage text
- `GET /api/bible/books` - Full list of all 66 canonical Bible books
- `GET /api/bible/chapter?bookId=GEN&chapter=1&lang=es` - All verses of a chapter (parsed verse array)
- Supports both Spanish and English Bibles (Reina Valera 1960, KJV)

## Bible Module (feature/bible-hub-polish)

### Navigation Flow
Bible Hub Home → Testament List (OT/NT) → Book List → Chapter Grid → Verse Reader

### Bible Home Screen (`src/app/(tabs)/bible.tsx`)
- **Hero section**: devotional image with verse-of-the-day overlay (reuses `['todayDevotional']` React Query cache — same source as Home screen, zero duplicate fetches)
- **Search bar**: always-visible, filters books by name (Spanish/English). Submit navigates to books view with search results
- **Version selector**: pill UI with RVR60 (active), NVI, Lenguaje Actual (both marked "PRONTO" — UI built, API connection pending)
- **Testament cards**: "Antiguo Testamento" (📜, 39 books) and "Nuevo Testamento" (✝️, 27 books) — tap to navigate to filtered book list
- **Stats bar**: 66 books / 1,189 chapters / 31,102 versículos

### Verse Highlighting
- **Trigger**: long press any verse (400ms, haptic feedback)
- **Colors**: Amarillo (`#FEF08A`), Verde (`#BBF7D0`), Azul (`#BFDBFE`)
- **Persistence**: AsyncStorage key `bible_highlights_v1` → `Record<"${bookId}_${chapter}_${verse}", HighlightColor>`
- **Operations**: apply color, change color, remove highlight
- Highlights survive app restarts and persist per-verse

### Bible Versions
| Version | Label | Status |
|---------|-------|--------|
| Reina-Valera 1960 | RVR60 | ✅ Active (BibleGateway fallback, no API key needed) |
| Nueva Versión Internacional | NVI | 🔜 UI built — unavailable. Needs `BIBLE_API_KEY` + new Bible ID from api.scripture.api.bible |
| Lenguaje Actual | L.A. | 🔜 UI built — unavailable. Same requirement as NVI |

### Verse Content Search (`GET /api/bible/search`)
- Searches `Devotional.bibleVerseEs` and `BiblePassage.text` in SQLite
- Reference parser maps Spanish/English book names → USFM bookIds (66 books each)
- Client debounces 500ms before calling; results cached 5 min via React Query
- Tapping a result navigates directly to the chapter and flashes the target verse yellow (3s)
- Search depth grows as users read (BiblePassage cache fills organically)

### Continue Reading
- Last-read chapter persisted in AsyncStorage key `bible_last_read_v1`
- Written every time a chapter is opened (from any path: testament nav, search result, direct)
- Shows as a card on the Bible home screen when no search is active

### Types (`src/lib/bible/types.ts`)
- `BibleNavView`: `'home' | 'books' | 'chapters' | 'verses'`
- `BibleVersion`: `'RVR60' | 'NVI' | 'LA'`
- `BibleVersionInfo`: version metadata with `available` flag
- `HighlightColor`: `'yellow' | 'green' | 'blue'`
- `HighlightMap`: `Record<string, HighlightColor>`
- `BibleSearchResult`: `{ reference, text, bookId, chapter, verse, source }`
- `BibleLastRead`: `{ bookId, bookName, chapter, lang, timestamp }`

### Support Ticket System
- **Streak Snapshots**: Daily cron generates snapshots for ALL users at 4 AM Costa Rica time
  - Stored in `StreakSnapshot` table: `snapshotDate + userId` (unique), streak, lastDevotionalDate, totalCompleted
  - Retains last 2 days (yesterday + day before); today's snapshot is never deleted
- **Support Tickets**: `SupportTicket` table tracks streak/devotional disputes
  - Types: `streak_missing`, `devotional_not_counted`
  - Statuses: `open`, `auto_fixed`, `needs_human`, `closed`
  - Includes `beforeState`/`afterState` JSON for audit trail
- **Auto-Resolution Rules**:
  - Finds most recent snapshot (yesterday → day-before-yesterday fallback)
  - `snapshotStreak >= 1` AND `abs(snapshot - claimed) <= 1` → auto-fix: set streak to max(claimed, current)
  - Diff > 1 OR no snapshot → `needs_human` (escalation logged)
- **Endpoints**:
  - `POST /api/support/ticket` — create ticket with auto-resolution
  - `GET /api/support/tickets/:userId` — fetch last 20 tickets for user

### TTS No-Repeat Guard (Home Screen)
- `speechJobIdRef` (number): increments on every new play/pause/stop — all callbacks verify their jobId matches before proceeding
- `lastSpeakAttemptRef`: 500ms debounce prevents rapid-fire play calls
- `Speech.stop()` always called before starting a new TTS job
- Stale `onDone`/`onError` callbacks from previous jobs are silently dropped via jobId check

### Tablet UI Scaling (width >= 768px)
- `IS_TABLET` constant detected via `Dimensions.get('window').width >= 768`
- Scaling helpers: `ts()` +25% titles, `ss()` +20% subtitles, `bs()` +15% body, `ps()` -25% padding
- ContentSection applies tablet-responsive fontSize and reduced vertical margins on tablet
- Mobile behavior is 100% unchanged (scaling functions return input unchanged when not tablet)
- Fetches from Bible API on demand, caches for future requests

### Duel Leaderboard (feature/duel-leaderboard)
- **Entry point**: Pregame screen (`duelo/pregame.tsx`) — "Ver ranking" button navigates to `duelo/leaderboard`
- **Screen**: `duelo/leaderboard.tsx` — full-screen dark leaderboard matching duel aesthetic
- **Backend**: `GET /api/duel/leaderboard?limit=100` — returns top players with `duelWins > 0`, sorted by `duelRating DESC`, then `duelWins DESC`
- **Data per row**: rank, avatarId, nickname, titleId, duelRating, duelWins, duelLosses, duelWinStreak
- **Highlights**: Top 3 rows use gold/silver/bronze styling with Crown/Trophy/Star icons
- **Current user**: Highlighted in cyan anywhere in the list; "not in top 100" banner shown if absent
- **Scope**: Global only — Local tab skipped (countryCode field exists but not reliably populated)
- **Navigation**: Registered in `_layout.tsx` as `presentation: 'card'`
