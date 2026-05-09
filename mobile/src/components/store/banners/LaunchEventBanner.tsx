import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useScaledFont } from '@/lib/textScale';
import type { useThemeColors } from '@/lib/store';

function LaunchEventBanner({
  language,
  colors,
  onPress,
}: {
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Deep forest-green gradient — distinct from red season banner
  const G1 = '#1B3A2B';
  const G2 = '#0D1F17';
  const ACCENT = '#4A7D5E';

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {/* Special luminous event border */}
        <LinearGradient
          colors={['#4A7D5EDD', '#7EC8A0CC', '#FFD700AA', '#7EC8A0CC', '#4A7D5EDD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 2,
            shadowColor: '#4A7D5E',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.75,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 23, padding: 1 }}
          >
            <LinearGradient
              colors={[G1, G2, '#030F07']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, overflow: 'hidden', padding: 20 }}
            >
              {/* Shimmer highlight */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1.5,
                backgroundColor: 'rgba(255,255,255,0.28)',
                borderRadius: 99,
              }} />

              {/* Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <View style={{
                  backgroundColor: ACCENT + '33',
                  borderWidth: 1,
                  borderColor: ACCENT + 'AA',
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' }}>
                    ✨ {language === 'es' ? 'Evento de Lanzamiento' : 'Launch Event'}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={{
                fontSize: sFont(22),
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -0.3,
                marginBottom: 6,
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}>
                {language === 'es' ? 'Camino del Crecimiento' : 'Growth Path'}
              </Text>

              {/* Description */}
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 16 }}>
                {language === 'es'
                  ? 'La fe que siembras hoy dará fruto mañana.'
                  : 'The faith you plant today will bear fruit tomorrow.'}
              </Text>

              {/* Items preview: emojis */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {['🌱', '🍇', '🌿', '👑', '🕊️'].map((emoji, i) => (
                  <View key={i} style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: sFont(16) }}>{emoji}</Text>
                  </View>
                ))}
                <Text style={{ fontSize: sFont(11), color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                  5 {language === 'es' ? 'recompensas' : 'rewards'}
                </Text>
              </View>

              {/* CTA */}
              <View style={{
                backgroundColor: ACCENT,
                borderRadius: 99,
                paddingHorizontal: 20,
                paddingVertical: 10,
                alignSelf: 'flex-start',
              }}>
                <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#FFFFFF' }}>
                  {language === 'es' ? 'Ver paquetes' : 'View packages'}
                </Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    </Animated.View>
    </View>
  );
}

export default LaunchEventBanner;
