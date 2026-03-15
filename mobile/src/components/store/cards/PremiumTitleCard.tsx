import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Coins, Check, Gift, Lock, Award } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { SPIRITUAL_TITLES, RARITY_COLORS, RARITY_GRADIENTS, TRANSLATIONS } from '@/lib/constants';
import { RarityBadge } from '@/components/store/RarityBadge';

export function PremiumTitleCard({
  titleData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
  isHighlighted = false,
  isNewGift = false,
  viewRef,
}: {
  titleData: typeof SPIRITUAL_TITLES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  isNewGift?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const { sFont } = useScaledFont();
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const rarityColor = RARITY_COLORS[titleData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.03), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  return (
    <Animated.View ref={viewRef as any} style={animatedStyle} className="mb-3">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.25 : 0.12,
          shadowRadius: isEquipped ? 10 : 6,
          elevation: isEquipped ? 4 : 2,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Highlight overlay */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 16, borderWidth: 2.5,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }]}
        />
        <LinearGradient
          colors={RARITY_GRADIENTS[titleData.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: rarityColor + '25' }}
          >
            {!canAfford && !isOwned ? (
              titleData.chestOnly ? <Gift size={22} color="#F59E0B" /> : <Lock size={22} color={colors.textMuted} />
            ) : (
              <Award size={22} color={rarityColor} />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text
                className="text-sm font-bold"
                style={{ color: colors.text }}
              >
                {language === 'es' ? titleData.nameEs : titleData.name}
              </Text>
              <View className="ml-2">
                <RarityBadge rarity={titleData.rarity} language={language} />
              </View>
              {isNewGift && (
                <View style={{
                  marginLeft: 6,
                  backgroundColor: '#EF4444',
                  borderRadius: 99,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                    {language === 'es' ? 'NUEVO' : 'NEW'}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {language === 'es' ? titleData.descriptionEs : titleData.description}
            </Text>
            {titleData.bibleRef && (
              <Text
                className="text-xs font-medium mt-0.5"
                style={{ color: rarityColor, opacity: 0.85 }}
                numberOfLines={1}
              >
                {titleData.bibleRef}
              </Text>
            )}
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
              <Check size={14} color="#22C55E" strokeWidth={3} />
              <Text className="text-xs font-semibold text-green-600 ml-1">
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <View
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                {t.equip}
              </Text>
            </View>
          ) : titleData.chestOnly ? (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#F59E0B20' }}>
              <Gift size={13} color="#F59E0B" />
              <Text className="text-xs font-bold ml-1" style={{ color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: colors.primary + '15' }}>
              <Coins size={14} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                className="text-xs font-bold ml-1"
                style={{ color: canAfford ? colors.primary : colors.textMuted }}
              >
                {titleData.price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default PremiumTitleCard;
