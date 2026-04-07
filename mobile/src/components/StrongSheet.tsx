// StrongSheet — Bottom sheet showing Strong's Concordance entry details
// Opens when user taps an interactive word in Strong Mode.
//
// Design principles:
//  - Clean, study-focused layout with clear hierarchy
//  - Header: Strong ID chip + original lemma + transliteration
//  - Body: definition blocks, grammar info, related verses
//  - Footer: favorite toggle + "See all occurrences" (placeholder)

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
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
import type { useThemeColors } from '@/lib/store';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StrongSheetProps {
  visible: boolean;
  entry: StrongEntry | null;
  isFavorite: boolean;
  onToggleFavorite: (strongId: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ icon, text, color }: {
  icon: React.ReactNode;
  text: string;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {icon}
      <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1, color }}>
        {text}
      </Text>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StrongSheet({
  visible, entry, isFavorite, onToggleFavorite, onClose, colors, lang,
}: StrongSheetProps) {
  const slideAnim = useRef(new RNAnimated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      RNAnimated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleFavorite = useCallback(() => {
    if (entry) onToggleFavorite(entry.id);
  }, [entry, onToggleFavorite]);

  if (!entry) return null;

  const isHebrew = entry.language === 'Hebrew';
  const accentColor = isHebrew ? '#7C3AED' : '#0369A1'; // purple for OT, blue for NT

  const i = {
    language:       lang === 'es' ? 'Idioma'           : 'Language',
    grammar:        lang === 'es' ? 'Categoría gram.'  : 'Grammar',
    shortDef:       lang === 'es' ? 'Definición corta' : 'Short definition',
    longDef:        lang === 'es' ? 'Definición ampliada' : 'Full definition',
    occurrences:    lang === 'es' ? 'Apariciones'      : 'Occurrences',
    relatedVerses:  lang === 'es' ? 'Versículos relacionados' : 'Related verses',
    favorite:       lang === 'es' ? 'Guardar en favoritos'    : 'Save to favorites',
    unfavorite:     lang === 'es' ? 'Quitar de favoritos'     : 'Remove from favorites',
    allAppearances: lang === 'es' ? 'Ver todas las apariciones' : 'See all occurrences',
    timesLabel:     lang === 'es' ? 'veces en la Biblia' : 'times in the Bible',
    comingSoon:     lang === 'es' ? 'Próximamente'       : 'Coming soon',
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
        {/* Sheet — stop propagation so tapping inside doesn't close */}
        <Pressable onPress={() => {}}>
          <RNAnimated.View
            style={{
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '85%',
              paddingBottom: Platform.OS === 'ios' ? 36 : 24,
            }}
          >
            {/* Drag handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.textMuted + '50',
              alignSelf: 'center', marginTop: 10, marginBottom: 4,
            }} />

            {/* Close button */}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => ({
                position: 'absolute', top: 14, right: 16,
                opacity: pressed ? 0.6 : 1,
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: colors.textMuted + '22',
                alignItems: 'center', justifyContent: 'center',
              })}
            >
              <X size={15} color={colors.textMuted} />
            </Pressable>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18 }}>
              {/* Strong ID + testament chip */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 8, backgroundColor: accentColor + '18',
                  borderWidth: 1, borderColor: accentColor + '35',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: accentColor, letterSpacing: 0.5 }}>
                    {entry.id}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 6, backgroundColor: colors.textMuted + '18',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {isHebrew ? 'Hebreo' : 'Griego'}
                  </Text>
                </View>
              </View>

              {/* Lemma + transliteration */}
              <Text style={{
                fontSize: 32, fontWeight: '800',
                color: colors.text,
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                marginBottom: 4,
                // RTL for Hebrew
                writingDirection: isHebrew ? 'rtl' : 'ltr',
              }}>
                {entry.lemmaOriginal}
              </Text>
              <Text style={{
                fontSize: 17, color: accentColor, fontWeight: '600',
                fontStyle: 'italic', marginBottom: 2,
              }}>
                {entry.transliteration}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500' }}>
                {entry.shortDefinition}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: colors.textMuted + '22', marginHorizontal: 20, marginBottom: 18 }} />

            {/* ── Body (scrollable) ──────────────────────────────────────────── */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 12 }}
            >
              {/* Info row: language + grammar */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{
                  flex: 1, backgroundColor: colors.background,
                  borderRadius: 12, padding: 12,
                  borderWidth: 1, borderColor: colors.textMuted + '20',
                }}>
                  <SectionLabel
                    icon={<Globe size={11} color={colors.textMuted} />}
                    text={i.language}
                    color={colors.textMuted}
                  />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    {entry.language}
                  </Text>
                </View>

                <View style={{
                  flex: 1, backgroundColor: colors.background,
                  borderRadius: 12, padding: 12,
                  borderWidth: 1, borderColor: colors.textMuted + '20',
                }}>
                  <SectionLabel
                    icon={<Tag size={11} color={colors.textMuted} />}
                    text={i.grammar}
                    color={colors.textMuted}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={2}>
                    {entry.grammarCategory}
                  </Text>
                </View>
              </View>

              {/* Occurrences pill */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: accentColor + '10',
                borderRadius: 12, padding: 12, marginBottom: 20,
                borderWidth: 1, borderColor: accentColor + '25',
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: accentColor + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: accentColor }}>
                    {entry.occurrencesCount > 999 ? '999+' : entry.occurrencesCount}
                  </Text>
                </View>
                <View>
                  <SectionLabel
                    icon={<List size={10} color={accentColor + 'AA'} />}
                    text={i.occurrences}
                    color={accentColor + 'AA'}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: accentColor, marginTop: -2 }}>
                    {entry.occurrencesCount.toLocaleString()} {i.timesLabel}
                  </Text>
                </View>
              </View>

              {/* Long definition */}
              <View style={{ marginBottom: 20 }}>
                <SectionLabel
                  icon={<AlignLeft size={11} color={colors.textMuted} />}
                  text={i.longDef}
                  color={colors.textMuted}
                />
                <Text style={{
                  fontSize: 15, lineHeight: 24, color: colors.text,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                }}>
                  {entry.longDefinition}
                </Text>
              </View>

              {/* Related verses */}
              {entry.relatedVerses.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel
                    icon={<BookOpen size={11} color={colors.textMuted} />}
                    text={i.relatedVerses}
                    color={colors.textMuted}
                  />
                  <View style={{
                    backgroundColor: colors.background,
                    borderRadius: 12, overflow: 'hidden',
                    borderWidth: 1, borderColor: colors.textMuted + '20',
                  }}>
                    {entry.relatedVerses.map((ref, idx) => (
                      <View
                        key={ref}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 14, paddingVertical: 11,
                          borderBottomWidth: idx < entry.relatedVerses.length - 1 ? 0.5 : 0,
                          borderBottomColor: colors.textMuted + '20',
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: accentColor }}>
                          {ref}
                        </Text>
                        <ChevronRight size={13} color={colors.textMuted} />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Action buttons ────────────────────────────────────────── */}
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
                  <Text style={{
                    fontSize: 14, fontWeight: '700',
                    color: isFavorite ? '#fff' : colors.textMuted,
                  }}>
                    {isFavorite ? i.unfavorite : i.favorite}
                  </Text>
                </Pressable>

                {/* See all occurrences (placeholder) */}
                {/* TODO: Enable when "all appearances" feature is built */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.textMuted + '10',
                  borderWidth: 1, borderColor: colors.textMuted + '20',
                }}>
                  <BookOpen size={15} color={colors.textMuted + '80'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted + '80' }}>
                    {i.allAppearances}
                  </Text>
                  <View style={{
                    backgroundColor: colors.primary + '20', borderRadius: 4,
                    paddingHorizontal: 5, paddingVertical: 1,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 0.4 }}>
                      {i.comingSoon}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </RNAnimated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
