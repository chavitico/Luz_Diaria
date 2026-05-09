import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

function AchievementPopup({
  visible,
  points,
  colors,
  language,
}: {
  visible: boolean;
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
            borderWidth: 3,
            borderColor: '#FFD700',
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFD700',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Trophy size={40} color="#FFFFFF" />
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: sFont(24),
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {language === 'es' ? 'Devocional Completado!' : 'Devotional Complete!'}
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: sFont(28),
            fontWeight: 'bold',
          }}
        >
          +{points} {language === 'es' ? 'puntos' : 'points'}
        </Text>
      </Animated.View>
    </View>
  );
}

export default AchievementPopup;
