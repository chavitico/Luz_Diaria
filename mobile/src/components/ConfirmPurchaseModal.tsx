// ConfirmPurchaseModal — shared confirmation dialog before spending points.
// Shows item name, cost, optional description, and Cancel / Confirmar compra.

import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
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

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const isDark = colors.background === '#0D0D14' || colors.background === '#121212' ||
    colors.background?.startsWith('#0') || colors.background?.startsWith('#1');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
      >
        <BlurView
          intensity={40}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <View style={styles.container} pointerEvents="box-none">
        <View style={[
          styles.sheet,
          {
            backgroundColor: isDark ? '#1C1C2E' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }
        ]}>
          {/* Icon */}
          <View style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(255,215,0,0.12)' : 'rgba(255,180,0,0.10)' }
          ]}>
            <ShoppingBag size={28} color="#F5A623" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {es ? '¿Confirmar compra?' : 'Confirm purchase?'}
          </Text>

          {/* Item name */}
          <Text style={[styles.itemName, { color: colors.text }]}>
            "{itemName}"
          </Text>

          {/* Cost badge */}
          <View style={[
            styles.costBadge,
            { backgroundColor: isDark ? 'rgba(255,215,0,0.10)' : 'rgba(255,180,0,0.08)' }
          ]}>
            <Coins size={16} color="#F5A623" />
            <Text style={styles.costText}>
              {cost.toLocaleString()} {es ? 'puntos' : 'points'}
            </Text>
          </View>

          {/* Optional description */}
          {description ? (
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {description}
            </Text>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                {es ? 'Cancelar' : 'Cancel'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                { opacity: pressed ? 0.85 : 1 }
              ]}
            >
              <Text style={styles.confirmText}>
                {es ? 'Confirmar compra' : 'Confirm purchase'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
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
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    marginTop: 2,
  },
  costText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5A623',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F5A623',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
