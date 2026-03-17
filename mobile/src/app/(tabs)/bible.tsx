// BibleScreen — Bible navigation hub with home screen, testament nav, highlights
// Flow: Home → Testament Books List → Chapter Grid → Verse Reader

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Search,
  Volume2,
  VolumeX,
  X,
  BookMarked,
  Highlighter,
} from 'lucide-react-native';

import { useThemeColors, useLanguage } from '@/lib/store';
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS } from '@/lib/bible/books';
import { fetchBibleChapter, validateBibleDataLoad } from '@/lib/bible/api';
import { pickBestVoice } from '@/lib/voice-picker';
import {
  sanitizeForTTS,
  preprocessNumbersForTTS,
  applyBiblicalPronunciations,
} from '@/lib/tts-voices';
import { firestoreService } from '@/lib/firestore';
import type {
  BibleBook,
  BibleChapterData,
  BibleNavView,
  BibleVersion,
  BibleVersionInfo,
  HighlightColor,
  HighlightMap,
} from '@/lib/bible/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGHLIGHTS_STORAGE_KEY = 'bible_highlights_v1';

const BIBLE_VERSIONS: BibleVersionInfo[] = [
  { id: 'RVR60', label: 'RVR60', fullName: 'Reina-Valera 1960', available: true },
  { id: 'NVI',   label: 'NVI',   fullName: 'Nueva Versión Internacional', available: false },
  { id: 'LA',    label: 'L.A.',  fullName: 'Lenguaje Actual', available: false },
];

const HIGHLIGHT_COLORS: { key: HighlightColor; bg: string; label: string }[] = [
  { key: 'yellow', bg: '#FEF08A', label: 'Amarillo' },
  { key: 'green',  bg: '#BBF7D0', label: 'Verde' },
  { key: 'blue',   bg: '#BFDBFE', label: 'Azul' },
];

// ─── Highlight persistence ────────────────────────────────────────────────────

async function loadHighlights(): Promise<HighlightMap> {
  try {
    const raw = await AsyncStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HighlightMap) : {};
  } catch {
    return {};
  }
}

async function saveHighlights(map: HighlightMap): Promise<void> {
  try {
    await AsyncStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // silent
  }
}

function highlightKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId}_${chapter}_${verse}`;
}

// ─── Verse Row ────────────────────────────────────────────────────────────────

function VerseRow({
  bookId,
  chapter,
  number,
  text,
  colors,
  highlightColor,
  onLongPress,
}: {
  bookId: string;
  chapter: number;
  number: number;
  text: string;
  colors: ReturnType<typeof useThemeColors>;
  highlightColor: HighlightColor | undefined;
  onLongPress: (verse: number) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgColor = highlightColor
    ? HIGHLIGHT_COLORS.find(h => h.key === highlightColor)?.bg + 'CC'
    : undefined;

  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(number);
      }}
      onPressIn={() => { scale.value = withSpring(0.99); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      delayLongPress={400}
    >
      <Animated.View
        style={[
          animStyle,
          { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8 },
          bgColor ? { backgroundColor: bgColor, borderRadius: 6, marginHorizontal: 8, marginVertical: 1 } : undefined,
        ]}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            marginRight: 12,
            marginTop: 2,
            width: 22,
            textAlign: 'right',
            color: highlightColor ? '#78350F' : colors.primary,
          }}
        >
          {number}
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            lineHeight: 28,
            color: highlightColor ? '#1C1917' : colors.text,
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          }}
        >
          {text}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Highlight Picker Modal ───────────────────────────────────────────────────

function HighlightPicker({
  visible,
  currentColor,
  onSelect,
  onRemove,
  onClose,
  colors,
}: {
  visible: boolean;
  currentColor: HighlightColor | undefined;
  onSelect: (color: HighlightColor) => void;
  onRemove: () => void;
  onClose: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: 40,
              paddingHorizontal: 24,
            }}
          >
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '60', alignSelf: 'center', marginBottom: 20 }} />

            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 16 }}>
              Resaltar versículo
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {HIGHLIGHT_COLORS.map(h => (
                <Pressable
                  key={h.key}
                  onPress={() => { onSelect(h.key); onClose(); }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flex: 1 })}
                >
                  <View
                    style={{
                      backgroundColor: h.bg,
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                      borderWidth: currentColor === h.key ? 2.5 : 0,
                      borderColor: '#000',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917' }}>
                      {h.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {currentColor && (
              <Pressable
                onPress={() => { onRemove(); onClose(); }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: colors.textMuted + '20',
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
                  Quitar resaltado
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Book Item ────────────────────────────────────────────────────────────────

function BookItem({
  book,
  onPress,
  colors,
  lang,
}: {
  book: BibleBook;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
}) {
  const name = lang === 'es' ? book.name : book.nameEn;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.textMuted + '25',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{name}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {book.chapters} {book.chapters === 1 ? 'capítulo' : 'capítulos'}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ─── Chapter Grid ─────────────────────────────────────────────────────────────

function ChapterGrid({
  book,
  onSelect,
  colors,
  lang,
}: {
  book: BibleBook;
  onSelect: (chapter: number) => void;
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const bookName = lang === 'es' ? book.name : book.nameEn;
  const cols = 6;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1.3,
          color: colors.textMuted,
          marginBottom: 12,
        }}
      >
        {bookName}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {chapters.map(ch => (
          <Pressable
            key={ch}
            onPress={() => onSelect(ch)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                width: (SCREEN_WIDTH - 32 - 8 * (cols - 1)) / cols,
                height: (SCREEN_WIDTH - 32 - 8 * (cols - 1)) / cols,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.textMuted + '28',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                {ch}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Testament Card ────────────────────────────────────────────────────────────

function TestamentCard({
  title,
  subtitle,
  bookCount,
  emoji,
  onPress,
  colors,
}: {
  title: string;
  subtitle: string;
  bookCount: number;
  emoji: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[anim, { flex: 1 }]}>
        <LinearGradient
          colors={[colors.primary + 'CC', colors.primary + '99']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            padding: 18,
            minHeight: 110,
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 }}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: '#ffffff99', marginTop: 2, fontWeight: '500' }}>
              {bookCount} libros · {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Bible Home Screen ────────────────────────────────────────────────────────

function BibleHomeScreen({
  colors,
  lang,
  searchQuery,
  onSearchChange,
  selectedVersion,
  onVersionChange,
  onSelectTestament,
  onSearchSubmit,
}: {
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedVersion: BibleVersion;
  onVersionChange: (v: BibleVersion) => void;
  onSelectTestament: (t: 'OT' | 'NT') => void;
  onSearchSubmit: () => void;
}) {
  // Reuse the same devotional query key as the home screen
  const { data: devotionalMeta } = useQuery({
    queryKey: ['todayDevotional'],
    queryFn: () => firestoreService.getTodayDevotional(),
    staleTime: 5 * 60 * 1000,
  });
  const devotional = devotionalMeta?.devotional;
  const verseText = lang === 'es'
    ? (devotional?.bibleVerseEs ?? devotional?.bibleVerse ?? null)
    : (devotional?.bibleVerse ?? null);
  const verseRef = lang === 'es'
    ? (devotional?.bibleReferenceEs ?? devotional?.bibleReference ?? null)
    : (devotional?.bibleReference ?? null);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* ── Hero Card ─────────────────────────────────────────────── */}
      <View style={{ height: 200, marginHorizontal: 0, overflow: 'hidden' }}>
        <Image
          source={{ uri: devotional?.imageUrl ?? 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80' }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 }}
        />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 }}>
          {verseText ? (
            <>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: 19,
                  fontStyle: 'italic',
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                  marginBottom: 4,
                }}
                numberOfLines={3}
              >
                {verseText}
              </Text>
              {verseRef && (
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '600' }}>
                  — {verseRef}
                </Text>
              )}
            </>
          ) : (
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 }}>
              Biblia
            </Text>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderWidth: 1,
            borderColor: colors.textMuted + '28',
            marginBottom: 16,
          }}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.text }}
            placeholder="Buscar libro..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')} hitSlop={10}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* ── Version Selector ──────────────────────────────────────── */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1.1,
              marginBottom: 10,
            }}
          >
            Versión
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {BIBLE_VERSIONS.map(v => {
              const active = selectedVersion === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => v.available && onVersionChange(v.id)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderWidth: active ? 0 : 1,
                      borderColor: colors.textMuted + '30',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? '#fff' : v.available ? colors.text : colors.textMuted,
                      }}
                    >
                      {v.label}
                    </Text>
                    {!v.available && (
                      <View
                        style={{
                          backgroundColor: colors.textMuted + '25',
                          borderRadius: 6,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>
                          PRONTO
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Testament Cards ────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1.1,
            marginBottom: 10,
          }}
        >
          Navegar
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          <TestamentCard
            title="Antiguo Testamento"
            subtitle="Génesis → Malaquías"
            bookCount={OT_BOOKS.length}
            emoji="📜"
            onPress={() => onSelectTestament('OT')}
            colors={colors}
          />
          <TestamentCard
            title="Nuevo Testamento"
            subtitle="Mateo → Apocalipsis"
            bookCount={NT_BOOKS.length}
            emoji="✝️"
            onPress={() => onSelectTestament('NT')}
            colors={colors}
          />
        </View>

        {/* ── Quick Stats ────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.textMuted + '20',
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'Libros', value: '66' },
            { label: 'Capítulos', value: '1,189' },
            { label: 'Versículos', value: '31,102' },
          ].map((stat, i) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 14,
                borderRightWidth: i < 2 ? 0.5 : 0,
                borderRightColor: colors.textMuted + '25',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BibleScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const lang = (language as 'en' | 'es') || 'es';

  // Navigation
  const [view, setView] = useState<BibleNavView>('home');
  const [testamentFilter, setTestamentFilter] = useState<'OT' | 'NT' | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search (home screen)
  const [searchQuery, setSearchQuery] = useState('');

  // Version
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('RVR60');

  // Highlights
  const [highlights, setHighlights] = useState<HighlightMap>({});
  const [highlightPickerVerse, setHighlightPickerVerse] = useState<number | null>(null);

  // TTS
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsJobRef = useRef(0);

  // Load highlights on mount
  useEffect(() => {
    loadHighlights().then(setHighlights);
    validateBibleDataLoad();
  }, []);

  // Search filtered books (used when on home and query is active → shows in books view)
  const searchFilteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return BIBLE_BOOKS.filter(
      b => b.name.toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Books to show in the books list view
  const booksToShow = useMemo(() => {
    if (searchFilteredBooks) return searchFilteredBooks;
    if (testamentFilter === 'OT') return OT_BOOKS;
    if (testamentFilter === 'NT') return NT_BOOKS;
    return BIBLE_BOOKS;
  }, [searchFilteredBooks, testamentFilter]);

  const handleSelectTestament = useCallback((t: 'OT' | 'NT') => {
    setTestamentFilter(t);
    setSearchQuery('');
    setView('books');
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      setTestamentFilter(null);
      setView('books');
    }
  }, [searchQuery]);

  const handleSelectBook = useCallback((book: BibleBook) => {
    setSelectedBook(book);
    setView('chapters');
    setSearchQuery('');
  }, []);

  const handleSelectChapter = useCallback(async (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    setView('verses');
    setLoading(true);
    setError(null);
    setChapterData(null);

    const result = await fetchBibleChapter(selectedBook.id, chapter, lang);
    if (result.success) {
      setChapterData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [selectedBook, lang]);

  const handleBack = useCallback(() => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); }
    if (view === 'verses') {
      setView('chapters');
      setChapterData(null);
      setSelectedChapter(null);
    } else if (view === 'chapters') {
      setView('books');
      setSelectedBook(null);
    } else if (view === 'books') {
      setView('home');
      setTestamentFilter(null);
      setSearchQuery('');
    }
  }, [view, isSpeaking]);

  // Highlighting
  const handleLongPressVerse = useCallback((verse: number) => {
    setHighlightPickerVerse(verse);
  }, []);

  const handleApplyHighlight = useCallback((color: HighlightColor) => {
    if (!selectedBook || !selectedChapter || highlightPickerVerse == null) return;
    const key = highlightKey(selectedBook.id, selectedChapter, highlightPickerVerse);
    const next = { ...highlights, [key]: color };
    setHighlights(next);
    saveHighlights(next);
    setHighlightPickerVerse(null);
  }, [selectedBook, selectedChapter, highlightPickerVerse, highlights]);

  const handleRemoveHighlight = useCallback(() => {
    if (!selectedBook || !selectedChapter || highlightPickerVerse == null) return;
    const key = highlightKey(selectedBook.id, selectedChapter, highlightPickerVerse);
    const next = { ...highlights };
    delete next[key];
    setHighlights(next);
    saveHighlights(next);
    setHighlightPickerVerse(null);
  }, [selectedBook, selectedChapter, highlightPickerVerse, highlights]);

  // TTS
  const handleTTS = useCallback(async () => {
    if (isSpeaking) { await Speech.stop(); setIsSpeaking(false); return; }
    if (!chapterData?.verses.length) return;
    const jobId = ++ttsJobRef.current;
    setIsSpeaking(true);
    try {
      const picked = await pickBestVoice(lang);
      const fullText = chapterData.verses.map(v => `${v.number}. ${v.text}`).join(' ');
      const processedText = applyBiblicalPronunciations(
        preprocessNumbersForTTS(sanitizeForTTS(fullText)), lang
      );
      Speech.speak(processedText, {
        language: lang === 'es' ? 'es-MX' : 'en-US',
        voice: picked.voiceIdentifier ?? undefined,
        rate: 0.9,
        onDone: () => { if (ttsJobRef.current === jobId) setIsSpeaking(false); },
        onStopped: () => { if (ttsJobRef.current === jobId) setIsSpeaking(false); },
        onError: () => { if (ttsJobRef.current === jobId) setIsSpeaking(false); },
      });
    } catch { setIsSpeaking(false); }
  }, [isSpeaking, chapterData, lang]);

  // Header title logic
  const headerTitle = useMemo(() => {
    if (view === 'home') return 'Biblia';
    if (view === 'books') {
      if (searchFilteredBooks) return lang === 'es' ? 'Resultados' : 'Results';
      if (testamentFilter === 'OT') return lang === 'es' ? 'Antiguo Testamento' : 'Old Testament';
      if (testamentFilter === 'NT') return lang === 'es' ? 'Nuevo Testamento' : 'New Testament';
      return 'Biblia';
    }
    if (view === 'chapters' && selectedBook) return lang === 'es' ? selectedBook.name : selectedBook.nameEn;
    if (view === 'verses' && selectedBook && selectedChapter) {
      return `${lang === 'es' ? selectedBook.name : selectedBook.nameEn} ${selectedChapter}`;
    }
    return 'Biblia';
  }, [view, testamentFilter, selectedBook, selectedChapter, searchFilteredBooks, lang]);

  const backLabel = useMemo(() => {
    if (view === 'books') return 'Biblia';
    if (view === 'chapters') return lang === 'es' ? 'Libros' : 'Books';
    if (view === 'verses' && selectedBook) return lang === 'es' ? selectedBook.name : selectedBook.nameEn;
    return 'Atrás';
  }, [view, selectedBook, lang]);

  const showBack = view !== 'home';

  // Current highlight for picker
  const currentHighlightColor = useMemo(() => {
    if (!selectedBook || !selectedChapter || highlightPickerVerse == null) return undefined;
    return highlights[highlightKey(selectedBook.id, selectedChapter, highlightPickerVerse)];
  }, [highlights, selectedBook, selectedChapter, highlightPickerVerse]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 10,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.textMuted + '28',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            {/* Left */}
            {showBack ? (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center' })}
                hitSlop={12}
              >
                <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primary, marginLeft: 2 }}>
                  {backLabel}
                </Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BookMarked size={20} color={colors.primary} strokeWidth={2} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Biblia</Text>
              </View>
            )}

            {/* Center title (only when navigated) */}
            {showBack && (
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: colors.text,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  zIndex: -1,
                }}
                numberOfLines={1}
              >
                {headerTitle}
              </Text>
            )}

            {/* Right */}
            <View style={{ width: 60, alignItems: 'flex-end' }}>
              {view === 'verses' && chapterData && (
                <Pressable onPress={handleTTS} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  {isSpeaking
                    ? <VolumeX size={20} color={colors.primary} />
                    : <Volume2 size={20} color={colors.textMuted} />}
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Content ────────────────────────────────────────────────── */}

      {view === 'home' && (
        <Animated.View entering={FadeIn} style={{ flex: 1 }}>
          <BibleHomeScreen
            colors={colors}
            lang={lang}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedVersion={selectedVersion}
            onVersionChange={setSelectedVersion}
            onSelectTestament={handleSelectTestament}
            onSearchSubmit={handleSearchSubmit}
          />
        </Animated.View>
      )}

      {view === 'books' && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1 }}>
          <FlatList
            data={booksToShow}
            keyExtractor={b => b.id}
            renderItem={({ item }) => (
              <BookItem book={item} onPress={() => handleSelectBook(item)} colors={colors} lang={lang} />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ color: colors.textMuted, fontSize: 15 }}>Sin resultados</Text>
              </View>
            }
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.textMuted + '25',
              overflow: 'hidden',
            }}
          />
        </Animated.View>
      )}

      {view === 'chapters' && selectedBook && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1 }}>
          <ChapterGrid book={selectedBook} onSelect={handleSelectChapter} colors={colors} lang={lang} />
        </Animated.View>
      )}

      {view === 'verses' && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1 }}>
          {loading && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, fontSize: 14, color: colors.textMuted }}>
                Cargando capítulo...
              </Text>
            </View>
          )}

          {error && !loading && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <BookOpen size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, color: colors.text, textAlign: 'center' }}>
                No se pudo cargar
              </Text>
              <Text style={{ fontSize: 14, marginTop: 6, color: colors.textMuted, textAlign: 'center' }}>
                {error}
              </Text>
              <Pressable
                onPress={() => selectedChapter && handleSelectChapter(selectedChapter)}
                style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Reintentar</Text>
              </Pressable>
            </View>
          )}

          {chapterData && !loading && (
            <>
              {/* Highlight hint banner */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  backgroundColor: colors.surface,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.textMuted + '20',
                }}
              >
                <Highlighter size={12} color={colors.textMuted} />
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}>
                  Mantén presionado un versículo para resaltarlo
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
              >
                {chapterData.verses.map(verse => (
                  <VerseRow
                    key={verse.number}
                    bookId={selectedBook?.id ?? ''}
                    chapter={selectedChapter ?? 1}
                    number={verse.number}
                    text={verse.text}
                    colors={colors}
                    highlightColor={
                      selectedBook && selectedChapter
                        ? highlights[highlightKey(selectedBook.id, selectedChapter, verse.number)]
                        : undefined
                    }
                    onLongPress={handleLongPressVerse}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </Animated.View>
      )}

      {/* ── Highlight Picker ─────────────────────────────────────────── */}
      <HighlightPicker
        visible={highlightPickerVerse != null}
        currentColor={currentHighlightColor}
        onSelect={handleApplyHighlight}
        onRemove={handleRemoveHighlight}
        onClose={() => setHighlightPickerVerse(null)}
        colors={colors}
      />
    </View>
  );
}
