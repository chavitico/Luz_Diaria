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
import { Coins, Check, Gift, Lock, Star } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS, RARITY_COLORS, RARITY_GRADIENTS, STORE_BUNDLES } from '@/lib/constants';
import { RarityIcon } from '@/components/store/RarityBadge';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';

export function PremiumAvatarCard({
  avatar,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
  isHighlighted = false,
  isNewGift = false,
  isNew = false,
  viewRef,
}: {
  avatar: typeof DEFAULT_AVATARS[number];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  isNewGift?: boolean;
  isNew?: boolean;
  viewRef?: (ref: View | null) => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
  const price = hasCost ? (avatar as { price: number }).price : 0;
  const rarity = avatar.rarity || 'common';
  const rarityColor = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const isV2Avatar = 'isV2' in avatar && (avatar as { isV2?: boolean }).isV2 === true;

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

  return (
    <Animated.View ref={viewRef as any} style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.35 : (isV2Avatar ? 0.25 : 0.15),
          shadowRadius: isV2Avatar ? 10 : 8,
          elevation: isEquipped ? 5 : (isV2Avatar ? 4 : 3),
          borderWidth: isEquipped ? 2 : (isV2Avatar ? 1 : 0),
          borderColor: isEquipped ? colors.primary : (isV2Avatar ? rarityColor + '40' : 'transparent'),
          opacity: !canAfford && !isOwned && (hasCost || (avatar as { chestOnly?: boolean }).chestOnly) ? 0.7 : 1,
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
          colors={isV2Avatar
            ? [rarityColor + '15', rarityColor + '08']
            : (RARITY_GRADIENTS[rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common)
          }
          style={{ padding: 12, alignItems: 'center' }}
        >
          {/* V2 Badge */}
          {isV2Avatar && (
            <View style={{
              position: 'absolute',
              top: 6,
              right: 6,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: rarityColor + '20',
            }}>
              <Text style={{ fontSize: sFont(8), fontWeight: '700', color: rarityColor }}>V2</Text>
            </View>
          )}

          {/* NEW gift badge (red — from gifts) or NEW item badge (green — catalog) */}
          {isNewGift && (
            <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 10 }}>
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
          {!isNewGift && isNew && !isOwned && (
            <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 10 }}>
              <View style={{
                backgroundColor: '#22C55E',
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 3,
                shadowColor: '#22C55E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
            </View>
          )}

          {/* Adventure badge - shows bundle number if known */}
          {(avatar as { isAdventure?: boolean }).isAdventure && (() => {
            // Find which adventure bundle this avatar belongs to
            const bundle = Object.values(STORE_BUNDLES).find(b =>
              (b as any).isAdventure && b.items.includes(avatar.id)
            );
            const num = bundle ? (bundle as any).adventureNumber : undefined;
            return (
              <View style={{ position: 'absolute', bottom: 6, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#C89B3C',
                  borderRadius: 99,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  gap: 3,
                }}>
                  <Star size={7} color="#FFF" fill="#FFF" />
                  <Text style={{ fontSize: sFont(8), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
                    {num ? `Av. #${num}` : (language === 'es' ? 'Aventura' : 'Adventure')}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Avatar Emoji */}
          <View style={{ position: 'relative', marginBottom: 8 }}>
            {/* Static glow ring for V2 avatars */}
            {isV2Avatar && (
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  left: -5,
                  width: 76 + 10,
                  height: 76 + 10,
                  borderRadius: (76 + 10) / 2,
                  borderWidth: 1,
                  borderColor: rarityColor + '70',
                }}
              />
            )}
            <View
              style={{
                width: isV2Avatar ? 76 : 64,
                height: isV2Avatar ? 76 : 64,
                borderRadius: isV2Avatar ? 38 : 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isV2Avatar ? colors.surface : colors.primary + '15',
                borderWidth: isV2Avatar ? 3 : (rarity !== 'common' ? 2 : 0),
                borderColor: isV2Avatar ? rarityColor + '60' : rarityColor + '40',
                shadowColor: isV2Avatar ? rarityColor : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isV2Avatar ? 0.4 : 0,
                shadowRadius: isV2Avatar ? 8 : 0,
              }}
            >
              {isV2Avatar ? (
                <IllustratedAvatar avatarId={avatar.id} size={60} emoji={avatar.emoji} />
              ) : (
                <Text style={{ fontSize: sFont(32) }}>{avatar.emoji}</Text>
              )}
            </View>

            {/* Rarity indicator */}
            {rarity !== 'common' && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: rarityColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <RarityIcon rarity={rarity} size={10} />
              </View>
            )}

            {/* Lock Overlay with blur effect for V2 */}
            {!isOwned && (hasCost || (avatar as { chestOnly?: boolean }).chestOnly) && !canAfford && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isV2Avatar ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.35)',
                borderRadius: isV2Avatar ? 38 : 32,
              }}>
                {(avatar as { chestOnly?: boolean }).chestOnly
                  ? <Gift size={16} color="#F59E0B" />
                  : <Lock size={18} color="#FFFFFF" />
                }
              </View>
            )}
          </View>

          <Text
            style={{ fontSize: sFont(11), fontWeight: isV2Avatar ? '700' : '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}
            numberOfLines={1}
          >
            {language === 'es' && avatar.nameEs ? avatar.nameEs : avatar.name}
          </Text>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={10} color="#22C55E" strokeWidth={3} />
            </View>
          ) : isOwned && !isEquipped && hasCost ? (
            <Text style={{ fontSize: sFont(10), color: colors.primary, fontWeight: '600' }}>
              {language === 'es' ? 'Equipar' : 'Equip'}
            </Text>
          ) : (avatar as { chestOnly?: boolean }).chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={10} color="#F59E0B" />
              <Text style={{ fontSize: sFont(9), fontWeight: '700', marginLeft: 2, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : !hasCost || isOwned ? (
            <Text style={{ fontSize: sFont(10), color: '#22C55E', fontWeight: '600' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={10} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: sFont(10), fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default PremiumAvatarCard;
