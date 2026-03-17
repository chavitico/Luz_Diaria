// BibleScreen — Bible navigation hub
// Flow: Home (hero + search + versions + testament cards) → Books → Chapters → Verses

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
  KeyboardAvoidingView,
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
  withTiming,
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
  BookText,
  ArrowRight,
} from 'lucide-react-native';

import { useThemeColors, useLanguage } from '@/lib/store';
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS } from '@/lib/bible/books';
import {
  fetchBibleChapter,
  validateBibleDataLoad,
  saveLastRead,
  loadLastRead,
  searchBibleVerses,
} from '@/lib/bible/api';
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
  BibleSearchResult,
  BibleLastRead,
} from '@/lib/bible/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGHLIGHTS_KEY = 'bible_highlights_v1';
const RECENT_HIGHLIGHTS_KEY = 'bible_recent_highlights_v1';

const BIBLE_VERSIONS: BibleVersionInfo[] = [
  { id: 'RVR60', label: 'RVR60', fullName: 'Reina-Valera 1960', available: true },
  { id: 'NVI',   label: 'NVI',   fullName: 'Nueva Versión Internacional', available: true },
  { id: 'LA',    label: 'L.A.',  fullName: 'Lenguaje Actual', available: false },
];

const HIGHLIGHT_COLORS: { key: HighlightColor; bg: string; label: string; labelEn: string }[] = [
  { key: 'yellow', bg: '#FEF08A', label: 'Amarillo', labelEn: 'Yellow' },
  { key: 'green',  bg: '#BBF7D0', label: 'Verde',    labelEn: 'Green' },
  { key: 'blue',   bg: '#BFDBFE', label: 'Azul',     labelEn: 'Blue' },
];

// ─── Recent Highlight type ──────────────────────────────────────────────────

interface RecentHighlight {
  key: string;
  bookId: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  text?: string;
  timestamp: number;
}

// ─── Highlight persistence ─────────────────────────────────────────────────────

async function loadHighlights(): Promise<HighlightMap> {
  try {
    const raw = await AsyncStorage.getItem(HIGHLIGHTS_KEY);
    return raw ? (JSON.parse(raw) as HighlightMap) : {};
  } catch { return {}; }
}

async function saveHighlights(map: HighlightMap): Promise<void> {
  try { await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(map)); } catch {}
}

function hlKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId}_${chapter}_${verse}`;
}

async function loadRecentHighlights(): Promise<RecentHighlight[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_HIGHLIGHTS_KEY);
    return raw ? (JSON.parse(raw) as RecentHighlight[]) : [];
  } catch { return []; }
}

async function persistRecentHighlight(item: RecentHighlight): Promise<void> {
  try {
    const existing = await loadRecentHighlights();
    const filtered = existing.filter(r => r.key !== item.key);
    const updated = [item, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(RECENT_HIGHLIGHTS_KEY, JSON.stringify(updated));
  } catch {}
}

async function removeFromRecentHighlights(key: string): Promise<void> {
  try {
    const existing = await loadRecentHighlights();
    const updated = existing.filter(r => r.key !== key);
    await AsyncStorage.setItem(RECENT_HIGHLIGHTS_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Verse Row ────────────────────────────────────────────────────────────────

function VerseRow({
  number, text, colors, highlightColor, isFlashing, onLongPress,
}: {
  number: number; text: string;
  colors: ReturnType<typeof useThemeColors>;
  highlightColor: HighlightColor | undefined;
  isFlashing: boolean;
  onLongPress: (v: number) => void;
}) {
  const scale = useSharedValue(1);
  const flashBg = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isFlashing
      ? `rgba(253,224,71,${flashBg.value})`
      : highlightColor
        ? HIGHLIGHT_COLORS.find(h => h.key === highlightColor)!.bg + 'CC'
        : 'transparent',
  }));

  useEffect(() => {
    if (isFlashing) {
      flashBg.value = withTiming(0.85, { duration: 300 });
      setTimeout(() => { flashBg.value = withTiming(0, { duration: 1500 }); }, 1200);
    }
  }, [isFlashing]);

  return (
    <Pressable
      onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(number); }}
      onPressIn={() => { scale.value = withSpring(0.99); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      delayLongPress={400}
    >
      <Animated.View
        style={[
          anim,
          {
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: (highlightColor || isFlashing) ? 6 : 0,
            marginHorizontal: (highlightColor || isFlashing) ? 8 : 0,
            marginVertical: (highlightColor || isFlashing) ? 1 : 0,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 12, fontWeight: '700', marginRight: 12, marginTop: 3,
            width: 22, textAlign: 'right',
            color: highlightColor ? '#78350F' : colors.primary,
          }}
        >
          {number}
        </Text>
        <Text
          style={{
            flex: 1, fontSize: 17, lineHeight: 28,
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

// ─── Highlight Picker ─────────────────────────────────────────────────────────

function HighlightPicker({
  visible, currentColor, onSelect, onRemove, onClose, colors, lang,
}: {
  visible: boolean; currentColor: HighlightColor | undefined;
  onSelect: (c: HighlightColor) => void; onRemove: () => void;
  onClose: () => void; colors: ReturnType<typeof useThemeColors>; lang: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingTop: 12, paddingBottom: 40, paddingHorizontal: 24,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '60', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 16 }}>
              {lang === 'es' ? 'Resaltar versículo' : 'Highlight verse'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {HIGHLIGHT_COLORS.map(h => (
                <Pressable key={h.key} onPress={() => { onSelect(h.key); onClose(); }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flex: 1 })}>
                  <View style={{
                    backgroundColor: h.bg, borderRadius: 14, paddingVertical: 14,
                    alignItems: 'center', borderWidth: currentColor === h.key ? 2.5 : 0, borderColor: '#000',
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917' }}>
                      {lang === 'es' ? h.label : h.labelEn}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
            {currentColor && (
              <Pressable onPress={() => { onRemove(); onClose(); }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.textMuted + '20', alignItems: 'center',
                })}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
                  {lang === 'es' ? 'Quitar resaltado' : 'Remove highlight'}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Book Item ─────────────────────────────────────────────────────────────────

function BookItem({ book, onPress, colors, lang }: {
  book: BibleBook; onPress: () => void;
  colors: ReturnType<typeof useThemeColors>; lang: string;
}) {
  const name = lang === 'es' ? book.name : book.nameEn;
  const chaptersLabel = lang === 'es'
    ? `${book.chapters} ${book.chapters === 1 ? 'capítulo' : 'capítulos'}`
    : `${book.chapters} ${book.chapters === 1 ? 'chapter' : 'chapters'}`;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '22',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{name}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {chaptersLabel}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ─── Chapter Grid ─────────────────────────────────────────────────────────────

function ChapterGrid({ book, onSelect, colors, lang }: {
  book: BibleBook; onSelect: (ch: number) => void;
  colors: ReturnType<typeof useThemeColors>; lang: string;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const cols = 6;
  const cell = (SCREEN_WIDTH - 32 - 8 * (cols - 1)) / cols;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.3, color: colors.textMuted, marginBottom: 12 }}>
        {lang === 'es' ? book.name : book.nameEn}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {chapters.map(ch => (
          <Pressable key={ch} onPress={() => onSelect(ch)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{
              width: cell, height: cell, alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.textMuted + '28',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{ch}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Testament Card ───────────────────────────────────────────────────────────

function TestamentCard({ title, subtitle, bookCount, emoji, onPress, colors, lang }: {
  title: string; subtitle: string; bookCount: number; emoji: string;
  onPress: () => void; colors: ReturnType<typeof useThemeColors>; lang: string;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const booksLabel = lang === 'es' ? `${bookCount} libros` : `${bookCount} books`;

  return (
    <Pressable onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={{ flex: 1 }}>
      <Animated.View style={[anim, { flex: 1 }]}>
        <LinearGradient
          colors={[colors.primary + 'EE', colors.primary + 'AA']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, flex: 1, minHeight: 150, justifyContent: 'space-between' }}
        >
          <Text style={{ fontSize: 34 }}>{emoji}</Text>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', lineHeight: 19 }}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' }}>
              {booksLabel}
            </Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Search Result Item ───────────────────────────────────────────────────────

function VerseResultItem({ result, onPress, colors }: {
  result: BibleSearchResult;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '22',
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: colors.primary + '18',
          alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
        }}>
          <BookText size={16} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4, letterSpacing: 0.3 }}>
            {result.reference}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }} numberOfLines={3}>
            {result.text.length > 160 ? result.text.slice(0, 160) + '…' : result.text}
          </Text>
        </View>
        <ChevronRight size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
      </View>
    </Pressable>
  );
}

// ─── Continue Reading Card ─────────────────────────────────────────────────────

function ContinueReadingCard({ lastRead, onPress, colors, lang }: {
  lastRead: BibleLastRead; onPress: () => void;
  colors: ReturnType<typeof useThemeColors>; lang: string;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={[anim, {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: colors.surface,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: colors.primary + '30',
      }]}>
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: colors.primary + '18',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
            {lang === 'es' ? 'Continuar leyendo' : 'Continue reading'}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
            {lastRead.bookName} {lastRead.chapter}
          </Text>
        </View>
        <ArrowRight size={18} color={colors.primary} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Recent Highlight Item ────────────────────────────────────────────────────

function RecentHighlightItem({ item, onPress, colors, lang }: {
  item: RecentHighlight; onPress: () => void;
  colors: ReturnType<typeof useThemeColors>; lang: string;
}) {
  const book = BIBLE_BOOKS.find(b => b.id === item.bookId);
  if (!book) return null;
  const bookName = lang === 'es' ? book.name : book.nameEn;
  const reference = `${bookName} ${item.chapter}:${item.verse}`;
  const hlColor = HIGHLIGHT_COLORS.find(h => h.key === item.color);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '20',
      }}>
        <View style={{
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: hlColor?.bg ?? '#FEF08A',
          borderWidth: 1, borderColor: colors.textMuted + '40',
          flexShrink: 0,
        }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 1 }}>
            {reference}
          </Text>
          {!!item.text && (
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }} numberOfLines={2}>
              {item.text}
            </Text>
          )}
        </View>
        <ChevronRight size={14} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ─── Bible Home Screen ────────────────────────────────────────────────────────

function BibleHomeScreen({
  colors, lang, searchQuery, onSearchChange, selectedVersion, onVersionChange,
  onSelectTestament, onSearchSubmit, lastRead, onContinueReading, onSelectVerseResult,
  recentHighlights, onSelectRecentHighlight,
}: {
  colors: ReturnType<typeof useThemeColors>; lang: string;
  searchQuery: string; onSearchChange: (q: string) => void;
  selectedVersion: BibleVersion; onVersionChange: (v: BibleVersion) => void;
  onSelectTestament: (t: 'OT' | 'NT') => void; onSearchSubmit: () => void;
  lastRead: BibleLastRead | null;
  onContinueReading: () => void;
  onSelectVerseResult: (result: BibleSearchResult) => void;
  recentHighlights: RecentHighlight[];
  onSelectRecentHighlight: (item: RecentHighlight) => void;
}) {
  // Reuse the same query key as Home screen — hits cache instantly
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

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    if (searchQuery.trim().length < 3) { setDebouncedQuery(''); return; }
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Book name matches (instant, local)
  const bookMatches = useMemo(() => {
    if (searchQuery.trim().length < 3) return [];
    const q = searchQuery.toLowerCase();
    return BIBLE_BOOKS.filter(b =>
      b.name.toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  // Verse content search (backend)
  const { data: verseResults = [], isFetching: searchingVerses } = useQuery({
    queryKey: ['bibleSearch', debouncedQuery, lang, selectedVersion],
    queryFn: () => searchBibleVerses(debouncedQuery, lang as 'en' | 'es', 15, selectedVersion),
    enabled: debouncedQuery.length >= 3,
    staleTime: 5 * 60 * 1000,
  });

  const isSearchActive = searchQuery.trim().length >= 3;
  const hasAnyResults = bookMatches.length > 0 || verseResults.length > 0;

  // i18n helpers
  const i = {
    searchPlaceholder: lang === 'es' ? 'Buscar libro o versículo...' : 'Search book or verse...',
    oldTestament:      lang === 'es' ? 'Antiguo Testamento'          : 'Old Testament',
    oldTestamentSub:   lang === 'es' ? 'Génesis → Malaquías'         : 'Genesis → Malachi',
    newTestament:      lang === 'es' ? 'Nuevo Testamento'            : 'New Testament',
    newTestamentSub:   lang === 'es' ? 'Mateo → Apocalipsis'         : 'Matthew → Revelation',
    recentHighlights:  lang === 'es' ? 'Resaltados recientes'        : 'Recent highlights',
    noHighlights:      lang === 'es' ? 'Aún no tienes resaltados'    : 'No highlights yet',
    noHighlightsSub:   lang === 'es' ? 'Mantén presionado un versículo para resaltar' : 'Long-press any verse to highlight it',
    booksLabel:        lang === 'es' ? 'Libros'                      : 'Books',
    versesLabel:       lang === 'es' ? 'Versículos'                  : 'Verses',
    noResults:         lang === 'es' ? 'Sin resultados para'         : 'No results for',
    tryWords:          lang === 'es' ? 'Intenta con palabras como: amor, fe, paz, misericordia' : 'Try words like: love, faith, peace, grace',
    searching:         lang === 'es' ? 'Buscando versículos...'      : 'Searching verses...',
  };

  // ── Shared search bar + version pills UI ──────────────────────
  const searchBarUI = (
    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 }}>
      {/* Search Bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 11,
        borderWidth: 1, borderColor: colors.textMuted + '28', marginBottom: 10,
      }}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.text }}
          placeholder={i.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
          autoCorrect={false} autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} hitSlop={10}>
            <X size={16} color={colors.textMuted} />
          </Pressable>
        )}
        {searchingVerses && <ActivityIndicator size="small" color={colors.textMuted} style={{ marginLeft: 8 }} />}
      </View>

      {/* Version Pills */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {BIBLE_VERSIONS.map(v => {
          const active = selectedVersion === v.id;
          return (
            <Pressable key={v.id}
              onPress={() => v.available && onVersionChange(v.id)}
              style={({ pressed }) => ({ opacity: pressed && v.available ? 0.7 : 1 })}>
              <View style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: active ? colors.primary : v.available ? colors.surface : colors.textMuted + '14',
                borderWidth: 1,
                borderColor: active ? 'transparent' : v.available ? colors.textMuted + '28' : colors.textMuted + '44',
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : v.available ? colors.text : colors.textMuted }}>
                  {v.label}
                </Text>
                {!v.available && (
                  <View style={{ backgroundColor: colors.primary + '33', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, color: colors.primary, fontWeight: '800', letterSpacing: 0.4 }}>
                      {lang === 'es' ? 'PRONTO' : 'SOON'}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // ── SEARCH MODE: focused layout with results above keyboard ───
  if (isSearchActive) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          {/* Fixed search bar + version pills at top */}
          <View style={{
            borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '22',
            backgroundColor: colors.background,
          }}>
            {searchBarUI}
          </View>

          {/* Scrollable results — fills space above keyboard */}
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
          >
            {/* Book matches */}
            {bookMatches.length > 0 && (
              <Animated.View entering={FadeIn} style={{ marginBottom: 12 }}>
                <Text style={{
                  fontSize: 11, fontWeight: '700', color: colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8,
                }}>
                  {i.booksLabel}
                </Text>
                <View style={{
                  backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden',
                  borderWidth: 1, borderColor: colors.textMuted + '22',
                }}>
                  {bookMatches.map(b => (
                    <BookItem
                      key={b.id} book={b} colors={colors} lang={lang}
                      onPress={() => onSearchSubmit()}
                    />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Verse content matches */}
            {verseResults.length > 0 && (
              <Animated.View entering={FadeIn}>
                <Text style={{
                  fontSize: 11, fontWeight: '700', color: colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8,
                }}>
                  {i.versesLabel} · {selectedVersion}
                </Text>
                <View style={{
                  backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden',
                  borderWidth: 1, borderColor: colors.textMuted + '22',
                }}>
                  {verseResults.map((r, idx) => (
                    <VerseResultItem
                      key={`${r.reference}_${idx}`}
                      result={r}
                      onPress={() => onSelectVerseResult(r)}
                      colors={colors}
                    />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* No results state */}
            {!searchingVerses && !hasAnyResults && debouncedQuery.length >= 2 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Search size={28} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={{ color: colors.textMuted, fontSize: 15, marginTop: 10, fontWeight: '600' }}>
                  {i.noResults} "{searchQuery}"
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                  {i.tryWords}
                </Text>
              </View>
            )}

            {/* Still loading state */}
            {searchingVerses && debouncedQuery.length >= 2 && verseResults.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>
                  {i.searching}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── NORMAL MODE: full home layout ─────────────────────────────
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={{ height: 190, overflow: 'hidden' }}>
        <Image
          source={{ uri: devotional?.imageUrl ?? 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80' }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.76)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
        />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 }}>
          {verseText ? (
            <>
              <Text
                style={{
                  color: '#fff', fontSize: 13, lineHeight: 19, fontStyle: 'italic', marginBottom: 4,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                }}
                numberOfLines={3}
              >
                {verseText}
              </Text>
              {verseRef && (
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' }}>
                  — {verseRef}
                </Text>
              )}
            </>
          ) : (
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
              {lang === 'es' ? 'Biblia' : 'Bible'}
            </Text>
          )}
        </View>
      </View>

      {/* Search bar + version pills (rendered from shared UI above) */}
      {searchBarUI}

      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>

        {/* ── Testament Cards ──────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
          <TestamentCard
            title={i.oldTestament}
            subtitle={i.oldTestamentSub}
            bookCount={OT_BOOKS.length}
            emoji="📜"
            onPress={() => onSelectTestament('OT')}
            colors={colors}
            lang={lang}
          />
          <TestamentCard
            title={i.newTestament}
            subtitle={i.newTestamentSub}
            bookCount={NT_BOOKS.length}
            emoji="✝️"
            onPress={() => onSelectTestament('NT')}
            colors={colors}
            lang={lang}
          />
        </View>

        {/* ── Continue Reading + Recent Highlights ─── */}
        <Animated.View entering={FadeIn} style={{ gap: 16 }}>

          {/* Continue Reading */}
          {lastRead && (
            <ContinueReadingCard lastRead={lastRead} onPress={onContinueReading} colors={colors} lang={lang} />
          )}

          {/* Recent Highlights */}
          <View>
            <Text style={{
              fontSize: 11, fontWeight: '700', color: colors.textMuted,
              textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8,
            }}>
              {i.recentHighlights}
            </Text>
            {recentHighlights.length === 0 ? (
              <View style={{
                backgroundColor: colors.surface, borderRadius: 14, padding: 20,
                alignItems: 'center', borderWidth: 1, borderColor: colors.textMuted + '22',
              }}>
                <Highlighter size={22} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: 8 }}>
                  {i.noHighlights}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  {i.noHighlightsSub}
                </Text>
              </View>
            ) : (
              <View style={{
                backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden',
                borderWidth: 1, borderColor: colors.textMuted + '22',
              }}>
                {recentHighlights.slice(0, 5).map(item => (
                  <RecentHighlightItem
                    key={item.key}
                    item={item}
                    onPress={() => onSelectRecentHighlight(item)}
                    colors={colors}
                    lang={lang}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BibleScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const lang = (language as 'en' | 'es') || 'es';

  // Navigation state
  const [view, setView] = useState<BibleNavView>('home');
  const [testamentFilter, setTestamentFilter] = useState<'OT' | 'NT' | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Version
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('RVR60');

  // Highlights
  const [highlights, setHighlights] = useState<HighlightMap>({});
  const [highlightPickerVerse, setHighlightPickerVerse] = useState<number | null>(null);
  const [recentHighlights, setRecentHighlights] = useState<RecentHighlight[]>([]);

  // Flash verse (from search result navigation)
  const [flashVerse, setFlashVerse] = useState<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Last read
  const [lastRead, setLastRead] = useState<BibleLastRead | null>(null);

  // TTS
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsJobRef = useRef(0);

  // In-reader version switching animation
  const [contentKey, setContentKey] = useState(0);
  const [versionSwitching, setVersionSwitching] = useState(false);

  useEffect(() => {
    loadHighlights().then(setHighlights);
    loadLastRead().then(setLastRead);
    loadRecentHighlights().then(setRecentHighlights);
    validateBibleDataLoad();
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  // Filtered books for 'books' view
  const booksToShow = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return BIBLE_BOOKS.filter(b =>
        b.name.toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q)
      );
    }
    if (testamentFilter === 'OT') return OT_BOOKS;
    if (testamentFilter === 'NT') return NT_BOOKS;
    return BIBLE_BOOKS;
  }, [searchQuery, testamentFilter]);

  // ── Chapter loader ────────────────────────────────────────────────
  const loadChapter = useCallback(async (book: BibleBook, chapter: number, targetVerse?: number, versionOverride?: BibleVersion) => {
    const version = versionOverride ?? selectedVersion;
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setView('verses');
    setLoading(true);
    setError(null);
    setChapterData(null);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashVerse(null);

    const newLastRead: BibleLastRead = {
      bookId: book.id,
      bookName: lang === 'es' ? book.name : book.nameEn,
      chapter, lang, timestamp: Date.now(),
    };
    setLastRead(newLastRead);
    saveLastRead(newLastRead);

    const result = await fetchBibleChapter(book.id, chapter, lang as 'en' | 'es', version);
    if (result.success) {
      setChapterData(result.data);
      setContentKey(k => k + 1);
      if (targetVerse != null) {
        setFlashVerse(targetVerse);
        flashTimerRef.current = setTimeout(() => setFlashVerse(null), 3000);
      }
    } else {
      setError(result.error ?? (lang === 'es' ? 'No se pudo cargar' : 'Could not load chapter'));
    }
    setLoading(false);
  }, [lang, selectedVersion]);

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

  const handleSelectChapter = useCallback((chapter: number) => {
    if (!selectedBook) return;
    loadChapter(selectedBook, chapter);
  }, [selectedBook, loadChapter]);

  // Navigate from verse search result → direct to chapter
  const handleSelectVerseResult = useCallback((result: BibleSearchResult) => {
    const book = BIBLE_BOOKS.find(b => b.id === result.bookId);
    if (!book) return;
    setSearchQuery('');
    loadChapter(book, result.chapter, result.verse);
  }, [loadChapter]);

  // Navigate from recent highlight → direct to chapter + flash verse
  const handleSelectRecentHighlight = useCallback((item: RecentHighlight) => {
    const book = BIBLE_BOOKS.find(b => b.id === item.bookId);
    if (!book) return;
    loadChapter(book, item.chapter, item.verse);
  }, [loadChapter]);

  // Continue reading
  const handleContinueReading = useCallback(() => {
    if (!lastRead) return;
    const book = BIBLE_BOOKS.find(b => b.id === lastRead.bookId);
    if (!book) return;
    loadChapter(book, lastRead.chapter);
  }, [lastRead, loadChapter]);

  const handleBack = useCallback(() => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); }
    if (view === 'verses') {
      setView('chapters');
      setChapterData(null);
      setSelectedChapter(null);
      setFlashVerse(null);
    } else if (view === 'chapters') {
      setView('books');
      setSelectedBook(null);
    } else if (view === 'books') {
      setView('home');
      setTestamentFilter(null);
      setSearchQuery('');
    }
  }, [view, isSpeaking]);

  // In-reader version switch — reloads the current chapter with the new translation
  const handleInReaderVersionChange = useCallback(async (newVersion: BibleVersion) => {
    if (newVersion === selectedVersion) return;
    const vInfo = BIBLE_VERSIONS.find(v => v.id === newVersion);
    if (!vInfo?.available) return;
    if (!selectedBook || !selectedChapter) return;

    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); }

    setSelectedVersion(newVersion);
    setVersionSwitching(true);
    setChapterData(null);
    setError(null);

    const result = await fetchBibleChapter(
      selectedBook.id, selectedChapter, lang as 'en' | 'es', newVersion
    );
    if (result.success) {
      setChapterData(result.data);
      setContentKey(k => k + 1);
    } else {
      setError(result.error ?? (lang === 'es' ? 'No se pudo cargar' : 'Could not load'));
    }
    setVersionSwitching(false);
  }, [selectedVersion, selectedBook, selectedChapter, lang, isSpeaking]);

  // Highlighting
  const handleLongPressVerse = useCallback((verse: number) => {
    setHighlightPickerVerse(verse);
  }, []);

  const handleApplyHighlight = useCallback((color: HighlightColor) => {
    if (!selectedBook || !selectedChapter || highlightPickerVerse == null) return;
    const key = hlKey(selectedBook.id, selectedChapter, highlightPickerVerse);
    const next = { ...highlights, [key]: color };
    setHighlights(next);
    saveHighlights(next);

    // Capture verse text for recent highlights display
    const verseText = chapterData?.verses.find(v => v.number === highlightPickerVerse)?.text;
    const recent: RecentHighlight = {
      key,
      bookId: selectedBook.id,
      chapter: selectedChapter,
      verse: highlightPickerVerse,
      color,
      text: verseText ? verseText.slice(0, 100) : undefined,
      timestamp: Date.now(),
    };
    setRecentHighlights(prev => {
      const filtered = prev.filter(r => r.key !== key);
      return [recent, ...filtered].slice(0, 10);
    });
    persistRecentHighlight(recent);

    setHighlightPickerVerse(null);
  }, [selectedBook, selectedChapter, highlightPickerVerse, highlights, chapterData]);

  const handleRemoveHighlight = useCallback(() => {
    if (!selectedBook || !selectedChapter || highlightPickerVerse == null) return;
    const key = hlKey(selectedBook.id, selectedChapter, highlightPickerVerse);
    const next = { ...highlights };
    delete next[key];
    setHighlights(next);
    saveHighlights(next);

    setRecentHighlights(prev => prev.filter(r => r.key !== key));
    removeFromRecentHighlights(key);

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
      const processed = applyBiblicalPronunciations(preprocessNumbersForTTS(sanitizeForTTS(fullText)), lang);
      Speech.speak(processed, {
        language: lang === 'es' ? 'es-MX' : 'en-US',
        voice: picked.voiceIdentifier ?? undefined, rate: 0.9,
        onDone: () => { if (ttsJobRef.current === jobId) setIsSpeaking(false); },
        onStopped: () => { if (ttsJobRef.current === jobId) setIsSpeaking(false); },
        onError: () => { if (ttsJobRef.current === jobId) setIsSpeaking(false); },
      });
    } catch { setIsSpeaking(false); }
  }, [isSpeaking, chapterData, lang]);

  // Header
  const headerTitle = useMemo(() => {
    if (view === 'books') {
      if (searchQuery.trim()) return lang === 'es' ? 'Resultados' : 'Results';
      if (testamentFilter === 'OT') return lang === 'es' ? 'Antiguo Testamento' : 'Old Testament';
      if (testamentFilter === 'NT') return lang === 'es' ? 'Nuevo Testamento' : 'New Testament';
    }
    if (view === 'chapters' && selectedBook) return lang === 'es' ? selectedBook.name : selectedBook.nameEn;
    if (view === 'verses' && selectedBook && selectedChapter)
      return `${lang === 'es' ? selectedBook.name : selectedBook.nameEn} ${selectedChapter}  ·  ${selectedVersion}`;
    return '';
  }, [view, testamentFilter, selectedBook, selectedChapter, searchQuery, lang, selectedVersion]);

  const backLabel = useMemo(() => {
    if (view === 'books') return lang === 'es' ? 'Biblia' : 'Bible';
    if (view === 'chapters') return lang === 'es' ? 'Libros' : 'Books';
    if (view === 'verses' && selectedBook) return lang === 'es' ? selectedBook.name : selectedBook.nameEn;
    return lang === 'es' ? 'Atrás' : 'Back';
  }, [view, selectedBook, lang]);

  const showBack = view !== 'home';

  const currentHighlightColor = useMemo(() => {
    if (!selectedBook || !selectedChapter || highlightPickerVerse == null) return undefined;
    return highlights[hlKey(selectedBook.id, selectedChapter, highlightPickerVerse)];
  }, [highlights, selectedBook, selectedChapter, highlightPickerVerse]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={{
          paddingHorizontal: 16, paddingBottom: 10,
          borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '28',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            {/* Left */}
            {showBack ? (
              <Pressable onPress={handleBack}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center' })}
                hitSlop={12}>
                <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primary, marginLeft: 2 }}>
                  {backLabel}
                </Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BookMarked size={20} color={colors.primary} strokeWidth={2} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                  {lang === 'es' ? 'Biblia' : 'Bible'}
                </Text>
              </View>
            )}

            {/* Center */}
            {showBack && headerTitle.length > 0 && (
              <Text
                style={{
                  fontSize: 17, fontWeight: '700', color: colors.text,
                  position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: -1,
                }}
                numberOfLines={1}
              >
                {headerTitle}
              </Text>
            )}

            {/* Right */}
            <View style={{ width: 60, alignItems: 'flex-end' }}>
              {view === 'verses' && chapterData && (
                <Pressable onPress={handleTTS} hitSlop={12}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  {isSpeaking
                    ? <VolumeX size={20} color={colors.primary} />
                    : <Volume2 size={20} color={colors.textMuted} />}
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Views ──────────────────────────────────────────────── */}

      {view === 'home' && (
        <Animated.View entering={FadeIn} style={{ flex: 1 }}>
          <BibleHomeScreen
            colors={colors} lang={lang}
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            selectedVersion={selectedVersion} onVersionChange={setSelectedVersion}
            onSelectTestament={handleSelectTestament} onSearchSubmit={handleSearchSubmit}
            lastRead={lastRead} onContinueReading={handleContinueReading}
            onSelectVerseResult={handleSelectVerseResult}
            recentHighlights={recentHighlights}
            onSelectRecentHighlight={handleSelectRecentHighlight}
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
                <Text style={{ color: colors.textMuted, fontSize: 15 }}>
                  {lang === 'es' ? 'Sin resultados' : 'No results'}
                </Text>
              </View>
            }
            style={{
              marginHorizontal: 16, marginTop: 12,
              borderRadius: 14, backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.textMuted + '22', overflow: 'hidden',
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
                {lang === 'es' ? 'Cargando capítulo...' : 'Loading chapter...'}
              </Text>
            </View>
          )}

          {versionSwitching && !chapterData && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, fontSize: 14, color: colors.textMuted }}>
                {lang === 'es' ? 'Cambiando traducción...' : 'Switching translation...'}
              </Text>
            </View>
          )}

          {error && !loading && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <BookOpen size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, color: colors.text, textAlign: 'center' }}>
                {lang === 'es' ? 'No se pudo cargar' : 'Could not load'}
              </Text>
              <Text style={{ fontSize: 14, marginTop: 6, color: colors.textMuted, textAlign: 'center' }}>{error}</Text>
              <Pressable
                onPress={() => selectedBook && selectedChapter && loadChapter(selectedBook, selectedChapter)}
                style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                  {lang === 'es' ? 'Reintentar' : 'Retry'}
                </Text>
              </Pressable>
            </View>
          )}

          {chapterData && !loading && (
            <>
              {/* ── In-reader controls bar ── */}
              <View style={{
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 6,
                backgroundColor: colors.surface,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.textMuted + '20',
              }}>
                {/* Version switcher row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {BIBLE_VERSIONS.map(v => {
                    const active = selectedVersion === v.id;
                    if (!v.available) {
                      return (
                        <View key={v.id} style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                          backgroundColor: colors.textMuted + '18',
                          borderWidth: 1,
                          borderColor: colors.textMuted + '30',
                          gap: 4,
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                            {v.label}
                          </Text>
                          <View style={{ backgroundColor: colors.primary + '2E', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 7, color: colors.primary, fontWeight: '800', letterSpacing: 0.3 }}>
                              {lang === 'es' ? 'PRONTO' : 'SOON'}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => handleInReaderVersionChange(v.id as BibleVersion)}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        hitSlop={6}
                      >
                        <View style={{
                          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                          backgroundColor: active ? colors.primary : colors.textMuted + '18',
                          borderWidth: active ? 0 : 1,
                          borderColor: colors.textMuted + '25',
                        }}>
                          <Text style={{
                            fontSize: 11, fontWeight: '700',
                            color: active ? '#fff' : colors.textMuted,
                          }}>
                            {v.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Highlight hint row — sits below version pills, never overlaps */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <Highlighter size={11} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}>
                    {lang === 'es' ? 'Mantén presionado para resaltar' : 'Long-press to highlight'}
                  </Text>
                </View>
              </View>

              <Animated.View key={contentKey} entering={FadeIn.duration(250)} style={{ flex: 1 }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
                >
                  {chapterData.verses.map(verse => (
                    <VerseRow
                      key={verse.number}
                      number={verse.number}
                      text={verse.text}
                      colors={colors}
                      highlightColor={
                        selectedBook && selectedChapter
                          ? highlights[hlKey(selectedBook.id, selectedChapter, verse.number)]
                          : undefined
                      }
                      isFlashing={flashVerse === verse.number}
                      onLongPress={handleLongPressVerse}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            </>
          )}
        </Animated.View>
      )}

      <HighlightPicker
        visible={highlightPickerVerse != null}
        currentColor={currentHighlightColor}
        onSelect={handleApplyHighlight}
        onRemove={handleRemoveHighlight}
        onClose={() => setHighlightPickerVerse(null)}
        colors={colors}
        lang={lang}
      />
    </View>
  );
}
