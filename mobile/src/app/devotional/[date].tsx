// Devotional Detail Page - View historical devotionals with continuous reading

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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import Slider from '@react-native-community/slider';
import {
  BookOpen,
  Heart,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  ArrowLeft,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Music,
  Settings2,
  Share2,
} from 'lucide-react-native';
import { ShareOptionsSheet, type ShareOption } from '@/components/ShareOptionsSheet';
import { BibleReferenceText } from '@/components/BibleReferenceText';
import { firestoreService } from '@/lib/firestore';
import {
  useThemeColors,
  useLanguage,
  useUserFavorites,
  useUserSettings,
  useAppStore,
  useUser,
} from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { POINTS } from '@/lib/types';
import { useMusicPlayer, MUSIC_TRACKS } from '@/components/BackgroundMusicProvider';
import { PointsToast, usePointsToast } from '@/components/PointsToast';
import { gamificationApi } from '@/lib/gamification-api';
import { getTodayDate } from '@/lib/firestore';

const { height, width } = Dimensions.get('window');

// Import TTS utilities
import {
  addTTSPausesForNumberedPoints,
  sanitizeForTTS,
  preprocessNumbersForTTS,
  applyBiblicalPronunciations,
} from '@/lib/tts-voices';
import { pickBestVoice, type PickedVoice } from '@/lib/voice-picker';

// Bible book translations from English to Spanish
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  'Genesis': 'Génesis',
  'Exodus': 'Éxodo',
  'Leviticus': 'Levítico',
  'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josué',
  'Judges': 'Jueces',
  'Ruth': 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas',
  '2 Chronicles': '2 Crónicas',
  'Ezra': 'Esdras',
  'Nehemiah': 'Nehemías',
  'Esther': 'Ester',
  'Job': 'Job',
  'Psalm': 'Salmo',
  'Psalms': 'Salmos',
  'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastés',
  'Song of Solomon': 'Cantares',
  'Song of Songs': 'Cantares',
  'Isaiah': 'Isaías',
  'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones',
  'Ezekiel': 'Ezequiel',
  'Daniel': 'Daniel',
  'Hosea': 'Oseas',
  'Joel': 'Joel',
  'Amos': 'Amós',
  'Obadiah': 'Abdías',
  'Jonah': 'Jonás',
  'Micah': 'Miqueas',
  'Nahum': 'Nahúm',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sofonías',
  'Haggai': 'Hageo',
  'Zechariah': 'Zacarías',
  'Malachi': 'Malaquías',
  'Matthew': 'Mateo',
  'Mark': 'Marcos',
  'Luke': 'Lucas',
  'John': 'Juan',
  'Acts': 'Hechos',
  'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  'Galatians': 'Gálatas',
  'Ephesians': 'Efesios',
  'Philippians': 'Filipenses',
  'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  'Titus': 'Tito',
  'Philemon': 'Filemón',
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
  // Sort by length descending to match longer names first
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
// RULE: In Spanish, ALL numbered Bible books use the FEMININE form:
//   1 → Primera de, 2 → Segunda de, 3 → Tercera de  (never Primero/Segundo)
// Converts "1 Samuel 3:4-5"  → "Primera de Samuel, capítulo 3, versículos del 4 al 5"
// Converts "2 Samuel 11"     → "Segunda de Samuel, capítulo 11"
// Converts "Salmo 51"        → "Salmo, capítulo 51"
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
  // This handles the case where there's no space between book name and chapter
  let result = text.replace(
    new RegExp(
      `([123])?\\s*(${spanishBibleBooks.join('|')}):(\\d+)`,
      'gi'
    ),
    (_m, num, book, chap) => num ? `${num} ${book} ${chap}` : `${book} ${chap}`
  );

  // Pattern to match Bible references with chapter:verse (and optional verse range)
  // Matches: "1 Reyes 3:28", "Génesis 3:28", "2 Corintios 5:17", "Lucas 10:25-37", etc.
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
      const ordinal = spanishOrdinals[num];
      if (!ordinal) {
        // Unknown number — read only book + chapter, skip verse to avoid phonetic errors
        console.log(`[TTS] Unknown ordinal "${num}" for book "${book}" — skipping verse`);
        return `${prefix}${book}, capítulo ${chapter}${suffix}`;
      }
      expandedBook = `${ordinal} ${book}`;
    }
    const verseText = verseEnd
      ? `versículos del ${verseStart} al ${verseEnd}`
      : `versículo ${verseStart}`;
    return `${prefix}${expandedBook}, capítulo ${chapter}, ${verseText}${suffix}`;
  });

  // Pattern for chapter-only references (no :verse part)
  // Matches: "2 Samuel 11", "Salmo 51", "Génesis 37"
  // Must NOT be followed by a colon (to avoid double-matching chapter:verse above)
  const bibleRefChapterOnlyPattern = new RegExp(
    `(^|[\\s,;.("'])` + // Word boundary or start
    `([123])?\\s*` + // Optional leading number (1, 2, or 3)
    `(${spanishBibleBooks.join('|')})` + // Book name
    `\\s+(\\d+)` + // Chapter number
    `(?![:\\d])` + // NOT followed by : or digit (would be part of a verse ref)
    `([\\s,;.)"']|$)`, // Word boundary or end
    'gi'
  );

  result = result.replace(bibleRefChapterOnlyPattern, (_match, prefix, num, book, chapter, suffix) => {
    let expandedBook = book;
    if (num) {
      const ordinal = spanishOrdinals[num];
      if (!ordinal) {
        console.log(`[TTS] Unknown ordinal "${num}" for book "${book}"`);
        return `${prefix}${book}, capítulo ${chapter}${suffix}`;
      }
      expandedBook = `${ordinal} ${book}`;
    }
    return `${prefix}${expandedBook}, capítulo ${chapter}${suffix}`;
  });

  return result;
}

// Helper to convert Bible references to spoken form
function formatBibleReferenceForSpeech(reference: string, language: 'en' | 'es'): string {
  // Spanish conversions — ALL use feminine form (Primera/Segunda/Tercera)
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
    '1 Crónicas': 'Primera de Crónicas',
    '2 Crónicas': 'Segunda de Crónicas',
  };

  // English conversions
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

interface ContentSectionProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  isHighlighted?: boolean;
  sectionIndex: number;
  onPress?: () => void;
}

function ContentSection({ title, content, icon, colors, isHighlighted, sectionIndex, onPress }: ContentSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + sectionIndex * 50).duration(400)}
      className="mb-6"
    >
      {/* Section Header */}
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

      {/* Section Content */}
      <Pressable
        onPress={onPress}
        android_ripple={onPress ? { color: colors.primary + '20' } : undefined}
        style={({ pressed }) => ({
          opacity: onPress && pressed ? 0.75 : 1,
        })}
      >
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
      </Pressable>
    </Animated.View>
  );
}

// Collapsible full devotional text for overflow
function CollapsibleDevotional({
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
                  {language === 'es' ? 'Ver más' : 'Show more'}
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
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

// Audio Controls Component — simplified to match Home: Play/Pause TTS + Music toggle only
// Speed fixed at 0.9x, default voice, no sliders/voice selection.
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

        {/* Right: Music toggle + music settings gear */}
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
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: showMusicSettings ? colors.primary + '30' : colors.textMuted + '20' }}
          >
            <Settings2 size={18} color={showMusicSettings ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Music track selector */}
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

export default function DevotionalDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const colors = useThemeColors();
  const language = useLanguage();
  const favorites = useUserFavorites();
  const settings = useUserSettings();
  const t = TRANSLATIONS[language];
  const user = useUser();

  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const addPoints = useAppStore((s) => s.addPoints);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updateUser = useAppStore((s) => s.updateUser);

  // Use the global music player from BackgroundMusicProvider
  const musicPlayer = useMusicPlayer();

  // Points toast
  const { currentToast, showToast, hideToast } = usePointsToast();

  // Passive metrics: track time reading this devotional (internal, no UI)
  const readingEntryRef = useRef<number>(Date.now());
  useEffect(() => {
    readingEntryRef.current = Date.now();
    return () => {
      const secs = Math.floor((Date.now() - readingEntryRef.current) / 1000);
      console.log(`[Metrics] Devotional reading time (${date}): ${secs}s`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // TTS state
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [ttsSpeed, setTTSSpeed] = useState(settings.ttsSpeed ?? 1.0);
  const [ttsVolume, setTTSVolume] = useState(settings.ttsVolume ?? 1.0);
  const pickedVoiceRef = useRef<PickedVoice | null>(null);
  const speechJobIdRef = useRef(0);
  const isTTSPlayingRef = useRef(false);
  const currentSectionIndexRef = useRef(-1);
  const ttsVolumeRef = useRef(settings.ttsVolume ?? 1.0);
  const currentSectionsRef = useRef<{ key: string; text: string }[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['devotional', date],
    queryFn: () => firestoreService.getDevotional(date ?? ''),
    enabled: !!date,
    retry: 1,
  });

  const isFavorite = date ? favorites.includes(date) : false;

  // Sync TTS volume with settings
  useEffect(() => {
    setTTSVolume(settings.ttsVolume ?? 1.0);
    ttsVolumeRef.current = settings.ttsVolume ?? 1.0;
  }, [settings.ttsVolume]);

  // Initialize voice picker on mount
  useEffect(() => {
    const initVoice = async () => {
      try {
        const picked = await pickBestVoice(language as 'en' | 'es');
        pickedVoiceRef.current = picked;
        if (__DEV__) {
          console.log(`[TTS][date] Picked voice: ${picked.name} | id: ${picked.voiceIdentifier} | score: ${picked.score} | needsAction: ${picked.needsUserAction}`);
        }
      } catch (err) {
        console.error('[TTS][date] Failed to init voice:', err);
      }
    };
    initVoice();
  }, [language]);

  // Get voice identifier from picked voice
  const getVoiceIdentifier = useCallback((): { id: string | undefined; lang: string } => {
    const picked = pickedVoiceRef.current;
    const lang = language === 'es' ? 'es-MX' : 'en-US';
    if (!picked) return { id: undefined, lang };
    return { id: picked.voiceIdentifier, lang: picked.language ?? lang };
  }, [language]);

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
    // Sanitize garbage text from cross-reference annotations, then add pauses,
    // then apply biblical name pronunciation corrections.
    const ttsLang = language as 'en' | 'es';
    return [
      { key: 'verse', text: applyBiblicalPronunciations(preprocessNumbersForTTS(sanitizeForTTS(`${verse}. ${formattedReference}`)), ttsLang) },
      { key: 'reflection', text: applyBiblicalPronunciations(preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(reflection), language))), ttsLang) },
      { key: 'story', text: applyBiblicalPronunciations(preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(story), language))), ttsLang) },
      { key: 'character', text: applyBiblicalPronunciations(preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(character), language))), ttsLang) },
      { key: 'application', text: applyBiblicalPronunciations(preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(application), language))), ttsLang) },
      { key: 'prayer', text: applyBiblicalPronunciations(preprocessNumbersForTTS(normalizeBibleRefForTTS(sanitizeForTTS(prayer), language)), ttsLang) },
    ];
  }, [devotional, language]);

  const DEVOTIONAL_RATE = 0.88;
  const DEVOTIONAL_PITCH = 0.95;

  const speakSection = useCallback((index: number, sections: { key: string; text: string }[], jobId: number) => {
    if (!isTTSPlayingRef.current || jobId !== speechJobIdRef.current) {
      return;
    }

    if (index >= sections.length) {
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

    const { id: voiceId, lang: voiceLang } = getVoiceIdentifier();

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

    if (voiceId) {
      speechOptions.voice = voiceId;
    }

    if (__DEV__) {
      console.log(`[TTS][date] Section ${index + 1}/${sections.length}: "${section.key}" | voice: ${voiceId ?? 'default'} | lang: ${voiceLang} | rate: ${DEVOTIONAL_RATE} | pitch: ${DEVOTIONAL_PITCH}`);
    }

    Speech.speak(section.text, speechOptions);
  }, [getVoiceIdentifier]);

  const handleTTSPlay = useCallback(() => {
    if (isTTSPlaying) return;

    const sections = buildDevotionalText();
    if (sections.length === 0) return;

    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    setIsTTSPlaying(true);
    isTTSPlayingRef.current = true;
    currentSectionsRef.current = sections;
    speakSection(0, sections, jobId);
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

  const handleTTSJumpToSection = useCallback(async (index: number) => {
    const sections = buildDevotionalText();
    if (sections.length === 0 || index < 0 || index >= sections.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Stop any current speech and increment job ID to invalidate ongoing sections
    isTTSPlayingRef.current = false;
    await Speech.stop();

    // Start fresh from the tapped section
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    setIsTTSPlaying(true);
    isTTSPlayingRef.current = true;
    currentSectionsRef.current = sections;
    speakSection(index, sections, jobId);
  }, [buildDevotionalText, speakSection]);

  // Restart current section with new settings
  const restartCurrentSection = useCallback(async () => {
    if (!isTTSPlayingRef.current || currentSectionIndexRef.current < 0) return;
    const sections = currentSectionsRef.current;
    const currentIndex = currentSectionIndexRef.current;
    if (sections.length === 0 || currentIndex >= sections.length) return;
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    await Speech.stop();
    speakSection(currentIndex, sections, jobId);
  }, [speakSection]);

  // Initialize audio session for TTS independently of the music provider.
  // This ensures TTS works even when background music is muted or never started,
  // because expo-speech (native TTS) needs the audio session configured before use.
  useEffect(() => {
    const initTTSAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        });
      } catch (err) {
        // Non-fatal: TTS may still work with the system default audio session
        if (__DEV__) console.log('[TTS] Audio session init error:', err);
      }
    };
    initTTSAudioSession();
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggleFavorite = () => {
    if (!date) return;
    console.log('[Favorite] Detail toggle pressed, date:', date, 'isFavorite:', isFavorite, 'user:', !!user, 'favorites:', favorites);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFavorite) {
      removeFavorite(date);
      console.log('[Favorite] Removed from favorites:', date);
    } else {
      // Only award points if not already a favorite (prevents duplicate points)
      if (!favorites.includes(date)) {
        addPoints(POINTS.FAVORITE_DEVOTIONAL);
      }
      addFavorite(date);
      console.log('[Favorite] Added to favorites:', date);
    }
  };

  // Open share modal
  const handleOpenShareModal = useCallback(() => {
    if (!devotional) return;
    setShowShareModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [devotional]);

  // Handle share completion (called from ShareOptionsSheet)
  const handleShareComplete = useCallback(async (option: ShareOption) => {
    if (!user) return;

    const today = getTodayDate();
    const dailyActions = user?.dailyActions ?? {};

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
  }, [user, language, updateUser, addPoints, showToast]);

  const handleMusicToggle = () => {
    musicPlayer.togglePlayback();
  };

  const handleMusicVolumeChange = (value: number) => {
    musicPlayer.setVolume(value);
  };

  const handleTrackChange = (trackId: string) => {
    musicPlayer.setTrack(trackId);
  };

  const handleTTSSpeedChange = useCallback((value: number) => {
    setTTSSpeed(value);
    updateSettings({ ttsSpeed: value });
    if (isTTSPlayingRef.current) {
      restartCurrentSection();
    }
  }, [updateSettings, restartCurrentSection]);

  const handleTTSVolumeChange = useCallback((value: number) => {
    setTTSVolume(value);
    ttsVolumeRef.current = value;
    updateSettings({ ttsVolume: value });
    if (isTTSPlayingRef.current) {
      restartCurrentSection();
    }
  }, [updateSettings, restartCurrentSection]);

  const formatDate = (dateStr: string) => {
    // Add T12:00:00 to avoid timezone issues when parsing date-only strings
    const dateObj = new Date(dateStr + 'T12:00:00');
    return dateObj.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
        <Text style={{ color: colors.text }}>Devotional not found</Text>
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

  const sectionKeys = ['verse', 'reflection', 'story', 'character', 'application', 'prayer'];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Image */}
        <View style={{ height: height * 0.35 }}>
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Back button */}
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
            style={{ paddingTop: insets.top + 10 }}
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-black/30"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>

            <View className="flex-row items-center">
              {/* Share Button */}
              <Pressable
                onPress={handleOpenShareModal}
                className="w-10 h-10 rounded-full items-center justify-center bg-black/30 mr-2"
              >
                <Share2 size={20} color="#FFFFFF" />
              </Pressable>

              {/* Favorite Button */}
              <Pressable
                onPress={toggleFavorite}
                className="w-10 h-10 rounded-full items-center justify-center bg-black/30"
              >
                <Heart
                  size={22}
                  color="#FFFFFF"
                  fill={isFavorite ? '#EF4444' : 'transparent'}
                />
              </Pressable>
            </View>
          </View>

          {/* Title overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-white/70 text-sm font-medium mb-2">
              {formatDate(devotional.date)}
            </Text>
            <Text className="text-white text-2xl font-bold">{title}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 pt-6">
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

          {/* Collapsible content wrapper */}
          <CollapsibleDevotional colors={colors} language={language}>
            {/* Bible Verse Card */}
            <Pressable
              onPress={() => handleTTSJumpToSection(0)}
              android_ripple={{ color: colors.primary + '20' }}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
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
                — {language === 'es' ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)) : devotional.bibleReference}
              </Text>
            </Animated.View>
            </Pressable>

            {/* All sections displayed continuously */}
            <ContentSection
              title={t.reflection}
              content={reflection}
              icon={<Star size={16} color={colors.primary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 1}
              sectionIndex={1}
              onPress={() => handleTTSJumpToSection(1)}
            />

            <ContentSection
              title={t.story}
              content={story}
              icon={<BookOpen size={16} color={colors.secondary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 2}
              sectionIndex={2}
              onPress={() => handleTTSJumpToSection(2)}
            />

            <ContentSection
              title={t.biblical_character}
              content={character}
              icon={<Star size={16} color={colors.accent} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 3}
              sectionIndex={3}
              onPress={() => handleTTSJumpToSection(3)}
            />

            <ContentSection
              title={t.application}
              content={application}
              icon={<Check size={16} color={colors.primary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 4}
              sectionIndex={4}
              onPress={() => handleTTSJumpToSection(4)}
            />

            <ContentSection
              title={t.prayer}
              content={prayer}
              icon={<Heart size={16} color={colors.secondary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 5}
              sectionIndex={5}
              onPress={() => handleTTSJumpToSection(5)}
            />
          </CollapsibleDevotional>
        </View>
      </ScrollView>

      {/* Points Toast */}
      <PointsToast
        message={currentToast}
        onHide={hideToast}
        primaryColor={colors.primary}
      />

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
