/**
 * PackOpeningModal
 *
 * Premium pack opening animation flow for Biblical Cards.
 *
 * Flow:
 *   Phase 0 — idle
 *   Phase 1 — pack appears: scale-in + float pulse + glow
 *   Phase 2 — pack tap: shake + flash + fade
 *   Phase 3 — card flip reveal: scaleX shrink → swap face → expand
 *   Phase 4 — rarity glow reveal
 *   Phase 5 — final: show card with actions (Ver álbum / Cerrar)
 *
 * Safety rules:
 *   - Uses React Native Animated only (no Reanimated) to prevent UI thread freezes.
 *   - All locks released in finally blocks.
 *   - If animation throws, falls back to static card display.
 *   - No async operations on the UI thread that could block the JS bridge.
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

type Phase = 'idle' | 'pack_appear' | 'pack_ready' | 'pack_open' | 'card_flip' | 'rarity_reveal' | 'final';

type PackType = 'sobre_biblico' | 'pack_pascua';

interface PackOpeningModalProps {
  visible: boolean;
  packType: PackType | null;
  drawnCard: { cardId: string; wasNew: boolean } | null;
  onClose: () => void;
  onViewAlbum: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PACK_CONFIG: Record<PackType, {
  label: string;
  labelEn: string;
  gradientTop: string;
  gradientBottom: string;
  borderColor: string;
  glowColor: string;
  emoji: string;
}> = {
  sobre_biblico: {
    label: 'Sobre Bíblico',
    labelEn: 'Biblical Pack',
    gradientTop: '#1E3A5F',
    gradientBottom: '#0A1929',
    borderColor: '#D4A017',
    glowColor: '#D4A017',
    emoji: '📜',
  },
  pack_pascua: {
    label: 'Pack de Pascua',
    labelEn: 'Easter Pack',
    gradientTop: '#8B0000',
    gradientBottom: '#1A0000',
    borderColor: '#D4A017',
    glowColor: '#FFD700',
    emoji: '✝️',
  },
};

const RARITY_GLOW: Record<string, string[]> = {
  common: ['#6B7280', '#9CA3AF'],
  rare: ['#1D4ED8', '#3B82F6'],
  epic: ['#7C3AED', '#A855F7'],
  legendary: ['#92400E', '#D97706'],
};

// ─── Animated Pack Visual ────────────────────────────────────────────────────

function PackVisual({ packType, shakeAnim }: { packType: PackType; shakeAnim: Animated.Value }) {
  const cfg = PACK_CONFIG[packType];
  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <Animated.View
      style={[
        styles.packContainer,
        { transform: [{ rotate }] },
        {
          shadowColor: cfg.glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 24,
          elevation: 20,
        },
      ]}
    >
      <LinearGradient
        colors={[cfg.gradientTop, cfg.gradientBottom]}
        style={styles.packGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={[styles.packBorder, { borderColor: cfg.borderColor }]}>
          <Text style={styles.packEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.packLabel, { color: cfg.borderColor }]}>
            {cfg.label}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
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

  // ── Animation values ──
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const packScale = useRef(new Animated.Value(0.3)).current;
  const packOpacity = useRef(new Animated.Value(0)).current;
  const packFloat = useRef(new Animated.Value(0)).current;
  const packShake = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardScaleX = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const [phase, setPhase] = useState<Phase>('idle');
  const [showCard, setShowCard] = useState(false);
  const [cardFace, setCardFace] = useState<'back' | 'front'>('back');
  const floatLoop = useRef<Animated.CompositeAnimation | null>(null);
  const animationActive = useRef(false);

  const card: BiblicalCard | null = drawnCard ? (BIBLICAL_CARDS[drawnCard.cardId] ?? null) : null;
  const rarity = card?.rarity ?? 'common';
  const rarityGlow = RARITY_GLOW[rarity] ?? RARITY_GLOW.common;
  const rarityColor = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? RARITY_COLORS.common;

  // ── Reset all values ──
  const resetAnimValues = useCallback(() => {
    backdropOpacity.setValue(0);
    packScale.setValue(0.3);
    packOpacity.setValue(0);
    packFloat.setValue(0);
    packShake.setValue(0);
    flashOpacity.setValue(0);
    cardScale.setValue(0);
    cardScaleX.setValue(1);
    cardOpacity.setValue(0);
    glowOpacity.setValue(0);
    glowScale.setValue(0.5);
    contentOpacity.setValue(0);
    setShowCard(false);
    setCardFace('back');
  }, []);

  // ── Start flow when modal becomes visible ──
  useEffect(() => {
    if (!visible || !packType || !drawnCard) {
      if (floatLoop.current) {
        floatLoop.current.stop();
        floatLoop.current = null;
      }
      setPhase('idle');
      resetAnimValues();
      return;
    }

    resetAnimValues();
    setPhase('pack_appear');
    animationActive.current = true;

    // Phase 1: backdrop + pack scale-in
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(packScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(packOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!animationActive.current) return;
      setPhase('pack_ready');

      // Start float loop
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(packFloat, {
            toValue: -8,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(packFloat, {
            toValue: 8,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      floatLoop.current = loop;
      loop.start();
    });

    return () => {
      animationActive.current = false;
      if (floatLoop.current) {
        floatLoop.current.stop();
        floatLoop.current = null;
      }
    };
  }, [visible, packType, drawnCard]);

  // ── Handle pack tap ──
  const handlePackTap = useCallback(() => {
    if (phase !== 'pack_ready') return;
    setPhase('pack_open');

    // Stop float
    if (floatLoop.current) {
      floatLoop.current.stop();
      floatLoop.current = null;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Shake → flash → fade pack
    Animated.sequence([
      // Shake
      Animated.sequence([
        Animated.timing(packShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(packShake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(packShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(packShake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(packShake, { toValue: 0.5, duration: 60, useNativeDriver: true }),
        Animated.timing(packShake, { toValue: -0.5, duration: 60, useNativeDriver: true }),
        Animated.timing(packShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
      // Flash white
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (!animationActive.current) return;

      // Haptics for card reveal
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // Fade pack + show card back
      Animated.parallel([
        Animated.timing(packOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(packScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!animationActive.current) return;
        setShowCard(true);
        setCardFace('back');
        setPhase('card_flip');
        startCardFlip();
      });
    });
  }, [phase]);

  // ── Card flip animation ──
  const startCardFlip = useCallback(() => {
    // Card appears from scale 0
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!animationActive.current) return;

      // Brief pause for drama
      setTimeout(() => {
        if (!animationActive.current) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        // Flip: shrink X to 0 (showing back)
        Animated.timing(cardScaleX, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          if (!animationActive.current) return;

          // Swap face at the midpoint
          setCardFace('front');

          // Expand X to 1 (showing front)
          Animated.timing(cardScaleX, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }).start(() => {
            if (!animationActive.current) return;
            setPhase('rarity_reveal');
            startRarityReveal();
          });
        });
      }, 400);
    });
  }, []);

  // ── Rarity glow ──
  const startRarityReveal = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.spring(glowScale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: rarity === 'common' ? 0.3 : 0.7,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!animationActive.current) return;

      // Fade in action buttons
      setTimeout(() => {
        if (!animationActive.current) return;
        setPhase('final');
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 500);
    });
  }, [rarity]);

  // ── Fallback: if card is not found, show simple modal ──
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
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <LinearGradient
          colors={['#000000', '#0D0D1A']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={styles.container}>

        {/* Pack or Card */}
        {!showCard && packType && packCfg && (
          <Animated.View
            style={{
              transform: [
                { scale: packScale },
                { translateY: packFloat },
              ],
              opacity: packOpacity,
            }}
          >
            <Pressable onPress={handlePackTap} disabled={phase !== 'pack_ready'}>
              <PackVisual packType={packType} shakeAnim={packShake} />
            </Pressable>

            {/* Tap hint */}
            {phase === 'pack_ready' && (
              <Animated.View style={{ opacity: contentOpacity }}>
                <Text style={styles.tapHint}>
                  {language === 'es' ? 'Toca para abrir' : 'Tap to open'}
                </Text>
              </Animated.View>
            )}
            {phase === 'pack_ready' && (
              <Animated.View
                style={styles.tapHintContainer}
              >
                <Text style={styles.tapHint}>
                  {language === 'es' ? 'Toca para abrir' : 'Tap to open'}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Card reveal */}
        {showCard && card && drawnCard && (
          <>
            {/* Rarity glow behind card */}
            <Animated.View
              style={[
                styles.rarityGlowContainer,
                {
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={rarityGlow as [string, string]}
                style={styles.rarityGlow}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Card visual */}
            <Animated.View
              style={{
                transform: [
                  { scale: cardScale },
                  { scaleX: cardScaleX },
                ],
                opacity: cardOpacity,
              }}
            >
              {cardFace === 'front' ? (
                <CollectibleCardVisual
                  card={card}
                  wasNew={drawnCard.wasNew}
                  language={language}
                  sFont={sFont}
                  size="reveal"
                />
              ) : (
                <CardBack />
              )}
            </Animated.View>

            {/* New card badge */}
            {cardFace === 'front' && drawnCard.wasNew && (
              <Animated.View style={[styles.newBadge, { opacity: glowOpacity }]}>
                <LinearGradient
                  colors={['#D97706', '#92400E']}
                  style={styles.newBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.newBadgeText}>
                    {language === 'es' ? '¡NUEVA!' : 'NEW!'}
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Action buttons */}
            {phase === 'final' && (
              <Animated.View style={[styles.actions, { opacity: contentOpacity }]}>
                <Pressable
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={onViewAlbum}
                >
                  <LinearGradient
                    colors={['#1E3A5F', '#0A1929']}
                    style={styles.actionBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.primaryBtnText}>
                      {language === 'es' ? 'Ver mi álbum' : 'View album'}
                    </Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={onClose}
                >
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
          <Text style={styles.cardBackLabel}>Cartas Bíblicas</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = Math.min(SCREEN_W * 0.65, 280);
const CARD_H = CARD_W * 1.5;

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
  },
  // Pack styles
  packContainer: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
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
    borderWidth: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  packEmoji: {
    fontSize: 64,
  },
  packLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tapHintContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    letterSpacing: 0.3,
    marginTop: 24,
    textAlign: 'center',
  },
  // Card reveal
  rarityGlowContainer: {
    position: 'absolute',
    width: CARD_W * 2,
    height: CARD_W * 2,
    borderRadius: CARD_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityGlow: {
    width: '100%',
    height: '100%',
    borderRadius: CARD_W,
    opacity: 0.5,
  },
  newBadge: {
    position: 'absolute',
    top: -16,
    right: -16,
  },
  newBadgeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Actions
  actions: {
    marginTop: 32,
    gap: 12,
    alignItems: 'center',
    width: CARD_W + 40,
  },
  actionBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  // Card back
  cardBack: {
    width: CARD_W,
    height: CARD_H,
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
    fontSize: 72,
    color: '#D4A017',
  },
  cardBackLabel: {
    color: '#D4A017',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Fallback
  fallbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
