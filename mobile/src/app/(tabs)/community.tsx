// Community Screen - Respectful, non-competitive community progress display

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  AppState,
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
  Sparkles,
  WifiOff,
  Shield,
  Coins,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { TRANSLATIONS, DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES } from '@/lib/constants';
import { gamificationApi, CommunityMember } from '@/lib/gamification-api';
import { getCountryByCode } from '@/components/CountryPicker';
import { BadgeChip } from '@/components/BadgeChip';

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
        <Text style={{ fontSize: 15 }}>{alreadySupported ? '🙏✨' : '🙏'}</Text>
        {supportCount > 0 && (
          <Text
            style={{
              fontSize: 11,
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
}: {
  member: CommunityMember;
  isCurrentUser: boolean;
  index: number;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
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
      <View
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
              <Text style={{ fontSize: 11, lineHeight: 16 }}>
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
              style={{ fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1 }}
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
                <Text style={{ fontSize: 10, fontWeight: '600', color: chipColor }}>
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
                  fontSize: 11,
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
                <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textMuted }}>{member.devotionalsCompleted}</Text>
              </View>
              {member.streakCurrent > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Flame size={11} color={colors.accent} />
                  <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textMuted }}>{member.streakCurrent}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: badge + points stacked */}
        <View style={{ flexShrink: 0, alignItems: 'flex-end', marginLeft: 8, gap: 4 }}>
          {member.activeBadgeId && (
            <BadgeChip badgeId={member.activeBadgeId} variant="community" />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Coins size={11} color={colors.primary} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>
              {member.points.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
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
  memberCount,
  lastUpdated,
  isRefreshing,
  isOffline,
  language,
}: {
  memberCount: number;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  isOffline: boolean;
  language: string;
}) {
  const colors = useThemeColors();
  const t = TRANSLATIONS[language as 'en' | 'es'];

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
    <Animated.View entering={FadeInDown.duration(400)} className="mx-5 mb-4">
      <LinearGradient
        colors={[colors.primary + '15', colors.secondary + '10', colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
        }}
      >
        <View className="flex-row items-center mb-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Heart size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text }}
            >
              {t.community_subtitle}
            </Text>
            <Text className="text-sm" style={{ color: colors.textMuted }}>
              {t.community_god_works}
            </Text>
          </View>
        </View>

        {memberCount > 0 && (
          <View
            className="flex-row items-center justify-center py-2 rounded-xl"
            style={{ backgroundColor: colors.primary + '10' }}
          >
            <Sparkles size={16} color={colors.primary} />
            <Text
              className="text-sm font-medium ml-2"
              style={{ color: colors.primary }}
            >
              {memberCount} {language === 'es' ? 'caminando juntos' : 'walking together'}
            </Text>
          </View>
        )}

        {/* Status row: offline warning or last updated */}
        {isOffline ? (
          <View className="flex-row items-center mt-2 px-1">
            <WifiOff size={13} color={colors.textMuted} />
            <Text className="text-xs ml-1.5" style={{ color: colors.textMuted }}>
              {language === 'es'
                ? 'Sin conexión, actualizaremos cuando regreses a internet.'
                : 'No connection, will update when back online.'}
            </Text>
          </View>
        ) : updateLabel ? (
          <Text className="text-xs mt-2 text-center" style={{ color: colors.textMuted }}>
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
  const user = useUser();
  const queryClient = useQueryClient();
  const t = TRANSLATIONS[language];

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const syncedRef = useRef(false);

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

      // If the backend assigned a different ID, update local store
      const effectiveId = backendUser.id;
      if (effectiveId !== user.id) {
        useAppStore.getState().updateUser({ id: effectiveId });
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
      });

      const updateUser = useAppStore.getState().updateUser;
      const updates: Record<string, number> = {};

      if (syncedUser.points > user.points) updates.points = syncedUser.points;
      if (syncedUser.streakCurrent > user.streakCurrent) updates.streakCurrent = syncedUser.streakCurrent;
      if (syncedUser.streakBest > user.streakBest) updates.streakBest = syncedUser.streakBest;
      if (syncedUser.devotionalsCompleted > user.devotionalsCompleted) updates.devotionalsCompleted = syncedUser.devotionalsCompleted;
      if (syncedUser.totalTimeSeconds > user.totalTime) updates.totalTime = syncedUser.totalTimeSeconds;

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

  // Revalidate on screen focus
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    }, [queryClient])
  );

  // Also revalidate when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        queryClient.invalidateQueries({ queryKey: ['community-members'] });
      }
    });
    return () => sub.remove();
  }, [queryClient]);

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
    staleTime: 60000, // 1 minute cache
    retry: 2,
  });

  const members = data?.members ?? [];

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
  });

  // Merge server support status with local optimistic updates
  const getSupportState = useCallback((memberId: string, serverCount: number): { count: number; supported: boolean } => {
    const local = localSupport[memberId];
    if (local !== undefined) return local;
    const serverSupported = supportStatusData?.status?.[memberId] ?? false;
    return { count: serverCount, supported: serverSupported };
  }, [localSupport, supportStatusData]);

  // Send support mutation
  const { mutate: mutateSendSupport } = useMutation({
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
  }, [user?.id, getSupportState, members, mutateSendSupport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSupport({}); // reset optimistic on refresh
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
        />
      );
    },
    [user?.id, getSupportState, handleSupport]
  );

  const keyExtractor = useCallback((item: CommunityMember) => item.id, []);

  const ListHeader = useCallback(
    () => (
      <CommunityHeader
        memberCount={total}
        lastUpdated={lastUpdated}
        isRefreshing={isFetching && !refreshing}
        isOffline={isOffline}
        language={language}
      />
    ),
    [total, lastUpdated, isFetching, refreshing, isOffline, language]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-5 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text
          className="text-3xl font-bold"
          style={{ color: colors.text }}
        >
          {t.community_title}
        </Text>
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
    </View>
  );
}
