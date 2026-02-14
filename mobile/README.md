# Daily Light - Christian Daily Devotional App

A beautiful, cross-platform mobile app delivering daily Christian devotionals with faith, hope, and love messages.

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
- **Share as Image** - generates a beautiful long image of the full devotional including header image for sharing on social media
- **Text-to-Speech (TTS)** - reads devotional aloud with section highlighting
  - Adjustable reading speed (0.5x - 2.0x)
  - Bible references spoken correctly ("1 Pedro" → "Primera de Pedro")
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

### Store Tab
- **Profile Header** with avatar + frame overlay, nickname, equipped title, points balance
- **Weekly Challenges** - 2 rotating challenges per week with progress tracking and rewards
- **5 Reward Categories**:
  - **Themes** (6 visual palettes): Sunrise, Peaceful Night, Forest, Desert, Promise, Minimal
  - **Avatar Frames** (10 overlays): Golden, Silver, Blue Hope, Green Life, Soft Light, Leaf Crown, Stars, Parchment, Soft Fire, Heaven
  - **Music Tracks** (5 free + 8 premium): Piano Gratitud, Arpa Paz, Cuerdas Esperanza, etc.
  - **Spiritual Titles** (12 titles): Buscador de Luz, Corazón Agradecido, Siervo Fiel, etc.
  - **Avatars** (8 free + 6 premium)
- Purchase confirmation and equip system
- Rarity indicators (common/rare/epic)

### Settings Tab
- **Enhanced Profile Card** with avatar + frame overlay
  - Equipped title display under nickname
  - Points balance and streak
  - Quick navigation to Store sections
- Theme selection (6 purchasable themes)
- Dark mode toggle
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
- Total time spent in app
- **Daily Action Tracking** with caps to prevent farming

### Audio Features
- **Text-to-Speech (TTS)**
  - Play/Pause/Stop controls
  - Speed adjustment (0.5x - 2.0x)
  - Section highlighting during playback
  - Bible-optimized speech (converts "1 Pedro" to "Primera de Pedro")
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
    ├── constants.ts       # Themes, translations, avatars
    ├── firestore.ts       # Data services (mock)
    ├── store.ts           # Zustand state management
    ├── types.ts           # TypeScript definitions
    ├── notifications.ts   # Push notification service (expo-notifications)
    ├── bible-service.ts   # Bible passage fetching + caching
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
- totalTime, devotionalsCompleted
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
- [ ] Firebase Firestore integration (user data sync across devices)
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
- Fetches from Bible API on demand, caches for future requests
