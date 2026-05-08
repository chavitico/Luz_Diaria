import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useScaledFont } from '@/lib/textScale';
import CollectionTicker from '@/components/store/ui/CollectionTicker';
import { LATEST_BIBLICAL_PACK } from '@/lib/constants';
import type { useThemeColors } from '@/lib/store';

function CromosCard({
  language,
  colors,
  onPress,
  onPackImagePress,
  showNewBadge,
  badgeCount,
  dailyPackStatus,
}: {
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
  onPackImagePress?: () => void;
  showNewBadge?: boolean;
  badgeCount?: number;
  dailyPackStatus?: { canClaim: boolean; nextAvailableMs: number | null } | null;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const newBadgeOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (showNewBadge) {
      newBadgeOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      newBadgeOpacity.value = 1;
    }
  }, [showNewBadge]);

  const newBadgeStyle = useAnimatedStyle(() => ({ opacity: newBadgeOpacity.value }));

  const ACCENT = '#60A5FA';
  const G1 = '#0D1E3D';
  const G2 = '#071526';

  // Use the constant for latest pack
  const LATEST_PACK_NAME_ES = LATEST_BIBLICAL_PACK.nameEs;
  const LATEST_PACK_NAME_EN = LATEST_BIBLICAL_PACK.nameEn;
  const latestPackImage = LATEST_BIBLICAL_PACK.image;

  // Ticker text — repeated so it scrolls seamlessly
  const tickerUnit = language === 'es'
    ? `  🃏  Nueva Colección · ${LATEST_PACK_NAME_ES}  ✦ `
    : `  🃏  New Collection · ${LATEST_PACK_NAME_EN}  ✦ `;
  const TICKER_TEXT = tickerUnit.repeat(6);

  // Daily pack countdown label
  const dailyPackLabel = React.useMemo(() => {
    if (!dailyPackStatus) return null;
    if (dailyPackStatus.canClaim) {
      return language === 'es' ? '🎁 Sobre diario disponible' : '🎁 Daily pack available';
    }
    if (dailyPackStatus.nextAvailableMs && dailyPackStatus.nextAvailableMs > 0) {
      const diffMs = dailyPackStatus.nextAvailableMs - Date.now();
      if (diffMs > 0) {
        const h = Math.floor(diffMs / 3_600_000);
        const m = Math.floor((diffMs % 3_600_000) / 60_000);
        const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
        return language === 'es'
          ? `⏱ Próximo sobre gratis en ${countdown}`
          : `⏱ Next free pack in ${countdown}`;
      }
    }
    return null;
  }, [dailyPackStatus, language]);

  const dailyPackAvailable = dailyPackStatus?.canClaim === true;

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.98); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
        >
          <LinearGradient
            colors={[ACCENT + 'DD', '#93C5FDCC', '#BFDBFEAA', '#93C5FDCC', ACCENT + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 2,
              shadowColor: ACCENT,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.65,
              shadowRadius: 18,
              elevation: 10,
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 23, padding: 1 }}
            >
              {/* Banner container */}
              <View style={{ borderRadius: 22, overflow: 'hidden', minHeight: 182 }}>
                {/* Background photo */}
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80' }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.55 }}
                  resizeMode="cover"
                />
                {/* Background gradient base */}
                <LinearGradient
                  colors={[G1 + 'BB', G2 + '99', '#030C1888']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Overlay scrim — left side darker so text is readable */}
                <LinearGradient
                  colors={['rgba(7,21,38,0.88)', 'rgba(7,21,38,0.45)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Shimmer highlight */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 24,
                  right: 24,
                  height: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderRadius: 99,
                }} />

                {/* Pack image — tappable, larger and higher */}
                <Pressable
                  onPress={() => { if (onPackImagePress) onPackImagePress(); }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 12,
                    width: 116,
                    height: 160,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  hitSlop={8}
                >
                  <Image
                    source={latestPackImage}
                    style={{ width: 116, height: 160, opacity: 0.95 }}
                    resizeMode="contain"
                  />
                </Pressable>

                {/* Content — left side */}
                <View style={{ padding: 20, paddingRight: 136 }}>
                  {/* Top row: NOVEDAD + daily pack alert — same line */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6, flexWrap: 'wrap' }}>
                    {showNewBadge && (
                      <Animated.View style={[{
                        backgroundColor: '#FF3B30',
                        borderRadius: 6,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                      }, newBadgeStyle]}>
                        <Text style={{ fontSize: sFont(9), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.8 }}>NOVEDAD</Text>
                      </Animated.View>
                    )}
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <View style={{
                        backgroundColor: '#FF3B30',
                        borderRadius: 99,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ fontSize: sFont(9), fontWeight: '900', color: '#FFFFFF' }}>
                          {badgeCount > 9 ? '9+' : String(badgeCount)} {language === 'es' ? 'trueques' : 'trades'}
                        </Text>
                      </View>
                    )}
                    {dailyPackLabel && (
                      <View style={{
                        backgroundColor: dailyPackAvailable ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.07)',
                        borderWidth: 1,
                        borderColor: dailyPackAvailable ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                      }}>
                        <Text style={{
                          fontSize: sFont(9),
                          fontWeight: '700',
                          color: dailyPackAvailable ? '#4ADE80' : 'rgba(255,255,255,0.45)',
                          letterSpacing: 0.3,
                        }}>
                          {dailyPackLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Collection chip — static, wraps up to 2 lines */}
                  <View style={{
                    backgroundColor: ACCENT + '22',
                    borderWidth: 1,
                    borderColor: ACCENT + '55',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    marginBottom: 10,
                    alignSelf: 'flex-start',
                    flexShrink: 1,
                    maxWidth: '100%',
                  }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: ACCENT,
                        letterSpacing: 0.8,
                        flexShrink: 1,
                      }}
                    >
                      {'🃏  ' + (language === 'es' ? `Nueva Colección · ${LATEST_PACK_NAME_ES}` : `New Collection · ${LATEST_PACK_NAME_EN}`)}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text style={{
                    fontSize: sFont(24),
                    fontWeight: '900',
                    color: '#FFFFFF',
                    letterSpacing: -0.5,
                    marginBottom: 5,
                    textShadowColor: 'rgba(0,0,0,0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 6,
                  }}>
                    {language === 'es' ? 'Cromos Bíblicos' : 'Biblical Cards'}
                  </Text>

                  {/* Subtitle */}
                  <Text style={{ fontSize: sFont(12), color: 'rgba(255,255,255,0.55)', marginBottom: 18, fontWeight: '500' }}>
                    {language === 'es' ? 'Sobres · Álbum · Trueques' : 'Packs · Album · Trades'}
                  </Text>

                  {/* CTA */}
                  <View style={{
                    backgroundColor: ACCENT + 'EE',
                    borderRadius: 99,
                    paddingHorizontal: 18,
                    paddingVertical: 9,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#0D1E3D' }}>
                      {language === 'es' ? 'Abrir Sobres' : 'Open Packs'}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default CromosCard;
