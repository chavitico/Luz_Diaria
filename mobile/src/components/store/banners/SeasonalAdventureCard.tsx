import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Gift, Coins } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';
import type { useThemeColors } from '@/lib/store';
import type { StoreItem, Season } from '@/lib/gamification-api';

function SeasonalAdventureCard({
  item,
  season,
  purchasedItems,
  points,
  colors,
  language,
  onPress,
}: {
  item: StoreItem;
  season: Season;
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const accent = season.accentColor || '#7A1F1F';
  const canAfford = points >= item.pricePoints;
  const meta = (() => {
    try { return JSON.parse(item.metadata); } catch { return {}; }
  })();
  const rewardCount = Array.isArray(meta?.rewards) ? meta.rewards.length : 3;
  const isOwned = purchasedItems.includes(item.id);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <LinearGradient
          colors={[accent + 'EE', '#1A0A0A', '#0D0500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}
        >
          {/* Season badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
              borderRadius: 99,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}>
              <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {item.badge || '✝ ' + season.name}
              </Text>
            </View>
            {item.isNew && (
              <View style={{
                backgroundColor: '#FFD70033',
                borderWidth: 1,
                borderColor: '#FFD700',
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}>
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFD700', letterSpacing: 0.5 }}>NUEVO</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={{
            fontSize: sFont(24),
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: 6,
            letterSpacing: -0.5,
          }}>
            {language === 'es' ? item.nameEs : item.nameEn}
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: sFont(13),
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 18,
            marginBottom: 16,
          }}>
            {language === 'es' ? item.descriptionEs : item.descriptionEn}
          </Text>

          {/* Rewards indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Gift size={14} color="rgba(255,255,255,0.6)" />
            <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
              {rewardCount} {language === 'es' ? 'recompensas incluidas' : 'rewards included'}
            </Text>
          </View>

          {/* CTA row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Coins size={18} color={isOwned ? '#4CAF50' : canAfford ? '#FFD700' : '#888'} />
              {isOwned ? (
                <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#4CAF50' }}>
                  {language === 'es' ? 'Adquirido' : 'Owned'}
                </Text>
              ) : (
                <Text style={{ fontSize: sFont(18), fontWeight: '800', color: canAfford ? '#FFD700' : '#888' }}>
                  {item.pricePoints.toLocaleString()}
                </Text>
              )}
            </View>
            {!isOwned && (
              <View style={{
                backgroundColor: canAfford ? accent : '#333',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 99,
              }}>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#FFFFFF' }}>
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

export default SeasonalAdventureCard;
