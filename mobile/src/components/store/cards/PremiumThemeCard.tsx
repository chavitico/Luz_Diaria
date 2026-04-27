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
import { PURCHASABLE_THEMES, RARITY_COLORS, TRANSLATIONS } from '@/lib/constants';
import { RarityIcon } from '@/components/store/RarityBadge';

export function PremiumThemeCard({
  themeData,
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
  themeData: typeof PURCHASABLE_THEMES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isHighlighted?: boolean;
  isNewGift?: boolean;
  viewRef?: (ref: View | null) => void;
})
 {
  const { sFont } = useScaledFont();
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);
  const highlightOpacity = useSharedValue(0);
  const rarityColor = RARITY_COLORS[themeData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const isV2Theme = themeData.id.includes('_v2_') || themeData.id.includes('amanecer_dorado') || themeData.id.includes('noche_profunda') || themeData.id.includes('bosque_sereno') || themeData.id.includes('desierto_suave') || themeData.id.includes('promesa_violeta') || themeData.id.includes('cielo_gloria') || themeData.id.includes('mar_misericordia') || themeData.id.includes('fuego_espiritu') || themeData.id.includes('jardin_gracia') || themeData.id.includes('olivo_paz') || themeData.id.includes('trono_azul') || themeData.id.includes('lampara_encendida') || themeData.id.includes('pergamino_antiguo') || themeData.id.includes('luz_celestial');

  // Pulse the highlight border when isHighlighted changes
  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(withSpring(1.04), withSpring(1));
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  const previewH = 96;

  return (
    <Animated.View ref={viewRef as any} style={[animatedStyle, { width: '100%' }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          flexDirection: 'row',
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.3 : (themeData.rarity !== 'common' ? 0.15 : 0.08),
          shadowRadius: isEquipped ? 12 : 8,
          elevation: isEquipped ? 5 : 3,
          borderWidth: isEquipped ? 2 : 1,
          borderColor: isEquipped ? colors.primary : colors.textMuted + '18',
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Highlight glow overlay */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 18, borderWidth: 2.5,
            borderColor: colors.primary,
          }]}
        />

        {/* LEFT: Color swatch preview panel */}
        <View style={{ width: 110, height: previewH, overflow: 'hidden' }}>
          {/* Background fill */}
          <View style={{ position: 'absolute', inset: 0, backgroundColor: themeData.colors.background }} />
          {/* Vertical color bars */}
          <View style={{ flexDirection: 'row', height: previewH * 0.55 }}>
            <View style={{ flex: 1, backgroundColor: themeData.colors.primary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.secondary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.accent }} />
            {isV2Theme && (
              <>
                <View style={{ flex: 1, backgroundColor: themeData.colors.surface }} />
                <View style={{ flex: 0.6, backgroundColor: themeData.colors.text + '80' }} />
              </>
            )}
          </View>
          {/* Bottom: mock text content on background */}
          <View style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 6, gap: 4 }}>
            <Text style={{ fontSize: sFont(13), fontWeight: '800', color: themeData.colors.text }} numberOfLines={1}>
              Aa
            </Text>
            <View style={{ height: 3, borderRadius: 2, width: '70%', backgroundColor: themeData.colors.primary }} />
            <View style={{ height: 2, borderRadius: 1, width: '50%', backgroundColor: themeData.colors.text + '40' }} />
          </View>

          {/* Lock overlay on preview */}
          {!canAfford && !isOwned && (
            <View style={{
              position: 'absolute', inset: 0,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}>
              {themeData.chestOnly ? <Gift size={20} color="#F59E0B" /> : <Lock size={20} color="#FFFFFF" />}
            </View>
          )}
        </View>

        {/* RIGHT: Name, description, price */}
        <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'space-between' }}>
          <View>
            {/* Top row: name + rarity badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text
                style={{ flex: 1, fontSize: sFont(15), fontWeight: '800', color: colors.text }}
                numberOfLines={1}
              >
                {language === 'es' ? themeData.nameEs : themeData.name}
              </Text>
              <View style={{ backgroundColor: colors.textMuted + '18', borderRadius: 99, padding: 4 }}>
                <RarityIcon rarity={themeData.rarity} size={12} />
              </View>
            </View>
            {isV2Theme && (
              <View style={{
                alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2,
                borderRadius: 6, backgroundColor: themeData.colors.primary + '20',
                marginBottom: 4,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: themeData.colors.primary }}>V2</Text>
              </View>
            )}
          </View>

          {/* Bottom: status/price + NEW badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {isEquipped ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Check size={13} color="#22C55E" strokeWidth={3} />
                <Text style={{ fontSize: sFont(12), fontWeight: '700', color: '#22C55E' }}>{t.equipped}</Text>
              </View>
            ) : isOwned ? (
              <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.primary }}>{t.equip}</Text>
            ) : themeData.chestOnly ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Gift size={12} color="#F59E0B" />
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#F59E0B' }}>
                  {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
                </Text>
              </View>
            ) : themeData.price === 0 ? (
              <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#22C55E' }}>
                {language === 'es' ? 'Gratis' : 'Free'}
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Coins size={14} color={canAfford ? colors.primary : colors.textMuted} />
                <Text style={{ fontSize: sFont(14), fontWeight: '800', color: canAfford ? colors.primary : colors.textMuted }}>
                  {themeData.price}
                </Text>
              </View>
            )}

            {isNewGift && (
              <View style={{ backgroundColor: '#EF4444', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3 }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {language === 'es' ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default PremiumThemeCard;
