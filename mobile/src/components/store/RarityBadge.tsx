import React from 'react';
import { View, Text } from 'react-native';
import { Gem, Star } from 'lucide-react-native';
import { RARITY_COLORS } from '@/lib/constants';
import { useScaledFont } from '@/lib/textScale';

// Get rarity icon
export function RarityIcon({ rarity, size = 12 }: { rarity: string; size?: number }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  if (rarity === 'epic') return <Gem size={size} color={color} />;
  if (rarity === 'rare') return <Star size={size} color={color} />;
  return null;
}

// Rarity Badge Component
export function RarityBadge({ rarity, language }: { rarity: string; language: 'en' | 'es' }) {
  const { sFont } = useScaledFont();
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const labels = {
    common: { en: 'Common', es: 'Comun' },
    rare: { en: 'Rare', es: 'Raro' },
    epic: { en: 'Epic', es: 'Epico' },
  };
  const label = labels[rarity as keyof typeof labels]?.[language] || rarity;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
      }}
    >
      <RarityIcon rarity={rarity} size={10} />
      <Text style={{ fontSize: sFont(10), fontWeight: '600', color, textTransform: 'capitalize' }}>
        {label}
      </Text>
    </View>
  );
}
