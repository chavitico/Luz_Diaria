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

// Import curated TTS voices
import {
  getCuratedVoices,
  findMatchingDeviceVoice,
  getDeviceVoiceIdentifier,
  getPreviewText,
  addTTSPausesForNumberedPoints,
  sanitizeForTTS,
  type CuratedVoice,
} from '@/lib/tts-voices';

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
}

function ContentSection({ title, content, icon, colors, isHighlighted, sectionIndex }: ContentSectionProps) {
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
  const previewText = language === 'es'
    ? 'El Señor es mi pastor, nada me faltara.'
    : 'The Lord is my shepherd, I shall not want.';

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
      {/* Main Controls Bar */}
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

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

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
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['devotional', date],
    queryFn: () => firestoreService.getDevotional(date ?? ''),
    enabled: !!date,
  });

  const isFavorite = date ? favorites.includes(date) : false;

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
      } catch (error) {
        console.error('[TTS] Failed to load voices:', error);
      }
    };
    loadVoices();
  }, []);

  // Get the best matching voice for current language using curated voice system
  const getVoiceIdentifier = useCallback(() => {
    const currentVoiceId = ttsVoiceRef.current;
    if (currentVoiceId === 'default' || !availableVoices.length) {
      return undefined;
    }

    // Find the curated voice by ID
    const curatedVoices = getCuratedVoices(language);
    const curatedVoice = curatedVoices.find((v: CuratedVoice) => v.id === currentVoiceId);

    if (!curatedVoice) {
      // Fallback to default behavior
      return undefined;
    }

    // Find matching device voice for the curated voice
    const deviceVoice = findMatchingDeviceVoice(curatedVoice, availableVoices, language);
    return deviceVoice?.identifier;
  }, [availableVoices, language]);

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
      { key: 'verse', text: sanitizeForTTS(`${verse}. ${formattedReference}`) },
      { key: 'reflection', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(reflection), language)) },
      { key: 'story', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(story), language)) },
      { key: 'character', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(character), language)) },
      { key: 'application', text: addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(application), language)) },
      { key: 'prayer', text: normalizeBibleRefForTTS(sanitizeForTTS(prayer), language) },
    ];
  }, [devotional, language]);

  const speakSection = useCallback(async (index: number, sections: { key: string; text: string }[]) => {
    if (!isTTSPlayingRef.current) {
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

    const voiceId = getVoiceIdentifier();
    const speechOptions: Speech.SpeechOptions = {
      language: language === 'es' ? 'es-ES' : 'en-US',
      rate: ttsSpeedRef.current,
      volume: ttsVolumeRef.current,
      onDone: () => {
        if (isTTSPlayingRef.current) {
          speakSection(index + 1, sections);
        }
      },
      onError: () => {
        if (isTTSPlayingRef.current) {
          speakSection(index + 1, sections);
        }
      },
    };

    if (voiceId) {
      speechOptions.voice = voiceId;
    }

    Speech.speak(section.text, speechOptions);
  }, [language, getVoiceIdentifier]);

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

  // Restart current section with new settings
  const restartCurrentSection = useCallback(async () => {
    if (!isTTSPlayingRef.current || currentSectionIndexRef.current < 0) return;
    const sections = currentSectionsRef.current;
    const currentIndex = currentSectionIndexRef.current;
    if (sections.length === 0 || currentIndex >= sections.length) return;
    await Speech.stop();
    speakSection(currentIndex, sections);
  }, [speakSection]);

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
    ttsSpeedRef.current = value;
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

  const handleTTSVoiceChange = useCallback((voiceId: string) => {
    setTTSVoice(voiceId);
    ttsVoiceRef.current = voiceId;
    updateSettings({ ttsVoice: voiceId });
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

          {/* Collapsible content wrapper */}
          <CollapsibleDevotional colors={colors} language={language}>
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
                — {language === 'es' ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)) : devotional.bibleReference}
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
