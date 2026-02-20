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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
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
import { ShareOptionsSheet, type ShareOption } from '@/components/ShareOptionsSheet';
import { BibleReferenceText } from '@/components/BibleReferenceText';
import { firestoreService, getTodayDate } from '@/lib/firestore';
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

const { width, height } = Dimensions.get('window');

// Confetti colors
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// Daily action limits
const DAILY_LIMITS = {
  SHARE_MAX: 2,
};

// Import curated TTS voices
import {
  getCuratedVoices,
  findMatchingDeviceVoice,
  getDeviceVoiceIdentifier,
  getPreviewText,
  addTTSPausesForNumberedPoints,
  type CuratedVoice,
} from '@/lib/tts-voices';

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
// Converts "1 Reyes 3:28" → "Primera de Reyes, capítulo 3, versículo 28"
function normalizeBibleRefForTTS(text: string, language: 'en' | 'es'): string {
  if (language !== 'es') {
    // For English, convert chapter:verse to "chapter X verse Y" or "chapter X verses Y through Z"
    return text.replace(/(\d+):(\d+)(?:[-–](\d+))?/g, (match, chapter, verseStart, verseEnd) => {
      if (verseEnd) {
        return `chapter ${chapter} verses ${verseStart} through ${verseEnd}`;
      }
      return `chapter ${chapter} verse ${verseStart}`;
    });
  }

  // Spanish ordinal expansions for numbered Bible books
  const spanishOrdinals: Record<string, string> = {
    '1': 'Primera de',
    '2': 'Segunda de',
    '3': 'Tercera de',
  };

  // Masculine ordinals for certain books (Reyes, Samuel, Crónicas)
  const masculineBooks = ['Reyes', 'Samuel', 'Crónicas', 'Cronicas'];

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

  let result = text;

  // Pattern to match Bible references: optional number + book name + chapter:verse(-verseEnd)
  // Matches: "1 Reyes 3:28", "Génesis 3:28", "2 Corintios 5:17", "Lucas 10:25-37", etc.
  const bibleRefPattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+):(\\d+)` + // Chapter:verse
    `(?:[-–](\\d+))?` + // Optional verse range end (e.g., 3:28-30) - now captured!
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefPattern, (match, prefix, num, book, chapter, verseStart, verseEnd, suffix) => {
    let expandedBook = book;

    // If there's a leading number, expand it to ordinal
    if (num) {
      const isMasculine = masculineBooks.some(mb => book.toLowerCase().includes(mb.toLowerCase()));
      if (isMasculine) {
        // Use masculine ordinals for Reyes, Samuel, Crónicas
        const masculineOrdinals: Record<string, string> = {
          '1': 'Primero de',
          '2': 'Segundo de',
          '3': 'Tercero de',
        };
        expandedBook = `${masculineOrdinals[num]} ${book}`;
      } else {
        expandedBook = `${spanishOrdinals[num]} ${book}`;
      }
    }

    // Format verse(s) - singular vs plural for ranges
    const verseText = verseEnd
      ? `versículos del ${verseStart} al ${verseEnd}`
      : `versículo ${verseStart}`;

    return `${prefix}${expandedBook}, capítulo ${chapter}, ${verseText}${suffix}`;
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
    '1 Reyes': 'Primero de Reyes',
    '2 Reyes': 'Segundo de Reyes',
    '1 Samuel': 'Primero de Samuel',
    '2 Samuel': 'Segundo de Samuel',
    '1 Cronicas': 'Primero de Cronicas',
    '2 Cronicas': 'Segundo de Cronicas',
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
      className="mb-6"
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          {icon}
        </View>
        <Text
          className="text-lg font-bold"
          style={{ color: colors.primary }}
        >
          {title}
        </Text>
      </View>

      <View
        className="rounded-2xl p-5"
        style={{
          backgroundColor: isHighlighted ? colors.primary + '15' : colors.surface,
          borderWidth: isHighlighted ? 2 : 0,
          borderColor: isHighlighted ? colors.primary : 'transparent',
        }}
      >
        <BibleReferenceText
          style={{ color: colors.text, fontSize: 16, lineHeight: 28 }}
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
            <Text className="ml-3 text-white font-bold text-base">
              {language === 'es' ? 'Completado' : 'Completed'}
            </Text>
          </>
        ) : (
          <>
            <Heart size={22} color="#FFFFFF" />
            <Text className="ml-3 text-white font-bold text-base">
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

// Voice Preview Button Component
function VoicePreviewButton({
  onPreview,
  isPlaying,
  colors,
}: {
  onPreview: () => void;
  isPlaying: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPreview}
      className="w-8 h-8 rounded-full items-center justify-center"
      style={{ backgroundColor: colors.primary + '20' }}
    >
      {isPlaying ? (
        <Square size={12} color={colors.primary} fill={colors.primary} />
      ) : (
        <Play size={12} color={colors.primary} fill={colors.primary} />
      )}
    </Pressable>
  );
}

// Audio Controls Component
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
  onTTSStop,
  isTTSPlaying,
  ttsSpeed,
  onTTSSpeedChange,
  ttsVolume,
  onTTSVolumeChange,
  ttsVoice,
  onTTSVoiceChange,
  availableVoices,
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
  onTTSStop: () => void;
  isTTSPlaying: boolean;
  ttsSpeed: number;
  onTTSSpeedChange: (value: number) => void;
  ttsVolume: number;
  onTTSVolumeChange: (value: number) => void;
  ttsVoice: string;
  onTTSVoiceChange: (voiceId: string) => void;
  availableVoices: Speech.Voice[];
}) {
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  // Get curated voices for current language
  const curatedVoices = getCuratedVoices(language);

  // Preview text for voice testing
  const previewText = getPreviewText(language);

  // Handle voice preview
  const handleVoicePreview = async (curatedVoice: CuratedVoice) => {
    if (previewingVoice === curatedVoice.id) {
      // Stop preview
      await Speech.stop();
      setPreviewingVoice(null);
      return;
    }

    // Stop any current preview
    await Speech.stop();
    setPreviewingVoice(curatedVoice.id);

    // Find matching device voice
    const deviceVoice = findMatchingDeviceVoice(curatedVoice, availableVoices, language);

    const speechOptions: Speech.SpeechOptions = {
      language: language === 'es' ? 'es-ES' : 'en-US',
      rate: ttsSpeed,
      volume: ttsVolume,
      onDone: () => setPreviewingVoice(null),
      onError: () => setPreviewingVoice(null),
    };

    if (deviceVoice) {
      speechOptions.voice = deviceVoice.identifier;
    }

    Speech.speak(previewText, speechOptions);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="mb-6">
      <View
        className="flex-row items-center justify-between p-4 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* TTS Controls */}
        <View className="flex-row items-center">
          <Pressable
            onPress={isTTSPlaying ? onTTSPause : onTTSPlay}
            className="w-12 h-12 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isTTSPlaying ? (
              <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </Pressable>
          <Pressable
            onPress={onTTSStop}
            className="w-10 h-10 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.textMuted + '30' }}
          >
            <Square size={16} color={colors.textMuted} fill={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => {
              setShowTTSSettings(!showTTSSettings);
              setShowMusicSettings(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: showTTSSettings ? colors.primary + '30' : colors.textMuted + '30' }}
          >
            <Settings2 size={18} color={showTTSSettings ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>

        {/* Music Controls */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => {
              setShowMusicSettings(!showMusicSettings);
              setShowTTSSettings(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-10 h-10 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: showMusicSettings ? colors.primary + '30' : colors.textMuted + '30' }}
          >
            <Music size={18} color={showMusicSettings ? colors.primary : colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => {
              onMusicToggle();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: musicEnabled ? colors.primary + '30' : colors.textMuted + '30' }}
          >
            {musicEnabled ? (
              <Volume2 size={18} color={colors.primary} />
            ) : (
              <VolumeX size={18} color={colors.textMuted} />
            )}
          </Pressable>
        </View>
      </View>

      {/* TTS Settings Panel */}
      {showTTSSettings && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mt-3 p-4 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Volume Control */}
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Volumen' : 'Volume'}: {Math.round(ttsVolume * 100)}%
          </Text>
          <Slider
            value={ttsVolume}
            onValueChange={onTTSVolumeChange}
            minimumValue={0}
            maximumValue={1}
            step={0.1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.textMuted + '40'}
            thumbTintColor={colors.primary}
          />

          {/* Speed Control */}
          <Text className="text-sm font-semibold mt-4 mb-3" style={{ color: colors.text }}>
            {t.tts_speed}: {ttsSpeed.toFixed(1)}x
          </Text>
          <Slider
            value={ttsSpeed}
            onValueChange={onTTSSpeedChange}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.textMuted + '40'}
            thumbTintColor={colors.primary}
          />

          {/* Curated Voice Selection */}
          <Text className="text-sm font-semibold mt-4 mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Voz' : 'Voice'}
          </Text>
          <View>
            {curatedVoices.map((voice: CuratedVoice) => {
              const isSelected = ttsVoice === voice.id;
              const isPreviewing = previewingVoice === voice.id;

              return (
                <Pressable
                  key={voice.id}
                  onPress={() => {
                    onTTSVoiceChange(voice.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="mb-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: isSelected ? colors.primary + '15' : colors.background,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? colors.primary : colors.textMuted + '30',
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-1">
                        <Text
                          className="text-base font-semibold"
                          style={{ color: isSelected ? colors.primary : colors.text }}
                        >
                          {language === 'es' ? voice.nameEs : voice.name}
                        </Text>
                        {voice.isDefault && (
                          <View
                            className="ml-2 px-2 py-0.5 rounded"
                            style={{ backgroundColor: colors.primary + '20' }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: colors.primary }}
                            >
                              {language === 'es' ? 'Recomendada' : 'Recommended'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-sm"
                        style={{ color: colors.textMuted }}
                        numberOfLines={2}
                      >
                        {language === 'es' ? voice.descriptionEs : voice.description}
                      </Text>
                    </View>
                    <VoicePreviewButton
                      onPreview={() => handleVoicePreview(voice)}
                      isPlaying={isPreviewing}
                      colors={colors}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Music Settings Panel */}
      {showMusicSettings && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mt-3 p-4 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            {t.volume}
          </Text>
          <Slider
            value={musicVolume}
            onValueChange={onMusicVolumeChange}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.textMuted + '40'}
            thumbTintColor={colors.primary}
          />

          <Text className="text-sm font-semibold mt-4 mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Pista de Musica' : 'Music Track'}
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
                  style={{ color: currentTrack === track.id ? '#FFFFFF' : colors.text }}
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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

  // Background music from provider
  const musicPlayer = useMusicPlayer();

  // Points toast
  const { currentToast, showToast, hideToast } = usePointsToast();

  // Hidden timer for internal tracking (not shown to user)
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TTS state
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [ttsSpeed, setTTSSpeed] = useState(settings.ttsSpeed ?? 1.0);
  const [ttsVolume, setTTSVolume] = useState(settings.ttsVolume ?? 1.0);
  const [ttsVoice, setTTSVoice] = useState(settings.ttsVoice ?? 'default');
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const isTTSPlayingRef = useRef(false);
  const currentSectionIndexRef = useRef(-1);
  const ttsSpeedRef = useRef(settings.ttsSpeed ?? 1.0);
  const ttsVolumeRef = useRef(settings.ttsVolume ?? 1.0);
  const ttsVoiceRef = useRef(settings.ttsVoice ?? 'default');
  const currentSectionsRef = useRef<{ key: string; text: string }[]>([]);
  const ttsCompletedTodayRef = useRef(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['todayDevotional'],
    queryFn: () => firestoreService.getTodayDevotional(),
  });

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

  // Sync TTS speed with settings
  useEffect(() => {
    setTTSSpeed(settings.ttsSpeed ?? 1.0);
    ttsSpeedRef.current = settings.ttsSpeed ?? 1.0;
  }, [settings.ttsSpeed]);

  // Sync TTS volume with settings
  useEffect(() => {
    setTTSVolume(settings.ttsVolume ?? 1.0);
    ttsVolumeRef.current = settings.ttsVolume ?? 1.0;
  }, [settings.ttsVolume]);

  // Sync TTS voice with settings
  useEffect(() => {
    setTTSVoice(settings.ttsVoice ?? 'default');
    ttsVoiceRef.current = settings.ttsVoice ?? 'default';
  }, [settings.ttsVoice]);

  // Load available voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        setAvailableVoices(voices);
        console.log('[TTS] Available voices:', voices.length);
      } catch (error) {
        console.error('[TTS] Failed to load voices:', error);
      }
    };
    loadVoices();
  }, []);

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
        showToast(
          result.pointsAwarded,
          language === 'es' ? 'puntos (Audio)' : 'points (Audio)'
        );
      }
    } catch (error) {
      console.error('[TTS] Failed to award points:', error);
      // Still award points locally as fallback
      addPoints(POINTS.TTS_COMPLETE);
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPoints(POINTS.COMPLETE_DEVOTIONAL);

    if (user) {
      const lastActive = user.lastActiveDate;

      // Calculate yesterday using the same timezone as getTodayDate (Costa Rica)
      const getYesterdayDate = (): string => {
        const now = new Date();
        const costaRicaDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
        costaRicaDate.setDate(costaRicaDate.getDate() - 1);
        const year = costaRicaDate.getFullYear();
        const month = String(costaRicaDate.getMonth() + 1).padStart(2, "0");
        const day = String(costaRicaDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
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
        // User already completed today - keep current streak
        console.log('[Streak] Already active today, keeping streak:', newStreakCurrent);
      } else {
        // User missed a day or first time - reset to 1
        newStreakCurrent = 1;
        updateUser({ streakCurrent: 1 });
        console.log('[Streak] Resetting streak to 1 (lastActive was:', lastActive, ')');
      }

      const newDevotionalsCompleted = user.devotionalsCompleted + 1;

      updateUser({
        devotionalsCompleted: newDevotionalsCompleted,
        lastActiveDate: today,
      });

      // Sync user data to backend for community display
      try {
        await gamificationApi.syncUser(user.id, {
          streakCurrent: newStreakCurrent,
          streakBest: newStreakBest,
          devotionalsCompleted: newDevotionalsCompleted,
          lastActiveAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Gamification] Failed to sync user data:', error);
      }

      // Update challenge progress for devotional completion
      try {
        await gamificationApi.updateChallengeProgress(user.id, 'devotional_complete');
      } catch (error) {
        console.error('[Gamification] Failed to update challenge progress:', error);
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

  // Handle share completion (called from ShareOptionsSheet)
  const handleShareComplete = useCallback(async (option: ShareOption) => {
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
        showToast(
          pointsResult.pointsAwarded,
          language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
        );
      }
      await gamificationApi.updateChallengeProgress(user.id, 'share');
    } catch (error) {
      console.error('[Share] Failed to award points:', error);
      addPoints(POINTS.SHARE_DEVOTIONAL);
      showToast(
        POINTS.SHARE_DEVOTIONAL,
        language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
      );
    }
  }, [user, language, shareStatus, dailyActions, today, updateUser, addPoints, showToast]);

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
        showToast(
          result.pointsAwarded,
          language === 'es' ? 'puntos (Oracion)' : 'points (Prayer)'
        );
      }
      // Update challenge progress
      await gamificationApi.updateChallengeProgress(user.id, 'prayer');
    } catch (error) {
      console.error('[Prayer] Failed to award points:', error);
      // Still award points locally as fallback
      addPoints(POINTS.PRAYER_CONFIRM);
      showToast(
        POINTS.PRAYER_CONFIRM,
        language === 'es' ? 'puntos (Oracion)' : 'points (Prayer)'
      );
    }
  }, [user, isPrayerDone, dailyActions, today, updateUser, addPoints, showToast, language]);

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
    // Also add pauses between numbered points for better readability
    return [
      { key: 'verse', text: `${verse}. ${formattedReference}` },
      { key: 'reflection', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(reflection, language)) },
      { key: 'story', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(story, language)) },
      { key: 'character', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(character, language)) },
      { key: 'application', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(application, language)) },
      { key: 'prayer', text: normalizeBibleRefForTTS(prayer, language) },
    ];
  }, [devotional, language]);

  // Get the best matching voice for current language using curated voice system
  const getVoiceIdentifier = useCallback(() => {
    const currentVoiceId = ttsVoiceRef.current;
    // Use shared utility to get device voice identifier
    return getDeviceVoiceIdentifier(currentVoiceId, availableVoices, language);
  }, [availableVoices, language]);

  const speakSection = useCallback(async (index: number, sections: { key: string; text: string }[]) => {
    // Check if TTS was stopped
    if (!isTTSPlayingRef.current) {
      return;
    }

    if (index >= sections.length) {
      // TTS completed all sections - award points for completion
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

    // Get current settings from refs for real-time updates
    const voiceId = getVoiceIdentifier();
    const speechOptions: Speech.SpeechOptions = {
      language: language === 'es' ? 'es-ES' : 'en-US',
      rate: ttsSpeedRef.current,
      volume: ttsVolumeRef.current,
      onDone: () => {
        // Only continue if TTS is still playing
        if (isTTSPlayingRef.current) {
          speakSection(index + 1, sections);
        }
      },
      onError: () => {
        // Only continue if TTS is still playing
        if (isTTSPlayingRef.current) {
          speakSection(index + 1, sections);
        }
      },
    };

    // Only add voice if we have a valid identifier
    if (voiceId) {
      speechOptions.voice = voiceId;
    }

    Speech.speak(section.text, speechOptions);
  }, [language, getVoiceIdentifier, handleTTSComplete]);

  const handleTTSPlay = useCallback(async () => {
    if (isTTSPlaying) return;

    const sections = buildDevotionalText();
    if (sections.length === 0) return;

    setIsTTSPlaying(true);
    isTTSPlayingRef.current = true;
    currentSectionsRef.current = sections;
    await speakSection(0, sections);
  }, [isTTSPlaying, buildDevotionalText, speakSection]);

  const handleTTSPause = useCallback(async () => {
    isTTSPlayingRef.current = false;
    await Speech.stop();
    setIsTTSPlaying(false);
  }, []);

  const handleTTSStop = useCallback(async () => {
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

    // Stop current speech and restart with new settings
    await Speech.stop();
    speakSection(currentIndex, sections);
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

  const handleTTSVoiceChange = useCallback((voiceId: string) => {
    setTTSVoice(voiceId);
    ttsVoiceRef.current = voiceId;
    updateSettings({ ttsVoice: voiceId });
    // Restart current section with new voice if playing
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
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>No devotional available</Text>
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

      <ConfettiCelebration visible={showCelebration} />
      <AchievementPopup
        visible={showAchievement}
        points={POINTS.COMPLETE_DEVOTIONAL}
        colors={colors}
        language={language}
      />

      <ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
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
            {user && user.streakCurrent > 0 && (
              <View className="flex-row items-center bg-orange-500/90 px-3 py-2 rounded-full">
                <Flame size={16} color="#FFFFFF" />
                <Text className="text-white font-bold ml-1">
                  {user.streakCurrent}
                </Text>
              </View>
            )}
            <View className="flex-1" />

            {/* Share Button */}
            <Pressable
              onPress={handleOpenShareModal}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20 mr-2"
            >
              <Share2 size={20} color="#FFFFFF" />
            </Pressable>

            {/* Favorite Button */}
            <Pressable
              onPress={toggleFavorite}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20"
            >
              <Heart
                size={22}
                color="#FFFFFF"
                fill={isFavorite ? '#EF4444' : 'transparent'}
              />
            </Pressable>
          </View>

          {/* Title overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">
              {t.todays_devotional}
            </Text>
            <Text className="text-white text-3xl font-bold">{title}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 -mt-4">
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
            onTTSStop={handleTTSStop}
            isTTSPlaying={isTTSPlaying}
            ttsSpeed={ttsSpeed}
            onTTSSpeedChange={handleTTSSpeedChange}
            ttsVolume={ttsVolume}
            onTTSVolumeChange={handleTTSVolumeChange}
            ttsVoice={ttsVoice}
            onTTSVoiceChange={handleTTSVoiceChange}
            availableVoices={availableVoices}
          />

          {/* Completed badge - only shown after 3 minutes */}
          {isCompleted && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="rounded-2xl p-4 mb-6 flex-row items-center"
              style={{ backgroundColor: '#22C55E20' }}
            >
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-green-500">
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text className="text-green-700 font-semibold flex-1">
                {t.completed} - +{POINTS.COMPLETE_DEVOTIONAL} {t.points}
              </Text>
            </Animated.View>
          )}

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
          </CollapsibleContent>
        </View>
      </ScrollView>

      {/* Share Options Sheet */}
      <ShareOptionsSheet
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        devotional={devotional}
        language={language}
        colors={colors}
        translations={{
          bible_verse: t.bible_verse,
          reflection: t.reflection,
          story: t.story,
          biblical_character: t.biblical_character,
          application: t.application,
          prayer: t.prayer,
        }}
        onShareComplete={handleShareComplete}
      />
    </View>
  );
}
