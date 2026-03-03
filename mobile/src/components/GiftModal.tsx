// GiftModal - Shows a pending gift to the user with claim/later options

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Gift, X, Package, Palette, Tag, User as UserIcon, Star, ShoppingBag, Coins } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

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

function RewardPreview({ rewardType, rewardId, itemName }: { rewardType: PendingGift['rewardType']; rewardId: string; itemName?: string | null }) {
  const colors = useThemeColors();

  // Detect if CHEST is a points gift (numeric rewardId)
  const isPointsGift = rewardType === 'CHEST' && !isNaN(Number(rewardId));
  const pointsAmount = isPointsGift ? Number(rewardId) : null;

  const config: Record<PendingGift['rewardType'], { icon: React.ReactNode; color: string; bg: string }> = {
    CHEST: {
      icon: isPointsGift
        ? <Coins size={48} color="#F59E0B" strokeWidth={1.5} />
        : <Text style={{ fontSize: 52 }}>📦</Text>,
      color: '#F59E0B',
      bg: '#FEF3C7',
    },
    THEME: {
      icon: <Palette size={48} color="#8B5CF6" strokeWidth={1.5} />,
      color: '#8B5CF6',
      bg: '#EDE9FE',
    },
    TITLE: {
      icon: <Tag size={48} color="#0EA5E9" strokeWidth={1.5} />,
      color: '#0EA5E9',
      bg: '#E0F2FE',
    },
    AVATAR: {
      icon: <UserIcon size={48} color="#EC4899" strokeWidth={1.5} />,
      color: '#EC4899',
      bg: '#FCE7F3',
    },
    ITEM: {
      icon: <Star size={48} color="#10B981" strokeWidth={1.5} />,
      color: '#10B981',
      bg: '#D1FAE5',
    },
  };

  const { icon, color, bg } = config[rewardType];
  const displayName = pointsAmount !== null
    ? `+${pointsAmount.toLocaleString()} pts`
    : itemName ?? null;

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
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
      {displayName ? (
        <Text
          style={{
            fontSize: pointsAmount !== null ? 22 : 15,
            fontWeight: '800',
            color: color,
            textAlign: 'center',
            maxWidth: 220,
          }}
          numberOfLines={2}
        >
          {displayName}
        </Text>
      ) : null}
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

  const handleClaimAndGoToStore = async () => {
    if (claiming) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaiming(true);
    try {
      await onClaim();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Navigate to store tab
      router.push('/(tabs)/store');
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLater();
  };

  // Detect if this is a points gift
  const isPointsGift = gift.rewardType === 'CHEST' && !isNaN(Number(gift.rewardId));

  const rewardTypeLabel: Record<PendingGift['rewardType'], string> = {
    CHEST: isPointsGift
      ? (language === 'es' ? 'Compensación en puntos' : 'Points compensation')
      : (language === 'es' ? 'Cofre especial' : 'Special Chest'),
    THEME: language === 'es' ? 'Tema exclusivo' : 'Exclusive Theme',
    TITLE: language === 'es' ? 'Título especial' : 'Special Title',
    AVATAR: language === 'es' ? 'Avatar exclusivo' : 'Exclusive Avatar',
    ITEM: language === 'es' ? 'Item premium' : 'Premium Item',
  };

  // Resolve item name to display
  const itemName = language === 'es'
    ? (gift.rewardItemNameEs ?? null)
    : (gift.rewardItemNameEn ?? null);

  const screenHeight = Dimensions.get('window').height;
  const maxModalHeight = screenHeight * 0.82;

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
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: insets.top + 16 }}
      >
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            width: '100%',
            maxWidth: 360,
            maxHeight: maxModalHeight,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 28,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.3,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            {/* Header with close button */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 3,
                borderBottomColor: '#F59E0B',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Gift size={18} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    letterSpacing: 1.2,
                    color: '#F59E0B',
                    textTransform: 'uppercase',
                  }}
                >
                  {language === 'es' ? 'Regalo para ti' : 'A gift for you'}
                </Text>
              </View>

              {/* Close button - prominently in header */}
              <Pressable
                onPress={handleLater}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: pressed ? colors.textMuted + '30' : colors.textMuted + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <X size={18} color={colors.textMuted} strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, alignItems: 'center', gap: 16 }}
            >
              {/* Title */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: colors.text,
                  textAlign: 'center',
                  lineHeight: 26,
                }}
              >
                {gift.title}
              </Text>

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textMuted,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {gift.message}
              </Text>

              {/* Reward preview with item name */}
              <Animated.View style={{ transform: [{ translateY: chestBounceAnim }] }}>
                <RewardPreview rewardType={gift.rewardType} rewardId={gift.rewardId} itemName={itemName} />
              </Animated.View>

              {/* Reward type label */}
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 5,
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
                {/* Primary: Claim (and go to store for items) */}
                <Pressable
                  onPress={isPointsGift ? handleClaim : handleClaimAndGoToStore}
                  disabled={claiming}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#D97706' : '#F59E0B',
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: claiming ? 0.7 : 1,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: '#F59E0B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    elevation: 6,
                  })}
                >
                  {isPointsGift
                    ? <Coins size={18} color="#FFFFFF" strokeWidth={2.5} />
                    : <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.5} />
                  }
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                    {claiming
                      ? (language === 'es' ? 'Reclamando...' : 'Claiming...')
                      : isPointsGift
                        ? (language === 'es' ? '¡Reclamar puntos!' : 'Claim Points!')
                        : (language === 'es' ? '¡Reclamar y ver en tienda!' : 'Claim & View in Store!')
                    }
                  </Text>
                </Pressable>

                {/* Secondary: Just claim — only shown for item gifts */}
                {!isPointsGift && (
                  <Pressable
                    onPress={handleClaim}
                    disabled={claiming}
                    style={({ pressed }) => ({
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: pressed || claiming ? 0.6 : 1,
                      borderWidth: 1.5,
                      borderColor: colors.textMuted + '30',
                      backgroundColor: colors.textMuted + '08',
                    })}
                  >
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
                      {language === 'es' ? 'Solo reclamar' : 'Just claim'}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleLater}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '500' }}>
                    {language === 'es' ? 'Más tarde' : 'Later'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
