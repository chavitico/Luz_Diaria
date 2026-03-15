import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Coins, Check, Lock, Sparkles, Star, Award, ShoppingBag, BookOpen } from 'lucide-react-native';
import { useThemeColors } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import {
  STORE_BUNDLES,
  DEFAULT_AVATARS,
  PURCHASABLE_THEMES,
  AVATAR_FRAMES,
  RARITY_COLORS,
  RARITY_GRADIENTS,
} from '@/lib/constants';
import { RarityBadge } from '@/components/store/RarityBadge';
import { ActionButton } from '@/components/ui/ActionButton';

export function BundleCard({
  bundle,
  purchasedItems,
  points,
  colors,
  language,
  onPress,
  isPurchasing = false,
  onViewAdventure,
}: {
  bundle: typeof STORE_BUNDLES[string];
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isPurchasing?: boolean;
  onViewAdventure?: (targetType: string, targetId: string) => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const rarityColor = RARITY_COLORS[bundle.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const canAfford = points >= bundle.bundlePrice;
  const savings = bundle.originalPrice - bundle.bundlePrice;
  const isV2Bundle = 'isV2' in bundle && bundle.isV2 === true;
  const isAdventureBundle = 'isAdventure' in bundle && bundle.isAdventure === true;
  const isComingSoon = 'comingSoon' in bundle && bundle.comingSoon === true;
  const adventureNumber = 'adventureNumber' in bundle ? (bundle as { adventureNumber?: number }).adventureNumber : undefined;
  const collectionBonus = 'collectionBonus' in bundle ? (bundle as { collectionBonus?: number }).collectionBonus : undefined;
  const storyId = 'storyId' in bundle ? (bundle as { storyId?: string }).storyId : undefined;

  // Check if all items in bundle are already owned
  const allOwned = bundle.items.every(itemId => purchasedItems.includes(itemId));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get item previews
  const getItemPreview = (itemId: string) => {
    if (itemId.startsWith('theme_')) {
      const theme = PURCHASABLE_THEMES[itemId];
      if (theme) return { type: 'theme', colors: theme.colors };
    }
    if (itemId.startsWith('frame_')) {
      const frame = AVATAR_FRAMES[itemId];
      if (frame) return { type: 'frame', color: frame.color };
    }
    if (itemId.startsWith('title_')) {
      return { type: 'title' };
    }
    if (itemId.startsWith('avatar_')) {
      const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
      if (avatar) return { type: 'avatar', emoji: avatar.emoji };
    }
    return null;
  };

  // ─── ADVENTURE BUNDLE — Premium Card ─────────────────────────────────────────
  if (isAdventureBundle) {
    const GOLD_GRADIENT: [string, string, string] = isComingSoon
      ? ['#2A2210', '#1A1500', '#0D0B00']
      : ['#3D2B00', '#1A1200', '#0A0800'];
    const GOLD_ACCENT = isComingSoon ? '#6B5A2A' : '#C89B3C';
    const GOLD_LIGHT = isComingSoon ? '#8B7A4A' : '#F5D06A';

    const getItemTypeLabel = (itemId: string) => {
      if (itemId.startsWith('avatar_')) return language === 'es' ? 'Avatar' : 'Avatar';
      if (itemId.startsWith('frame_')) return language === 'es' ? 'Marco' : 'Frame';
      if (itemId.startsWith('title_')) return language === 'es' ? 'Título' : 'Title';
      return '';
    };

    return (
      <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.98); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={isPurchasing}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: isComingSoon ? '#000' : '#C89B3C',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isComingSoon ? 0.3 : 0.5,
            shadowRadius: 16,
            elevation: 8,
            opacity: isComingSoon ? 0.8 : 1,
          }}
        >
          {/* Hero gradient background */}
          <LinearGradient
            colors={GOLD_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 0 }}
          >
            {/* Top banner */}
            <LinearGradient
              colors={isComingSoon ? ['#6B5A2A88', '#4A3D1A88'] : ['#C89B3C', '#8B6914']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Star size={12} color="#FFF8E0" fill="#FFF8E0" />
                <Text style={{ fontSize: sFont(11), fontWeight: '900', color: '#FFF8E0', letterSpacing: 1.5 }}>
                  {(language === 'es' ? 'AVENTURA BÍBLICA' : 'BIBLICAL ADVENTURE')}
                  {adventureNumber ? ` #${adventureNumber}` : ''}
                </Text>
              </View>
              {isComingSoon ? (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#FFF', letterSpacing: 0.8 }}>
                    {language === 'es' ? 'PRÓXIMAMENTE' : 'COMING SOON'}
                  </Text>
                </View>
              ) : allOwned ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.25)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Check size={10} color="#22C55E" strokeWidth={3} />
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#22C55E' }}>
                    {language === 'es' ? 'COMPRADA' : 'OWNED'}
                  </Text>
                </View>
              ) : null}
            </LinearGradient>

            {/* Body */}
            <View style={{ padding: 16, gap: 14 }}>
              {/* Title row */}
              <View>
                <Text style={{ fontSize: sFont(19), fontWeight: '900', color: GOLD_LIGHT, letterSpacing: -0.3 }}>
                  {language === 'es' ? bundle.nameEs : bundle.name}
                </Text>
                <Text style={{ fontSize: sFont(12), color: GOLD_ACCENT, marginTop: 2, fontWeight: '500' }}>
                  {language === 'es' ? bundle.descriptionEs : bundle.description}
                </Text>
              </View>

              {/* Reward tiles row */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {bundle.items.slice(0, 3).map((itemId) => {
                  const preview = getItemPreview(itemId);
                  const isItemOwned = purchasedItems.includes(itemId);
                  const typeLabel = getItemTypeLabel(itemId);

                  return (
                    <View key={itemId} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                      {/* Tile */}
                      <View style={{
                        width: '100%',
                        aspectRatio: 1,
                        borderRadius: 12,
                        backgroundColor: isItemOwned ? '#22C55E15' : GOLD_ACCENT + '18',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: isItemOwned ? '#22C55E60' : GOLD_ACCENT + '50',
                        position: 'relative',
                      }}>
                        {isItemOwned && (
                          <View style={{ position: 'absolute', top: -5, right: -5, zIndex: 1, backgroundColor: '#22C55E', borderRadius: 99, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={9} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                        {preview?.type === 'avatar' && preview.emoji && (
                          <Text style={{ fontSize: sFont(26) }}>{preview.emoji}</Text>
                        )}
                        {preview?.type === 'frame' && preview.color && (
                          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 4, borderColor: preview.color }} />
                        )}
                        {preview?.type === 'title' && (
                          <Award size={24} color={GOLD_ACCENT} />
                        )}
                      </View>
                      {/* Label */}
                      <Text style={{ fontSize: sFont(10), fontWeight: '700', color: GOLD_ACCENT, letterSpacing: 0.3 }}>
                        {typeLabel.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Bonus + price row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {collectionBonus && !allOwned ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={12} color={GOLD_ACCENT} />
                    <Text style={{ fontSize: sFont(11), fontWeight: '700', color: GOLD_ACCENT }}>
                      {language === 'es'
                        ? `Incluye 3 recompensas + bono +${collectionBonus} pts`
                        : `3 rewards + collection bonus +${collectionBonus} pts`}
                    </Text>
                  </View>
                ) : allOwned ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Check size={12} color="#22C55E" strokeWidth={2.5} />
                    <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#22C55E' }}>
                      {language === 'es' ? 'Todas las recompensas obtenidas' : 'All rewards acquired'}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                {/* Price pill */}
                {!allOwned && !isComingSoon && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD_ACCENT + '25', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: GOLD_ACCENT + '60' }}>
                    <Coins size={12} color={GOLD_LIGHT} />
                    <Text style={{ fontSize: sFont(13), fontWeight: '900', color: GOLD_LIGHT }}>{bundle.bundlePrice.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              {/* CTA Button */}
              {!isComingSoon && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (allOwned && onViewAdventure) {
                      const targetType = (bundle as any).targetType as string | undefined;
                      const targetId = (bundle as any).targetId as string | undefined;
                      onViewAdventure(targetType ?? 'story', targetId ?? bundle.id);
                    } else {
                      onPress();
                    }
                  }}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginTop: 2,
                    opacity: !allOwned && !canAfford ? 0.5 : 1,
                  }}
                >
                  <LinearGradient
                    colors={allOwned ? ['#166534', '#15803D'] : canAfford ? ['#C89B3C', '#8B6914'] : ['#444', '#333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : allOwned ? (
                      <>
                        <BookOpen size={16} color="#FFF" />
                        <Text style={{ fontSize: sFont(14), fontWeight: '800', color: '#FFF', letterSpacing: 0.3 }}>
                          {language === 'es' ? 'Ver aventura' : 'View Adventure'}
                        </Text>
                      </>
                    ) : canAfford ? (
                      <>
                        <Sparkles size={16} color="#FFF8E0" />
                        <Text style={{ fontSize: sFont(14), fontWeight: '800', color: '#FFF8E0', letterSpacing: 0.3 }}>
                          {language === 'es' ? 'Comprar aventura' : 'Buy Adventure'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Lock size={14} color="#999" />
                        <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#999' }}>
                          {language === 'es' ? 'Puntos insuficientes' : 'Not enough points'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // ─── REGULAR BUNDLE CARD ──────────────────────────────────────────────────────
  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={allOwned || isPurchasing || !canAfford || isComingSoon}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: rarityColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isComingSoon ? 0.1 : 0.2,
          shadowRadius: 12,
          elevation: 4,
          opacity: allOwned ? 0.6 : isComingSoon ? 0.75 : 1,
        }}
      >
        <LinearGradient
          colors={RARITY_GRADIENTS[bundle.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: rarityColor + '25' }}
            >
              <ShoppingBag size={24} color={rarityColor} />
            </View>
            <View className="flex-1">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  {language === 'es' ? bundle.nameEs : bundle.name}
                </Text>
                {isV2Bundle && (
                  <View style={{
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: rarityColor + '20',
                  }}>
                    <Text style={{ fontSize: sFont(9), fontWeight: '700', color: rarityColor }}>V2</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-xs"
                style={{ color: colors.textMuted }}
              >
                {language === 'es' ? bundle.descriptionEs : bundle.description}
              </Text>
            </View>
            <RarityBadge rarity={bundle.rarity} language={language} />
          </View>

          {/* Item Previews */}
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            {bundle.items.map((itemId, index) => {
              const preview = getItemPreview(itemId);
              const isItemOwned = purchasedItems.includes(itemId);

              return (
                <View
                  key={itemId}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isItemOwned ? '#22C55E' : colors.textMuted + '30',
                    opacity: isItemOwned ? 0.5 : 1,
                  }}
                >
                  {isItemOwned && (
                    <View style={{ position: 'absolute', top: -4, right: -4, zIndex: 1 }}>
                      <Check size={12} color="#22C55E" strokeWidth={3} />
                    </View>
                  )}
                  {preview?.type === 'theme' && preview.colors && (
                    <View style={{ flexDirection: 'row', width: 32, height: 32, borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{ flex: 1, backgroundColor: preview.colors.primary }} />
                      <View style={{ flex: 1, backgroundColor: preview.colors.secondary }} />
                    </View>
                  )}
                  {preview?.type === 'frame' && preview.color && (
                    <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: preview.color }} />
                  )}
                  {preview?.type === 'title' && <Award size={20} color={colors.textMuted} />}
                  {preview?.type === 'avatar' && preview.emoji && (
                    <Text style={{ fontSize: sFont(22) }}>{preview.emoji}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Pricing */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text
                className="text-sm line-through mr-2"
                style={{ color: colors.textMuted }}
              >
                {bundle.originalPrice}
              </Text>
              <View className="flex-row items-center">
                <Coins size={16} color={colors.primary} />
                <Text
                  className="text-lg font-bold ml-1"
                  style={{ color: colors.primary }}
                >
                  {bundle.bundlePrice}
                </Text>
              </View>
              <View
                className="ml-3 px-2 py-1 rounded-md"
                style={{ backgroundColor: '#22C55E20' }}
              >
                <Text className="text-xs font-bold text-green-600">
                  {language === 'es' ? `Ahorra ${savings}` : `Save ${savings}`}
                </Text>
              </View>
            </View>

            {allOwned ? (
              <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
                <Check size={14} color="#22C55E" strokeWidth={3} />
                <Text className="text-xs font-semibold text-green-600 ml-1">
                  {language === 'es' ? 'Completado' : 'Owned'}
                </Text>
              </View>
            ) : isComingSoon ? (
              <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#C89B3C20' }}>
                <Lock size={12} color="#C89B3C" />
                <Text className="text-xs font-semibold ml-1" style={{ color: '#C89B3C' }}>
                  {language === 'es' ? 'Próximamente' : 'Soon'}
                </Text>
              </View>
            ) : canAfford ? (
              <View style={{ paddingHorizontal: 4 }}>
                <ActionButton
                  disabled={isPurchasing}
                  loading={isPurchasing}
                  label={language === 'es' ? 'Comprar' : 'Buy'}
                  size="sm"
                  fullWidth={false}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                  surfaceColor={colors.surface}
                />
              </View>
            ) : (
              <View
                className="flex-row items-center px-4 py-2 rounded-xl"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <Lock size={14} color={colors.textMuted} />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default BundleCard;
