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
import { Coins, Check, Gift, Lock } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { AVATAR_FRAMES, RARITY_COLORS, RARITY_GRADIENTS, TRANSLATIONS } from '@/lib/constants';
import { RarityIcon } from '@/components/store/RarityBadge';

export function PremiumFrameCard({
  frameData,
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
  frameData: typeof AVATAR_FRAMES[string];
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
  const rarityColor = RARITY_COLORS[frameData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const gradientColors = RARITY_GRADIENTS[frameData.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common;
  const isV2Frame = 'isV2' in frameData && (frameData as any).isV2 === true;

  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.06), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  const circleSize = isV2Frame ? 84 : 72;
  const circleRadius = circleSize / 2;

  return (
    <Animated.View ref={viewRef as any} style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : frameData.color,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 4 },
          shadowOpacity: isEquipped ? 0.35 : (isV2Frame ? 0.28 : 0.2),
          shadowRadius: isV2Frame ? 14 : 10,
          elevation: isEquipped ? 5 : (isV2Frame ? 4 : 3),
          borderWidth: isEquipped ? 2 : (isV2Frame ? 1 : 0),
          borderColor: isEquipped ? colors.primary : (isV2Frame ? frameData.color + '50' : 'transparent'),
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
          colors={gradientColors}
          style={{ padding: 14, alignItems: 'center' }}
        >
          {/* V2 Badge */}
          {isV2Frame && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 5,
              backgroundColor: frameData.color + '30',
              borderWidth: 1,
              borderColor: frameData.color + '60',
            }}>
              <Text style={{ fontSize: sFont(8), fontWeight: '800', color: frameData.color, letterSpacing: 0.5 }}>V2</Text>
            </View>
          )}

          {/* NEW gift badge */}
          {isNewGift && (
            <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
              <View style={{
                backgroundColor: '#EF4444',
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
            </View>
          )}

          {/* Frame Preview Circle */}
          <View style={{ position: 'relative', marginBottom: 10 }}>
            {/* Radial glow for V2 */}
            {isV2Frame && (
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: circleRadius + 8,
                  backgroundColor: frameData.color + '18',
                }}
              />
            )}
            <View
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: circleRadius,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
                borderWidth: isV2Frame ? 6 : 5,
                borderColor: frameData.color,
                shadowColor: frameData.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isV2Frame ? 0.6 : 0.4,
                shadowRadius: isV2Frame ? 12 : 8,
              }}
            >
              <Text style={{ fontSize: isV2Frame ? 32 : 28 }}>🕊️</Text>
            </View>

            {/* Lock Overlay */}
            {!canAfford && !isOwned && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: circleRadius,
              }}>
                {frameData.chestOnly ? <Gift size={18} color="#F59E0B" /> : <Lock size={20} color="#FFFFFF" />}
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isV2Frame ? 2 : 4 }}>
            <Text
              style={{ fontSize: sFont(12), fontWeight: '700', color: colors.text, maxWidth: isV2Frame ? 80 : 70 }}
              numberOfLines={1}
            >
              {language === 'es' ? frameData.nameEs : frameData.name}
            </Text>
            <View style={{ marginLeft: 4 }}>
              <RarityIcon rarity={frameData.rarity} size={12} />
            </View>
          </View>

          {/* V2 subtitle description */}
          {isV2Frame && (
            <Text
              style={{ fontSize: sFont(9), color: colors.textMuted, textAlign: 'center', marginBottom: 4, maxWidth: 80 }}
              numberOfLines={1}
            >
              {language === 'es'
                ? (frameData.descriptionEs || frameData.description || '').slice(0, 22)
                : (frameData.description || '').slice(0, 22)}
            </Text>
          )}

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={11} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: sFont(10), fontWeight: '600', color: '#22C55E', marginLeft: 2 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: sFont(11), fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : frameData.chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={10} color="#F59E0B" />
              <Text style={{ fontSize: sFont(9), fontWeight: '700', marginLeft: 2, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={11} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: sFont(11), fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {frameData.price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default PremiumFrameCard;
