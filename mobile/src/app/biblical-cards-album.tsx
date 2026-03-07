// Biblical Cards Album Screen
// Two-level layout:
//   Level 1 — Collection Hub: large collection cards (Inicial, Pascua)
//   Level 2 — Collection View: card grid for the selected collection
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
import { ChevronLeft, ChevronRight, X, BookOpen, Copy, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useLanguage, useUser } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { gamificationApi } from '@/lib/gamification-api';
import { BIBLICAL_CARDS, ALL_CARD_IDS, type BiblicalCard, RARITY_CONFIG, type CardRarity, getEventSetCards } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';
import { preloadOwnedCardImages } from '@/lib/card-image-preload';
import {
  downloadCollection,
  resolveCardImageUriSync,
  type CollectionStatus,
} from '@/lib/card-image-cache';

const { width: SCREEN_W } = Dimensions.get('window');

// Unified 2-column grid dimensions used by BOTH collections
const COLS = 2;
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - 40 - CARD_GAP) / COLS;
const CARD_H = CARD_W * 1.5;

// Collection type
type ActiveCollection = 'inicial' | 'pascua' | null;

// ─────────────────────────────────────────────
// NOVEDAD scrolling ticker — runs inside album hub cards
// ─────────────────────────────────────────────
const TICKER_TEXT = '  ✦  NOVEDAD — ÁLBUM COLECCIONABLE  ✦  NOVEDAD — ÁLBUM COLECCIONABLE  ✦  NOVEDAD — ÁLBUM COLECCIONABLE  ';
const TICKER_SPEED = 38; // px per second

function NovedadTicker({ accentColor }: { accentColor: string }) {
  const tickerX = useRef(new RNAnimated.Value(0)).current;
  const tickerW = useRef(0);
  const anim = useRef<RNAnimated.CompositeAnimation | null>(null);

  const startScroll = useCallback((width: number) => {
    if (width <= 0) return;
    tickerX.setValue(0);
    anim.current?.stop();
    const duration = (width / TICKER_SPEED) * 1000;
    const loop = RNAnimated.loop(
      RNAnimated.timing(tickerX, {
        toValue: -width / 2,
        duration,
        easing: (t) => t,
        useNativeDriver: true,
      })
    );
    anim.current = loop;
    loop.start();
  }, []);

  useEffect(() => {
    return () => { anim.current?.stop(); };
  }, []);

  return (
    <View style={{ height: 22, overflow: 'hidden', justifyContent: 'center' }}>
      <RNAnimated.Text
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w !== tickerW.current) {
            tickerW.current = w;
            startScroll(w);
          }
        }}
        style={{
          transform: [{ translateX: tickerX }],
          fontSize: 9.5,
          fontWeight: '800',
          color: accentColor,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        } as any}
        numberOfLines={1}
      >
        {TICKER_TEXT}
      </RNAnimated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Focal-point thumbnail artwork for standard cards.
// Accepts cardW prop so it works at any column width.
// ─────────────────────────────────────────────
function CardThumbnailArtwork({ card, cardW }: { card: BiblicalCard; cardW: number }) {
  const focusX = card.imageFocusX ?? 0.5;
  const focusY = card.imageFocusY ?? 0.5;
  const [containerH, setContainerH] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  // Hybrid URI: local file if cached, else remote URL
  const imageUri = resolveCardImageUriSync(card) ?? card.imageUrl;

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
  const oversizeW = cardW * OVERSIZE;
  const translateX = (0.5 - focusX) * (oversizeW - cardW);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
      {/* Skeleton shown until image loads */}
      {!imageLoaded && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: card.accentColor + '15',
        }}>
          <LinearGradient
            colors={['transparent', card.accentColor + '20', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
      )}
      <RNAnimated.Image
        source={{ uri: imageUri ?? '' }}
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
// Same logic but accepts a custom cardW prop.
// ─────────────────────────────────────────────
function PascuaCardArtwork({ card, cardW }: { card: BiblicalCard; cardW: number }) {
  const focusX = card.imageFocusX ?? 0.5;
  const focusY = card.imageFocusY ?? 0.5;
  const [containerH, setContainerH] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  // Hybrid URI: local file if cached, else remote URL
  const imageUri = resolveCardImageUriSync(card) ?? card.imageUrl;

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
        source={{ uri: imageUri ?? '' }}
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

// ─────────────────────────────────────────────
// Standard card thumbnail (Colección Inicial)
// ─────────────────────────────────────────────
function StandardCardThumbnail({
  card,
  owned,
  duplicates,
  isNew,
  cardW,
  cardH,
  onPress,
  sFont,
  language,
  index,
}: {
  card: BiblicalCard;
  owned: boolean;
  duplicates: number;
  isNew: boolean;
  cardW: number;
  cardH: number;
  onPress: () => void;
  sFont: (n: number) => number;
  language: string;
  index: number;
}) {
  return (
    <Animated.View entering={ZoomIn.delay(index * 70).duration(340)}>
      <Pressable onPress={onPress} style={{ width: cardW, height: cardH }}>
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
            {/* Accent lines */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: card.accentColor }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: card.accentColor }} />

            {/* Top bar */}
            <LinearGradient
              colors={[card.accentColor + '60', card.accentColor + '1A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 5, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
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

            <View style={{ height: 0.5, backgroundColor: card.accentColor + '60' }} />

            {/* Artwork area */}
            {card.imageUrl ? (
              <CardThumbnailArtwork card={card} cardW={cardW} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
                <View style={{
                  position: 'absolute',
                  width: cardW * 0.65,
                  height: cardW * 0.65,
                  borderRadius: cardW * 0.325,
                  backgroundColor: card.accentColor + '0E',
                }} />
                <View style={{
                  width: cardW * 0.50,
                  height: cardW * 0.50,
                  borderRadius: (cardW * 0.50) / 2,
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
                  <Text style={{ fontSize: cardW * 0.22 }}>{card.motif.artEmoji}</Text>
                </View>
              </View>
            )}

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
                <Text style={{ fontSize: sFont(7.5), fontWeight: '900', color: '#000' }}>x{duplicates + 1}</Text>
              </View>
            )}
            {isNew && !duplicates && (
              <Animated.View entering={FadeIn.duration(180)} style={{ position: 'absolute', top: 5, right: 5 }}>
                <LinearGradient
                  colors={['#D4A017', '#F5D060']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2.5, shadowColor: '#D4A017', shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
                >
                  <Text style={{ fontSize: sFont(6.5), fontWeight: '900', color: '#000', letterSpacing: 0.5 }}>✨ NUEVA</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </LinearGradient>
        ) : (
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
            <Text style={{ fontSize: cardW * 0.3, opacity: 0.15 }}>?</Text>
            <Text style={{ fontSize: sFont(7.5), color: 'rgba(255,255,255,0.30)', marginTop: 6, textAlign: 'center', paddingHorizontal: 4 }}>
              {language === 'es' ? 'No obtenida' : 'Not owned'}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Pascua card thumbnail (Historia de Pascua)
// ─────────────────────────────────────────────
function PascuaCardThumbnail({
  card,
  owned,
  duplicates,
  isNew,
  cardW,
  cardH,
  onPress,
  sFont,
  language,
  index,
}: {
  card: BiblicalCard;
  owned: boolean;
  duplicates: number;
  isNew: boolean;
  cardW: number;
  cardH: number;
  onPress: () => void;
  sFont: (n: number) => number;
  language: string;
  index: number;
}) {
  const rc = RARITY_CONFIG[card.rarity];

  return (
    <Animated.View entering={ZoomIn.delay(index * 50).duration(300)}>
      <Pressable onPress={onPress} style={{ width: cardW, height: cardH }}>
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
            {/* Accent lines */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: card.accentColor }} />
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

            {/* Artwork */}
            <PascuaCardArtwork card={card} cardW={cardW} />

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
                <Text style={{ fontSize: sFont(7.5), fontWeight: '900', color: '#000' }}>x{duplicates + 1}</Text>
              </View>
            )}
            {isNew && !duplicates && (
              <Animated.View entering={FadeIn.duration(180)} style={{ position: 'absolute', top: 5, right: 5 }}>
                <LinearGradient
                  colors={['#D4A017', '#F5D060']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2.5, shadowColor: '#D4A017', shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
                >
                  <Text style={{ fontSize: sFont(6.5), fontWeight: '900', color: '#000', letterSpacing: 0.5 }}>✨ NUEVA</Text>
                </LinearGradient>
              </Animated.View>
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
            <Text style={{ fontSize: cardW * 0.18, opacity: 0.12, marginTop: 2 }}>✝</Text>
            <Text style={{ fontSize: sFont(7.5), color: 'rgba(245,208,96,0.25)', marginTop: 6, textAlign: 'center', paddingHorizontal: 6 }} numberOfLines={2}>
              {language === 'es' ? card.nameEs : card.nameEn}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function BiblicalCardsAlbumScreen() {
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();
  const userId = user?.id ?? '';

  // Which collection is open (null = hub)
  const [activeCollection, setActiveCollection] = useState<ActiveCollection>(null);

  // Timing logs
  const mountTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    console.log('[Cards/Album] Screen mounted');
    // initCardImageCache + downloadCollection are called in _layout.tsx at app start.
    // No need to repeat here — cache is already warm by the time the user opens the album.
    return () => {
      console.log(`[Cards/Album] Screen unmounted after ${Date.now() - mountTimeRef.current}ms`);
    };
  }, []);

  const [selectedCard, setSelectedCard] = useState<BiblicalCard | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<number>(0);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  // null = show all rarities
  const [rarityFilter, setRarityFilter] = useState<CardRarity | null>(null);

  const queryClient = useQueryClient();

  const { data: cardInventory = [] } = useQuery({
    queryKey: ['biblical-cards', userId],
    queryFn: async () => {
      const t0 = Date.now();
      const result = await gamificationApi.getBiblicalCards(userId);
      console.log(`[Cards/Album] Inventory loaded in ${Date.now() - t0}ms (${result.length} entries)`);
      return result;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

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
      isNew: entry?.isNew ?? false,
    };
  }, [cardInventory]);

  // Standard cards (inStandardPool: true)
  const standardCardIds = ALL_CARD_IDS.filter(
    (id) => BIBLICAL_CARDS[id]?.inStandardPool === true && !BIBLICAL_CARDS[id]?.eventSet
  );

  // Pascua 2026 event cards in chronological order
  const pascuaCards = getEventSetCards('pascua_2026');

  // Counts
  const standardOwnedCount = standardCardIds.filter((id) => {
    const entry = cardInventory.find((c) => c.cardId === id);
    return entry?.owned ?? false;
  }).length;

  const pascuaOwnedCount = pascuaCards.filter((c) => {
    const entry = cardInventory.find((inv) => inv.cardId === c.id);
    return entry?.owned ?? false;
  }).length;

  // Overall progress (all collections combined) for the global header bar
  const totalAllCards = standardCardIds.length + pascuaCards.length;
  const ownedAllCards = standardOwnedCount + pascuaOwnedCount;

  // Filtered standard card IDs based on rarity selector
  const filteredStandardIds = rarityFilter
    ? standardCardIds.filter((id) => BIBLICAL_CARDS[id]?.rarity === rarityFilter)
    : standardCardIds;

  // Filtered pascua cards based on rarity selector
  const filteredPascuaCards = rarityFilter
    ? pascuaCards.filter((c) => c.rarity === rarityFilter)
    : pascuaCards;

  // Count of new (unseen) cards in current collection view
  const newCardCount = cardInventory.filter((c) => c.isNew && c.owned).length;

  const openCard = useCallback((card: BiblicalCard) => {
    const { owned, duplicates, isNew } = getCardStatus(card.id);
    if (!owned) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCard(card);
    setSelectedDuplicates(duplicates);
    setShowDetailModal(true);
    // Clear the "new" flag when user opens the card
    if (isNew && userId) {
      gamificationApi.markCardSeen(userId, card.id);
      // Optimistic update — remove isNew locally so badge disappears immediately
      queryClient.setQueryData(['biblical-cards', userId], (old: typeof cardInventory) =>
        old.map((c) => c.cardId === card.id ? { ...c, isNew: false } : c)
      );
    }
  }, [getCardStatus, userId, queryClient, cardInventory]);

  // Handle back button — returns to hub if in collection, or navigates back if in hub
  const handleBack = useCallback(() => {
    if (activeCollection !== null) {
      setActiveCollection(null);
      setRarityFilter(null);
    } else {
      router.back();
    }
  }, [activeCollection, router]);

  // ─── Header title ───────────────────────────────────────────────────
  const headerTitle = activeCollection === 'inicial'
    ? 'Colección Inicial'
    : activeCollection === 'pascua'
      ? 'Historia de Pascua'
      : (language === 'es' ? 'Álbum Bíblico' : 'Biblical Album');

  const headerSubtitle = activeCollection === 'inicial'
    ? `${standardOwnedCount} / ${standardCardIds.length} ${language === 'es' ? 'cartas' : 'cards'}`
    : activeCollection === 'pascua'
      ? `${pascuaOwnedCount} / ${pascuaCards.length} ${language === 'es' ? 'cartas' : 'cards'}`
      : `${ownedAllCards} / ${totalAllCards} ${language === 'es' ? 'cartas' : 'cards'}`;

  // Overall progress for the header bar
  const progressPct = totalAllCards > 0 ? (ownedAllCards / totalAllCards) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#080C18' }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#080C18', '#0D1224', '#080C18']}
        style={{ paddingTop: insets.top, paddingBottom: 0 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <Pressable
            onPress={handleBack}
            style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', marginRight: 12 }}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(20), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
              {headerTitle}
            </Text>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.50)', marginTop: 1 }}>
              {headerSubtitle}
            </Text>
          </View>
          <BookOpen size={22} color="rgba(255,255,255,0.45)" />
        </View>

        {/* Progress bar — always shows combined progress */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
          <Animated.View
            entering={FadeIn.duration(800)}
            style={{
              width: `${progressPct}%`,
              height: '100%',
              borderRadius: 99,
              backgroundColor: '#D4AF37',
            }}
          />
        </View>
      </LinearGradient>

      {/* Separator */}
      <View style={{ height: 1, backgroundColor: 'rgba(212,175,55,0.15)' }} />

      {activeCollection === null ? (
        // ══════════════════════════════════════════════════════════════════
        // LEVEL 1 — Collection Hub
        // ══════════════════════════════════════════════════════════════════
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4 }}>
              {language === 'es' ? 'Colecciones' : 'Collections'}
            </Text>
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.45)', lineHeight: 18 }}>
              {language === 'es'
                ? 'Toca una colección para ver sus cartas.'
                : 'Tap a collection to view its cards.'}
            </Text>
          </Animated.View>

          {/* Collection card — Colección Inicial */}
          <Animated.View entering={FadeInDown.delay(80).duration(380)} style={{ marginBottom: 16 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCollection('inicial');
                // Start background download for this collection (non-blocking)
                downloadCollection('inicial');
              }}
            >
              <LinearGradient
                colors={['#1A3A6B', '#0F2149', '#0A1530']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(100,150,255,0.30)',
                  overflow: 'hidden',
                  shadowColor: '#1A3A6B',
                  shadowOpacity: 0.55,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 10,
                }}
              >
                {/* Diagonal sheen */}
                <LinearGradient
                  colors={['rgba(100,160,255,0.12)', 'transparent', 'rgba(100,160,255,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 }}>
                  {/* Icon */}
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: 'rgba(100,160,255,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(100,160,255,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Text style={{ fontSize: 28 }}>📖</Text>
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(18), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 3 }}>
                      Colección Inicial
                    </Text>
                    <Text style={{ fontSize: sFont(13), color: 'rgba(180,210,255,0.65)', marginBottom: 10 }}>
                      Las primeras cartas del álbum
                    </Text>
                    {/* Progress pill */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <View style={{
                        paddingHorizontal: 9,
                        paddingVertical: 3,
                        borderRadius: 99,
                        backgroundColor: 'rgba(100,160,255,0.18)',
                        borderWidth: 1,
                        borderColor: 'rgba(100,160,255,0.35)',
                      }}>
                        <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#A8C8FF' }}>
                          {standardOwnedCount} / {standardCardIds.length} {language === 'es' ? 'cartas' : 'cards'}
                        </Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' }}>
                      <View style={{
                        width: `${standardCardIds.length > 0 ? (standardOwnedCount / standardCardIds.length) * 100 : 0}%`,
                        height: '100%',
                        borderRadius: 99,
                        backgroundColor: '#6496FF',
                      }} />
                    </View>
                  </View>

                  {/* Chevron */}
                  <ChevronRight size={22} color="rgba(180,210,255,0.55)" style={{ marginLeft: 10 }} />
                </View>
                {/* NOVEDAD ticker */}
                <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(100,160,255,0.18)', backgroundColor: 'rgba(100,160,255,0.07)' }}>
                  <NovedadTicker accentColor="rgba(168,210,255,0.80)" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Collection card — Historia de Pascua */}
          <Animated.View entering={FadeInDown.delay(180).duration(380)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCollection('pascua');
                // Start background download for this collection (non-blocking)
                downloadCollection('pascua');
              }}
            >
              <LinearGradient
                colors={['#5C1010', '#3D0A0A', '#200505']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(245,208,96,0.25)',
                  overflow: 'hidden',
                  shadowColor: '#CC3333',
                  shadowOpacity: 0.55,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 10,
                }}
              >
                {/* Diagonal sheen */}
                <LinearGradient
                  colors={['rgba(245,208,96,0.10)', 'transparent', 'rgba(204,51,51,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 }}>
                  {/* Icon */}
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: 'rgba(245,208,96,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(245,208,96,0.30)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Text style={{ fontSize: 28 }}>✝️</Text>
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(18), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 3 }}>
                      Historia de Pascua
                    </Text>
                    <Text style={{ fontSize: sFont(13), color: 'rgba(245,208,96,0.60)', marginBottom: 10 }}>
                      14 capítulos de la redención
                    </Text>
                    {/* Progress pill */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <View style={{
                        paddingHorizontal: 9,
                        paddingVertical: 3,
                        borderRadius: 99,
                        backgroundColor: 'rgba(245,208,96,0.14)',
                        borderWidth: 1,
                        borderColor: 'rgba(245,208,96,0.30)',
                      }}>
                        <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#F5D060' }}>
                          {pascuaOwnedCount} / {pascuaCards.length} {language === 'es' ? 'cartas' : 'cards'}
                        </Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' }}>
                      <View style={{
                        width: `${pascuaCards.length > 0 ? (pascuaOwnedCount / pascuaCards.length) * 100 : 0}%`,
                        height: '100%',
                        borderRadius: 99,
                        backgroundColor: '#F5D060',
                      }} />
                    </View>
                  </View>

                  {/* Chevron */}
                  <ChevronRight size={22} color="rgba(245,208,96,0.50)" style={{ marginLeft: 10 }} />
                </View>
                {/* NOVEDAD ticker */}
                <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(245,208,96,0.18)', backgroundColor: 'rgba(245,208,96,0.07)' }}>
                  <NovedadTicker accentColor="rgba(245,208,96,0.85)" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      ) : (
        // ══════════════════════════════════════════════════════════════════
        // LEVEL 2 — Collection View (card grid)
        // ══════════════════════════════════════════════════════════════════
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Rarity filter bar */}
          <Animated.View entering={FadeInDown.delay(60).duration(320)} style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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

          {/* ── Card grid ───────────────────────────────────────────────── */}
          {/* New cards banner */}
          {newCardCount > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={['rgba(212,175,55,0.18)', 'rgba(212,175,55,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(212,175,55,0.35)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 18 }}>✨</Text>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#F5D060', flex: 1 }}>
                  {language === 'es'
                    ? `${newCardCount} carta${newCardCount !== 1 ? 's' : ''} nueva${newCardCount !== 1 ? 's' : ''} descubierta${newCardCount !== 1 ? 's' : ''}`
                    : `${newCardCount} new card${newCardCount !== 1 ? 's' : ''} discovered`}
                </Text>
                <Text style={{ fontSize: sFont(11), color: 'rgba(245,208,96,0.60)' }}>
                  {language === 'es' ? 'Toca para ver' : 'Tap to view'}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}
          {activeCollection === 'inicial' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
              {filteredStandardIds.map((cardId, index) => {
                const card = BIBLICAL_CARDS[cardId];
                if (!card) return null;
                const { owned, duplicates, isNew } = getCardStatus(cardId);
                return (
                  <StandardCardThumbnail
                    key={cardId}
                    card={card}
                    owned={owned}
                    duplicates={duplicates}
                    isNew={isNew}
                    cardW={CARD_W}
                    cardH={CARD_H}
                    onPress={() => openCard(card)}
                    sFont={sFont}
                    language={language}
                    index={index}
                  />
                );
              })}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
              {filteredPascuaCards.map((card, index) => {
                const { owned, duplicates, isNew } = getCardStatus(card.id);
                return (
                  <PascuaCardThumbnail
                    key={card.id}
                    card={card}
                    owned={owned}
                    duplicates={duplicates}
                    isNew={isNew}
                    cardW={CARD_W}
                    cardH={CARD_H}
                    onPress={() => openCard(card)}
                    sFont={sFont}
                    language={language}
                    index={index}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Card Detail Modal ─────────────────────────────────────────────── */}
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
