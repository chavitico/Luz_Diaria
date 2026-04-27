import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Check, Lock, Gift, Coins, Award } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { relativeLuminance, ensureContrast } from '@/lib/contrast';
import {
  RARITY_COLORS,
  RARITY_GRADIENTS,
  TRANSLATIONS,
} from '@/lib/constants';
import { RarityBadge } from '@/components/store/RarityBadge';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';
import { ActionButton } from '@/components/ui/ActionButton';

export function ItemDetailModal({
  visible,
  onClose,
  item,
  colors,
  language,
  isOwned,
  isEquipped,
  canAfford,
  onPurchase,
  onEquip,
  isPurchasing,
  onGift,
}: {
  visible: boolean;
  onClose: () => void;
  item: {
    id: string;
    type: 'theme' | 'frame' | 'title' | 'avatar';
    name: string;
    nameEs: string;
    description: string;
    descriptionEs: string;
    price: number;
    rarity: string;
    emoji?: string;
    color?: string;
    colors?: { primary: string; secondary: string; accent: string };
    chestOnly?: boolean;
    meaning?: string;
    meaningEn?: string;
    unlockType?: 'streak' | 'devotionals' | 'share' | 'store';
    unlockValue?: number;
  } | null;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onEquip: () => void;
  isPurchasing: boolean;
  onGift?: () => void;
}) {
  const { sFont } = useScaledFont();
  const t = TRANSLATIONS[language];
  if (!item) return null;

  const surfaceLum = relativeLuminance(colors.surface);
  const surfaceIsDark = surfaceLum < 0.18;
  const safeButtonFill = ensureContrast(colors.primary, colors.surface, 4.5, surfaceIsDark);
  const buttonFill = isFinite(surfaceLum) && safeButtonFill ? safeButtonFill : (surfaceIsDark ? '#E0E0E0' : '#1A1A1A');

  const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? item.nameEs : item.name;
  const displayDesc = language === 'es' ? item.descriptionEs : item.description;

  const showGiftButton = !item.chestOnly && item.price > 0 && !!onGift;

  const renderPreview = () => {
    if (item.type === 'avatar' && item.emoji) {
      const isV2 = item.id.startsWith('avatar_v2_') || item.id.startsWith('avatar_l2_') || item.id.startsWith('avatar_adv_');
      if (isV2) {
        return (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: rarityColor + '50',
              overflow: 'hidden',
            }}
          >
            <IllustratedAvatar avatarId={item.id} size={100} emoji={item.emoji} />
          </View>
        );
      }
      return (
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: rarityColor + '50',
          }}
        >
          <Text style={{ fontSize: sFont(48) }}>{item.emoji}</Text>
        </View>
      );
    }

    if (item.type === 'frame' && item.color) {
      return (
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 108,
              height: 108,
              borderRadius: 54,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 5,
              borderColor: item.color,
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.65,
              shadowRadius: 14,
              elevation: 10,
              backgroundColor: colors.background,
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 5,
                left: 5,
                right: 5,
                bottom: 5,
                borderRadius: 49,
                borderWidth: 1,
                borderColor: item.color + '50',
              }}
            />
            <Text style={{ fontSize: sFont(40) }}>🕊️</Text>
          </View>
          <Text style={{
            marginTop: 8,
            fontSize: sFont(11),
            fontWeight: '600',
            color: colors.textMuted,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>
            {item.color}
          </Text>
        </View>
      );
    }

    if (item.type === 'theme' && item.colors) {
      const tc = item.colors;
      return (
        <View
          style={{
            width: 210,
            height: 148,
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: tc.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 6,
            backgroundColor: '#F7F3EE',
          }}
        >
          <View style={{ backgroundColor: tc.primary, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              <View>
                <View style={{ width: 60, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)', marginBottom: 2 }} />
                <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' }} />
              </View>
            </View>
          </View>
          <View style={{ backgroundColor: '#F7F3EE', flex: 1, padding: 10, gap: 5 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, gap: 4 }}>
              <View style={{ width: '80%', height: 4, borderRadius: 2, backgroundColor: tc.primary + 'CC' }} />
              <View style={{ width: '65%', height: 4, borderRadius: 2, backgroundColor: tc.primary + '88' }} />
              <View style={{ width: '50%', height: 3, borderRadius: 2, backgroundColor: tc.secondary + 'AA', marginTop: 2 }} />
              <View style={{ height: 1, backgroundColor: tc.primary + '22', marginVertical: 2 }} />
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: tc.accent + '25' }}>
                <View style={{ width: 30, height: 3, borderRadius: 1, backgroundColor: tc.accent }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <View style={{ flex: 1, height: 18, borderRadius: 9, backgroundColor: tc.primary, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 30, height: 3, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.9)' }} />
              </View>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tc.secondary + '40', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tc.secondary }} />
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'title') {
      return (
        <View
          style={{
            paddingHorizontal: 28,
            paddingVertical: 18,
            borderRadius: 18,
            backgroundColor: rarityColor + '18',
            borderWidth: 2,
            borderColor: rarityColor + '35',
          }}
        >
          <Award size={52} color={rarityColor} />
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
      >
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '88%',
            borderRadius: 28,
            backgroundColor: colors.surface,
            shadowColor: rarityColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 28,
            elevation: 20,
            overflow: 'hidden',
          }}
        >
          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(0,0,0,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <X size={16} color="#FFFFFF" />
          </Pressable>

          {/* Header gradient — compact, always visible */}
          <LinearGradient
            colors={RARITY_GRADIENTS[item.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
            style={{ paddingTop: 36, paddingBottom: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            {renderPreview()}
          </LinearGradient>

          {/* Scrollable content */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}
          >
            {/* Rarity badge + name + description */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <RarityBadge rarity={item.rarity} language={language} />
            </View>

            <Text
              style={{
                fontSize: sFont(22),
                fontWeight: '800',
                textAlign: 'center',
                color: colors.text,
                marginTop: 8,
                marginBottom: 4,
                letterSpacing: 0.2,
              }}
            >
              {displayName}
            </Text>

            <Text
              style={{
                fontSize: sFont(14),
                textAlign: 'center',
                color: colors.textMuted,
                marginBottom: 16,
                lineHeight: sFont(20),
              }}
            >
              {displayDesc}
            </Text>

            {/* Spiritual meaning */}
            {item.meaning && item.type === 'avatar' && (
              <View
                style={{
                  backgroundColor: rarityColor + '10',
                  borderLeftWidth: 3,
                  borderLeftColor: rarityColor,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: rarityColor, marginBottom: 3, letterSpacing: 0.5 }}>
                  {language === 'es' ? 'SIGNIFICADO' : 'MEANING'}
                </Text>
                <Text style={{ fontSize: sFont(13), color: colors.text, lineHeight: 19, fontStyle: 'italic' }}>
                  {language === 'es' ? item.meaning : (item.meaningEn ?? item.meaning)}
                </Text>
              </View>
            )}

            {/* Unlock badge */}
            {item.unlockType && !item.chestOnly && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.textMuted + '12',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: sFont(14) }}>
                  {item.unlockType === 'streak' ? '🔥' : item.unlockType === 'devotionals' ? '📖' : item.unlockType === 'share' ? '💌' : '🏪'}
                </Text>
                <Text style={{ fontSize: sFont(13), fontWeight: '600', color: colors.textMuted }}>
                  {language === 'es'
                    ? item.unlockType === 'streak'
                      ? `Racha de ${item.unlockValue} días`
                      : item.unlockType === 'devotionals'
                      ? `Completa ${item.unlockValue} devocionales`
                      : item.unlockType === 'share'
                      ? `Comparte ${item.unlockValue} veces`
                      : 'Disponible en tienda'
                    : item.unlockType === 'streak'
                      ? `${item.unlockValue}-day streak`
                      : item.unlockType === 'devotionals'
                      ? `Complete ${item.unlockValue} devotionals`
                      : item.unlockType === 'share'
                      ? `Share ${item.unlockValue} times`
                      : 'Available in store'}
                </Text>
              </View>
            )}

            {/* Free / Premium / Chest-only badge for avatars */}
            {item.type === 'avatar' && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 99,
                  backgroundColor: item.chestOnly ? '#F59E0B20' : item.price === 0 ? '#22C55E20' : rarityColor + '18',
                  borderWidth: 1,
                  borderColor: item.chestOnly ? '#F59E0B50' : item.price === 0 ? '#22C55E50' : rarityColor + '40',
                }}>
                  <Text style={{
                    fontSize: sFont(12),
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    color: item.chestOnly ? '#F59E0B' : item.price === 0 ? '#22C55E' : rarityColor,
                  }}>
                    {item.chestOnly
                      ? (language === 'es' ? 'SOLO COFRE' : 'CHEST ONLY')
                      : item.price === 0
                      ? (language === 'es' ? 'GRATIS' : 'FREE')
                      : 'PREMIUM'}
                  </Text>
                </View>
              </View>
            )}

            {/* Action button */}
            {isEquipped ? (
              <View
                style={{
                  paddingVertical: 15,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#22C55E20',
                  gap: 8,
                }}
              >
                <Check size={20} color="#22C55E" strokeWidth={3} />
                <Text style={{ fontSize: sFont(16), fontWeight: '700', color: '#22C55E' }}>
                  {t.equipped}
                </Text>
              </View>
            ) : isOwned ? (
              <ActionButton
                onPress={onEquip}
                label={t.equip}
                size="md"
                fillColor={buttonFill}
                surfaceColor={colors.surface}
              />
            ) : item.chestOnly ? (
              <View
                style={{
                  paddingVertical: 15,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F59E0B18',
                  gap: 8,
                }}
              >
                <Gift size={18} color="#F59E0B" />
                <Text style={{ fontSize: sFont(15), fontWeight: '600', color: '#F59E0B' }}>
                  {language === 'es' ? 'Solo disponible en Cofres' : 'Only from Chests'}
                </Text>
              </View>
            ) : item.price === 0 ? (
              <ActionButton
                onPress={onPurchase}
                disabled={isPurchasing}
                loading={isPurchasing}
                label={language === 'es' ? 'Reclamar Gratis' : 'Claim Free'}
                fillColor="#22C55E"
                size="md"
                surfaceColor={colors.surface}
              />
            ) : canAfford ? (
              <ActionButton
                onPress={onPurchase}
                disabled={isPurchasing}
                loading={isPurchasing}
                label={`${item.price} ${language === 'es' ? 'puntos' : 'points'}`}
                icon={(color, size) => <Coins size={size} color={color} />}
                fillColor={buttonFill}
                size="md"
                surfaceColor={colors.surface}
              />
            ) : (
              <View
                style={{
                  paddingVertical: 15,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.textMuted + '18',
                  gap: 8,
                }}
              >
                <Lock size={18} color={colors.textMuted} />
                <Text style={{ fontSize: sFont(15), fontWeight: '600', color: colors.textMuted }}>
                  {item.price} {language === 'es' ? 'puntos' : 'points'}
                </Text>
              </View>
            )}

            {/* Gift button — always visible, never hidden */}
            {showGiftButton && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onGift!(); }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  marginTop: 10,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: colors.textMuted + '10',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Gift size={16} color={colors.textMuted} />
                <Text style={{ fontSize: sFont(14), color: colors.textMuted, fontWeight: '600' }}>
                  {language === 'es' ? 'Regalar a un amigo' : 'Gift to a friend'}
                </Text>
              </Pressable>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default ItemDetailModal;
