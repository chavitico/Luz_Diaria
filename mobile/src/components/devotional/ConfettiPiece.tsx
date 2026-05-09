import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

function ConfettiPiece({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const duration = 2500 + Math.random() * 1000;

    translateY.value = withDelay(
      delay,
      withTiming(height + 100, { duration })
    );
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(startX + randomX * 0.5, { duration: duration * 0.3 }),
        withTiming(startX + randomX, { duration: duration * 0.7 })
      )
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (2 + Math.random() * 3), { duration })
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pieceSize = 8 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          width: pieceSize,
          height: isCircle ? pieceSize : pieceSize * 2,
          backgroundColor: color,
          borderRadius: isCircle ? pieceSize / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export default ConfettiPiece;
