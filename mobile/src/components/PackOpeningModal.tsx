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
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useScaledFont } from '@/lib/textScale';
import { useLanguage } from '@/lib/store';
import { BIBLICAL_CARDS, type BiblicalCard } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'pack_appear'
  | 'pack_ready'
  | 'pack_open'
  | 'card_back'
  | 'card_flip'
  | 'rarity_reveal'
  | 'final';

type PackType = 'sobre_biblico' | 'pack_pascua';

export interface PackOpeningModalProps {
  visible: boolean;
  packType: PackType | null;
  drawnCard: { cardId: string; wasNew: boolean } | null;
  onClose: () => void;
  onViewAlbum: () => void;
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
    label: 'Sobre Bíblico',
    gradientTop: '#1E3A5F',
    gradientBottom: '#0A1929',
    borderColor: '#D4A017',
    glowColor: '#D4A017',
    emoji: '📜',
  },
  pack_pascua: {
    label: 'Pack de Pascua',
    gradientTop: '#8B0000',
    gradientBottom: '#1A0000',
    borderColor: '#D4A017',
    glowColor: '#FFD700',
    emoji: '✝️',
  },
};

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

// ─── Animated Pack Visual ────────────────────────────────────────────────────

function PackVisual({
  packType,
  shakeAnim,
  scaleAnim,
}: {
  packType: PackType;
  shakeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}) {
  const cfg = PACK_CONFIG[packType];
  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-7deg', '0deg', '7deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate }, { scale: scaleAnim }],
        shadowColor: cfg.glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 28,
        elevation: 20,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={[cfg.gradientTop, cfg.gradientBottom]}
        style={styles.packGradient}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        <View style={[styles.packBorder, { borderColor: cfg.borderColor }]}>
          <Text style={[styles.packCorner, { top: 8, left: 10 }]}>✦</Text>
          <Text style={[styles.packCorner, { top: 8, right: 10 }]}>✦</Text>
          <Text style={[styles.packCorner, { bottom: 8, left: 10 }]}>✦</Text>
          <Text style={[styles.packCorner, { bottom: 8, right: 10 }]}>✦</Text>
          <Text style={styles.packEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.packLabel, { color: cfg.borderColor }]}>{cfg.label}</Text>
          <View style={[styles.packDivider, { backgroundColor: cfg.borderColor }]} />
          <Text style={[styles.packSub, { color: cfg.borderColor + 'AA' }]}>Cartas Bíblicas</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Card Back ────────────────────────────────────────────────────────────────

function CardBack() {
  return (
    <View style={styles.cardBack}>
      <LinearGradient
        colors={['#1E3A5F', '#0A1929']}
        style={styles.cardBackGradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <View style={styles.cardBackBorder}>
          <Text style={styles.cardBackCross}>✝</Text>
          <Text style={styles.cardBackLabel}>Cartas{'\n'}Bíblicas</Text>
        </View>
      </LinearGradient>
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
  drawnCard,
  onClose,
  onViewAlbum,
}: PackOpeningModalProps) {
  const language = useLanguage();
  const { sFont } = useScaledFont();

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

  // Legendary particles — 6 particles, each with x/y/opacity
  const particleX   = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;
  const particleY   = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;
  const particleOp  = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;

  const [phase, setPhase]       = useState<Phase>('idle');
  const [showCard, setShowCard] = useState(false);
  const [cardFace, setCardFace] = useState<'back' | 'front'>('back');

  const floatLoop   = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop   = useRef<Animated.CompositeAnimation | null>(null);
  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);
  const active      = useRef(false);
  const soundRef    = useRef<Audio.Sound | null>(null);
  const revealSoundRef = useRef<Audio.Sound | null>(null);

  const card = drawnCard ? (BIBLICAL_CARDS[drawnCard.cardId] ?? null) : null;
  const rarity = card?.rarity ?? 'common';
  const glowColors  = RARITY_GLOW_COLORS[rarity]  ?? RARITY_GLOW_COLORS.common;
  const glowPeak    = RARITY_GLOW_PEAK[rarity]     ?? 0.25;
  const flashPeak   = RARITY_FLASH_PEAK[rarity]    ?? 0.45;
  const pauseMs     = RARITY_PAUSE_MS[rarity]      ?? 0;
  const auraColor   = RARITY_AURA_COLORS[rarity]   ?? 'transparent';

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
    particleX.forEach(v => v.setValue(0));
    particleY.forEach(v => v.setValue(0));
    particleOp.forEach(v => v.setValue(0));
    setShowCard(false);
    setCardFace('back');
  }, [stopLoops]);

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
    setPhase('final');
  }, [glowPeak, stopLoops]);

  // ── Entry — fires when visible becomes true ──
  useEffect(() => {
    if (!visible || !packType || !drawnCard) {
      resetAll();
      setPhase('idle');
      return;
    }
    resetAll();
    active.current = true;
    setPhase('pack_appear');
    console.log('[PackReveal] pack_idle_shown');

    try {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(packScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(packOpacity,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) return;
        setPhase('pack_ready');

        // Preload sound while user reads "Toca para abrir", so playback is instant on tap
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

        // Preload card reveal sound (plays 790ms after tap, 2s before opening sound ends)
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

    return () => {
      active.current = false;
      stopLoops();
    };
  }, [visible, packType, drawnCard?.cardId]);

  // ── Pack tap ──
  const handlePackTap = useCallback(() => {
    if (phase !== 'pack_ready') return;
    setPhase('pack_open');
    console.log('[PackReveal] pack_open_started');

    stopLoops();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Fire preloaded sound instantly on tap
    if (soundRef.current) {
      soundRef.current.playAsync().catch(() => {});
    } else {
      // Fallback if preload didn't finish in time
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

    // Fire card reveal sound 790ms after tap (2s before opening sound ends at 2.79s)
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

    // Shake intensity scales with rarity
    const shakeAmp = rarity === 'legendary' ? 1.0 :
                     rarity === 'epic'      ? 0.9 :
                     rarity === 'rare'      ? 0.85 : 0.75;

    try {
      Animated.sequence([
        // 1. Shake (5 steps, ~240ms)
        Animated.sequence([
          Animated.timing(packShake, { toValue:  shakeAmp,      duration: 55, useNativeDriver: true }),
          Animated.timing(packShake, { toValue: -shakeAmp,      duration: 55, useNativeDriver: true }),
          Animated.timing(packShake, { toValue:  shakeAmp * 0.7, duration: 45, useNativeDriver: true }),
          Animated.timing(packShake, { toValue: -shakeAmp * 0.7, duration: 45, useNativeDriver: true }),
          Animated.timing(packShake, { toValue:  0,             duration: 40, useNativeDriver: true }),
        ]),
        // 2. Bump (80ms)
        Animated.timing(packBump, {
          toValue: 1.05, duration: 80,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        // 3. Flash — peak opacity keyed by rarity
        Animated.sequence([
          Animated.timing(flashOpacity, { toValue: flashPeak, duration: 70,  useNativeDriver: true }),
          Animated.timing(flashOpacity, { toValue: 0,          duration: 130, useNativeDriver: true }),
        ]),
        // 4. Pack fade out
        Animated.parallel([
          Animated.timing(packOpacity, { toValue: 0,    duration: 180, useNativeDriver: true }),
          Animated.timing(packScale,   { toValue: 1.15, duration: 180, useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => {
        if (!active.current || !finished) return;
        console.log('[PackReveal] pack_open_completed');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setShowCard(true);
        setCardFace('back');
        setPhase('card_back');
        startCardFlip();
      });
    } catch {
      skipToFinal();
    }
  }, [phase, rarity, flashPeak]);

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
            duration: Math.min(pauseMs * 0.6, 400),
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();

          // Extra haptic for legendary during aura buildup
          if (rarity === 'legendary') {
            setTimeout(() => {
              if (!active.current) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }, pauseMs * 0.4);
          }

          // Legendary particles fire at ~60% through the pause
          if (rarity === 'legendary') {
            setTimeout(() => {
              if (!active.current) return;
              fireParticles();
            }, pauseMs * 0.55);
          }
        }

        // Wait for suspense pause, then flip
        const t = setTimeout(() => {
          if (!active.current) return;
          setPhase('card_flip');
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
              setPhase('rarity_reveal');
              startRarityReveal();
            });
          });
        }, pauseMs);

        return () => clearTimeout(t);
      });
    } catch {
      skipToFinal();
    }
  }, [rarity, pauseMs]);

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
          setPhase('final');
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
            <Pressable
              onPress={handlePackTap}
              disabled={phase !== 'pack_ready'}
              style={{ alignItems: 'center' }}
            >
              <PackVisual packType={packType} shakeAnim={packShake} scaleAnim={packBump} />
            </Pressable>
            {phase === 'pack_ready' && (
              <View style={styles.tapHintContainer}>
                <Text style={styles.tapHint}>
                  {language === 'es' ? 'Toca para abrir' : 'Tap to open'}
                </Text>
              </View>
            )}
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
                <CardBack />
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
              </Animated.View>
            )}
          </>
        )}
      </View>
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
  packGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  packBorder: {
    flex: 1,
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  packCorner: {
    position: 'absolute',
    fontSize: 11,
    color: '#D4A017',
    opacity: 0.7,
  },
  packEmoji: { fontSize: 60 },
  packLabel: { fontSize: 17, fontWeight: '800', letterSpacing: 0.4, textAlign: 'center' },
  packDivider: { width: 40, height: 1, opacity: 0.4 },
  packSub: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  tapHintContainer: { marginTop: 28, alignItems: 'center' },
  tapHint: { color: 'rgba(255,255,255,0.55)', fontSize: 15, letterSpacing: 0.3, textAlign: 'center' },
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
  cardBack: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
  },
  cardBackGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardBackBorder: {
    flex: 1,
    width: '100%',
    borderWidth: 2,
    borderColor: '#D4A017',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cardBackCross: { fontSize: 68, color: '#D4A017' },
  cardBackLabel: {
    color: '#D4A017',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
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
