// BadgeChip — medal/insignia display for Community rows and Profile
// Visual language: circular medals with icon + color ring, NO emojis, NO characters
import React from 'react';
import { View, Text } from 'react-native';
import {
  Flame, Footprints, Leaf, MoveUpRight, Sun,
  BookOpen, Shield, HandHeart, Columns2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { BADGES, RARITY_COLORS } from '@/lib/constants';
import { useThemeColors } from '@/lib/store';

// Map icon name strings → actual Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Flame,
  Footprints,
  Leaf,
  MoveUpRight,
  Sun,
  BookOpen,
  Shield,
  HandHeart,
  Columns2,
};

interface BadgeChipProps {
  badgeId: string;
  /** 'community' = compact circular medal (icon only)
   *  'profile'   = circular medal + name label */
  variant?: 'community' | 'profile';
}

export function BadgeChip({ badgeId, variant = 'community' }: BadgeChipProps) {
  const colors = useThemeColors();
  const badge = BADGES[badgeId];
  if (!badge) return null;

  const IconComponent = ICON_MAP[badge.icon] ?? Flame;
  const badgeColor = badge.color;
  const rarityColor = RARITY_COLORS[badge.rarity] ?? badgeColor;

  // Unique badges get a subtle outer glow ring
  const isUnique = badge.rarity === 'unique';

  if (variant === 'community') {
    // Compact circular medal — 22×22px total
    return (
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: badgeColor + '22',
          borderWidth: isUnique ? 1.5 : 1,
          borderColor: isUnique ? badgeColor : badgeColor + '70',
          alignItems: 'center',
          justifyContent: 'center',
          // Subtle shadow for depth — medal feel
          shadowColor: badgeColor,
          shadowOpacity: isUnique ? 0.45 : 0.2,
          shadowRadius: isUnique ? 4 : 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: isUnique ? 3 : 1,
        }}
      >
        <IconComponent size={12} color={badgeColor} strokeWidth={2} />
      </View>
    );
  }

  // Profile variant: circular medal + name
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: badgeColor + '12',
        borderWidth: 1,
        borderColor: badgeColor + '35',
        gap: 8,
      }}
    >
      {/* Medal circle */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: badgeColor + '20',
          borderWidth: isUnique ? 2 : 1.5,
          borderColor: isUnique ? badgeColor : badgeColor + '80',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: badgeColor,
          shadowOpacity: isUnique ? 0.4 : 0.15,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        <IconComponent size={14} color={badgeColor} strokeWidth={2} />
      </View>
      {/* Name */}
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
