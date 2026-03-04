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
- **Progress Bars per Category** — Each CategoryCard shows `owned/total` with an animated progress bar
- **Subcategory Chip Selectors** — Each category has filter chips:
  - **Themes**: Todos | V2 Premium
  - **Frames**: Todos | V1 Básico | V2 Ilustrado
  - **Titles**: Todos | V1 Básico | V2 Citas Bíblicas
  - **Avatars**: Todos | V1 Básico | V2 Ilustrado
  - **Bundles**: Todos | Aventuras Bíblicas
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

### Gamification System
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
- `GET /api/gamification/store/items` - Get all store items (filterable by type)
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
- Supports both Spanish and English Bibles (Reina Valera 1960, KJV)
- Server-side caching in SQLite database

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
