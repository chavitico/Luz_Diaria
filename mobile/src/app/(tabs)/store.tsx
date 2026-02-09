// Store Screen - Gamification Hub with 5 Reward Categories

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Coins,
  Check,
  Flame,
  Lock,
  Palette,
  CircleDot,
  Music,
  Award,
  User as UserIcon,
  X,
  Gift,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  useThemeColors,
  useLanguage,
  useUserPoints,
  useUser,
  useAppStore,
} from '@/lib/store';
import {
  TRANSLATIONS,
  DEFAULT_AVATARS,
  PURCHASABLE_THEMES,
  AVATAR_FRAMES,
  SPIRITUAL_TITLES,
  RARITY_COLORS,
} from '@/lib/constants';
import { cn } from '@/lib/cn';
import {
  gamificationApi,
  StoreItem,
  WeeklyProgress,
  WeeklyChallenge,
} from '@/lib/gamification-api';

type CategoryType = 'themes' | 'frames' | 'music' | 'titles' | 'avatars';

const CATEGORIES: { key: CategoryType; icon: typeof Palette; label: string; labelEs: string }[] = [
  { key: 'themes', icon: Palette, label: 'Themes', labelEs: 'Temas' },
  { key: 'frames', icon: CircleDot, label: 'Frames', labelEs: 'Marcos' },
  { key: 'music', icon: Music, label: 'Music', labelEs: 'Musica' },
  { key: 'titles', icon: Award, label: 'Titles', labelEs: 'Titulos' },
  { key: 'avatars', icon: UserIcon, label: 'Avatars', labelEs: 'Avatares' },
];

// Profile Header Component
function ProfileHeader({
  colors,
  user,
  points,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  user: ReturnType<typeof useUser>;
  points: number;
  language: 'en' | 'es';
}) {
  const t = TRANSLATIONS[language];

  // Get equipped frame color
  const frameColor = user?.frameId && AVATAR_FRAMES[user.frameId]
    ? AVATAR_FRAMES[user.frameId].color
    : colors.textMuted;

  // Get equipped title
  const equippedTitle = user?.titleId && SPIRITUAL_TITLES[user.titleId]
    ? language === 'es'
      ? SPIRITUAL_TITLES[user.titleId].nameEs
      : SPIRITUAL_TITLES[user.titleId].name
    : t.no_title;

  // Get avatar emoji
  const avatarEmoji = DEFAULT_AVATARS.find(a => a.id === user?.avatar)?.emoji || '🕊️';

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className="mx-5 mb-5 rounded-2xl p-5"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center">
        {/* Avatar with Frame */}
        <View className="relative mr-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.primary + '15',
              borderWidth: 3,
              borderColor: frameColor,
            }}
          >
            <Text style={{ fontSize: 28 }}>{avatarEmoji}</Text>
          </View>
        </View>

        {/* User Info */}
        <View className="flex-1">
          <Text
            className="text-lg font-bold mb-0.5"
            style={{ color: colors.text }}
          >
            {user?.nickname || 'Pilgrim'}
          </Text>
          <Text
            className="text-sm italic"
            style={{ color: colors.textMuted }}
            numberOfLines={1}
          >
            {equippedTitle}
          </Text>
        </View>

        {/* Points & Streak */}
        <View className="items-end">
          <View className="flex-row items-center mb-1">
            <Coins size={16} color={colors.primary} />
            <Text
              className="text-lg font-bold ml-1"
              style={{ color: colors.primary }}
            >
              {points}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Flame size={14} color="#F97316" />
            <Text
              className="text-sm font-semibold ml-1"
              style={{ color: '#F97316' }}
            >
              {user?.streakCurrent || 0}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// Weekly Challenges Card
function WeeklyChallengesCard({
  colors,
  language,
  userId,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
}) {
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();
  const updateUser = useAppStore((s) => s.updateUser);

  // Fetch current challenges
  const { data: challenges = [] } = useQuery({
    queryKey: ['weeklyChallenges'],
    queryFn: () => gamificationApi.getCurrentChallenges(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user progress
  const { data: progressData = [] } = useQuery({
    queryKey: ['challengeProgress', userId],
    queryFn: () => gamificationApi.getChallengeProgress(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Claim reward mutation
  const claimMutation = useMutation({
    mutationFn: ({ challengeId }: { challengeId: string }) =>
      gamificationApi.claimChallengeReward(userId, challengeId),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
      if (data.pointsAwarded) {
        updateUser({ points: (useAppStore.getState().user?.points || 0) + data.pointsAwarded });
      }
    },
  });

  if (challenges.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      className="mx-5 mb-5 rounded-2xl p-5"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center mb-4">
        <View
          className="w-8 h-8 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: '#F97316' + '20' }}
        >
          <Gift size={18} color="#F97316" />
        </View>
        <Text
          className="text-base font-semibold flex-1"
          style={{ color: colors.text }}
        >
          {t.weekly_challenges}
        </Text>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>

      {challenges.slice(0, 2).map((challenge, index) => {
        const progress = progressData.find(p => p.challengeId === challenge.id);
        const currentCount = progress?.currentCount || 0;
        const progressPercent = Math.min((currentCount / challenge.goalCount) * 100, 100);
        const isComplete = progress?.completed || false;
        const isClaimed = progress?.claimed || false;

        return (
          <View key={challenge.id} className={index > 0 ? 'mt-4' : ''}>
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-sm font-medium flex-1"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {language === 'es' ? challenge.titleEs : challenge.titleEn}
              </Text>
              <Text
                className="text-xs font-semibold ml-2"
                style={{ color: colors.textMuted }}
              >
                {currentCount}/{challenge.goalCount}
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              className="h-2 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: isComplete ? '#22C55E' : colors.primary,
                }}
              />
            </View>

            {/* Reward Info or Claim Button */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Coins size={12} color={colors.primary} />
                <Text
                  className="text-xs font-medium ml-1"
                  style={{ color: colors.primary }}
                >
                  +{challenge.rewardPoints}
                </Text>
              </View>

              {isComplete && !isClaimed && (
                <Pressable
                  onPress={() => claimMutation.mutate({ challengeId: challenge.id })}
                  disabled={claimMutation.isPending}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  {claimMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-xs font-semibold text-white">
                      {t.claim_reward}
                    </Text>
                  )}
                </Pressable>
              )}

              {isClaimed && (
                <View className="flex-row items-center px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#22C55E20' }}>
                  <Check size={12} color="#22C55E" strokeWidth={3} />
                  <Text className="text-xs font-semibold text-green-600 ml-1">
                    {t.reward_claimed}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}

// Category Tab
function CategoryTab({
  category,
  isActive,
  colors,
  language,
  onPress,
}: {
  category: typeof CATEGORIES[0];
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const Icon = category.icon;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="items-center mr-4"
      >
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5"
          style={{
            backgroundColor: isActive ? colors.primary : colors.surface,
            shadowColor: isActive ? colors.primary : '#000',
            shadowOffset: { width: 0, height: isActive ? 4 : 2 },
            shadowOpacity: isActive ? 0.3 : 0.06,
            shadowRadius: isActive ? 8 : 4,
            elevation: isActive ? 4 : 2,
          }}
        >
          <Icon
            size={22}
            color={isActive ? '#FFFFFF' : colors.textMuted}
          />
        </View>
        <Text
          className="text-xs font-medium"
          style={{ color: isActive ? colors.primary : colors.textMuted }}
        >
          {language === 'es' ? category.labelEs : category.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Theme Preview Card
function ThemePreviewCard({
  themeData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
}: {
  themeData: typeof PURCHASABLE_THEMES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rarityColor = RARITY_COLORS[themeData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  return (
    <Animated.View style={[animatedStyle, { width: '48%', marginBottom: 12 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
          opacity: !canAfford && !isOwned ? 0.6 : 1,
        }}
      >
        {/* Color Preview - fixed height */}
        <View style={{ height: 56, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: themeData.colors.primary }} />
          <View style={{ flex: 1, backgroundColor: themeData.colors.secondary }} />
          <View style={{ flex: 1, backgroundColor: themeData.colors.accent }} />
        </View>

        {/* Lock Overlay */}
        {!canAfford && !isOwned && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Lock size={20} color="#FFFFFF" />
          </View>
        )}

        <View style={{ padding: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 }}
              numberOfLines={1}
            >
              {language === 'es' ? themeData.nameEs : themeData.name}
            </Text>
            <View
              style={{ width: 6, height: 6, borderRadius: 3, marginLeft: 6, backgroundColor: rarityColor }}
            />
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={11} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#22C55E', marginLeft: 4 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : themeData.price === 0 ? (
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#22C55E' }}>
              Free
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={11} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 11, fontWeight: '600', marginLeft: 4, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {themeData.price}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Frame Preview Card
function FramePreviewCard({
  frameData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
}: {
  frameData: typeof AVATAR_FRAMES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rarityColor = RARITY_COLORS[frameData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  return (
    <Animated.View style={[animatedStyle, { width: '31%', marginBottom: 10 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 10,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
          opacity: !canAfford && !isOwned ? 0.6 : 1,
        }}
      >
        {/* Frame Preview Circle */}
        <View style={{ position: 'relative', marginBottom: 6 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
              borderWidth: 3,
              borderColor: frameData.color,
            }}
          >
            <Text style={{ fontSize: 18 }}>🕊️</Text>
          </View>

          {/* Lock Overlay */}
          {!canAfford && !isOwned && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24 }}>
              <Lock size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text
            style={{ fontSize: 10, fontWeight: '600', color: colors.text, maxWidth: 55 }}
            numberOfLines={1}
          >
            {language === 'es' ? frameData.nameEs : frameData.name}
          </Text>
          <View
            style={{ width: 5, height: 5, borderRadius: 2.5, marginLeft: 3, backgroundColor: rarityColor }}
          />
        </View>

        {/* Price or Status */}
        {isEquipped ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Check size={9} color="#22C55E" strokeWidth={3} />
          </View>
        ) : isOwned ? (
          <Text style={{ fontSize: 10, fontWeight: '500', color: colors.primary }}>
            {t.equip}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Coins size={9} color={canAfford ? colors.primary : colors.textMuted} />
            <Text
              style={{ fontSize: 10, fontWeight: '600', marginLeft: 2, color: canAfford ? colors.primary : colors.textMuted }}
            >
              {frameData.price}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Title Card
function TitleCard({
  titleData,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
}: {
  titleData: typeof SPIRITUAL_TITLES[string];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const t = TRANSLATIONS[language];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rarityColor = RARITY_COLORS[titleData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  return (
    <Animated.View style={animatedStyle} className="mb-3">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="rounded-2xl p-4 flex-row items-center"
        style={{
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
          opacity: !canAfford && !isOwned ? 0.6 : 1,
        }}
      >
        {/* Lock Icon for unaffordable */}
        {!canAfford && !isOwned && (
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: colors.textMuted + '20' }}
          >
            <Lock size={18} color={colors.textMuted} />
          </View>
        )}

        {/* Rarity indicator for affordable */}
        {(canAfford || isOwned) && (
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: rarityColor + '20' }}
          >
            <Award size={18} color={rarityColor} />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center mb-0.5">
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              {language === 'es' ? titleData.nameEs : titleData.name}
            </Text>
            <View
              className="w-2 h-2 rounded-full ml-2"
              style={{ backgroundColor: rarityColor }}
            />
          </View>
        </View>

        {/* Price or Status */}
        {isEquipped ? (
          <View className="flex-row items-center px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#22C55E20' }}>
            <Check size={12} color="#22C55E" strokeWidth={3} />
            <Text className="text-xs font-semibold text-green-600 ml-1">
              {t.equipped}
            </Text>
          </View>
        ) : isOwned ? (
          <Pressable
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              {t.equip}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center px-3 py-1.5 rounded-lg" style={{ backgroundColor: colors.primary + '15' }}>
            <Coins size={12} color={canAfford ? colors.primary : colors.textMuted} />
            <Text
              className="text-xs font-semibold ml-1"
              style={{ color: canAfford ? colors.primary : colors.textMuted }}
            >
              {titleData.price}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Avatar Card
function AvatarCard({
  avatar,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
}: {
  avatar: { id: string; name: string; emoji: string; price?: number };
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasCost = avatar.price !== undefined && avatar.price > 0;

  return (
    <Animated.View style={[animatedStyle, { width: '31%', marginBottom: 10 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 10,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
          opacity: !canAfford && !isOwned && hasCost ? 0.6 : 1,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: isEquipped ? colors.primary : 'transparent',
        }}
      >
        {/* Avatar Emoji */}
        <View style={{ position: 'relative', marginBottom: 6 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary + '15',
            }}
          >
            <Text style={{ fontSize: 22 }}>{avatar.emoji}</Text>
          </View>

          {/* Lock Overlay */}
          {!canAfford && !isOwned && hasCost && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22 }}>
              <Lock size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text
          style={{ fontSize: 10, fontWeight: '500', color: colors.text, textAlign: 'center', marginBottom: 2 }}
          numberOfLines={1}
        >
          {avatar.name}
        </Text>

        {/* Price or Status */}
        {isEquipped ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Check size={9} color="#22C55E" strokeWidth={3} />
          </View>
        ) : !hasCost || isOwned ? (
          <Text style={{ fontSize: 10, color: '#22C55E' }}>
            Free
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Coins size={9} color={canAfford ? colors.primary : colors.textMuted} />
            <Text
              style={{ fontSize: 10, fontWeight: '600', marginLeft: 2, color: canAfford ? colors.primary : colors.textMuted }}
            >
              {avatar.price}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Music Track Card (placeholder since no music constants defined)
function MusicCard({
  colors,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const t = TRANSLATIONS[language];

  return (
    <View
      className="rounded-2xl p-6 items-center justify-center"
      style={{
        backgroundColor: colors.surface,
        minHeight: 160,
      }}
    >
      <Music size={40} color={colors.textMuted} />
      <Text
        className="text-sm font-medium mt-3 text-center"
        style={{ color: colors.textMuted }}
      >
        {language === 'es' ? 'Musica disponible pronto' : 'Music coming soon'}
      </Text>
    </View>
  );
}

// Points Animation Toast
function PointsToast({
  amount,
  visible,
  onHide,
}: {
  amount: number;
  visible: boolean;
  onHide: () => void;
}) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(-10, { duration: 300 }),
        withTiming(0, { duration: 100 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 300 })
      );
      const timeout = setTimeout(() => {
        runOnJS(onHide)();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        className="px-4 py-2 rounded-full flex-row items-center"
        style={{ backgroundColor: '#22C55E' }}
      >
        <Sparkles size={16} color="#FFFFFF" />
        <Text className="text-white font-bold ml-2">-{amount} points</Text>
      </View>
    </Animated.View>
  );
}

// Main Store Screen
export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const points = useUserPoints();
  const user = useUser();
  const updateUser = useAppStore((s) => s.updateUser);
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<CategoryType>('themes');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    price: number;
    type: 'theme' | 'frame' | 'title' | 'avatar' | 'music';
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);

  const userId = user?.id || '';
  const purchasedItems = user?.purchasedItems ?? [];

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      gamificationApi.purchaseItem(userId, itemId),
    onSuccess: (data) => {
      if (data.success && data.newPoints !== undefined) {
        updateUser({
          points: data.newPoints,
          purchasedItems: [...purchasedItems, selectedItem?.id || ''],
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setToastAmount(selectedItem?.price || 0);
        setShowPointsToast(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    },
    onError: () => {
      // Fallback: use local store for purchase
      if (selectedItem) {
        const localSuccess = useAppStore.getState().purchaseItem(selectedItem.id, selectedItem.price);
        if (localSuccess) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowConfirmModal(false);
          setShowSuccessModal(true);
          setToastAmount(selectedItem.price);
          setShowPointsToast(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }
    },
  });

  // Equip mutation
  const equipMutation = useMutation({
    mutationFn: ({
      type,
      itemId,
    }: {
      type: 'theme' | 'frame' | 'title' | 'music';
      itemId: string | null;
    }) => gamificationApi.equipItem(userId, type, itemId),
    onSuccess: (data, variables) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Update local state based on type
      const updates: Partial<typeof user> = {};
      if (variables.type === 'frame') updates.frameId = variables.itemId;
      if (variables.type === 'title') updates.titleId = variables.itemId;
      if (variables.type === 'theme') updates.themeId = variables.itemId || undefined;
      if (variables.type === 'music') updates.selectedMusicId = variables.itemId || undefined;
      updateUser(updates);
    },
    onError: (_, variables) => {
      // Fallback: just update local state
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updates: Partial<typeof user> = {};
      if (variables.type === 'frame') updates.frameId = variables.itemId;
      if (variables.type === 'title') updates.titleId = variables.itemId;
      if (variables.type === 'theme') updates.themeId = variables.itemId || undefined;
      if (variables.type === 'music') updates.selectedMusicId = variables.itemId || undefined;
      updateUser(updates);
    },
  });

  // Handle item press
  const handleItemPress = useCallback(
    (item: {
      id: string;
      name: string;
      price: number;
      type: 'theme' | 'frame' | 'title' | 'avatar' | 'music';
    }) => {
      const isOwned =
        purchasedItems.includes(item.id) || item.price === 0 ||
        (item.type === 'avatar' && !DEFAULT_AVATARS.find(a => a.id === item.id && 'price' in a));
      const canAfford = points >= item.price;

      if (isOwned && item.type !== 'avatar') {
        // Equip the item
        equipMutation.mutate({
          type: item.type as 'theme' | 'frame' | 'title' | 'music',
          itemId: item.id,
        });
      } else if (item.type === 'avatar' && isOwned) {
        // Equip avatar locally
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        updateUser({ avatar: item.id });
      } else if (canAfford) {
        // Show purchase confirmation
        setSelectedItem(item);
        setShowConfirmModal(true);
      } else {
        // Cannot afford - subtle haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [purchasedItems, points, equipMutation, updateUser]
  );

  const handleConfirmPurchase = useCallback(() => {
    if (!selectedItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    purchaseMutation.mutate({ itemId: selectedItem.id });
  }, [selectedItem, purchaseMutation]);

  // Render category content
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'themes':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'flex-start' }}>
            {Object.values(PURCHASABLE_THEMES).map((theme, index) => {
              const isOwned = purchasedItems.includes(theme.id) || theme.price === 0;
              const isEquipped = user?.themeId === theme.id;
              const canAfford = points >= theme.price;

              return (
                <Animated.View
                  key={theme.id}
                  entering={FadeInRight.delay(index * 50).duration(300)}
                  style={{ width: '48%' }}
                >
                  <ThemePreviewCard
                    themeData={theme}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() =>
                      handleItemPress({
                        id: theme.id,
                        name: language === 'es' ? theme.nameEs : theme.name,
                        price: theme.price,
                        type: 'theme',
                      })
                    }
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'frames':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 20, gap: 8 }}>
            {Object.values(AVATAR_FRAMES).map((frame, index) => {
              const isOwned = purchasedItems.includes(frame.id);
              const isEquipped = user?.frameId === frame.id;
              const canAfford = points >= frame.price;

              return (
                <Animated.View
                  key={frame.id}
                  entering={FadeInRight.delay(index * 50).duration(300)}
                  style={{ width: '31%' }}
                >
                  <FramePreviewCard
                    frameData={frame}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() =>
                      handleItemPress({
                        id: frame.id,
                        name: language === 'es' ? frame.nameEs : frame.name,
                        price: frame.price,
                        type: 'frame',
                      })
                    }
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'titles':
        return (
          <View className="px-5">
            {Object.values(SPIRITUAL_TITLES).map((title, index) => {
              const isOwned = purchasedItems.includes(title.id);
              const isEquipped = user?.titleId === title.id;
              const canAfford = points >= title.price;

              return (
                <Animated.View
                  key={title.id}
                  entering={FadeInDown.delay(index * 40).duration(300)}
                >
                  <TitleCard
                    titleData={title}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() =>
                      handleItemPress({
                        id: title.id,
                        name: language === 'es' ? title.nameEs : title.name,
                        price: title.price,
                        type: 'title',
                      })
                    }
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'avatars':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 20, gap: 8 }}>
            {DEFAULT_AVATARS.map((avatar, index) => {
              const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
              const isOwned = purchasedItems.includes(avatar.id) || !hasCost;
              const isEquipped = user?.avatar === avatar.id;
              const price = hasCost ? (avatar as { price: number }).price : 0;
              const canAfford = points >= price;

              return (
                <Animated.View
                  key={avatar.id}
                  entering={FadeInRight.delay(index * 30).duration(250)}
                  style={{ width: '31%' }}
                >
                  <AvatarCard
                    avatar={{ ...avatar, price: hasCost ? price : undefined }}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() =>
                      handleItemPress({
                        id: avatar.id,
                        name: avatar.name,
                        price: price,
                        type: 'avatar',
                      })
                    }
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'music':
        return (
          <View className="px-5">
            <MusicCard colors={colors} language={language} />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <PointsToast
        amount={toastAmount}
        visible={showPointsToast}
        onHide={() => setShowPointsToast(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <Text
            className="text-3xl font-bold"
            style={{ color: colors.text }}
          >
            {t.store}
          </Text>
        </View>

        {/* Profile Header */}
        <ProfileHeader
          colors={colors}
          user={user}
          points={points}
          language={language}
        />

        {/* Weekly Challenges */}
        {userId && (
          <WeeklyChallengesCard
            colors={colors}
            language={language}
            userId={userId}
          />
        )}

        {/* Category Tabs */}
        <View className="mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ flexGrow: 0 }}
          >
            {CATEGORIES.map((category) => (
              <CategoryTab
                key={category.key}
                category={category}
                isActive={activeCategory === category.key}
                colors={colors}
                language={language}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(category.key);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Category Content */}
        {renderCategoryContent()}
      </ScrollView>

      {/* Purchase Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <Animated.View
            entering={FadeIn.duration(200)}
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <Pressable
              onPress={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.textMuted + '20' }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>

            <View className="items-center mb-6 pt-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + '15' }}
              >
                {selectedItem?.type === 'theme' && <Palette size={36} color={colors.primary} />}
                {selectedItem?.type === 'frame' && <CircleDot size={36} color={colors.primary} />}
                {selectedItem?.type === 'title' && <Award size={36} color={colors.primary} />}
                {selectedItem?.type === 'avatar' && <UserIcon size={36} color={colors.primary} />}
                {selectedItem?.type === 'music' && <Music size={36} color={colors.primary} />}
              </View>
            </View>

            <Text
              className="text-xl font-bold text-center mb-2"
              style={{ color: colors.text }}
            >
              {t.purchase} {selectedItem?.name}?
            </Text>

            <Text
              className="text-center mb-6"
              style={{ color: colors.textMuted }}
            >
              {language === 'es' ? 'Esto costara ' : 'This will cost '}
              <Text className="font-bold" style={{ color: colors.primary }}>
                {selectedItem?.price} {language === 'es' ? 'puntos' : 'points'}
              </Text>
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.textMuted + '20' }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: colors.textMuted }}
                >
                  {t.cancel}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmPurchase}
                disabled={purchaseMutation.isPending}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                {purchaseMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">{t.confirm}</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <Animated.View
            entering={FadeIn.duration(200)}
            className="rounded-3xl p-8 items-center"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="w-20 h-20 rounded-full items-center justify-center bg-green-500 mb-4">
              <Check size={40} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text }}
            >
              {t.purchase_success}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
