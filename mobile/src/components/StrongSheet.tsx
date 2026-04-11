// StrongSheet — Bottom sheet showing Strong's Concordance entry details.
// Features:
//   • Internal navigation stack (back button when browsing related entries)
//   • Spanish definitions from SPANISH_LEXICON (fallback to English)
//   • Spanish gloss chips
//   • Related Strong entries (same Spanish gloss family)
//   • Pressable occurrences card → opens full appearances list
//   • Verse preview (first 4 appearances)
//   • Favorite toggle

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  X,
  Star,
  BookOpen,
  Globe,
  Tag,
  AlignLeft,
  List,
  ChevronRight,
  Languages,
  ArrowLeft,
} from 'lucide-react-native';
import type { StrongEntry, VerseAppearance } from '@/lib/strong/types';
import { strongRepository } from '@/lib/strong/repository';
import { getSpanishGlosses, SPANISH_GLOSS_INDEX } from '@/lib/strong/spanishIndex';
import { getSpanishShortDef } from '@/lib/strong/spanishLexicon';
import { BIBLE_BOOKS } from '@/lib/bible/books';
import type { useThemeColors } from '@/lib/store';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StrongSheetProps {
  visible: boolean;
  entry: StrongEntry | null;
  /** Returns true if the given Strong ID is saved as a favorite */
  isFavoriteOf: (strongId: string) => boolean;
  onToggleFavorite: (strongId: string) => void;
  onClose: () => void;
  onNavigateToVerse: (bookId: string, chapter: number, verse: number) => void;
  onViewAppearances: (strongId: string) => void;
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ icon, text, color }: {
  icon: React.ReactNode; text: string; color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {icon}
      <Text style={{
        fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: 1.1, color,
      }}>
        {text}
      </Text>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StrongSheet({
  visible, entry, isFavoriteOf, onToggleFavorite, onClose,
  onNavigateToVerse, onViewAppearances, colors, lang,
}: StrongSheetProps) {

  // ── Animation ────────────────────────────────────────────────────────────
  const translateY = useSharedValue(600);
  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 18, stiffness: 200, mass: 0.8 })
      : withTiming(600, { duration: 260 });
  }, [visible]);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ── Preserve entry during close animation ─────────────────────────────
  const lastEntryRef = useRef<StrongEntry | null>(null);
  if (entry !== null) lastEntryRef.current = entry;
  const baseEntry = lastEntryRef.current;

  // ── Internal navigation stack ─────────────────────────────────────────
  const [entryStack, setEntryStack] = useState<StrongEntry[]>([]);

  // Reset stack when a new external entry arrives
  useEffect(() => {
    setEntryStack([]);
  }, [entry?.id]);

  // Clear stack after close animation completes
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setEntryStack([]), 350);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Currently displayed entry = top of stack or the external prop entry
  const e = entryStack.length > 0 ? entryStack[entryStack.length - 1] : baseEntry;
  const canGoBack = entryStack.length > 0;

  const pushEntry = useCallback((strongId: string) => {
    const found = strongRepository.getEntryById(strongId);
    if (found) setEntryStack(prev => [...prev, found]);
  }, []);

  const popEntry = useCallback(() => {
    setEntryStack(prev => prev.slice(0, -1));
  }, []);

  // ── ScrollView reset when entry changes ──────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [e?.id]);

  // ── Dynamic verse appearances ─────────────────────────────────────────
  const [previewAppearances, setPreviewAppearances] = useState<VerseAppearance[]>([]);
  const [appearancesLoading, setAppearancesLoading] = useState(false);
  const [realOccurrencesCount, setRealOccurrencesCount] = useState<number | null>(null);

  useEffect(() => {
    const id = e?.id;
    if (!id) return;
    setPreviewAppearances([]);
    setRealOccurrencesCount(null);
    setAppearancesLoading(true);
    const timer = setTimeout(() => {
      const all = strongRepository.getVerseAppearances(id);
      const seen = new Set<string>();
      const deduped = all.filter(a => {
        if (seen.has(a.verseId)) return false;
        seen.add(a.verseId);
        return true;
      });
      setRealOccurrencesCount(deduped.length);
      setPreviewAppearances(deduped.slice(0, 4));
      setAppearancesLoading(false);
    }, 80);
    return () => clearTimeout(timer);
  }, [e?.id]);

  // ── Related Strong entries (same Spanish gloss family) ────────────────
  const relatedIds = useMemo((): string[] => {
    if (!e) return [];
    const glosses = getSpanishGlosses(e.id);
    const ids = new Set<string>();
    for (const gloss of glosses) {
      for (const id of (SPANISH_GLOSS_INDEX[gloss] ?? [])) {
        if (id !== e.id) ids.add(id);
      }
    }
    return Array.from(ids).slice(0, 8);
  }, [e?.id]);

  // ── Favorite (reads from isFavoriteOf for the current displayed entry) ─
  const entryRef = useRef<StrongEntry | null>(null);
  entryRef.current = e;
  const handleFavorite = useCallback(() => {
    if (entryRef.current) onToggleFavorite(entryRef.current.id);
  }, [onToggleFavorite]);

  // ── Derived display values ────────────────────────────────────────────
  const isHebrew = e?.language === 'Hebrew';
  const accentColor = isHebrew ? '#7C3AED' : '#0369A1';
  const spanishShort = e ? getSpanishShortDef(e.id) : null;
  const glosses = e ? getSpanishGlosses(e.id) : [];
  const isCurrentFavorite = e ? isFavoriteOf(e.id) : false;

  // ── i18n labels ───────────────────────────────────────────────────────
  const t = {
    language:  lang === 'es' ? 'Idioma'           : 'Language',
    grammar:   lang === 'es' ? 'Categoría gram.'  : 'Grammar',
    longDef:   lang === 'es' ? 'Definición'       : 'Definition',
    occurrences: lang === 'es' ? 'Apariciones'    : 'Occurrences',
    favorite:  lang === 'es' ? 'Guardar en favoritos' : 'Save to favorites',
    unfavorite:lang === 'es' ? 'Quitar de favoritos'  : 'Remove from favorites',
    timesLabel:lang === 'es' ? 'versículos cubiertos'  : 'covered verses',
    hebreo:    lang === 'es' ? 'Hebreo'           : 'Hebrew',
    griego:    lang === 'es' ? 'Griego'           : 'Greek',
    related:   lang === 'es' ? 'Palabras relacionadas' : 'Related entries',
    appearances: lang === 'es' ? 'Apariciones en la Biblia' : 'Bible appearances',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <Animated.View
            style={[
              sheetStyle,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: '88%',
                overflow: 'hidden',
                paddingBottom: Platform.OS === 'ios' ? 36 : 24,
              },
            ]}
          >
            {/* Drag handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.textMuted + '50',
              alignSelf: 'center', marginTop: 10, marginBottom: 4,
            }} />

            {/* Back button — absolute top-left, only when navigating internally */}
            {canGoBack && (
              <Pressable
                onPress={popEntry}
                hitSlop={12}
                style={({ pressed }) => ({
                  position: 'absolute', top: 12, left: 14, zIndex: 10,
                  opacity: pressed ? 0.6 : 1,
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: accentColor + '15',
                })}
              >
                <ArrowLeft size={14} color={accentColor} strokeWidth={2.5} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>
                  Atrás
                </Text>
              </Pressable>
            )}

            {/* Close button — absolute top-right */}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => ({
                position: 'absolute', top: 14, right: 16, zIndex: 10,
                opacity: pressed ? 0.6 : 1,
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: colors.textMuted + '22',
                alignItems: 'center', justifyContent: 'center',
              })}
            >
              <X size={15} color={colors.textMuted} />
            </Pressable>

            {/* Guard */}
            {!e ? (
              <View style={{ height: 80 }} />
            ) : (
              <>
                {/* ── Header ───────────────────────────────────────────── */}
                <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18 }}>
                  {/* Strong ID + language chip */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: accentColor + '18',
                      borderWidth: 1, borderColor: accentColor + '35',
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: accentColor, letterSpacing: 0.5 }}>
                        {e.id}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 3,
                      borderRadius: 6, backgroundColor: colors.textMuted + '18',
                    }}>
                      <Text style={{
                        fontSize: 10, fontWeight: '700', color: colors.textMuted,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                      }}>
                        {isHebrew ? t.hebreo : t.griego}
                      </Text>
                    </View>
                  </View>

                  {/* Original word */}
                  <Text style={{
                    fontSize: 34, fontWeight: '800', color: colors.text,
                    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                    marginBottom: 4,
                    textAlign: isHebrew ? 'right' : 'left',
                  }}>
                    {e.lemmaOriginal}
                  </Text>
                  <Text style={{
                    fontSize: 17, color: accentColor, fontWeight: '600',
                    fontStyle: 'italic', marginBottom: 4,
                  }}>
                    {e.transliteration}
                  </Text>

                  {/* Definition: Spanish (primary) or English (fallback) */}
                  <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500', lineHeight: 20 }}>
                    {spanishShort ?? e.shortDefinition}
                  </Text>
                </View>

                {/* Divider */}
                <View style={{
                  height: 0.5, backgroundColor: colors.textMuted + '22',
                  marginHorizontal: 20, marginBottom: 18,
                }} />

                {/* ── Scrollable body ──────────────────────────────────── */}
                <ScrollView
                  ref={scrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 16 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Language + Grammar row */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    <View style={{
                      flex: 1, backgroundColor: colors.background,
                      borderRadius: 12, padding: 12,
                      borderWidth: 1, borderColor: colors.textMuted + '20',
                    }}>
                      <SectionLabel
                        icon={<Globe size={11} color={colors.textMuted} />}
                        text={t.language} color={colors.textMuted}
                      />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                        {isHebrew ? t.hebreo : t.griego}
                      </Text>
                    </View>
                    <View style={{
                      flex: 1, backgroundColor: colors.background,
                      borderRadius: 12, padding: 12,
                      borderWidth: 1, borderColor: colors.textMuted + '20',
                    }}>
                      <SectionLabel
                        icon={<Tag size={11} color={colors.textMuted} />}
                        text={t.grammar} color={colors.textMuted}
                      />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={2}>
                        {e.grammarCategory}
                      </Text>
                    </View>
                  </View>

                  {/* ── Occurrences card — PRESSABLE → opens full list ── */}
                  <Pressable
                    onPress={() => e && onViewAppearances(e.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      backgroundColor: pressed ? accentColor + '18' : accentColor + '10',
                      borderRadius: 12, padding: 12, marginBottom: 20,
                      borderWidth: 1, borderColor: accentColor + '30',
                    })}
                  >
                    {/* Count circle */}
                    <View style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: accentColor + '20',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {appearancesLoading ? (
                        <ActivityIndicator size="small" color={accentColor} />
                      ) : (
                        <Text style={{ fontSize: 15, fontWeight: '800', color: accentColor }}>
                          {realOccurrencesCount !== null
                            ? (realOccurrencesCount > 999 ? '999+' : String(realOccurrencesCount))
                            : '—'}
                        </Text>
                      )}
                    </View>

                    {/* Label */}
                    <View style={{ flex: 1 }}>
                      <SectionLabel
                        icon={<List size={10} color={accentColor + 'BB'} />}
                        text={t.occurrences} color={accentColor + 'BB'}
                      />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: accentColor, marginTop: -2 }}>
                        {realOccurrencesCount !== null
                          ? `${realOccurrencesCount.toLocaleString()} ${t.timesLabel}`
                          : t.timesLabel}
                      </Text>
                    </View>

                    {/* Arrow — signals interactivity */}
                    <ChevronRight size={16} color={accentColor} strokeWidth={2} />
                  </Pressable>

                  {/* ── Spanish gloss chips ───────────────────────────── */}
                  {glosses.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <SectionLabel
                        icon={<Languages size={11} color={colors.textMuted} />}
                        text="Significado en español" color={colors.textMuted}
                      />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {glosses.map(g => (
                          <View
                            key={g}
                            style={{
                              paddingHorizontal: 12, paddingVertical: 5,
                              borderRadius: 20, borderWidth: 1,
                              backgroundColor: accentColor + '12',
                              borderColor: accentColor + '30',
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '600', color: accentColor }}>
                              {g.charAt(0).toUpperCase() + g.slice(1)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* ── Long definition ───────────────────────────────── */}
                  <View style={{ marginBottom: 20 }}>
                    <SectionLabel
                      icon={<AlignLeft size={11} color={colors.textMuted} />}
                      text={t.longDef} color={colors.textMuted}
                    />
                    <Text style={{
                      fontSize: 15, lineHeight: 24, color: colors.text,
                      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                    }}>
                      {e.longDefinition}
                    </Text>
                  </View>

                  {/* ── Verse appearances preview ────────────────────── */}
                  {(appearancesLoading || previewAppearances.length > 0) && (
                    <View style={{ marginBottom: 20 }}>
                      <SectionLabel
                        icon={<BookOpen size={11} color={colors.textMuted} />}
                        text={t.appearances} color={colors.textMuted}
                      />
                      {appearancesLoading ? (
                        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                          <ActivityIndicator size="small" color={colors.textMuted} />
                        </View>
                      ) : (
                        <View style={{
                          backgroundColor: colors.background,
                          borderRadius: 12, overflow: 'hidden',
                          borderWidth: 1, borderColor: colors.textMuted + '20',
                        }}>
                          {previewAppearances.map((a, idx) => {
                            const bookName = BIBLE_BOOKS.find(b => b.id === a.bookId)?.name ?? a.bookId;
                            const ref = `${bookName} ${a.chapter}:${a.verse}`;
                            return (
                              <Pressable
                                key={a.verseId}
                                onPress={() => onNavigateToVerse(a.bookId, a.chapter, a.verse)}
                                style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
                              >
                                <View style={{
                                  flexDirection: 'row', alignItems: 'center',
                                  paddingHorizontal: 14, paddingVertical: 11,
                                  borderBottomWidth: idx < previewAppearances.length - 1 ? 0.5 : 0,
                                  borderBottomColor: colors.textMuted + '20',
                                }}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>
                                      {ref}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                                      {a.displayedWord.replace(/[.,;:!?()]/g, '')}
                                    </Text>
                                  </View>
                                  <ChevronRight size={14} color={accentColor + '80'} />
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── Related Strong entries (same gloss family) ────── */}
                  {relatedIds.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <SectionLabel
                        icon={<Languages size={11} color={colors.textMuted} />}
                        text={t.related} color={colors.textMuted}
                      />
                      <View style={{
                        backgroundColor: colors.background,
                        borderRadius: 12, overflow: 'hidden',
                        borderWidth: 1, borderColor: colors.textMuted + '20',
                      }}>
                        {relatedIds.map((relId, idx) => {
                          const rel = strongRepository.getEntryById(relId);
                          if (!rel) return null;
                          const relIsHebrew = rel.language === 'Hebrew';
                          const relColor = relIsHebrew ? '#7C3AED' : '#0369A1';
                          const relSpanish = getSpanishShortDef(relId)?.split(',')[0].trim() ?? null;
                          return (
                            <Pressable
                              key={relId}
                              onPress={() => pushEntry(relId)}
                              style={({ pressed }) => ({
                                opacity: pressed ? 0.6 : 1,
                              })}
                            >
                              <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                paddingHorizontal: 14, paddingVertical: 12,
                                borderBottomWidth: idx < relatedIds.length - 1 ? 0.5 : 0,
                                borderBottomColor: colors.textMuted + '20',
                                gap: 10,
                              }}>
                                {/* ID badge */}
                                <View style={{
                                  paddingHorizontal: 8, paddingVertical: 3,
                                  borderRadius: 6,
                                  backgroundColor: relColor + '15',
                                }}>
                                  <Text style={{ fontSize: 12, fontWeight: '800', color: relColor }}>
                                    {relId}
                                  </Text>
                                </View>

                                {/* Original word + Spanish gloss */}
                                <View style={{ flex: 1 }}>
                                  <Text style={{
                                    fontSize: 15, fontWeight: '700', color: colors.text,
                                    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                                  }} numberOfLines={1}>
                                    {rel.lemmaOriginal}
                                  </Text>
                                  {relSpanish && (
                                    <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
                                      {relSpanish}
                                    </Text>
                                  )}
                                </View>

                                <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* ── Favorite button ───────────────────────────────── */}
                  <Pressable
                    onPress={handleFavorite}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.75 : 1,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, paddingVertical: 14, borderRadius: 14,
                      backgroundColor: isCurrentFavorite ? accentColor : colors.textMuted + '18',
                    })}
                  >
                    <Star
                      size={16}
                      color={isCurrentFavorite ? '#fff' : colors.textMuted}
                      fill={isCurrentFavorite ? '#fff' : 'transparent'}
                      strokeWidth={2}
                    />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isCurrentFavorite ? '#fff' : colors.textMuted }}>
                      {isCurrentFavorite ? t.unfavorite : t.favorite}
                    </Text>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
