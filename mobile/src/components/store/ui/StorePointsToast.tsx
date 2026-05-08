import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';

function PointsToast({
  amount,
  visible,
  onHide,
  isPositive = false,
  message,
}: {
  amount: number;
  visible: boolean;
  onHide: () => void;
  isPositive?: boolean;
  message?: string;
}) {
  const { sFont } = useScaledFont();
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(-10, { duration: 300 }),
        withTiming(0, { duration: 100 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 300 })
      );
      const timeout = setTimeout(() => {
        runOnJS(onHide)();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 100,
          left: 16,
          right: 16,
          alignItems: 'center',
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: isPositive ? '#22C55E' : '#EF4444',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 16,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: sFont(15) }}>
            {amount === 0 && message ? message : `${isPositive ? '+' : '-'}${amount} pts`}
          </Text>
        </View>
        {message && amount !== 0 ? (
          <Text style={{ color: '#ffffffCC', fontSize: sFont(12), fontWeight: '500', textAlign: 'center' }}>
            {message}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default PointsToast;
