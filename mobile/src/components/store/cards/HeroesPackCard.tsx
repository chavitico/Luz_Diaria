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

export function HeroesPackCard({
  canAfford,
  disabled,
  language,
  onPress,
  compact,
}: {
  canAfford: boolean;
  disabled?: boolean;
  language: 'en' | 'es';
  onPress: () => void;
  compact?: boolean;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (compact) {
    return (
      <View style={{ flex: 1, opacity: disabled ? 0.5 : 1 }}>
        <Animated.View style={animStyle}>
          <Pressable
            onPressIn={() => { if (canAfford && !disabled) scale.value = withSpring(0.97); }}
            onPressOut={() => { scale.value = withSpring(1); }}
            onPress={onPress}
            disabled={disabled}
          >
            <LinearGradient
              colors={['#0A0800', '#1A1400', '#0A0800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 14, paddingTop: 16, borderWidth: 1.5, borderColor: '#7A5A00', overflow: 'hidden', alignItems: 'center' }}
            >
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#B45309' }} />
              <View style={{ shadowColor: '#D4AF37', shadowOpacity: 0.65, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 12, marginBottom: 10 }}>
                <Image source={require('../../../../assets/packs/pack_heroes_pack.png')} style={{ width: 60, height: 82 }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: sFont(13), fontWeight: '900', color: '#FFE566', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 }} numberOfLines={1}>
                {language === 'es' ? 'Héroes de la Fe' : 'Heroes of Faith'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 }}>
                <Coins size={12} color={canAfford ? '#D4AF37' : '#555'} />
                <Text style={{ fontSize: sFont(16), fontWeight: '900', color: canAfford ? '#D4AF37' : '#555' }}>1000</Text>
              </View>
              <LinearGradient
                colors={canAfford ? ['#7A5A00', '#4A3600'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 99, alignSelf: 'stretch' }}
              >
                <Pressable onPress={onPress} style={{ paddingVertical: 9, alignItems: 'center', borderRadius: 99 }}>
                  <Text style={{ fontSize: sFont(12), fontWeight: '800', color: canAfford ? '#FFE566' : 'rgba(255,255,255,0.30)' }}>
                    {canAfford ? (language === 'es' ? 'Obtener' : 'Get') : (language === 'es' ? 'Sin pts' : 'Need pts')}
                  </Text>
                </Pressable>
              </LinearGradient>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

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
            colors={['#0A0800', '#1A1400', '#0A0800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#7A5A00',
              shadowColor: '#D4AF37',
              shadowOpacity: 0.40,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 4 },
              elevation: 14,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['rgba(212,175,55,0.10)', 'transparent', 'rgba(180,80,0,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />

            {/* Top gold ornament line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />
            {/* Bottom red ornament line */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#B45309' }} />

            {/* Top rarity badge row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(212,175,55,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(212,175,55,0.50)',
                borderRadius: 99,
                paddingHorizontal: 11,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Sparkles size={9} color="#D4AF37" />
                <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#D4AF37', letterSpacing: 1.1, textTransform: 'uppercase' }}>
                  {language === 'es' ? 'Colección · Épico' : 'Collection · Epic'}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(10), color: 'rgba(212,175,55,0.60)', fontWeight: '700', letterSpacing: 3 }}>⚔️✦⚔️</Text>
            </View>

            {/* Pack illustration + info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>

              {/* Pack Visual */}
              <View style={{
                shadowColor: '#D4AF37',
                shadowOpacity: 0.80,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
                elevation: 16,
                width: 84,
                height: 116,
              }}>
                <Image
                  source={require('../../../../assets/packs/pack_heroes_pack.png')}
                  style={{ width: 84, height: 116 }}
                  resizeMode="contain"
                />
              </View>

              {/* Text block */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: sFont(20),
                  fontWeight: '900',
                  color: '#FFE566',
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}>
                  {language === 'es' ? 'Héroes de la Fe' : 'Heroes of Faith'}
                </Text>
                <Text style={{
                  fontSize: sFont(12),
                  color: 'rgba(255,230,160,0.60)',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                  {language === 'es'
                    ? 'Figuras épicas del Antiguo Testamento'
                    : 'Epic figures of the Old Testament'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: language === 'es' ? 'Héroes 2026' : 'Heroes 2026', color: '#D4AF37' },
                    { label: language === 'es' ? '25 cartas' : '25 cards', color: '#FB923C' },
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
              backgroundColor: 'rgba(212,175,55,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.22)',
            }}>
              <Sparkles size={12} color="#D4AF37" />
              <Text style={{ flex: 1, fontSize: sFont(11), color: 'rgba(255,220,100,0.85)', lineHeight: 16 }}>
                {language === 'es'
                  ? '3 cartas aleatorias · 25 cartas disponibles · Completa para desbloquear carta oculta.'
                  : '3 random cards · 25 cards available · Complete to unlock hidden card.'}
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
                colors={canAfford ? ['#7A5A00', '#4A3600'] : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
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
                    color: canAfford ? '#FFE566' : 'rgba(255,255,255,0.30)',
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

export default HeroesPackCard;
