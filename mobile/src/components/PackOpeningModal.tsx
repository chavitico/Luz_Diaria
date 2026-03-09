/**
 * PackOpeningModal
 *
 * Premium pack opening animation — runs inside a single root-level Modal
 * mounted above all navigation layers in _layout.tsx.
 *
 * State machine (strictly sequential):
 *   idle → pack_appear → pack_ready → pack_open → card_back → card_flip → rarity_reveal → final
 *
 * Rarity-tiered reveal pacing:
 *   COMMON    — shake → small flash → immediate flip → soft neutral glow   ~700ms
 *   RARE      — shake → flash → show back → 300ms pause → flip → blue pulse  ~900ms
 *   EPIC      — shake → stronger flash → show back → purple aura → 600ms pause → flip → burst  ~1200ms
 *   LEGENDARY — shake → bright flash → show back → gold aura → 1000ms pause → particles → flip → explosion  ~1600ms
 *
 * Safety rules:
 *   - React Native Animated only (no Reanimated) — useNativeDriver: true throughout.
 *   - `active` ref guards every async callback.
 *   - skipToFinal() shows card immediately if any step throws.
 *   - All loops centralized in stopLoops().
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, ClipPath, Rect, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useScaledFont } from '@/lib/textScale';
import { useLanguage } from '@/lib/store';
import { BIBLICAL_CARDS, RARITY_CONFIG, type BiblicalCard } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';
import { resolveCardImageUriSync } from '@/lib/card-image-cache';

// ─── Summary thumbnail — focal-point artwork (mirrors album logic) ────────────
function SummaryCardThumb({ card, size }: { card: BiblicalCard; size: number }) {
  const focusX = card.imageFocusX ?? 0.5;
  const focusY = card.imageFocusY ?? 0.5;
  const [containerH, setContainerH] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageUri = resolveCardImageUriSync(card) ?? card.imageUrl;

  const OVERSIZE = 1.6;
  const oversizeH = containerH > 0 ? containerH * OVERSIZE : 0;
  const translateY = containerH > 0 ? (0.5 - focusY) * (oversizeH - containerH) : 0;
  const oversizeW = size * OVERSIZE;
  const translateX = (0.5 - focusX) * (oversizeW - size);

  return (
    <View
      style={{ width: size, borderRadius: 10, overflow: 'hidden', aspectRatio: 2 / 3 }}
      onLayout={(e) => setContainerH(e.nativeEvent.layout.height)}
    >
      {/* Gradient background while loading */}
      <LinearGradient
        colors={[card.gradientColors[0], card.gradientColors[2]]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {imageUri ? (
        <Animated.Image
          source={{ uri: imageUri }}
          onLoad={() => {
            setImageLoaded(true);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
          }}
          style={{
            opacity: fadeAnim,
            position: 'absolute',
            width: oversizeW,
            height: oversizeH > 0 ? oversizeH : undefined,
            ...(oversizeH === 0 ? { top: 0, bottom: 0 } : {
              top: (containerH - oversizeH) / 2 + translateY,
            }),
            left: (size - oversizeW) / 2 + translateX,
          }}
          resizeMode={oversizeH === 0 ? 'cover' : 'stretch'}
        />
      ) : null}
      {/* Bottom vignette */}
      <LinearGradient
        colors={['transparent', card.gradientColors[2] + 'CC']}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }}
      />
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'pack_appear'
  | 'pack_ready'
  | 'pack_zoom'     // tapped, zooming slightly, showing swipe hint
  | 'pack_tearing'  // user is dragging
  | 'pack_open'
  | 'card_back'
  | 'card_flip'
  | 'rarity_reveal'
  | 'final';

type PackType = 'sobre_biblico' | 'pack_pascua' | 'pack_milagros';

export interface PackOpeningModalProps {
  visible: boolean;
  packType: PackType | null;
  drawnCards: Array<{ cardId: string; wasNew: boolean }>;
  userPoints?: number;
  onClose: () => void;
  onViewAlbum: () => void;
  /** Called when user taps "Abrir otro sobre" — parent handles purchase logic */
  onOpenAnother?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W * 0.65, 280);
const CARD_H = CARD_W * 1.5;

const PACK_CONFIG: Record<PackType, {
  label: string;
  gradientTop: string;
  gradientBottom: string;
  borderColor: string;
  glowColor: string;
  emoji: string;
}> = {
  sobre_biblico: {
    label: 'Personajes Bíblicos',
    gradientTop: '#3D2800',
    gradientBottom: '#1A0F00',
    borderColor: '#D4A017',
    glowColor: '#FFD700',
    emoji: '📖',
  },
  pack_pascua: {
    label: 'Pack de Pascua',
    gradientTop: '#8B0000',
    gradientBottom: '#1A0000',
    borderColor: '#D4A017',
    glowColor: '#FFD700',
    emoji: '✝️',
  },
  pack_milagros: {
    label: 'Sobre de Milagros',
    gradientTop: '#0D1A38',
    gradientBottom: '#060C1A',
    borderColor: '#D4AF37',
    glowColor: '#D4AF37',
    emoji: '✨',
  },
};

// ─── Irregular Tear Path Generator ──────────────────────────────────────────
// Generates a polyline of points that creates a subtle irregular tear seam.
// Points are evenly spaced horizontally; Y offsets are small (±3px).
// Generated once per width so it stays consistent during the opening sequence.
function generateTearPoints(width: number, baseY: number): string {
  // 10 segments → 11 x-positions
  const offsets = [0, 2, -1, 3, -2, 1, -3, 2, -1, 1, 0]; // subtle irregularity
  const segW = width / (offsets.length - 1);
  return offsets
    .map((dy, i) => `${(i * segW).toFixed(1)},${(baseY + dy).toFixed(1)}`)
    .join(' ');
}

// Translate a polyline points string so that baseY maps to localY
function translateTearPoints(points: string, baseY: number, localY: number): string {
  return points
    .split(' ')
    .map(pt => {
      const [x, y] = pt.split(',').map(Number);
      return `${x.toFixed(1)},${(y - baseY + localY).toFixed(1)}`;
    })
    .join(' ');
}

// Glow ring colors per rarity [inner, outer]
const RARITY_GLOW_COLORS: Record<string, [string, string]> = {
  common:    ['#4B5563', '#1F2937'],
  rare:      ['#3B82F6', '#1D4ED8'],
  epic:      ['#A855F7', '#7C3AED'],
  legendary: ['#F59E0B', '#D97706'],
};

// Aura color for the pre-flip suspense backdrop
const RARITY_AURA_COLORS: Record<string, string> = {
  common:    'transparent',
  rare:      'rgba(59,130,246,0.18)',
  epic:      'rgba(168,85,247,0.22)',
  legendary: 'rgba(245,158,11,0.28)',
};

// Flash peak opacity per rarity
const RARITY_FLASH_PEAK: Record<string, number> = {
  common:    0.45,
  rare:      0.70,
  epic:      0.88,
  legendary: 1.0,
};

// Pre-flip suspense pause duration (ms)
const RARITY_PAUSE_MS: Record<string, number> = {
  common:    0,
  rare:      300,
  epic:      600,
  legendary: 1000,
};

// Glow peak opacity per rarity
const RARITY_GLOW_PEAK: Record<string, number> = {
  common:    0.25,
  rare:      0.55,
  epic:      0.72,
  legendary: 0.88,
};

// Number of particle dots for legendary burst
const PARTICLE_COUNT = 6;

// ─── Per-collection pack & card-back assets (local PNGs — transparent/floating look) ──────
// Optimized to 512x768 (~400-800KB), preserving RGBA alpha channel for the no-background effect.
// cardBackDelayMs = minimum ms to hold card back visible AFTER the image is ready.

const PACK_ASSETS: Record<PackType, {
  pack: ImageSourcePropType;
  cardBack: ImageSourcePropType;
  glowColor: string;
  /** Minimum ms to hold card back visible after image loads before flipping to front */
  cardBackDelayMs: number;
}> = {
  sobre_biblico: {
    pack:     require('../../assets/packs/sobre_biblico_pack.png') as ImageSourcePropType,
    cardBack: require('../../assets/packs/sobre_biblico_card_back.png') as ImageSourcePropType,
    glowColor: '#D4A017',
    cardBackDelayMs: 1500,
  },
  pack_pascua: {
    pack:     require('../../assets/packs/pack_pascua_pack.png') as ImageSourcePropType,
    cardBack: require('../../assets/packs/pack_pascua_card_back.png') as ImageSourcePropType,
    glowColor: '#FFD700',
    cardBackDelayMs: 1500,
  },
  pack_milagros: {
    pack:     require('../../assets/packs/pack_milagros_pack.png') as ImageSourcePropType,
    cardBack: require('../../assets/packs/pack_milagros_card_back.png') as ImageSourcePropType,
    glowColor: '#60A5FA',
    cardBackDelayMs: 1500,
  },
};

// ─── Animated Pack Visual ────────────────────────────────────────────────────

/** Full pack — shown during idle/zoom/tearing phases */
function PackVisual({
  packType,
  shakeAnim,
  scaleAnim,
  onImageLoad,
}: {
  packType: PackType;
  shakeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onImageLoad?: () => void;
}) {
  const assets = PACK_ASSETS[packType];
  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-7deg', '0deg', '7deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate }, { scale: scaleAnim }],
        shadowColor: assets.glowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.95,
        shadowRadius: 36,
        elevation: 20,
        width: CARD_W,
        height: CARD_H,
      }}
    >
      {/* Local asset — JPG for fast decode */}
      <Image
        source={assets.pack}
        style={{ position: 'absolute', width: CARD_W, height: CARD_H }}
        resizeMode="contain"
        onLoad={onImageLoad}
      />
      {/* No foil overlay — transparent PNG floats naturally */}
    </Animated.View>
  );
}

/** Pack half — left or right fragment during tear animation */
function PackHalf({
  packType,
  side,
  translateX,
  translateY,
  rotate,
  glowColor,
}: {
  packType: PackType;
  side: 'left' | 'right';
  translateX: Animated.Value;
  translateY: Animated.Value;
  rotate: Animated.Value;
  glowColor: string;
}) {
  const assets = PACK_ASSETS[packType];
  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: side === 'left' ? ['-35deg', '-15deg', '0deg'] : ['0deg', '15deg', '35deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        transform: [
          { translateX },
          { translateY },
          { rotate: rotateInterp },
        ],
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        elevation: 20,
      }}
    >
      <View style={{ width: CARD_W, height: CARD_H, overflow: 'hidden' }}>
        {/* Pack artwork — same image, clipped to this half */}
        <Image
          source={PACK_ASSETS[packType].pack}
          style={{ width: CARD_W, height: CARD_H } as any}
          resizeMode="contain"
        />
        {/* Foil sheen overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'transparent', 'rgba(255,255,255,0.03)', 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', inset: 0 }}
        />
      </View>
    </Animated.View>
  );
}

// ─── Card Back ────────────────────────────────────────────────────────────────

function CardBack({
  packType,
  onImageLoad,
}: {
  packType: PackType;
  onImageLoad?: () => void;
}) {
  const assets = PACK_ASSETS[packType];
  return (
    <View style={[styles.cardBack, { overflow: 'visible', backgroundColor: 'transparent' }]}>
      {/* Optimized PNG — transparent background, floats on dark backdrop */}
      <Image
        source={assets.cardBack}
        style={{ position: 'absolute', width: '100%', height: '100%' } as any}
        resizeMode="contain"
        onLoad={onImageLoad}
      />
    </View>
  );
}

// ─── Rarity Shimmer ───────────────────────────────────────────────────────────

function RarityShimmer({ rarity, shimmerAnim }: { rarity: string; shimmerAnim: Animated.Value }) {
  if (rarity !== 'epic' && rarity !== 'legendary') return null;
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_W * 1.5, CARD_W * 1.5],
  });
  const color = rarity === 'legendary' ? 'rgba(251,191,36,0.38)' : 'rgba(168,85,247,0.32)';
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: CARD_W * 0.42,
        transform: [{ translateX }, { skewX: '-20deg' }],
        backgroundColor: color,
      }}
    />
  );
}

// ─── Legendary Particles ──────────────────────────────────────────────────────

interface ParticleProps {
  index: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

function LegendaryParticle({ index, translateX, translateY, opacity }: ParticleProps) {
  const size = 6 + (index % 3) * 3;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: index % 2 === 0 ? '#FCD34D' : '#FBBF24',
        transform: [{ translateX }, { translateY }],
        opacity,
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PackOpeningModal({
  visible,
  packType,
  drawnCards,
  userPoints,
  onClose,
  onViewAlbum,
  onOpenAnother,
}: PackOpeningModalProps) {
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();

  // ── Multi-card index — which card in drawnCards we're currently revealing ──
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const drawnCard = drawnCards[currentCardIndex] ?? null;
  const isLastCard = currentCardIndex >= drawnCards.length - 1;
  const totalCards = drawnCards.length;
  // Summary screen shown after all cards revealed (multi-card packs only)
  const [showSummary, setShowSummary] = useState(false);

  // ── Prefetch all card images as soon as the pack is opened ──
  // This warms the RN image cache so artwork appears instantly during reveal
  // and in the summary screen.
  useEffect(() => {
    if (!visible || drawnCards.length === 0) return;
    drawnCards.forEach(({ cardId }) => {
      const card = BIBLICAL_CARDS[cardId];
      if (card?.imageUrl) {
        (Image as any).prefetch(card.imageUrl).catch(() => {});
      }
    });
  }, [visible, drawnCards]);

  // ── Warm the local pack PNG into the image cache before the animation starts ──
  // resolveAssetSource extracts the URI that RN uses internally for require() assets,
  // then prefetch forces the decoder to process it so it's ready instantly.
  useEffect(() => {
    if (!packType) return;
    try {
      const packAsset = PACK_ASSETS[packType];
      const packUri = (Image as any).resolveAssetSource?.(packAsset.pack)?.uri;
      const backUri = (Image as any).resolveAssetSource?.(packAsset.cardBack)?.uri;
      if (packUri) (Image as any).prefetch(packUri).catch(() => {});
      if (backUri) (Image as any).prefetch(backUri).catch(() => {});
    } catch { /* ignore */ }
  }, [packType]);

  // ── Stable animation values ──
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const packScale       = useRef(new Animated.Value(0.3)).current;
  const packOpacity     = useRef(new Animated.Value(0)).current;
  const packFloat       = useRef(new Animated.Value(0)).current;
  const packShake       = useRef(new Animated.Value(0)).current;
  const packBump        = useRef(new Animated.Value(1)).current;
  const flashOpacity    = useRef(new Animated.Value(0)).current;
  const auraOpacity     = useRef(new Animated.Value(0)).current;  // pre-flip aura
  const cardScale       = useRef(new Animated.Value(0)).current;
  const cardScaleX      = useRef(new Animated.Value(1)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const glowOpacity     = useRef(new Animated.Value(0)).current;
  const glowScale       = useRef(new Animated.Value(0.6)).current;
  const glowPulse       = useRef(new Animated.Value(1)).current;
  const shimmerAnim     = useRef(new Animated.Value(0)).current;
  const celebOpacity    = useRef(new Animated.Value(0)).current;
  const actionsOpacity  = useRef(new Animated.Value(0)).current;

  // ── Tear gesture animation values ──
  // Envelope-style: horizontal drag tears a flap off the top of the pack.
  // TEAR_Y_RATIO = position of tear line as fraction of pack height from top (e.g. 0.12 = ~1 "cm")
  const packZoomScale      = useRef(new Animated.Value(1)).current;  // zooms on tap
  const hintOpacity        = useRef(new Animated.Value(0)).current;  // "Desliza para abrir" hint
  const innerGlow          = useRef(new Animated.Value(0)).current;  // light leak along tear line
  const innerGlowScale     = useRef(new Animated.Value(1)).current;
  // Top flap (the portion above the tear line)
  const flapTranslateY     = useRef(new Animated.Value(0)).current;  // flap lifts upward
  const flapRotateX        = useRef(new Animated.Value(0)).current;  // flap curls back (perspective hint)
  const flapOpacity        = useRef(new Animated.Value(1)).current;
  // Tear-line progress — 0 = sealed, 1 = fully torn across
  const tearProgress       = useRef(new Animated.Value(0)).current;  // drives tear line width mask
  const packBodyOpacity    = useRef(new Animated.Value(1)).current;  // body fades on final burst
  const fullPackOpacityTear = useRef(new Animated.Value(1)).current; // hides full pack when halves active
  const packHalvesOpacity  = useRef(new Animated.Value(0)).current;  // shows flap/body layers
  const dragOffsetRef      = useRef(0);                              // live drag distance (not animated)
  const phaseRef           = useRef<Phase>('idle');                  // sync ref for gesture handler

  // Legendary particles — 6 particles, each with x/y/opacity
  const particleX   = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;
  const particleY   = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;
  const particleOp  = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;

  const [phase, setPhase]       = useState<Phase>('idle');
  const [showCard, setShowCard] = useState(false);
  const [cardFace, setCardFace] = useState<'back' | 'front'>('back');

  // ── Asset-ready gates ──
  // packImageReady: true once the pack JPG onLoad fires — animation only starts after this
  // cardBackReady: true once the card-back JPG onLoad fires — flip only starts after this
  const packImageReadyRef  = useRef(false);
  const cardBackReadyRef   = useRef(false);
  const cardBackReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timing instrumentation
  const t_packVisible  = useRef(0);
  const t_packReady    = useRef(0);
  const t_cardBackShow = useRef(0);
  const t_cardBackReady = useRef(0);

  // Irregular tear line — SVG clip width (0→CARD_W), driven by tearProgress listener
  const TEAR_BASE_Y = CARD_H * 0.22;  // ~22% down — midpoint between original and previous position
  const SVG_H = 20; // SVG container height; center line at y=10
  // Tear line only covers the center 70% of the pack width (15%–85%) so edges look clean
  const TEAR_MARGIN = CARD_W * 0.15;
  const TEAR_LINE_W = CARD_W * 0.70;
  const tearPointsAbs  = useRef(generateTearPoints(TEAR_LINE_W, TEAR_BASE_Y)).current;
  const tearPointsLocal = useRef(translateTearPoints(tearPointsAbs, TEAR_BASE_Y, 10)).current;
  const [tearClipW, setTearClipW] = useState(0);
  const glowClipW = useRef(0);

  // Keep phaseRef in sync so PanResponder gesture handler can read current phase
  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const floatLoop   = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop   = useRef<Animated.CompositeAnimation | null>(null);
  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);
  const active      = useRef(false);
  const soundRef    = useRef<Audio.Sound | null>(null);
  const revealSoundRef = useRef<Audio.Sound | null>(null);
  const cardBackDelayMsRef = useRef(0);

  const card = drawnCard ? (BIBLICAL_CARDS[drawnCard.cardId] ?? null) : null;
  const rarity = card?.rarity ?? 'common';
  const glowColors  = RARITY_GLOW_COLORS[rarity]  ?? RARITY_GLOW_COLORS.common;
  const glowPeak    = RARITY_GLOW_PEAK[rarity]     ?? 0.25;
  const flashPeak   = RARITY_FLASH_PEAK[rarity]    ?? 0.45;
  const pauseMs     = RARITY_PAUSE_MS[rarity]      ?? 0;
  const auraColor   = RARITY_AURA_COLORS[rarity]   ?? 'transparent';
  const cardBackDelayMs = packType ? (PACK_ASSETS[packType].cardBackDelayMs ?? 0) : 0;
  cardBackDelayMsRef.current = cardBackDelayMs;
  const effectivePauseMs = pauseMs;

  // ── Stop all loops ──
  const stopLoops = useCallback(() => {
    floatLoop.current?.stop();   floatLoop.current   = null;
    pulseLoop.current?.stop();   pulseLoop.current   = null;
    shimmerLoop.current?.stop(); shimmerLoop.current = null;
  }, []);

  // ── Hard reset all values ──
  const resetAll = useCallback(() => {
    active.current = false;
    stopLoops();
    // Unload any playing sound
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    if (revealSoundRef.current) {
      revealSoundRef.current.unloadAsync().catch(() => {});
      revealSoundRef.current = null;
    }
    backdropOpacity.setValue(0);
    packScale.setValue(0.3);
    packOpacity.setValue(0);
    packFloat.setValue(0);
    packShake.setValue(0);
    packBump.setValue(1);
    flashOpacity.setValue(0);
    auraOpacity.setValue(0);
    cardScale.setValue(0);
    cardScaleX.setValue(1);
    cardOpacity.setValue(0);
    glowOpacity.setValue(0);
    glowScale.setValue(0.6);
    glowPulse.setValue(1);
    shimmerAnim.setValue(0);
    celebOpacity.setValue(0);
    actionsOpacity.setValue(0);
    // Tear values reset
    packZoomScale.setValue(1);
    hintOpacity.setValue(0);
    innerGlow.setValue(0);
    innerGlowScale.setValue(1);
    flapTranslateY.setValue(0);
    flapRotateX.setValue(0);
    flapOpacity.setValue(1);
    tearProgress.setValue(0);
    packBodyOpacity.setValue(1);
    packHalvesOpacity.setValue(0);
    fullPackOpacityTear.setValue(1);
    dragOffsetRef.current = 0;
    phaseRef.current = 'idle';
    particleX.forEach(v => v.setValue(0));
    particleY.forEach(v => v.setValue(0));
    particleOp.forEach(v => v.setValue(0));
    setShowCard(false);
    setCardFace('back');
    setTearClipW(0);
    glowClipW.current = 0;
    setCurrentCardIndex(0);
    setShowSummary(false);
    packImageReadyRef.current = false;
    cardBackReadyRef.current = false;
    if (cardBackReadyTimer.current) { clearTimeout(cardBackReadyTimer.current); cardBackReadyTimer.current = null; }
  }, [stopLoops]);

  // ── Reset only card animation values (for subsequent cards in a multi-card pack) ──
  const resetCardOnly = useCallback(() => {
    stopLoops();
    flashOpacity.setValue(0);
    auraOpacity.setValue(0);
    cardScale.setValue(0);
    cardScaleX.setValue(1);
    cardOpacity.setValue(0);
    glowOpacity.setValue(0);
    glowScale.setValue(0.6);
    glowPulse.setValue(1);
    shimmerAnim.setValue(0);
    celebOpacity.setValue(0);
    actionsOpacity.setValue(0);
    particleX.forEach(v => v.setValue(0));
    particleY.forEach(v => v.setValue(0));
    particleOp.forEach(v => v.setValue(0));
    setShowCard(false);
    setCardFace('back');
  }, [stopLoops]);

  // ── Sync tearProgress → tearClipW for SVG glow line ──
  useEffect(() => {
    const id = tearProgress.addListener(({ value }) => {
      const w = value * TEAR_LINE_W;
      glowClipW.current = w;
      setTearClipW(w);
    });
    return () => tearProgress.removeListener(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Emergency skip to final ──
  const skipToFinal = useCallback(() => {
    console.log('[PackReveal] skipToFinal — showing static card');
    stopLoops();
    cardScale.setValue(1);
    cardScaleX.setValue(1);
    cardOpacity.setValue(1);
    glowOpacity.setValue(glowPeak);
    glowScale.setValue(1);
    actionsOpacity.setValue(1);
    celebOpacity.setValue(1);
    auraOpacity.setValue(0);
    setShowCard(true);
    setCardFace('front');
    setPhaseSync('final');
  }, [glowPeak, stopLoops]);

  // ── Entry — fires when visible becomes true OR when currentCardIndex advances ──
  useEffect(() => {
    if (!visible || !packType || !drawnCard) {
      resetAll();
      setPhaseSync('idle');
      return;
    }

    // Subsequent cards in a multi-card pack: skip pack animation, go straight to card reveal
    if (currentCardIndex > 0) {
      resetCardOnly();
      cardBackReadyRef.current = false;
      active.current = true;
      setPhaseSync('card_back');
      setShowCard(true);
      t_cardBackShow.current = Date.now();
      console.log('[PackReveal] next_card_reveal', currentCardIndex);

      // Play card reveal sound for each subsequent card
      Audio.Sound.createAsync(
        require('../../assets/audio/revelacion_carta.m4a'),
        { shouldPlay: true, volume: 1.0 }
      ).then(({ sound }) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      }).catch(() => {});

      // Wait for card-back image to be ready, then flip after minimum display time
      // The card-back onLoad fires handleCardBackLoad which sets the timer
      // Fallback: if onLoad hasn't fired in 3s, flip anyway
      const fallback = setTimeout(() => {
        if (!active.current) return;
        if (!cardBackReadyRef.current) {
          cardBackReadyRef.current = true;
          console.log('[PackReveal] card_back_fallback_flip (next card)');
        }
        startCardFlip();
      }, 3000);
      return () => {
        clearTimeout(fallback);
        if (cardBackReadyTimer.current) { clearTimeout(cardBackReadyTimer.current); cardBackReadyTimer.current = null; }
        active.current = false;
        stopLoops();
      };
    }

    // First card: full pack open animation
    resetAll();
    active.current = true;
    packImageReadyRef.current = false;
    t_packVisible.current = Date.now();
    setPhaseSync('pack_appear');
    console.log('[PackReveal] pack_appear_start');

    // Start backdrop fade immediately — the pack JPG loads while backdrop fades
    Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();

    // Preload sounds immediately so they're ready when user taps
    Audio.Sound.createAsync(
      require('../../assets/audio/sonido_sobre_abriendo.m4a'),
      { shouldPlay: false, volume: 1.0 }
    ).then(({ sound }) => {
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    }).catch(() => {});

    Audio.Sound.createAsync(
      require('../../assets/audio/revelacion_carta.m4a'),
      { shouldPlay: false, volume: 1.0 }
    ).then(({ sound }) => {
      revealSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (revealSoundRef.current === sound) revealSoundRef.current = null;
        }
      });
    }).catch(() => {});

    return () => {
      active.current = false;
      stopLoops();
    };
  }, [visible, packType, currentCardIndex]);

  // ── handlePackImageLoad — fires when the pack JPG onLoad triggers ──
  // Only now do we spring the pack in and transition to pack_ready.
  const handlePackImageLoad = useCallback(() => {
    if (packImageReadyRef.current) return; // guard double-fire
    packImageReadyRef.current = true;
    t_packReady.current = Date.now();
    console.log(`[PackReveal] pack_image_ready (+${t_packReady.current - t_packVisible.current}ms)`);
    if (!active.current) return;
    try {
      Animated.parallel([
        Animated.spring(packScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(packOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) return;
        setPhaseSync('pack_ready');
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(packFloat, { toValue: -6, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(packFloat, { toValue: 6,  duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        floatLoop.current = loop;
        loop.start();
      });
    } catch {
      skipToFinal();
    }
  }, []);

  // ── handleCardBackLoad — fires when the card-back JPG onLoad triggers ──
  // Starts the minimum visible time timer; flip only happens after both
  // the image is loaded AND the minimum display time has elapsed.
  const handleCardBackLoad = useCallback(() => {
    if (cardBackReadyRef.current) return;
    cardBackReadyRef.current = true;
    t_cardBackReady.current = Date.now();
    const elapsed = t_cardBackReady.current - t_cardBackShow.current;
    console.log(`[PackReveal] card_back_image_ready (+${elapsed}ms from show)`);
    if (!active.current) return;
    // The cardBackDelayMs is measured from when the image becomes VISIBLE, not from pack-open
    // So we use it as a minimum hold time after the image loads
    const holdMs = Math.max(0, cardBackDelayMsRef.current - elapsed);
    console.log(`[PackReveal] card_back_hold_ms=${holdMs}`);
    cardBackReadyTimer.current = setTimeout(() => {
      if (!active.current) return;
      startCardFlip();
    }, holdMs);
  }, []);



  // ── Trigger the actual tear/open sequence (fires after threshold reached) ──
  const triggerTear = useCallback(() => {
    if (!active.current) return;
    setPhaseSync('pack_open');
    console.log('[PackReveal] pack_open_started via tear');

    stopLoops();

    // Fire preloaded sound instantly
    if (soundRef.current) {
      soundRef.current.playAsync().catch(() => {});
    } else {
      Audio.Sound.createAsync(
        require('../../assets/audio/sonido_sobre_abriendo.m4a'),
        { shouldPlay: true, volume: 1.0 }
      ).then(({ sound }) => {
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            if (soundRef.current === sound) soundRef.current = null;
          }
        });
      }).catch(() => {});
    }

    // Fire card reveal sound 790ms after tear
    setTimeout(() => {
      if (!active.current) return;
      if (revealSoundRef.current) {
        revealSoundRef.current.playAsync().catch(() => {});
      } else {
        Audio.Sound.createAsync(
          require('../../assets/audio/revelacion_carta.m4a'),
          { shouldPlay: true, volume: 1.0 }
        ).then(({ sound }) => {
          revealSoundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              if (revealSoundRef.current === sound) revealSoundRef.current = null;
            }
          });
        }).catch(() => {});
      }
    }, 790);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Envelope tear: top flap flies up, body stays, then flash + card
    const FLAP_H = CARD_H * 0.22; // height of the top flap — matches TEAR_BASE_Y
    Animated.parallel([
      // Flap flies up and off screen
      Animated.timing(flapTranslateY, { toValue: -(CARD_H * 0.6), duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(flapRotateX,   { toValue: 1,                 duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(flapOpacity,   { toValue: 0,                 duration: 280, delay: 80, useNativeDriver: true }),
      // Tear progress completes to full width
      Animated.timing(tearProgress,  { toValue: 1,                 duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      // Body fades as flash takes over
      Animated.timing(packBodyOpacity, { toValue: 0, duration: 200, delay: 200, useNativeDriver: true }),
      // Full pack hidden immediately
      Animated.timing(fullPackOpacityTear, { toValue: 0, duration: 60, useNativeDriver: true }),
      // Big light flash bursting from tear line
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: flashPeak * 1.2, duration: 80,  useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0,               duration: 220, useNativeDriver: true }),
      ]),
      // Inner glow burst along tear line
      Animated.sequence([
        Animated.timing(innerGlow,      { toValue: 1,  duration: 80,  useNativeDriver: true }),
        Animated.timing(innerGlow,      { toValue: 0,  duration: 320, useNativeDriver: true }),
      ]),
      Animated.spring(innerGlowScale, { toValue: 2.2, tension: 60, friction: 5, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!active.current || !finished) return;
      console.log('[PackReveal] pack_open_completed');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      cardBackReadyRef.current = false;
      t_cardBackShow.current = Date.now();
      setShowCard(true);
      setCardFace('back');
      setPhaseSync('card_back');
      // Flip is now triggered by handleCardBackLoad (image onLoad) + minimum hold timer.
      // Fallback: if image never fires onLoad, flip after 4s.
      const fallback = setTimeout(() => {
        if (!active.current) return;
        if (!cardBackReadyRef.current) {
          cardBackReadyRef.current = true;
          console.log('[PackReveal] card_back_fallback_flip');
          startCardFlip();
        }
      }, 4000);
      // Store fallback so resetAll can clear it (minor: timeout stored in closure only)
      void fallback;
    });
  }, [flashPeak, stopLoops]);

  // ── Pack tap — zooms pack and transitions to swipe mode ──
  const handlePackTap = useCallback(() => {
    if (phaseRef.current !== 'pack_ready') return;
    setPhaseSync('pack_zoom');
    console.log('[PackReveal] pack_tapped — zooming');

    stopLoops();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Zoom pack slightly
    Animated.spring(packZoomScale, {
      toValue: 1.06,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Show swipe hint
    Animated.timing(hintOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Flap/body layers are always opacity 1; hide the full single-layer pack
    fullPackOpacityTear.setValue(0);
  }, [stopLoops]);

  // ── PanResponder for swipe-to-tear gesture ──
  const tearPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => phaseRef.current === 'pack_zoom' || phaseRef.current === 'pack_tearing',
      onMoveShouldSetPanResponder: (_, gs) =>
        (phaseRef.current === 'pack_zoom' || phaseRef.current === 'pack_tearing') && Math.abs(gs.dx) > 4,
      onPanResponderGrant: () => {
        if (phaseRef.current !== 'pack_zoom') return;
        setPhaseSync('pack_tearing');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      onPanResponderMove: (_, gs) => {
        if (phaseRef.current !== 'pack_tearing') return;

        const dx = gs.dx;
        const absDx = Math.abs(dx);
        dragOffsetRef.current = dx;

        // Progress 0→1 based on drag vs threshold
        const TEAR_THRESHOLD = CARD_W * 0.4;
        const progress = Math.min(absDx / TEAR_THRESHOLD, 1);

        // Top flap lifts as user drags — envelope opening feel
        flapTranslateY.setValue(-progress * 18);
        flapRotateX.setValue(progress * 0.3);
        tearProgress.setValue(progress);

        // Inner glow grows with drag
        innerGlow.setValue(progress * 0.6);
        innerGlowScale.setValue(1 + progress * 0.3);
      },
      onPanResponderRelease: (_, gs) => {
        if (phaseRef.current !== 'pack_tearing') return;

        const TEAR_THRESHOLD = CARD_W * 0.4;
        const absDx = Math.abs(gs.dx);

        if (absDx >= TEAR_THRESHOLD) {
          // Threshold reached — tear it open!
          triggerTear();
        } else {
          // Cancelled — reset smoothly
          setPhaseSync('pack_zoom');
          Animated.parallel([
            Animated.spring(flapTranslateY,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.spring(flapRotateX,     { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.timing(tearProgress,    { toValue: 0, duration: 200, useNativeDriver: false }),
            Animated.timing(innerGlow,       { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.spring(innerGlowScale,  { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
          ]).start();
          dragOffsetRef.current = 0;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      },
      onPanResponderTerminate: (_, gs) => {
        if (phaseRef.current !== 'pack_tearing') return;
        // Reset on termination
        setPhaseSync('pack_zoom');
        Animated.parallel([
          Animated.spring(flapTranslateY,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          Animated.spring(flapRotateX,     { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          Animated.timing(tearProgress,    { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(innerGlow,       { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.spring(innerGlowScale,  { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        ]).start();
        dragOffsetRef.current = 0;
      },
    })
  ).current;



  // ── Card flip — rarity-tiered pause before flip ──
  const startCardFlip = useCallback(() => {
    console.log('[PackReveal] card_flip_started');
    try {
      // Spring card in from scale 0
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, tension: 75, friction: 7, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) { skipToFinal(); return; }

        // For rare+: start aura fade-in during suspense pause
        if (rarity !== 'common') {
          Animated.timing(auraOpacity, {
            toValue: 1,
            duration: Math.min(effectivePauseMs * 0.6, 400),
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();

          // Extra haptic for legendary during aura buildup
          if (rarity === 'legendary') {
            setTimeout(() => {
              if (!active.current) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }, effectivePauseMs * 0.4);
          }

          // Legendary particles fire at ~60% through the pause
          if (rarity === 'legendary') {
            setTimeout(() => {
              if (!active.current) return;
              fireParticles();
            }, effectivePauseMs * 0.55);
          }
        }

        // Wait for suspense pause, then flip
        const t = setTimeout(() => {
          if (!active.current) return;
          setPhaseSync('card_flip');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

          Animated.timing(cardScaleX, {
            toValue: 0, duration: 200,
            easing: Easing.in(Easing.quad), useNativeDriver: true,
          }).start(({ finished: f1 }) => {
            if (!active.current || !f1) { skipToFinal(); return; }
            setCardFace('front');
            // Fade out aura as card reveals
            Animated.timing(auraOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();

            Animated.timing(cardScaleX, {
              toValue: 1, duration: 260,
              easing: Easing.out(Easing.back(1.15)), useNativeDriver: true,
            }).start(({ finished: f2 }) => {
              if (!active.current || !f2) { skipToFinal(); return; }
              console.log('[PackReveal] card_flip_completed');
              setPhaseSync('rarity_reveal');
              startRarityReveal();
            });
          });
        }, effectivePauseMs);

        return () => clearTimeout(t);
      });
    } catch {
      skipToFinal();
    }
  }, [rarity, effectivePauseMs]);

  // ── Legendary particle burst ──
  const fireParticles = useCallback(() => {
    // Distribute particles in a circle
    const animations: Animated.CompositeAnimation[] = [];
    particleX.forEach((px, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 80 + (i % 3) * 30;
      const tx = Math.cos(angle) * radius;
      const ty = Math.sin(angle) * radius - 20;
      const py = particleY[i];
      const po = particleOp[i];

      animations.push(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(po, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(po, { toValue: 0, duration: 300, delay: 100, useNativeDriver: true }),
          ]),
          Animated.timing(px, {
            toValue: tx, duration: 500,
            easing: Easing.out(Easing.cubic), useNativeDriver: true,
          }),
          Animated.timing(py, {
            toValue: ty, duration: 500,
            easing: Easing.out(Easing.cubic), useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  }, []);

  // ── Rarity reveal (glow + loops + celeb) ──
  const startRarityReveal = useCallback(() => {
    console.log('[PackReveal] rarity_effect_started', rarity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Legendary: extra heavy haptic
    if (rarity === 'legendary') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    try {
      Animated.parallel([
        Animated.spring(glowScale, { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: glowPeak, duration: 380, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) { skipToFinal(); return; }

        // Rare+: glow pulse loop
        if (rarity !== 'common') {
          const pulseSpeed = rarity === 'legendary' ? 550 :
                             rarity === 'epic'      ? 650 : 750;
          const pulse = Animated.loop(
            Animated.sequence([
              Animated.timing(glowPulse, { toValue: 1.1,  duration: pulseSpeed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(glowPulse, { toValue: 1.0,  duration: pulseSpeed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
          );
          pulseLoop.current = pulse;
          pulse.start();
        }

        // Epic/legendary: shimmer pass
        if (rarity === 'epic' || rarity === 'legendary') {
          const shimmerSpeed = rarity === 'legendary' ? 900 : 1400;
          const shimmer = Animated.loop(
            Animated.sequence([
              Animated.timing(shimmerAnim, {
                toValue: 1, duration: shimmerSpeed,
                easing: Easing.linear, useNativeDriver: true,
              }),
              Animated.timing(shimmerAnim, {
                toValue: 0, duration: 0, useNativeDriver: true,
              }),
            ])
          );
          shimmerLoop.current = shimmer;
          shimmer.start();
        }

        // Celebration text + actions appear
        const delay = rarity === 'legendary' ? 250 :
                      rarity === 'epic'      ? 200 : 150;
        const t = setTimeout(() => {
          if (!active.current) return;
          Animated.parallel([
            Animated.timing(celebOpacity,   { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(actionsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start();
          setPhaseSync('final');
          console.log('[PackReveal] reveal_completed', { rarity, wasNew: drawnCard?.wasNew });
        }, delay);

        return () => clearTimeout(t);
      });
    } catch {
      skipToFinal();
    }
  }, [rarity, glowPeak, drawnCard?.wasNew]);

  // ── Card not found fallback ──
  if (visible && drawnCard && !card) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.fallbackOverlay}>
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackTitle}>
              {language === 'es' ? 'Carta obtenida' : 'Card Obtained'}
            </Text>
            <Text style={styles.fallbackSub}>{drawnCard.cardId}</Text>
            <Pressable style={styles.fallbackBtn} onPress={onClose}>
              <Text style={styles.fallbackBtnText}>
                {language === 'es' ? 'Cerrar' : 'Close'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dark backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <LinearGradient colors={['#050508', '#0D0D1A']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Rarity aura (rare+, pre-flip) */}
      {rarity !== 'common' && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: auraOpacity, backgroundColor: auraColor }]}
        />
      )}

      {/* White flash */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
      />

      {/* Main content */}
      <View style={styles.container}>

        {/* PACK */}
        {!showCard && packType && (
          <Animated.View
            style={{
              transform: [{ scale: packScale }, { translateY: packFloat }],
              opacity: packOpacity,
              alignItems: 'center',
            }}
          >
            {/* Outer wrapper handles zoom scale from tap */}
            <Animated.View
              style={{
                transform: [{ scale: packZoomScale }],
                alignItems: 'center',
              }}
            >
              {/* Tap target — only active during pack_ready */}
              <Pressable
                onPress={handlePackTap}
                disabled={phase !== 'pack_ready'}
                style={{ alignItems: 'center' }}
              >
                {/* Full pack — fades out when halves take over */}
                <Animated.View style={{ opacity: fullPackOpacityTear }}>
                  <PackVisual packType={packType} shakeAnim={packShake} scaleAnim={packBump} onImageLoad={handlePackImageLoad} />
                </Animated.View>
              </Pressable>

              {/* Pack halves + gesture handler — shown during zoom/tearing/open phases */}
              {(phase === 'pack_zoom' || phase === 'pack_tearing' || phase === 'pack_open') && (
                <View
                  {...tearPanResponder.panHandlers}
                  style={{
                    position: 'absolute',
                    width: CARD_W,
                    height: CARD_H,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Irregular tear line glow — SVG polyline revealed left→right via clip */}
                  {/* Positioned in center 70% of pack width so edges stay clean */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: TEAR_BASE_Y - 10,
                      left: TEAR_MARGIN,
                      width: TEAR_LINE_W,
                      height: SVG_H,
                      opacity: innerGlow,
                    }}
                  >
                    <Svg width={TEAR_LINE_W} height={SVG_H} style={{ overflow: 'visible' }}>
                      <Defs>
                        <ClipPath id="tearClip">
                          <Rect x={0} y={-10} width={tearClipW} height={SVG_H + 20} />
                        </ClipPath>
                      </Defs>
                      {/* Soft outer glow stroke */}
                      <Polyline
                        points={tearPointsLocal}
                        clipPath="url(#tearClip)"
                        stroke="rgba(255,220,100,0.35)"
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* Core bright line */}
                      <Polyline
                        points={tearPointsLocal}
                        clipPath="url(#tearClip)"
                        stroke="rgba(255,235,140,0.95)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                  </Animated.View>

                  {/* BODY — bottom portion (stays in place, fades on completion) */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      width: CARD_W,
                      height: CARD_H,
                      opacity: packBodyOpacity,
                      overflow: 'hidden',
                      borderRadius: 20,
                    }}
                  >
                    {/* Clip to show only below tear line */}
                    <View style={{
                      position: 'absolute',
                      top: CARD_H * 0.22,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      overflow: 'hidden',
                      borderBottomLeftRadius: 20,
                      borderBottomRightRadius: 20,
                    }}>
                      <View style={{ width: CARD_W, height: CARD_H, marginTop: -(CARD_H * 0.22) }}>
                        <PackVisual packType={packType} shakeAnim={packShake} scaleAnim={packBump} />
                      </View>
                    </View>
                  </Animated.View>

                  {/* TOP FLAP — lifts and rotates as user drags */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      width: CARD_W,
                      height: CARD_H,
                      opacity: flapOpacity,
                      transform: [
                        { translateY: flapTranslateY },
                        {
                          rotate: flapRotateX.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '-8deg'],
                          }),
                        },
                      ],
                      overflow: 'hidden',
                      borderRadius: 20,
                    }}
                  >
                    {/* Clip to show only above tear line */}
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: CARD_H * 0.22,
                      overflow: 'hidden',
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                    }}>
                      <PackVisual packType={packType} shakeAnim={packShake} scaleAnim={packBump} />
                    </View>
                  </Animated.View>
                </View>
              )}
            </Animated.View>

            {/* Hint text */}
            <View style={styles.tapHintContainer}>
              {phase === 'pack_ready' && (
                <Text style={styles.tapHint}>
                  {language === 'es' ? 'Toca para abrir' : 'Tap to open'}
                </Text>
              )}
              {(phase === 'pack_zoom' || phase === 'pack_tearing') && (
                <Animated.Text style={[styles.tapHint, styles.swipeHint, { opacity: hintOpacity }]}>
                  {language === 'es' ? 'Desliza para abrir' : 'Swipe to open'}
                </Animated.Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* CARD REVEAL */}
        {showCard && card && drawnCard && (
          <>
            {/* Glow ring */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glowRing,
                {
                  transform: [{ scale: Animated.multiply(glowScale, glowPulse) }],
                  opacity: glowOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={glowColors}
                style={styles.glowRingInner}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Legendary particles */}
            {rarity === 'legendary' && particleX.map((px, i) => (
              <LegendaryParticle
                key={i}
                index={i}
                translateX={px}
                translateY={particleY[i]}
                opacity={particleOp[i]}
              />
            ))}

            {/* Card with flip */}
            <Animated.View
              style={{
                transform: [{ scale: cardScale }, { scaleX: cardScaleX }],
                opacity: cardOpacity,
                overflow: 'hidden',
                borderRadius: 20,
                width: CARD_W,
                height: CARD_H,
                // Golden glow while showing card back — especially visible for transparent packs
                shadowColor: packType ? PACK_ASSETS[packType].glowColor : '#FFD700',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: cardFace === 'back' ? 0.85 : 0,
                shadowRadius: 32,
                elevation: cardFace === 'back' ? 20 : 0,
              }}
            >
              {cardFace === 'front' ? (
                <>
                  <CollectibleCardVisual
                    card={card}
                    wasNew={drawnCard.wasNew}
                    language={language}
                    sFont={sFont}
                    size="reveal"
                  />
                  <RarityShimmer rarity={rarity} shimmerAnim={shimmerAnim} />
                </>
              ) : (
                <CardBack packType={packType ?? 'sobre_biblico'} onImageLoad={handleCardBackLoad} />
              )}
            </Animated.View>

            {/* Celebration badge */}
            {cardFace === 'front' && (
              <Animated.View style={[styles.celebContainer, { opacity: celebOpacity }]}>
                {drawnCard.wasNew ? (
                  <LinearGradient
                    colors={
                      rarity === 'legendary' ? ['#D97706', '#92400E'] :
                      rarity === 'epic'      ? ['#7C3AED', '#5B21B6'] :
                      rarity === 'rare'      ? ['#1D4ED8', '#1E40AF'] :
                                              ['#374151', '#1F2937']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.celebBadge}
                  >
                    <Text style={styles.celebText}>
                      ✨ {language === 'es' ? 'Nueva carta descubierta' : 'New card discovered'} ✨
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.dupBadge}>
                    <Text style={styles.dupText}>
                      {language === 'es' ? 'Duplicado guardado' : 'Duplicate saved'}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Actions */}
            {phase === 'final' && (
              <Animated.View style={[styles.actions, { opacity: actionsOpacity }]}>
                {/* Multi-card: not last card → "Siguiente carta" */}
                {!isLastCard ? (
                  <>
                    {totalCards > 1 && (
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: sFont(12), fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>
                        {language === 'es' ? `Carta ${currentCardIndex + 1} de ${totalCards}` : `Card ${currentCardIndex + 1} of ${totalCards}`}
                      </Text>
                    )}
                    <Pressable
                      style={styles.openAnotherBtn}
                      onPress={() => setCurrentCardIndex(i => i + 1)}
                    >
                      <LinearGradient
                        colors={['#1E3A5F', '#0A1929']}
                        style={styles.primaryBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.primaryBtnText}>
                          {language === 'es' ? 'Siguiente carta →' : 'Next card →'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </>
                ) : totalCards > 1 ? (
                  /* Multi-card: last card → show summary button */
                  <Pressable
                    style={styles.openAnotherBtn}
                    onPress={() => setShowSummary(true)}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#5B21B6']}
                      style={styles.primaryBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.primaryBtnText}>
                        {language === 'es' ? '✨ Ver resumen' : '✨ See summary'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  /* Single-card pack: original buttons */
                  <>
                    {onOpenAnother != null && (() => {
                      const PACK_PRICE = 500;
                      const canAfford = (userPoints ?? 0) >= PACK_PRICE;
                      return (
                        <Pressable
                          style={[styles.openAnotherBtn, !canAfford && styles.openAnotherBtnDisabled]}
                          onPress={canAfford ? onOpenAnother : undefined}
                          disabled={!canAfford}
                        >
                          <LinearGradient
                            colors={canAfford ? ['#1B6B3A', '#0D4422'] : ['#2A2A2A', '#1A1A1A']}
                            style={styles.primaryBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Text style={[styles.primaryBtnText, !canAfford && { color: 'rgba(255,255,255,0.35)' }]}>
                              {!canAfford
                                ? (language === 'es' ? 'Sin puntos' : 'Not enough points')
                                : (language === 'es' ? 'Abrir otro sobre' : 'Open another pack')}
                            </Text>
                          </LinearGradient>
                        </Pressable>
                      );
                    })()}
                    <Pressable style={styles.primaryBtn} onPress={onViewAlbum}>
                      <LinearGradient
                        colors={['#1E3A5F', '#0A1929']}
                        style={styles.primaryBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.primaryBtnText}>
                          {language === 'es' ? 'Ver mi álbum' : 'View album'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={onClose}>
                      <Text style={styles.secondaryBtnText}>
                        {language === 'es' ? 'Cerrar' : 'Close'}
                      </Text>
                    </Pressable>
                  </>
                )}
              </Animated.View>
            )}
          </>
        )}
      </View>
      {/* ── Multi-card Summary Screen ────────────────────────────────────────
          Rendered as position:absolute overlay when showSummary = true.
          Covers the entire modal with a dark backdrop + scroll list.
      ──────────────────────────────────────────────────────────────────── */}
      {showSummary && (
        <View style={StyleSheet.absoluteFill}>
          {/* Blurred dark backdrop */}
          <LinearGradient
            colors={['#050508EE', '#0D0D1AEE']}
            style={StyleSheet.absoluteFill}
          />

          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: 20,
              alignItems: 'center',
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={{
              fontSize: sFont(22), fontWeight: '900', color: '#FFF',
              textAlign: 'center', letterSpacing: 0.3, marginBottom: 4,
            }}>
              {language === 'es' ? '¡Obtuviste!' : 'You received!'}
            </Text>
            <Text style={{
              fontSize: sFont(13), color: 'rgba(255,255,255,0.5)',
              textAlign: 'center', marginBottom: 24,
            }}>
              {language === 'es'
                ? `${drawnCards.length} cartas de este sobre`
                : `${drawnCards.length} cards from this pack`}
            </Text>

            {/* Cards list */}
            {drawnCards.map((dc, idx) => {
              const c = BIBLICAL_CARDS[dc.cardId];
              const rarityLabel = c ? (RARITY_CONFIG[c.rarity]?.labelEs ?? c.rarity) : '';
              const RARITY_COLOR_MAP: Record<string, string> = {
                common:    '#6B7280',
                rare:      '#3B82F6',
                epic:      '#A855F7',
                legendary: '#F59E0B',
              };
              const rc = c ? (RARITY_COLOR_MAP[c.rarity] ?? '#6B7280') : '#6B7280';
              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    backgroundColor: rc + '12',
                    borderWidth: 1,
                    borderColor: rc + '40',
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  {/* Mini card thumb */}
                  {c ? (
                    <SummaryCardThumb card={c} size={60} />
                  ) : (
                    <View style={{ width: 60, borderRadius: 10, overflow: 'hidden', aspectRatio: 2/3 }}>
                      <LinearGradient colors={['#1E293B', '#0F172A']} style={{ flex: 1 }} />
                    </View>
                  )}

                  {/* Card info */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#FFF' }} numberOfLines={2}>
                      {c?.nameEs ?? dc.cardId}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: rc }} />
                      <Text style={{ fontSize: sFont(11), color: rc, fontWeight: '700' }}>
                        {rarityLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Nueva / Dup chip */}
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                    backgroundColor: dc.wasNew ? '#22C55E20' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: dc.wasNew ? '#22C55E50' : 'rgba(255,255,255,0.12)',
                  }}>
                    <Text style={{ fontSize: sFont(10), fontWeight: '800', color: dc.wasNew ? '#22C55E' : 'rgba(255,255,255,0.45)' }}>
                      {dc.wasNew
                        ? (language === 'es' ? '✨ Nueva' : '✨ New')
                        : (language === 'es' ? 'Dup. +1' : 'Dup. +1')}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Summary CTAs */}
            <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
              {onOpenAnother != null && (() => {
                const PACK_PRICE = 500;
                const canAfford = (userPoints ?? 0) >= PACK_PRICE;
                return (
                  <Pressable
                    style={[styles.openAnotherBtn, !canAfford && styles.openAnotherBtnDisabled]}
                    onPress={canAfford ? onOpenAnother : undefined}
                    disabled={!canAfford}
                  >
                    <LinearGradient
                      colors={canAfford ? ['#1B6B3A', '#0D4422'] : ['#2A2A2A', '#1A1A1A']}
                      style={styles.primaryBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.primaryBtnText, !canAfford && { color: 'rgba(255,255,255,0.35)' }]}>
                        {!canAfford
                          ? (language === 'es' ? 'Sin puntos' : 'Not enough points')
                          : (language === 'es' ? 'Abrir otro sobre' : 'Open another pack')}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                );
              })()}
              <Pressable style={styles.primaryBtn} onPress={onViewAlbum}>
                <LinearGradient
                  colors={['#1E3A5F', '#0A1929']}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryBtnText}>
                    {language === 'es' ? 'Ver mi álbum' : 'View album'}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryBtnText}>
                  {language === 'es' ? 'Cerrar' : 'Close'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  tapHintContainer: { marginTop: 28, alignItems: 'center' },
  tapHint: { color: 'rgba(255,255,255,0.55)', fontSize: 15, letterSpacing: 0.3, textAlign: 'center' },
  swipeHint: { color: 'rgba(255,220,120,0.85)', fontWeight: '600' as const, letterSpacing: 0.8 },
  glowRing: {
    position: 'absolute',
    width: CARD_W * 2.2,
    height: CARD_W * 2.2,
    borderRadius: CARD_W * 1.1,
  },
  glowRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: CARD_W * 1.1,
    opacity: 0.6,
  },
  celebContainer: { marginTop: 16, alignItems: 'center' },
  celebBadge: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24 },
  celebText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  dupBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dupText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  actions: {
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
    width: CARD_W + 40,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtnGradient: { paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  secondaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 14,
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: '500' },
  openAnotherBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  openAnotherBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  cardBack: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#9B5FE0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 16,
  },
  cardBackGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  fallbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 280,
  },
  fallbackTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  fallbackSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  fallbackBtn: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  fallbackBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
