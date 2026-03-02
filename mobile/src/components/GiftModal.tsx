// GiftModal - Shows a pending gift to the user with claim/later options

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Gift, X, Package, Palette, Tag, User as UserIcon, Star } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { useQueryClient } from '@tanstack/react-query';

export interface PendingGift {
  userGiftId: string;
  giftDropId: string;
  title: string;
  message: string;
  rewardType: 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';
  rewardId: string;
  createdAt: string;
}

interface GiftModalProps {
  visible: boolean;
  gift: PendingGift;
  onClaim: () => Promise<void>;
  onLater: () => void;
}

function RewardPreview({ rewardType, rewardId }: { rewardType: PendingGift['rewardType']; rewardId: string }) {
  const colors = useThemeColors();

  const config: Record<PendingGift['rewardType'], { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    CHEST: {
      icon: <Text style={{ fontSize: 52 }}>📦</Text>,
      label: rewardId,
      color: '#F59E0B',
      bg: '#FEF3C7',
    },
    THEME: {
      icon: <Palette size={48} color="#8B5CF6" strokeWidth={1.5} />,
      label: rewardId,
      color: '#8B5CF6',
      bg: '#EDE9FE',
    },
    TITLE: {
      icon: <Tag size={48} color="#0EA5E9" strokeWidth={1.5} />,
      label: rewardId,
      color: '#0EA5E9',
      bg: '#E0F2FE',
    },
    AVATAR: {
      icon: <UserIcon size={48} color="#EC4899" strokeWidth={1.5} />,
      label: rewardId,
      color: '#EC4899',
      bg: '#FCE7F3',
    },
    ITEM: {
      icon: <Star size={48} color="#10B981" strokeWidth={1.5} />,
      label: rewardId,
      color: '#10B981',
      bg: '#D1FAE5',
    },
  };

  const { icon, color, bg } = config[rewardType];

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 30,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: color + '40',
        }}
      >
        {icon}
      </View>
    </View>
  );
}

export default function GiftModal({ visible, gift, onClaim, onLater }: GiftModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const chestBounceAnim = useRef(new Animated.Value(0)).current;
  const [claiming, setClaiming] = React.useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Gentle idle bounce for chest
      Animated.loop(
        Animated.sequence([
          Animated.timing(chestBounceAnim, {
            toValue: -6,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(chestBounceAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      chestBounceAnim.setValue(0);
    }
  }, [visible]);

  const handleClaim = async () => {
    if (claiming) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaiming(true);
    try {
      await onClaim();
      // Refresh inventory and store queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLater();
  };

  const rewardTypeLabel: Record<PendingGift['rewardType'], string> = {
    CHEST: language === 'es' ? 'Cofre especial' : 'Special Chest',
    THEME: language === 'es' ? 'Tema exclusivo' : 'Exclusive Theme',
    TITLE: language === 'es' ? 'Título especial' : 'Special Title',
    AVATAR: language === 'es' ? 'Avatar exclusivo' : 'Exclusive Avatar',
    ITEM: language === 'es' ? 'Item premium' : 'Premium Item',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <BlurView
        intensity={40}
        tint="dark"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            width: '100%',
            maxWidth: 360,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 32,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.3,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            {/* Header gradient strip */}
            <View
              style={{
                height: 6,
                backgroundColor: '#F59E0B',
              }}
            />

            {/* Close button */}
            <Pressable
              onPress={handleLater}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.textMuted + '20',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>

            <View style={{ padding: 28, alignItems: 'center', gap: 20 }}>
              {/* Gift icon */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 20,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: '#F59E0B40',
                  }}
                >
                  <Gift size={28} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1.5,
                    color: '#F59E0B',
                    textTransform: 'uppercase',
                  }}
                >
                  {language === 'es' ? 'Regalo para ti' : 'A gift for you'}
                </Text>
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: colors.text,
                  textAlign: 'center',
                  lineHeight: 28,
                }}
              >
                {gift.title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textMuted,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                {gift.message}
              </Text>

              {/* Reward preview */}
              <Animated.View style={{ transform: [{ translateY: chestBounceAnim }] }}>
                <RewardPreview rewardType={gift.rewardType} rewardId={gift.rewardId} />
              </Animated.View>

              {/* Reward type label */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: colors.primary + '15',
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.primary,
                  }}
                >
                  {rewardTypeLabel[gift.rewardType]}
                </Text>
              </View>

              {/* CTA buttons */}
              <View style={{ width: '100%', gap: 10, paddingTop: 4 }}>
                <Pressable
                  onPress={handleClaim}
                  disabled={claiming}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#D97706' : '#F59E0B',
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: 'center',
                    opacity: claiming ? 0.7 : 1,
                    shadowColor: '#F59E0B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    elevation: 6,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>
                    {claiming
                      ? (language === 'es' ? 'Reclamando...' : 'Claiming...')
                      : (language === 'es' ? '¡Reclamar regalo!' : 'Claim Gift!')
                    }
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleLater}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '500' }}>
                    {language === 'es' ? 'Más tarde' : 'Later'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
