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
  FadeOut,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
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
  FlaskConical,
} from 'lucide-react-native';

import { useThemeColors, useLanguage } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { useRouter, useFocusEffect } from 'expo-router';
import { consumeStrongNavTarget } from '@/lib/strong/navigationBridge';
import { StrongSheet } from '@/components/StrongSheet';
import {
  getVerseWordLinks,
  getStrongEntry,
  tokenizeVerse,
  enrichTokensWithStrong,
  loadStrongFavorites,
  toggleStrongFavorite,
  saveStrongModeState,
  loadStrongModeState,
  parseVerseReference,
  hasStrongCoverage,
} from '@/lib/strong/service';
import type { StrongEntry, VerseToken } from '@/lib/strong/types';
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
import { firestoreService, getTodayDate } from '@/lib/firestore';
import { REPO_DEVOCIONALS, repoToDevotional } from '@/lib/repo-devocional';
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
  number, text, colors, highlightColor, isFlashing, onLongPress, onPress,
  isActiveTTS, strongMode, verseId, onStrongWordPress, onNoStrongWordPress,
}: {
  number: number; text: string;
  colors: ReturnType<typeof useThemeColors>;
  highlightColor: HighlightColor | undefined;
  isFlashing: boolean;
  onLongPress: (v: number) => void;
  onPress?: (v: number) => void;
  isActiveTTS?: boolean;
  strongMode: boolean;
  verseId: string;
  onStrongWordPress: (strongId: string) => void;
  onNoStrongWordPress?: () => void;
}) {
  const { sFont } = useScaledFont();
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

  // Compute tokens with Strong links once per render
  const tokens: VerseToken[] = useMemo(() => {
    if (!strongMode) return [];
    const raw = tokenizeVerse(text);
    const links = getVerseWordLinks(verseId);
    return enrichTokensWithStrong(raw, links);
  }, [strongMode, text, verseId]);

  const textColor = highlightColor ? '#1C1917' : colors.text;

  return (
    <Pressable
      onPress={() => { if (onPress) onPress(number); }}
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
            borderRadius: (highlightColor || isFlashing || isActiveTTS) ? 6 : 0,
            marginHorizontal: (highlightColor || isFlashing || isActiveTTS) ? 8 : 0,
            marginVertical: (highlightColor || isFlashing || isActiveTTS) ? 1 : 0,
          },
        ]}
      >
        {isActiveTTS && !highlightColor && !isFlashing && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: colors.primary + '18',
            borderRadius: 6,
          }} />
        )}
        {/* Verse number */}
        <Text
          style={{
            fontSize: sFont(12), fontWeight: '700', marginRight: 12, marginTop: 3,
            width: 22, textAlign: 'right',
            color: highlightColor ? '#78350F' : colors.primary,
          }}
        >
          {number}
        </Text>

        {/* Verse text — plain or Strong-enriched */}
        {strongMode ? (
          // Strong mode: flex-wrap row so each word is an independent Pressable.
          // Words with a Strong ID open the lexicon; words without show a brief toast.
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            {tokens.map((token, i) => {
              const wordText = token.word + (token.hasSpace ? ' ' : '');
              if (token.strongId) {
                const sid = token.strongId;
                return (
                  <Pressable
                    key={i}
                    onPress={() => { Haptics.selectionAsync(); onStrongWordPress(sid); }}
                    onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(number); }}
                    delayLongPress={400}
                    hitSlop={4}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text
                      style={{
                        fontSize: sFont(17),
                        lineHeight: sFont(28),
                        color: colors.primary,
                        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                        textDecorationLine: 'underline',
                        textDecorationColor: colors.primary + '80',
                        textDecorationStyle: 'dotted',
                        fontWeight: '600',
                      }}
                    >
                      {wordText}
                    </Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={i}
                  onPress={() => onNoStrongWordPress?.()}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(number); }}
                  delayLongPress={400}
                  hitSlop={4}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Text
                    style={{
                      fontSize: sFont(17),
                      lineHeight: sFont(28),
                      color: textColor,
                      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                    }}
                  >
                    {wordText}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          // Normal mode or no links: plain text
          <Text
            style={{
              flex: 1, fontSize: sFont(17), lineHeight: sFont(28),
              color: textColor,
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            }}
          >
            {text}
          </Text>
        )}
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
  const { sFont } = useScaledFont();
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
            <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.textMuted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 16 }}>
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
                    <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#1C1917' }}>
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
                <Text style={{ fontSize: sFont(14), fontWeight: '600', color: colors.textMuted }}>
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
  const { sFont } = useScaledFont();
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
          <Text style={{ fontSize: sFont(16), fontWeight: '600', color: colors.text }}>{name}</Text>
          <Text style={{ fontSize: sFont(12), color: colors.textMuted, marginTop: 2 }}>
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
  const { sFont } = useScaledFont();
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const cols = 6;
  const cell = (SCREEN_WIDTH - 32 - 8 * (cols - 1)) / cols;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text style={{ fontSize: sFont(11), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.3, color: colors.textMuted, marginBottom: 12 }}>
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
              <Text style={{ fontSize: sFont(15), fontWeight: '700', color: colors.text }}>{ch}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Testament Card ───────────────────────────────────────────────────────────

const OT_IMAGE = 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80';
const NT_IMAGE = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';

function TestamentCard({ title, subtitle, bookCount, emoji, testament, onPress, lang }: {
  title: string; subtitle: string; bookCount: number; emoji: string;
  testament: 'OT' | 'NT';
  onPress: () => void; lang: string;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const booksLabel = lang === 'es' ? `${bookCount} libros` : `${bookCount} books`;

  const isOT = testament === 'OT';
  const accentColor = isOT ? '#D4A030' : '#5B9BDE';
  const gradientColors: [string, string, string] = isOT
    ? ['rgba(130,78,15,0.82)', 'rgba(80,44,8,0.78)', 'rgba(45,22,3,0.75)']
    : ['rgba(18,58,130,0.82)', 'rgba(12,38,90,0.78)', 'rgba(6,18,55,0.75)'];
  const imageUri = isOT ? OT_IMAGE : NT_IMAGE;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 14 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[anim, {
        flex: 1,
        borderRadius: 22,
        shadowColor: accentColor,
        shadowOpacity: 0.55,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 18,
      }]}>
        {/* Base card — LinearGradient as reliable background layer */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 22, flex: 1, minHeight: 175, overflow: 'hidden' }}
        >
          {/* Background photo — uses borderRadius to clip */}
          <Image
            source={{ uri: imageUri }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              opacity: 0.35, borderRadius: 22,
            }}
            contentFit="cover"
          />
          {/* Dark overlay */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.30)' }} />
          {/* Bottom glow */}
          <LinearGradient
            colors={['transparent', accentColor + '28']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 }}
          />
          {/* Accent border */}
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 22, borderWidth: 1, borderColor: accentColor + '50',
          }} />

          {/* Content — centered, no icon */}
          <View style={{ padding: 18, flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 175 }}>
            <Text style={{
              fontSize: sFont(20), fontWeight: '900', color: '#fff',
              textAlign: 'center', letterSpacing: -0.4, lineHeight: sFont(25),
            }}>
              {title}
            </Text>
            <Text style={{
              fontSize: sFont(11), color: 'rgba(255,255,255,0.50)',
              marginTop: 5, fontWeight: '500', textAlign: 'center',
            }}>
              {subtitle}
            </Text>
            {/* Pill badge */}
            <View style={{
              marginTop: 12,
              backgroundColor: accentColor + '30',
              borderWidth: 1, borderColor: accentColor + '60',
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
            }}>
              <Text style={{
                fontSize: sFont(11), fontWeight: '700',
                color: accentColor, letterSpacing: 0.5,
              }}>
                {booksLabel}
              </Text>
            </View>
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
  const { sFont } = useScaledFont();
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
          <Text style={{ fontSize: sFont(12), fontWeight: '700', color: colors.primary, marginBottom: 4, letterSpacing: 0.3 }}>
            {result.reference}
          </Text>
          <Text style={{ fontSize: sFont(14), color: colors.text, lineHeight: sFont(20) }} numberOfLines={3}>
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
  const { sFont } = useScaledFont();
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
          <Text style={{ fontSize: sFont(11), color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
            {lang === 'es' ? 'Continuar leyendo' : 'Continue reading'}
          </Text>
          <Text style={{ fontSize: sFont(15), fontWeight: '700', color: colors.text }}>
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
  const { sFont } = useScaledFont();
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
          <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.primary, marginBottom: 1 }}>
            {reference}
          </Text>
          {!!item.text && (
            <Text style={{ fontSize: sFont(12), color: colors.textMuted, lineHeight: sFont(17) }} numberOfLines={2}>
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
  const { sFont } = useScaledFont();
  const today = getTodayDate();
  const repoEntry = REPO_DEVOCIONALS[today];
  const isRepoDate = Boolean(repoEntry);

  // Repo dates: build from static data (same source as hoy-nuevo)
  const repoDevotional = isRepoDate
    ? repoToDevotional(lang === 'es' ? repoEntry.es : repoEntry.en, repoEntry.imageUrl)
    : null;

  // Backend dates: fetch from API
  const { data: backendDevotional } = useQuery({
    queryKey: ['devotional', today],
    queryFn: () => firestoreService.getDevotional(today),
    enabled: !isRepoDate,
    staleTime: 30 * 60 * 1000,
  });

  const devotional = repoDevotional ?? backendDevotional ?? null;
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
          style={{ flex: 1, marginLeft: 10, fontSize: sFont(15), color: colors.text }}
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
                <Text style={{ fontSize: sFont(13), fontWeight: '700', color: active ? '#fff' : v.available ? colors.text : colors.textMuted }}>
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

  // ── UNIFIED LAYOUT: passive inline suggestions + home content ────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Hero — collapses while typing to give results space ── */}
        {!isSearchActive && (
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
                      color: '#fff', fontSize: sFont(13), lineHeight: sFont(19), fontStyle: 'italic', marginBottom: 4,
                      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                    }}
                    numberOfLines={3}
                  >
                    {verseText}
                  </Text>
                  {verseRef && (
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: sFont(11), fontWeight: '600' }}>
                      — {verseRef}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={{ color: '#fff', fontSize: sFont(22), fontWeight: '800' }}>
                  {lang === 'es' ? 'Biblia' : 'Bible'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Search bar + version pills (always visible) */}
        {searchBarUI}

        {/* ── Passive suggestions — inline below bar, no screen swap ── */}
        {isSearchActive && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>

            {/* Book name matches */}
            {bookMatches.length > 0 && (
              <Animated.View entering={FadeIn} style={{ marginBottom: 12 }}>
                <Text style={{
                  fontSize: sFont(11), fontWeight: '700', color: colors.textMuted,
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
                  fontSize: sFont(11), fontWeight: '700', color: colors.textMuted,
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

            {/* No results */}
            {!searchingVerses && !hasAnyResults && debouncedQuery.length >= 3 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Search size={28} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={{ color: colors.textMuted, fontSize: sFont(15), marginTop: 10, fontWeight: '600' }}>
                  {i.noResults} "{searchQuery}"
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: sFont(13), marginTop: 4, textAlign: 'center' }}>
                  {i.tryWords}
                </Text>
              </View>
            )}

            {/* Loading */}
            {searchingVerses && debouncedQuery.length >= 3 && verseResults.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontSize: sFont(13), marginTop: 8 }}>
                  {i.searching}
                </Text>
              </View>
            )}

          </View>
        )}

        {/* ── Home content — visible only when not searching ────── */}
        {!isSearchActive && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>

            {/* ── Testament Cards ──────────────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
              <TestamentCard
                title={i.oldTestament}
                subtitle={i.oldTestamentSub}
                bookCount={OT_BOOKS.length}
                emoji="📜"
                testament="OT"
                onPress={() => onSelectTestament('OT')}
                lang={lang}
              />
              <TestamentCard
                title={i.newTestament}
                subtitle={i.newTestamentSub}
                bookCount={NT_BOOKS.length}
                emoji="✝️"
                testament="NT"
                onPress={() => onSelectTestament('NT')}
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
                  fontSize: sFont(11), fontWeight: '700', color: colors.textMuted,
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
                    <Text style={{ color: colors.textMuted, fontSize: sFont(14), fontWeight: '600', marginTop: 8 }}>
                      {i.noHighlights}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: sFont(12), marginTop: 4, textAlign: 'center' }}>
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BibleScreen() {
  const { sFont } = useScaledFont();
  const colors = useThemeColors();
  const language = useLanguage();
  const lang = (language as 'en' | 'es') || 'es';
  const router = useRouter();

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
  const [currentTTSVerse, setCurrentTTSVerse] = useState<number>(-1);
  const ttsJobRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const ttsVoiceRef = useRef<string | undefined>(undefined);
  const langRef = useRef(lang);
  const strongModeActiveRef = useRef(false);
  const prevStrongModeRef = useRef(false); // Strong state before TTS auto-disabled it
  useEffect(() => { langRef.current = lang; ttsVoiceRef.current = undefined; }, [lang]);

  // In-reader version switching animation
  const [contentKey, setContentKey] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'forward' | 'back'>('forward');
  const [versionSwitching, setVersionSwitching] = useState(false);

  // ── Strong Mode ─────────────────────────────────────────────────────────────
  const [strongModeActive, setStrongModeActive] = useState(false);
  const [strongFavorites, setStrongFavorites] = useState<Set<string>>(new Set());
  const [strongSheetEntry, setStrongSheetEntry] = useState<StrongEntry | null>(null);
  const noStrongToastOpacity = useSharedValue(0);
  const noStrongToastAnim = useAnimatedStyle(() => ({ opacity: noStrongToastOpacity.value }));
  const noStrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNoStrongWordPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (noStrongTimerRef.current) clearTimeout(noStrongTimerRef.current);
    noStrongToastOpacity.value = withTiming(1, { duration: 150 });
    noStrongTimerRef.current = setTimeout(() => {
      noStrongToastOpacity.value = withTiming(0, { duration: 400 });
    }, 2000);
  }, [noStrongToastOpacity]);

  const handleStrongWordPress = useCallback((strongId: string) => {
    const entry = getStrongEntry(strongId);
    if (entry) {
      console.log('[Strong] opening sheet for:', strongId);
      setStrongSheetEntry(entry);
    } else {
      console.warn('[Strong] no entry found for strongId:', strongId);
    }
  }, []);

  const handleStrongFavoriteToggle = useCallback(async (strongId: string) => {
    const next = await toggleStrongFavorite(strongId, strongFavorites);
    setStrongFavorites(next);
  }, [strongFavorites]);

  useEffect(() => { strongModeActiveRef.current = strongModeActive; }, [strongModeActive]);

  const handleToggleStrongMode = useCallback(() => {
    setStrongModeActive(prev => {
      const next = !prev;
      saveStrongModeState(next);
      return next;
    });
  }, []);

  const restoreStrongModeAfterTTS = useCallback(() => {
    if (prevStrongModeRef.current) {
      prevStrongModeRef.current = false;
      setStrongModeActive(true);
      saveStrongModeState(true);
    }
  }, []);

  useEffect(() => {
    loadHighlights().then(setHighlights);
    loadLastRead().then(setLastRead);
    loadRecentHighlights().then(setRecentHighlights);
    loadStrongModeState().then(setStrongModeActive);
    loadStrongFavorites().then(setStrongFavorites);
    validateBibleDataLoad();
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (noStrongTimerRef.current) clearTimeout(noStrongTimerRef.current);
    };
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
    // Stop any running TTS when navigating to a new chapter
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      Speech.stop();
      setIsSpeaking(false);
      setCurrentTTSVerse(-1);
    }
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

  const handleNavigateFromStrong = useCallback((bookId: string, chapter: number, verse: number) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book) return;
    setStrongSheetEntry(null);
    loadChapter(book, chapter, verse);
  }, [loadChapter]);

  // Handle navigation triggered from strong-occurrences screen via navigationBridge
  useFocusEffect(useCallback(() => {
    const nav = consumeStrongNavTarget();
    if (nav) {
      const book = BIBLE_BOOKS.find(b => b.id === nav.bookId);
      if (book) loadChapter(book, nav.chapter, nav.verse);
    }
  }, [loadChapter]));

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

  // TTS — verse-by-verse playback
  const speakVerseByIndex = useCallback((verseIdx: number, verses: { number: number; text: string }[], jobId: number) => {
    if (!isSpeakingRef.current || jobId !== ttsJobRef.current) return;
    if (verseIdx >= verses.length) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentTTSVerse(-1);
      restoreStrongModeAfterTTS();
      return;
    }
    const verse = verses[verseIdx];
    setCurrentTTSVerse(verse.number);
    const l = langRef.current;
    const processed = applyBiblicalPronunciations(preprocessNumbersForTTS(sanitizeForTTS(verse.text)), l);
    Speech.speak(processed, {
      language: l === 'es' ? 'es-MX' : 'en-US',
      voice: ttsVoiceRef.current,
      rate: 0.9,
      onDone: () => {
        setTimeout(() => {
          if (jobId === ttsJobRef.current && isSpeakingRef.current)
            speakVerseByIndex(verseIdx + 1, verses, jobId);
        }, 180);
      },
      onError: () => {
        setTimeout(() => {
          if (jobId === ttsJobRef.current && isSpeakingRef.current)
            speakVerseByIndex(verseIdx + 1, verses, jobId);
        }, 180);
      },
    });
  }, [restoreStrongModeAfterTTS]);

  const autoDisableStrongForTTS = useCallback(() => {
    if (strongModeActiveRef.current) {
      prevStrongModeRef.current = true;
      setStrongModeActive(false);
      saveStrongModeState(false);
    } else {
      prevStrongModeRef.current = false;
    }
  }, []);

  const startTTSFromVerse = useCallback(async (verseNumber: number) => {
    if (!chapterData?.verses.length) return;
    isSpeakingRef.current = false;
    await Speech.stop();
    const jobId = ++ttsJobRef.current;
    try {
      if (!ttsVoiceRef.current) {
        const picked = await pickBestVoice(langRef.current);
        ttsVoiceRef.current = picked.voiceIdentifier ?? undefined;
      }
    } catch { /* use default voice */ }
    const startIdx = chapterData.verses.findIndex(v => v.number === verseNumber);
    if (startIdx === -1) return;
    autoDisableStrongForTTS();
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speakVerseByIndex(startIdx, chapterData.verses, jobId);
  }, [chapterData, speakVerseByIndex, autoDisableStrongForTTS]);

  const handleTTS = useCallback(async () => {
    if (isSpeaking) {
      isSpeakingRef.current = false;
      await Speech.stop();
      setIsSpeaking(false);
      setCurrentTTSVerse(-1);
      restoreStrongModeAfterTTS();
      return;
    }
    if (!chapterData?.verses.length) return;
    autoDisableStrongForTTS();
    const jobId = ++ttsJobRef.current;
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    try {
      const picked = await pickBestVoice(lang);
      ttsVoiceRef.current = picked.voiceIdentifier ?? undefined;
    } catch { /* use default voice */ }
    speakVerseByIndex(0, chapterData.verses, jobId);
  }, [isSpeaking, chapterData, lang, speakVerseByIndex, autoDisableStrongForTTS, restoreStrongModeAfterTTS]);

  // Chapter prev/next navigation
  const stopTTS = useCallback(() => {
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      Speech.stop();
      setIsSpeaking(false);
      setCurrentTTSVerse(-1);
      restoreStrongModeAfterTTS();
    }
  }, [restoreStrongModeAfterTTS]);

  const handlePrevChapter = useCallback(() => {
    if (!selectedBook || !selectedChapter || selectedChapter <= 1) return;
    stopTTS();
    loadChapter(selectedBook, selectedChapter - 1);
  }, [selectedBook, selectedChapter, stopTTS, loadChapter]);

  const handleNextChapter = useCallback(() => {
    if (!selectedBook || !selectedChapter || selectedChapter >= selectedBook.chapters) return;
    stopTTS();
    loadChapter(selectedBook, selectedChapter + 1);
  }, [selectedBook, selectedChapter, stopTTS, loadChapter]);

  const handleSwipeNext = useCallback(() => {
    if (!selectedBook || !selectedChapter || selectedChapter >= selectedBook.chapters) return;
    setSwipeDir('forward');
    stopTTS();
    loadChapter(selectedBook, selectedChapter + 1);
  }, [selectedBook, selectedChapter, stopTTS, loadChapter]);

  const handleSwipePrev = useCallback(() => {
    if (!selectedBook || !selectedChapter || selectedChapter <= 1) return;
    setSwipeDir('back');
    stopTTS();
    loadChapter(selectedBook, selectedChapter - 1);
  }, [selectedBook, selectedChapter, stopTTS, loadChapter]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-28, 28])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      if (e.translationX < -50) {
        runOnJS(handleSwipeNext)();
      } else if (e.translationX > 50) {
        runOnJS(handleSwipePrev)();
      }
    });

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
                <Text style={{ fontSize: sFont(15), fontWeight: '500', color: colors.primary, marginLeft: 2 }}>
                  {backLabel}
                </Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BookMarked size={20} color={colors.primary} strokeWidth={2} />
                <Text style={{ fontSize: sFont(20), fontWeight: '800', color: colors.text }}>
                  {lang === 'es' ? 'Biblia' : 'Bible'}
                </Text>
              </View>
            )}

            {/* Center */}
            {showBack && headerTitle.length > 0 && (
              <Text
                style={{
                  fontSize: sFont(17), fontWeight: '700', color: colors.text,
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
                <Text style={{ color: colors.textMuted, fontSize: sFont(15) }}>
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
              <Text style={{ marginTop: 12, fontSize: sFont(14), color: colors.textMuted }}>
                {lang === 'es' ? 'Cargando capítulo...' : 'Loading chapter...'}
              </Text>
            </View>
          )}

          {versionSwitching && !chapterData && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, fontSize: sFont(14), color: colors.textMuted }}>
                {lang === 'es' ? 'Cambiando traducción...' : 'Switching translation...'}
              </Text>
            </View>
          )}

          {error && !loading && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <BookOpen size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: sFont(16), fontWeight: '600', marginTop: 16, color: colors.text, textAlign: 'center' }}>
                {lang === 'es' ? 'No se pudo cargar' : 'Could not load'}
              </Text>
              <Text style={{ fontSize: sFont(14), marginTop: 6, color: colors.textMuted, textAlign: 'center' }}>{error}</Text>
              <Pressable
                onPress={() => selectedBook && selectedChapter && loadChapter(selectedBook, selectedChapter)}
                style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: sFont(14) }}>
                  {lang === 'es' ? 'Reintentar' : 'Retry'}
                </Text>
              </Pressable>
            </View>
          )}

          {chapterData && !loading && (
            <View style={{ flex: 1 }}>
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
                          <Text style={{ fontSize: sFont(10), fontWeight: '700', color: colors.textMuted }}>
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
                            fontSize: sFont(11), fontWeight: '700',
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Highlighter size={11} color={colors.textMuted} />
                    <Text style={{ fontSize: sFont(11), color: colors.textMuted, fontWeight: '500' }}>
                      {lang === 'es' ? 'Mantén presionado para resaltar' : 'Long-press to highlight'}
                    </Text>
                  </View>

                  {/* Strong Mode toggle + search */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {/* Search icon — opens full Strong lexicon */}
                    <Pressable
                      onPress={() => router.push('/strong-search' as any)}
                      hitSlop={8}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
                    >
                      <Search size={13} color={colors.primary} strokeWidth={2.5} />
                    </Pressable>
                    {/* Strong Mode on/off toggle chip */}
                    <Pressable
                      onPress={handleToggleStrongMode}
                      hitSlop={8}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      {(() => {
                        const hasCoverage = selectedBook && selectedChapter
                          ? hasStrongCoverage(selectedBook.id, selectedChapter)
                          : false;
                        const isActive = strongModeActive && hasCoverage;
                        const chipColor = isActive
                          ? colors.primary
                          : hasCoverage
                            ? colors.textMuted
                            : colors.textMuted + '60';
                        return (
                          <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
                            backgroundColor: isActive ? colors.primary + '18' : colors.textMuted + '14',
                            borderWidth: 1,
                            borderColor: isActive ? colors.primary + '40' : colors.textMuted + '25',
                            opacity: hasCoverage ? 1 : 0.4,
                          }}>
                            <FlaskConical size={11} color={chipColor} strokeWidth={2} />
                            <Text style={{
                              fontSize: sFont(11), fontWeight: '700',
                              color: chipColor,
                            }}>
                              Strong
                            </Text>
                            {hasCoverage ? (
                              <View style={{
                                width: 22, height: 12, borderRadius: 6,
                                backgroundColor: isActive ? colors.primary : colors.textMuted + '40',
                                alignItems: isActive ? 'flex-end' : 'flex-start',
                                justifyContent: 'center', paddingHorizontal: 2,
                              }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                              </View>
                            ) : (
                              <Text style={{ fontSize: 9, color: colors.textMuted + '80', fontWeight: '600' }}>—</Text>
                            )}
                          </View>
                        );
                      })()}
                    </Pressable>
                  </View>
                </View>
              </View>

              <GestureDetector gesture={swipeGesture}>
              <Animated.View
                key={contentKey}
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(120)}
                style={{ flex: 1 }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 12, paddingBottom: 160 }}
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
                      onPress={strongModeActive ? undefined : startTTSFromVerse}
                      isActiveTTS={currentTTSVerse === verse.number}
                      strongMode={strongModeActive}
                      verseId={selectedBook && selectedChapter ? `${selectedBook.id}_${selectedChapter}_${verse.number}` : ''}
                      onStrongWordPress={handleStrongWordPress}
                      onNoStrongWordPress={strongModeActive ? handleNoStrongWordPress : undefined}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
              </GestureDetector>

              {/* ── No-Strong toast ── */}
              <Animated.View
                pointerEvents="none"
                style={[noStrongToastAnim, {
                  position: 'absolute',
                  bottom: Platform.OS === 'ios' ? 136 : 118,
                  left: 32, right: 32,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                  borderWidth: 1,
                  borderColor: colors.textMuted + '28',
                }]}
              >
                <BookText size={14} color={colors.textMuted} />
                <Text style={{ flex: 1, fontSize: sFont(13), fontWeight: '500', color: colors.textMuted }}>
                  {lang === 'es'
                    ? 'Esta palabra no tiene número Strong asignado'
                    : 'This word has no Strong number assigned'}
                </Text>
              </Animated.View>

              {/* ── Chapter navigation footer — sticky bar above tab bar ── */}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: Platform.OS === 'ios' ? 83 : 62 }}>
                {/* Fade gradient — blends reading content into the bar */}
                <LinearGradient
                  colors={[colors.background + '00', colors.background + 'CC', colors.background + 'FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ height: 32 }}
                  pointerEvents="none"
                />
                {/* Footer bar */}
                <View style={{
                  backgroundColor: colors.surface,
                  borderTopWidth: 0.5,
                  borderTopColor: colors.textMuted + '30',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: -3 },
                  elevation: 8,
                }}>
                  {/* Anterior — outline, left-aligned */}
                  {(() => {
                    const prevDis = !selectedChapter || selectedChapter <= 1;
                    return (
                      <Pressable
                        onPress={handlePrevChapter}
                        disabled={prevDis}
                        style={({ pressed }) => ({
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: 5,
                          paddingVertical: 11,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          backgroundColor: 'transparent',
                          borderWidth: 1,
                          borderColor: prevDis ? colors.textMuted + '30' : colors.primary + '45',
                          opacity: prevDis ? 1 : pressed ? 0.60 : 1,
                        })}
                      >
                        <ChevronLeft size={15} color={prevDis ? colors.textMuted + '60' : colors.primary} strokeWidth={2.5} />
                        <Text style={{ fontSize: sFont(13), fontWeight: '600', color: prevDis ? colors.textMuted + '60' : colors.primary }}>
                          {lang === 'es' ? 'Anterior' : 'Prev'}
                        </Text>
                      </Pressable>
                    );
                  })()}

                  {/* Chapter indicator — small, low weight */}
                  <View style={{ alignItems: 'center', paddingHorizontal: 14 }}>
                    <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.textMuted, lineHeight: 18 }}>
                      {selectedChapter ?? '—'}
                    </Text>
                    <Text style={{ fontSize: sFont(8), fontWeight: '500', color: colors.textMuted + 'AA', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {lang === 'es' ? 'Cap' : 'Ch'}
                    </Text>
                  </View>

                  {/* Siguiente — outline, right-aligned */}
                  {(() => {
                    const nextDis = !selectedBook || !selectedChapter || selectedChapter >= selectedBook.chapters;
                    return (
                      <Pressable
                        onPress={handleNextChapter}
                        disabled={nextDis}
                        style={({ pressed }) => ({
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 5,
                          paddingVertical: 11,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          backgroundColor: 'transparent',
                          borderWidth: 1,
                          borderColor: nextDis ? colors.textMuted + '30' : colors.primary + '45',
                          opacity: nextDis ? 1 : pressed ? 0.60 : 1,
                        })}
                      >
                        <Text style={{ fontSize: sFont(13), fontWeight: '600', color: nextDis ? colors.textMuted + '60' : colors.primary }}>
                          {lang === 'es' ? 'Siguiente' : 'Next'}
                        </Text>
                        <ChevronRight size={15} color={nextDis ? colors.textMuted + '60' : colors.primary} strokeWidth={2.5} />
                      </Pressable>
                    );
                  })()}
                </View>
              </View>
            </View>
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

      {/* ── Strong Sheet ─────────────────────────────────────────────── */}
      <StrongSheet
        visible={strongSheetEntry != null}
        entry={strongSheetEntry}
        isFavoriteOf={(id) => strongFavorites.has(id)}
        onToggleFavorite={handleStrongFavoriteToggle}
        onClose={() => setStrongSheetEntry(null)}
        onNavigateToVerse={handleNavigateFromStrong}
        onViewAppearances={(strongId) => {
          setStrongSheetEntry(null);
          router.push(`/strong-occurrences?strongId=${strongId}` as any);
        }}
        colors={colors}
        lang={lang}
      />
    </View>
  );
}
