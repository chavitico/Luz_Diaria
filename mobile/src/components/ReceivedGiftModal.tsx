// ReceivedGiftModal — shown when user has an unseen item gift from another user
// Triggered from _layout.tsx when gift notifications are detected on startup/foreground

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Gift, Coins } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { ActionButton } from '@/components/ui/ActionButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceivedGift {
  notificationId: string;
  giftId: string;
  senderNickname: string;
  senderAvatarId: string;
  message: string;
  createdAt: string;
  item: {
    id: string;
    nameEs: string;
    nameEn: string;
    type: string;
    assetRef: string;
    rarity: string;
  } | null;
}

interface ReceivedGiftModalProps {
  visible: boolean;
  gift: ReceivedGift | null;
  onEquip: () => void;
  onClose: () => void;
}

// ─── Particle confetti ────────────────────────────────────────────────────────
function Sparkle({ delay, x, color }: { delay: number; x: number; color: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -60, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        bottom: 0,
        left: x,
        fontSize: 16,
        opacity,
        transform: [{ translateY }],
      }}
    >
      {color}
    </Animated.Text>
  );
}

const SPARKLES = ['✨', '🌟', '💫', '⭐', '✨', '🌟', '💫'];

// ─── Rarity glow colors ───────────────────────────────────────────────────────
const RARITY_GLOW: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#D4A017',
};

// ─── Main component ───────────────────────────────────────────────────────────

export function ReceivedGiftModal({ visible, gift, onEquip, onClose }: ReceivedGiftModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const insets = useSafeAreaInsets();
  const es = language === 'es';

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [sparkleKey, setSparkleKey] = React.useState(0);

  useEffect(() => {
    if (visible && gift) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSparkleKey(k => k + 1);

      // Entry animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 12,
      }).start();

      // Glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Icon pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.6);
      glowAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, gift]);

  if (!gift) return null;

  const rarity = gift.item?.rarity ?? 'common';
  const glowColor = RARITY_GLOW[rarity] ?? RARITY_GLOW.common;
  const itemName = gift.item ? (es ? gift.item.nameEs : gift.item.nameEn) : '?';

  const typeIcon: Record<string, string> = {
    theme: '🎨', frame: '🖼️', title: '🏅', avatar: '🕊️',
    music: '🎵', badge: '🌟',
  };
  const itemEmoji = typeIcon[gift.item?.type ?? ''] ?? '🎁';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            width: '100%',
            maxWidth: 360,
            backgroundColor: colors.surface,
            borderRadius: 28,
            overflow: 'hidden',
            // Glow shadow
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 30,
            shadowOpacity: 0.5,
            elevation: 20,
          }}
        >
          {/* Glow top strip */}
          <Animated.View
            style={{
              height: 4,
              backgroundColor: glowColor,
              opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            }}
          />

          <View style={{ padding: 28, alignItems: 'center', gap: 0 }}>
            {/* Title */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, marginBottom: 16 }}>
              {es ? '🎁 REGALO RECIBIDO' : '🎁 GIFT RECEIVED'}
            </Text>

            {/* Item icon — pulsing */}
            <View style={{ position: 'relative', marginBottom: 20, height: 100 }}>
              {SPARKLES.map((s, i) => (
                <Sparkle
                  key={`${sparkleKey}-${i}`}
                  delay={i * 120}
                  x={(i * 14) - 10}
                  color={s}
                />
              ))}
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                  width: 96, height: 96, borderRadius: 28,
                  backgroundColor: glowColor + '18',
                  borderWidth: 2,
                  borderColor: glowColor + '50',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 44 }}>{itemEmoji}</Text>
              </Animated.View>
            </View>

            {/* Sender line */}
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 6 }}>
              <Text style={{ fontWeight: '700', color: colors.primary }}>@{gift.senderNickname}</Text>
              {es ? ' te regaló' : ' gifted you'}
            </Text>

            {/* Item name */}
            <Text
              style={{
                fontSize: 22, fontWeight: '900', color: glowColor,
                textAlign: 'center', marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {itemName}
            </Text>

            {/* Rarity badge */}
            <View style={{
              paddingHorizontal: 10, paddingVertical: 4,
              backgroundColor: glowColor + '18', borderRadius: 8,
              borderWidth: 1, borderColor: glowColor + '40',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: glowColor, letterSpacing: 0.8 }}>
                {rarity.toUpperCase()}
              </Text>
            </View>

            {/* Message */}
            {gift.message ? (
              <View style={{
                backgroundColor: colors.background,
                borderRadius: 14, padding: 14,
                borderLeftWidth: 3, borderLeftColor: glowColor,
                marginBottom: 20, width: '100%',
              }}>
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, fontStyle: 'italic' }}>
                  "{gift.message}"
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 20 }} />
            )}

            {/* CTAs */}
            <View style={{ width: '100%', gap: 10 }}>
              <ActionButton
                label={es ? 'Equipar ahora' : 'Equip now'}
                fillColor={glowColor}
                onPress={onEquip}
              />
              <ActionButton
                label={es ? 'Cerrar' : 'Close'}
                variant="ghost"
                size="sm"
                onPress={onClose}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default ReceivedGiftModal;
