// BadgeChip — compact badge display for Community rows and Profile
import React from 'react';
import { View, Text } from 'react-native';
import { BADGES, RARITY_COLORS } from '@/lib/constants';
import { useThemeColors } from '@/lib/store';

interface BadgeChipProps {
  badgeId: string;
  /** 'community' = minimal chip (icon only + tiny rarity dot)
   *  'profile'   = icon + full name label */
  variant?: 'community' | 'profile';
}

export function BadgeChip({ badgeId, variant = 'community' }: BadgeChipProps) {
  const colors = useThemeColors();
  const badge = BADGES[badgeId];
  if (!badge) return null;

  const rarityColor = RARITY_COLORS[badge.rarity];

  if (variant === 'community') {
    // Ultra-compact: small pill with emoji + rarity accent border
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 8,
          backgroundColor: rarityColor + '18',
          borderWidth: 1,
          borderColor: rarityColor + '50',
        }}
      >
        <Text style={{ fontSize: 12, lineHeight: 16 }}>{badge.icon}</Text>
      </View>
    );
  }

  // Profile variant: icon + Spanish name
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: rarityColor + '15',
        borderWidth: 1,
        borderColor: rarityColor + '40',
        gap: 5,
      }}
    >
      <Text style={{ fontSize: 16 }}>{badge.icon}</Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.text,
          flexShrink: 1,
        }}
        numberOfLines={1}
      >
        {badge.nameEs}
      </Text>
    </View>
  );
}
