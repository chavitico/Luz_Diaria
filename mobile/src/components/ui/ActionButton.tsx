/**
 * ActionButton — the single canonical CTA component for the whole app.
 *
 * Root cause of the "invisible button" bug:
 *   useNativeDriver:true offloads the scale transform to iOS's GPU compositor.
 *   Any backgroundColor set on a *child* Pressable lives in the JS layer and
 *   gets dropped when the native layer takes over compositing.
 *   Fix: ALL visual styles (background, border, shadow, elevation) live on the
 *   Animated.View itself; the Pressable inside is layout-only + transparent.
 */

import React, { useRef } from 'react';
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
  Animated,
} from 'react-native';
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
    // primary (default)
    const base = fillColor ?? colors.primary;
    const { fill: pf, textColor: pt } = deriveButtonColors(base, resolvedSurface, effectiveIsDark);
    fill = pf;
    textColor = pt;
    outerBorderColor = effectiveIsDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)';
    borderColor = effectiveIsDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)';
  }

  // Safety guard: catch any edge case where fill doesn't contrast with surface
  if (!disabled && variant !== 'ghost') {
    const finalContrast = contrastRatio(fill, resolvedSurface);
    if (!isFinite(finalContrast) || finalContrast < 2.5) {
      fill = effectiveIsDark ? '#E0E0E0' : '#1A1A1A';
      textColor = effectiveIsDark ? '#000000' : '#FFFFFF';
    }
  }

  // ── Press animation ────────────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  // IMPORTANT: All visual styles (backgroundColor, borderRadius, border, shadow)
  // are on the Animated.View, NOT the Pressable. When useNativeDriver:true is
  // used, iOS composites the Animated.View as a native GPU layer. Styles on
  // JS-layer children (Pressable) are dropped in that compositing pass, making
  // backgroundColor invisible. Keeping all visuals on Animated.View fixes this.

  return (
    <Animated.View
      style={[
        fullWidth && { width: '100%' },
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: fill,
          borderRadius: tokens.borderRadius,
          borderWidth: variant === 'ghost' ? 0 : 1.5,
          borderColor,
          // iOS shadow on the animated layer itself (not on a child)
          ...(Platform.OS === 'ios' && variant !== 'ghost' && variant !== 'secondary' ? {
            shadowColor: '#000000',
            shadowOpacity: disabled ? 0.06 : 0.18,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          } : {}),
          // Android elevation on the animated layer
          ...(Platform.OS === 'android' && variant !== 'ghost' ? {
            elevation: disabled ? 0 : 4,
          } : {}),
        },
        style as ViewStyle,
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.gap,
          paddingVertical: tokens.paddingVertical,
          paddingHorizontal: tokens.paddingHorizontal,
          borderRadius: tokens.borderRadius,
          // transparent — background lives on the Animated.View above
          backgroundColor: 'transparent',
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
              top: 0, right: 0, bottom: 0, left: 0,
              borderRadius: tokens.borderRadius,
              borderWidth: 1,
              borderColor: outerBorderColor,
            }}
          />
        )}

        {/* Icon / Spinner / Label */}
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
