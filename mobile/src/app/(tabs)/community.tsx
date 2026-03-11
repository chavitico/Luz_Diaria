// Community Screen - Respectful, non-competitive community progress display

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  BookOpen,
  Flame,
  Heart,
  WifiOff,
  Shield,
  Coins,
  ArrowLeftRight,
  Inbox,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import logger from '@/lib/logger';
import { useScaledFont } from '@/lib/textScale';
import { TRANSLATIONS, DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES } from '@/lib/constants';
import { gamificationApi, CommunityMember } from '@/lib/gamification-api';
import { getCountryByCode } from '@/components/CountryPicker';
import { BadgeChip } from '@/components/BadgeChip';
import { BadgeInfoModal } from '@/components/BadgeInfoModal';
import { CommunityGiftFlowModal } from '@/components/CommunityGiftFlowModal';
import { TradeFlowModal } from '@/components/TradeFlowModal';
import { TradeInboxModal } from '@/components/TradeInboxModal';

// Helper: is a member active today?
function isActiveToday(member: CommunityMember): boolean {
  if (!member.lastActiveAt) return false;
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = new Date(member.lastActiveAt).toISOString().slice(0, 10);
  return lastActive === today || member.streakCurrent > 0;
}

// Avatar with Frame component
function AvatarWithFrame({
  avatarId,
  frameId,
  size = 56,
}: {
  avatarId: string;
  frameId?: string | null;
  size?: number;
}) {
  const colors = useThemeColors();
  const avatar = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  const frameColor = frameId ? AVATAR_FRAMES[frameId]?.color : null;
  const emoji = avatar?.emoji ?? '😊';

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        borderWidth: frameColor ? 3 : 2,
        borderColor: frameColor || colors.primary + '30',
        backgroundColor: colors.primary + '10',
        shadowColor: frameColor || colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: frameColor ? 0.3 : 0,
        shadowRadius: 6,
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

// Inline prayer icon button (compact, no label)
function PrayerIconButton({
  supportCount,
  alreadySupported,
  onPress,
  isCurrentUser,
}: {
  supportCount: number;
  alreadySupported: boolean;
  onPress: () => void;
  isCurrentUser: boolean;
}) {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (alreadySupported || isCurrentUser) return;
    scale.value = withSequence(
      withTiming(1.4, { duration: 90 }),
      withSpring(1, { damping: 7, stiffness: 220 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const disabled = alreadySupported || isCurrentUser;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 14,
          backgroundColor: alreadySupported ? colors.primary + '18' : 'transparent',
          opacity: isCurrentUser ? 0.25 : 1,
        }}
      >
        <Text style={{ fontSize: sFont(15) }}>{alreadySupported ? '🙏✨' : '🙏'}</Text>
        {supportCount > 0 && (
          <Text
            style={{
              fontSize: sFont(11),
              fontWeight: '600',
              color: alreadySupported ? colors.primary : colors.textMuted,
              marginLeft: 3,
            }}
          >
            {supportCount}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Community Member Card — compact single-line row
function MemberCard({
  member,
  isCurrentUser,
  index,
  onBadgePress,
  onGiftPress,
  onTradePress,
}: {
  member: CommunityMember;
  isCurrentUser: boolean;
  index: number;
  onBadgePress?: (badgeId: string) => void;
  onGiftPress?: (member: CommunityMember) => void;
  onTradePress?: (member: CommunityMember) => void;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const t = TRANSLATIONS[language];

  const title = member.titleId ? SPIRITUAL_TITLES[member.titleId] : null;
  const titleDisplay = title
    ? language === 'es'
      ? title.nameEs
      : title.name
    : null;

  const chipLabel = member.isAdmin
    ? 'Admin'
    : isCurrentUser
    ? t.community_you
    : null;

  const chipBg = member.isAdmin ? colors.accent + '25' : colors.primary + '20';
  const chipColor = member.isAdmin ? colors.accent : colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(280)}
      style={{ marginHorizontal: 12, marginBottom: 6 }}
    >
      <Pressable
        onPress={() => {
          if (!isCurrentUser && onGiftPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onGiftPress(member);
          }
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 9,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: isCurrentUser ? colors.primary + '0A' : colors.surface,
          borderWidth: isCurrentUser ? 1.5 : 0,
          borderColor: isCurrentUser ? colors.primary + '35' : 'transparent',
        }}
      >
        {/* Avatar with optional country flag badge */}
        <View style={{ position: 'relative', marginRight: 10, flexShrink: 0 }}>
          <AvatarWithFrame
            avatarId={member.avatarId}
            frameId={member.frameId}
            size={36}
          />
          {member.showCountry && member.countryCode && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -4,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: 6,
                paddingHorizontal: 1,
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: sFont(11), lineHeight: 16 }}>
                {getCountryByCode(member.countryCode)?.flag ?? ''}
              </Text>
            </View>
          )}
        </View>

        {/* Name + title — takes all available horizontal space */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: nickname + chip (Admin / Tú) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 5 }}>
            <Text
              style={{ fontSize: sFont(14), fontWeight: '600', color: colors.text, flexShrink: 1 }}
              numberOfLines={1}
            >
              {member.nickname}
            </Text>
            {chipLabel && (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  backgroundColor: chipBg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {member.isAdmin && (
                  <Shield size={9} color={chipColor} style={{ marginRight: 2 }} />
                )}
                <Text style={{ fontSize: sFont(10), fontWeight: '600', color: chipColor }}>
                  {chipLabel}
                </Text>
              </View>
            )}
          </View>

          {/* Row 2: title (full, no truncation) + stats inline */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'nowrap', gap: 6 }}>
            {titleDisplay && (
              <Text
                style={{
                  fontSize: sFont(11),
                  fontWeight: '500',
                  color: colors.primary,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {titleDisplay}
              </Text>
            )}
            {/* Stats: only shown if there is room (they can shrink to nothing) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: titleDisplay ? 2 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <BookOpen size={11} color={colors.textMuted} />
                <Text style={{ fontSize: sFont(10), fontWeight: '500', color: colors.textMuted }}>{member.devotionalsCompleted}</Text>
              </View>
              {member.streakCurrent > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Flame size={11} color={colors.accent} />
                  <Text style={{ fontSize: sFont(10), fontWeight: '500', color: colors.textMuted }}>{member.streakCurrent}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: badge + points stacked */}
        <View style={{ flexShrink: 0, alignItems: 'flex-end', marginLeft: 8, gap: 4 }}>
          {member.activeBadgeId && (
            <Pressable
              onPress={() => {
                if (member.activeBadgeId) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onBadgePress?.(member.activeBadgeId);
                }
              }}
              hitSlop={8}
            >
              <BadgeChip badgeId={member.activeBadgeId} variant="community" />
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Coins size={11} color={colors.primary} />
            <Text style={{ fontSize: sFont(10), fontWeight: '600', color: colors.primary }}>
              {member.points.toLocaleString()}
            </Text>
          </View>
          {/* Trade button (other users only) */}
          {!isCurrentUser && onTradePress && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onTradePress(member);
              }}
              hitSlop={6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: colors.primary + '15',
                borderWidth: 1,
                borderColor: colors.primary + '30',
              }}
            >
              <ArrowLeftRight size={10} color={colors.primary} />
              <Text style={{ fontSize: sFont(10), fontWeight: '700', color: colors.primary }}>
                {language === 'es' ? 'Cambiar' : 'Trade'}
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Empty State Component
function EmptyState() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8 py-16"
    >
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        <Users size={48} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text
        className="text-lg font-medium text-center mb-2"
        style={{ color: colors.text }}
      >
        {t.community_empty}
      </Text>
      <Text
        className="text-sm text-center"
        style={{ color: colors.textMuted }}
      >
        {language === 'es'
          ? 'Activa la opcion en Ajustes para aparecer aqui.'
          : 'Enable the option in Settings to appear here.'}
      </Text>
    </Animated.View>
  );
}

// Header Component
function CommunityHeader({
  lastUpdated,
  isRefreshing,
  isOffline,
  language,
}: {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  isOffline: boolean;
  language: string;
}) {
  const colors = useThemeColors();
  const t = TRANSLATIONS[language as 'en' | 'es'];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['communityStats'],
    queryFn: () => gamificationApi.getCommunityStats(),
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Compact number formatter: 65149 → "65.1K", 7200 → "7.2K"
  const fmtCompact = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(n);
  };

  const cardDefs: {
    icon: string;
    label: string;
    value: string;
    accent: string;
    bg: string;
    border: string;
  }[] = [
    {
      icon: '👥',
      label: language === 'es' ? 'Registrados' : 'Registered',
      value: statsLoading ? '—' : fmtCompact(stats?.registeredUsers ?? 0),
      accent: '#34D399',
      bg: '#34D39912',
      border: '#34D39930',
    },
    {
      icon: '📖',
      label: language === 'es' ? 'Devocionales' : 'Devotionals',
      value: statsLoading ? '—' : fmtCompact(stats?.devotionalsCompletedTotal ?? 0),
      accent: '#FBBF24',
      bg: '#FBBF2412',
      border: '#FBBF2430',
    },
    {
      icon: '✨',
      label: language === 'es' ? 'Pts ganados' : 'Pts earned',
      value: statsLoading ? '—' : fmtCompact(stats?.pointsEarnedTotal ?? 0),
      accent: '#F97316',
      bg: '#F9731612',
      border: '#F9731630',
    },
    {
      icon: '🛍️',
      label: language === 'es' ? 'Pts gastados' : 'Pts spent',
      value: statsLoading ? '—' : fmtCompact(stats?.pointsSpentTotal ?? 0),
      accent: '#A78BFA',
      bg: '#A78BFA12',
      border: '#A78BFA30',
    },
  ];

  const pressScales = [useSharedValue(1), useSharedValue(1), useSharedValue(1), useSharedValue(1)];
  const pressStyles = [
    useAnimatedStyle(() => ({ transform: [{ scale: pressScales[0].value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: pressScales[1].value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: pressScales[2].value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: pressScales[3].value }] })),
  ];

  const getUpdateLabel = () => {
    if (isRefreshing) return language === 'es' ? 'Actualizando...' : 'Updating...';
    if (!lastUpdated) return null;
    const diffMs = Date.now() - lastUpdated.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return language === 'es' ? 'Actualizado ahora' : 'Updated just now';
    if (diffMin === 1) return language === 'es' ? 'Actualizado hace 1 min' : 'Updated 1 min ago';
    return language === 'es' ? `Actualizado hace ${diffMin} min` : `Updated ${diffMin} min ago`;
  };

  const updateLabel = getUpdateLabel();

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mb-4">
      <LinearGradient
        colors={[colors.primary + '18', colors.background, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 22,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.primary + '20',
        }}
      >
        {/* Title row */}
        <View className="flex-row items-center mb-4">
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Heart size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {t.community_subtitle}
            </Text>
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {t.community_god_works}
            </Text>
          </View>
        </View>

        {/* 2×2 metrics grid */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Column 1 */}
          <View style={{ flex: 1, gap: 8 }}>
            {[0, 2].map((i) => {
              const card = cardDefs[i];
              return (
                <Animated.View
                  key={i}
                  style={[
                    {
                      backgroundColor: card.bg,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: card.border,
                      padding: 12,
                      shadowColor: card.accent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                      elevation: 3,
                    },
                    pressStyles[i],
                  ]}
                >
                  {/* Icon container */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: card.accent + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{card.icon}</Text>
                  </View>
                  {/* Value */}
                  {statsLoading ? (
                    <View
                      style={{
                        height: 24,
                        width: 48,
                        borderRadius: 6,
                        backgroundColor: card.accent + '20',
                        marginBottom: 4,
                      }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: card.accent,
                        letterSpacing: -0.5,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {card.value}
                    </Text>
                  )}
                  {/* Label */}
                  <Text
                    style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}
                    numberOfLines={1}
                  >
                    {card.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          {/* Column 2 */}
          <View style={{ flex: 1, gap: 8 }}>
            {[1, 3].map((i) => {
              const card = cardDefs[i];
              return (
                <Animated.View
                  key={i}
                  style={[
                    {
                      backgroundColor: card.bg,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: card.border,
                      padding: 12,
                      shadowColor: card.accent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                      elevation: 3,
                    },
                    pressStyles[i],
                  ]}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: card.accent + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{card.icon}</Text>
                  </View>
                  {statsLoading ? (
                    <View
                      style={{
                        height: 24,
                        width: 48,
                        borderRadius: 6,
                        backgroundColor: card.accent + '20',
                        marginBottom: 4,
                      }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: card.accent,
                        letterSpacing: -0.5,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {card.value}
                    </Text>
                  )}
                  <Text
                    style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}
                    numberOfLines={1}
                  >
                    {card.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Status row */}
        {isOffline ? (
          <View className="flex-row items-center mt-3 px-1">
            <WifiOff size={12} color={colors.textMuted} />
            <Text className="text-xs ml-1.5" style={{ color: colors.textMuted }}>
              {language === 'es'
                ? 'Sin conexión, actualizaremos cuando regreses a internet.'
                : 'No connection, will update when back online.'}
            </Text>
          </View>
        ) : updateLabel ? (
          <Text className="text-xs mt-3 text-center" style={{ color: colors.textMuted + '99' }}>
            {updateLabel}
          </Text>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const user = useUser();
  const queryClient = useQueryClient();
  const t = TRANSLATIONS[language];

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const syncedRef = useRef(false);
  // Cooldown: prevent resume pipeline from running more than once every 10s
  const lastResumeRef = useRef<number>(0);

  const [giftTarget, setGiftTarget] = useState<CommunityMember | null>(null);
  const [showGiftFlow, setShowGiftFlow] = useState(false);

  const [tradeTarget, setTradeTarget] = useState<CommunityMember | null>(null);
  const [showTradeFlow, setShowTradeFlow] = useState(false);
  const [showTradeInbox, setShowTradeInbox] = useState(false);

  // Live pending incoming trade count — polled every 30s
  const { data: tradesData } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: () => gamificationApi.getTrades(user!.id),
    enabled: !!user?.id,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const pendingIncomingCount = (tradesData?.trades ?? []).filter(
    t => t.toUserId === user?.id && t.status === 'pending'
  ).length;

  // Badge info modal state
  const [badgeModalId, setBadgeModalId] = useState<string | null>(null);

  // Local optimistic support state: memberId → { count, supported }
  const [localSupport, setLocalSupport] = useState<Record<string, { count: number; supported: boolean }>>({});

  // Monitor network status
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const wasOffline = isOffline;
      const nowOffline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(nowOffline);
      // Back online → revalidate
      if (wasOffline && !nowOffline) {
        queryClient.invalidateQueries({ queryKey: ['community-members'] });
      }
    });
    return () => unsub();
  }, [isOffline, queryClient]);

  // Sync current user's data to backend before fetching community members
  const syncCurrentUser = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Ensure the user exists in the backend first (creates if needed, returns backend ID)
      const backendUser = await gamificationApi.ensureUserExists({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        points: user.points,
        streakCurrent: user.streakCurrent,
        streakBest: user.streakBest,
        devotionalsCompleted: user.devotionalsCompleted,
        totalTime: user.totalTime,
      });

      if (!backendUser) return;

      // Server is authoritative — grab updateUser once for this whole block
      const updateUser = useAppStore.getState().updateUser;

      // Correct local nickname immediately if server has a different (canonical) value
      const canonicalNickname = backendUser.nickname ?? user.nickname;
      if (backendUser.nickname && backendUser.nickname !== user.nickname) {
        if (__DEV__) console.log(`[Sync] Nickname corrected by server: "${user.nickname}" → "${backendUser.nickname}"`);
        updateUser({ nickname: backendUser.nickname });
      }

      // If the backend assigned a different ID, update local store
      const effectiveId = backendUser.id;
      if (effectiveId !== user.id) {
        updateUser({ id: effectiveId });
      }

      let lastActiveAt: string | undefined;
      if (user.lastActiveDate) {
        const date = new Date(user.lastActiveDate + 'T12:00:00');
        if (!isNaN(date.getTime())) {
          lastActiveAt = date.toISOString();
        }
      }

      const syncedUser = await gamificationApi.syncUser(effectiveId, {
        points: user.points,
        streakCurrent: user.streakCurrent,
        streakBest: user.streakBest,
        devotionalsCompleted: user.devotionalsCompleted,
        totalTimeSeconds: user.totalTime,
        lastActiveAt,
        // Sync cosmetic fields so community shows correct title/frame/avatar
        titleId: user.titleId ?? null,
        frameId: user.frameId ?? null,
        avatarId: user.avatar,
        // IMPORTANT: Only send nickname if backend already confirmed it as canonical.
        // Never push the local nickname to avoid overwriting the backend's authoritative value.
        // canonicalNickname comes from backendUser.nickname (server), not user.nickname (local).
        // Only include if backend returned a nickname (prevents sending stale local nickname).
        ...(backendUser.nickname ? { nickname: backendUser.nickname } : {}),
      });

      const updates: Record<string, unknown> = {};

      if (syncedUser.points > user.points) updates.points = syncedUser.points;
      if (syncedUser.streakCurrent > user.streakCurrent) updates.streakCurrent = syncedUser.streakCurrent;
      if (syncedUser.streakBest > user.streakBest) updates.streakBest = syncedUser.streakBest;
      if (syncedUser.devotionalsCompleted > user.devotionalsCompleted) updates.devotionalsCompleted = syncedUser.devotionalsCompleted;
      if (syncedUser.totalTimeSeconds > user.totalTime) updates.totalTime = syncedUser.totalTimeSeconds;
      // Always sync role from backend to keep admin access current
      if (syncedUser.role && syncedUser.role !== user.role) updates.role = syncedUser.role as 'USER' | 'MODERATOR' | 'OWNER';
      // Always trust server nickname — it may have been corrected by moderation
      if (syncedUser.nickname && syncedUser.nickname !== user.nickname) updates.nickname = syncedUser.nickname;

      if (Object.keys(updates).length > 0) {
        updateUser(updates);
      }

      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    } catch (error) {
      console.error('[Community] Failed to sync user data:', error);
    }
  }, [user?.id, user?.points, user?.streakCurrent, user?.devotionalsCompleted, queryClient]);

  // Initial sync (once per mount)
  useEffect(() => {
    if (!syncedRef.current) {
      syncedRef.current = true;
      syncCurrentUser();
    }
  }, [syncCurrentUser]);

  // --- Unified recovery pipeline (used by AppState resume AND refresh button) ---
  const onAppResume = useCallback(async () => {
    const now = Date.now();
    // Cooldown: ignore if called within 10s of last run
    if (now - lastResumeRef.current < 10_000) {
      logger.debug('[Community] onAppResume skipped — cooldown active');
      return;
    }
    lastResumeRef.current = now;

    logger.debug('[Community] onAppResume: starting recovery pipeline');
    setRefreshing(true);
    setLocalSupport({}); // clear optimistic state

    try {
      // 1. Re-sync user session (lightweight auth/stats check)
      logger.debug('[Community] Resume step 1: syncCurrentUser');
      await syncCurrentUser();
      // 2. Invalidate and refetch community data
      logger.debug('[Community] Resume step 2: invalidate queries');
      await queryClient.invalidateQueries({ queryKey: ['community-members'] });
      await queryClient.invalidateQueries({ queryKey: ['community-support-status'] });
      logger.debug('[Community] onAppResume: recovery complete');
    } catch (err) {
      logger.warn('[Community] onAppResume: recovery error', err);
    } finally {
      setRefreshing(false);
    }
  }, [syncCurrentUser, queryClient]);

  // Stable ref so the resume handler never needs to be re-registered
  const onAppResumeRef = useRef(onAppResume);
  useEffect(() => { onAppResumeRef.current = onAppResume; }, [onAppResume]);

  // Subscribe to resumeTick from the global store — _layout.tsx is the single AppState listener
  const resumeTick = useAppStore(s => s.resumeTick);
  useEffect(() => {
    if (resumeTick === 0) return; // skip initial mount
    logger.debug('[Community] resumeTick fired — triggering recovery');
    onAppResumeRef.current();
  }, [resumeTick]);

  // Revalidate on screen focus (lightweight — no syncCurrentUser, just invalidate)
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    }, [queryClient])
  );

  // Fetch community members
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['community-members'],
    queryFn: async () => {
      const result = await gamificationApi.getCommunityMembers(50, 0);
      setLastUpdated(new Date());
      return result;
    },
    staleTime: 30_000,      // 30s — stale faster so resume always refetches
    refetchOnMount: true,   // always refetch when screen mounts fresh
    retry: 1,
  });

  const members = data?.members ?? [];

  // Stuck-loading guard: if isLoading is stuck for >20s, force a refetch
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      if (__DEV__) console.warn('[Community] isLoading stuck >20s — forcing refetch');
      refetch();
    }, 20_000);
    return () => clearTimeout(timer);
  }, [isLoading, refetch]);

  // Fetch support status for all members once we have them
  const memberIds = members.map((m) => m.id);
  const { data: supportStatusData } = useQuery({
    queryKey: ['community-support-status', user?.id, memberIds],
    queryFn: async () => {
      if (!user?.id || !memberIds.length) return { status: {}, dateId: '' };
      return gamificationApi.getSupportStatus(user.id, memberIds);
    },
    enabled: !!user?.id && memberIds.length > 0,
    staleTime: 60000,
    retry: 1,
  });

  // Merge server support status with local optimistic updates
  const getSupportState = useCallback((memberId: string, serverCount: number): { count: number; supported: boolean } => {
    const local = localSupport[memberId];
    if (local !== undefined) return local;
    const serverSupported = supportStatusData?.status?.[memberId] ?? false;
    return { count: serverCount, supported: serverSupported };
  }, [localSupport, supportStatusData]);

  // Send support mutation
  const { mutate: mutateSendSupport, isPending: isSupportPending } = useMutation({
    mutationFn: ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) =>
      gamificationApi.sendSupport(fromUserId, toUserId),
    onSuccess: (result, variables) => {
      // Sync local state with server response
      setLocalSupport((prev) => ({
        ...prev,
        [variables.toUserId]: {
          count: result.supportCount,
          supported: true,
        },
      }));
    },
  });

  const handleSupport = useCallback((memberId: string) => {
    if (!user?.id) return;
    if (isSupportPending) return;
    const current = getSupportState(memberId, members.find((m) => m.id === memberId)?.supportCount ?? 0);
    if (current.supported) return;

    // Optimistic update
    setLocalSupport((prev) => ({
      ...prev,
      [memberId]: {
        count: current.count + 1,
        supported: true,
      },
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mutateSendSupport({ fromUserId: user.id, toUserId: memberId });
  }, [user?.id, isSupportPending, getSupportState, members, mutateSendSupport]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Bypass cooldown for manual refresh by resetting the timer
    lastResumeRef.current = 0;
    await onAppResume();
  }, [onAppResume]);

  const total = data?.total ?? 0;

  // Sort: Admin first → active today → rest; current user always at top within their tier
  const sortedMembers = React.useMemo(() => {
    if (!members.length) return members;

    const currentUserId = user?.id;
    const today = new Date().toISOString().slice(0, 10);

    const getTier = (m: CommunityMember): number => {
      if (m.isAdmin) return 0;
      if (m.id === currentUserId) return 1; // current user second only to admin
      // Active today: completed today OR streak>0 OR lastActive is today
      const lastActive = m.lastActiveAt
        ? new Date(m.lastActiveAt).toISOString().slice(0, 10)
        : null;
      const activeToday = lastActive === today || m.streakCurrent > 0;
      return activeToday ? 2 : 3;
    };

    return [...members].sort((a, b) => {
      const tierDiff = getTier(a) - getTier(b);
      if (tierDiff !== 0) return tierDiff;
      // Within same tier, sort by devotionalsCompleted desc as secondary
      return b.devotionalsCompleted - a.devotionalsCompleted;
    });
  }, [members, user?.id]);

  const renderItem = useCallback(
    ({ item, index }: { item: CommunityMember; index: number }) => {
      const { count, supported } = getSupportState(item.id, item.supportCount ?? 0);
      const memberWithCount = { ...item, supportCount: count };
      return (
        <MemberCard
          member={memberWithCount}
          isCurrentUser={item.id === user?.id}
          index={index}
          onBadgePress={(badgeId) => setBadgeModalId(badgeId)}
          onGiftPress={(member) => { setGiftTarget(member); setShowGiftFlow(true); }}
          onTradePress={(member) => { setTradeTarget(member); setShowTradeFlow(true); }}
        />
      );
    },
    [user?.id, getSupportState, handleSupport]
  );

  const keyExtractor = useCallback((item: CommunityMember) => item.id, []);

  const ListHeader = useCallback(
    () => (
      <CommunityHeader
        lastUpdated={lastUpdated}
        isRefreshing={isFetching && !refreshing}
        isOffline={isOffline}
        language={language}
      />
    ),
    [lastUpdated, isFetching, refreshing, isOffline, language]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-5 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            className="text-3xl font-bold"
            style={{ color: colors.text }}
          >
            {t.community_title}
          </Text>
          {/* Trade inbox button */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowTradeInbox(true); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 12, paddingVertical: 7,
              borderRadius: 12,
              backgroundColor: pendingIncomingCount > 0 ? colors.primary + '15' : colors.surface,
              borderWidth: 1,
              borderColor: pendingIncomingCount > 0 ? colors.primary + '50' : colors.textMuted + '25',
            }}
          >
            <View style={{ position: 'relative' }}>
              <Inbox size={15} color={colors.primary} />
              {pendingIncomingCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFF' }}>
                    {pendingIncomingCount > 9 ? '9+' : String(pendingIncomingCount)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
              {language === 'es' ? 'Trueques' : 'Trades'}
            </Text>
          </Pressable>
        </View>
        {/* [TEMP DEBUG] Identity source annotation */}
        <View style={{ marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          <Text style={{ fontSize: 9, color: colors.textMuted + '80', fontFamily: 'monospace' }}>
            active: <Text style={{ color: colors.primary + 'CC' }}>{user?.nickname ?? '?'}</Text>
            {' '}({user?.id ?? '?'})
          </Text>
          <Text style={{ fontSize: 9, color: colors.textMuted + '80', fontFamily: 'monospace' }}>
            · list: React Query [community-members] · {total} member{total !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && !isOffline ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-center" style={{ color: colors.textMuted }}>
            {language === 'es'
              ? 'Error al cargar la comunidad. Intenta de nuevo.'
              : 'Error loading community. Please try again.'}
          </Text>
          <Pressable
            onPress={onRefresh}
            className="mt-4 px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">
              {language === 'es' ? 'Reintentar' : 'Retry'}
            </Text>
          </Pressable>
        </View>
      ) : sortedMembers.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={sortedMembers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Badge info modal */}
      <BadgeInfoModal
        badgeId={badgeModalId}
        visible={!!badgeModalId}
        variant="community"
        onClose={() => setBadgeModalId(null)}
      />

      {/* Community gift flow modal */}
      <CommunityGiftFlowModal
        visible={showGiftFlow}
        recipient={giftTarget}
        onClose={() => setShowGiftFlow(false)}
      />

      {/* Trade flow modal */}
      <TradeFlowModal
        visible={showTradeFlow}
        recipient={tradeTarget}
        onClose={() => setShowTradeFlow(false)}
      />

      {/* Trade inbox modal */}
      <TradeInboxModal
        visible={showTradeInbox}
        onClose={() => setShowTradeInbox(false)}
      />
    </View>
  );
}
