import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';

// Pastoral Closure — shown after the devotional is completed
function PastoralClosure({
  colors,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const { sFont } = useScaledFont();
  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500)}
      style={{ marginTop: 28, marginBottom: 8 }}
    >
      {/* Divider line */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 40, height: 1, backgroundColor: colors.primary + '40' }} />
      </View>

      {/* Closing message */}
      <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <Text style={{ fontSize: sFont(18), marginBottom: 12 }}>🕊️</Text>
        <Text
          style={{
            fontSize: sFont(16),
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
          }}
        >
          {language === 'es'
            ? 'Gracias por apartar este tiempo.'
            : 'Thank you for setting aside this time.'}
        </Text>
        <Text
          style={{
            fontSize: sFont(14),
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 21,
            fontStyle: 'italic',
          }}
        >
          {language === 'es'
            ? 'Dios honra un corazón que le busca.'
            : 'God honors a heart that seeks Him.'}
        </Text>
      </View>
    </Animated.View>
  );
}

export default PastoralClosure;
