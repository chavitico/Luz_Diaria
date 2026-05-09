import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, Heart } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';

function PrayerConfirmButton({
  colors,
  language,
  isPrayerDone,
  onConfirm,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isPrayerDone: boolean;
  onConfirm: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (isPrayerDone) return;

    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="mt-4">
      <Pressable
        onPress={handlePress}
        disabled={isPrayerDone}
        className="flex-row items-center justify-center py-4 px-6 rounded-2xl"
        style={{
          backgroundColor: isPrayerDone ? '#22C55E' : colors.primary,
          opacity: isPrayerDone ? 0.9 : 1,
        }}
      >
        {isPrayerDone ? (
          <>
            <Check size={22} color="#FFFFFF" strokeWidth={3} />
            <Text className="ml-3 font-bold text-base" style={{ color: '#FFFFFF' }}>
              {language === 'es' ? 'Completado' : 'Completed'}
            </Text>
          </>
        ) : (
          <>
            <Heart size={22} color={colors.primaryText} />
            <Text className="ml-3 font-bold text-base" style={{ color: colors.primaryText }}>
              {language === 'es' ? 'Hoy hice esta oracion' : 'I prayed today'}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default PrayerConfirmButton;
