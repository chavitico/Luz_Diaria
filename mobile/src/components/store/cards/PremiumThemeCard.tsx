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

  return (
    <Animated.View ref={viewRef as any} style={[animatedStyle, { width: '48%', marginBottom: 14 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.3 : (themeData.rarity !== 'common' ? 0.15 : 0.08),
          shadowRadius: isEquipped ? 12 : 8,
          elevation: isEquipped ? 5 : 3,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Highlight glow overlay — appears when navigated from chapter requirement */}
        <Animated.View
          pointerEvents="none"
          style={[highlightStyle, {
            position: 'absolute', inset: 0, zIndex: 20,
            borderRadius: 20, borderWidth: 2.5,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }]}
        />
        {/* Enhanced Color Preview with 5 swatches + sample text for V2 */}
        <View style={{ height: isV2Theme ? 90 : 72, backgroundColor: themeData.colors.background }}>
          {/* Color swatches row */}
          <View style={{ flexDirection: 'row', height: isV2Theme ? 50 : 72 }}>
            <View style={{ flex: 1, backgroundColor: themeData.colors.primary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.secondary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.accent }} />
            {isV2Theme && (
              <>
                <View style={{ flex: 1, backgroundColor: themeData.colors.surface }} />
                <View style={{ flex: 1, backgroundColor: themeData.colors.text }} />
              </>
            )}
          </View>
          {/* Mini-card mock preview for V2 themes */}
          {isV2Theme && (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: themeData.colors.background,
            }}>
              {/* Row 1: Bold "Aa" heading text */}
              <Text style={{
                fontSize: sFont(15),
                fontWeight: '800',
                color: themeData.colors.text,
                marginBottom: 4,
              }}>Aa</Text>
              {/* Row 2: Thin horizontal rule colored with textMuted */}
              <View style={{
                height: 1,
                backgroundColor: themeData.colors.text + '25',
                marginBottom: 5,
              }} />
              {/* Row 3: Small rounded pill using primary color */}
              <View style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 99,
                backgroundColor: themeData.colors.primary,
              }}>
                <Text style={{ fontSize: sFont(8), fontWeight: '700', color: '#FFFFFF' }}>V2</Text>
              </View>
            </View>
          )}
        </View>

        {/* Rarity glow overlay */}
        {themeData.rarity !== 'common' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: isV2Theme ? 90 : 72,
              borderBottomWidth: 2,
              borderBottomColor: rarityColor + '50',
            }}
          />
        )}

        {/* Lock Overlay */}
        {!canAfford && !isOwned && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isV2Theme ? 90 : 72,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}>
            {themeData.chestOnly ? <Gift size={22} color="#F59E0B" /> : <Lock size={24} color="#FFFFFF" />}
          </View>
        )}

        {/* Rarity badge — top-right corner overlay, outside text block */}
        <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 99,
            padding: 4,
          }}>
            <RarityIcon rarity={themeData.rarity} size={13} />
          </View>
        </View>

        {/* NEW gift badge — top-left corner */}
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

        <View style={{ padding: 12 }}>
          {/* Name: up to 2 lines, fixed minHeight so all cards align in the grid */}
          <View style={{ minHeight: 40, justifyContent: 'flex-start', marginBottom: 6 }}>
            <Text
              style={{ fontSize: sFont(13), fontWeight: '700', color: colors.text, lineHeight: 19 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {language === 'es' ? themeData.nameEs : themeData.name}
            </Text>
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={13} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: sFont(12), fontWeight: '600', color: '#22C55E', marginLeft: 4 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: sFont(12), fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : themeData.chestOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gift size={11} color="#F59E0B" />
              <Text style={{ fontSize: sFont(10), fontWeight: '700', marginLeft: 3, color: '#F59E0B' }}>
                {language === 'es' ? 'Solo Cofre' : 'Chest Only'}
              </Text>
            </View>
          ) : themeData.price === 0 ? (
            <Text style={{ fontSize: sFont(12), fontWeight: '600', color: '#22C55E' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={13} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: sFont(12), fontWeight: '700', marginLeft: 4, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {themeData.price}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default PremiumThemeCard;
