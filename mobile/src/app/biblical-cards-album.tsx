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
  Image,
  Dimensions,
  LayoutChangeEvent,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, ZoomIn,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, X, BookOpen, Copy, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { useLanguage, useUser, useAppStore } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { gamificationApi } from '@/lib/gamification-api';
import { BIBLICAL_CARDS, ALL_CARD_IDS, type BiblicalCard, RARITY_CONFIG, type CardRarity, getEventSetCards, SECRET_REWARD_IDS } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';
import { CollectionCompleteModal } from '@/components/CollectionCompleteModal';
import { preloadOwnedCardImages } from '@/lib/card-image-preload';
import {
  downloadCollection,
  resolveCardImageUriSync,
  type CollectionStatus,
} from '@/lib/card-image-cache';

const { width: SCREEN_W } = Dimensions.get('window');

// Unified 5-column grid dimensions used by BOTH collections
const COLS = 5;
const CARD_GAP = 6;
const CARD_W = (SCREEN_W - 40 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W * 1.5;

// Collection type
type ActiveCollection = 'inicial' | 'pascua' | 'milagros' | 'heroes' | 'secretas' | null;

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
// MarqueeText — scrolls text that overflows, static if it fits
// ─────────────────────────────────────────────
function MarqueeText({ text, style }: { text: string; style?: object }) {
  const [containerW, setContainerW] = useState<number>(0);
  const [naturalW, setNaturalW] = useState<number>(0);
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const animRef = useRef<RNAnimated.CompositeAnimation | null>(null);

  const scrollDist = containerW > 0 && naturalW > containerW ? naturalW - containerW + 4 : 0;

  useEffect(() => {
    animRef.current?.stop();
    translateX.setValue(0);
    if (scrollDist <= 0) return;

    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(1400),
        RNAnimated.timing(translateX, {
          toValue: -scrollDist,
          duration: scrollDist * 48,
          easing: (t) => t,
          useNativeDriver: true,
        }),
        RNAnimated.delay(700),
        RNAnimated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    animRef.current = anim;
    anim.start();
    return () => { animRef.current?.stop(); };
  }, [scrollDist]);

  return (
    <View
      style={{ overflow: 'hidden', width: '100%' }}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      {/* Ghost: 600px-wide container so Text renders at natural width for measurement */}
      <View style={{ position: 'absolute', width: 600, opacity: 0 }} pointerEvents="none">
        <Text
          style={[style as any, { alignSelf: 'flex-start', textAlign: 'left' }]}
          onLayout={(e) => setNaturalW(e.nativeEvent.layout.width)}
        >
          {text}
        </Text>
      </View>
      {/*
        Animate a View wrapper, NOT Text directly.
        Text gets explicit width=600 so the native engine never hits the container
        boundary and never inserts "…". The outer overflow:hidden does all clipping.
      */}
      <RNAnimated.View style={{ transform: [{ translateX }] }}>
        <Text
          style={[style as any, { width: 600, textAlign: 'left' }]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {text}
        </Text>
      </RNAnimated.View>
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
    <Animated.View entering={ZoomIn.delay(index * 25).duration(280)}>
      <Pressable onPress={onPress} style={{ width: cardW, height: cardH }}>
        {owned ? (
          <LinearGradient
            colors={[card.gradientColors[0], card.gradientColors[1], card.gradientColors[2]] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 10,
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
              style={{ paddingHorizontal: 3, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              {(() => {
                const rc = RARITY_CONFIG[card.rarity];
                return (
                  <View style={{ backgroundColor: rc.bg, borderRadius: 99, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 0.5, borderColor: rc.color + 'AA' }}>
                    <Text style={{ fontSize: sFont(5), fontWeight: '900', color: rc.color, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                      {language === 'es' ? rc.labelEs : rc.labelEn}
                    </Text>
                  </View>
                );
              })()}
              <Text style={{ fontSize: 7, color: card.accentColor, opacity: 0.8 }}>{card.motif.cornerGlyph}</Text>
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
              style={{ paddingHorizontal: 3, paddingVertical: 3, alignItems: 'center' }}
            >
              <MarqueeText
                text={language === 'es' ? card.nameEs : card.nameEn}
                style={{ fontSize: sFont(7), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.1 }}
              />
            </LinearGradient>

            {/* Duplicate badge */}
            {duplicates > 0 && (
              <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: card.accentColor, borderRadius: 99, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <Text style={{ fontSize: sFont(6), fontWeight: '900', color: '#000' }}>x{duplicates + 1}</Text>
              </View>
            )}
            {isNew && !duplicates && (
              <Animated.View entering={FadeIn.duration(180)} style={{ position: 'absolute', top: 3, right: 3 }}>
                <View style={{ backgroundColor: '#D4A017', borderRadius: 99, width: 8, height: 8 }} />
              </Animated.View>
            )}
          </LinearGradient>
        ) : (
          <View style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
            borderStyle: 'dashed',
          }}>
            <Text style={{ fontSize: cardW * 0.35, opacity: 0.15 }}>?</Text>
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
    <Animated.View entering={ZoomIn.delay(index * 25).duration(280)}>
      <Pressable onPress={onPress} style={{ width: cardW, height: cardH }}>
        {owned ? (
          <LinearGradient
            colors={[card.gradientColors[0], card.gradientColors[1], card.gradientColors[2]] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: card.accentColor + '88',
              overflow: 'hidden',
              shadowColor: card.accentColor,
              shadowOpacity: card.rarity === 'legendary' ? 0.6 : 0.35,
              shadowRadius: card.rarity === 'legendary' ? 10 : 6,
              shadowOffset: { width: 0, height: 2 },
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
            {/* Accent lines */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: card.accentColor }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: card.accentColor }} />

            {/* Top bar: order number + rarity badge */}
            <LinearGradient
              colors={[card.accentColor + '60', card.accentColor + '1A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 3, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={{ fontSize: sFont(6), fontWeight: '900', color: card.accentColor + 'CC', letterSpacing: 0.3 }}>
                {String(card.eventOrder ?? '').padStart(2, '0')}
              </Text>
              <View style={{ backgroundColor: rc.bg, borderRadius: 99, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 0.5, borderColor: rc.color + 'AA' }}>
                <Text style={{ fontSize: sFont(5), fontWeight: '900', color: rc.color, textTransform: 'uppercase' }}>
                  {language === 'es' ? rc.labelEs : rc.labelEn}
                </Text>
              </View>
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
              style={{ paddingHorizontal: 3, paddingVertical: 3, alignItems: 'center' }}
            >
              <MarqueeText
                text={language === 'es' ? card.nameEs : card.nameEn}
                style={{ fontSize: sFont(7), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.1 }}
              />
            </LinearGradient>

            {duplicates > 0 && (
              <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: card.accentColor, borderRadius: 99, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <Text style={{ fontSize: sFont(6), fontWeight: '900', color: '#000' }}>x{duplicates + 1}</Text>
              </View>
            )}
            {isNew && !duplicates && (
              <Animated.View entering={FadeIn.duration(180)} style={{ position: 'absolute', top: 3, right: 3 }}>
                <View style={{ backgroundColor: '#D4A017', borderRadius: 99, width: 8, height: 8 }} />
              </Animated.View>
            )}
          </LinearGradient>
        ) : (
          /* Unowned event card — shows order number hint */
          <View style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: 'rgba(245,208,96,0.04)',
            borderWidth: 1,
            borderColor: 'rgba(245,208,96,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            borderStyle: 'dashed',
          }}>
            <Text style={{ fontSize: sFont(9), fontWeight: '800', color: 'rgba(245,208,96,0.20)', letterSpacing: 1 }}>
              {String(card.eventOrder ?? '').padStart(2, '0')}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// CollectionHubCard — premium collectible pack cover card
// ─────────────────────────────────────────────
const PACK_IMAGES = {
  inicial:  require('../../assets/packs/sobre_biblico_pack.png'),
  pascua:   require('../../assets/packs/pack_pascua_pack.png'),
  milagros: require('../../assets/packs/pack_milagros_pack.png'),
  heroes:   require('../../assets/packs/pack_heroes_pack.png'),
} as const;

function CollectionHubCard({
  collectionId,
  title,
  subtitle,
  accentColor,
  gradientColors,
  ownedCount,
  totalCount,
  locked,
  newCount,
  showTicker,
  enterDelay,
  onPress,
  language,
  sFont,
}: {
  collectionId: 'inicial' | 'pascua' | 'milagros' | 'heroes' | 'secretas';
  title: string;
  subtitle: string;
  accentColor: string;
  gradientColors: [string, string, string];
  ownedCount: number;
  totalCount: number;
  locked?: boolean;
  newCount?: number;
  showTicker?: boolean;
  enterDelay: number;
  onPress: () => void;
  language: string;
  sFont: (n: number) => number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isSecret = collectionId === 'secretas';
  const packImage = isSecret ? null : PACK_IMAGES[collectionId];
  const progress = totalCount > 0 ? ownedCount / totalCount : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(enterDelay).duration(380)}
      style={[{
        marginBottom: 16,
        borderRadius: 20,
        shadowColor: accentColor,
        shadowOpacity: 0.65,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 5 },
        elevation: 14,
      }, animStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.963, { damping: 20, stiffness: 380 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 320 }); }}
      >
        <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: accentColor + '55' }}>

          {/* ── Background layers ── */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {isSecret ? (
            /* ── Cartas Secretas: mysterious dark + gold glow ── */
            <>
              {/* Central glow orb */}
              <View style={{
                position: 'absolute', right: 18, top: '50%', marginTop: -38,
                width: 76, height: 76, borderRadius: 38,
                backgroundColor: 'rgba(212,175,55,0.08)',
                shadowColor: '#D4AF37', shadowOpacity: 0.9, shadowRadius: 28, shadowOffset: { width: 0, height: 0 },
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 38 }}>✦</Text>
              </View>
              {/* Gold dust particles */}
              {([{ r: 62, t: 18, sz: 9 }, { r: 108, t: 62, sz: 7 }, { r: 72, t: 112, sz: 8 }, { r: 130, t: 28, sz: 6 }]).map((p, i) => (
                <Text key={i} style={{ position: 'absolute', right: p.r, top: p.t, fontSize: p.sz, color: 'rgba(212,175,55,0.45)' }}>✧</Text>
              ))}
              {/* Top shimmer line */}
              <View style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1.5, backgroundColor: 'rgba(212,175,55,0.35)' }} />
              <LinearGradient
                colors={['rgba(212,175,55,0.10)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 55 }}
              />
            </>
          ) : (
            /* ── Pack image: right side, fades into gradient ── */
            <>
              <Image
                source={packImage!}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%' }}
                resizeMode="cover"
              />
              {/* Left-to-right fade: gradient → transparent, hides image seam */}
              <LinearGradient
                colors={[gradientColors[0], gradientColors[0] + 'F0', gradientColors[0] + '88', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            </>
          )}

          {/* Diagonal gloss */}
          <LinearGradient
            colors={[accentColor + '14', 'transparent', accentColor + '08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* ── Content ── */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, width: '62%' }}>
            <Text style={{ fontSize: sFont(18), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 3 }} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ fontSize: sFont(12), color: accentColor + 'BB', marginBottom: 11 }} numberOfLines={1}>
              {subtitle}
            </Text>

            {/* Count pill + new badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <View style={{
                paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99,
                backgroundColor: accentColor + '22', borderWidth: 1, borderColor: accentColor + '44',
              }}>
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: accentColor }}>
                  {locked
                    ? (language === 'es' ? '🔒 Bloqueadas' : '🔒 Locked')
                    : `${ownedCount} / ${totalCount} ${language === 'es' ? 'cartas' : 'cards'}`}
                </Text>
              </View>
              {(newCount ?? 0) > 0 && (
                <View style={{
                  paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99,
                  backgroundColor: 'rgba(212,175,55,0.22)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.55)',
                }}>
                  <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#F5D060' }}>✨ {language === 'es' ? 'Nueva' : 'New'}</Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            {!locked && (
              <View style={{ height: 3.5, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 99, backgroundColor: accentColor }} />
              </View>
            )}
          </View>

          {/* Chevron */}
          <View style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
            <ChevronRight size={20} color={accentColor + '99'} />
          </View>

          {/* Bottom accent line */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, backgroundColor: accentColor + '70' }} />
        </View>

        {/* NOVEDAD ticker strip — attached below main card */}
        {showTicker && (
          <View style={{
            borderWidth: 1.5, borderTopWidth: 0,
            borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
            borderColor: accentColor + '55',
            backgroundColor: accentColor + '10',
            overflow: 'hidden',
          }}>
            <NovedadTicker accentColor={accentColor + 'CC'} />
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
    const t0 = Date.now();
    console.log('[Cards/Album] Screen mounted');
    return () => {
      console.log(`[Cards/Album] Screen unmounted after ${Date.now() - mountTimeRef.current}ms`);
    };
  }, []);

  const [selectedCard, setSelectedCard] = useState<BiblicalCard | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<number>(0);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [rarityFilter, setRarityFilter] = useState<CardRarity | null>(null);

  const updateUser = useAppStore((s) => s.updateUser);

  const [collectionRewardModal, setCollectionRewardModal] = useState<{
    collectionName: string;
    secretCardId: string;
    bonusPoints: number;
  } | null>(null);
  const claimedThisSession = useRef<Set<string>>(new Set());

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
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  // On every focus: kick off collection downloads + preload owned card images.
  // This ensures newly acquired cards are cached quickly when returning from pack opening.
  useFocusEffect(
    useCallback(() => {
      console.log('[Cards/Album] Focus — kicking off preloads');
      downloadCollection('inicial');
      downloadCollection('pascua');
      downloadCollection('milagros');
      downloadCollection('heroes');
      const ownedIds = cardInventory.filter((c) => c.owned).map((c) => c.cardId);
      if (ownedIds.length > 0) preloadOwnedCardImages(ownedIds);
    }, [cardInventory])
  );

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

  // Milagros 2026 event cards in chronological order
  const milagrosCards = getEventSetCards('milagros_2026');

  // Héroes de la Fe 2026 event cards in chronological order
  const heroesCards = getEventSetCards('heroes_2026').filter((c) => c.albumGroup === 'heroes_2026');

  // Secret reward cards (albumGroup: 'secret_rewards')
  const secretCardIds = SECRET_REWARD_IDS;

  // ── Collection completion detection ─────────────────────────────────────────
  // Runs whenever cardInventory changes. If the pascua collection just became
  // complete and the reward hasn't been claimed yet, call the backend once and
  // show the celebration modal.
  const PASCUA_CARD_IDS = pascuaCards.map((c) => c.id);
  useEffect(() => {
    if (!userId || cardInventory.length === 0) return;
    const ownedIds = cardInventory.filter((c) => c.owned).map((c) => c.cardId);
    const allPascuaOwned = PASCUA_CARD_IDS.every((id) => ownedIds.includes(id));
    if (!allPascuaOwned) return;
    // Skip if already triggered this session
    if (claimedThisSession.current.has('pascua_2026')) return;
    // Skip if user already has the secret card (means reward was previously granted)
    if (ownedIds.includes('jesus_resucitado')) return;
    // Mark as attempted so we don't re-fire
    claimedThisSession.current.add('pascua_2026');
    // Call backend to grant reward
    gamificationApi.claimCollectionCardReward({
      userId,
      collectionId: 'pascua_2026',
      ownedCardIds: ownedIds,
    }).then((result) => {
      if (result.alreadyClaimed) return; // Silently ignore — already got it
      if (result.success && result.secretCardId) {
        // Refresh card inventory so the new card appears
        queryClient.invalidateQueries({ queryKey: ['biblical-cards', userId] });
        // Award points in local state
        if (result.pointsAwarded) {
          updateUser({ points: (useAppStore.getState().user?.points ?? 0) + result.pointsAwarded });
        }
        // Show celebration modal
        setCollectionRewardModal({
          collectionName: language === 'es' ? 'Historia de Pascua' : 'Easter Story',
          secretCardId: result.secretCardId,
          bonusPoints: result.pointsAwarded ?? 1000,
        });
      }
    }).catch(() => {
      // Silently fail — don't break the user experience
      claimedThisSession.current.delete('pascua_2026');
    });
  }, [cardInventory, userId]);

  // Milagros 2026 collection completion detection
  const MILAGROS_CARD_IDS = milagrosCards.map((c) => c.id);
  useEffect(() => {
    if (!userId || cardInventory.length === 0) return;
    const ownedIds = cardInventory.filter((c) => c.owned).map((c) => c.cardId);
    const allMilagrosOwned = MILAGROS_CARD_IDS.every((id) => ownedIds.includes(id));
    if (!allMilagrosOwned) return;
    if (claimedThisSession.current.has('milagros_2026')) return;
    if (ownedIds.includes('reino_de_dios')) return;
    claimedThisSession.current.add('milagros_2026');
    gamificationApi.claimCollectionCardReward({
      userId,
      collectionId: 'milagros_2026',
      ownedCardIds: ownedIds,
    }).then((result) => {
      if (result.alreadyClaimed) return;
      if (result.success && result.secretCardId) {
        queryClient.invalidateQueries({ queryKey: ['biblical-cards', userId] });
        if (result.pointsAwarded) {
          updateUser({ points: (useAppStore.getState().user?.points ?? 0) + result.pointsAwarded });
        }
        setCollectionRewardModal({
          collectionName: language === 'es' ? 'Milagros de Jesús' : 'Miracles of Jesus',
          secretCardId: result.secretCardId,
          bonusPoints: result.pointsAwarded ?? 2000,
        });
      }
    }).catch(() => {
      claimedThisSession.current.delete('milagros_2026');
    });
  }, [cardInventory, userId]);
  // Héroes de la Fe 2026 collection completion detection
  const HEROES_CARD_IDS = heroesCards.map((c) => c.id);
  useEffect(() => {
    if (!userId || cardInventory.length === 0) return;
    const ownedIds = cardInventory.filter((c) => c.owned).map((c) => c.cardId);
    const allHeroesOwned = HEROES_CARD_IDS.every((id) => ownedIds.includes(id));
    if (!allHeroesOwned) return;
    if (claimedThisSession.current.has('heroes_2026')) return;
    if (ownedIds.includes('jesus_autor_fe')) return;
    claimedThisSession.current.add('heroes_2026');
    gamificationApi.claimCollectionCardReward({
      userId,
      collectionId: 'heroes_2026',
      ownedCardIds: ownedIds,
    }).then((result) => {
      if (result.alreadyClaimed) return;
      if (result.success && result.secretCardId) {
        queryClient.invalidateQueries({ queryKey: ['biblical-cards', userId] });
        if (result.pointsAwarded) {
          updateUser({ points: (useAppStore.getState().user?.points ?? 0) + result.pointsAwarded });
        }
        setCollectionRewardModal({
          collectionName: language === 'es' ? 'Héroes de la Fe' : 'Heroes of Faith',
          secretCardId: result.secretCardId,
          bonusPoints: result.pointsAwarded ?? 2500,
        });
      }
    }).catch(() => {
      claimedThisSession.current.delete('heroes_2026');
    });
  }, [cardInventory, userId]);
  // ────────────────────────────────────────────────────────────────────────────

  // Counts
  const standardOwnedCount = standardCardIds.filter((id) => {
    const entry = cardInventory.find((c) => c.cardId === id);
    return entry?.owned ?? false;
  }).length;

  const pascuaOwnedCount = pascuaCards.filter((c) => {
    const entry = cardInventory.find((inv) => inv.cardId === c.id);
    return entry?.owned ?? false;
  }).length;

  const milagrosOwnedCount = milagrosCards.filter((c) => {
    const entry = cardInventory.find((inv) => inv.cardId === c.id);
    return entry?.owned ?? false;
  }).length;

  const heroesOwnedCount = heroesCards.filter((c) => {
    const entry = cardInventory.find((inv) => inv.cardId === c.id);
    return entry?.owned ?? false;
  }).length;

  const secretOwnedCount = secretCardIds.filter((id) => {
    const entry = cardInventory.find((c) => c.cardId === id);
    return entry?.owned ?? false;
  }).length;

  // Overall progress — standard + pascua + milagros + heroes (secret cards are a bonus)
  const totalAllCards = standardCardIds.length + pascuaCards.length + milagrosCards.length + heroesCards.length;
  const ownedAllCards = standardOwnedCount + pascuaOwnedCount + milagrosOwnedCount + heroesOwnedCount;

  // Filtered standard card IDs based on rarity selector
  const filteredStandardIds = rarityFilter
    ? standardCardIds.filter((id) => BIBLICAL_CARDS[id]?.rarity === rarityFilter)
    : standardCardIds;

  // Filtered pascua cards based on rarity selector
  const filteredPascuaCards = rarityFilter
    ? pascuaCards.filter((c) => c.rarity === rarityFilter)
    : pascuaCards;

  // Filtered milagros cards based on rarity selector
  const filteredMilagrosCards = rarityFilter
    ? milagrosCards.filter((c) => c.rarity === rarityFilter)
    : milagrosCards;

  // Filtered heroes cards based on rarity selector
  const filteredHeroesCards = rarityFilter
    ? heroesCards.filter((c) => c.rarity === rarityFilter)
    : heroesCards;

  // Filtered secret cards based on rarity selector
  const filteredSecretIds = rarityFilter
    ? secretCardIds.filter((id) => BIBLICAL_CARDS[id]?.rarity === rarityFilter)
    : secretCardIds;

  // New card counts scoped to each collection
  const newStandardCount = cardInventory.filter((c) => c.isNew && c.owned && standardCardIds.includes(c.cardId)).length;
  const newPascuaCount = cardInventory.filter((c) => c.isNew && c.owned && pascuaCards.some((p) => p.id === c.cardId)).length;
  const newMilagrosCount = cardInventory.filter((c) => c.isNew && c.owned && milagrosCards.some((p) => p.id === c.cardId)).length;
  const newHeroesCount = cardInventory.filter((c) => c.isNew && c.owned && heroesCards.some((p) => p.id === c.cardId)).length;
  const newSecretCount = cardInventory.filter((c) => c.isNew && c.owned && secretCardIds.includes(c.cardId)).length;

  // New count for the currently-open collection
  const newCardCount = activeCollection === 'inicial'
    ? newStandardCount
    : activeCollection === 'pascua'
      ? newPascuaCount
      : activeCollection === 'milagros'
        ? newMilagrosCount
        : activeCollection === 'heroes'
          ? newHeroesCount
          : activeCollection === 'secretas'
            ? newSecretCount
            : 0;

  // First new card in current collection — used by banner tap
  const firstNewCardInCollection: BiblicalCard | null = (() => {
    if (activeCollection === 'inicial') {
      const id = standardCardIds.find((id) => cardInventory.find((c) => c.cardId === id && c.isNew && c.owned));
      return id ? (BIBLICAL_CARDS[id] ?? null) : null;
    }
    if (activeCollection === 'pascua') {
      return pascuaCards.find((card) => cardInventory.find((c) => c.cardId === card.id && c.isNew && c.owned)) ?? null;
    }
    if (activeCollection === 'milagros') {
      return milagrosCards.find((card) => cardInventory.find((c) => c.cardId === card.id && c.isNew && c.owned)) ?? null;
    }
    if (activeCollection === 'heroes') {
      return heroesCards.find((card) => cardInventory.find((c) => c.cardId === card.id && c.isNew && c.owned)) ?? null;
    }
    if (activeCollection === 'secretas') {
      const id = secretCardIds.find((id) => cardInventory.find((c) => c.cardId === id && c.isNew && c.owned));
      return id ? (BIBLICAL_CARDS[id] ?? null) : null;
    }
    return null;
  })();

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
      : activeCollection === 'milagros'
        ? 'Milagros de Jesús'
        : activeCollection === 'heroes'
          ? 'Héroes de la Fe'
          : activeCollection === 'secretas'
            ? (language === 'es' ? 'Cartas Secretas' : 'Secret Cards')
            : (language === 'es' ? 'Álbum Bíblico' : 'Biblical Album');

  const headerSubtitle = activeCollection === 'inicial'
    ? `${standardOwnedCount} / ${standardCardIds.length} ${language === 'es' ? 'cartas' : 'cards'}`
    : activeCollection === 'pascua'
      ? `${pascuaOwnedCount} / ${pascuaCards.length} ${language === 'es' ? 'cartas' : 'cards'}`
      : activeCollection === 'milagros'
        ? `${milagrosOwnedCount} / ${milagrosCards.length} ${language === 'es' ? 'cartas' : 'cards'}`
        : activeCollection === 'heroes'
          ? `${heroesOwnedCount} / ${heroesCards.length} ${language === 'es' ? 'cartas' : 'cards'}`
          : activeCollection === 'secretas'
            ? `${secretOwnedCount} / ${secretCardIds.length} ${language === 'es' ? 'cartas' : 'cards'}`
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

          {/* ── Collection cards ── */}
          <CollectionHubCard
            collectionId="inicial"
            title="Colección Inicial"
            subtitle={language === 'es' ? 'Las primeras cartas del álbum' : 'The first album cards'}
            accentColor="#6496FF"
            gradientColors={['#1A3A6B', '#0F2149', '#0A1530']}
            ownedCount={standardOwnedCount}
            totalCount={standardCardIds.length}
            newCount={newStandardCount}
            showTicker
            enterDelay={80}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCollection('inicial'); downloadCollection('inicial'); }}
            language={language}
            sFont={sFont}
          />

          <CollectionHubCard
            collectionId="pascua"
            title="Historia de Pascua"
            subtitle={language === 'es' ? '14 capítulos de la redención' : '14 chapters of redemption'}
            accentColor="#F5D060"
            gradientColors={['#5C1010', '#3D0A0A', '#200505']}
            ownedCount={pascuaOwnedCount}
            totalCount={pascuaCards.length}
            newCount={newPascuaCount}
            showTicker
            enterDelay={140}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCollection('pascua'); downloadCollection('pascua'); }}
            language={language}
            sFont={sFont}
          />

          <CollectionHubCard
            collectionId="milagros"
            title="Milagros de Jesús"
            subtitle={language === 'es' ? 'Señales y maravillas · 2026' : 'Signs and wonders · 2026'}
            accentColor="#60A5FA"
            gradientColors={['#040D1E', '#081630', '#040D1E']}
            ownedCount={milagrosOwnedCount}
            totalCount={milagrosCards.length}
            newCount={newMilagrosCount}
            enterDelay={200}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCollection('milagros'); downloadCollection('milagros'); }}
            language={language}
            sFont={sFont}
          />

          <CollectionHubCard
            collectionId="heroes"
            title="Héroes de la Fe"
            subtitle={language === 'es' ? 'Figuras épicas del Antiguo Testamento' : 'Epic figures of the Old Testament'}
            accentColor="#D4AF37"
            gradientColors={['#120E00', '#1E1800', '#120E00']}
            ownedCount={heroesOwnedCount}
            totalCount={heroesCards.length}
            newCount={newHeroesCount}
            enterDelay={260}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCollection('heroes'); downloadCollection('heroes'); }}
            language={language}
            sFont={sFont}
          />

          <CollectionHubCard
            collectionId="secretas"
            title={language === 'es' ? 'Cartas Secretas' : 'Secret Cards'}
            subtitle={language === 'es' ? 'Recompensas por completar colecciones' : 'Rewards for completing collections'}
            accentColor="#D4AF37"
            gradientColors={['#1A1200', '#0E0C00', '#0A0800']}
            ownedCount={secretOwnedCount}
            totalCount={secretCardIds.length}
            locked={secretOwnedCount === 0}
            newCount={newSecretCount}
            enterDelay={320}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCollection('secretas'); }}
            language={language}
            sFont={sFont}
          />

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

          {/* New cards banner — tappable, opens first new card directly */}
          {newCardCount > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 16 }}>
              <Pressable
                onPress={() => {
                  if (firstNewCardInCollection) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    openCard(firstNewCardInCollection);
                  }
                }}
              >
                <LinearGradient
                  colors={['rgba(212,175,55,0.22)', 'rgba(212,175,55,0.10)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(212,175,55,0.40)',
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
                  <ChevronRight size={16} color="rgba(245,208,96,0.70)" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
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
          ) : activeCollection === 'pascua' ? (
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
          ) : activeCollection === 'milagros' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
              {filteredMilagrosCards.map((card, index) => {
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
          ) : activeCollection === 'heroes' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
              {filteredHeroesCards.map((card, index) => {
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
          ) : (
            /* secretas */
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
              {filteredSecretIds.length === 0 ? (
                /* Empty state — no secret cards owned yet */
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 48, gap: 12 }}>
                  <Text style={{ fontSize: 40 }}>🔒</Text>
                  <Text style={{ fontSize: sFont(16), fontWeight: '700', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                    {language === 'es' ? 'Aún no tienes cartas secretas' : 'No secret cards yet'}
                  </Text>
                  <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 20 }}>
                    {language === 'es'
                      ? 'Completa una colección para desbloquear\nuna carta legendaria secreta.'
                      : 'Complete a collection to unlock\na secret legendary card.'}
                  </Text>
                </View>
              ) : (
                filteredSecretIds.map((cardId, index) => {
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
                })
              )}
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

      {/* ── Collection Completion Reward Modal ─────────────────────────── */}
      {collectionRewardModal && (
        <CollectionCompleteModal
          visible={!!collectionRewardModal}
          collectionName={collectionRewardModal.collectionName}
          secretCardId={collectionRewardModal.secretCardId}
          bonusPoints={collectionRewardModal.bonusPoints}
          onClose={() => setCollectionRewardModal(null)}
          onViewAlbum={() => {
            setCollectionRewardModal(null);
            setActiveCollection('secretas');
          }}
        />
      )}
    </View>
  );
}
