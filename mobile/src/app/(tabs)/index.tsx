// Home Screen - Daily Devotional Display with continuous format and audio controls

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LuzDiariaIconWhite } from '@/components/LuzDiariaIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Slider from '@react-native-community/slider';
import {
  BookOpen,
  Heart,
  ChevronDown,
  ChevronUp,
  Check,
  Flame,
  Star,
  Trophy,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Music,
  Settings2,
  Share2,
  X,
  Download,
} from 'lucide-react-native';
import { ShareSheet } from '@/components/ShareSheet';
import { BibleReferenceText } from '@/components/BibleReferenceText';
import { firestoreService, getTodayDate } from '@/lib/firestore';
import { markDevotionalCompletedToday } from '@/lib/notifications';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useUserFavorites,
  useUserSettings,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { COMPLETION_REQUIREMENTS, POINTS } from '@/lib/types';
import type { Devotional, DailyActions } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useMusicPlayer, MUSIC_TRACKS } from '@/components/BackgroundMusicProvider';
import { PointsToast, usePointsToast } from '@/components/PointsToast';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';

const { width, height } = Dimensions.get('window');
const IS_TABLET = width >= 768;

// Tablet-responsive scaling helpers
const ts = (mobile: number) => IS_TABLET ? mobile * 1.25 : mobile;  // title scale +25%
const ss = (mobile: number) => IS_TABLET ? mobile * 1.20 : mobile;  // subtitle scale +20%
const bs = (mobile: number) => IS_TABLET ? mobile * 1.15 : mobile;  // body scale +15%
const ps = (mobile: number) => IS_TABLET ? mobile * 0.75 : mobile;  // padding/margin reduce -25%

// Confetti colors
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// Daily action limits
const DAILY_LIMITS = {
  SHARE_MAX: 2,
};

// Import TTS utilities
import {
  addTTSPausesForNumberedPoints,
  sanitizeForTTS,
  preprocessNumbersForTTS,
} from '@/lib/tts-voices';
import { pickBestVoice, type PickedVoice } from '@/lib/voice-picker';
import { VoiceFallbackBanner } from '@/components/VoiceFallbackBanner';
import { VoiceSetupModal, VOICE_SETUP_SHOWN_KEY } from '@/components/VoiceSetupModal';

// Bible book translations from English to Spanish
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  'Genesis': 'Genesis',
  'Exodus': 'Exodo',
  'Leviticus': 'Levitico',
  'Numbers': 'Numeros',
  'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josue',
  'Judges': 'Jueces',
  'Ruth': 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Cronicas',
  '2 Chronicles': '2 Cronicas',
  'Ezra': 'Esdras',
  'Nehemiah': 'Nehemias',
  'Esther': 'Ester',
  'Job': 'Job',
  'Psalm': 'Salmo',
  'Psalms': 'Salmos',
  'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastes',
  'Song of Solomon': 'Cantares',
  'Song of Songs': 'Cantares',
  'Isaiah': 'Isaias',
  'Jeremiah': 'Jeremias',
  'Lamentations': 'Lamentaciones',
  'Ezekiel': 'Ezequiel',
  'Daniel': 'Daniel',
  'Hosea': 'Oseas',
  'Joel': 'Joel',
  'Amos': 'Amos',
  'Obadiah': 'Abdias',
  'Jonah': 'Jonas',
  'Micah': 'Miqueas',
  'Nahum': 'Nahum',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sofonias',
  'Haggai': 'Hageo',
  'Zechariah': 'Zacarias',
  'Malachi': 'Malaquias',
  'Matthew': 'Mateo',
  'Mark': 'Marcos',
  'Luke': 'Lucas',
  'John': 'Juan',
  'Acts': 'Hechos',
  'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  'Galatians': 'Galatas',
  'Ephesians': 'Efesios',
  'Philippians': 'Filipenses',
  'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  'Titus': 'Tito',
  'Philemon': 'Filemon',
  'Hebrews': 'Hebreos',
  'James': 'Santiago',
  '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro',
  '1 John': '1 Juan',
  '2 John': '2 Juan',
  '3 John': '3 Juan',
  'Jude': 'Judas',
  'Revelation': 'Apocalipsis',
};

// Translate Bible reference from English to Spanish
function translateBibleReference(reference: string): string {
  let result = reference;
  // Sort by length descending to match longer names first (e.g., "1 Corinthians" before "Corinthians")
  const sortedEntries = Object.entries(BIBLE_BOOK_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [english, spanish] of sortedEntries) {
    if (result.includes(english)) {
      result = result.replace(english, spanish);
      break;
    }
  }
  return result;
}

// Normalize Bible references for TTS to speak chapter:verse correctly
// Converts "Génesis 3:28" → "Génesis, capítulo 3, versículo 28"
// Converts "1 Samuel 3:4-5" → "Primera de Samuel, capítulo 3, versículos del 4 al 5"
// Converts "2 Samuel 11"    → "Segunda de Samuel, capítulo 11"
// Converts "Salmo 51"       → "Salmo, capítulo 51"
// RULE: ALL numbered books use feminine form (Primera/Segunda/Tercera — never Primero/Segundo)
function normalizeBibleRefForTTS(text: string, language: 'en' | 'es'): string {
  if (language !== 'es') {
    // For English, convert chapter:verse to "chapter X verse Y" or "chapter X verses Y through Z"
    // Also handle numbered books: "2 Samuel 11" → "Second Samuel, chapter 11"
    const enNumberedBooks = ['Samuel', 'Kings', 'Chronicles', 'Corinthians', 'Thessalonians', 'Timothy', 'Peter', 'John'];
    const enOrdinals: Record<string, string> = { '1': 'First', '2': 'Second', '3': 'Third' };
    let result = text;
    // Numbered book + chapter + optional :verse
    const enBookPattern = new RegExp(
      `(^|[\\s,;.("'])([123])\\s+(${enNumberedBooks.join('|')})\\s+(\\d+)(?::(\\d+)(?:[-–](\\d+))?)?([\\s,;.)"']|$)`,
      'g'
    );
    result = result.replace(enBookPattern, (_m, pre, num, book, chap, vs, vsEnd, suf) => {
      const ord = enOrdinals[num] ?? num;
      if (vs) {
        const verseText = vsEnd ? `verses ${vs} through ${vsEnd}` : `verse ${vs}`;
        return `${pre}${ord} ${book}, chapter ${chap}, ${verseText}${suf}`;
      }
      return `${pre}${ord} ${book}, chapter ${chap}${suf}`;
    });
    // Plain chapter:verse
    result = result.replace(/(\d+):(\d+)(?:[-–](\d+))?/g, (_m, chapter, verseStart, verseEnd) => {
      if (verseEnd) return `chapter ${chapter} verses ${verseStart} through ${verseEnd}`;
      return `chapter ${chapter} verse ${verseStart}`;
    });
    return result;
  }

  // SPANISH — ALL numbered Bible books use feminine ordinals (no exceptions)
  // Guard: 1 → Primera de, 2 → Segunda de, 3 → Tercera de
  const spanishOrdinals: Record<string, string> = {
    '1': 'Primera de',
    '2': 'Segunda de',
    '3': 'Tercera de',
  };

  // List of Bible book names in Spanish (to identify Bible references vs regular numbers)
  const spanishBibleBooks = [
    'Génesis', 'Genesis', 'Éxodo', 'Exodo', 'Levítico', 'Levitico', 'Números', 'Numeros',
    'Deuteronomio', 'Josué', 'Josue', 'Jueces', 'Rut', 'Samuel', 'Reyes', 'Crónicas', 'Cronicas',
    'Esdras', 'Nehemías', 'Nehemias', 'Ester', 'Job', 'Salmos', 'Salmo', 'Proverbios',
    'Eclesiastés', 'Eclesiastes', 'Cantares', 'Isaías', 'Isaias', 'Jeremías', 'Jeremias',
    'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Amos', 'Abdías', 'Abdias',
    'Jonás', 'Jonas', 'Miqueas', 'Nahúm', 'Nahum', 'Habacuc', 'Sofonías', 'Sofonias',
    'Hageo', 'Zacarías', 'Zacarias', 'Malaquías', 'Malaquias',
    'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', 'Corintios', 'Gálatas', 'Galatas',
    'Efesios', 'Filipenses', 'Colosenses', 'Tesalonicenses', 'Timoteo', 'Tito', 'Filemón', 'Filemon',
    'Hebreos', 'Santiago', 'Pedro', 'Judas', 'Apocalipsis'
  ];

  // Pre-sanitize dirty formats like "1 Samuel:3:4" → "1 Samuel 3:4"
  let result = text.replace(
    new RegExp(
      `([123])?\\s*(${spanishBibleBooks.join('|')}):(\\d+)`,
      'gi'
    ),
    (_m, num, book, chap) => num ? `${num} ${book} ${chap}` : `${book} ${chap}`
  );

  // Pattern for chapter:verse references (with optional verse range)
  const bibleRefWithVersePattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+):(\\d+)` + // Chapter:verse
    `(?:[-–](\\d+))?` + // Optional verse range end
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefWithVersePattern, (_match, prefix, num, book, chapter, verseStart, verseEnd, suffix) => {
    let expandedBook = book;
    if (num) {
      expandedBook = `${spanishOrdinals[num] ?? `${num}ª de`} ${book}`;
    }
    const verseText = verseEnd
      ? `versículos del ${verseStart} al ${verseEnd}`
      : `versículo ${verseStart}`;
    return `${prefix}${expandedBook}, capítulo ${chapter}, ${verseText}${suffix}`;
  });

  // Pattern for chapter-only references (no :verse part)
  // Matches: "2 Samuel 11", "Salmo 51", "Génesis 37"
  const bibleRefChapterOnlyPattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+)` + // Chapter number
    `(?![:\\d])` + // NOT followed by : or digit (avoid double-matching chapter:verse)
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefChapterOnlyPattern, (_match, prefix, num, book, chapter, suffix) => {
    let expandedBook = book;
    if (num) {
      expandedBook = `${spanishOrdinals[num] ?? `${num}ª de`} ${book}`;
    }
    return `${prefix}${expandedBook}, capítulo ${chapter}${suffix}`;
  });

  return result;
}

// Helper to convert Bible references to spoken form
function formatBibleReferenceForSpeech(reference: string, language: 'en' | 'es'): string {
  const spanishConversions: Record<string, string> = {
    '1 Pedro': 'Primera de Pedro',
    '2 Pedro': 'Segunda de Pedro',
    '1 Juan': 'Primera de Juan',
    '2 Juan': 'Segunda de Juan',
    '3 Juan': 'Tercera de Juan',
    '1 Corintios': 'Primera de Corintios',
    '2 Corintios': 'Segunda de Corintios',
    '1 Tesalonicenses': 'Primera de Tesalonicenses',
    '2 Tesalonicenses': 'Segunda de Tesalonicenses',
    '1 Timoteo': 'Primera de Timoteo',
    '2 Timoteo': 'Segunda de Timoteo',
    '1 Reyes': 'Primera de Reyes',
    '2 Reyes': 'Segunda de Reyes',
    '1 Samuel': 'Primera de Samuel',
    '2 Samuel': 'Segunda de Samuel',
    '1 Cronicas': 'Primera de Cronicas',
    '2 Cronicas': 'Segunda de Cronicas',
  };

  const englishConversions: Record<string, string> = {
    '1 Peter': 'First Peter',
    '2 Peter': 'Second Peter',
    '1 John': 'First John',
    '2 John': 'Second John',
    '3 John': 'Third John',
    '1 Corinthians': 'First Corinthians',
    '2 Corinthians': 'Second Corinthians',
    '1 Thessalonians': 'First Thessalonians',
    '2 Thessalonians': 'Second Thessalonians',
    '1 Timothy': 'First Timothy',
    '2 Timothy': 'Second Timothy',
    '1 Kings': 'First Kings',
    '2 Kings': 'Second Kings',
    '1 Samuel': 'First Samuel',
    '2 Samuel': 'Second Samuel',
    '1 Chronicles': 'First Chronicles',
    '2 Chronicles': 'Second Chronicles',
  };

  const conversions = language === 'es' ? spanishConversions : englishConversions;
  let result = reference;
  for (const [key, value] of Object.entries(conversions)) {
    if (result.includes(key)) {
      result = result.replace(key, value);
      break;
    }
  }

  // Apply chapter:verse normalization for TTS
  result = normalizeBibleRefForTTS(result, language);

  return result;
}

// Helper to check if a daily action is available
function isDailyActionAvailable(
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
function isDailyActionDone(
  actionDate: string | undefined,
  actionDone: boolean | undefined,
  today: string
): boolean {
  if (!actionDate || actionDate !== today) {
    return false;
  }
  return actionDone ?? false;
}

// Individual confetti piece component
function ConfettiPiece({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const duration = 2500 + Math.random() * 1000;

    translateY.value = withDelay(
      delay,
      withTiming(height + 100, { duration })
    );
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(startX + randomX * 0.5, { duration: duration * 0.3 }),
        withTiming(startX + randomX, { duration: duration * 0.7 })
      )
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (2 + Math.random() * 3), { duration })
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pieceSize = 8 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          width: pieceSize,
          height: isCircle ? pieceSize : pieceSize * 2,
          backgroundColor: color,
          borderRadius: isCircle ? pieceSize / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// Confetti explosion component
function ConfettiCelebration({ visible }: { visible: boolean }) {
  if (!visible) return null;

  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 300,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: Math.random() * width,
  }));

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </View>
  );
}

// Achievement popup component
function AchievementPopup({
  visible,
  points,
  colors,
  language,
}: {
  visible: boolean;
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
            borderWidth: 3,
            borderColor: '#FFD700',
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFD700',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Trophy size={40} color="#FFFFFF" />
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {language === 'es' ? 'Devocional Completado!' : 'Devotional Complete!'}
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: 28,
            fontWeight: 'bold',
          }}
        >
          +{points} {language === 'es' ? 'puntos' : 'points'}
        </Text>
      </Animated.View>
    </View>
  );
}

// Content section - continuous display
interface ContentSectionProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  isHighlighted?: boolean;
  sectionIndex: number;
}

function ContentSection({ title, content, icon, colors, isHighlighted, sectionIndex }: ContentSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + sectionIndex * 50).duration(400)}
      style={{ marginBottom: IS_TABLET ? 16 : 24 }}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          {icon}
        </View>
        <Text
          style={{ color: colors.primary, fontSize: ss(18), fontWeight: 'bold' }}
        >
          {title}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 16,
          padding: IS_TABLET ? 16 : 20,
          backgroundColor: isHighlighted ? colors.primary + '15' : colors.surface,
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent',
        }}
      >
        <BibleReferenceText
          style={{ color: colors.text, fontSize: bs(16), lineHeight: bs(28) }}
        >
          {content}
        </BibleReferenceText>
      </View>
    </Animated.View>
  );
}

// Prayer Confirmation Button Component
function PrayerConfirmButton({
  colors,
  language,
  isPrayerDone,
  onConfirm,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isPrayerDone: boolean;
  onConfirm: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (isPrayerDone) return;

    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="mt-4">
      <Pressable
        onPress={handlePress}
        disabled={isPrayerDone}
        className="flex-row items-center justify-center py-4 px-6 rounded-2xl"
        style={{
          backgroundColor: isPrayerDone ? '#22C55E' : colors.primary,
          opacity: isPrayerDone ? 0.9 : 1,
        }}
      >
        {isPrayerDone ? (
          <>
            <Check size={22} color="#FFFFFF" strokeWidth={3} />
            <Text className="ml-3 font-bold text-base" style={{ color: '#FFFFFF' }}>
              {language === 'es' ? 'Completado' : 'Completed'}
            </Text>
          </>
        ) : (
          <>
            <Heart size={22} color={colors.primaryText} />
            <Text className="ml-3 font-bold text-base" style={{ color: colors.primaryText }}>
              {language === 'es' ? 'Hoy hice esta oracion' : 'I prayed today'}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Daily Prayer of the Day Section (from community requests)
function DailyPrayerSection({
  colors,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const t = TRANSLATIONS[language];

  const { data: dailyPrayer, isLoading } = useQuery({
    queryKey: ['daily-prayer-today'],
    queryFn: () => gamificationApi.getTodayDailyPrayer(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: colors.surface }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!dailyPrayer) {
    return null;
  }

  const title = language === 'es' ? dailyPrayer.titleEs : dailyPrayer.title;
  const prayerText = language === 'es' ? dailyPrayer.prayerTextEs : dailyPrayer.prayerText;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      className="mt-6 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.primary + '08',
        borderWidth: 1,
        borderColor: colors.primary + '20',
      }}
    >
      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        <Heart size={18} color={colors.primary} />
        <Text className="text-base font-semibold ml-2" style={{ color: colors.primary }}>
          {t.prayer_of_the_day}
        </Text>
        {dailyPrayer.totalRequests > 0 && (
          <View
            className="ml-auto px-2 py-1 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {dailyPrayer.totalRequests} {language === 'es' ? 'peticiones' : 'requests'}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
          {title}
        </Text>
        <Text
          className="text-base leading-7"
          style={{ color: colors.text, fontStyle: 'italic' }}
        >
          {prayerText}
        </Text>
      </View>
    </Animated.View>
  );
}

// Pastoral Closure — shown after the devotional is completed
function PastoralClosure({
  colors,
  language,
  isFavorite,
  onFavorite,
  onPrayerTab,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isFavorite: boolean;
  onFavorite: () => void;
  onPrayerTab: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500)}
      style={{ marginTop: 28, marginBottom: 8 }}
    >
      {/* Divider line */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 40, height: 1, backgroundColor: colors.primary + '40' }} />
      </View>

      {/* Closing message */}
      <View style={{ alignItems: 'center', marginBottom: 28, paddingHorizontal: 8 }}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>🕊️</Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
          }}
        >
          {language === 'es'
            ? 'Gracias por apartar este tiempo.'
            : 'Thank you for setting aside this time.'}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 21,
            fontStyle: 'italic',
          }}
        >
          {language === 'es'
            ? 'Dios honra un corazón que le busca.'
            : 'God honors a heart that seeks Him.'}
        </Text>
      </View>

      {/* Two actions */}
      <View style={{ gap: 12 }}>
        {/* Primary — Pray for community */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPrayerTab();
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderRadius: 16,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.88 : 1,
            gap: 10,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          })}
        >
          <Text style={{ fontSize: 18 }}>🤲</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primaryText, letterSpacing: 0.2 }}>
            {language === 'es' ? 'Orar por la comunidad' : 'Pray for the community'}
          </Text>
        </Pressable>

        {/* Secondary — Save for later */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFavorite();
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 15,
            paddingHorizontal: 20,
            borderRadius: 16,
            backgroundColor: isFavorite ? colors.primary + '18' : 'transparent',
            borderWidth: 2,
            borderColor: isFavorite ? colors.primary : colors.primary + '60',
            opacity: pressed ? 0.85 : 1,
            gap: 10,
          })}
        >
          <Heart
            size={18}
            color={colors.primary}
            fill={isFavorite ? colors.primary : 'transparent'}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.primary,
            }}
          >
            {isFavorite
              ? language === 'es' ? 'Guardado para reflexionar' : 'Saved for reflection'
              : language === 'es' ? 'Guardar para reflexionar luego' : 'Save for later reflection'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Spiritual intro text — fades as user scrolls down
function SpiritualIntro({
  scrollY,
  colors,
  language,
}: {
  scrollY: ReturnType<typeof useSharedValue<number>>;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 80], [0, -8], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View
      style={[{ alignItems: 'center', paddingTop: 22, paddingBottom: 12, paddingHorizontal: 8 }, animatedStyle]}
      pointerEvents="none"
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12,
          color: colors.textMuted,
          textAlign: 'center',
          letterSpacing: 0.4,
        }}
      >
        {language === 'es'
          ? 'Respira. Este momento es para ti.'
          : 'Breathe. This moment is for you.'}
      </Text>
    </Animated.View>
  );
}

// Audio Controls Component — simplified: only Play/Pause TTS and Play/Pause Music
// Voices removed; speed fixed at 0.90x. Music track selector kept.
function AudioControls({
  colors,
  language,
  onMusicToggle,
  onMusicVolumeChange,
  musicEnabled,
  musicVolume,
  currentTrack,
  onTrackChange,
  onTTSPlay,
  onTTSPause,
  isTTSPlaying,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onMusicToggle: () => void;
  onMusicVolumeChange: (value: number) => void;
  musicEnabled: boolean;
  musicVolume: number;
  currentTrack: string;
  onTrackChange: (trackId: string) => void;
  onTTSPlay: () => void;
  onTTSPause: () => void;
  isTTSPlaying: boolean;
}) {
  const [showMusicSettings, setShowMusicSettings] = useState(false);

  return (
    <View className="mb-6">
      <View
        className="flex-row items-center justify-between px-4 py-3 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Left: TTS Play/Pause */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={isTTSPlaying ? onTTSPause : onTTSPlay}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            {isTTSPlaying ? (
              <Pause size={20} color={colors.primaryText} fill={colors.primaryText} />
            ) : (
              <Play size={20} color={colors.primaryText} fill={colors.primaryText} />
            )}
          </Pressable>
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Narración' : 'Narration'}
          </Text>
        </View>

        {/* Right: Music Play/Pause + Music settings gear */}
        <View className="flex-row items-center gap-2">
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Música' : 'Music'}
          </Text>
          <Pressable
            onPress={() => {
              onMusicToggle();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: musicEnabled ? colors.primary : colors.textMuted + '30' }}
          >
            {musicEnabled ? (
              <Volume2 size={20} color={colors.primaryText} />
            ) : (
              <VolumeX size={20} color={colors.textMuted} />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              setShowMusicSettings((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: showMusicSettings ? colors.primary + '30' : colors.textMuted + '20',
              borderWidth: 1,
              borderColor: showMusicSettings ? colors.primary + '60' : colors.textMuted + '30',
            }}
          >
            <Music size={16} color={showMusicSettings ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Music Settings Panel — track picker only */}
      {showMusicSettings && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mt-3 p-4 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Pista de Música' : 'Music Track'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {MUSIC_TRACKS.map((track) => (
              <Pressable
                key={track.id}
                onPress={() => {
                  onTrackChange(track.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: currentTrack === track.id ? colors.primary : colors.textMuted + '20',
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: currentTrack === track.id ? colors.primaryText : colors.text }}
                >
                  {language === 'es' ? track.nameEs : track.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// Collapsible content for overflow
function CollapsibleContent({
  children,
  colors,
  language,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const maxCollapsedHeight = height * 0.6;
  const needsCollapse = contentHeight > maxCollapsedHeight;

  return (
    <View>
      <View
        style={{
          maxHeight: isExpanded ? undefined : maxCollapsedHeight,
          overflow: 'hidden',
        }}
        onLayout={(e) => {
          if (contentHeight === 0) {
            setContentHeight(e.nativeEvent.layout.height);
          }
        }}
      >
        {children}
      </View>

      {needsCollapse && (
        <>
          {!isExpanded && (
            <LinearGradient
              colors={['transparent', colors.background]}
              style={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                right: 0,
                height: 80,
              }}
            />
          )}
          <Pressable
            onPress={() => {
              setIsExpanded(!isExpanded);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-row items-center justify-center py-3 mt-2 rounded-xl"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={18} color={colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>
                  {language === 'es' ? 'Ver menos' : 'Show less'}
                </Text>
              </>
            ) : (
              <>
                <ChevronDown size={18} color={colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>
                  {language === 'es' ? 'Ver mas' : 'Show more'}
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

// Daily engagement micro-feedback banner
function DailyEngagementBanner({
  isCompleted,
  showCompletionThankYou,
  colors,
  language,
  isFavorite,
  onToggleFavorite,
}: {
  isCompleted: boolean;
  showCompletionThankYou: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'es' | 'en';
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 120 }));
  }, [isCompleted, showCompletionThankYou]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (showCompletionThankYou) {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            marginHorizontal: 0,
            marginBottom: 12,
            borderRadius: 14,
            backgroundColor: colors.primary + '18',
            gap: 8,
          },
        ]}
      >
        <Text style={{ fontSize: 16 }}>🙏</Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.primary,
            fontWeight: '500',
            flexShrink: 1,
          }}
        >
          {language === 'es'
            ? 'Gracias por apartar este momento con Dios'
            : 'Thank you for setting aside this moment with God'}
        </Text>
      </Animated.View>
    );
  }

  if (isCompleted) {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 14,
            marginBottom: 12,
            borderRadius: 20,
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(34,197,94,0.12)',
            gap: 6,
          },
        ]}
      >
        <Check size={13} color="rgb(34,197,94)" strokeWidth={2.5} />
        <Text
          style={{
            fontSize: 13,
            color: 'rgb(34,197,94)',
            fontWeight: '500',
          }}
        >
          {language === 'es' ? 'Devocional de hoy completado' : "Today's devotional completed"}
        </Text>
        <Pressable
          onPress={onToggleFavorite}
          style={{ marginLeft: 4, padding: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={15}
            color={isFavorite ? '#EF4444' : 'rgba(34,197,94,0.7)'}
            fill={isFavorite ? '#EF4444' : 'transparent'}
          />
        </Pressable>
      </Animated.View>
    );
  }

  // Not completed yet — soft pastoral nudge
  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          paddingBottom: 8,
          marginBottom: 4,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 14,
          color: colors.textMuted,
          fontStyle: 'italic',
          letterSpacing: 0.1,
        }}
      >
        {language === 'es'
          ? 'Tómate un momento para Dios hoy.'
          : 'Take a moment for God today.'}
      </Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const user = useUser();
  const favorites = useUserFavorites();
  const settings = useUserSettings();

  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const addPoints = useAppStore((s) => s.addPoints);
  const updateUser = useAppStore((s) => s.updateUser);
  const incrementStreak = useAppStore((s) => s.incrementStreak);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const queryClient = useQueryClient();

  // Background music from provider
  const musicPlayer = useMusicPlayer();

  // Points toast
  const { currentToast, showToast, hideToast } = usePointsToast();

  // Hidden timer for internal tracking (not shown to user)
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showCompletionThankYou, setShowCompletionThankYou] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Passive metrics: track time spent on Home screen (internal, no UI)
  const homeScreenEntryRef = useRef<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      homeScreenEntryRef.current = Date.now();
      return () => {
        if (homeScreenEntryRef.current) {
          const secs = Math.floor((Date.now() - homeScreenEntryRef.current) / 1000);
          console.log(`[Metrics] Home screen time: ${secs}s`);
          homeScreenEntryRef.current = null;
        }
      };
    }, [])
  );

  // Scroll tracking for intro text fade
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // TTS state — speed fixed at 0.90x, no user-facing slider
  const TTS_FIXED_SPEED = 0.9;
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [ttsSpeed, setTTSSpeed] = useState(TTS_FIXED_SPEED);
  const [ttsVolume, setTTSVolume] = useState(settings.ttsVolume ?? 1.0);
  const [showVoiceFallbackBanner, setShowVoiceFallbackBanner] = useState(false);
  const [voiceFallbackReason, setVoiceFallbackReason] = useState<'missing_preferred' | 'eloquence' | 'fallback'>('fallback');
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const pickedVoiceRef = useRef<PickedVoice | null>(null);
  const isTTSPlayingRef = useRef(false);
  const currentSectionIndexRef = useRef(-1);
  const ttsSpeedRef = useRef(TTS_FIXED_SPEED);
  const ttsVolumeRef = useRef(settings.ttsVolume ?? 1.0);
  const ttsVoiceRef = useRef('default');
  const currentSectionsRef = useRef<{ key: string; text: string }[]>([]);
  const ttsCompletedTodayRef = useRef(false);
  const speechJobIdRef = useRef(0);
  const lastSpeakAttemptRef = useRef(0);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: devotionalData, isLoading } = useQuery({
    queryKey: ['todayDevotional'],
    queryFn: () => firestoreService.getTodayDevotional(),
  });

  const devotional = devotionalData?.devotional ?? null;
  const isOffline = devotionalData?.offline ?? false;
  const isFromCache = devotionalData?.fromCache ?? false;
  const offlineCachedDate = devotionalData?.cachedDate;

  const today = getTodayDate();
  const isFavorite = favorites.includes(today);

  // Daily actions state derived from user
  const dailyActions = user?.dailyActions ?? {};
  const isPrayerDone = isDailyActionDone(dailyActions.prayerDate, dailyActions.prayerDone, today);
  const isTTSDone = isDailyActionDone(dailyActions.ttsDate, dailyActions.ttsDone, today);
  const shareStatus = isDailyActionAvailable(dailyActions.shareDate, dailyActions.shareCount, DAILY_LIMITS.SHARE_MAX, today);

  // Initialize completion state based on whether user already completed today's devotional
  useEffect(() => {
    if (user?.lastActiveDate === today) {
      setIsCompleted(true);
    }
  }, [user?.lastActiveDate, today]);

  // Initialize TTS completion tracking
  useEffect(() => {
    ttsCompletedTodayRef.current = isTTSDone;
  }, [isTTSDone]);

  // Sync TTS volume with settings
  useEffect(() => {
    setTTSVolume(settings.ttsVolume ?? 1.0);
    ttsVolumeRef.current = settings.ttsVolume ?? 1.0;
  }, [settings.ttsVolume]);

  // Pick best voice on mount (cached in AsyncStorage)
  useEffect(() => {
    const langCode = language === 'es' ? 'es' : 'en';
    pickBestVoice(langCode).then(async (picked) => {
      pickedVoiceRef.current = picked;

      // Show small banner for non-critical guidance
      if (picked.isEloquence) {
        setVoiceFallbackReason('eloquence');
        setShowVoiceFallbackBanner(true);
      } else if (!picked.preferredVoiceFound && langCode === 'es') {
        setVoiceFallbackReason('missing_preferred');
        setShowVoiceFallbackBanner(true);
      } else if (picked.isFallback) {
        setVoiceFallbackReason('fallback');
        setShowVoiceFallbackBanner(true);
      }

      // Show one-time modal when voice quality is poor (needsUserAction)
      if (picked.needsUserAction) {
        try {
          const alreadyShown = await AsyncStorage.getItem(VOICE_SETUP_SHOWN_KEY);
          if (!alreadyShown) {
            // Small delay so it doesn't pop up while the screen is still loading
            setTimeout(() => setShowVoiceSetupModal(true), 1500);
          }
        } catch (_) {}
      }
    });
  }, [language]);

  // Time tracking (hidden from user - internal control only)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-complete when 3 minutes have passed
  useEffect(() => {
    if (
      !isCompleted &&
      timeSpent >= COMPLETION_REQUIREMENTS.MIN_TIME_SECONDS
    ) {
      handleComplete();
    }
  }, [timeSpent, isCompleted]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Handle TTS completion - award points when TTS finishes the last section (prayer)
  const handleTTSComplete = useCallback(async () => {
    if (!user || ttsCompletedTodayRef.current) return;

    ttsCompletedTodayRef.current = true;

    // Update daily actions
    updateUser({
      dailyActions: {
        ...dailyActions,
        ttsDate: today,
        ttsDone: true,
      },
    });

    // Award points via API
    try {
      const result = await gamificationApi.awardPoints(user.id, 'tts_complete');
      if (result.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Audio escuchado' : 'Audio listened', detail: '' });
        showToast(
          result.pointsAwarded,
          language === 'es' ? 'puntos (Audio)' : 'points (Audio)'
        );
      }
    } catch (error) {
      console.error('[TTS] Failed to award points:', error);
      // Still award points locally as fallback
      addPoints(POINTS.TTS_COMPLETE);
      addLedgerEntry({ delta: POINTS.TTS_COMPLETE, kind: 'devotional', title: language === 'es' ? 'Audio escuchado' : 'Audio listened', detail: '' });
      showToast(
        POINTS.TTS_COMPLETE,
        language === 'es' ? 'puntos (Audio)' : 'points (Audio)'
      );
    }
  }, [user, dailyActions, today, updateUser, addPoints, showToast, language]);

  const handleComplete = useCallback(async () => {
    if (isCompleted) return;

    setIsCompleted(true);
    setShowCelebration(true);
    setShowAchievement(true);

    // Persist engagement date for notification smart-skip
    markDevotionalCompletedToday().catch(() => {});

    // Show "thank you" micro-feedback briefly, then switch to badge
    setShowCompletionThankYou(true);
    setTimeout(() => setShowCompletionThankYou(false), 4500);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPoints(POINTS.COMPLETE_DEVOTIONAL);
    addLedgerEntry({
      delta: POINTS.COMPLETE_DEVOTIONAL,
      kind: 'devotional',
      title: language === 'es' ? 'Devocional completado' : 'Devotional completed',
      detail: '',
    });

    if (user) {
      const lastActive = user.lastActiveDate;

      // Calculate yesterday using the same robust method as getTodayDate (Costa Rica timezone)
      const getYesterdayDate = (): string => {
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Costa_Rica',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          const todayFormatted = formatter.format(now);
          // Parse today and subtract 1 day
          const [y, m, d] = todayFormatted.split('-').map(Number);
          const yesterday = new Date(Date.UTC(y, m - 1, d - 1));
          const yy = yesterday.getUTCFullYear();
          const mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(yesterday.getUTCDate()).padStart(2, '0');
          return `${yy}-${mm}-${dd}`;
        } catch {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      };
      const yesterdayStr = getYesterdayDate();

      let newStreakCurrent = user.streakCurrent;
      let newStreakBest = user.streakBest;

      console.log('[Streak] Checking streak:', { lastActive, yesterdayStr, today, currentStreak: user.streakCurrent });

      if (lastActive === yesterdayStr) {
        // User was active yesterday - increment streak
        newStreakCurrent = user.streakCurrent + 1;
        newStreakBest = Math.max(newStreakCurrent, user.streakBest);
        incrementStreak();
        console.log('[Streak] Incrementing streak to:', newStreakCurrent);
      } else if (lastActive === today) {
        // User already completed today - keep current streak, don't re-count
        console.log('[Streak] Already active today, keeping streak:', newStreakCurrent);
      } else {
        // User missed a day or first time - reset to 1
        newStreakCurrent = 1;
        updateUser({ streakCurrent: 1 });
        console.log('[Streak] Resetting streak to 1 (lastActive was:', lastActive, ')');
      }

      // Only increment the devotionals counter once per calendar day
      const alreadyCountedToday = lastActive === today;
      const newDevotionalsCompleted = alreadyCountedToday
        ? user.devotionalsCompleted
        : user.devotionalsCompleted + 1;

      updateUser({
        devotionalsCompleted: newDevotionalsCompleted,
        lastActiveDate: today,
      });

      // Sync user data to backend for community display
      // Pass completedDevotionalDate only on fresh completion — backend records it and derives count
      try {
        await gamificationApi.syncUser(user.id, {
          streakCurrent: newStreakCurrent,
          streakBest: newStreakBest,
          devotionalsCompleted: newDevotionalsCompleted,
          lastActiveAt: new Date().toISOString(),
          ...(alreadyCountedToday ? {} : { completedDevotionalDate: today }),
        });
      } catch (error) {
        console.error('[Gamification] Failed to sync user data:', error);
      }

      // Update challenge progress only on a fresh completion (not a re-open)
      if (!alreadyCountedToday) {
        try {
          await gamificationApi.updateChallengeProgress(user.id, 'devotional_complete');
        } catch (error) {
          console.error('[Gamification] Failed to update challenge progress:', error);
        }
      }
    }

    setTimeout(() => setShowAchievement(false), 3000);
    setTimeout(() => setShowCelebration(false), 4000);
  }, [isCompleted, user, today, addPoints, incrementStreak, updateUser]);

  // Open share modal
  const handleOpenShareModal = useCallback(() => {
    if (!devotional) return;
    setShowShareModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [devotional]);

  // Handle share completion
  const handleShareComplete = useCallback(async () => {
    if (!user) return;

    // Check if share limit reached
    if (!shareStatus.available) {
      showToast(
        0,
        language === 'es' ? 'Limite diario alcanzado' : 'Daily limit reached',
        'warning'
      );
      return;
    }

    // Update daily actions and total shares count
    const newShareCount = (dailyActions.shareDate === today ? (dailyActions.shareCount ?? 0) : 0) + 1;
    updateUser({
      totalShares: (user.totalShares ?? 0) + 1,
      dailyActions: {
        ...dailyActions,
        shareDate: today,
        shareCount: newShareCount,
      },
    });

    // Award points via API
    try {
      const pointsResult = await gamificationApi.awardPoints(user.id, 'share');
      if (pointsResult.success) {
        addPoints(pointsResult.pointsAwarded);
        addLedgerEntry({ delta: pointsResult.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
        showToast(
          pointsResult.pointsAwarded,
          language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
        );
      }
      await gamificationApi.updateChallengeProgress(user.id, 'share');
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', user.id] });
    } catch (error) {
      console.error('[Share] Failed to award points:', error);
      addPoints(POINTS.SHARE_DEVOTIONAL);
      addLedgerEntry({ delta: POINTS.SHARE_DEVOTIONAL, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
      showToast(
        POINTS.SHARE_DEVOTIONAL,
        language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
      );
    }
  }, [user, language, shareStatus, dailyActions, today, updateUser, addPoints, showToast, queryClient]);

  // Handle prayer confirmation
  const handlePrayerConfirm = useCallback(async () => {
    if (!user || isPrayerDone) return;

    // Update daily actions
    updateUser({
      dailyActions: {
        ...dailyActions,
        prayerDate: today,
        prayerDone: true,
      },
    });

    // Award points via API
    try {
      const result = await gamificationApi.awardPoints(user.id, 'prayer');
      if (result.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Oración confirmada' : 'Prayer confirmed', detail: '' });
        showToast(
          result.pointsAwarded,
          language === 'es' ? 'puntos (Oracion)' : 'points (Prayer)'
        );
      }
      // Update challenge progress
      await gamificationApi.updateChallengeProgress(user.id, 'prayer');
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', user.id] });
    } catch (error) {
      console.error('[Prayer] Failed to award points:', error);
      // Still award points locally as fallback
      addPoints(POINTS.PRAYER_CONFIRM);
      addLedgerEntry({ delta: POINTS.PRAYER_CONFIRM, kind: 'devotional', title: language === 'es' ? 'Oración confirmada' : 'Prayer confirmed', detail: '' });
      showToast(
        POINTS.PRAYER_CONFIRM,
        language === 'es' ? 'puntos (Oracion)' : 'points (Prayer)'
      );
    }
  }, [user, isPrayerDone, dailyActions, today, updateUser, addPoints, showToast, language, queryClient]);

  // TTS functions
  const buildDevotionalText = useCallback(() => {
    if (!devotional) return [];

    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
    const story = language === 'es' ? devotional.storyEs : devotional.story;
    const character = language === 'es' ? devotional.biblicalCharacterEs : devotional.biblicalCharacter;
    const application = language === 'es' ? devotional.applicationEs : devotional.application;
    const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;
    const bibleRef = language === 'es' ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)) : devotional.bibleReference;

    const formattedReference = formatBibleReferenceForSpeech(bibleRef, language);

    // Apply Bible reference normalization to ALL sections for proper TTS pronunciation
    // Sanitize garbage text from cross-reference annotations, then add pauses
    return [
      { key: 'verse', text: preprocessNumbersForTTS(sanitizeForTTS(`${verse}. ${formattedReference}`)) },
      { key: 'reflection', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(reflection), language))) },
      { key: 'story', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(story), language))) },
      { key: 'character', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(character), language))) },
      { key: 'application', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(application), language))) },
      { key: 'prayer', text: preprocessNumbersForTTS(normalizeBibleRefForTTS(sanitizeForTTS(prayer), language)) },
    ];
  }, [devotional, language]);

  // Get the best voice identifier from the pre-picked voice
  const getVoiceIdentifier = useCallback((): { id: string | undefined; lang: string } => {
    const picked = pickedVoiceRef.current;
    // Always use the picked voice/language if we have one, even if it's a fallback.
    // isFallback = true just means "no great voice was found", but we still pass the
    // best available identifier rather than nothing (which risks device default = wrong lang).
    if (!picked || !picked.voiceIdentifier) {
      return { id: undefined, lang: language === 'es' ? 'es-MX' : 'en-US' };
    }
    return { id: picked.voiceIdentifier, lang: picked.language };
  }, [language]);

  const speakSection = useCallback(async (index: number, sections: { key: string; text: string }[], jobId: number) => {
    // Guard: abort if this job was superseded
    if (jobId !== speechJobIdRef.current) return;
    // Guard: abort if TTS was stopped
    if (!isTTSPlayingRef.current) return;

    if (index >= sections.length) {
      // TTS completed all sections - award points for completion
      if (jobId !== speechJobIdRef.current) return;
      handleTTSComplete();

      setIsTTSPlaying(false);
      isTTSPlayingRef.current = false;
      setCurrentSectionIndex(-1);
      currentSectionIndexRef.current = -1;
      currentSectionsRef.current = [];
      return;
    }

    setCurrentSectionIndex(index);
    currentSectionIndexRef.current = index;
    currentSectionsRef.current = sections;
    const section = sections[index];

    // Pastoral TTS parameters — slightly slower rate and warmer pitch for a natural devotional feel
    const DEVOTIONAL_RATE = 0.88;
    const DEVOTIONAL_PITCH = 0.95;

    const { id: voiceId, lang: voiceLang } = getVoiceIdentifier();

    // Inter-section pause: 300ms gap between sections feels more natural (like a breath).
    // We guard the jobId in the timeout so a stopped session doesn't continue.
    const advanceToNext = () => {
      setTimeout(() => {
        if (jobId === speechJobIdRef.current && isTTSPlayingRef.current) {
          speakSection(index + 1, sections, jobId);
        }
      }, 300);
    };

    const speechOptions: Speech.SpeechOptions = {
      language: voiceLang,
      rate: DEVOTIONAL_RATE,
      pitch: DEVOTIONAL_PITCH,
      volume: ttsVolumeRef.current,
      onDone: advanceToNext,
      onError: advanceToNext,
    };

    // Only add voice if we have a valid identifier
    if (voiceId) {
      speechOptions.voice = voiceId;
    }

    if (__DEV__) {
      console.log(
        `[TTS] Section ${index + 1}/${sections.length}: "${section.key}"` +
        ` | voice: ${voiceId ?? 'system'} | lang: ${voiceLang}` +
        ` | rate: ${DEVOTIONAL_RATE} | pitch: ${DEVOTIONAL_PITCH}`
      );
    }

    Speech.speak(section.text, speechOptions);
  }, [language, getVoiceIdentifier, handleTTSComplete]);

  const handleTTSPlay = useCallback(async () => {
    if (isTTSPlaying) return;

    // 500ms debounce guard
    const now = Date.now();
    if (now - lastSpeakAttemptRef.current < 500) return;
    lastSpeakAttemptRef.current = now;

    const sections = buildDevotionalText();
    if (sections.length === 0) return;

    // Stop any active speech before starting new job
    await Speech.stop();

    // Increment job ID to invalidate any stale callbacks
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;

    setIsTTSPlaying(true);
    isTTSPlayingRef.current = true;
    currentSectionsRef.current = sections;
    speakSection(0, sections, jobId);
  }, [isTTSPlaying, buildDevotionalText, speakSection]);

  const handleTTSPause = useCallback(async () => {
    speechJobIdRef.current += 1; // invalidate active job
    isTTSPlayingRef.current = false;
    await Speech.stop();
    setIsTTSPlaying(false);
  }, []);

  const handleTTSStop = useCallback(async () => {
    speechJobIdRef.current += 1; // invalidate active job
    isTTSPlayingRef.current = false;
    currentSectionIndexRef.current = -1;
    currentSectionsRef.current = [];
    await Speech.stop();
    setIsTTSPlaying(false);
    setCurrentSectionIndex(-1);
  }, []);

  // Restart current section with new settings (speed/volume/voice change while playing)
  const restartCurrentSection = useCallback(async () => {
    if (!isTTSPlayingRef.current || currentSectionIndexRef.current < 0) return;

    const sections = currentSectionsRef.current;
    const currentIndex = currentSectionIndexRef.current;

    if (sections.length === 0 || currentIndex >= sections.length) return;

    // Stop current speech, create new job, restart with new settings
    await Speech.stop();
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    speakSection(currentIndex, sections, jobId);
  }, [speakSection]);

  const toggleFavorite = () => {
    console.log('[Favorite] Toggle pressed, today:', today, 'isFavorite:', isFavorite, 'user:', !!user, 'favorites:', favorites);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFavorite) {
      removeFavorite(today);
      console.log('[Favorite] Removed from favorites');
    } else {
      if (!favorites.includes(today)) {
        addPoints(POINTS.FAVORITE_DEVOTIONAL);
      }
      addFavorite(today);
      console.log('[Favorite] Added to favorites');
    }
  };

  const handleMusicToggle = () => {
    musicPlayer.togglePlayback();
  };

  const handleMusicVolumeChange = (value: number) => {
    musicPlayer.setVolume(value);
  };

  const handleTrackChange = async (trackId: string) => {
    await musicPlayer.setTrack(trackId);
  };

  const handleTTSSpeedChange = useCallback((value: number) => {
    setTTSSpeed(value);
    ttsSpeedRef.current = value;
    updateSettings({ ttsSpeed: value });
    // Restart current section with new speed if playing
    if (isTTSPlayingRef.current) {
      restartCurrentSection();
    }
  }, [updateSettings, restartCurrentSection]);

  const handleTTSVolumeChange = useCallback((value: number) => {
    setTTSVolume(value);
    ttsVolumeRef.current = value;
    updateSettings({ ttsVolume: value });
    // Restart current section with new volume if playing
    if (isTTSPlayingRef.current) {
      restartCurrentSection();
    }
  }, [updateSettings, restartCurrentSection]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!devotional) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background, padding: 32 }}
      >
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📵</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          {language === 'es' ? 'Sin conexión' : 'No connection'}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
          {language === 'es'
            ? 'Conéctate a internet para descargar el devocional de hoy.'
            : 'Connect to the internet to download today\'s devotional.'}
        </Text>
      </View>
    );
  }

  const title = language === 'es' ? devotional.titleEs : devotional.title;
  const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
  const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
  const story = language === 'es' ? devotional.storyEs : devotional.story;
  const character = language === 'es' ? devotional.biblicalCharacterEs : devotional.biblicalCharacter;
  const application = language === 'es' ? devotional.applicationEs : devotional.application;
  const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Points Toast */}
      <PointsToast
        message={currentToast}
        onHide={hideToast}
        primaryColor={colors.primary}
      />

      {/* Offline / from-cache indicator */}
      {isFromCache && (
        <View style={{
          backgroundColor: '#F59E0B',
          paddingVertical: 5,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#000', letterSpacing: 0.4 }}>
            {offlineCachedDate && offlineCachedDate !== getTodayDate()
              ? (language === 'es'
                ? `Sin conexión — mostrando el devocional de ${offlineCachedDate}`
                : `Offline — showing devotional from ${offlineCachedDate}`)
              : (language === 'es' ? 'Sin conexión — modo sin internet' : 'Offline — cached content')
            }
          </Text>
        </View>
      )}

      <ConfettiCelebration visible={showCelebration} />
      <AchievementPopup
        visible={showAchievement}
        points={POINTS.COMPLETE_DEVOTIONAL}
        colors={colors}
        language={language}
      />

      {/* One-time modal shown when device has poor voice quality */}
      <VoiceSetupModal
        visible={showVoiceSetupModal}
        language={language}
        voiceName={pickedVoiceRef.current?.name}
        colors={colors}
        onDismiss={async () => {
          setShowVoiceSetupModal(false);
          try {
            await AsyncStorage.setItem(VOICE_SETUP_SHOWN_KEY, '1');
          } catch (_) {}
        }}
      />

      <Animated.ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={scrollHandler}
      >
        {/* Hero Image */}
        <View style={{ height: height * 0.4 }}>
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
          />

          {/* Header overlay */}
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
            style={{ paddingTop: insets.top + 10 }}
          >
            {/* Streak fire — top-left, always visible */}
            {user && user.streakCurrent > 0 ? (
              <View className="flex-row items-center bg-orange-500/90 px-3 py-2 rounded-full">
                <Flame size={14} color="#FFFFFF" />
                <Text className="text-white font-bold ml-1" style={{ fontSize: 13 }}>
                  {user.streakCurrent}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {/* Logo centrado — identidad sutil */}
            <LuzDiariaIconWhite size={44} />

            {/* Right actions: Share only */}
            <View className="flex-row items-center" style={{ gap: 8 }}>
              {/* Share Button — top-right */}
              <Pressable
                onPress={handleOpenShareModal}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.20)',
                }}
              >
                <Share2 size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Title overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wider">
              {t.todays_devotional}
            </Text>
            <Text className="text-white/60 text-xs font-medium mb-2 capitalize">
              {new Date(today + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text className="text-white text-3xl font-bold">{title}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 -mt-4">
          {/* Spiritual intro text — fades as user scrolls */}
          <SpiritualIntro scrollY={scrollY} colors={colors} language={language} />

          {/* Daily engagement micro-feedback */}
          <DailyEngagementBanner
            isCompleted={isCompleted}
            showCompletionThankYou={showCompletionThankYou}
            colors={colors}
            language={language}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />

          {/* Audio Controls */}
          <AudioControls
            colors={colors}
            language={language}
            onMusicToggle={handleMusicToggle}
            onMusicVolumeChange={handleMusicVolumeChange}
            musicEnabled={musicPlayer.isPlaying}
            musicVolume={musicPlayer.volume}
            currentTrack={musicPlayer.currentTrack}
            onTrackChange={handleTrackChange}
            onTTSPlay={handleTTSPlay}
            onTTSPause={handleTTSPause}
            isTTSPlaying={isTTSPlaying}
          />

          {/* Voice fallback banner — shown when Paulina/Monica not installed or Eloquence forced */}
          <VoiceFallbackBanner
            visible={showVoiceFallbackBanner}
            reason={voiceFallbackReason}
            language={language}
            colors={colors}
            onDismiss={() => setShowVoiceFallbackBanner(false)}
          />

          {/* Collapsible content wrapper */}
          <CollapsibleContent colors={colors} language={language}>
            {/* Bible Verse Card */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              className="rounded-3xl p-6 mb-6"
              style={{
                backgroundColor: currentSectionIndex === 0 ? colors.primary + '15' : colors.surface,
                borderWidth: currentSectionIndex === 0 ? 2 : 0,
                borderColor: currentSectionIndex === 0 ? colors.primary : 'transparent',
              }}
            >
              <View className="flex-row items-center mb-4">
                <BookOpen size={20} color={colors.primary} />
                <Text
                  className="ml-2 font-semibold"
                  style={{ color: colors.primary }}
                >
                  {t.bible_verse}
                </Text>
              </View>
              <Text
                className="text-xl italic leading-8 mb-3"
                style={{ color: colors.text }}
              >
                {verse}
              </Text>
              <Text
                className="text-sm font-medium"
                style={{ color: colors.textMuted }}
              >
                - {language === 'es' ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)) : devotional.bibleReference}
              </Text>
            </Animated.View>

            {/* All sections displayed continuously */}
            <ContentSection
              title={t.reflection}
              content={reflection}
              icon={<Star size={16} color={colors.primary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 1}
              sectionIndex={1}
            />

            <ContentSection
              title={t.story}
              content={story}
              icon={<BookOpen size={16} color={colors.secondary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 2}
              sectionIndex={2}
            />

            <ContentSection
              title={t.biblical_character}
              content={character}
              icon={<Star size={16} color={colors.accent} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 3}
              sectionIndex={3}
            />

            <ContentSection
              title={t.application}
              content={application}
              icon={<Check size={16} color={colors.primary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 4}
              sectionIndex={4}
            />

            <ContentSection
              title={t.prayer}
              content={prayer}
              icon={<Heart size={16} color={colors.secondary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 5}
              sectionIndex={5}
            />

            {/* Prayer Confirmation Button */}
            <PrayerConfirmButton
              colors={colors}
              language={language}
              isPrayerDone={isPrayerDone}
              onConfirm={handlePrayerConfirm}
            />

            {/* Daily Prayer of the Day */}
            <DailyPrayerSection
              colors={colors}
              language={language}
            />

            {/* Pastoral Closure — only visible after completion */}
            {isCompleted && (
              <PastoralClosure
                colors={colors}
                language={language}
                isFavorite={isFavorite}
                onFavorite={toggleFavorite}
                onPrayerTab={() => router.push('/(tabs)/prayer')}
              />
            )}
          </CollapsibleContent>
        </View>
      </Animated.ScrollView>

      {/* Share Sheet */}
      <ShareSheet
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        devotional={devotional}
        language={language}
        colors={colors}
        onShareComplete={handleShareComplete}
      />
    </View>
  );
}
