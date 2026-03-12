// GiftModal - Shows a pending gift to the user with claim/later options

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Gift, X, ShoppingBag, Coins, Sparkles } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { ActionButton } from '@/components/ui/ActionButton';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');

export interface PendingGift {
  userGiftId: string;
  giftDropId: string;
  title: string;
  message: string;
  rewardType: 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';
  rewardId: string;
  rewardItemNameEs?: string | null;
  rewardItemNameEn?: string | null;
  createdAt: string;
}

interface GiftModalProps {
  visible: boolean;
  gift: PendingGift;
  onClaim: () => Promise<void>;
  onLater: () => void;
}

// ─── Floating particle ─────────────────────────────────────────────────────────
function Particle({ delay, startX, color }: { delay: number; startX: number; color: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.9, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 5 }),
      ]),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -90, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1200, delay: 300, useNativeDriver: true }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        bottom: 0,
        left: startX,
        fontSize: 18,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      {color}
    </Animated.Text>
  );
}

const PARTICLES = ['✨', '🎊', '💫', '⭐', '🌟', '✨', '🎊', '💫', '⭐'];

// ─── Reward config ─────────────────────────────────────────────────────────────
function getRewardConfig(rewardType: PendingGift['rewardType'], isPointsGift: boolean) {
  if (isPointsGift) return { color: '#F59E0B', gradientStart: '#FEF3C7', gradientEnd: '#FDE68A', icon: '🪙' };
  const cfg: Record<string, { color: string; gradientStart: string; gradientEnd: string; icon: string }> = {
    CHEST:  { color: '#F59E0B', gradientStart: '#FEF3C7', gradientEnd: '#FDE68A', icon: '📦' },
    THEME:  { color: '#8B5CF6', gradientStart: '#EDE9FE', gradientEnd: '#DDD6FE', icon: '🎨' },
    TITLE:  { color: '#0EA5E9', gradientStart: '#E0F2FE', gradientEnd: '#BAE6FD', icon: '🏷️' },
    AVATAR: { color: '#EC4899', gradientStart: '#FCE7F3', gradientEnd: '#FBCFE8', icon: '👤' },
    ITEM:   { color: '#10B981', gradientStart: '#D1FAE5', gradientEnd: '#A7F3D0', icon: '⭐' },
  };
  return cfg[rewardType] ?? cfg.CHEST;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GiftModal({ visible, gift, onClaim, onLater }: GiftModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = React.useState(false);
  const [particleKey, setParticleKey] = React.useState(0);

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setParticleKey(k => k + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Staggered entrance
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(80),
          Animated.parallel([
            Animated.spring(cardTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
            Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 6, velocity: 3 }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(iconRotate, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(2.5)), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(380),
          Animated.spring(amountScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 5, velocity: 4 }),
        ]),
      ]).start();

      // Gentle idle bounce
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, { toValue: -7, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      backdropOpacity.setValue(0);
      cardTranslateY.setValue(60);
      cardOpacity.setValue(0);
      iconScale.setValue(0.3);
      iconRotate.setValue(0);
      amountScale.setValue(0);
      bounceY.setValue(0);
    }
  }, [visible]);

  const handleClaim = async () => {
    if (claiming) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaiming(true);
    try {
      await onClaim();
      queryClient.invalidateQueries({ queryKey: ['allStoreItems'] });
      queryClient.invalidateQueries({ queryKey: ['backendUser'] });
      queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
      queryClient.invalidateQueries({ queryKey: ['collectionClaims'] });
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimAndGoToStore = async () => {
    if (claiming) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaiming(true);
    try {
      await onClaim();
      queryClient.invalidateQueries({ queryKey: ['allStoreItems'] });
      queryClient.invalidateQueries({ queryKey: ['backendUser'] });
      queryClient.invalidateQueries({ queryKey: ['biblical-cards'] });
      queryClient.invalidateQueries({ queryKey: ['collectionClaims'] });
      router.push('/(tabs)/store');
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLater();
  };

  const es = language === 'es';
  const isPointsGift = gift.rewardType === 'CHEST' && !isNaN(Number(gift.rewardId));
  const pointsAmount = isPointsGift ? Number(gift.rewardId) : null;
  const cfg = getRewardConfig(gift.rewardType, isPointsGift);
  const accentColor = cfg.color;

  const itemName = es ? (gift.rewardItemNameEs ?? null) : (gift.rewardItemNameEn ?? null);

  const rewardTypeLabel: Record<PendingGift['rewardType'], string> = {
    CHEST: isPointsGift
      ? (es ? 'Compensación de puntos' : 'Points compensation')
      : (es ? 'Cofre especial' : 'Special Chest'),
    THEME: es ? 'Tema exclusivo' : 'Exclusive Theme',
    TITLE: es ? 'Título especial' : 'Special Title',
    AVATAR: es ? 'Avatar exclusivo' : 'Exclusive Avatar',
    ITEM: es ? 'Ítem premium' : 'Premium Item',
  };

  const rotate = iconRotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '0deg'] });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Blurred backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      </Animated.View>

      {/* Card */}
      <View style={styles.centerer} pointerEvents="box-none">
        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
            width: SCREEN_W - 48,
            maxWidth: 360,
          }}
        >
          {/* Card shell */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Colored accent top bar */}
            <LinearGradient
              colors={[accentColor, accentColor + 'AA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topBar}
            />

            {/* Header: label + close */}
            <View style={styles.header}>
              <View style={[styles.headerBadge, { backgroundColor: accentColor + '15' }]}>
                <Gift size={13} color={accentColor} strokeWidth={2.5} />
                <Text style={[styles.headerLabel, { color: accentColor }]}>
                  {es ? 'REGALO PARA TI' : 'A GIFT FOR YOU'}
                </Text>
              </View>
              <Pressable
                onPress={handleLater}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                style={({ pressed }) => [styles.closeBtn, { backgroundColor: pressed ? colors.textMuted + '25' : colors.textMuted + '14' }]}
              >
                <X size={17} color={colors.textMuted} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Body */}
            <View style={styles.body}>
              {/* Floating icon with particles */}
              <View style={styles.iconWrapper}>
                {/* Particle burst */}
                {PARTICLES.map((p, i) => (
                  <Particle
                    key={`${particleKey}-${i}`}
                    delay={250 + i * 80}
                    startX={(i * (SCREEN_W / PARTICLES.length)) * 0.38}
                    color={p}
                  />
                ))}

                {/* Glow ring */}
                <View style={[styles.glowRing, { borderColor: accentColor + '30', backgroundColor: accentColor + '10' }]} />

                {/* Icon */}
                <Animated.View style={{ transform: [{ scale: iconScale }, { rotate }, { translateY: bounceY }] }}>
                  <LinearGradient
                    colors={[cfg.gradientStart, cfg.gradientEnd]}
                    style={styles.iconCircle}
                  >
                    <Text style={styles.iconEmoji}>{cfg.icon}</Text>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Gift title */}
              <Text style={[styles.giftTitle, { color: colors.text }]} numberOfLines={2}>
                {gift.title}
              </Text>

              {/* Amount reveal — large for points, item name for items */}
              <Animated.View style={{ transform: [{ scale: amountScale }], alignItems: 'center' }}>
                {isPointsGift ? (
                  <View style={styles.pointsBlock}>
                    <Text style={[styles.pointsAmount, { color: accentColor }]}>
                      +{pointsAmount?.toLocaleString()}
                    </Text>
                    <View style={[styles.pointsBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
                      <Coins size={13} color={accentColor} />
                      <Text style={[styles.pointsBadgeText, { color: accentColor }]}>puntos</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.itemNameBadge, { backgroundColor: accentColor + '12', borderColor: accentColor + '30' }]}>
                    <Text style={[styles.itemNameText, { color: accentColor }]} numberOfLines={2}>
                      {itemName ?? rewardTypeLabel[gift.rewardType]}
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* Message — for non-points gifts */}
              {!isPointsGift && gift.message ? (
                <View style={[styles.messageBox, { backgroundColor: colors.background, borderLeftColor: accentColor }]}>
                  <Text style={[styles.messageText, { color: colors.textMuted }]} numberOfLines={3}>
                    "{gift.message}"
                  </Text>
                </View>
              ) : isPointsGift && gift.message ? (
                <Text style={[styles.subtitleText, { color: colors.textMuted }]} numberOfLines={2}>
                  {gift.message}
                </Text>
              ) : null}

              {/* Reward type chip */}
              <View style={[styles.typeBadge, { backgroundColor: colors.background, borderColor: colors.textMuted + '20' }]}>
                <Sparkles size={12} color={colors.textMuted} />
                <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>
                  {rewardTypeLabel[gift.rewardType]}
                </Text>
              </View>
            </View>

            {/* CTA area */}
            <View style={styles.ctas}>
              <ActionButton
                onPress={isPointsGift ? handleClaim : handleClaimAndGoToStore}
                disabled={claiming}
                loading={claiming}
                label={
                  claiming
                    ? (es ? 'Reclamando…' : 'Claiming…')
                    : isPointsGift
                      ? (es ? '¡Reclamar puntos!' : 'Claim points!')
                      : (es ? '¡Reclamar y ver en tienda!' : 'Claim & View in Store!')
                }
                icon={isPointsGift
                  ? (color, size) => <Coins size={size} color={color} strokeWidth={2.5} />
                  : (color, size) => <ShoppingBag size={size} color={color} strokeWidth={2.5} />
                }
                fillColor={accentColor}
                size="md"
              />

              {!isPointsGift && (
                <ActionButton
                  onPress={handleClaim}
                  disabled={claiming}
                  label={es ? 'Solo reclamar' : 'Just claim'}
                  variant="secondary"
                  size="md"
                />
              )}

              <Pressable onPress={handleLater} hitSlop={{ top: 8, bottom: 8 }} style={{ alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500' }}>
                  {es ? 'Más tarde' : 'Later'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 24,
  },
  topBar: {
    height: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  glowRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 48,
  },
  giftTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  pointsBlock: {
    alignItems: 'center',
    gap: 6,
  },
  pointsAmount: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 54,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  itemNameBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    maxWidth: 260,
  },
  itemNameText: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  messageBox: {
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    width: '100%',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  subtitleText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctas: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 10,
  },
});
