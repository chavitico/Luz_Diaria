// Community Screen - Respectful, non-competitive community progress display

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  BookOpen,
  Flame,
  Heart,
  Sparkles,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { TRANSLATIONS, DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES } from '@/lib/constants';
import { gamificationApi, CommunityMember } from '@/lib/gamification-api';

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

// Community Member Card
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

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      className="mx-5 mb-3"
    >
      <Pressable
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: isCurrentUser ? colors.primary + '08' : colors.surface,
          borderWidth: isCurrentUser ? 2 : 0,
          borderColor: isCurrentUser ? colors.primary + '40' : 'transparent',
        }}
      >
        <View className="flex-row items-center p-4">
          {/* Avatar */}
          <AvatarWithFrame
            avatarId={member.avatarId}
            frameId={member.frameId}
            size={56}
          />

          {/* User Info */}
          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {member.nickname}
              </Text>
              {isCurrentUser && (
                <View
                  className="ml-2 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.primary + '20' }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: colors.primary }}
                  >
                    {t.community_you}
                  </Text>
                </View>
              )}
            </View>
            {titleDisplay && (
              <Text
                className="text-sm mt-0.5"
                style={{ color: colors.secondary }}
                numberOfLines={1}
              >
                {titleDisplay}
              </Text>
            )}
          </View>

          {/* Stats */}
          <View className="items-end">
            <View className="flex-row items-center mb-1">
              <BookOpen size={14} color={colors.primary} />
              <Text
                className="text-sm font-medium ml-1"
                style={{ color: colors.text }}
              >
                {member.devotionalsCompleted}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Flame size={14} color={colors.accent} />
              <Text
                className="text-sm font-medium ml-1"
                style={{ color: colors.text }}
              >
                {member.streakCurrent}
              </Text>
            </View>
          </View>
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
function CommunityHeader({ memberCount }: { memberCount: number }) {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

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

  // Sync current user's data to backend before fetching community members
  useEffect(() => {
    const syncCurrentUser = async () => {
      if (!user?.id) return;

      console.log('[Community] Syncing user data:', {
        points: user.points,
        streakCurrent: user.streakCurrent,
        streakBest: user.streakBest,
        devotionalsCompleted: user.devotionalsCompleted,
      });

      try {
        await gamificationApi.syncUser(user.id, {
          points: user.points,
          streakCurrent: user.streakCurrent,
          streakBest: user.streakBest,
          devotionalsCompleted: user.devotionalsCompleted,
          totalTimeSeconds: user.totalTime,
          lastActiveAt: user.lastActiveDate ? new Date(user.lastActiveDate).toISOString() : undefined,
        });
        console.log('[Community] User data synced to backend successfully');
        // Refetch community members after sync
        queryClient.invalidateQueries({ queryKey: ['community-members'] });
      } catch (error) {
        console.error('[Community] Failed to sync user data:', error);
      }
    };

    syncCurrentUser();
  }, [user?.id, user?.points, user?.streakCurrent, user?.devotionalsCompleted, queryClient]);

  // Fetch community members
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['community-members'],
    queryFn: () => gamificationApi.getCommunityMembers(50, 0),
    staleTime: 60000, // 1 minute cache
    retry: 2,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const members = data?.members ?? [];
  const total = data?.total ?? 0;

  // Sort members to put current user first if they're in the list
  const sortedMembers = React.useMemo(() => {
    if (!user?.id) return members;

    const currentUserIndex = members.findIndex((m) => m.id === user.id);
    if (currentUserIndex === -1) return members;

    // Move current user to top
    const currentUserMember = members[currentUserIndex];
    const otherMembers = members.filter((m) => m.id !== user.id);
    return currentUserMember ? [currentUserMember, ...otherMembers] : members;
  }, [members, user?.id]);

  const renderItem = useCallback(
    ({ item, index }: { item: CommunityMember; index: number }) => (
      <MemberCard
        member={item}
        isCurrentUser={item.id === user?.id}
        index={index}
      />
    ),
    [user?.id]
  );

  const keyExtractor = useCallback((item: CommunityMember) => item.id, []);

  const ListHeader = useCallback(
    () => <CommunityHeader memberCount={total} />,
    [total]
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
      ) : error ? (
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
