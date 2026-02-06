// Store Screen - Points Redemption

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Coins, Check, ShoppingBag, Sparkles, X } from 'lucide-react-native';
import {
  useThemeColors,
  useLanguage,
  useUserPoints,
  useUser,
  useAppStore,
} from '@/lib/store';
import { TRANSLATIONS, DEFAULT_AVATARS, STORE_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/cn';

interface StoreItemCardProps {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  price: number;
  isPurchased: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onPurchase: () => void;
}

function StoreItemCard({
  id,
  name,
  description,
  emoji,
  price,
  isPurchased,
  canAfford,
  colors,
  onPurchase,
}: StoreItemCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (!isPurchased && canAfford) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPurchase();
          }
        }}
        disabled={isPurchased || !canAfford}
        className="mb-4"
      >
        <View
          className="rounded-2xl p-4 flex-row items-center"
          style={{
            backgroundColor: colors.surface,
            opacity: !canAfford && !isPurchased ? 0.6 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Icon */}
          <View
            className="w-16 h-16 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            {emoji ? (
              <Text style={{ fontSize: 32 }}>{emoji}</Text>
            ) : (
              <Sparkles size={28} color={colors.primary} />
            )}
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text
              className="text-base font-semibold mb-1"
              style={{ color: colors.text }}
            >
              {name}
            </Text>
            <Text
              className="text-sm"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {description}
            </Text>
          </View>

          {/* Price / Status */}
          {isPurchased ? (
            <View
              className="px-3 py-2 rounded-full flex-row items-center"
              style={{ backgroundColor: '#22C55E20' }}
            >
              <Check size={14} color="#22C55E" strokeWidth={3} />
              <Text className="text-green-600 font-semibold ml-1 text-sm">
                Owned
              </Text>
            </View>
          ) : (
            <View
              className="px-3 py-2 rounded-full flex-row items-center"
              style={{
                backgroundColor: canAfford ? colors.primary : colors.textMuted + '30',
              }}
            >
              <Coins size={14} color={canAfford ? '#FFFFFF' : colors.textMuted} />
              <Text
                className="font-bold ml-1 text-sm"
                style={{ color: canAfford ? '#FFFFFF' : colors.textMuted }}
              >
                {price}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const points = useUserPoints();
  const user = useUser();
  const purchaseItem = useAppStore((s) => s.purchaseItem);
  const t = TRANSLATIONS[language];

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    price: number;
    emoji?: string;
  } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const purchasedItems = user?.purchasedItems ?? [];

  const handlePurchaseRequest = useCallback(
    (item: { id: string; name: string; price: number; emoji?: string }) => {
      setSelectedItem(item);
      setShowConfirmModal(true);
    },
    []
  );

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedItem) return;

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = purchaseItem(selectedItem.id, selectedItem.price);

    setIsPurchasing(false);
    setShowConfirmModal(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  }, [selectedItem, purchaseItem]);

  // Filter avatars that can be purchased (have a price)
  const purchasableAvatars = DEFAULT_AVATARS.filter(
    (a) => 'price' in a
  ) as Array<{ id: string; name: string; emoji: string; price: number }>;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View
          className="px-5 pb-6"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text
            className="text-3xl font-bold mb-4"
            style={{ color: colors.text }}
          >
            {t.store}
          </Text>

          {/* Points Balance Card */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/80 text-sm font-medium mb-1">
                  Your Balance
                </Text>
                <View className="flex-row items-center">
                  <Coins size={28} color="#FFFFFF" />
                  <Text className="text-white text-4xl font-bold ml-2">
                    {points}
                  </Text>
                </View>
              </View>
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                <ShoppingBag size={28} color="#FFFFFF" />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Special Items */}
        <View className="px-5 mb-6">
          <Text
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            Special Items
          </Text>

          <StoreItemCard
            id="nickname_change"
            name={language === 'es' ? 'Cambio de Apodo' : 'Nickname Change'}
            description={
              language === 'es'
                ? 'Cambia tu apodo una vez'
                : 'Change your nickname once'
            }
            price={500}
            isPurchased={purchasedItems.includes('nickname_change')}
            canAfford={points >= 500}
            colors={colors}
            onPurchase={() =>
              handlePurchaseRequest({
                id: 'nickname_change',
                name: 'Nickname Change',
                price: 500,
              })
            }
          />
        </View>

        {/* Avatars */}
        <View className="px-5">
          <Text
            className="text-lg font-semibold mb-4"
            style={{ color: colors.text }}
          >
            Avatars
          </Text>

          {purchasableAvatars.map((avatar, index) => (
            <Animated.View
              key={avatar.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <StoreItemCard
                id={avatar.id}
                name={avatar.name}
                description={`Unlock the ${avatar.name} avatar`}
                emoji={avatar.emoji}
                price={avatar.price}
                isPurchased={purchasedItems.includes(avatar.id)}
                canAfford={points >= avatar.price}
                colors={colors}
                onPurchase={() =>
                  handlePurchaseRequest({
                    id: avatar.id,
                    name: avatar.name,
                    price: avatar.price,
                    emoji: avatar.emoji,
                  })
                }
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Confirm Purchase Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <Pressable
              onPress={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>

            <View className="items-center mb-6 pt-4">
              {selectedItem?.emoji ? (
                <Text style={{ fontSize: 56 }}>{selectedItem.emoji}</Text>
              ) : (
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <Sparkles size={36} color={colors.primary} />
                </View>
              )}
            </View>

            <Text
              className="text-xl font-bold text-center mb-2"
              style={{ color: colors.text }}
            >
              {t.purchase} {selectedItem?.name}?
            </Text>

            <Text
              className="text-center mb-6"
              style={{ color: colors.textMuted }}
            >
              This will cost{' '}
              <Text className="font-bold" style={{ color: colors.primary }}>
                {selectedItem?.price} points
              </Text>
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: colors.textMuted }}
                >
                  {t.cancel}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmPurchase}
                disabled={isPurchasing}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">{t.confirm}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <Animated.View
            entering={FadeIn.duration(200)}
            className="rounded-3xl p-8 items-center"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="w-20 h-20 rounded-full items-center justify-center bg-green-500 mb-4">
              <Check size={40} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text }}
            >
              {t.purchase_success}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
