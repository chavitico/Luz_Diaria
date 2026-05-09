import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useScaledFont } from '@/lib/textScale';
import type { useThemeColors } from '@/lib/store';

function DueloSabiduriaCard({
  colors,
  onlineCount,
  language,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>;
  onlineCount: number;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardTitle    = language === 'es' ? 'Duelo de Sabiduría'                : 'Duel of Wisdom';
  const cardSubtitle = language === 'es' ? 'Pon a prueba tu conocimiento bíblico' : 'Test your biblical knowledge';
  const playLabel    = language === 'es' ? 'Jugar'                              : 'Play';
  const onlineLabel  = language === 'es'
    ? (onlineCount === 1 ? '1 jugador en línea' : `${onlineCount} jugadores en línea`)
    : (onlineCount === 1 ? '1 player online'    : `${onlineCount} players online`);

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: 20, marginBottom: 12 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={['#0d1e38CC', '#102444BB', '#0a1628CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(99,179,237,0.2)',
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80' }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.32 }}
              resizeMode="cover"
            />
            {/* Decorative glow */}
            <View
              style={{
                position: 'absolute',
                top: -30,
                right: -20,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(99,179,237,0.07)',
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {/* Icon */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: 'rgba(99,179,237,0.12)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(99,179,237,0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 26 }}>⚔️</Text>
              </View>
              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 2, letterSpacing: -0.3 }}>
                  {cardTitle}
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>
                  {cardSubtitle}
                </Text>
                {/* Online indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#68D391' }} />
                  <Text style={{ fontSize: 11, color: '#68D391', fontWeight: '700' }}>
                    {onlineLabel}
                  </Text>
                </View>
              </View>
              {/* Play button */}
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: '#63B3ED',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#000000' }}>
                  {playLabel}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default DueloSabiduriaCard;
