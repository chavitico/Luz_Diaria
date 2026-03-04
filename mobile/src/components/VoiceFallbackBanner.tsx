/**
 * VoiceFallbackBanner — non-blocking notice shown when no enhanced voice
 * was found for the selected language. Guides user to download a better voice.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
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

  const message =
    language === 'es'
      ? 'Para mejor audio, descarga una voz mejorada en Ajustes > Accesibilidad > Contenido hablado > Voces.'
      : 'For better audio, download an enhanced voice in Settings > Accessibility > Spoken Content > Voices.';

  return (
    <Animated.View
      style={[
        {
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          overflow: 'hidden',
        },
        animStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 12 }}>
        <Volume2 size={16} color={colors.primary} style={{ marginTop: 1, flexShrink: 0 }} />
        <Text
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 12,
            lineHeight: 18,
            color: colors.textMuted,
          }}
        >
          {message}
        </Text>
        <Pressable onPress={onDismiss} style={{ marginLeft: 8, padding: 2 }} hitSlop={8}>
          <X size={14} color={colors.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
