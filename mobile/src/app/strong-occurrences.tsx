// strong-occurrences.tsx
// Full-screen list of verse appearances for a single Strong entry.
// Route: /strong-occurrences?strongId=H7225
// Tapping a verse navigates to the Bible tab at that exact location.

import React, { useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Info } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { strongRepository } from '@/lib/strong/repository';
import { setStrongNavTarget } from '@/lib/strong/navigationBridge';
import { BIBLE_BOOKS } from '@/lib/bible/books';
import type { VerseAppearance } from '@/lib/strong/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bookName(bookId: string): string {
  return BIBLE_BOOKS.find(b => b.id === bookId)?.name ?? bookId;
}

function verseRef(a: VerseAppearance): string {
  return `${bookName(a.bookId)} ${a.chapter}:${a.verse}`;
}

// Deduplicate by verseId so the same verse only shows once even if it has
// multiple links to the same Strong ID (e.g. G3056 appears 3× in JHN_1_1).
function deduplicateByVerse(list: VerseAppearance[]): VerseAppearance[] {
  const seen = new Set<string>();
  return list.filter(a => {
    if (seen.has(a.verseId)) return false;
    seen.add(a.verseId);
    return true;
  });
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function AppearanceRow({
  appearance,
  onPress,
  colors,
}: {
  appearance: VerseAppearance;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
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
      <View style={styles.rowLeft}>
        <Text style={[styles.rowRef, { color: colors.text }]}>
          {verseRef(appearance)}
        </Text>
        <View style={[styles.wordBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.wordBadgeText, { color: colors.primary }]}>
            {appearance.displayedWord.replace(/[.,;:!?()]/g, '')}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* List */}
        {appearances.length > 0 ? (
          <View style={styles.list}>
            {appearances.map((a) => (
              <AppearanceRow
                key={a.verseId}
                appearance={a}
                onPress={() => handleVersePress(a)}
                colors={colors}
              />
            ))}
          </View>
        ) : (
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

        {/* Footer note */}
        {appearances.length > 0 && (
          <View style={[styles.footerNote, { borderColor: colors.textMuted + '30' }]}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Cobertura: AT (Gn · Éx · Lv · Nm · Dt · Jos · Sal · Pro · Is · Jr · Ez · Dn) ·
              NT (Mt · Mr · Lc · Jn · Hch · Ro · 1Co · 2Co · Gá · Ef · Flp · Col · Heb · 1Jn · Ap){'\n'}
              Toca cualquier versículo para abrirlo en el lector bíblico.
            </Text>
          </View>
        )}
      </ScrollView>
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

  list: { gap: 8 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowLeft: { flex: 1, gap: 6 },
  rowRef: { fontSize: 15, fontWeight: '600' },
  wordBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  wordBadgeText: { fontSize: 13, fontWeight: '600' },

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
