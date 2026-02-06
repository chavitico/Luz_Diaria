# Daily Light - Christian Daily Devotional App

A beautiful, cross-platform mobile app delivering daily Christian devotionals with faith, hope, and love messages.

## Features

### Daily Devotional (Home Tab)
- One unique devotional per day for all users worldwide
- Beautiful hero image with devotional-style imagery
- Bible verse with citation
- Expandable sections: Reflection, Story, Biblical Character, Application, Prayer
- Completion tracking (3-minute read time + scroll to bottom)
- Favorite devotionals with heart icon

### Library Tab
- Historical devotionals archive
- Filter by All or Favorites
- Thumbnail previews with dates and topics
- Tap to view full devotional

### Store Tab
- Points balance display
- Redeem points for:
  - Avatar unlocks
  - Nickname change tickets
- Visual feedback for purchases

### Settings Tab
- User profile with stats (streak, completed, time)
- Theme selection (Dawn, Dusk, Ocean, Forest, Rose)
- Dark mode toggle
- Language (English / Spanish)
- Notification preferences
- Background music settings

### Gamification
- Points earned for:
  - Completing daily devotional: 50 pts
  - Favoriting devotionals: 10 pts
  - Streak bonuses at milestones
- Streak tracking (current and best)
- Total devotionals completed
- Total time spent in app

## Tech Stack

- **Framework**: Expo SDK 53 + React Native
- **Routing**: Expo Router (file-based)
- **State**: Zustand with AsyncStorage persistence
- **Server State**: TanStack React Query
- **Styling**: NativeWind (Tailwind CSS)
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native

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
│   └── OnboardingScreen.tsx # First-time setup
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
- settings (theme, language, music, notifications)

### Devotionals Collection
- date, title, imageUrl
- bibleVerse, bibleReference
- reflection, story, biblicalCharacter
- application, prayer
- topic (all in EN and ES)

## Future Enhancements

- [ ] Firebase Firestore integration
- [ ] AI devotional generation (daily)
- [ ] Text-to-Speech with word highlighting
- [ ] Background music player
- [ ] Push notifications
- [ ] Real image generation for devotionals
