/**
 * ActionButton — the single canonical CTA component for the whole app.
 *
 * Uses react-native-reanimated (preferred per project conventions) for the
 * scale animation. Static visual styles (backgroundColor, borders, shadows)
 * live on the Animated.View in a plain style object, completely separate from
 * the animated transform style returned by useAnimatedStyle. This is critical:
 * mixing Animated.Value references and static values in the SAME style object
 * caused RN's style extractor to silently drop backgroundColor on iOS in light
 * mode when the value was first set during compositing setup.
 */

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { deriveButtonColors, deriveDisabledColors, contrastRatio, relativeLuminance } from '@/lib/contrast';
import { useThemeColors, useIsDarkMode } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ActionButtonSize = 'sm' | 'md' | 'lg';

export interface ActionButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: ((color: string, size: number) => React.ReactNode) | React.ReactNode;
  trailingIcon?: ((color: string, size: number) => React.ReactNode) | React.ReactNode;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  surfaceColor?: string;
  fillColor?: string;
  fullWidth?: boolean;
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE_TOKENS: Record<ActionButtonSize, {
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
  borderRadius: number;
  gap: number;
}> = {
  sm: { paddingVertical: 9,  paddingHorizontal: 16, fontSize: 14, iconSize: 15, borderRadius: 12, gap: 6 },
  md: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 16, iconSize: 18, borderRadius: 16, gap: 8 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17, iconSize: 20, borderRadius: 18, gap: 10 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  trailingIcon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled: disabledProp = false,
  style,
  labelStyle,
  surfaceColor,
  fillColor,
  fullWidth = true,
  onPress,
  ...rest
}) => {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  const tokens = SIZE_TOKENS[size];
  const disabled = disabledProp || loading;

  // ── Derive colors ──────────────────────────────────────────────────────────

  const resolvedSurface = surfaceColor ?? colors.background;
  const surfaceLuminance = relativeLuminance(resolvedSurface);
  const effectiveIsDark = surfaceLuminance < 0.18;

  let fill: string;
  let textColor: string;
  let outerBorderColor: string;
  let borderColor: string;

  if (disabled) {
    const dc = deriveDisabledColors(resolvedSurface, effectiveIsDark);
    fill = dc.fill;
    textColor = dc.textColor;
    outerBorderColor = effectiveIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    borderColor = 'transparent';
  } else if (variant === 'secondary') {
    fill = fillColor ?? (effectiveIsDark ? colors.primary + '40' : colors.primary + '22');
    const borderBase = colors.primary;
    const borderContrast = contrastRatio(borderBase, resolvedSurface);
    textColor = borderContrast >= 3.5 ? borderBase : effectiveIsDark ? '#FFFFFF' : '#111111';
    outerBorderColor = colors.primary + (effectiveIsDark ? 'CC' : 'AA');
    borderColor = 'transparent';
  } else if (variant === 'ghost') {
    fill = 'transparent';
    textColor = (() => {
      const r = contrastRatio(colors.primary, resolvedSurface);
      return r >= 3.0 ? colors.primary : effectiveIsDark ? '#FFFFFF' : '#111111';
    })();
    outerBorderColor = 'transparent';
    borderColor = 'transparent';
  } else if (variant === 'danger') {
    const dangerColor = '#EF4444';
    const { fill: df, textColor: dt } = deriveButtonColors(dangerColor, resolvedSurface, effectiveIsDark);
    fill = df;
    textColor = dt;
    outerBorderColor = effectiveIsDark ? 'rgba(255,80,80,0.35)' : 'rgba(180,0,0,0.20)';
    borderColor = effectiveIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  } else {
    const base = fillColor ?? colors.primary;
    const { fill: pf, textColor: pt } = deriveButtonColors(base, resolvedSurface, effectiveIsDark);
    fill = pf;
    textColor = pt;
    outerBorderColor = effectiveIsDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)';
    borderColor = effectiveIsDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)';
  }

  // Safety guard
  if (!disabled && variant !== 'ghost') {
    const finalContrast = contrastRatio(fill, resolvedSurface);
    if (!isFinite(finalContrast) || finalContrast < 2.5) {
      fill = effectiveIsDark ? '#E0E0E0' : '#1A1A1A';
      textColor = effectiveIsDark ? '#000000' : '#FFFFFF';
    }
  }

  // ── Animation (react-native-reanimated) ───────────────────────────────────
  // useSharedValue + useAnimatedStyle keeps the transform on the UI thread and
  // completely separate from the static style object below — no mixed-mode issue.
  const scale = useSharedValue(1);

  const animatedTransform = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 30 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 300, damping: 22 });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  // Static visual styles are in their own plain object — separate from the
  // animated transform. Reanimated merges them cleanly without dropping any.

  const staticStyle: ViewStyle = {
    backgroundColor: fill,
    borderRadius: tokens.borderRadius,
    borderWidth: variant === 'ghost' ? 0 : 1.5,
    borderColor,
    ...(Platform.OS === 'ios' && variant !== 'ghost' && variant !== 'secondary' && !disabled ? {
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    } : {}),
    ...(Platform.OS === 'android' && variant !== 'ghost' ? {
      elevation: disabled ? 0 : 4,
    } : {}),
  };

  return (
    <Animated.View
      style={[
        fullWidth && { width: '100%' },
        staticStyle,
        style as ViewStyle,
        animatedTransform,
      ]}
    >
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, busy: loading }}
        style={({ pressed }) => ({
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          gap: tokens.gap,
          paddingVertical: tokens.paddingVertical,
          paddingHorizontal: tokens.paddingHorizontal,
          borderRadius: tokens.borderRadius,
          backgroundColor: fill,
          opacity: pressed && !disabled ? 0.88 : 1,
        })}
        {...rest}
      >
        {/* Outer stroke overlay */}
        {variant !== 'ghost' && !disabled && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              borderRadius: tokens.borderRadius,
              borderWidth: 1,
              borderColor: outerBorderColor,
            }}
          />
        )}

        {/* Content */}
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && (
              <View style={{ width: tokens.iconSize, height: tokens.iconSize, alignItems: 'center', justifyContent: 'center' }}>
                {typeof icon === 'function' ? icon(textColor, tokens.iconSize) : icon}
              </View>
            )}
            <Text
              style={[
                {
                  color: textColor,
                  fontSize: tokens.fontSize,
                  fontWeight: variant === 'ghost' ? '600' : '700',
                  letterSpacing: 0.2,
                  textAlign: 'center',
                },
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {trailingIcon && (
              <View style={{ width: tokens.iconSize, height: tokens.iconSize, alignItems: 'center', justifyContent: 'center' }}>
                {typeof trailingIcon === 'function' ? trailingIcon(textColor, tokens.iconSize) : trailingIcon}
              </View>
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default ActionButton;
