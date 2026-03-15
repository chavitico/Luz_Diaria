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

export function EasterPackCard({
  canAfford,
  disabled,
  isEventActive,
  language,
  onPress,
}: {
  canAfford: boolean;
  disabled?: boolean;
  isEventActive: boolean;
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
          onPressIn={() => { if (isEventActive && canAfford && !disabled) scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={disabled}
          style={{ opacity: disabled ? 0.5 : isEventActive ? 1 : 0.65 }}
        >
          {/* Outer card shell — deep crimson night */}
          <LinearGradient
            colors={['#0F0508', '#1A080B', '#0F0508']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#B22A2A',
              shadowColor: '#FF4444',
              shadowOpacity: 0.25,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 14,
              overflow: 'hidden',
            }}
          >
            {/* Subtle outer sweep */}
            <LinearGradient
              colors={['rgba(178,42,42,0.07)', 'transparent', 'rgba(212,175,55,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Top crimson ornament line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#B22A2A' }} />
            {/* Bottom gold ornament line */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />

            {/* Top rarity badge row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(178,42,42,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(178,42,42,0.55)',
                borderRadius: 99,
                paddingHorizontal: 11,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Sparkles size={9} color="#D4584A" />
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#D4584A', letterSpacing: 1.1, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Evento · Épico' : 'Event · Epic'}
                </Text>
              </View>
              {isEventActive ? (
                <Text style={{ fontSize: sFont(10), color: 'rgba(212,175,55,0.50)', fontWeight: '700', letterSpacing: 3 }}>✝✦✝</Text>
              ) : (
                <View style={{ backgroundColor: 'rgba(80,80,80,0.35)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
                  <Text style={{ fontSize: sFont(9), fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>
                    {language === 'es' ? 'Evento finalizado' : 'Event ended'}
                  </Text>
                </View>
              )}
            </View>

            {/* Pack illustration + info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>

              {/* ── THE PACK VISUAL — real PNG asset ── */}
              <View style={{
                shadowColor: '#FFD700',
                shadowOpacity: 0.70,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
                elevation: 16,
                width: 84,
                height: 116,
              }}>
                <Image
                  source={require('../../../../assets/packs/pack_pascua_pack.png')}
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
                  {language === 'es' ? 'Sobre de Pascua' : 'Easter Pack'}
                </Text>
                <Text style={{
                  fontSize: sFont(12),
                  color: 'rgba(255,255,255,0.58)',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                  {language === 'es'
                    ? 'La historia de la Pasión y Resurrección de Jesús'
                    : 'The story of the Passion and Resurrection of Jesus'}
                </Text>
                {/* Event chips */}
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Pascua 2026', color: '#D4584A' },
                    { label: '14 cartas', color: '#D4AF37' },
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
              backgroundColor: 'rgba(178,42,42,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(178,42,42,0.22)',
            }}>
              <Sparkles size={12} color="#D4584A" />
              <Text style={{ flex: 1, fontSize: sFont(11), color: 'rgba(212,120,100,0.85)', lineHeight: 16 }}>
                {language === 'es'
                  ? 'Carta aleatoria del evento · 14 cartas disponibles · Duplicados guardados.'
                  : 'Random event card · 14 cards available · Duplicates saved.'}
              </Text>
            </View>

            {/* Footer — price + CTA */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Coins size={17} color={isEventActive && canAfford ? '#D4AF37' : '#555'} />
                <Text style={{ fontSize: sFont(22), fontWeight: '900', color: isEventActive && canAfford ? '#D4AF37' : '#555' }}>
                  500
                </Text>
              </View>
              {isEventActive ? (
                <LinearGradient
                  colors={canAfford ? ['#B22A2A', '#8A1A1A'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
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
              ) : (
                <View style={{
                  backgroundColor: 'rgba(80,80,80,0.30)',
                  borderRadius: 99,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}>
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: 'rgba(255,255,255,0.28)' }}>
                    {language === 'es' ? 'Evento finalizado' : 'Event ended'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default EasterPackCard;
