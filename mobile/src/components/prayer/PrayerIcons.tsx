// Premium prayer category icons — built with View/Text/LinearGradient (no new deps)
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type CategoryKey =
  | 'work'
  | 'health'
  | 'family'
  | 'peace'
  | 'wisdom'
  | 'studies'
  | 'restoration'
  | 'gratitude'
  | 'salvation'
  | 'strength';

interface PrayerCategoryIconProps {
  category: string;
  size?: number;
  active?: boolean;
  primaryColor?: string;
}

// Each category gets its own gradient + symbol
const CATEGORY_CONFIG: Record<
  CategoryKey,
  { gradientFrom: string; gradientTo: string; symbol: string; ringColor: string }
> = {
  work: {
    gradientFrom: '#7B8FA1',
    gradientTo: '#4A6572',
    symbol: '⚒',
    ringColor: '#7B8FA1',
  },
  health: {
    gradientFrom: '#E57373',
    gradientTo: '#C62828',
    symbol: '♡',
    ringColor: '#E57373',
  },
  family: {
    gradientFrom: '#81C784',
    gradientTo: '#388E3C',
    symbol: '❤',
    ringColor: '#81C784',
  },
  peace: {
    gradientFrom: '#90CAF9',
    gradientTo: '#1565C0',
    symbol: '☁',
    ringColor: '#90CAF9',
  },
  wisdom: {
    gradientFrom: '#FFD54F',
    gradientTo: '#F57F17',
    symbol: '✦',
    ringColor: '#FFD54F',
  },
  studies: {
    gradientFrom: '#CE93D8',
    gradientTo: '#6A1B9A',
    symbol: '✏',
    ringColor: '#CE93D8',
  },
  restoration: {
    gradientFrom: '#80DEEA',
    gradientTo: '#00838F',
    symbol: '↺',
    ringColor: '#80DEEA',
  },
  gratitude: {
    gradientFrom: '#FFCC80',
    gradientTo: '#E65100',
    symbol: '✨',
    ringColor: '#FFCC80',
  },
  salvation: {
    gradientFrom: '#F48FB1',
    gradientTo: '#880E4F',
    symbol: '🙏',
    ringColor: '#F48FB1',
  },
  strength: {
    gradientFrom: '#A5D6A7',
    gradientTo: '#1B5E20',
    symbol: '⛨',
    ringColor: '#A5D6A7',
  },
};

const FALLBACK: (typeof CATEGORY_CONFIG)[CategoryKey] = {
  gradientFrom: '#B0BEC5',
  gradientTo: '#546E7A',
  symbol: '✦',
  ringColor: '#B0BEC5',
};

export function PrayerCategoryIcon({
  category,
  size = 40,
  active = false,
  primaryColor,
}: PrayerCategoryIconProps) {
  const config = CATEGORY_CONFIG[category as CategoryKey] ?? FALLBACK;
  const innerSize = size * 0.72;
  const ringWidth = size * 0.055;
  const fontSize = size * 0.38;

  // When active/primary color passed, tint the ring with primary
  const ringColor = active && primaryColor ? primaryColor + '80' : config.ringColor + '60';

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ringWidth,
        borderColor: ringColor,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <LinearGradient
        colors={[config.gradientFrom, config.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: config.gradientTo,
          shadowOpacity: 0.35,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Text
          style={{
            fontSize,
            lineHeight: fontSize * 1.3,
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {config.symbol}
        </Text>
      </LinearGradient>
    </View>
  );
}

// Larger "header" icon used for section titles (e.g. "La comunidad ora por")
export function CommunityPrayerHeaderIcon({
  size = 36,
  primaryColor = '#E8A87C',
}: {
  size?: number;
  primaryColor?: string;
}) {
  const innerSize = size * 0.72;
  const ringWidth = size * 0.055;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ringWidth,
        borderColor: primaryColor + '55',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LinearGradient
        colors={[primaryColor + 'EE', primaryColor + '99']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.35, lineHeight: size * 0.46, includeFontPadding: false }}>
          🤲
        </Text>
      </LinearGradient>
    </View>
  );
}

// Icon used for "Mi Petición" header
export function MyPetitionHeaderIcon({
  size = 36,
  primaryColor = '#E8A87C',
}: {
  size?: number;
  primaryColor?: string;
}) {
  const innerSize = size * 0.72;
  const ringWidth = size * 0.055;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ringWidth,
        borderColor: primaryColor + '55',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LinearGradient
        colors={[primaryColor, primaryColor + 'BB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.35, lineHeight: size * 0.46, includeFontPadding: false }}>
          🙏
        </Text>
      </LinearGradient>
    </View>
  );
}
