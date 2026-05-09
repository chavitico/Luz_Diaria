import React from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

// Spiritual intro text — fades as user scrolls down
function SpiritualIntro({
  scrollY,
  colors,
  language,
}: {
  scrollY: ReturnType<typeof useSharedValue<number>>;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const { sFont } = useScaledFont();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 80], [0, -8], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View
      style={[{ alignItems: 'center', paddingTop: 22, paddingBottom: 12, paddingHorizontal: 8 }, animatedStyle]}
      pointerEvents="none"
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: sFont(12),
          color: colors.textMuted,
          textAlign: 'center',
          letterSpacing: 0.4,
        }}
      >
        {language === 'es'
          ? 'Respira. Este momento es para Dios y para ti.'
          : 'Breathe. This moment is for God and for you.'}
      </Text>
    </Animated.View>
  );
}

export default SpiritualIntro;
