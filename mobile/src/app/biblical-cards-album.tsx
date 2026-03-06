// Biblical Cards Album Screen
// Phase C: 6 cards, richer detail modal with dato destacado + significado bíblico,
// category identity chips, premium card grid thumbnails.

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
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, X, Sparkles, BookOpen, Copy, Star } from 'lucide-react-native';
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

// Category identity colors (same as CardRevealModal)
const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Personajes: { bg: 'rgba(212,175,55,0.20)', border: 'rgba(212,175,55,0.55)', text: '#D4AF37' },
  Objetos:    { bg: 'rgba(168,200,240,0.16)', border: 'rgba(168,200,240,0.50)', text: '#A8C8F0' },
  Eventos:    { bg: 'rgba(255,122,42,0.16)', border: 'rgba(255,122,42,0.50)', text: '#FF7A2A' },
};

// ─────────────────────────────────────────────
// Focal-point thumbnail artwork
// Mirrors the same crop logic as CollectibleCardVisual (CardRevealModal).
// Must be a proper component so it can use hooks.
// ─────────────────────────────────────────────
function CardThumbnailArtwork({ card }: { card: BiblicalCard }) {
  const focusX = card.imageFocusX ?? 0.5;
  const focusY = card.imageFocusY ?? 0.5;
  const [containerH, setContainerH] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  const OVERSIZE = 1.6;
  const oversizeH = containerH > 0 ? containerH * OVERSIZE : 0;
  const translateY = containerH > 0 ? (0.5 - focusY) * (oversizeH - containerH) : 0;
  const oversizeW = CARD_W * OVERSIZE;
  const translateX = (0.5 - focusX) * (oversizeW - CARD_W);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
      <Image
        source={{ uri: card.imageUrl }}
        style={{
          position: 'absolute',
          width: oversizeW,
          height: oversizeH > 0 ? oversizeH : undefined,
          ...(oversizeH === 0 ? { top: 0, bottom: 0 } : {
            top: (containerH - oversizeH) / 2 + translateY,
          }),
          left: (CARD_W - oversizeW) / 2 + translateX,
        }}
        resizeMode={oversizeH === 0 ? 'cover' : 'stretch'}
      />
      {/* Bottom vignette */}
      <LinearGradient
        colors={['transparent', card.gradientColors[2] + 'CC']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30 }}
      />
      {/* Top vignette */}
      <LinearGradient
        colors={[card.gradientColors[0] + 'AA', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18 }}
      />
    </View>
  );
}

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
    <View style={{ flex: 1, backgroundColor: '#080C18' }}>
      {/* Header */}
      <LinearGradient
        colors={['#080C18', '#0D1224', '#080C18']}
        style={{ paddingTop: insets.top, paddingBottom: 0 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', marginRight: 12 }}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(20), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
              {language === 'es' ? 'Álbum Bíblico' : 'Biblical Album'}
            </Text>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.50)', marginTop: 1 }}>
              {language === 'es' ? `${ownedCount} de ${totalCount} cartas` : `${ownedCount} of ${totalCount} cards`}
            </Text>
          </View>
          <BookOpen size={22} color="rgba(255,255,255,0.45)" />
        </View>

        {/* Progress bar */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
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

      {/* Separator */}
      <View style={{ height: 1, backgroundColor: 'rgba(212,175,55,0.15)' }} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#D4AF37" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section header */}
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
              {language === 'es' ? 'Colección' : 'Collection'}
            </Text>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 18 }}>
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
              const catStyle = CATEGORY_STYLES[card.category] ?? CATEGORY_STYLES['Objetos'];

              return (
                <Animated.View
                  key={cardId}
                  entering={ZoomIn.delay(index * 70).duration(340)}
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
                          borderWidth: 1.5,
                          borderColor: card.accentColor + '88',
                          overflow: 'hidden',
                          shadowColor: card.accentColor,
                          shadowOpacity: 0.55,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 3 },
                          elevation: 10,
                        }}
                      >
                        {/* Foil shimmer */}
                        <LinearGradient
                          colors={[card.motif.sheenColors[0], 'transparent', card.motif.sheenColors[1]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ position: 'absolute', width: '100%', height: '100%' }}
                        />
                        {/* Diagonal gloss */}
                        <LinearGradient
                          colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
                          start={{ x: 0, y: 0.2 }}
                          end={{ x: 1, y: 0.8 }}
                          style={{ position: 'absolute', width: '100%', height: '100%' }}
                        />
                        {/* Top accent line */}
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: card.accentColor }} />
                        {/* Bottom accent line */}
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: card.accentColor }} />

                        {/* Top bar */}
                        <LinearGradient
                          colors={[card.accentColor + '60', card.accentColor + '1A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingHorizontal: 5,
                            paddingVertical: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ backgroundColor: catStyle.bg, borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 0.5, borderColor: catStyle.border }}>
                            <Text style={{ fontSize: sFont(5.5), fontWeight: '900', color: catStyle.text, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                              {card.category}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 9, color: card.accentColor, opacity: 0.8 }}>{card.motif.cornerGlyph}</Text>
                        </LinearGradient>

                        {/* Gold rule */}
                        <View style={{ height: 0.5, backgroundColor: card.accentColor + '60' }} />

                        {/* Artwork area */}
                        {card.imageUrl ? (
                          /* Full-bleed illustration with focal-point crop */
                          <CardThumbnailArtwork card={card} />
                        ) : (
                          /* Icon fallback */
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
                            {/* Radial glow */}
                            <View style={{
                              position: 'absolute',
                              width: CARD_W * 0.65,
                              height: CARD_W * 0.65,
                              borderRadius: CARD_W * 0.325,
                              backgroundColor: card.accentColor + '0E',
                            }} />
                            <View style={{
                              width: CARD_W * 0.50,
                              height: CARD_W * 0.50,
                              borderRadius: (CARD_W * 0.50) / 2,
                              backgroundColor: card.accentColor + '15',
                              borderWidth: 2,
                              borderColor: card.accentColor + '55',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: card.accentColor,
                              shadowOpacity: 0.4,
                              shadowRadius: 8,
                              shadowOffset: { width: 0, height: 0 },
                            }}>
                              <Text style={{ fontSize: CARD_W * 0.22 }}>{card.motif.artEmoji}</Text>
                            </View>
                          </View>
                        )}

                        {/* Gold rule */}
                        <View style={{ height: 0.5, backgroundColor: card.accentColor + '60' }} />

                        {/* Footer */}
                        <LinearGradient
                          colors={[card.accentColor + '1A', card.accentColor + '60']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ paddingHorizontal: 6, paddingVertical: 5, alignItems: 'center' }}
                        >
                          <Text style={{ fontSize: sFont(9), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.1 }} numberOfLines={1}>
                            {language === 'es' ? card.nameEs : card.nameEn}
                          </Text>
                          <Text style={{ fontSize: sFont(6.5), color: card.accentColor, fontWeight: '700', marginTop: 1 }}>
                            {card.verseRef}
                          </Text>
                        </LinearGradient>

                        {/* Duplicate badge */}
                        {duplicates > 0 && (
                          <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: card.accentColor, borderRadius: 99, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: sFont(7.5), fontWeight: '900', color: '#000' }}>×{duplicates + 1}</Text>
                          </View>
                        )}
                      </LinearGradient>
                    ) : (
                      // ── Unowned placeholder ──────────────────────────
                      <View style={{
                        flex: 1,
                        borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.10)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderStyle: 'dashed',
                      }}>
                        <Text style={{ fontSize: CARD_W * 0.3, opacity: 0.15 }}>?</Text>
                        <Text style={{ fontSize: sFont(7.5), color: 'rgba(255,255,255,0.30)', marginTop: 6, textAlign: 'center', paddingHorizontal: 4 }}>
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
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginTop: 28, padding: 16, borderRadius: 16, backgroundColor: 'rgba(212,175,55,0.07)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={14} color="#D4AF37" />
              <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#D4AF37' }}>
                {language === 'es' ? 'Fase 1 — 6 cartas disponibles' : 'Phase 1 — 6 cards available'}
              </Text>
            </View>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.50)', lineHeight: 18 }}>
              {language === 'es'
                ? 'Más cartas llegarán en futuras actualizaciones. Los duplicados podrán intercambiarse próximamente.'
                : 'More cards coming in future updates. Duplicates will be tradable soon.'}
            </Text>
          </Animated.View>
        </ScrollView>
      )}

      {/* Card Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="fade" onRequestClose={() => setShowDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' }}>
          {/* Ambient glow */}
          {selectedCard && (
            <View style={{
              position: 'absolute',
              top: '15%',
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: selectedCard.accentColor + '08',
              alignSelf: 'center',
            }} />
          )}

          <Pressable
            onPress={() => setShowDetailModal(false)}
            style={{ position: 'absolute', top: 56, right: 24, padding: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', zIndex: 10 }}
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>

          {selectedCard && (
            <ScrollView
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={ZoomIn.duration(300)} style={{ width: '100%', maxWidth: 340, alignItems: 'center' }}>
                {/* Card visual */}
                <CollectibleCardVisual
                  card={selectedCard}
                  language={language}
                  sFont={sFont}
                  size="detail"
                />

                <View style={{ marginTop: 28, width: '100%' }}>
                  {/* Name */}
                  <Text style={{ fontSize: sFont(22), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.4, marginBottom: 4 }}>
                    {language === 'es' ? selectedCard.nameEs : selectedCard.nameEn}
                  </Text>
                  <Text style={{ fontSize: sFont(11), color: selectedCard.accentColor, textAlign: 'center', fontWeight: '700', letterSpacing: 0.8, marginBottom: 20, opacity: 0.9 }}>
                    {selectedCard.verseRef}
                  </Text>

                  {/* Description */}
                  <Text style={{ fontSize: sFont(14), color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 22, fontWeight: '500', marginBottom: 18 }}>
                    {language === 'es' ? selectedCard.descriptionEs : selectedCard.descriptionEn}
                  </Text>

                  {/* Verse text box */}
                  <View style={{
                    backgroundColor: selectedCard.accentColor + '12',
                    borderRadius: 14,
                    padding: 16,
                    borderLeftWidth: 3,
                    borderLeftColor: selectedCard.accentColor,
                    marginBottom: 14,
                  }}>
                    <Text style={{ fontSize: sFont(10), fontWeight: '800', color: selectedCard.accentColor, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 7 }}>
                      {selectedCard.verseRef}
                    </Text>
                    <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.75)', lineHeight: 20, fontStyle: 'italic' }}>
                      "{selectedCard.verseTextEs}"
                    </Text>
                  </View>

                  {/* Dato destacado */}
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <Star size={12} color={selectedCard.accentColor} />
                      <Text style={{ fontSize: sFont(10), fontWeight: '800', color: selectedCard.accentColor, letterSpacing: 1.0, textTransform: 'uppercase' }}>
                        {language === 'es' ? 'Dato destacado' : 'Key Fact'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.70)', lineHeight: 20 }}>
                      {selectedCard.datoDestacadoEs}
                    </Text>
                  </View>

                  {/* Significado bíblico */}
                  <View style={{
                    backgroundColor: selectedCard.accentColor + '10',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: selectedCard.accentColor + '25',
                    marginBottom: 14,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <BookOpen size={12} color={selectedCard.accentColor} />
                      <Text style={{ fontSize: sFont(10), fontWeight: '800', color: selectedCard.accentColor, letterSpacing: 1.0, textTransform: 'uppercase' }}>
                        {language === 'es' ? 'Significado bíblico' : 'Biblical Meaning'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.70)', lineHeight: 20 }}>
                      {selectedCard.significadoBiblicoEs}
                    </Text>
                  </View>

                  {/* Duplicate count */}
                  {selectedDuplicates > 0 && (
                    <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Copy size={13} color="rgba(255,255,255,0.35)" />
                      <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.35)' }}>
                        {language === 'es'
                          ? `${selectedDuplicates} duplicado${selectedDuplicates > 1 ? 's' : ''} — intercambiable próximamente`
                          : `${selectedDuplicates} duplicate${selectedDuplicates > 1 ? 's' : ''} — tradable soon`}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
