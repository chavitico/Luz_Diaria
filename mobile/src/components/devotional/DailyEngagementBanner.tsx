import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Check, Heart } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

function DailyEngagementBanner({
  isCompleted,
  showCompletionThankYou,
  colors,
  language,
  isFavorite,
  onToggleFavorite,
}: {
  isCompleted: boolean;
  showCompletionThankYou: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'es' | 'en';
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { sFont } = useScaledFont();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 120 }));
  }, [isCompleted, showCompletionThankYou]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (showCompletionThankYou) {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            marginHorizontal: 0,
            marginBottom: 12,
            borderRadius: 14,
            backgroundColor: colors.primary + '18',
            gap: 8,
          },
        ]}
      >
        <Text style={{ fontSize: sFont(16) }}>🙏</Text>
        <Text
          style={{
            fontSize: sFont(14),
            color: colors.primary,
            fontWeight: '500',
            flexShrink: 1,
          }}
        >
          {language === 'es'
            ? 'Gracias por apartar este momento con Dios'
            : 'Thank you for setting aside this moment with God'}
        </Text>
      </Animated.View>
    );
  }

  if (isCompleted) {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 14,
            marginBottom: 12,
            borderRadius: 20,
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(34,197,94,0.12)',
            gap: 6,
          },
        ]}
      >
        <Check size={13} color="rgb(34,197,94)" strokeWidth={2.5} />
        <Text
          style={{
            fontSize: sFont(13),
            color: 'rgb(34,197,94)',
            fontWeight: '500',
          }}
        >
          {language === 'es' ? 'Devocional de hoy completado' : "Today's devotional completed"}
        </Text>
        <Pressable
          onPress={onToggleFavorite}
          style={{ marginLeft: 4, padding: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={15}
            color={isFavorite ? '#EF4444' : 'rgba(34,197,94,0.7)'}
            fill={isFavorite ? '#EF4444' : 'transparent'}
          />
        </Pressable>
      </Animated.View>
    );
  }

  return null;
}

export default DailyEngagementBanner;
