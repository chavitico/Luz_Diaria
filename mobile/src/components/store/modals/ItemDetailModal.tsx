import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Check, Lock, Gift, Coins, Award } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import {
  RARITY_COLORS,
  RARITY_GRADIENTS,
  TRANSLATIONS,
} from '@/lib/constants';
import { RarityBadge } from '@/components/store/RarityBadge';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';
import { ActionButton } from '@/components/ui/ActionButton';
import { cn } from '@/lib/cn';

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

  const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? item.nameEs : item.name;
  const displayDesc = language === 'es' ? item.descriptionEs : item.description;

  // Render preview based on type
  const renderPreview = () => {
    if (item.type === 'avatar' && item.emoji) {
      const isV2 = item.id.startsWith('avatar_v2_') || item.id.startsWith('avatar_l2_') || item.id.startsWith('avatar_adv_');
      if (isV2) {
        return (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 4,
              borderColor: rarityColor + '40',
              overflow: 'hidden',
            }}
          >
            <IllustratedAvatar avatarId={item.id} size={120} emoji={item.emoji} />
          </View>
        );
      }
      return (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: rarityColor + '40',
          }}
        >
          <Text style={{ fontSize: sFont(56) }}>{item.emoji}</Text>
        </View>
      );
    }

    if (item.type === 'frame' && item.color) {
      return (
        <View style={{ alignItems: 'center' }}>
          {/* Multi-layer frame: outer ring */}
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 6,
              borderColor: item.color,
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 16,
              elevation: 12,
              backgroundColor: colors.background,
            }}
          >
            {/* Inner glow layer */}
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                right: 6,
                bottom: 6,
                borderRadius: 60,
                borderWidth: 1,
                borderColor: item.color + '50',
              }}
            />
            {/* Avatar emoji */}
            <Text style={{ fontSize: sFont(44) }}>🕊️</Text>
          </View>
          {/* Hex color label */}
          <Text style={{
            marginTop: 10,
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
            width: 200,
            height: 155,
            borderRadius: 18,
            overflow: 'hidden',
            shadowColor: tc.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 6,
            backgroundColor: '#F7F3EE',
          }}
        >
          {/* Mini app header */}
          <View style={{ backgroundColor: tc.primary, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              <View>
                <View style={{ width: 60, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)', marginBottom: 2 }} />
                <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' }} />
              </View>
            </View>
          </View>

          {/* Mini verse card */}
          <View style={{ backgroundColor: '#F7F3EE', flex: 1, padding: 10, gap: 6 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, gap: 4 }}>
              {/* Verse text lines */}
              <View style={{ width: '80%', height: 4, borderRadius: 2, backgroundColor: tc.primary + 'CC' }} />
              <View style={{ width: '65%', height: 4, borderRadius: 2, backgroundColor: tc.primary + '88' }} />
              <View style={{ width: '50%', height: 3, borderRadius: 2, backgroundColor: tc.secondary + 'AA', marginTop: 2 }} />
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: tc.primary + '22', marginVertical: 2 }} />
              {/* Reference pill */}
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: tc.accent + '25' }}>
                <View style={{ width: 30, height: 3, borderRadius: 1, backgroundColor: tc.accent }} />
              </View>
            </View>

            {/* Action button row */}
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
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: rarityColor + '15',
            borderWidth: 2,
            borderColor: rarityColor + '30',
          }}
        >
          <Award size={48} color={rarityColor} />
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
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <Animated.View
            entering={FadeIn.duration(200)}
            className="w-full rounded-3xl"
            style={{
              backgroundColor: colors.surface,
              maxWidth: 340,
              maxHeight: '90%',
              shadowColor: rarityColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              overflow: 'hidden',
            }}
          >
            {/* Close button */}
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center z-10"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>

            {/* Header gradient — always visible, not scrolled */}
            <LinearGradient
              colors={RARITY_GRADIENTS[item.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
              style={{ paddingTop: 40, paddingBottom: 24, alignItems: 'center' }}
            >
              {renderPreview()}
            </LinearGradient>

            {/* Scrollable content */}
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Content */}
              <View className="p-6">
              {/* Rarity badge */}
              <View className="items-center mb-3">
                <RarityBadge rarity={item.rarity} language={language} />
              </View>

              {/* Name */}
              <Text
                className="text-xl font-bold text-center mb-2"
                style={{ color: colors.text }}
              >
                {displayName}
              </Text>

              {/* Description */}
              <Text
                className="text-sm text-center mb-4"
                style={{ color: colors.textMuted }}
              >
                {displayDesc}
              </Text>

              {/* Spiritual meaning — only for L2 avatars */}
              {item.meaning && item.type === 'avatar' && (
                <View
                  style={{
                    backgroundColor: rarityColor + '10',
                    borderLeftWidth: 3,
                    borderLeftColor: rarityColor,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: sFont(11), fontWeight: '700', color: rarityColor, marginBottom: 3, letterSpacing: 0.5 }}>
                    {language === 'es' ? 'SIGNIFICADO' : 'MEANING'}
                  </Text>
                  <Text style={{ fontSize: sFont(12), color: colors.text, lineHeight: 18, fontStyle: 'italic' }}>
                    {language === 'es' ? item.meaning : (item.meaningEn ?? item.meaning)}
                  </Text>
                </View>
              )}

              {/* Unlock type badge */}
              {item.unlockType && !item.chestOnly && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.textMuted + '12',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: sFont(13) }}>
                    {item.unlockType === 'streak' ? '🔥' : item.unlockType === 'devotionals' ? '📖' : item.unlockType === 'share' ? '💌' : '🏪'}
                  </Text>
                  <Text style={{ fontSize: sFont(12), fontWeight: '600', color: colors.textMuted }}>
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

              {/* Access type label: Free / Premium / Reward-only */}
              {item.type === 'avatar' && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 99,
                    backgroundColor: item.chestOnly
                      ? '#F59E0B20'
                      : item.price === 0
                      ? '#22C55E20'
                      : rarityColor + '18',
                    borderWidth: 1,
                    borderColor: item.chestOnly
                      ? '#F59E0B50'
                      : item.price === 0
                      ? '#22C55E50'
                      : rarityColor + '40',
                  }}>
                    <Text style={{
                      fontSize: sFont(11),
                      fontWeight: '700',
                      letterSpacing: 0.5,
                      color: item.chestOnly ? '#F59E0B' : item.price === 0 ? '#22C55E' : rarityColor,
                    }}>
                      {item.chestOnly
                        ? (language === 'es' ? 'SOLO COFRE' : 'CHEST ONLY')
                        : item.price === 0
                        ? (language === 'es' ? 'GRATIS' : 'FREE')
                        : (language === 'es' ? 'PREMIUM' : 'PREMIUM')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action button */}
              {isEquipped ? (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: '#22C55E20' }}
                >
                  <Check size={20} color="#22C55E" strokeWidth={3} />
                  <Text className="text-base font-semibold ml-2" style={{ color: '#22C55E' }}>
                    {t.equipped}
                  </Text>
                </View>
              ) : isOwned ? (
                <ActionButton
                  onPress={onEquip}
                  label={t.equip}
                  size="md"
                  surfaceColor={colors.surface}
                />
              ) : item.chestOnly ? (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: '#F59E0B20' }}
                >
                  <Gift size={18} color="#F59E0B" />
                  <Text
                    className="text-base font-semibold ml-2"
                    style={{ color: '#F59E0B' }}
                  >
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
                  size="md"
                  surfaceColor={colors.surface}
                />
              ) : (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.textMuted + '20' }}
                >
                  <Lock size={18} color={colors.textMuted} />
                  <Text
                    className="text-base font-semibold ml-2"
                    style={{ color: colors.textMuted }}
                  >
                    {item.price} {language === 'es' ? 'puntos' : 'points'}
                  </Text>
                </View>
              )}
            </View>

            {/* Gift button — visible when item is purchasable (price > 0, not chest-only) */}
            {!item.chestOnly && item.price > 0 && onGift && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onGift(); }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginTop: 4, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 8,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Gift size={15} color={colors.textMuted} />
                <Text style={{ fontSize: sFont(13), color: colors.textMuted, fontWeight: '600' }}>
                  {language === 'es' ? 'Regalar a un amigo' : 'Gift to a friend'}
                </Text>
              </Pressable>
            )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ItemDetailModal;
