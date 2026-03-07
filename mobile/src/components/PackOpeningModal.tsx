/**
 * PackOpeningModal
 *
 * Premium pack opening animation — runs inside a single root-level Modal
 * mounted above all navigation layers in _layout.tsx.
 *
 * State machine (strictly sequential):
 *   idle → pack_appear → pack_ready → pack_open → card_back → card_flip → rarity_reveal → final
 *
 * Safety rules:
 *   - React Native Animated only (no Reanimated) to prevent UI thread freezes.
 *   - animationActive ref guards every async callback.
 *   - If any animation throws, skipToFinal() immediately shows the card with buttons.
 *   - Float loop always stopped before pack_open starts.
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
import { useScaledFont } from '@/lib/textScale';
import { useLanguage } from '@/lib/store';
import { BIBLICAL_CARDS, type BiblicalCard } from '@/lib/biblical-cards';
import { CollectibleCardVisual } from '@/components/CardRevealModal';
import { RARITY_COLORS } from '@/lib/constants';

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

// Glow colors per rarity — inner / outer
const RARITY_GLOW_COLORS: Record<string, [string, string]> = {
  common:    ['#4B5563', '#1F2937'],
  rare:      ['#3B82F6', '#1D4ED8'],
  epic:      ['#A855F7', '#7C3AED'],
  legendary: ['#F59E0B', '#D97706'],
};

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
          {/* Corner ornaments */}
          <Text style={[styles.packCorner, { top: 8, left: 10 }]}>✦</Text>
          <Text style={[styles.packCorner, { top: 8, right: 10 }]}>✦</Text>
          <Text style={[styles.packCorner, { bottom: 8, left: 10 }]}>✦</Text>
          <Text style={[styles.packCorner, { bottom: 8, right: 10 }]}>✦</Text>

          <Text style={styles.packEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.packLabel, { color: cfg.borderColor }]}>
            {cfg.label}
          </Text>
          <View style={[styles.packDivider, { backgroundColor: cfg.borderColor }]} />
          <Text style={[styles.packSub, { color: cfg.borderColor + 'AA' }]}>
            Cartas Bíblicas
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Card Back Visual ─────────────────────────────────────────────────────────

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

// ─── Rarity Shimmer (epic/legendary extra effect) ─────────────────────────────

function RarityShimmer({
  rarity,
  shimmerAnim,
}: {
  rarity: string;
  shimmerAnim: Animated.Value;
}) {
  if (rarity !== 'epic' && rarity !== 'legendary') return null;

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_W * 1.5, CARD_W * 1.5],
  });

  const color = rarity === 'legendary' ? 'rgba(251,191,36,0.35)' : 'rgba(168,85,247,0.3)';

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: CARD_W * 0.4,
        transform: [{ translateX }, { skewX: '-20deg' }],
        backgroundColor: color,
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

  // ── Animation values (stable refs, never recreated) ──
  const backdropOpacity  = useRef(new Animated.Value(0)).current;
  const packScale        = useRef(new Animated.Value(0.3)).current;
  const packOpacity      = useRef(new Animated.Value(0)).current;
  const packFloat        = useRef(new Animated.Value(0)).current;
  const packShake        = useRef(new Animated.Value(0)).current;
  const packBump         = useRef(new Animated.Value(1)).current;   // scale 1→1.05 on open
  const flashOpacity     = useRef(new Animated.Value(0)).current;
  const cardScale        = useRef(new Animated.Value(0)).current;
  const cardScaleX       = useRef(new Animated.Value(1)).current;
  const cardOpacity      = useRef(new Animated.Value(0)).current;
  const glowOpacity      = useRef(new Animated.Value(0)).current;
  const glowScale        = useRef(new Animated.Value(0.6)).current;
  const glowPulse        = useRef(new Animated.Value(1)).current;   // pulse for rare+
  const shimmerAnim      = useRef(new Animated.Value(0)).current;   // shimmer pass
  const celebOpacity     = useRef(new Animated.Value(0)).current;   // "nueva carta" text
  const actionsOpacity   = useRef(new Animated.Value(0)).current;

  const [phase, setPhase]         = useState<Phase>('idle');
  const [showCard, setShowCard]   = useState(false);
  const [cardFace, setCardFace]   = useState<'back' | 'front'>('back');

  const floatLoop    = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop    = useRef<Animated.CompositeAnimation | null>(null);
  const shimmerLoop  = useRef<Animated.CompositeAnimation | null>(null);
  const active       = useRef(false);  // guards all async animation callbacks

  const card: BiblicalCard | null = drawnCard
    ? (BIBLICAL_CARDS[drawnCard.cardId] ?? null)
    : null;
  const rarity    = card?.rarity ?? 'common';
  const glowColors = RARITY_GLOW_COLORS[rarity] ?? RARITY_GLOW_COLORS.common;
  const glowPeakOpacity = rarity === 'common' ? 0.25 : rarity === 'rare' ? 0.55 : 0.75;

  // ── Stop all loops ──
  const stopLoops = useCallback(() => {
    floatLoop.current?.stop();   floatLoop.current  = null;
    pulseLoop.current?.stop();   pulseLoop.current  = null;
    shimmerLoop.current?.stop(); shimmerLoop.current = null;
  }, []);

  // ── Hard reset ──
  const resetAll = useCallback(() => {
    active.current = false;
    stopLoops();
    backdropOpacity.setValue(0);
    packScale.setValue(0.3);
    packOpacity.setValue(0);
    packFloat.setValue(0);
    packShake.setValue(0);
    packBump.setValue(1);
    flashOpacity.setValue(0);
    cardScale.setValue(0);
    cardScaleX.setValue(1);
    cardOpacity.setValue(0);
    glowOpacity.setValue(0);
    glowScale.setValue(0.6);
    glowPulse.setValue(1);
    shimmerAnim.setValue(0);
    celebOpacity.setValue(0);
    actionsOpacity.setValue(0);
    setShowCard(false);
    setCardFace('back');
  }, []);

  // ── Emergency fallback: skip straight to final ──
  const skipToFinal = useCallback(() => {
    console.log('[PackReveal] skipToFinal — showing static card');
    stopLoops();
    cardScale.setValue(1);
    cardScaleX.setValue(1);
    cardOpacity.setValue(1);
    glowOpacity.setValue(glowPeakOpacity);
    glowScale.setValue(1);
    actionsOpacity.setValue(1);
    celebOpacity.setValue(1);
    setShowCard(true);
    setCardFace('front');
    setPhase('final');
  }, [glowPeakOpacity]);

  // ── Entry point — fires when visible becomes true ──
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
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 280, useNativeDriver: true,
        }),
        Animated.spring(packScale, {
          toValue: 1, tension: 80, friction: 8, useNativeDriver: true,
        }),
        Animated.timing(packOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) return;
        setPhase('pack_ready');

        // Float loop: gentle ±6px sine
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(packFloat, {
              toValue: -6, duration: 1100,
              easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
            Animated.timing(packFloat, {
              toValue: 6, duration: 1100,
              easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
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

  // ── Pack tap handler ──
  const handlePackTap = useCallback(() => {
    if (phase !== 'pack_ready') return;
    setPhase('pack_open');
    console.log('[PackReveal] pack_open_started');

    stopLoops();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    try {
      Animated.sequence([
        // 1. Shake (3 quick moves, <200ms total)
        Animated.sequence([
          Animated.timing(packShake, { toValue: 1,    duration: 55, useNativeDriver: true }),
          Animated.timing(packShake, { toValue: -1,   duration: 55, useNativeDriver: true }),
          Animated.timing(packShake, { toValue: 0.7,  duration: 45, useNativeDriver: true }),
          Animated.timing(packShake, { toValue: -0.7, duration: 45, useNativeDriver: true }),
          Animated.timing(packShake, { toValue: 0,    duration: 40, useNativeDriver: true }),
        ]),
        // 2. Bump scale 1→1.05
        Animated.timing(packBump, {
          toValue: 1.05, duration: 80,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        // 3. Flash
        Animated.sequence([
          Animated.timing(flashOpacity, { toValue: 1, duration: 70, useNativeDriver: true }),
          Animated.timing(flashOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
        ]),
        // 4. Fade pack out + scale up slightly
        Animated.parallel([
          Animated.timing(packOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
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
  }, [phase]);

  // ── Card flip ──
  const startCardFlip = useCallback(() => {
    console.log('[PackReveal] card_flip_started');
    try {
      // Card springs in from scale 0
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1, tension: 75, friction: 7, useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 180, useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) { skipToFinal(); return; }

        // 350ms drama pause
        const t = setTimeout(() => {
          if (!active.current) return;
          setPhase('card_flip');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

          // scaleX → 0
          Animated.timing(cardScaleX, {
            toValue: 0, duration: 200,
            easing: Easing.in(Easing.quad), useNativeDriver: true,
          }).start(({ finished: f1 }) => {
            if (!active.current || !f1) { skipToFinal(); return; }
            setCardFace('front');

            // scaleX → 1 with slight overshoot
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
        }, 350);

        return () => clearTimeout(t);
      });
    } catch {
      skipToFinal();
    }
  }, []);

  // ── Rarity reveal ──
  const startRarityReveal = useCallback(() => {
    console.log('[PackReveal] rarity_effect_started', rarity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      Animated.parallel([
        Animated.spring(glowScale, {
          toValue: 1, tension: 55, friction: 6, useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: glowPeakOpacity, duration: 380, useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!active.current || !finished) { skipToFinal(); return; }

        // For rare+: start glow pulse loop
        if (rarity !== 'common') {
          const pulse = Animated.loop(
            Animated.sequence([
              Animated.timing(glowPulse, {
                toValue: 1.08, duration: 700,
                easing: Easing.inOut(Easing.sin), useNativeDriver: true,
              }),
              Animated.timing(glowPulse, {
                toValue: 1, duration: 700,
                easing: Easing.inOut(Easing.sin), useNativeDriver: true,
              }),
            ])
          );
          pulseLoop.current = pulse;
          pulse.start();
        }

        // For epic/legendary: shimmer pass
        if (rarity === 'epic' || rarity === 'legendary') {
          const shimmer = Animated.loop(
            Animated.timing(shimmerAnim, {
              toValue: 1, duration: rarity === 'legendary' ? 900 : 1400,
              easing: Easing.linear, useNativeDriver: true,
            })
          );
          shimmerLoop.current = shimmer;
          shimmer.start();

          if (rarity === 'legendary') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          }
        }

        // Celebration text + actions
        const t = setTimeout(() => {
          if (!active.current) return;
          Animated.parallel([
            Animated.timing(celebOpacity, {
              toValue: 1, duration: 250, useNativeDriver: true,
            }),
            Animated.timing(actionsOpacity, {
              toValue: 1, duration: 300, useNativeDriver: true,
            }),
          ]).start();
          setPhase('final');
          console.log('[PackReveal] reveal_completed', { rarity, wasNew: drawnCard?.wasNew });
        }, 450);

        return () => clearTimeout(t);
      });
    } catch {
      skipToFinal();
    }
  }, [rarity, glowPeakOpacity, drawnCard?.wasNew]);

  // ── Fallback: card not in BIBLICAL_CARDS ──
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

  const packCfg = packType ? PACK_CONFIG[packType] : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* ── Dark backdrop ── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <LinearGradient
          colors={['#050508', '#0D0D1A']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* ── White flash ── */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {/* ── Main content ── */}
      <View style={styles.container}>

        {/* PACK (shown until pack_open completes) */}
        {!showCard && packType && packCfg && (
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
              <PackVisual
                packType={packType}
                shakeAnim={packShake}
                scaleAnim={packBump}
              />
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
            {/* Rarity glow ring behind card */}
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

            {/* Card (back then front) with flip */}
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
                  {/* Shimmer overlay for epic/legendary */}
                  <RarityShimmer rarity={rarity} shimmerAnim={shimmerAnim} />
                </>
              ) : (
                <CardBack />
              )}
            </Animated.View>

            {/* Celebration / duplicate label */}
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

            {/* Action buttons */}
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
  // Pack
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
  packEmoji: {
    fontSize: 60,
  },
  packLabel: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  packDivider: {
    width: 40,
    height: 1,
    opacity: 0.4,
  },
  packSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tapHintContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Glow
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
  // Celebration
  celebContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  celebBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
  },
  celebText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dupBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dupText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  // Actions
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
  primaryBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '500',
  },
  // Card back
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
  cardBackCross: {
    fontSize: 68,
    color: '#D4A017',
  },
  cardBackLabel: {
    color: '#D4A017',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Fallback
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
  fallbackTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  fallbackSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  fallbackBtn: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  fallbackBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
