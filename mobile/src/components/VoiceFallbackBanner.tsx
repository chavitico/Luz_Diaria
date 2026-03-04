/**
 * VoiceFallbackBanner — non-blocking notice shown when recommended voice
 * (Paulina / Monica) is not installed. Guides user to download it.
 * Also shown when only Eloquence/robotic voices are available.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Volume2, X } from 'lucide-react-native';

interface VoiceFallbackBannerProps {
  visible: boolean;
  /** 'missing_preferred' = Paulina/Monica not installed, show install guide.
   *  'eloquence' = only Eloquence/robotic voices available (subset of missing_preferred).
   *  'fallback' = generic fallback, no Spanish voices at all. */
  reason?: 'missing_preferred' | 'eloquence' | 'fallback';
  language: 'en' | 'es';
  onDismiss: () => void;
  colors: {
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
  };
}

export function VoiceFallbackBanner({
  visible,
  reason = 'fallback',
  language,
  onDismiss,
  colors,
}: VoiceFallbackBannerProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(300, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
      translateY.value = withDelay(300, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-12, { duration: 200 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const getMessage = (): string => {
    if (language === 'es') {
      if (reason === 'missing_preferred' || reason === 'eloquence') {
        if (Platform.OS === 'ios') {
          return 'Para una voz más natural, instala la voz recomendada: Ajustes > Accesibilidad > Contenido hablado > Voces > Español > Paulina (o Mónica).';
        } else {
          // Android
          return 'Para una voz más natural, descarga el paquete de voz en español en: Ajustes > Gestión general > Idioma y entrada > Texto a voz.';
        }
      }
      // Generic fallback
      return 'Para mejor audio, descarga una voz en español en Ajustes > Accesibilidad > Contenido hablado > Voces.';
    } else {
      // English
      if (reason === 'missing_preferred' || reason === 'eloquence') {
        if (Platform.OS === 'ios') {
          return 'For a better voice, install an enhanced voice: Settings > Accessibility > Spoken Content > Voices > English > Samantha (Enhanced).';
        } else {
          return 'For a better voice, download an enhanced voice pack in Settings > General > Language & Input > Text-to-speech.';
        }
      }
      return 'For better audio, download an enhanced voice in Settings > Accessibility > Spoken Content > Voices.';
    }
  };

  const borderColor =
    reason === 'eloquence' ? '#F59E0B' : colors.primary;

  return (
    <Animated.View
      style={[
        {
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderLeftWidth: 3,
          borderLeftColor: borderColor,
          overflow: 'hidden',
        },
        animStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 12 }}>
        <Volume2 size={16} color={borderColor} style={{ marginTop: 1, flexShrink: 0 }} />
        <Text
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 12,
            lineHeight: 18,
            color: colors.textMuted,
          }}
        >
          {getMessage()}
        </Text>
        <Pressable onPress={onDismiss} style={{ marginLeft: 8, padding: 2 }} hitSlop={8}>
          <X size={14} color={colors.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
