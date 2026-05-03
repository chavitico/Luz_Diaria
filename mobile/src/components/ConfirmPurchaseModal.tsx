// ConfirmPurchaseModal — uses a native RN Modal rendered from _layout.tsx root,
// so it always appears above ALL other modals and navigation layers.

import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Coins, ShoppingBag, Gift } from 'lucide-react-native';
import { useThemeColors, useLanguage } from '@/lib/store';

interface ConfirmPurchaseModalProps {
  visible: boolean;
  itemName: string;
  cost: number;
  description?: string;
  isFree?: boolean;
  freePacksRemaining?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPurchaseModal({
  visible,
  itemName,
  cost,
  description,
  isFree = false,
  freePacksRemaining,
  onConfirm,
  onCancel,
}: ConfirmPurchaseModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const es = language === 'es';

  const isDark = colors.background === '#0D0D14' || colors.background === '#121212' ||
    colors.background?.startsWith('#0') || colors.background?.startsWith('#1');

  const sheetBg = isDark ? '#1C1C2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)';
  // Both buttons use the same muted bg — always visible in light and dark
  const btnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const btnTextColor = colors.text;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Backdrop tap = cancel */}
      <Pressable style={styles.backdrop} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCancel();
      }} />

      {/* Card — centered, does NOT inherit backdrop press */}
      <View style={styles.centerer} pointerEvents="box-none">
        <Pressable style={styles.cardHitSlop} onPress={() => {}} >
          <View style={[styles.sheet, { backgroundColor: sheetBg, borderColor }]}>

            {/* Icon */}
            <View style={[styles.iconWrap, {
              backgroundColor: isFree
                ? (isDark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.12)')
                : (isDark ? 'rgba(255,215,0,0.12)' : 'rgba(255,160,0,0.10)'),
            }]}>
              {isFree
                ? <Gift size={26} color="#10B981" />
                : <ShoppingBag size={26} color="#F5A623" />
              }
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: isFree ? '#10B981' : colors.text }]}>
              {isFree
                ? (es ? '¡Sobre gratis!' : 'Free pack!')
                : (es ? '¿Confirmar compra?' : 'Confirm purchase?')
              }
            </Text>

            {/* Item name */}
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
              "{itemName}"
            </Text>

            {/* Cost badge */}
            {isFree ? (
              <View style={[styles.costBadge, {
                backgroundColor: isDark ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.10)',
                borderColor: isDark ? 'rgba(52,211,153,0.35)' : 'rgba(16,185,129,0.30)',
              }]}>
                <Gift size={14} color="#10B981" />
                <Text style={[styles.costText, { color: '#10B981' }]}>
                  {es ? 'GRATIS' : 'FREE'}
                </Text>
              </View>
            ) : (
              <View style={[styles.costBadge, {
                backgroundColor: isDark ? 'rgba(245,166,35,0.14)' : 'rgba(245,166,35,0.12)',
                borderColor: isDark ? 'rgba(245,166,35,0.30)' : 'rgba(245,166,35,0.35)',
              }]}>
                <Coins size={15} color="#F5A623" />
                <Text style={styles.costText}>
                  {cost.toLocaleString()} {es ? 'puntos' : 'points'}
                </Text>
              </View>
            )}

            {/* Free packs remaining info */}
            {isFree && freePacksRemaining !== undefined && (
              <Text style={[styles.description, { color: colors.textMuted }]}>
                {freePacksRemaining === 0
                  ? (es ? 'Este es tu último sobre gratis disponible' : 'This is your last available free pack')
                  : (es
                    ? `Te quedarán ${freePacksRemaining} sobre${freePacksRemaining !== 1 ? 's' : ''} gratis después de este`
                    : `${freePacksRemaining} free pack${freePacksRemaining !== 1 ? 's' : ''} remaining after this`)
                }
              </Text>
            )}

            {/* Optional description */}
            {!!description && (
              <Text style={[styles.description, { color: colors.textMuted }]}>
                {description}
              </Text>
            )}

            {/* Actions — both buttons same bg, always visible */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCancel();
                }}
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: btnBg, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.btnText, { color: btnTextColor }]}>
                  {es ? 'Cancelar' : 'Cancel'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  onConfirm();
                }}
                style={({ pressed }) => [
                  styles.btn,
                  styles.confirmBtn,
                  {
                    backgroundColor: isFree
                      ? (isDark ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.13)')
                      : btnBg,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                {isFree
                  ? <Gift size={14} color="#10B981" style={{ marginRight: 4 }} />
                  : <Coins size={14} color="#F5A623" style={{ marginRight: 4 }} />
                }
                <Text style={[styles.btnText, styles.confirmBtnText, { color: isFree ? '#10B981' : '#F5A623' }]}>
                  {isFree
                    ? (es ? '¡Abrir gratis!' : 'Open for free!')
                    : (es ? 'Confirmar compra' : 'Confirm purchase')
                  }
                </Text>
              </Pressable>
            </View>

          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  cardHitSlop: {
    width: '100%',
    maxWidth: 360,
  },
  sheet: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 24,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
  },
  confirmBtnText: {
    fontWeight: '700',
  },
});
