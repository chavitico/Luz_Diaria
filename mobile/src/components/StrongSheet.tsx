// StrongSheet — Bottom sheet showing Strong's Concordance entry details
// Opens when user taps an interactive word in Strong Mode.

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
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
} from 'lucide-react-native';
import type { StrongEntry } from '@/lib/strong/types';
import { parseVerseReference } from '@/lib/strong/service';
import type { useThemeColors } from '@/lib/store';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StrongSheetProps {
  visible: boolean;
  entry: StrongEntry | null;
  isFavorite: boolean;
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
  visible, entry, isFavorite, onToggleFavorite, onClose, onNavigateToVerse, onViewAppearances, colors, lang,
}: StrongSheetProps) {
  // ── Animation (Reanimated v3) ──────────────────────────────────────────────
  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200, mass: 0.8 });
    } else {
      translateY.value = withTiming(600, { duration: 260 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ── Preserve entry during close animation ─────────────────────────────────
  // lastEntryRef holds the last non-null entry so content stays visible
  // while the sheet slides out.
  const lastEntryRef = useRef<StrongEntry | null>(null);
  if (entry !== null) lastEntryRef.current = entry;
  const e = lastEntryRef.current;

  // ── Favorite — uses current entry from ref, not stale closure ─────────────
  const entryRef = useRef<StrongEntry | null>(null);
  entryRef.current = e;
  const handleFavorite = useCallback(() => {
    if (entryRef.current) onToggleFavorite(entryRef.current.id);
  }, [onToggleFavorite]);

  // ── i18n ──────────────────────────────────────────────────────────────────
  const isHebrew = e?.language === 'Hebrew';
  const accentColor = isHebrew ? '#7C3AED' : '#0369A1';

  const t = {
    language:       lang === 'es' ? 'Idioma'                   : 'Language',
    grammar:        lang === 'es' ? 'Categoría gram.'           : 'Grammar',
    longDef:        lang === 'es' ? 'Definición ampliada'       : 'Full definition',
    occurrences:    lang === 'es' ? 'Apariciones'               : 'Occurrences',
    relatedVerses:  lang === 'es' ? 'Versículos relacionados'   : 'Related verses',
    favorite:       lang === 'es' ? 'Guardar en favoritos'      : 'Save to favorites',
    unfavorite:     lang === 'es' ? 'Quitar de favoritos'       : 'Remove from favorites',
    allAppearances: lang === 'es' ? 'Ver todas las apariciones' : 'See all occurrences',
    timesLabel:     lang === 'es' ? 'veces en la Biblia'        : 'times in the Bible',
    hebreo:         lang === 'es' ? 'Hebreo'                   : 'Hebrew',
    griego:         lang === 'es' ? 'Griego'                   : 'Greek',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop — tap closes sheet */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        {/* Stop touches inside the sheet from closing it */}
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

            {/* Close button — absolute so it stays above content */}
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

            {/* Guard: show placeholder height until entry is available */}
            {!e ? (
              <View style={{ height: 80 }} />
            ) : (
              <>
                {/* ── Header ─────────────────────────────────────────────── */}
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
                  <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500', lineHeight: 20 }}>
                    {e.shortDefinition}
                  </Text>
                </View>

                {/* Divider */}
                <View style={{
                  height: 0.5,
                  backgroundColor: colors.textMuted + '22',
                  marginHorizontal: 20, marginBottom: 18,
                }} />

                {/* ── Scrollable body ─────────────────────────────────────── */}
                <ScrollView
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
                        {e.language}
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

                  {/* Occurrences */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: accentColor + '10',
                    borderRadius: 12, padding: 12, marginBottom: 20,
                    borderWidth: 1, borderColor: accentColor + '25',
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 10,
                      backgroundColor: accentColor + '20',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: accentColor }}>
                        {e.occurrencesCount > 999 ? '999+' : e.occurrencesCount}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <SectionLabel
                        icon={<List size={10} color={accentColor + 'BB'} />}
                        text={t.occurrences} color={accentColor + 'BB'}
                      />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: accentColor, marginTop: -2 }}>
                        {e.occurrencesCount.toLocaleString()} {t.timesLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Long definition */}
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

                  {/* Related verses */}
                  {e.relatedVerses.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <SectionLabel
                        icon={<BookOpen size={11} color={colors.textMuted} />}
                        text={t.relatedVerses} color={colors.textMuted}
                      />
                      <View style={{
                        backgroundColor: colors.background,
                        borderRadius: 12, overflow: 'hidden',
                        borderWidth: 1, borderColor: colors.textMuted + '20',
                      }}>
                        {e.relatedVerses.map((ref, idx) => (
                          <Pressable
                            key={ref}
                            onPress={() => {
                              console.log('[Strong] related verse tapped:', ref);
                              const parsed = parseVerseReference(ref);
                              if (parsed) {
                                console.log('[Strong] navigating to related verse →', parsed.bookId, parsed.chapter, parsed.verse);
                                onNavigateToVerse(parsed.bookId, parsed.chapter, parsed.verse);
                              }
                            }}
                            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
                          >
                            <View style={{
                              flexDirection: 'row', alignItems: 'center',
                              paddingHorizontal: 14, paddingVertical: 12,
                              borderBottomWidth: idx < e.relatedVerses.length - 1 ? 0.5 : 0,
                              borderBottomColor: colors.textMuted + '20',
                            }}>
                              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: accentColor }}>
                                {ref}
                              </Text>
                              <ChevronRight size={14} color={accentColor + '80'} />
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={{ gap: 10 }}>
                    {/* Favorite toggle */}
                    <Pressable
                      onPress={handleFavorite}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.75 : 1,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 8, paddingVertical: 14, borderRadius: 14,
                        backgroundColor: isFavorite ? accentColor : colors.textMuted + '18',
                      })}
                    >
                      <Star
                        size={16}
                        color={isFavorite ? '#fff' : colors.textMuted}
                        fill={isFavorite ? '#fff' : 'transparent'}
                        strokeWidth={2}
                      />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isFavorite ? '#fff' : colors.textMuted }}>
                        {isFavorite ? t.unfavorite : t.favorite}
                      </Text>
                    </Pressable>

                    {/* See all occurrences */}
                    <Pressable
                      onPress={() => entry && onViewAppearances(entry.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 8, paddingVertical: 14, borderRadius: 14,
                        backgroundColor: pressed
                          ? colors.primary + '20'
                          : colors.primary + '10',
                        borderWidth: 1,
                        borderColor: colors.primary + '30',
                      })}
                    >
                      <BookOpen size={15} color={colors.primary} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                        {t.allAppearances}
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
