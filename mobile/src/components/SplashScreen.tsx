// Custom Splash Screen Component — v3 con logo oficial PNG

import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { APP_BRANDING } from '@/lib/constants';

const LOGO_PNG = require('../../assets/logo/luz-diaria-logo.png');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const sealOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo entra con suavidad
    logoScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.3)) });
    logoOpacity.value = withTiming(1, { duration: 700 });

    // Texto aparece después del logo
    textOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));

    // Firma discreta al final
    sealOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));

    // Sale a los 2.4s
    const timer = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 350 });
      textOpacity.value = withTiming(0, { duration: 350 });
      sealOpacity.value = withTiming(0, { duration: 250 });
      setTimeout(onFinish, 400);
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: (1 - textOpacity.value) * 10 }],
  }));

  const sealAnimStyle = useAnimatedStyle(() => ({
    opacity: sealOpacity.value,
  }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#EAF5EE', '#F2F0E8', '#EBE5D8']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {/* Logo centrado — protagonista */}
        <Animated.View style={[logoAnimStyle, { alignItems: 'center' }]}>
          <Image
            source={LOGO_PNG}
            style={{ width: 190, height: 190 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Nombre y tagline — sutiles, bajo el logo */}
        <Animated.View style={[textAnimStyle, { alignItems: 'center', marginTop: 28 }]}>
          <Text
            style={{
              fontSize: 34,
              fontWeight: '700',
              color: '#2D4A38',
              letterSpacing: -0.5,
            }}
          >
            {APP_BRANDING.appName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#7BAE8A',
              letterSpacing: 2.5,
              fontWeight: '400',
              marginTop: 6,
              textTransform: 'uppercase',
            }}
          >
            {APP_BRANDING.tagline.es}
          </Text>
        </Animated.View>

        {/* Firma discreta en el fondo */}
        <Animated.View
          style={[
            sealAnimStyle,
            { position: 'absolute', bottom: 48, alignItems: 'center' },
          ]}
        >
          <Text
            style={{
              color: '#B8CEBE',
              fontSize: 11,
              letterSpacing: 1.5,
              fontWeight: '500',
            }}
          >
            ChaViTico Games
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
