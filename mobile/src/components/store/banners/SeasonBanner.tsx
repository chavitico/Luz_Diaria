import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useScaledFont } from '@/lib/textScale';
import type { Season } from '@/lib/gamification-api';

function SeasonBanner({ season, language, onPress }: { season: Season; language: 'en' | 'es'; onPress?: () => void }) {
  const { sFont } = useScaledFont();
  const accent = season.accentColor || '#7A1F1F';
  const accentLight = accent + 'CC';
  const accentDim = accent + '33';

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={{ marginHorizontal: 20, marginBottom: 16 }}
      >
        {/* Special luminous outer border — gradient glow ring */}
        <LinearGradient
          colors={[accent, accentLight, '#FFD700CC', accentLight, accent + '88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 2,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          {/* Inner faint sheen ring */}
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 21, padding: 1 }}
          >
            <LinearGradient
              colors={[accent, '#1A0A0A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, borderRadius: 20, overflow: 'hidden' }}
            >
              {/* Bright shimmer highlight at top edge */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 1.5,
                backgroundColor: 'rgba(255,255,255,0.35)',
                borderRadius: 99,
              }} />

              {/* Top: event type label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                <View style={{
                  backgroundColor: accentDim,
                  borderWidth: 1,
                  borderColor: accentLight,
                  borderRadius: 99,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: sFont(10), fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {language === 'es' ? '✝ Evento de Temporada' : '✝ Season Event'}
                  </Text>
                </View>
              </View>

              {/* Main title */}
              <Text style={{
                fontSize: sFont(22),
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -0.3,
                marginBottom: 4,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}>
                {season.bannerTitle}
              </Text>

              {/* Description */}
              <Text style={{ fontSize: sFont(13), color: 'rgba(255,255,255,0.80)', lineHeight: 18, fontWeight: '400', marginBottom: 12 }}>
                {season.bannerDescription}
              </Text>

              {/* Bottom: dates */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF', opacity: 0.7 }} />
                <Text style={{ fontSize: sFont(11), color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                  {new Date(season.startDate).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' })}
                  {' — '}
                  {new Date(season.endDate).toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default SeasonBanner;
