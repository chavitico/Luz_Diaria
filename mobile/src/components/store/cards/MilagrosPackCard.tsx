import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Coins, Sparkles } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';

export function MilagrosPackCard({
  canAfford,
  disabled,
  language,
  onPress,
}: {
  canAfford: boolean;
  disabled?: boolean;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ marginBottom: 12 }}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={() => { if (canAfford && !disabled) scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : 1 }}
        >
          <LinearGradient
            colors={['#050A1A', '#091530', '#050A1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#1A4A8A',
              shadowColor: '#4A90D9',
              shadowOpacity: 0.30,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 14,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['rgba(26,74,138,0.08)', 'transparent', 'rgba(212,175,55,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Top blue ornament line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#1A4A8A' }} />
            {/* Bottom gold ornament line */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />

            {/* Top rarity badge row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(26,74,138,0.22)',
                borderWidth: 1,
                borderColor: 'rgba(74,144,217,0.55)',
                borderRadius: 99,
                paddingHorizontal: 11,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Sparkles size={9} color="#60A5FA" />
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#60A5FA', letterSpacing: 1.1, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Colección · Épico' : 'Collection · Epic'}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(10), color: 'rgba(212,175,55,0.50)', fontWeight: '700', letterSpacing: 3 }}>✨✦✨</Text>
            </View>

            {/* Pack illustration + info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>

              {/* ── Pack Visual — real PNG asset ── */}
              <View style={{
                shadowColor: '#60A5FA',
                shadowOpacity: 0.70,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
                elevation: 16,
                width: 84,
                height: 116,
              }}>
                <Image
                  source={require('../../../../assets/packs/pack_milagros_pack.png')}
                  style={{ width: 84, height: 116 }}
                  resizeMode="contain"
                />
              </View>

              {/* Text block */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: sFont(20),
                  fontWeight: '900',
                  color: '#FFFFFF',
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}>
                  {language === 'es' ? 'Sobre de Milagros' : 'Miracles Pack'}
                </Text>
                <Text style={{
                  fontSize: sFont(12),
                  color: 'rgba(255,255,255,0.58)',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                  {language === 'es'
                    ? 'Señales y maravillas realizadas por Jesús'
                    : 'Signs and wonders performed by Jesus'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: language === 'es' ? 'Milagros 2026' : 'Miracles 2026', color: '#60A5FA' },
                    { label: language === 'es' ? '29 cartas' : '29 cards', color: '#D4AF37' },
                    { label: language === 'es' ? '3 por sobre' : '3 per pack', color: '#34D399' },
                  ].map(cat => (
                    <View key={cat.label} style={{
                      backgroundColor: cat.color + '15',
                      borderWidth: 0.75,
                      borderColor: cat.color + '50',
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                    }}>
                      <Text style={{ fontSize: sFont(8), fontWeight: '700', color: cat.color, letterSpacing: 0.4 }}>
                        {cat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Info strip */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 11,
              borderRadius: 12,
              marginBottom: 16,
              backgroundColor: 'rgba(26,74,138,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(26,74,138,0.25)',
            }}>
              <Sparkles size={12} color="#60A5FA" />
              <Text style={{ flex: 1, fontSize: sFont(11), color: 'rgba(100,180,255,0.85)', lineHeight: 16 }}>
                {language === 'es'
                  ? '3 cartas aleatorias · 29 cartas disponibles · Duplicados guardados.'
                  : '3 random cards · 29 cards available · Duplicates saved.'}
              </Text>
            </View>

            {/* Footer — price + CTA */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Coins size={17} color={canAfford ? '#D4AF37' : '#555'} />
                <Text style={{ fontSize: sFont(22), fontWeight: '900', color: canAfford ? '#D4AF37' : '#555' }}>
                  1000
                </Text>
              </View>
              <LinearGradient
                colors={canAfford ? ['#1A4A8A', '#0D2D5E'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 99 }}
              >
                <Pressable
                  onPress={onPress}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }}
                >
                  <Text style={{
                    fontSize: sFont(14),
                    fontWeight: '800',
                    color: canAfford ? '#FFFFFF' : 'rgba(255,255,255,0.30)',
                  }}>
                    {canAfford
                      ? (language === 'es' ? 'Obtener' : 'Open Pack')
                      : (language === 'es' ? 'Sin puntos' : 'Need points')}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default MilagrosPackCard;
