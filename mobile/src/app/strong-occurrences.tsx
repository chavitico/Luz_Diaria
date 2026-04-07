// strong-occurrences.tsx
// Full-screen list of verse appearances for a single Strong entry.
// Route: /strong-occurrences?strongId=H7225
// Each row fetches and displays the verse text with the tagged word highlighted.

import React, { useMemo, useCallback, useEffect, useState, memo } from 'react';
import {
  View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Info } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { strongRepository } from '@/lib/strong/repository';
import { setStrongNavTarget } from '@/lib/strong/navigationBridge';
import { BIBLE_BOOKS } from '@/lib/bible/books';
import { fetchBibleChapter } from '@/lib/bible';
import type { VerseAppearance } from '@/lib/strong/types';

// ─── Module-level verse cache ─────────────────────────────────────────────────
// Keyed by verseId ("GEN_1_1") → verse text string.
// Shared across all mounted rows so re-renders don't re-fetch.

const VERSE_TEXT_CACHE = new Map<string, string>();

// Chapter-level in-flight deduplication: "GEN_1" → Promise<void>
const CHAPTER_PROMISES = new Map<string, Promise<void>>();

async function loadVerseText(
  bookId: string,
  chapter: number,
  verse: number,
): Promise<string | null> {
  const verseId = `${bookId}_${chapter}_${verse}`;
  if (VERSE_TEXT_CACHE.has(verseId)) return VERSE_TEXT_CACHE.get(verseId)!;

  const chapterKey = `${bookId}_${chapter}`;

  // Deduplicate concurrent chapter fetches
  if (!CHAPTER_PROMISES.has(chapterKey)) {
    const promise = fetchBibleChapter(bookId, chapter, 'es', 'RVR60').then(result => {
      if (result.success) {
        for (const v of result.data.verses) {
          VERSE_TEXT_CACHE.set(`${bookId}_${chapter}_${v.number}`, v.text);
        }
      }
      CHAPTER_PROMISES.delete(chapterKey);
    });
    CHAPTER_PROMISES.set(chapterKey, promise);
  }

  await CHAPTER_PROMISES.get(chapterKey);
  return VERSE_TEXT_CACHE.get(verseId) ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bookName(bookId: string): string {
  return BIBLE_BOOKS.find(b => b.id === bookId)?.name ?? bookId;
}

function verseRef(a: VerseAppearance): string {
  return `${bookName(a.bookId)} ${a.chapter}:${a.verse}`;
}

// Deduplicate by verseId — same verse only once even if Strong appears multiple times.
function deduplicateByVerse(list: VerseAppearance[]): VerseAppearance[] {
  const seen = new Set<string>();
  return list.filter(a => {
    if (seen.has(a.verseId)) return false;
    seen.add(a.verseId);
    return true;
  });
}

// ─── HighlightedVerse ─────────────────────────────────────────────────────────
// Shows a ±WINDOW_SIZE token window centred on wordIndex, with the target
// token rendered in the primary colour.

const WINDOW = 8;

function HighlightedVerse({
  text,
  wordIndex,
  primaryColor,
  mutedColor,
}: {
  text: string;
  wordIndex: number;
  primaryColor: string;
  mutedColor: string;
}) {
  const tokens = text.split(' ');

  // Guard: if wordIndex is out of range, show full text without highlighting
  if (wordIndex < 0 || wordIndex >= tokens.length) {
    return (
      <Text style={{ fontSize: 13, lineHeight: 20, color: mutedColor, flexShrink: 1 }}>
        {text}
      </Text>
    );
  }

  const start = Math.max(0, wordIndex - WINDOW);
  const end = Math.min(tokens.length - 1, wordIndex + WINDOW);
  const window = tokens.slice(start, end + 1);
  const relativeIdx = wordIndex - start;

  const prefixEllipsis = start > 0;
  const suffixEllipsis = end < tokens.length - 1;

  return (
    <Text style={{ fontSize: 13, lineHeight: 20, flexShrink: 1 }}>
      {prefixEllipsis && (
        <Text style={{ color: mutedColor }}>{'…'}</Text>
      )}
      {window.map((token, i) => {
        const isTarget = i === relativeIdx;
        const needsSpace = i < window.length - 1 || suffixEllipsis;
        return (
          <Text key={i}>
            <Text
              style={isTarget
                ? { color: primaryColor, fontWeight: '700' }
                : { color: mutedColor }
              }
            >
              {token}
            </Text>
            {needsSpace ? ' ' : ''}
          </Text>
        );
      })}
      {suffixEllipsis && (
        <Text style={{ color: mutedColor }}>{'…'}</Text>
      )}
    </Text>
  );
}

// ─── AppearanceRow ────────────────────────────────────────────────────────────

const AppearanceRow = memo(function AppearanceRow({
  appearance,
  onPress,
  colors,
}: {
  appearance: VerseAppearance;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const [verseText, setVerseText] = useState<string | null>(
    // Synchronous warm-cache hit (no flicker if already loaded)
    VERSE_TEXT_CACHE.get(appearance.verseId) ?? null,
  );
  const [loading, setLoading] = useState(verseText === null);

  useEffect(() => {
    if (verseText !== null) return; // already have it
    let cancelled = false;
    loadVerseText(appearance.bookId, appearance.chapter, appearance.verse).then(text => {
      if (!cancelled) {
        setVerseText(text);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [appearance.bookId, appearance.chapter, appearance.verse, appearance.verseId]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.primary + '12' : colors.surface,
          borderColor: colors.textMuted + '30',
        },
      ]}
    >
      <View style={styles.rowBody}>
        {/* Reference + word badge */}
        <View style={styles.rowTop}>
          <Text style={[styles.rowRef, { color: colors.text }]}>
            {verseRef(appearance)}
          </Text>
          <View style={[styles.wordBadge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.wordBadgeText, { color: colors.primary }]}>
              {appearance.displayedWord.replace(/[.,;:!?()]/g, '')}
            </Text>
          </View>
        </View>

        {/* Verse text */}
        {loading ? (
          <View style={styles.skeleton}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.textMuted + '25', width: '90%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.textMuted + '18', width: '60%' }]} />
          </View>
        ) : verseText ? (
          <HighlightedVerse
            text={verseText}
            wordIndex={appearance.wordIndex}
            primaryColor={colors.primary}
            mutedColor={colors.textMuted}
          />
        ) : null}
      </View>
      <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} style={{ marginLeft: 8 }} />
    </Pressable>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StrongOccurrencesScreen() {
  const { strongId } = useLocalSearchParams<{ strongId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const entry = useMemo(() => strongRepository.getEntryById(strongId ?? ''), [strongId]);

  const appearances = useMemo((): VerseAppearance[] => {
    if (!strongId) return [];
    const raw = strongRepository.getVerseAppearances(strongId);
    return deduplicateByVerse(raw);
  }, [strongId]);

  const handleVersePress = useCallback((a: VerseAppearance) => {
    setStrongNavTarget(a.bookId, a.chapter, a.verse);
    router.navigate('/(tabs)/bible' as any);
  }, [router]);

  const lang = entry?.language ?? 'Hebrew';
  const langColor = lang === 'Hebrew' ? '#3b82f6' : '#8b5cf6';

  const renderItem = useCallback(({ item }: { item: VerseAppearance }) => (
    <AppearanceRow
      appearance={item}
      onPress={() => handleVersePress(item)}
      colors={colors}
    />
  ), [colors, handleVersePress]);

  const keyExtractor = useCallback((item: VerseAppearance) => item.verseId, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.textMuted + '30' }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Apariciones
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={appearances}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListHeaderComponent={
          <>
            {/* Entry summary */}
            {entry ? (
              <View style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.textMuted + '30' }]}>
                <View style={styles.entryTop}>
                  <View style={[styles.idBadge, { backgroundColor: langColor + '20' }]}>
                    <Text style={[styles.idText, { color: langColor }]}>{entry.id}</Text>
                  </View>
                  <View style={[styles.langBadge, { backgroundColor: langColor + '15' }]}>
                    <Text style={[styles.langText, { color: langColor }]}>
                      {entry.language === 'Hebrew' ? 'Hebreo' : 'Griego'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.lemma, { color: colors.text }]}>
                  {entry.lemmaOriginal}
                </Text>
                <Text style={[styles.translit, { color: colors.textMuted }]}>
                  {entry.transliteration}
                </Text>
                <Text style={[styles.definition, { color: colors.textMuted }]} numberOfLines={2}>
                  {entry.shortDefinition}
                </Text>
              </View>
            ) : (
              <View style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.textMuted + '30' }]}>
                <Text style={[styles.idText, { color: colors.primary }]}>{strongId}</Text>
              </View>
            )}

            {/* Count */}
            <View style={styles.countRow}>
              <BookOpen size={14} color={colors.textMuted} strokeWidth={2} />
              <Text style={[styles.countText, { color: colors.textMuted }]}>
                {appearances.length === 0
                  ? 'Sin apariciones en los textos cubiertos'
                  : appearances.length === 1
                  ? '1 versículo encontrado'
                  : `${appearances.length} versículos encontrados`}
              </Text>
            </View>

            {/* Empty state */}
            {appearances.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.textMuted + '30' }]}>
                <Info size={20} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Sin cobertura aún
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                  Esta entrada tiene {entry?.occurrencesCount ?? '—'} apariciones en la Biblia.
                  La alineación palabra↔Strong está disponible en más de 30 libros y ~6.700 versículos.
                  Este término aún no aparece en los pasajes cubiertos.
                </Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          appearances.length > 0 ? (
            <View style={[styles.footerNote, { borderColor: colors.textMuted + '30' }]}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Cobertura: AT (Gn · Éx · Lv · Nm · Dt · Jos · Sal · Pro · Is · Jr · Ez · Dn) ·
                NT (Mt · Mr · Lc · Jn · Hch · Ro · 1Co · 2Co · Gá · Ef · Flp · Col · Heb · 1Jn · Ap){'\n'}
                Toca cualquier versículo para abrirlo en el lector bíblico.
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  entryCard: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, marginBottom: 14,
  },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  idBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  idText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  langBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  langText: { fontSize: 11, fontWeight: '600' },
  lemma: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  translit: { fontSize: 13, fontStyle: 'italic', marginBottom: 6 },
  definition: { fontSize: 13, lineHeight: 19 },

  countRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 12,
  },
  countText: { fontSize: 13, fontWeight: '500' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  rowRef: { fontSize: 15, fontWeight: '600' },
  wordBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  wordBadgeText: { fontSize: 12, fontWeight: '600' },

  skeleton: { gap: 5, marginTop: 2 },
  skeletonLine: { height: 11, borderRadius: 6 },

  emptyCard: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 20, alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyBody: { fontSize: 13, lineHeight: 20, textAlign: 'center' },

  footerNote: {
    marginTop: 20, paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
