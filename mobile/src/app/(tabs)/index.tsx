// Home Screen - Daily Devotional Display with continuous format and audio controls

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Share,
  Modal,
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
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot, { captureRef } from 'react-native-view-shot';
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
import { ShareableDevotionalImage, CAPTURE_SCALE } from '@/components/ShareableDevotionalImage';
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

// TTS Voices available - expanded options
const TTS_VOICES = [
  { id: 'default', name: 'System Default', nameEs: 'Predeterminada del Sistema' },
  { id: 'com.apple.ttsbundle.Samantha-compact', name: 'Samantha (Female)', nameEs: 'Samantha (Femenina)' },
  { id: 'com.apple.ttsbundle.Daniel-compact', name: 'Daniel (Male)', nameEs: 'Daniel (Masculino)' },
  { id: 'com.apple.ttsbundle.Karen-compact', name: 'Karen (Female)', nameEs: 'Karen (Femenina)' },
  { id: 'com.apple.ttsbundle.Moira-compact', name: 'Moira (Female)', nameEs: 'Moira (Femenina)' },
  { id: 'com.apple.speech.synthesis.voice.Alex', name: 'Alex (Male)', nameEs: 'Alex (Masculino)' },
];

// Spanish TTS Voices
const TTS_VOICES_ES = [
  { id: 'default', name: 'System Default', nameEs: 'Predeterminada del Sistema' },
  { id: 'com.apple.ttsbundle.Monica-compact', name: 'Monica (Female)', nameEs: 'Monica (Femenina)' },
  { id: 'com.apple.ttsbundle.Paulina-compact', name: 'Paulina (Female)', nameEs: 'Paulina (Femenina)' },
  { id: 'com.apple.ttsbundle.Jorge-compact', name: 'Jorge (Male)', nameEs: 'Jorge (Masculino)' },
  { id: 'com.apple.ttsbundle.Juan-compact', name: 'Juan (Male)', nameEs: 'Juan (Masculino)' },
  { id: 'com.apple.ttsbundle.Diego-compact', name: 'Diego (Male)', nameEs: 'Diego (Masculino)' },
];

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
    // For English, just convert chapter:verse to "chapter X verse Y"
    return text.replace(/(\d+):(\d+)/g, 'chapter $1 verse $2');
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

  // Pattern to match Bible references: optional number + book name + chapter:verse
  // Matches: "1 Reyes 3:28", "Génesis 3:28", "2 Corintios 5:17", etc.
  const bibleRefPattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+):(\\d+)` + // Chapter:verse
    `(?:-\\d+)?` + // Optional verse range (e.g., 3:28-30)
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefPattern, (match, prefix, num, book, chapter, verse, suffix) => {
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

    return `${prefix}${expandedBook}, capítulo ${chapter}, versículo ${verse}${suffix}`;
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
  const t = TRANSLATIONS[language];

  // Filter voices by current language
  const langCode = language === 'es' ? 'es' : 'en';
  const filteredVoices = availableVoices.filter(v => v.language.startsWith(langCode));

  // Add default option
  const voiceOptions = [
    { identifier: 'default', name: language === 'es' ? 'Predeterminada del Sistema' : 'System Default' },
    ...filteredVoices.map(v => ({ identifier: v.identifier, name: v.name || v.identifier })),
  ];

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

          {/* Voice Selection */}
          <Text className="text-sm font-semibold mt-4 mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Voz' : 'Voice'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {voiceOptions.map((voice) => (
              <Pressable
                key={voice.identifier}
                onPress={() => {
                  onTTSVoiceChange(voice.identifier);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: ttsVoice === voice.identifier ? colors.primary : colors.textMuted + '20',
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: ttsVoice === voice.identifier ? '#FFFFFF' : colors.text }}
                >
                  {voice.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
  const [isCapturing, setIsCapturing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActive === yesterdayStr) {
        incrementStreak();
      } else if (lastActive !== today) {
        updateUser({ streakCurrent: 1 });
      }

      updateUser({
        devotionalsCompleted: user.devotionalsCompleted + 1,
        lastActiveDate: today,
      });

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

  // Capture and share image
  const handleShareImage = useCallback(async () => {
    if (!user || !devotional || !viewShotRef.current) return;

    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Wait a moment for the view to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the view as image with higher pixel ratio for better quality
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        useRenderInContext: true,
      });

      if (!uri) {
        console.error('[Share] Failed to capture image');
        setIsCapturing(false);
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.error('[Share] Sharing not available');
        setIsCapturing(false);
        return;
      }

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: language === 'es' ? 'Compartir Devocional' : 'Share Devotional',
      });

      setIsCapturing(false);
      setShowShareModal(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check if share limit reached
      if (!shareStatus.available) {
        showToast(
          0,
          language === 'es' ? 'Limite diario alcanzado' : 'Daily limit reached',
          'warning'
        );
        return;
      }

      // Update daily actions
      const newShareCount = (dailyActions.shareDate === today ? (dailyActions.shareCount ?? 0) : 0) + 1;
      updateUser({
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
    } catch (error) {
      console.error('[Share] Failed to share image:', error);
      setIsCapturing(false);
    }
  }, [user, devotional, language, shareStatus, dailyActions, today, updateUser, addPoints, showToast]);

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
    return [
      { key: 'verse', text: `${verse}. ${formattedReference}` },
      { key: 'reflection', text: normalizeBibleRefForTTS(reflection, language) },
      { key: 'story', text: normalizeBibleRefForTTS(story, language) },
      { key: 'character', text: normalizeBibleRefForTTS(character, language) },
      { key: 'application', text: normalizeBibleRefForTTS(application, language) },
      { key: 'prayer', text: normalizeBibleRefForTTS(prayer, language) },
    ];
  }, [devotional, language]);

  // Get the best matching voice for current language
  const getVoiceIdentifier = useCallback(() => {
    const currentVoice = ttsVoiceRef.current;
    if (currentVoice === 'default' || !availableVoices.length) {
      return undefined; // Use system default
    }

    // Find voice by identifier
    const voice = availableVoices.find(v => v.identifier === currentVoice);
    if (voice) return voice.identifier;

    // Fallback: find a voice for the current language
    const langCode = language === 'es' ? 'es' : 'en';
    const langVoice = availableVoices.find(v => v.language.startsWith(langCode));
    return langVoice?.identifier;
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFavorite) {
      removeFavorite(today);
    } else {
      addFavorite(today);
      if (!favorites.includes(today)) {
        addPoints(POINTS.FAVORITE_DEVOTIONAL);
      }
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
          </CollapsibleContent>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + 10,
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() => setShowShareModal(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
              {language === 'es' ? 'Compartir Devocional' : 'Share Devotional'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Preview */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120,
            }}
            showsVerticalScrollIndicator={false}
          >
            <ViewShot
              ref={viewShotRef}
              options={{
                format: 'png',
                quality: 1,
                result: 'tmpfile',
              }}
              style={{ backgroundColor: '#000000' }}
            >
              <View collapsable={false}>
                <ShareableDevotionalImage
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
                />
              </View>
            </ViewShot>
          </ScrollView>

          {/* Share Button */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
              paddingTop: 16,
              backgroundColor: 'rgba(0,0,0,0.9)',
            }}
          >
            <Pressable
              onPress={handleShareImage}
              disabled={isCapturing}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCapturing ? 0.7 : 1,
              }}
            >
              {isCapturing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Share2 size={20} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>
                    {language === 'es' ? 'Compartir Imagen' : 'Share Image'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
