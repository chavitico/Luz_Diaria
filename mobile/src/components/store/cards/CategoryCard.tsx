import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useScaledFont } from '@/lib/textScale';
import { CATEGORIES } from '@/components/store/CategoryIcons';
import type { useThemeColors } from '@/lib/store';

function CategoryCard({
  category,
  isActive,
  colors,
  language,
  onPress,
  badgeCount = 0,
  hasNew = false,
  progress,
}: {
  category: typeof CATEGORIES[0];
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  badgeCount?: number;
  hasNew?: boolean;
  progress?: { owned: number; total: number };
}) {
  const { sFont } = useScaledFont();
  const { IconComponent } = category;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label = language === 'es' ? category.labelEs : category.label;
  const desc = language === 'es' ? category.descEs : category.desc;

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          flex: 1,
          minHeight: 72,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 18,
          backgroundColor: isActive ? colors.primary : colors.surface,
          shadowColor: isActive ? colors.primary : '#000',
          shadowOffset: { width: 0, height: isActive ? 6 : 2 },
          shadowOpacity: isActive ? 0.32 : 0.06,
          shadowRadius: isActive ? 12 : 5,
          elevation: isActive ? 6 : 2,
          borderWidth: isActive ? 0 : 1,
          borderColor: colors.textMuted + '18',
        }}
      >
        {/* Icon container */}
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : colors.primary + '18',
          flexShrink: 0,
        }}>
          <IconComponent
            color={isActive ? '#FFFFFF' : colors.primary}
            active={isActive}
          />
          {badgeCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              borderWidth: 2,
              borderColor: isActive ? colors.primary : colors.background,
            }}>
              <Text style={{ color: '#fff', fontSize: sFont(10), fontWeight: '800', lineHeight: 14 }}>
                {badgeCount > 9 ? '9+' : String(badgeCount)}
              </Text>
            </View>
          )}
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{
              fontSize: sFont(15),
              fontWeight: '700',
              color: isActive ? '#fff' : colors.text,
              marginBottom: 2,
              letterSpacing: -0.2,
            }}>
              {label}
            </Text>
            {hasNew && (
              <View style={{
                backgroundColor: '#22C55E',
                borderRadius: 99,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginBottom: 2,
              }}>
                <Text style={{ color: '#fff', fontSize: sFont(9), fontWeight: '800', letterSpacing: 0.5 }}>NUEVO</Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontSize: sFont(12),
              color: isActive ? 'rgba(255,255,255,0.75)' : colors.textMuted,
              lineHeight: 16,
            }}
          >
            {desc}
          </Text>
          {progress && progress.total > 0 && (
            <View style={{ marginTop: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.textMuted + '20', overflow: 'hidden' }}>
                  <View style={{
                    height: 3, borderRadius: 2,
                    width: `${Math.min(100, Math.round((progress.owned / progress.total) * 100))}%` as any,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.9)' : colors.primary,
                  }} />
                </View>
                <Text style={{ fontSize: sFont(10), fontWeight: '600', color: isActive ? 'rgba(255,255,255,0.75)' : colors.textMuted }}>
                  {progress.owned}/{progress.total}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Active chevron */}
        {isActive && (
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.7)',
            flexShrink: 0,
          }} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default CategoryCard;
