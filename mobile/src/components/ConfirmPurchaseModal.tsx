// ConfirmPurchaseModal — inline overlay, NOT a React Native Modal.
// Uses position:absolute so it never conflicts with other RN modals on iOS.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Coins, ShoppingBag } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';

interface ConfirmPurchaseModalProps {
  visible: boolean;
  itemName: string;
  cost: number;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPurchaseModal({
  visible,
  itemName,
  cost,
  description,
  onConfirm,
  onCancel,
}: ConfirmPurchaseModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const es = language === 'es';

  if (!visible) return null;

  const isDark = colors.background === '#0D0D14' || colors.background === '#121212' ||
    colors.background?.startsWith('#0') || colors.background?.startsWith('#1');

  const sheetBg = isDark ? '#1C1C2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)';

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCancel();
      }} />

      {/* Card */}
      <View pointerEvents="box-none" style={styles.centerer}>
        <View style={[styles.sheet, { backgroundColor: sheetBg, borderColor }]}>

          {/* Icon */}
          <View style={[styles.iconWrap, {
            backgroundColor: isDark ? 'rgba(255,215,0,0.12)' : 'rgba(255,160,0,0.10)',
          }]}>
            <ShoppingBag size={26} color="#F5A623" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {es ? '¿Confirmar compra?' : 'Confirm purchase?'}
          </Text>

          {/* Item name */}
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
            "{itemName}"
          </Text>

          {/* Cost badge */}
          <View style={[styles.costBadge, {
            backgroundColor: isDark ? 'rgba(245,166,35,0.12)' : 'rgba(245,166,35,0.10)',
            borderColor: isDark ? 'rgba(245,166,35,0.25)' : 'rgba(245,166,35,0.30)',
          }]}>
            <Coins size={15} color="#F5A623" />
            <Text style={styles.costText}>
              {cost.toLocaleString()} {es ? 'puntos' : 'points'}
            </Text>
          </View>

          {/* Optional description */}
          {!!description && (
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {description}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onCancel();
              }}
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                {es ? 'Cancelar' : 'Cancel'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onConfirm();
              }}
              style={({ pressed }) => [styles.confirmBtn, { opacity: pressed ? 0.82 : 1 }]}
            >
              <Text style={styles.confirmText}>
                {es ? 'Confirmar compra' : 'Confirm purchase'}
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Covers the entire screen as a sibling View (not an RN Modal)
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centerer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -2,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
    borderWidth: 1,
    marginTop: 2,
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5A623',
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.75,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: 'center',
    backgroundColor: '#F5A623',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
