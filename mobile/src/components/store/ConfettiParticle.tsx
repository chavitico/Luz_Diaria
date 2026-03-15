import React from 'react';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

export function ConfettiParticle({
  pv,
  x,
  y,
  angle,
  size,
  borderRadius,
  color,
}: {
  pv: SharedValue<number>;
  x: number;
  y: number;
  angle: number;
  size: number;
  borderRadius: number;
  color: string;
}) {
  const pStyle = useAnimatedStyle<{ opacity: number; transform: { translateX: number }[] | { translateY: number }[] | { scale: number }[] | { rotate: string }[] }>(() => ({
    opacity: pv.value,
    transform: [
      { translateX: x * pv.value },
      { translateY: y * pv.value },
      { scale: pv.value },
      { rotate: `${angle * 180 / Math.PI * pv.value}deg` },
    ] as any,
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute' as const, width: size, height: size, borderRadius, backgroundColor: color }, pStyle as any]}
    />
  );
}
