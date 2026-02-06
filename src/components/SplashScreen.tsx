// Custom Splash Screen Component

import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Sun } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const sealOpacity = useSharedValue(0);
  const rayRotation = useSharedValue(0);

  useEffect(() => {
    // Animate logo
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Animate rays
    rayRotation.value = withTiming(360, { duration: 20000 });

    // Animate text
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Animate seal
    sealOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

    // Trigger finish after splash duration
    const timer = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 300 });
      textOpacity.value = withTiming(0, { duration: 300 });
      sealOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(onFinish, 350);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const sealAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sealOpacity.value,
  }));

  const rayAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rayRotation.value}deg` }],
    opacity: interpolate(logoOpacity.value, [0, 1], [0, 0.3]),
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#FDF6E3', '#E8A87C', '#C38D9E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {/* Animated rays behind logo */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: width * 1.5,
              height: width * 1.5,
              justifyContent: 'center',
              alignItems: 'center',
            },
            rayAnimatedStyle,
          ]}
        >
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 3,
                height: width * 0.7,
                backgroundColor: '#FFFFFF',
                transform: [{ rotate: `${i * 30}deg` }],
                borderRadius: 2,
              }}
            />
          ))}
        </Animated.View>

        {/* Logo */}
        <Animated.View
          style={[logoAnimatedStyle]}
          className="items-center justify-center"
        >
          <View className="w-32 h-32 bg-white/90 rounded-full items-center justify-center shadow-2xl">
            <Sun size={64} color="#E8A87C" strokeWidth={1.5} />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View style={[textAnimatedStyle]} className="mt-8 items-center">
          <Text className="text-4xl font-bold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
            Daily Light
          </Text>
          <Text className="text-lg text-white/80 mt-2 font-medium">
            Faith • Hope • Love
          </Text>
        </Animated.View>

        {/* Company Seal */}
        <Animated.View
          style={[sealAnimatedStyle]}
          className="absolute bottom-16 items-center"
        >
          <View className="bg-white/20 px-6 py-3 rounded-full">
            <Text className="text-white/90 text-sm font-semibold tracking-wider">
              ChaViTico Games
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
