// Store Screen - Premium Gamification Hub with Collections, Bundles & Weekly Chest

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  Package,
  Layers,
  Star,
  Gem,
  ShoppingBag,
  Ticket,
} from 'lucide-react-native';
import { TextInput } from 'react-native';
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
  RARITY_GRADIENTS,
  ITEM_COLLECTIONS,
  STORE_BUNDLES,
  WEEKLY_CHEST_CONFIG,
} from '@/lib/constants';
import { cn } from '@/lib/cn';
import {
  gamificationApi,
  StoreItem,
  WeeklyProgress,
  WeeklyChallenge,
} from '@/lib/gamification-api';

type CategoryType = 'themes' | 'frames' | 'titles' | 'avatars' | 'bundles' | 'collections';

const CATEGORIES: { key: CategoryType; icon: typeof Palette; label: string; labelEs: string }[] = [
  { key: 'themes', icon: Palette, label: 'Themes', labelEs: 'Temas' },
  { key: 'frames', icon: CircleDot, label: 'Frames', labelEs: 'Marcos' },
  { key: 'titles', icon: Award, label: 'Titles', labelEs: 'Titulos' },
  { key: 'avatars', icon: UserIcon, label: 'Avatars', labelEs: 'Avatares' },
  { key: 'bundles', icon: Package, label: 'Bundles', labelEs: 'Paquetes' },
  { key: 'collections', icon: Layers, label: 'Collections', labelEs: 'Colecciones' },
];

// Get rarity icon
function RarityIcon({ rarity, size = 12 }: { rarity: string; size?: number }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  if (rarity === 'epic') return <Gem size={size} color={color} />;
  if (rarity === 'rare') return <Star size={size} color={color} />;
  return null;
}

// Rarity Badge Component
function RarityBadge({ rarity, language }: { rarity: string; language: 'en' | 'es' }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const labels = {
    common: { en: 'Common', es: 'Comun' },
    rare: { en: 'Rare', es: 'Raro' },
    epic: { en: 'Epic', es: 'Epico' },
  };
  const label = labels[rarity as keyof typeof labels]?.[language] || rarity;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
      }}
    >
      <RarityIcon rarity={rarity} size={10} />
      <Text style={{ fontSize: 10, fontWeight: '600', color, textTransform: 'capitalize' }}>
        {label}
      </Text>
    </View>
  );
}

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

  const frameColor = user?.frameId && AVATAR_FRAMES[user.frameId]
    ? AVATAR_FRAMES[user.frameId].color
    : colors.textMuted;

  const equippedTitle = user?.titleId && SPIRITUAL_TITLES[user.titleId]
    ? language === 'es'
      ? SPIRITUAL_TITLES[user.titleId].nameEs
      : SPIRITUAL_TITLES[user.titleId].name
    : t.no_title;

  const avatarData = DEFAULT_AVATARS.find(a => a.id === user?.avatar);
  const avatarEmoji = avatarData?.emoji || '🕊️';

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={[colors.surface, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center">
          {/* Avatar with Frame */}
          <View className="relative mr-4">
            <View
              className="w-18 h-18 rounded-full items-center justify-center"
              style={{
                width: 72,
                height: 72,
                backgroundColor: colors.primary + '15',
                borderWidth: 4,
                borderColor: frameColor,
                shadowColor: frameColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 32 }}>{avatarEmoji}</Text>
            </View>
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text
              className="text-xl font-bold mb-0.5"
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
            <View
              className="flex-row items-center mb-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Coins size={18} color={colors.primary} />
              <Text
                className="text-lg font-bold ml-1.5"
                style={{ color: colors.primary }}
              >
                {points}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Flame size={16} color="#F97316" />
              <Text
                className="text-base font-semibold ml-1"
                style={{ color: '#F97316' }}
              >
                {user?.streakCurrent || 0}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Chest Reward Modal - confetti splash + prize reveal
function ChestRewardModal({
  visible,
  reward,
  language,
  colors,
  onClose,
}: {
  visible: boolean;
  reward: {
    type: 'points' | 'item';
    value?: number;
    itemId?: string;
    itemName?: string;
    itemNameEs?: string;
    itemEmoji?: string;
    itemColor?: string;
    rarity: string;
  } | null;
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onClose: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const chestScale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; angle: number; id: number }[]>([]);
  const particleRefs = useRef<ReturnType<typeof useSharedValue>[]>([]);

  // Particle animation values (fixed array of 20)
  const p0 = useSharedValue(0); const p1 = useSharedValue(0); const p2 = useSharedValue(0);
  const p3 = useSharedValue(0); const p4 = useSharedValue(0); const p5 = useSharedValue(0);
  const p6 = useSharedValue(0); const p7 = useSharedValue(0); const p8 = useSharedValue(0);
  const p9 = useSharedValue(0); const p10 = useSharedValue(0); const p11 = useSharedValue(0);
  const p12 = useSharedValue(0); const p13 = useSharedValue(0); const p14 = useSharedValue(0);
  const p15 = useSharedValue(0); const p16 = useSharedValue(0); const p17 = useSharedValue(0);
  const p18 = useSharedValue(0); const p19 = useSharedValue(0);
  const pValues = [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19];

  const rarityGrad: [string, string] = reward?.rarity === 'epic'
    ? ['#4C1D95', '#7C3AED']
    : reward?.rarity === 'rare'
    ? ['#1E3A5F', '#2563EB']
    : ['#1A3A1A', '#15803D'];

  const rarityColor = reward?.rarity === 'epic' ? '#A855F7' : reward?.rarity === 'rare' ? '#3B82F6' : '#22C55E';
  const confettiColors = ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#F97316', '#EC4899', '#FCD34D'];

  useEffect(() => {
    if (visible) {
      // Generate particles
      const pts = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
        color: confettiColors[i % confettiColors.length],
        angle: (i / 20) * Math.PI * 2,
      }));
      setParticles(pts);

      // Animate in
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
      // Chest bounce
      chestScale.value = withSequence(
        withTiming(1, { duration: 100 }),
        withSpring(1.3, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      // Shimmer loop
      shimmer.value = withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800 })
      );
      // Burst particles
      pValues.forEach((p, i) => {
        p.value = 0;
        p.value = withSequence(
          withTiming(0, { duration: i * 30 }),
          withSpring(1, { damping: 8, stiffness: 120 })
        );
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      pValues.forEach(p => { p.value = 0; });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chestScale.value }],
  }));

  const isExclusive = reward?.itemId?.includes('_chest_');
  const displayName = language === 'es' ? (reward?.itemNameEs ?? reward?.itemName ?? '') : (reward?.itemName ?? '');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' }}>
        {/* Confetti particles */}
        {particles.map((pt, i) => {
          const pv = pValues[i];
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const pStyle = useAnimatedStyle(() => ({
            opacity: pv.value,
            transform: [
              { translateX: pt.x * pv.value },
              { translateY: pt.y * pv.value },
              { scale: pv.value },
              { rotate: `${pt.angle * 180 / Math.PI * pv.value}deg` },
            ],
          }));
          return (
            <Animated.View
              key={pt.id}
              style={[{
                position: 'absolute',
                width: 10 + (i % 4) * 4,
                height: 10 + (i % 4) * 4,
                borderRadius: i % 3 === 0 ? 99 : 2,
                backgroundColor: pt.color,
              }, pStyle]}
            />
          );
        })}

        <Animated.View style={[{ width: 320, borderRadius: 28, overflow: 'hidden' }, containerStyle]}>
          <LinearGradient colors={rarityGrad} style={{ padding: 32, alignItems: 'center' }}>
            {/* Rarity badge */}
            {isExclusive && (
              <View style={{ backgroundColor: rarityColor + '30', borderWidth: 1, borderColor: rarityColor, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 }}>
                <Text style={{ color: rarityColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
                  {language === 'es' ? '✦ EXCLUSIVO DEL COFRE ✦' : '✦ CHEST EXCLUSIVE ✦'}
                </Text>
              </View>
            )}

            {/* Chest icon */}
            <Animated.View style={[{ marginBottom: 20 }, chestStyle]}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: rarityColor + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: rarityColor + '60' }}>
                <Text style={{ fontSize: 52 }}>🎁</Text>
              </View>
            </Animated.View>

            {/* Prize */}
            {reward?.type === 'item' ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
                  {language === 'es' ? 'Has obtenido' : 'You received'}
                </Text>
                {reward.itemEmoji ? (
                  <Text style={{ fontSize: 56, marginBottom: 12 }}>{reward.itemEmoji}</Text>
                ) : reward.itemColor ? (
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: reward.itemColor, marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }} />
                ) : null}
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
                  {displayName}
                </Text>
                <View style={{ backgroundColor: rarityColor + '30', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 4 }}>
                  <Text style={{ color: rarityColor, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {reward.rarity}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
                  {language === 'es' ? 'Has ganado' : 'You earned'}
                </Text>
                <Text style={{ color: '#FCD34D', fontSize: 52, fontWeight: '900', marginBottom: 8 }}>
                  +{reward?.value}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '600' }}>
                  {language === 'es' ? 'puntos' : 'points'}
                </Text>
              </>
            )}

            {/* Close button */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }}
              style={{ marginTop: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                {language === 'es' ? '¡Genial!' : 'Awesome!'}
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Weekly Chest Card Component
function WeeklyChestCard({
  colors,
  language,
  userId,
  allChallengesComplete,
  onClaim,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  allChallengesComplete: boolean;
  onClaim: () => void;
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const user = useUser();
  const lastChestClaimed = user?.lastWeeklyChestClaimed;

  // Get current week ID
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const currentWeekId = `${now.getFullYear()}-W${weekNumber}`;

  const alreadyClaimed = lastChestClaimed === currentWeekId;
  const canClaim = allChallengesComplete && !alreadyClaimed;

  if (!allChallengesComplete && !alreadyClaimed) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(400)}
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: canClaim ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={canClaim ? ['#FAF5FF', '#F3E8FF'] : [colors.surface, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: canClaim ? '#A855F7' + '20' : colors.textMuted + '15' }}
          >
            <Gift size={28} color={canClaim ? '#A855F7' : colors.textMuted} />
          </View>

          <View className="flex-1">
            <Text
              className="text-base font-bold mb-1"
              style={{ color: colors.text }}
            >
              {language === 'es' ? 'Cofre Semanal' : 'Weekly Chest'}
            </Text>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
            >
              {alreadyClaimed
                ? language === 'es' ? 'Reclamado esta semana' : 'Claimed this week'
                : language === 'es' ? 'Completa todos los desafios' : 'Complete all challenges'
              }
            </Text>
          </View>

          {canClaim && (
            <Pressable
              onPress={() => {
                setIsClaiming(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onClaim();
                setTimeout(() => setIsClaiming(false), 500);
              }}
              disabled={isClaiming}
              className="px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: '#A855F7' }}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  {language === 'es' ? 'Abrir' : 'Open'}
                </Text>
              )}
            </Pressable>
          )}

          {alreadyClaimed && (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
              <Check size={14} color="#22C55E" strokeWidth={3} />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Weekly Challenges Card
function WeeklyChallengesCard({
  colors,
  language,
  userId,
  onAllComplete,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  onAllComplete: (complete: boolean) => void;
}) {
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();
  const updateUser = useAppStore((s) => s.updateUser);

  const { data: challenges = [] } = useQuery({
    queryKey: ['weeklyChallenges'],
    queryFn: () => gamificationApi.getCurrentChallenges(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ['challengeProgress', userId],
    queryFn: () => gamificationApi.getChallengeProgress(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Check if all challenges complete
  React.useEffect(() => {
    if (challenges.length > 0 && progressData.length > 0) {
      const allComplete = challenges.every(c => {
        const progress = progressData.find(p => p.challengeId === c.id);
        return progress?.completed && progress?.claimed;
      });
      onAllComplete(allComplete);
    }
  }, [challenges, progressData, onAllComplete]);

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
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="p-5">
        <View className="flex-row items-center mb-4">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: '#F97316' + '20' }}
          >
            <Gift size={20} color="#F97316" />
          </View>
          <Text
            className="text-base font-bold flex-1"
            style={{ color: colors.text }}
          >
            {t.weekly_challenges}
          </Text>
        </View>

        {challenges.slice(0, 3).map((challenge, index) => {
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
                  className="text-xs font-bold ml-2 px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isComplete ? '#22C55E20' : colors.textMuted + '15',
                    color: isComplete ? '#22C55E' : colors.textMuted
                  }}
                >
                  {currentCount}/{challenge.goalCount}
                </Text>
              </View>

              <View
                className="h-2.5 rounded-full overflow-hidden mb-2"
                style={{ backgroundColor: colors.textMuted + '15' }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isComplete ? '#22C55E' : colors.primary,
                  }}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Coins size={14} color={colors.primary} />
                  <Text
                    className="text-xs font-semibold ml-1"
                    style={{ color: colors.primary }}
                  >
                    +{challenge.rewardPoints}
                  </Text>
                </View>

                {isComplete && !isClaimed && (
                  <Pressable
                    onPress={() => claimMutation.mutate({ challengeId: challenge.id })}
                    disabled={claimMutation.isPending}
                    className="px-4 py-1.5 rounded-lg"
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
      </View>
    </Animated.View>
  );
}

// Promo Code Card Component
function PromoCodeCard({
  colors,
  language,
  userId,
  onSuccess,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  onSuccess: (points: number) => void;
}) {
  const [code, setCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim() || isRedeeming) return;

    setIsRedeeming(true);
    setMessage(null);

    try {
      const result = await gamificationApi.redeemPromoCode(userId, code.trim());

      if (result.success && result.pointsAwarded) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage({
          type: 'success',
          text: `${language === 'es' ? 'Codigo aplicado' : 'Code applied'}: +${result.pointsAwarded} ${language === 'es' ? 'puntos' : 'points'}`,
        });
        setCode('');
        onSuccess(result.pointsAwarded);
        // Close card after success
        setTimeout(() => {
          setIsExpanded(false);
          setMessage(null);
        }, 2000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        let errorText = result.error || (language === 'es' ? 'Error al canjear' : 'Redemption error');
        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessage({
        type: 'error',
        text: language === 'es' ? 'Error de conexion' : 'Connection error',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setIsExpanded(!isExpanded);
          setMessage(null);
        }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Ticket size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold"
              style={{ color: colors.text }}
            >
              {language === 'es' ? 'Canjear Codigo' : 'Redeem Code'}
            </Text>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
            >
              {language === 'es' ? 'Ingresa tu codigo promocional' : 'Enter your promo code'}
            </Text>
          </View>
          <View
            style={{
              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
            }}
          >
            <ChevronRight size={20} color={colors.textMuted} />
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{ paddingHorizontal: 20, paddingBottom: 20 }}
        >
          {/* Input Field */}
          <View
            className="flex-row items-center rounded-xl overflow-hidden mb-3"
            style={{ backgroundColor: colors.background }}
          >
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={language === 'es' ? 'Codigo...' : 'Code...'}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
                fontWeight: '600',
              }}
              editable={!isRedeeming}
            />
            <Pressable
              onPress={handleRedeem}
              disabled={!code.trim() || isRedeeming}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: code.trim() && !isRedeeming ? colors.primary : colors.textMuted + '30',
              }}
            >
              {isRedeeming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: code.trim() ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {language === 'es' ? 'Canjear' : 'Redeem'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Message */}
          {message && (
            <Animated.View
              entering={FadeIn.duration(150)}
              className="flex-row items-center rounded-lg px-4 py-3"
              style={{
                backgroundColor: message.type === 'success' ? '#22C55E20' : '#EF444420',
              }}
            >
              {message.type === 'success' ? (
                <Check size={16} color="#22C55E" strokeWidth={3} />
              ) : (
                <X size={16} color="#EF4444" strokeWidth={3} />
              )}
              <Text
                className="text-sm font-medium ml-2 flex-1"
                style={{ color: message.type === 'success' ? '#22C55E' : '#EF4444' }}
              >
                {message.text}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
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
        className="items-center mr-3"
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

// Item Detail Modal
function ItemDetailModal({
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
  } | null;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  onEquip: () => void;
  isPurchasing: boolean;
}) {
  const t = TRANSLATIONS[language];
  if (!item) return null;

  const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const displayName = language === 'es' ? item.nameEs : item.name;
  const displayDesc = language === 'es' ? item.descriptionEs : item.description;

  // Render preview based on type
  const renderPreview = () => {
    if (item.type === 'avatar' && item.emoji) {
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
          <Text style={{ fontSize: 56 }}>{item.emoji}</Text>
        </View>
      );
    }

    if (item.type === 'frame' && item.color) {
      return (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 6,
            borderColor: item.color,
            shadowColor: item.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
          }}
        >
          <Text style={{ fontSize: 40 }}>🕊️</Text>
        </View>
      );
    }

    if (item.type === 'theme' && item.colors) {
      return (
        <View
          style={{
            width: 140,
            height: 100,
            borderRadius: 16,
            overflow: 'hidden',
            flexDirection: 'row',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          <View style={{ flex: 1, backgroundColor: item.colors.primary }} />
          <View style={{ flex: 1, backgroundColor: item.colors.secondary }} />
          <View style={{ flex: 1, backgroundColor: item.colors.accent }} />
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
            className="w-full rounded-3xl overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              maxWidth: 340,
              shadowColor: rarityColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
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

            {/* Header gradient */}
            <LinearGradient
              colors={RARITY_GRADIENTS[item.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
              style={{ paddingTop: 40, paddingBottom: 24, alignItems: 'center' }}
            >
              {renderPreview()}
            </LinearGradient>

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
                className="text-sm text-center mb-6"
                style={{ color: colors.textMuted }}
              >
                {displayDesc}
              </Text>

              {/* Action button */}
              {isEquipped ? (
                <View
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: '#22C55E20' }}
                >
                  <Check size={20} color="#22C55E" strokeWidth={3} />
                  <Text className="text-base font-semibold text-green-600 ml-2">
                    {t.equipped}
                  </Text>
                </View>
              ) : isOwned ? (
                <Pressable
                  onPress={onEquip}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-base font-semibold text-white">
                    {t.equip}
                  </Text>
                </Pressable>
              ) : item.price === 0 ? (
                <Pressable
                  onPress={onPurchase}
                  disabled={isPurchasing}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-base font-semibold text-white">
                      {language === 'es' ? 'Reclamar Gratis' : 'Claim Free'}
                    </Text>
                  )}
                </Pressable>
              ) : canAfford ? (
                <Pressable
                  onPress={onPurchase}
                  disabled={isPurchasing}
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Coins size={18} color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">
                        {item.price} {language === 'es' ? 'puntos' : 'points'}
                      </Text>
                    </>
                  )}
                </Pressable>
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
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Premium Theme Card with V2 enhanced preview
function PremiumThemeCard({
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
  const rarityColor = RARITY_COLORS[themeData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const isV2Theme = themeData.id.includes('_v2_') || themeData.id.includes('amanecer_dorado') || themeData.id.includes('noche_profunda') || themeData.id.includes('bosque_sereno') || themeData.id.includes('desierto_suave') || themeData.id.includes('promesa_violeta') || themeData.id.includes('cielo_gloria') || themeData.id.includes('mar_misericordia') || themeData.id.includes('fuego_espiritu') || themeData.id.includes('jardin_gracia') || themeData.id.includes('olivo_paz') || themeData.id.includes('trono_azul') || themeData.id.includes('lampara_encendida') || themeData.id.includes('pergamino_antiguo') || themeData.id.includes('luz_celestial');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { width: '48%', marginBottom: 14 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.3 : (themeData.rarity !== 'common' ? 0.15 : 0.08),
          shadowRadius: isEquipped ? 12 : 8,
          elevation: isEquipped ? 5 : 3,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        {/* Enhanced Color Preview with 5 swatches + sample text for V2 */}
        <View style={{ height: isV2Theme ? 90 : 72, backgroundColor: themeData.colors.background }}>
          {/* Color swatches row */}
          <View style={{ flexDirection: 'row', height: isV2Theme ? 50 : 72 }}>
            <View style={{ flex: 1, backgroundColor: themeData.colors.primary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.secondary }} />
            <View style={{ flex: 1, backgroundColor: themeData.colors.accent }} />
            {isV2Theme && (
              <>
                <View style={{ flex: 1, backgroundColor: themeData.colors.surface }} />
                <View style={{ flex: 1, backgroundColor: themeData.colors.text }} />
              </>
            )}
          </View>
          {/* Sample text preview for V2 themes */}
          {isV2Theme && (
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: themeData.colors.background,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: themeData.colors.text,
              }}>Aa</Text>
              <View style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: themeData.colors.primary + '20',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: themeData.colors.primary }}>V2</Text>
              </View>
            </View>
          )}
        </View>

        {/* Rarity glow overlay */}
        {themeData.rarity !== 'common' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: isV2Theme ? 90 : 72,
              borderBottomWidth: 2,
              borderBottomColor: rarityColor + '50',
            }}
          />
        )}

        {/* Lock Overlay */}
        {!canAfford && !isOwned && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isV2Theme ? 90 : 72,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}>
            <Lock size={24} color="#FFFFFF" />
          </View>
        )}

        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }}
              numberOfLines={1}
            >
              {language === 'es' ? themeData.nameEs : themeData.name}
            </Text>
            <RarityIcon rarity={themeData.rarity} size={14} />
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={13} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E', marginLeft: 4 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : themeData.price === 0 ? (
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={13} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 12, fontWeight: '700', marginLeft: 4, color: canAfford ? colors.primary : colors.textMuted }}
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

// Premium Frame Card
function PremiumFrameCard({
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
  const rarityColor = RARITY_COLORS[frameData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const gradientColors = RARITY_GRADIENTS[frameData.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : frameData.color,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 4 },
          shadowOpacity: isEquipped ? 0.35 : 0.2,
          shadowRadius: 10,
          elevation: isEquipped ? 5 : 3,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        <LinearGradient
          colors={gradientColors}
          style={{ padding: 14, alignItems: 'center' }}
        >
          {/* Frame Preview Circle */}
          <View style={{ position: 'relative', marginBottom: 10 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
                borderWidth: 5,
                borderColor: frameData.color,
                shadowColor: frameData.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 28 }}>🕊️</Text>
            </View>

            {/* Lock Overlay */}
            {!canAfford && !isOwned && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 36,
              }}>
                <Lock size={20} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text
              style={{ fontSize: 12, fontWeight: '700', color: colors.text, maxWidth: 70 }}
              numberOfLines={1}
            >
              {language === 'es' ? frameData.nameEs : frameData.name}
            </Text>
            <View style={{ marginLeft: 4 }}>
              <RarityIcon rarity={frameData.rarity} size={12} />
            </View>
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={11} color="#22C55E" strokeWidth={3} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#22C55E', marginLeft: 2 }}>
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
              {t.equip}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={11} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 11, fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {frameData.price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Premium Title Card
function PremiumTitleCard({
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
  const rarityColor = RARITY_COLORS[titleData.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="mb-3">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.25 : 0.12,
          shadowRadius: isEquipped ? 10 : 6,
          elevation: isEquipped ? 4 : 2,
          borderWidth: isEquipped ? 2 : 0,
          borderColor: colors.primary,
          opacity: !canAfford && !isOwned ? 0.7 : 1,
        }}
      >
        <LinearGradient
          colors={RARITY_GRADIENTS[titleData.rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: rarityColor + '25' }}
          >
            {!canAfford && !isOwned ? (
              <Lock size={22} color={colors.textMuted} />
            ) : (
              <Award size={22} color={rarityColor} />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text
                className="text-sm font-bold"
                style={{ color: colors.text }}
              >
                {language === 'es' ? titleData.nameEs : titleData.name}
              </Text>
              <View className="ml-2">
                <RarityBadge rarity={titleData.rarity} language={language} />
              </View>
            </View>
            <Text
              className="text-xs"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {language === 'es' ? titleData.descriptionEs : titleData.description}
            </Text>
          </View>

          {/* Price or Status */}
          {isEquipped ? (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: '#22C55E20' }}>
              <Check size={14} color="#22C55E" strokeWidth={3} />
              <Text className="text-xs font-semibold text-green-600 ml-1">
                {t.equipped}
              </Text>
            </View>
          ) : isOwned ? (
            <View
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                {t.equip}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: colors.primary + '15' }}>
              <Coins size={14} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                className="text-xs font-bold ml-1"
                style={{ color: canAfford ? colors.primary : colors.textMuted }}
              >
                {titleData.price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Premium Avatar Card with V2 enhanced styling
function PremiumAvatarCard({
  avatar,
  isOwned,
  isEquipped,
  canAfford,
  colors,
  language,
  onPress,
}: {
  avatar: typeof DEFAULT_AVATARS[number];
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
  const price = hasCost ? (avatar as { price: number }).price : 0;
  const rarity = avatar.rarity || 'common';
  const rarityColor = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const isV2Avatar = 'isV2' in avatar && (avatar as { isV2?: boolean }).isV2 === true;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          shadowColor: isEquipped ? colors.primary : rarityColor,
          shadowOffset: { width: 0, height: isEquipped ? 6 : 3 },
          shadowOpacity: isEquipped ? 0.35 : (isV2Avatar ? 0.25 : 0.15),
          shadowRadius: isV2Avatar ? 10 : 8,
          elevation: isEquipped ? 5 : (isV2Avatar ? 4 : 3),
          borderWidth: isEquipped ? 2 : (isV2Avatar ? 1 : 0),
          borderColor: isEquipped ? colors.primary : (isV2Avatar ? rarityColor + '40' : 'transparent'),
          opacity: !canAfford && !isOwned && hasCost ? 0.7 : 1,
        }}
      >
        <LinearGradient
          colors={isV2Avatar
            ? [rarityColor + '15', rarityColor + '08']
            : (RARITY_GRADIENTS[rarity as keyof typeof RARITY_GRADIENTS] || RARITY_GRADIENTS.common)
          }
          style={{ padding: 12, alignItems: 'center' }}
        >
          {/* V2 Badge */}
          {isV2Avatar && (
            <View style={{
              position: 'absolute',
              top: 6,
              right: 6,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: rarityColor + '20',
            }}>
              <Text style={{ fontSize: 8, fontWeight: '700', color: rarityColor }}>V2</Text>
            </View>
          )}

          {/* Avatar Emoji */}
          <View style={{ position: 'relative', marginBottom: 8 }}>
            <View
              style={{
                width: isV2Avatar ? 68 : 64,
                height: isV2Avatar ? 68 : 64,
                borderRadius: isV2Avatar ? 34 : 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isV2Avatar ? colors.surface : colors.primary + '15',
                borderWidth: isV2Avatar ? 3 : (rarity !== 'common' ? 2 : 0),
                borderColor: isV2Avatar ? rarityColor + '60' : rarityColor + '40',
                shadowColor: isV2Avatar ? rarityColor : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isV2Avatar ? 0.4 : 0,
                shadowRadius: isV2Avatar ? 8 : 0,
              }}
            >
              <Text style={{ fontSize: isV2Avatar ? 34 : 32 }}>{avatar.emoji}</Text>
            </View>

            {/* Rarity indicator */}
            {rarity !== 'common' && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: rarityColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <RarityIcon rarity={rarity} size={10} />
              </View>
            )}

            {/* Lock Overlay with blur effect for V2 */}
            {!canAfford && !isOwned && hasCost && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isV2Avatar ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.35)',
                borderRadius: isV2Avatar ? 34 : 32,
              }}>
                <Lock size={18} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text
            style={{ fontSize: 11, fontWeight: isV2Avatar ? '700' : '600', color: colors.text, textAlign: 'center', marginBottom: 4 }}
            numberOfLines={1}
          >
            {language === 'es' && avatar.nameEs ? avatar.nameEs : avatar.name}
          </Text>

          {/* Price or Status */}
          {isEquipped ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={10} color="#22C55E" strokeWidth={3} />
            </View>
          ) : !hasCost || isOwned ? (
            <Text style={{ fontSize: 10, color: '#22C55E', fontWeight: '600' }}>
              {language === 'es' ? 'Gratis' : 'Free'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coins size={10} color={canAfford ? colors.primary : colors.textMuted} />
              <Text
                style={{ fontSize: 10, fontWeight: '700', marginLeft: 3, color: canAfford ? colors.primary : colors.textMuted }}
              >
                {price}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Bundle Card with V2 support
function BundleCard({
  bundle,
  purchasedItems,
  points,
  colors,
  language,
  onPress,
  isPurchasing = false,
}: {
  bundle: typeof STORE_BUNDLES[string];
  purchasedItems: string[];
  points: number;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
  isPurchasing?: boolean;
}) {
  const scale = useSharedValue(1);
  const rarityColor = RARITY_COLORS[bundle.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const canAfford = points >= bundle.bundlePrice;
  const savings = bundle.originalPrice - bundle.bundlePrice;
  const isV2Bundle = 'isV2' in bundle && bundle.isV2 === true;

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

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={allOwned || isPurchasing || !canAfford}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: rarityColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
          opacity: allOwned ? 0.6 : 1,
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
                    <Text style={{ fontSize: 9, fontWeight: '700', color: rarityColor }}>V2</Text>
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
                    <Text style={{ fontSize: 22 }}>{preview.emoji}</Text>
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
            ) : canAfford ? (
              <View
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: isPurchasing ? colors.primary + '80' : colors.primary }}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    {language === 'es' ? 'Comprar' : 'Buy'}
                  </Text>
                )}
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

// Collection Card with V2 support
function CollectionCard({
  collection,
  purchasedItems,
  colors,
  language,
  onPress,
}: {
  collection: typeof ITEM_COLLECTIONS[string];
  purchasedItems: string[];
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const isV2Collection = 'isV2' in collection && collection.isV2 === true;

  // Calculate owned items
  const ownedCount = collection.items.filter(itemId => {
    // Check if item is owned (either purchased or free)
    if (purchasedItems.includes(itemId)) return true;
    // Check if it's a free avatar
    const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
    if (avatar && !('price' in avatar)) return true;
    return false;
  }).length;

  const totalCount = collection.items.length;
  const isComplete = ownedCount === totalCount;
  const progressPercent = (ownedCount / totalCount) * 100;

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
          shadowColor: isComplete ? '#22C55E' : '#000',
          shadowOffset: { width: 0, height: isComplete ? 4 : 2 },
          shadowOpacity: isComplete ? 0.2 : 0.08,
          shadowRadius: isComplete ? 12 : 6,
          elevation: isComplete ? 4 : 2,
          borderWidth: isComplete ? 2 : 0,
          borderColor: '#22C55E',
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: isComplete ? '#22C55E20' : (isV2Collection ? colors.primary + '20' : colors.primary + '15') }}
            >
              <Text style={{ fontSize: 24 }}>{collection.icon}</Text>
            </View>
            <View className="flex-1">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  {language === 'es' ? collection.nameEs : collection.name}
                </Text>
                {isV2Collection && (
                  <View style={{
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: colors.primary + '20',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary }}>V2</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-xs"
                style={{ color: colors.textMuted }}
              >
                {language === 'es' ? collection.descriptionEs : collection.description}
              </Text>
            </View>
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: isComplete ? '#22C55E20' : colors.textMuted + '15' }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isComplete ? '#22C55E' : colors.textMuted }}
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
                backgroundColor: isComplete ? '#22C55E' : colors.primary,
              }}
            />
          </View>

          {/* Reward */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles size={14} color={isComplete ? '#22C55E' : colors.primary} />
              <Text
                className="text-xs font-semibold ml-1"
                style={{ color: isComplete ? '#22C55E' : colors.primary }}
              >
                {language === 'es' ? 'Premio' : 'Reward'}: +{collection.rewardPoints} {language === 'es' ? 'puntos' : 'points'}
              </Text>
            </View>

            {isComplete && (
              <View className="flex-row items-center px-3 py-1 rounded-lg" style={{ backgroundColor: '#22C55E20' }}>
                <Check size={12} color="#22C55E" strokeWidth={3} />
                <Text className="text-xs font-semibold text-green-600 ml-1">
                  {language === 'es' ? 'Completada' : 'Complete'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Points Animation Toast
function PointsToast({
  amount,
  visible,
  onHide,
  isPositive = false,
}: {
  amount: number;
  visible: boolean;
  onHide: () => void;
  isPositive?: boolean;
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
        className="px-5 py-3 rounded-full flex-row items-center"
        style={{ backgroundColor: isPositive ? '#22C55E' : '#EF4444' }}
      >
        <Sparkles size={18} color="#FFFFFF" />
        <Text className="text-white font-bold ml-2 text-base">
          {isPositive ? '+' : '-'}{amount} points
        </Text>
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
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [toastAmount, setToastAmount] = useState(0);
  const [toastPositive, setToastPositive] = useState(false);
  const [allChallengesComplete, setAllChallengesComplete] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [chestReward, setChestReward] = useState<{
    type: 'points' | 'item';
    value?: number;
    itemId?: string;
    itemName?: string;
    itemNameEs?: string;
    itemEmoji?: string;
    itemColor?: string;
    rarity: string;
  } | null>(null);

  // Item detail modal state
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
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
  } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const userId = user?.id || '';
  const purchasedItems = user?.purchasedItems ?? [];

  // State for synced backend user ID (might be different from local if user was created offline)
  const [syncedBackendUserId, setSyncedBackendUserId] = useState<string | null>(null);
  const effectiveUserId = syncedBackendUserId || userId;

  // Memoize user data for backend sync to avoid unnecessary re-fetches
  const userDataForSync = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      points: user.points,
      streakCurrent: user.streakCurrent,
      streakBest: user.streakBest,
      devotionalsCompleted: user.devotionalsCompleted,
      totalTime: user.totalTime,
    };
  }, [user?.id, user?.nickname, user?.avatar]);

  // Sync/create user in backend on mount
  const { data: backendUser, isLoading: isLoadingBackendUser } = useQuery({
    queryKey: ['backendUser', userDataForSync],
    queryFn: async () => {
      if (!userDataForSync) return null;
      // Try to ensure user exists in backend, creating if necessary
      const result = await gamificationApi.ensureUserExists(userDataForSync);
      return result;
    },
    enabled: !!userId && !!user?.nickname,
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Update local user with backend data if synced
  React.useEffect(() => {
    if (backendUser) {
      // If backend user has different ID, save it for API calls
      if (backendUser.id !== userId) {
        console.log('[Store] Backend user ID differs, using:', backendUser.id);
        setSyncedBackendUserId(backendUser.id);
        // Optionally update local user ID to match backend
        updateUser({ id: backendUser.id });
      }
      // Sync points from backend
      if (backendUser.points !== points) {
        updateUser({ points: backendUser.points });
      }
    }
  }, [backendUser?.id, backendUser?.points]);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      gamificationApi.purchaseItem(effectiveUserId, itemId),
    onSuccess: (data) => {
      if (data.success && data.newPoints !== undefined && selectedDetailItem) {
        updateUser({
          points: data.newPoints,
          purchasedItems: [...purchasedItems, selectedDetailItem.id],
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowDetailModal(false);
        setToastAmount(selectedDetailItem.price);
        setToastPositive(false);
        setShowPointsToast(true);
      }
    },
    onError: () => {
      // Fallback: use local store for purchase
      if (selectedDetailItem) {
        const localSuccess = useAppStore.getState().purchaseItem(selectedDetailItem.id, selectedDetailItem.price);
        if (localSuccess) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowDetailModal(false);
          setToastAmount(selectedDetailItem.price);
          setToastPositive(false);
          setShowPointsToast(true);
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
      type: 'theme' | 'frame' | 'title' | 'music' | 'avatar';
      itemId: string | null;
    }) => gamificationApi.equipItem(effectiveUserId, type, itemId),
    onSuccess: (data, variables) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updates: Partial<typeof user> = {};
      if (variables.type === 'frame') updates.frameId = variables.itemId;
      if (variables.type === 'title') updates.titleId = variables.itemId;
      if (variables.type === 'theme') updates.themeId = variables.itemId || undefined;
      if (variables.type === 'music') updates.selectedMusicId = variables.itemId || undefined;
      if (variables.type === 'avatar') updates.avatar = variables.itemId || undefined;
      updateUser(updates);
      setShowDetailModal(false);
    },
    onError: (_, variables) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updates: Partial<typeof user> = {};
      if (variables.type === 'frame') updates.frameId = variables.itemId;
      if (variables.type === 'title') updates.titleId = variables.itemId;
      if (variables.type === 'theme') updates.themeId = variables.itemId || undefined;
      if (variables.type === 'music') updates.selectedMusicId = variables.itemId || undefined;
      if (variables.type === 'avatar') updates.avatar = variables.itemId || undefined;
      updateUser(updates);
      setShowDetailModal(false);
    },
  });

  // Bundle purchase mutation
  const bundlePurchaseMutation = useMutation({
    mutationFn: ({ bundleId, itemIds, bundlePrice }: { bundleId: string; itemIds: string[]; bundlePrice: number }) =>
      gamificationApi.purchaseBundle(effectiveUserId, bundleId, itemIds, bundlePrice),
    onSuccess: (data) => {
      if (data.success && data.newPoints !== undefined && data.itemsAdded) {
        const newPurchasedItems = [...purchasedItems, ...data.itemsAdded.map(item => item.id)];
        updateUser({
          points: data.newPoints,
          purchasedItems: newPurchasedItems,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setToastAmount(points - data.newPoints);
        setToastPositive(false);
        setShowPointsToast(true);
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Handle item press - open detail modal
  const handleItemPress = useCallback((item: typeof selectedDetailItem) => {
    if (!item) return;
    setSelectedDetailItem(item);
    setShowDetailModal(true);
    Haptics.selectionAsync();
  }, []);

  // Destructure mutation functions for stable references (eslint requirement)
  const { mutate: purchaseMutate } = purchaseMutation;
  const { mutate: equipMutate } = equipMutation;
  const { mutate: bundlePurchaseMutate } = bundlePurchaseMutation;

  // Handle bundle purchase
  const handleBundlePurchase = useCallback((bundle: typeof STORE_BUNDLES[string]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    bundlePurchaseMutate({
      bundleId: bundle.id,
      itemIds: bundle.items,
      bundlePrice: bundle.bundlePrice,
    });
  }, [bundlePurchaseMutate]);

  // Handle purchase from modal
  const handlePurchase = useCallback(() => {
    if (!selectedDetailItem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    purchaseMutate({ itemId: selectedDetailItem.id });
  }, [selectedDetailItem, purchaseMutate]);

  // Handle equip from modal
  const handleEquip = useCallback(() => {
    if (!selectedDetailItem) return;

    equipMutate({
      type: selectedDetailItem.type as 'theme' | 'frame' | 'title' | 'music' | 'avatar',
      itemId: selectedDetailItem.id,
    });
  }, [selectedDetailItem, equipMutate]);

  // Handle weekly chest claim
  const handleChestClaim = useCallback(() => {
    // Deterministic reward based on week + userId
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const currentWeekId = `${now.getFullYear()}-W${weekNumber}`;

    // Weighted random selection
    const totalWeight = WEEKLY_CHEST_CONFIG.possibleRewards.reduce((sum, r) => sum + r.weight, 0);
    const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + weekNumber;
    // Use seeded value but pick from weighted pool
    let pick = (seed * 1664525 + 1013904223) % totalWeight;
    let reward = WEEKLY_CHEST_CONFIG.possibleRewards[0];
    for (const r of WEEKLY_CHEST_CONFIG.possibleRewards) {
      pick -= r.weight;
      if (pick <= 0) { reward = r; break; }
    }

    // Skip already-owned items - find next unowned one
    if (reward.type === 'item' && reward.itemId) {
      const itemRewards = WEEKLY_CHEST_CONFIG.possibleRewards.filter(
        r => r.type === 'item' && r.itemId && !purchasedItems.includes(r.itemId)
      );
      if (itemRewards.length > 0) {
        reward = itemRewards[seed % itemRewards.length];
      } else {
        // All items owned, give points instead
        reward = { type: 'points', value: 250, weight: 0, rarity: 'rare' };
      }
    }

    // Resolve item details for modal display
    let rewardInfo: typeof chestReward = null;
    if (reward.type === 'points' && 'value' in reward) {
      rewardInfo = { type: 'points', value: reward.value, rarity: reward.rarity };
      updateUser({ points: points + reward.value, lastWeeklyChestClaimed: currentWeekId });
    } else if (reward.type === 'item' && 'itemId' in reward && reward.itemId) {
      const itemId = reward.itemId;
      // Find item details from all catalogs
      let itemName = itemId;
      let itemNameEs = itemId;
      let itemEmoji: string | undefined;
      let itemColor: string | undefined;

      if (itemId.startsWith('avatar_')) {
        const av = DEFAULT_AVATARS.find(a => a.id === itemId);
        if (av) { itemName = av.name; itemNameEs = av.nameEs; itemEmoji = av.emoji; }
      } else if (itemId.startsWith('frame_')) {
        const fr = AVATAR_FRAMES[itemId];
        if (fr) { itemName = fr.name; itemNameEs = fr.nameEs; itemColor = fr.color; }
      } else if (itemId.startsWith('title_')) {
        const ti = SPIRITUAL_TITLES[itemId];
        if (ti) { itemName = ti.name; itemNameEs = ti.nameEs; }
      } else if (itemId.startsWith('theme_')) {
        const th = PURCHASABLE_THEMES[itemId];
        if (th) { itemName = th.name; itemNameEs = th.nameEs; itemColor = th.colors.primary; }
      }

      rewardInfo = {
        type: 'item',
        itemId,
        itemName,
        itemNameEs,
        itemEmoji,
        itemColor,
        rarity: reward.rarity,
      };
      updateUser({ purchasedItems: [...purchasedItems, itemId], lastWeeklyChestClaimed: currentWeekId });
    }

    setChestReward(rewardInfo);
    setShowChestModal(true);
  }, [userId, points, purchasedItems, updateUser, chestReward]);

  // Check item ownership and equipped status
  const getItemStatus = useCallback((itemId: string, type: string, price: number) => {
    let isOwned = purchasedItems.includes(itemId) || price === 0;
    if (type === 'avatar') {
      const avatar = DEFAULT_AVATARS.find(a => a.id === itemId);
      isOwned = isOwned || Boolean(avatar && !('price' in avatar));
    }

    let isEquipped = false;
    if (type === 'theme') isEquipped = user?.themeId === itemId;
    if (type === 'frame') isEquipped = user?.frameId === itemId;
    if (type === 'title') isEquipped = user?.titleId === itemId;
    if (type === 'avatar') isEquipped = user?.avatar === itemId;

    const canAfford = points >= price;

    return { isOwned, isEquipped, canAfford };
  }, [purchasedItems, user, points]);

  // Render category content
  const renderCategoryContent = () => {
    const screenWidth = Dimensions.get('window').width;

    switch (activeCategory) {
      case 'themes':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'flex-start' }}>
            {Object.values(PURCHASABLE_THEMES).map((theme, index) => {
              const { isOwned, isEquipped, canAfford } = getItemStatus(theme.id, 'theme', theme.price ?? 0);

              return (
                <Animated.View
                  key={theme.id}
                  entering={FadeInRight.delay(index * 50).duration(300)}
                  style={{ width: '48%' }}
                >
                  <PremiumThemeCard
                    themeData={theme}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() => handleItemPress({
                      id: theme.id,
                      type: 'theme',
                      name: theme.name,
                      nameEs: theme.nameEs,
                      description: theme.description,
                      descriptionEs: theme.descriptionEs,
                      price: theme.price ?? 0,
                      rarity: theme.rarity,
                      colors: theme.colors,
                    })}
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'frames': {
        const horizontalPadding = 40;
        const gap = 12;
        const numColumns = 3;
        const itemWidth = (screenWidth - horizontalPadding - (gap * (numColumns - 1))) / numColumns;

        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: gap, alignItems: 'flex-start' }}>
            {Object.values(AVATAR_FRAMES).map((frame, index) => {
              const { isOwned, isEquipped, canAfford } = getItemStatus(frame.id, 'frame', frame.price ?? 0);

              return (
                <Animated.View
                  key={frame.id}
                  entering={FadeInRight.delay(index * 40).duration(300)}
                  style={{ width: itemWidth }}
                >
                  <PremiumFrameCard
                    frameData={frame}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() => handleItemPress({
                      id: frame.id,
                      type: 'frame',
                      name: frame.name,
                      nameEs: frame.nameEs,
                      description: frame.description,
                      descriptionEs: frame.descriptionEs,
                      price: frame.price ?? 0,
                      rarity: frame.rarity,
                      color: frame.color,
                    })}
                  />
                </Animated.View>
              );
            })}
          </View>
        );
      }

      case 'titles':
        return (
          <View className="px-5">
            {Object.values(SPIRITUAL_TITLES).map((title, index) => {
              const { isOwned, isEquipped, canAfford } = getItemStatus(title.id, 'title', title.price ?? 0);

              return (
                <Animated.View
                  key={title.id}
                  entering={FadeInDown.delay(index * 40).duration(300)}
                >
                  <PremiumTitleCard
                    titleData={title}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() => handleItemPress({
                      id: title.id,
                      type: 'title',
                      name: title.name,
                      nameEs: title.nameEs,
                      description: title.description,
                      descriptionEs: title.descriptionEs,
                      price: title.price ?? 0,
                      rarity: title.rarity,
                    })}
                  />
                </Animated.View>
              );
            })}
          </View>
        );

      case 'avatars': {
        const horizontalPadding = 40;
        const gap = 12;
        const numColumns = 3;
        const itemWidth = (screenWidth - horizontalPadding - (gap * (numColumns - 1))) / numColumns;

        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: gap, alignItems: 'flex-start' }}>
            {DEFAULT_AVATARS.map((avatar, index) => {
              const hasCost = 'price' in avatar && (avatar as { price: number }).price > 0;
              const price = hasCost ? (avatar as { price: number }).price : 0;
              const { isOwned, isEquipped, canAfford } = getItemStatus(avatar.id, 'avatar', price);

              return (
                <Animated.View
                  key={avatar.id}
                  entering={FadeInRight.delay(index * 35).duration(300)}
                  style={{ width: itemWidth }}
                >
                  <PremiumAvatarCard
                    avatar={avatar}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                    colors={colors}
                    language={language}
                    onPress={() => handleItemPress({
                      id: avatar.id,
                      type: 'avatar',
                      name: avatar.name,
                      nameEs: avatar.nameEs,
                      description: avatar.description,
                      descriptionEs: avatar.descriptionEs,
                      price: price,
                      rarity: avatar.rarity,
                      emoji: avatar.emoji,
                    })}
                  />
                </Animated.View>
              );
            })}
          </View>
        );
      }

      case 'bundles':
        return (
          <View className="px-5">
            {Object.values(STORE_BUNDLES).map((bundle, index) => (
              <Animated.View
                key={bundle.id}
                entering={FadeInDown.delay(index * 60).duration(400)}
              >
                <BundleCard
                  bundle={bundle}
                  purchasedItems={purchasedItems}
                  points={points}
                  colors={colors}
                  language={language}
                  onPress={() => handleBundlePurchase(bundle)}
                  isPurchasing={bundlePurchaseMutation.isPending}
                />
              </Animated.View>
            ))}
          </View>
        );

      case 'collections':
        return (
          <View className="px-5">
            {Object.values(ITEM_COLLECTIONS).map((collection, index) => (
              <Animated.View
                key={collection.id}
                entering={FadeInDown.delay(index * 60).duration(400)}
              >
                <CollectionCard
                  collection={collection}
                  purchasedItems={purchasedItems}
                  colors={colors}
                  language={language}
                  onPress={() => {
                    Haptics.selectionAsync();
                  }}
                />
              </Animated.View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  // Get modal item status
  const modalItemStatus = useMemo(() => {
    if (!selectedDetailItem) return { isOwned: false, isEquipped: false, canAfford: false };
    return getItemStatus(selectedDetailItem.id, selectedDetailItem.type, selectedDetailItem.price);
  }, [selectedDetailItem, getItemStatus]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <PointsToast
        amount={toastAmount}
        visible={showPointsToast}
        onHide={() => setShowPointsToast(false)}
        isPositive={toastPositive}
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

        {/* Weekly Chest */}
        {effectiveUserId && (
          <WeeklyChestCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            allChallengesComplete={allChallengesComplete}
            onClaim={handleChestClaim}
          />
        )}

        {/* Weekly Challenges */}
        {effectiveUserId && (
          <WeeklyChallengesCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            onAllComplete={setAllChallengesComplete}
          />
        )}

        {/* Promo Code Redemption */}
        {effectiveUserId && (
          <PromoCodeCard
            colors={colors}
            language={language}
            userId={effectiveUserId}
            onSuccess={(pointsAwarded) => {
              updateUser({ points: points + pointsAwarded });
              setToastAmount(pointsAwarded);
              setToastPositive(true);
              setShowPointsToast(true);
            }}
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

      {/* Item Detail Modal */}
      <ItemDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        item={selectedDetailItem}
        colors={colors}
        language={language}
        isOwned={modalItemStatus.isOwned}
        isEquipped={modalItemStatus.isEquipped}
        canAfford={modalItemStatus.canAfford}
        onPurchase={handlePurchase}
        onEquip={handleEquip}
        isPurchasing={purchaseMutation.isPending}
      />

      {/* Chest Reward Modal */}
      <ChestRewardModal
        visible={showChestModal}
        reward={chestReward}
        language={language}
        colors={colors}
        onClose={() => setShowChestModal(false)}
      />
    </View>
  );
}
