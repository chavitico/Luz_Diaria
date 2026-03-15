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

export function BiblicalPackCard({
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
    <View style={{ marginBottom: 12, opacity: disabled ? 0.5 : 1 }}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={() => { if (!disabled) scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={disabled}
        >
          {/* Outer card shell */}
          <LinearGradient
            colors={['#07090F', '#0D1120', '#070910']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#C8A52A',
              shadowColor: '#D4AF37',
              shadowOpacity: 0.28,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 14,
              overflow: 'hidden',
            }}
          >
            {/* Subtle outer sweep */}
            <LinearGradient
              colors={['rgba(212,175,55,0.06)', 'transparent', 'rgba(100,80,180,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Top ornament line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />
            {/* Bottom ornament line */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />

            {/* Top rarity badge row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(212,175,55,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(212,175,55,0.45)',
                borderRadius: 99,
                paddingHorizontal: 11,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Sparkles size={9} color="#D4AF37" />
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#D4AF37', letterSpacing: 1.1, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Coleccionable · Raro' : 'Collectible · Rare'}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(10), color: 'rgba(212,175,55,0.45)', fontWeight: '700', letterSpacing: 3 }}>✦✦✦</Text>
            </View>

            {/* Pack illustration + info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>

              {/* ── THE PACK VISUAL — real PNG asset ── */}
              <View style={{
                shadowColor: '#D4AF37',
                shadowOpacity: 0.70,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
                elevation: 16,
                width: 84,
                height: 116,
              }}>
                <Image
                  source={require('../../../../assets/packs/sobre_biblico_pack.png')}
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
                  {language === 'es' ? 'Sobre Bíblico' : 'Biblical Pack'}
                </Text>
                <Text style={{
                  fontSize: sFont(12),
                  color: 'rgba(255,255,255,0.58)',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                  {language === 'es'
                    ? '1 carta aleatoria de personajes, objetos y eventos bíblicos'
                    : '1 random biblical character, object or event card'}
                </Text>
                {/* Category chips */}
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Personajes', color: '#D4AF37' },
                    { label: 'Objetos', color: '#A8C8F0' },
                    { label: 'Eventos', color: '#FF7A2A' },
                  ].map(cat => (
                    <View key={cat.label} style={{
                      backgroundColor: cat.color + '15',
                      borderWidth: 0.75,
                      borderColor: cat.color + '45',
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
              backgroundColor: 'rgba(212,175,55,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.20)',
            }}>
              <Sparkles size={12} color="#D4AF37" />
              <Text style={{ flex: 1, fontSize: sFont(11), color: 'rgba(212,175,55,0.80)', lineHeight: 16 }}>
                {language === 'es'
                  ? 'Carta aleatoria · 6 cartas disponibles · Los duplicados se guardan para intercambios.'
                  : 'Random card · 6 cards available · Duplicates saved for future trading.'}
              </Text>
            </View>

            {/* Footer — price + CTA */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Coins size={17} color={canAfford ? '#D4AF37' : '#555'} />
                <Text style={{ fontSize: sFont(22), fontWeight: '900', color: canAfford ? '#D4AF37' : '#555' }}>
                  500
                </Text>
              </View>
              <LinearGradient
                colors={canAfford ? ['#D4AF37', '#B8962E'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 99 }}
              >
                <Pressable
                  onPress={onPress}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{
                    fontSize: sFont(14),
                    fontWeight: '800',
                    color: canAfford ? '#07090F' : 'rgba(255,255,255,0.30)',
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

export default BiblicalPackCard;
