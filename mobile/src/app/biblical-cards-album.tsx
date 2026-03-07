// Biblical Cards Album Screen
// Phase C: 6 cards, richer detail modal with dato destacado + significado bíblico,
// category identity chips, premium card grid thumbnails.
// Perf: staleTime 10min, non-blocking render, image preload + skeleton placeholders.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  LayoutChangeEvent,
  Animated as RNAnimated,
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
import { BIBLICAL_CARDS, ALL_CARD_IDS, type BiblicalCard, RARITY_CONFIG, type CardRarity, getEventSetCards } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';
import { preloadCardImages, preloadOwnedCardImages } from '@/lib/card-image-preload';

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
// Includes: skeleton placeholder while loading, fade-in on load.
// ─────────────────────────────────────────────
function CardThumbnailArtwork({ card }: { card: BiblicalCard }) {
  const focusX = card.imageFocusX ?? 0.5;
  const focusY = card.imageFocusY ?? 0.5;
  const [containerH, setContainerH] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  const onImageLoad = useCallback(() => {
    setImageLoaded(true);
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const OVERSIZE = 1.6;
  const oversizeH = containerH > 0 ? containerH * OVERSIZE : 0;
  const translateY = containerH > 0 ? (0.5 - focusY) * (oversizeH - containerH) : 0;
  const oversizeW = CARD_W * OVERSIZE;
  const translateX = (0.5 - focusX) * (oversizeW - CARD_W);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
      {/* Skeleton shown until image loads */}
      {!imageLoaded && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: card.accentColor + '15',
        }}>
          {/* Shimmer stripe */}
          <LinearGradient
            colors={['transparent', card.accentColor + '20', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
      )}
      <RNAnimated.Image
        source={{ uri: card.imageUrl }}
        onLoad={onImageLoad}
        style={{
          opacity: fadeAnim,
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

// ─────────────────────────────────────────────
// Focal-point artwork for event (Pascua) cards.
// Same logic as CardThumbnailArtwork but accepts a custom cardW prop
// so it works at any column width.
// ─────────────────────────────────────────────
function PascuaCardArtwork({ card, cardW }: { card: BiblicalCard; cardW: number }) {
  const focusX = card.imageFocusX ?? 0.5;
  const focusY = card.imageFocusY ?? 0.5;
  const [containerH, setContainerH] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  const onImageLoad = useCallback(() => {
    setImageLoaded(true);
    RNAnimated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const OVERSIZE = 1.6;
  const oversizeH = containerH > 0 ? containerH * OVERSIZE : 0;
  const translateY = containerH > 0 ? (0.5 - focusY) * (oversizeH - containerH) : 0;
  const oversizeW = cardW * OVERSIZE;
  const translateX = (0.5 - focusX) * (oversizeW - cardW);

  if (!card.imageUrl) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: cardW * 0.28 }}>{card.motif.artEmoji}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
      {!imageLoaded && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: card.accentColor + '15' }}>
          <LinearGradient
            colors={['transparent', card.accentColor + '20', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
      )}
      <RNAnimated.Image
        source={{ uri: card.imageUrl }}
        onLoad={onImageLoad}
        style={{
          opacity: fadeAnim,
          position: 'absolute',
          width: oversizeW,
          height: oversizeH > 0 ? oversizeH : undefined,
          ...(oversizeH === 0 ? { top: 0, bottom: 0 } : {
            top: (containerH - oversizeH) / 2 + translateY,
          }),
          left: (cardW - oversizeW) / 2 + translateX,
        }}
        resizeMode={oversizeH === 0 ? 'cover' : 'stretch'}
      />
      <LinearGradient
        colors={['transparent', card.gradientColors[2] + 'CC']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36 }}
      />
      <LinearGradient
        colors={[card.gradientColors[0] + 'AA', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22 }}
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

  // Timing logs
  const mountTimeRef = useRef(Date.now());
  useEffect(() => {
    console.log('[Cards/Album] Screen mounted');
    // Fire preload of all card images immediately on mount (best-effort, no-op if already cached)
    preloadCardImages();
    return () => {
      console.log(`[Cards/Album] Screen unmounted after ${Date.now() - mountTimeRef.current}ms`);
    };
  }, []);

  const [selectedCard, setSelectedCard] = useState<BiblicalCard | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // null = show all rarities
  const [rarityFilter, setRarityFilter] = useState<CardRarity | null>(null);

  // staleTime: 10 min — card inventory changes only when the user purchases a pack,
  // which invalidates the query explicitly. No need to refetch every 30 seconds.
  const { data: cardInventory = [] } = useQuery({
    queryKey: ['biblical-cards', userId],
    queryFn: async () => {
      const t0 = Date.now();
      const result = await gamificationApi.getBiblicalCards(userId);
      console.log(`[Cards/Album] Inventory loaded in ${Date.now() - t0}ms (${result.length} entries)`);
      return result;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Preload owned card images as soon as we know which cards the user has
  useEffect(() => {
    const ownedIds = cardInventory.filter((c) => c.owned).map((c) => c.cardId);
    if (ownedIds.length > 0) {
      preloadOwnedCardImages(ownedIds);
    }
  }, [cardInventory]);

  const getCardStatus = useCallback((cardId: string) => {
    const entry = cardInventory.find((c) => c.cardId === cardId);
    return {
      owned: entry?.owned ?? false,
      duplicates: entry?.duplicates ?? 0,
    };
  }, [cardInventory]);

  const ownedCount = cardInventory.filter((c) => c.owned).length;
  // Standard cards only (no event cards in main grid)
  const standardCardIds = ALL_CARD_IDS.filter((id) => BIBLICAL_CARDS[id]?.inStandardPool !== false || !BIBLICAL_CARDS[id]?.eventSet);
  const totalCount = standardCardIds.length;

  // Pascua 2026 event cards in chronological order
  const pascuaCards = getEventSetCards('pascua_2026');

  // Filtered standard card IDs based on rarity selector (event cards always shown separately)
  const filteredCardIds = rarityFilter
    ? standardCardIds.filter((id) => BIBLICAL_CARDS[id]?.rarity === rarityFilter)
    : standardCardIds;

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

      {/* Render the grid immediately — no blocking wait.
          While inventory is loading, all cards show as unowned placeholders.
          They flip to the real state once data arrives (usually < 200ms on a warm cache). */}
      <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section header */}
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase' }}>
              {language === 'es' ? 'Colección' : 'Collection'}
            </Text>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 18 }}>
              {language === 'es'
                ? 'Abre Sobres Bíblicos en la Tienda para desbloquear cartas.'
                : 'Open Biblical Packs in the Store to unlock cards.'}
            </Text>
          </Animated.View>

          {/* Rarity filter bar */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {/* "All" pill */}
            <Pressable
              onPress={() => { setRarityFilter(null); Haptics.selectionAsync(); }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: rarityFilter === null ? '#D4AF37' : 'rgba(255,255,255,0.18)',
                backgroundColor: rarityFilter === null ? 'rgba(212,175,55,0.18)' : 'transparent',
              }}
            >
              <Text style={{ fontSize: sFont(10), fontWeight: '700', color: rarityFilter === null ? '#D4AF37' : 'rgba(255,255,255,0.45)', letterSpacing: 0.6 }}>
                {language === 'es' ? 'Todas' : 'All'}
              </Text>
            </Pressable>
            {/* Per-rarity pills */}
            {(['rare', 'epic', 'legendary'] as CardRarity[]).map((r) => {
              const rc = RARITY_CONFIG[r];
              const active = rarityFilter === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => { setRarityFilter(active ? null : r); Haptics.selectionAsync(); }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: active ? rc.color : rc.color + '55',
                    backgroundColor: active ? rc.bg : 'transparent',
                    shadowColor: active ? rc.glow : 'transparent',
                    shadowOpacity: active ? 0.7 : 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <Text style={{ fontSize: sFont(10), fontWeight: '700', color: active ? rc.color : rc.color + 'AA', letterSpacing: 0.6 }}>
                    {language === 'es' ? rc.labelEs : rc.labelEn}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Card Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
            {filteredCardIds.map((cardId, index) => {
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

                        {/* Top bar: rarity badge (left) + corner glyph (right) */}
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
                          {(() => {
                            const rc = RARITY_CONFIG[card.rarity];
                            return (
                              <View style={{ backgroundColor: rc.bg, borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 0.5, borderColor: rc.color + 'AA' }}>
                                <Text style={{ fontSize: sFont(5.5), fontWeight: '900', color: rc.color, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                                  {language === 'es' ? rc.labelEs : rc.labelEn}
                                </Text>
                              </View>
                            );
                          })()}
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

          {/* ── PASCUA 2026 EVENT SECTION ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ marginTop: 36 }}>
            {/* Event banner */}
            <LinearGradient
              colors={['rgba(204,51,51,0.25)', 'rgba(245,208,96,0.18)', 'rgba(204,51,51,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245,208,96,0.30)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 22 }}>✝️</Text>
                <View>
                  <Text style={{ fontSize: sFont(14), fontWeight: '900', color: '#F5D060', letterSpacing: 0.2 }}>
                    {language === 'es' ? 'Pascua 2026' : 'Easter 2026'}
                  </Text>
                  <Text style={{ fontSize: sFont(10), color: 'rgba(245,208,96,0.70)', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 1 }}>
                    {language === 'es' ? '14 cartas — Evento especial' : '14 cards — Special event'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.55)', lineHeight: 18 }}>
                {language === 'es'
                  ? 'Sigue la historia de la Pasión y Resurrección de Jesús en orden cronológico.'
                  : 'Follow the story of the Passion and Resurrection of Jesus in chronological order.'}
              </Text>
              {/* Progress within event set */}
              {(() => {
                const ownedEventCount = pascuaCards.filter((c) => {
                  const entry = cardInventory.find((inv) => inv.cardId === c.id);
                  return entry?.owned ?? false;
                }).length;
                return (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: sFont(10), color: 'rgba(245,208,96,0.70)', fontWeight: '600' }}>
                        {language === 'es' ? 'Progreso del evento' : 'Event progress'}
                      </Text>
                      <Text style={{ fontSize: sFont(10), color: '#F5D060', fontWeight: '700' }}>
                        {ownedEventCount}/{pascuaCards.length}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' }}>
                      <View style={{ width: `${(ownedEventCount / pascuaCards.length) * 100}%`, height: '100%', borderRadius: 99, backgroundColor: '#F5D060' }} />
                    </View>
                  </View>
                );
              })()}
            </LinearGradient>

            {/* Pascua card grid — 2 columns, wider cards */}
            {(() => {
              const PASCUA_COLS = 2;
              const PASCUA_GAP = 12;
              const PASCUA_W = (SCREEN_W - 40 - PASCUA_GAP) / PASCUA_COLS;
              const PASCUA_H = PASCUA_W * 1.5;

              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: PASCUA_GAP }}>
                  {pascuaCards.map((card, index) => {
                    const { owned, duplicates } = getCardStatus(card.id);
                    const rc = RARITY_CONFIG[card.rarity];

                    return (
                      <Animated.View
                        key={card.id}
                        entering={ZoomIn.delay(index * 50).duration(300)}
                      >
                        <Pressable
                          onPress={() => openCard(card)}
                          style={{ width: PASCUA_W, height: PASCUA_H }}
                        >
                          {owned ? (
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
                                shadowOpacity: card.rarity === 'legendary' ? 0.75 : 0.45,
                                shadowRadius: card.rarity === 'legendary' ? 16 : 10,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 12,
                              }}
                            >
                              {/* Foil shimmer */}
                              <LinearGradient
                                colors={[card.motif.sheenColors[0], 'transparent', card.motif.sheenColors[1]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ position: 'absolute', width: '100%', height: '100%' }}
                              />
                              {/* Top accent line */}
                              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: card.accentColor }} />
                              {/* Bottom accent line */}
                              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, backgroundColor: card.accentColor }} />

                              {/* Top bar: order number + rarity badge */}
                              <LinearGradient
                                colors={[card.accentColor + '60', card.accentColor + '1A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                              >
                                <Text style={{ fontSize: sFont(8), fontWeight: '900', color: card.accentColor + 'CC', letterSpacing: 0.5 }}>
                                  {String(card.eventOrder ?? '').padStart(2, '0')}
                                </Text>
                                <View style={{ backgroundColor: rc.bg, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1.5, borderWidth: 0.5, borderColor: rc.color + 'AA' }}>
                                  <Text style={{ fontSize: sFont(6), fontWeight: '900', color: rc.color, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                                    {language === 'es' ? rc.labelEs : rc.labelEn}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 10, color: card.accentColor, opacity: 0.8 }}>{card.motif.cornerGlyph}</Text>
                              </LinearGradient>

                              <View style={{ height: 0.5, backgroundColor: card.accentColor + '60' }} />

                              {/* Artwork — inline focal-point logic for Pascua card size */}
                              <PascuaCardArtwork card={card} cardW={PASCUA_W} />

                              <View style={{ height: 0.5, backgroundColor: card.accentColor + '60' }} />

                              {/* Footer */}
                              <LinearGradient
                                colors={[card.accentColor + '1A', card.accentColor + '60']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' }}
                              >
                                <Text style={{ fontSize: sFont(10), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.1 }} numberOfLines={1}>
                                  {language === 'es' ? card.nameEs : card.nameEn}
                                </Text>
                                <Text style={{ fontSize: sFont(7.5), color: card.accentColor, fontWeight: '700', marginTop: 1 }}>
                                  {card.verseRef}
                                </Text>
                              </LinearGradient>

                              {duplicates > 0 && (
                                <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: card.accentColor, borderRadius: 99, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                                  <Text style={{ fontSize: sFont(7.5), fontWeight: '900', color: '#000' }}>×{duplicates + 1}</Text>
                                </View>
                              )}
                            </LinearGradient>
                          ) : (
                            /* Unowned event card — shows order number hint */
                            <View style={{
                              flex: 1,
                              borderRadius: 14,
                              backgroundColor: 'rgba(245,208,96,0.04)',
                              borderWidth: 1.5,
                              borderColor: 'rgba(245,208,96,0.15)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderStyle: 'dashed',
                            }}>
                              <Text style={{ fontSize: sFont(11), fontWeight: '800', color: 'rgba(245,208,96,0.25)', letterSpacing: 1 }}>
                                {String(card.eventOrder ?? '').padStart(2, '0')}
                              </Text>
                              <Text style={{ fontSize: PASCUA_W * 0.18, opacity: 0.12, marginTop: 2 }}>✝</Text>
                              <Text style={{ fontSize: sFont(7.5), color: 'rgba(245,208,96,0.25)', marginTop: 6, textAlign: 'center', paddingHorizontal: 6 }} numberOfLines={2}>
                                {language === 'es' ? card.nameEs : card.nameEn}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              );
            })()}
          </Animated.View>
        </ScrollView>

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
