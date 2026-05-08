import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Sparkles, Check, Gift } from 'lucide-react-native';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS, ITEM_COLLECTIONS } from '@/lib/constants';
import type { useThemeColors } from '@/lib/store';

function CollectionCard({
  collection,
  purchasedItems,
  colors,
  language,
  isClaimed,
  isClaiming,
  isNew,
  onClaim,
  onPress,
}: {
  collection: typeof ITEM_COLLECTIONS[string];
  purchasedItems: string[];
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isClaimed: boolean;
  isClaiming: boolean;
  isNew: boolean;
  onClaim: (ownedItemIds: string[]) => void;
  onPress: () => void;
}) {
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);
  const isV2Collection = 'isV2' in collection && (collection as any).isV2 === true;

  const ownedItemIds = collection.items.filter(itemId => {
    if (purchasedItems.includes(itemId)) return true;
    const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
    if (avatar && !('price' in avatar)) return true;
    return false;
  });

  const ownedCount = ownedItemIds.length;
  const totalCount = collection.items.length;
  const isComplete = ownedCount === totalCount;
  const progressPercent = (ownedCount / totalCount) * 100;
  const canClaim = isComplete && !isClaimed;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: isClaimed ? '#22C55E' : isComplete ? colors.primary : '#000',
          shadowOffset: { width: 0, height: isClaimed || isComplete ? 4 : 2 },
          shadowOpacity: isClaimed || isComplete ? 0.18 : 0.08,
          shadowRadius: isClaimed || isComplete ? 12 : 6,
          elevation: isClaimed || isComplete ? 4 : 2,
          borderWidth: isClaimed || isComplete ? 1.5 : 0,
          borderColor: isClaimed ? '#22C55E' : colors.primary,
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{
                backgroundColor: isClaimed
                  ? '#22C55E20'
                  : isComplete
                  ? colors.primary + '25'
                  : isV2Collection
                  ? colors.primary + '20'
                  : colors.primary + '15',
              }}
            >
              <Text style={{ fontSize: sFont(24) }}>{collection.icon}</Text>
            </View>
            <View className="flex-1">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  {language === 'es' ? collection.nameEs : collection.name}
                </Text>
                {isV2Collection && (
                  <View style={{
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: colors.primary + '20',
                  }}>
                    <Text style={{ fontSize: sFont(9), fontWeight: '700', color: colors.primary }}>V2</Text>
                  </View>
                )}
                {isNew && (
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: '#EF4444',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text style={{ fontSize: sFont(9), fontWeight: '800', color: '#fff' }}>
                      {language === 'es' ? 'NUEVO' : 'NEW'}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                {language === 'es' ? collection.descriptionEs : collection.description}
              </Text>
            </View>
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: isComplete ? colors.primary + '20' : colors.textMuted + '15' }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isComplete ? colors.primary : colors.textMuted }}
              >
                {ownedCount}/{totalCount}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            className="h-2.5 rounded-full overflow-hidden mb-3"
            style={{ backgroundColor: colors.textMuted + '15' }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: isClaimed ? '#22C55E' : colors.primary,
              }}
            />
          </View>

          {/* Reward + Claim Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles size={14} color={isClaimed ? '#22C55E' : colors.primary} />
              <Text
                className="text-xs font-semibold ml-1"
                style={{ color: isClaimed ? '#22C55E' : colors.primary }}
              >
                {language === 'es' ? 'Premio' : 'Reward'}: +{collection.rewardPoints}{' '}
                {language === 'es' ? 'pts' : 'pts'}
              </Text>
            </View>

            {isClaimed ? (
              <View className="flex-row items-center px-3 py-1 rounded-lg" style={{ backgroundColor: '#22C55E20' }}>
                <Check size={12} color="#22C55E" strokeWidth={3} />
                <Text className="text-xs font-bold ml-1" style={{ color: '#22C55E' }}>
                  {language === 'es' ? 'Reclamado' : 'Claimed'}
                </Text>
              </View>
            ) : canClaim ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onClaim(ownedItemIds);
                }}
                disabled={isClaiming}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: isClaiming ? colors.primary + '60' : colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Gift size={13} color="#fff" />
                )}
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: sFont(12) }}>
                  {language === 'es' ? 'Reclamar' : 'Claim'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default CollectionCard;
