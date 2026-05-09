import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';

function FeatureCard({
  emoji,
  title,
  subtitle,
  gradientColors,
  borderColor,
  accentGlowColor,
  onPress,
  badgeCount,
  showNewBadge,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  gradientColors: [string, string, string];
  borderColor: string;
  accentGlowColor: string;
  onPress: () => void;
  badgeCount?: number;
  showNewBadge?: boolean;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const badgePulse = useSharedValue(1);
  const newBadgeOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (badgeCount && badgeCount > 0) {
      badgePulse.value = withRepeat(
        withSequence(
          withSpring(1.2, { damping: 4, stiffness: 200 }),
          withSpring(1, { damping: 6, stiffness: 180 }),
        ),
        -1,
        false,
      );
    } else {
      badgePulse.value = 1;
    }
  }, [badgeCount]);

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

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgePulse.value }] }));
  const newBadgeStyle = useAnimatedStyle(() => ({ opacity: newBadgeOpacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Outer glow border ring */}
        <LinearGradient
          colors={[borderColor, borderColor, borderColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 2,
            shadowColor: borderColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.70,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          {/* Inner sheen ring */}
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 21, padding: 1 }}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}
            >
              {/* Shimmer top highlight */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1.5,
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderRadius: 99,
              }} />
              <LinearGradient
                colors={[accentGlowColor, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ position: 'relative' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: accentGlowColor, borderWidth: 1, borderColor, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 26 }}>{emoji}</Text>
                  </View>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          minWidth: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#FF3B30',
                          borderWidth: 2,
                          borderColor: '#0E0900',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 4,
                        },
                        badgeStyle,
                      ]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF', lineHeight: 14 }}>
                        {badgeCount > 9 ? '9+' : String(badgeCount)}
                      </Text>
                    </Animated.View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
                      {title}
                    </Text>
                    {showNewBadge && (
                      <Animated.View
                        style={[
                          {
                            backgroundColor: '#FF3B30',
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          },
                          newBadgeStyle,
                        ]}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.8 }}>
                          NOVEDAD
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                  <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.60)', fontWeight: '500' }}>
                    {subtitle}
                  </Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.35)" />
              </View>
            </LinearGradient>
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default FeatureCard;
