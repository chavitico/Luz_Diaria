import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/lib/store';

interface Props {
  topics: string | string[];
  version?: string;
  language?: 'en' | 'es';
}

const COPYRIGHT_ES = 'El texto bíblico Reina-Valera 1960® es propiedad de las Sociedades Bíblicas en América Latina; su difusión y distribución es de dominio público.';
const COPYRIGHT_EN = 'The Reina-Valera 1960® Bible text is property of the Bible Societies in Latin America; its distribution is public domain.';

export default function BibleDisclaimerFooter({ topics, version = 'RVR1960', language = 'es' }: Props) {
  const colors = useThemeColors();
  const topicsStr = Array.isArray(topics) ? topics.join(', ') : topics;
  const isEs = language === 'es';

  return (
    <View style={{
      marginTop: 24,
      marginBottom: 8,
      paddingTop: 20,
      borderTopWidth: 0.5,
      borderTopColor: colors.textMuted + '30',
    }}>
      <Text style={{
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 10,
      }}>
        {isEs ? 'Detalles:' : 'Details:'}
      </Text>

      {!!topicsStr && (
        <Text style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
          <Text style={{ fontWeight: '600' }}>{isEs ? 'Temas: ' : 'Topics: '}</Text>
          {topicsStr}
        </Text>
      )}

      <Text style={{ fontSize: 13, color: colors.text, marginBottom: 14 }}>
        <Text style={{ fontWeight: '600' }}>{isEs ? 'Versión: ' : 'Version: '}</Text>
        {version}
      </Text>

      <Text style={{
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 17,
        textAlign: 'center',
      }}>
        {isEs ? COPYRIGHT_ES : COPYRIGHT_EN}
      </Text>
    </View>
  );
}
