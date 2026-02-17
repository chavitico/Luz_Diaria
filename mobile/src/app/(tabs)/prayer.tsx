// Prayer Screen - Community prayer requests and daily prayer
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  ChevronDown,
  Check,
  Clock,
  Users,
  Sparkles,
  HandHeart,
  Briefcase,
  BookOpen,
  Cloud,
  Compass,
  RefreshCw,
  Shield,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { TRANSLATIONS, PRAYER_CATEGORIES } from '@/lib/constants';
import { gamificationApi, PrayerRequestDisplay } from '@/lib/gamification-api';
import { DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES } from '@/lib/constants';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  work: Briefcase,
  health: Heart,
  family: Users,
  peace: Cloud,
  wisdom: Compass,
  studies: BookOpen,
  restoration: RefreshCw,
  gratitude: Sparkles,
  salvation: HandHeart,
  strength: Shield,
};

// Avatar with Frame component
function AvatarWithFrame({
  avatarId,
  frameId,
  size = 40,
}: {
  avatarId: string | null;
  frameId?: string | null;
  size?: number;
}) {
  const colors = useThemeColors();
  const avatar = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  const frameColor = frameId ? AVATAR_FRAMES[frameId]?.color : null;
  const emoji = avatar?.emoji ?? '🙏';

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        borderWidth: frameColor ? 2 : 1.5,
        borderColor: frameColor || colors.primary + '30',
        backgroundColor: colors.primary + '10',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

// Category Dropdown
function CategoryDropdown({
  selectedCategory,
  onSelect,
}: {
  selectedCategory: string | null;
  onSelect: (category: string) => void;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const [isOpen, setIsOpen] = useState(false);

  const selectedCat = PRAYER_CATEGORIES.find((c) => c.key === selectedCategory);
  const selectedLabel = selectedCat
    ? language === 'es' ? selectedCat.labelEs : selectedCat.labelEn
    : t.prayer_select_category;

  const IconComponent = selectedCategory ? CATEGORY_ICONS[selectedCategory] : Heart;

  return (
    <View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(!isOpen);
        }}
        className="flex-row items-center justify-between px-4 py-3 rounded-xl"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isOpen ? colors.primary : colors.primary + '20',
        }}
      >
        <View className="flex-row items-center flex-1">
          {IconComponent && <IconComponent size={20} color={colors.primary} />}
          <Text
            className="text-base ml-3 flex-1"
            style={{ color: selectedCategory ? colors.text : colors.textMuted }}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
        </View>
        <ChevronDown
          size={20}
          color={colors.textMuted}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(150)}
          className="mt-2 rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.primary + '20',
          }}
        >
          {PRAYER_CATEGORIES.map((cat, index) => {
            const CatIcon = CATEGORY_ICONS[cat.key] || Heart;
            const label = language === 'es' ? cat.labelEs : cat.labelEn;
            const isSelected = cat.key === selectedCategory;

            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(cat.key);
                  setIsOpen(false);
                }}
                className="flex-row items-center px-4 py-3"
                style={{
                  backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.primary + '10',
                }}
              >
                <CatIcon size={18} color={isSelected ? colors.primary : colors.textMuted} />
                <Text
                  className="text-base ml-3 flex-1"
                  style={{ color: isSelected ? colors.primary : colors.text }}
                >
                  {label}
                </Text>
                {isSelected && <Check size={18} color={colors.primary} />}
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// Mode Toggle
function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: 'daily' | 'weekly';
  onModeChange: (mode: 'daily' | 'weekly') => void;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <View
      className="flex-row rounded-xl p-1"
      style={{ backgroundColor: colors.surface }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onModeChange('daily');
        }}
        className="flex-1 py-2 rounded-lg items-center"
        style={{
          backgroundColor: mode === 'daily' ? colors.primary : 'transparent',
        }}
      >
        <Text
          className="text-sm font-medium"
          style={{ color: mode === 'daily' ? '#fff' : colors.textMuted }}
        >
          {t.prayer_mode_daily}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onModeChange('weekly');
        }}
        className="flex-1 py-2 rounded-lg items-center"
        style={{
          backgroundColor: mode === 'weekly' ? colors.primary : 'transparent',
        }}
      >
        <Text
          className="text-sm font-medium"
          style={{ color: mode === 'weekly' ? '#fff' : colors.textMuted }}
        >
          {t.prayer_mode_weekly}
        </Text>
      </Pressable>
    </View>
  );
}

// My Request Section
function MyRequestSection() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const user = useUser();
  const queryClient = useQueryClient();
  const addPoints = useAppStore((s) => s.addPoints);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');

  // Fetch user's active prayer requests
  const { data: requestsData } = useQuery({
    queryKey: ['user-prayer-requests', user?.id],
    queryFn: () => gamificationApi.getUserPrayerRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Find active request for current mode
  const activeRequest = useMemo(() => {
    if (!requestsData?.requests) return null;
    return requestsData.requests.find((r) => r.mode === mode);
  }, [requestsData, mode]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () =>
      gamificationApi.submitPrayerRequest(user!.id, selectedCategory!, mode),
    onSuccess: (data) => {
      if (data.pointsAwarded > 0) {
        addPoints(data.pointsAwarded);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ['user-prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['community-prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] });
      setSelectedCategory(null);
    },
  });

  const handleSubmit = () => {
    if (!selectedCategory || !user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitMutation.mutate();
  };

  // Format expiration date
  const formatExpiry = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString(language === 'es' ? 'es-CR' : 'en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="mx-5 mb-4">
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + '15',
        }}
      >
        <Text
          className="text-lg font-semibold mb-4"
          style={{ color: colors.text }}
        >
          {t.prayer_my_request}
        </Text>

        {/* Active Request Display */}
        {activeRequest && (
          <View
            className="mb-4 p-3 rounded-xl"
            style={{ backgroundColor: colors.primary + '10' }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                {t.prayer_current_request}
              </Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text className="text-xs" style={{ color: colors.primary }}>
                  {mode === 'daily' ? t.prayer_today_badge : t.prayer_week_badge}
                </Text>
              </View>
            </View>
            <Text className="text-base font-medium" style={{ color: colors.text }}>
              {PRAYER_CATEGORIES.find((c) => c.key === activeRequest.categoryKey)?.[
                language === 'es' ? 'labelEs' : 'labelEn'
              ]}
            </Text>
            <View className="flex-row items-center mt-2">
              <Clock size={14} color={colors.textMuted} />
              <Text className="text-xs ml-1" style={{ color: colors.textMuted }}>
                {t.prayer_expires}: {formatExpiry(activeRequest.expiresAt)}
              </Text>
            </View>
          </View>
        )}

        {/* Mode Toggle */}
        <View className="mb-4">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </View>

        {/* Category Dropdown */}
        <View className="mb-4">
          <CategoryDropdown
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!selectedCategory || submitMutation.isPending}
          className="py-3 rounded-xl items-center"
          style={{
            backgroundColor: selectedCategory ? colors.primary : colors.primary + '30',
            opacity: submitMutation.isPending ? 0.7 : 1,
          }}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {t.prayer_save}
            </Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Community Request Card
function RequestCard({ request, index }: { request: PrayerRequestDisplay; index: number }) {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

  const category = PRAYER_CATEGORIES.find((c) => c.key === request.categoryKey);
  const categoryLabel = category
    ? language === 'es' ? category.labelEs : category.labelEn
    : request.categoryKey;

  const IconComponent = CATEGORY_ICONS[request.categoryKey] || Heart;
  const displayName = request.displayNameOptIn && request.nickname
    ? request.nickname
    : t.prayer_anonymous;

  const title = request.titleId ? SPIRITUAL_TITLES[request.titleId] : null;
  const titleDisplay = title
    ? language === 'es' ? title.nameEs : title.name
    : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(200)}
      className="mb-3"
    >
      <View
        className="flex-row items-center p-3 rounded-xl"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + '10',
        }}
      >
        {/* Avatar */}
        <AvatarWithFrame
          avatarId={request.avatarId}
          frameId={request.frameId}
          size={44}
        />

        {/* Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text
              className="text-sm font-medium"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {titleDisplay && (
              <Text
                className="text-xs ml-2"
                style={{ color: colors.secondary }}
                numberOfLines={1}
              >
                {titleDisplay}
              </Text>
            )}
          </View>
          <View className="flex-row items-center mt-1">
            <IconComponent size={14} color={colors.primary} />
            <Text className="text-sm ml-1.5" style={{ color: colors.primary }}>
              {categoryLabel}
            </Text>
          </View>
        </View>

        {/* Mode Badge */}
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: colors.accent + '20' }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.accent }}>
            {request.mode === 'daily' ? t.prayer_today_badge : t.prayer_week_badge}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Summary Section
function SummarySection() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['prayer-summary'],
    queryFn: () => gamificationApi.getPrayerSummary(),
    staleTime: 60000,
  });

  if (isLoading || !summaryData?.summary) return null;

  const entries = Object.entries(summaryData.summary).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(400)} className="mx-5 mb-4">
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + '15',
        }}
      >
        <View className="flex-row items-center mb-3">
          <Sparkles size={18} color={colors.primary} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
            {t.prayer_summary}
          </Text>
          <Text className="text-sm ml-2" style={{ color: colors.textMuted }}>
            ({summaryData.total})
          </Text>
        </View>

        <View className="flex-row flex-wrap">
          {entries.map(([key, count]) => {
            const cat = PRAYER_CATEGORIES.find((c) => c.key === key);
            const label = cat
              ? language === 'es' ? cat.labelEs : cat.labelEn
              : key;
            const IconComponent = CATEGORY_ICONS[key] || Heart;

            return (
              <View
                key={key}
                className="flex-row items-center px-3 py-2 rounded-full mr-2 mb-2"
                style={{ backgroundColor: colors.primary + '10' }}
              >
                <IconComponent size={14} color={colors.primary} />
                <Text className="text-sm ml-1.5" style={{ color: colors.text }}>
                  {label}:
                </Text>
                <Text className="text-sm font-semibold ml-1" style={{ color: colors.primary }}>
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

// "I Prayed for the Community" Button
function PrayedForCommunityButton() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const user = useUser();
  const queryClient = useQueryClient();
  const addPoints = useAppStore((s) => s.addPoints);

  const { data: prayedData } = useQuery({
    queryKey: ['prayed-for-community', user?.id],
    queryFn: () => gamificationApi.checkPrayedForCommunity(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const prayedMutation = useMutation({
    mutationFn: () => gamificationApi.prayedForCommunity(user!.id),
    onSuccess: (data) => {
      if (data.pointsAwarded > 0) {
        addPoints(data.pointsAwarded);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ['prayed-for-community'] });
    },
  });

  const hasPrayed = prayedData?.prayedToday;

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(400)} className="mx-5 mb-4">
      <Pressable
        onPress={() => {
          if (!hasPrayed && user?.id) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            prayedMutation.mutate();
          }
        }}
        disabled={hasPrayed || prayedMutation.isPending}
        className="flex-row items-center justify-center py-4 rounded-2xl"
        style={{
          backgroundColor: hasPrayed ? colors.primary + '10' : colors.primary,
          borderWidth: hasPrayed ? 1 : 0,
          borderColor: colors.primary + '30',
        }}
      >
        {prayedMutation.isPending ? (
          <ActivityIndicator size="small" color={hasPrayed ? colors.primary : '#fff'} />
        ) : (
          <>
            <HandHeart
              size={22}
              color={hasPrayed ? colors.primary : '#fff'}
            />
            <Text
              className="text-base font-semibold ml-2"
              style={{ color: hasPrayed ? colors.primary : '#fff' }}
            >
              {hasPrayed ? t.prayer_prayed_today : t.prayer_prayed_for_community}
            </Text>
            {hasPrayed && (
              <Check size={18} color={colors.primary} className="ml-2" />
            )}
          </>
        )}
      </Pressable>
      {!hasPrayed && (
        <Text className="text-xs text-center mt-2" style={{ color: colors.textMuted }}>
          +5 {language === 'es' ? 'puntos' : 'points'}
        </Text>
      )}
    </Animated.View>
  );
}

// Community Requests Section
function CommunityRequestsSection() {
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];

  const { data, isLoading } = useQuery({
    queryKey: ['community-prayer-requests'],
    queryFn: () => gamificationApi.getCommunityPrayerRequests(50, 0),
    staleTime: 60000,
  });

  const requests = data?.requests ?? [];

  return (
    <Animated.View entering={FadeInUp.delay(100).duration(400)} className="mx-5 mb-4">
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + '15',
        }}
      >
        <View className="flex-row items-center mb-4">
          <Users size={18} color={colors.primary} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
            {t.prayer_community_requests}
          </Text>
          {data?.total && (
            <Text className="text-sm ml-2" style={{ color: colors.textMuted }}>
              ({data.total})
            </Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : requests.length === 0 ? (
          <Text className="text-sm text-center py-4" style={{ color: colors.textMuted }}>
            {t.prayer_community_empty}
          </Text>
        ) : (
          <View>
            {requests.slice(0, 10).map((request, index) => (
              <RequestCard key={request.id} request={request} index={index} />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function PrayerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-prayer-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['community-prayer-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['prayed-for-community'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          {t.prayer_title}
        </Text>
        <Text className="text-base mt-1" style={{ color: colors.textMuted }}>
          {t.prayer_subtitle}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* My Request */}
        <MyRequestSection />

        {/* "I Prayed for the Community" Button */}
        <PrayedForCommunityButton />

        {/* Summary */}
        <SummarySection />

        {/* Community Requests */}
        <CommunityRequestsSection />
      </ScrollView>
    </View>
  );
}
