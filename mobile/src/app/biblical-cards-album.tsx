// Biblical Cards Album Screen
// Displays the user's biblical card collection in a beautiful grid.
// Tap a card to see details. Unowned cards show a "?" placeholder.
// Phase B visual upgrade: grid thumbnails use motif data; detail modal uses CollectibleCardVisual.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, X, Sparkles, BookOpen, Copy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { gamificationApi } from '@/lib/gamification-api';
import { BIBLICAL_CARDS, ALL_CARD_IDS, type BiblicalCard } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const COLS = 3;
const CARD_W = (SCREEN_W - 40 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W * 1.5;

export default function BiblicalCardsAlbumScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();
  const userId = user?.id ?? '';

  const [selectedCard, setSelectedCard] = useState<BiblicalCard | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: cardInventory = [], isLoading } = useQuery({
    queryKey: ['biblical-cards', userId],
    queryFn: () => gamificationApi.getBiblicalCards(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const getCardStatus = useCallback((cardId: string) => {
    const entry = cardInventory.find((c) => c.cardId === cardId);
    return {
      owned: entry?.owned ?? false,
      duplicates: entry?.duplicates ?? 0,
    };
  }, [cardInventory]);

  const ownedCount = cardInventory.filter((c) => c.owned).length;
  const totalCount = ALL_CARD_IDS.length;

  const openCard = (card: BiblicalCard) => {
    const { owned, duplicates } = getCardStatus(card.id);
    if (!owned) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCard(card);
    setSelectedDuplicates(duplicates);
    setShowDetailModal(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0E1A', '#111827', '#0A0E1A']}
        style={{ paddingTop: insets.top, paddingBottom: 0 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 12 }}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(20), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
              {language === 'es' ? 'Álbum Bíblico' : 'Biblical Album'}
            </Text>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
              {language === 'es' ? `${ownedCount} de ${totalCount} cartas` : `${ownedCount} of ${totalCount} cards`}
            </Text>
          </View>
          <BookOpen size={22} color="rgba(255,255,255,0.5)" />
        </View>

        {/* Progress bar */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
          <Animated.View
            entering={FadeIn.duration(800)}
            style={{
              width: `${totalCount > 0 ? (ownedCount / totalCount) * 100 : 0}%`,
              height: '100%',
              borderRadius: 99,
              backgroundColor: '#D4AF37',
            }}
          />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section header */}
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {language === 'es' ? 'Personajes y Objetos' : 'Characters & Objects'}
            </Text>
            <Text style={{ fontSize: sFont(12), color: colors.textMuted, marginTop: 4, lineHeight: 18 }}>
              {language === 'es'
                ? 'Abre Sobres Bíblicos en la Tienda para desbloquear cartas.'
                : 'Open Biblical Packs in the Store to unlock cards.'}
            </Text>
          </Animated.View>

          {/* Card Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
            {ALL_CARD_IDS.map((cardId, index) => {
              const card = BIBLICAL_CARDS[cardId];
              if (!card) return null;
              const { owned, duplicates } = getCardStatus(cardId);

              return (
                <Animated.View
                  key={cardId}
                  entering={ZoomIn.delay(index * 80).duration(350)}
                >
                  <Pressable
                    onPress={() => openCard(card)}
                    style={{ width: CARD_W, height: CARD_H }}
                  >
                    {owned ? (
                      // ── Owned card thumbnail ─────────────────────────
                      <LinearGradient
                        colors={[card.gradientColors[0], card.gradientColors[1], card.gradientColors[2]] as [string, string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          flex: 1,
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: card.accentColor + '80',
                          overflow: 'hidden',
                          shadowColor: card.accentColor,
                          shadowOpacity: 0.5,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 3 },
                          elevation: 8,
                        }}
                      >
                        {/* Foil shimmer */}
                        <LinearGradient
                          colors={[card.motif.sheenColors[0], 'transparent', card.motif.sheenColors[1]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ position: 'absolute', width: '100%', height: '100%' }}
                        />

                        {/* Top bar */}
                        <LinearGradient
                          colors={[card.accentColor + '55', card.accentColor + '18']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ backgroundColor: card.accentColor + '28', borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 0.5, borderColor: card.accentColor + '70' }}>
                            <Text style={{ fontSize: sFont(6.5), fontWeight: '900', color: card.accentColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                              {card.category}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 9, color: card.accentColor, opacity: 0.75 }}>{card.motif.cornerGlyph}</Text>
                        </LinearGradient>

                        {/* Thin gold rule */}
                        <View style={{ height: 0.5, backgroundColor: card.accentColor + '55' }} />

                        {/* Artwork area */}
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
                          {card.imageUrl ? (
                            <Image
                              source={{ uri: card.imageUrl }}
                              style={{
                                width: CARD_W * 0.55,
                                height: CARD_W * 0.55,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: card.accentColor + '50',
                              }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{
                              width: CARD_W * 0.5,
                              height: CARD_W * 0.5,
                              borderRadius: (CARD_W * 0.5) / 2,
                              backgroundColor: card.accentColor + '15',
                              borderWidth: 1.5,
                              borderColor: card.accentColor + '50',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Text style={{ fontSize: CARD_W * 0.22 }}>{card.motif.artEmoji}</Text>
                            </View>
                          )}
                        </View>

                        {/* Thin gold rule */}
                        <View style={{ height: 0.5, backgroundColor: card.accentColor + '55' }} />

                        {/* Footer */}
                        <LinearGradient
                          colors={[card.accentColor + '18', card.accentColor + '55']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ paddingHorizontal: 6, paddingVertical: 5, alignItems: 'center' }}
                        >
                          <Text style={{ fontSize: sFont(9.5), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.1 }} numberOfLines={1}>
                            {language === 'es' ? card.nameEs : card.nameEn}
                          </Text>
                          <Text style={{ fontSize: sFont(7), color: card.accentColor, fontWeight: '700', marginTop: 1 }}>
                            {card.verseRef}
                          </Text>
                        </LinearGradient>

                        {/* Duplicate badge */}
                        {duplicates > 0 && (
                          <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: card.accentColor, borderRadius: 99, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: sFont(8), fontWeight: '900', color: '#000' }}>×{duplicates + 1}</Text>
                          </View>
                        )}
                      </LinearGradient>
                    ) : (
                      // ── Unowned card placeholder ──────────────────────
                      <View style={{
                        flex: 1,
                        borderRadius: 14,
                        backgroundColor: colors.surface,
                        borderWidth: 1.5,
                        borderColor: colors.textMuted + '25',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderStyle: 'dashed',
                      }}>
                        <Text style={{ fontSize: CARD_W * 0.3, opacity: 0.2 }}>?</Text>
                        <Text style={{ fontSize: sFont(8), color: colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 4, opacity: 0.7 }}>
                          {language === 'es' ? 'No obtenida' : 'Not owned'}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Phase info box */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginTop: 32, padding: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.textMuted + '18' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={15} color={colors.primary} />
              <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.text }}>
                {language === 'es' ? 'Fase 1 — 3 cartas disponibles' : 'Phase 1 — 3 cards available'}
              </Text>
            </View>
            <Text style={{ fontSize: sFont(12), color: colors.textMuted, lineHeight: 18 }}>
              {language === 'es'
                ? 'Más cartas llegarán en futuras actualizaciones. Los duplicados podrán intercambiarse próximamente.'
                : 'More cards coming in future updates. Duplicates will be tradable soon.'}
            </Text>
          </Animated.View>
        </ScrollView>
      )}

      {/* Card Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="fade" onRequestClose={() => setShowDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            onPress={() => setShowDetailModal(false)}
            style={{ position: 'absolute', top: 56, right: 24, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 10 }}
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>

          {selectedCard && (
            <ScrollView
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={ZoomIn.duration(300)} style={{ width: '100%', maxWidth: 320, alignItems: 'center' }}>
                {/* Shared card visual (detail size) */}
                <CollectibleCardVisual
                  card={selectedCard}
                  language={language}
                  sFont={sFont}
                  size="detail"
                />

                <View style={{ marginTop: 24 }} />

                {/* Description */}
                <Text style={{ fontSize: sFont(15), color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 23, fontWeight: '500', marginBottom: 10 }}>
                  {language === 'es' ? selectedCard.descriptionEs : selectedCard.descriptionEn}
                </Text>

                {/* Verse text */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: selectedCard.accentColor, marginBottom: 8, alignSelf: 'stretch' }}>
                  <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.75)', lineHeight: 20, fontStyle: 'italic', textAlign: 'center' }}>
                    "{selectedCard.verseTextEs}"
                  </Text>
                </View>

                {selectedDuplicates > 0 && (
                  <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Copy size={13} color="rgba(255,255,255,0.4)" />
                    <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.4)' }}>
                      {language === 'es'
                        ? `${selectedDuplicates} duplicado${selectedDuplicates > 1 ? 's' : ''} — intercambiable próximamente`
                        : `${selectedDuplicates} duplicate${selectedDuplicates > 1 ? 's' : ''} — tradable soon`}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
