import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Coins, Check } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { RARITY_COLORS } from '@/lib/constants';

export function TokenItemCard({
  id, emoji, name, nameEs, description, descriptionEs, warning, warningEs,
  price, rarity, isOwned, isUsed, canAfford, colors, language, onPress, isHighlighted,
}: {
  id: string;
  emoji: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  warning: string;
  warningEs: string;
  price: number;
  rarity: string;
  isOwned: boolean;
  isUsed: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
}) {
  const { sFont } = useScaledFont();
  const rarityColor = rarity === 'legendary' ? '#F59E0B' : RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? nameEs : name;
  const displayDesc = language === 'es' ? descriptionEs : description;
  const displayWarning = language === 'es' ? warningEs : warning;
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    shadowOpacity: glow.value * 0.8,
  }));

  React.useEffect(() => {
    if (isHighlighted) {
      glow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withRepeat(withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })), 3),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.02), withDelay(2400, withSpring(1)));
    }
  }, [isHighlighted]);

  return (
    // Phase D fix: split entering= and useAnimatedStyle onto separate elements.
    // Outer plain View has no animation; inner Animated.View has only useAnimatedStyle (no entering=).
    // This eliminates the "Property transform may be overwritten by layout animation" Reanimated warning.
    <View style={{ marginBottom: 12 }}>
      <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { if (!isOwned) scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <LinearGradient
          colors={isOwned ? [colors.surface, colors.surface] : ['#1A0A00', '#2D1500', '#1A0A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: isHighlighted ? rarityColor : (isOwned ? colors.textMuted + '30' : rarityColor + '60'),
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: isOwned ? colors.background : rarityColor + '20',
              borderWidth: 2, borderColor: isOwned ? colors.textMuted + '30' : rarityColor + '50',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: sFont(32) }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {/* Rarity badge */}
              <View style={{
                backgroundColor: rarityColor + '20', borderWidth: 1, borderColor: rarityColor + '50',
                borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: rarityColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Legendario' : 'Legendary'} · {language === 'es' ? 'Único' : 'One-time'}
                </Text>
              </View>
              <Text style={{
                fontSize: sFont(18), fontWeight: '800', letterSpacing: -0.3,
                color: isOwned ? colors.textMuted : '#FFFFFF',
                marginBottom: 2,
              }}>
                {displayName}
              </Text>
              <Text style={{ fontSize: sFont(12), color: isOwned ? colors.textMuted : 'rgba(255,255,255,0.65)', lineHeight: 17 }}>
                {displayDesc}
              </Text>
            </View>
          </View>

          {/* Warning */}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, marginBottom: 14,
            backgroundColor: isOwned ? colors.textMuted + '10' : '#F59E0B10',
            borderWidth: 1, borderColor: isOwned ? colors.textMuted + '20' : '#F59E0B30',
          }}>
            <Text style={{ fontSize: sFont(13) }}>⚠️</Text>
            <Text style={{ flex: 1, fontSize: sFont(11), color: isOwned ? colors.textMuted : '#F59E0B', lineHeight: 16 }}>
              {displayWarning}
            </Text>
          </View>

          {/* Footer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Coins size={16} color={isOwned ? colors.textMuted : canAfford ? '#F59E0B' : '#888'} />
              <Text style={{ fontSize: sFont(18), fontWeight: '800', color: isOwned ? colors.textMuted : canAfford ? '#F59E0B' : '#888' }}>
                {price.toLocaleString()}
              </Text>
            </View>
            {isOwned ? (
              <View style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
                backgroundColor: isUsed ? colors.textMuted + '20' : '#22C55E20',
                borderWidth: 1, borderColor: isUsed ? colors.textMuted + '30' : '#22C55E40',
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
                {isUsed
                  ? <Text style={{ fontSize: sFont(12), fontWeight: '700', color: colors.textMuted }}>{language === 'es' ? 'Ya utilizado' : 'Already used'}</Text>
                  : <>
                      <Check size={12} color="#22C55E" strokeWidth={3} />
                      <Text style={{ fontSize: sFont(12), fontWeight: '700', color: '#22C55E' }}>{language === 'es' ? 'Adquirido' : 'Owned'}</Text>
                    </>
                }
              </View>
            ) : (
              <View style={{
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99,
                backgroundColor: canAfford ? '#F59E0B' : colors.textMuted + '30',
              }}>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: canAfford ? '#000000' : colors.textMuted }}>
                  {canAfford
                    ? (language === 'es' ? 'Obtener' : 'Get')
                    : (language === 'es' ? 'Sin puntos' : 'Need points')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
    </View>
  );
}

export default TokenItemCard;
