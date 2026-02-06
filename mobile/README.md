# Daily Light - Christian Daily Devotional App

A beautiful, cross-platform mobile app delivering daily Christian devotionals with faith, hope, and love messages.

## Features

### Daily Devotional (Home Tab)
- One unique devotional per day for all users worldwide
- Beautiful hero image with devotional-style imagery
- Bible verse with citation
- **Continuous reading format** - all sections displayed without collapse
- Completion tracking (3-minute read time - timer hidden from user)
- Favorite devotionals with heart icon
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
- Points balance display
- Redeem points for:
  - Avatar unlocks (premium avatars)
  - Nickname change tickets
- Visual feedback for purchases
- **All purchased items can be equipped** in Settings

### Settings Tab
- User profile with stats (streak, completed, time)
- **Avatar selection** - tap profile to change avatar
  - Free avatars: Dove, Sun, Star, Heart, Cross, Candle, Book, Praying
  - Premium avatars: Rainbow, Crown, Angel, Olive, Lamb, Fish (unlock in Store)
- Theme selection (Dawn, Dusk, Ocean, Forest, Rose)
- Dark mode toggle
- Language (English / Spanish)
- Notification preferences
- **Background music global settings**
  - Enable/disable
  - Volume control (default: low)

### Gamification
- Points earned for:
  - Completing daily devotional: 50 pts
  - Favoriting devotionals: 10 pts
  - Streak bonuses at milestones
- Streak tracking (current and best)
- Total devotionals completed
- Total time spent in app

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
│   └── BackgroundMusicProvider.tsx # Music context
└── lib/
    ├── constants.ts       # Themes, translations, avatars
    ├── firestore.ts       # Data services (mock)
    ├── store.ts           # Zustand state management
    ├── types.ts           # TypeScript definitions
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
- [ ] Firebase Firestore integration
- [ ] AI devotional generation (daily)
- [ ] Actual background music audio files (upload via SOUNDS tab)
- [ ] Push notifications
- [ ] Real image generation for devotionals
