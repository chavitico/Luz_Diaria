// Prayer Screen — single-petition model + open community list (no bottom sheet)
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  Check,
  Clock,
  Lock,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { PRAYER_CATEGORIES, AVATAR_FRAMES, SPIRITUAL_TITLES, DEFAULT_AVATARS } from '@/lib/constants';
import { gamificationApi, PrayerRequestDisplay } from '@/lib/gamification-api';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';
import {
  PrayerCategoryIcon,
  CommunityPrayerHeaderIcon,
  MyPetitionHeaderIcon,
} from '@/components/prayer/PrayerIcons';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAvatarEmoji(avatarId: string): string {
  const found = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  return found?.emoji ?? '🕊️';
}

function formatExpiry(expiresAt: string, language: 'en' | 'es'): string {
  const now = Date.now();
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return language === 'es' ? 'Expirada' : 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return language === 'es' ? `${hours}h restantes` : `${hours}h left`;
  return language === 'es' ? `${minutes}m restantes` : `${minutes}m left`;
}

// ── Category Dropdown ─────────────────────────────────────────────────────────
function CategoryDropdown({
  selectedCategory,
  onSelect,
}: {
  selectedCategory: string | null;
  onSelect: (category: string) => void;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCat = PRAYER_CATEGORIES.find((c) => c.key === selectedCategory);
  const selectedLabel = selectedCat
    ? (language === 'es' ? selectedCat.labelEs : selectedCat.labelEn)
    : language === 'es'
    ? 'Selecciona una categoría'
    : 'Select a category';

  return (
    <View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(!isOpen);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 13,
          borderRadius: 14,
          backgroundColor: colors.background,
          borderWidth: 1.5,
          borderColor: isOpen ? colors.primary : colors.primary + '28',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
          {selectedCategory ? (
            <PrayerCategoryIcon
              category={selectedCategory}
              size={30}
              active
              primaryColor={colors.primary}
            />
          ) : (
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.primary + '18',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14 }}>🙏</Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 15,
              flex: 1,
              color: selectedCategory ? colors.text : colors.textMuted,
              fontWeight: selectedCategory ? '500' : '400',
            }}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
        </View>
        <ChevronDown
          size={16}
          color={colors.textMuted}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(120)}
          style={{
            marginTop: 6,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.primary + '20',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          {PRAYER_CATEGORIES.map((cat, index) => {
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
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: pressed
                    ? colors.primary + '10'
                    : isSelected
                    ? colors.primary + '08'
                    : 'transparent',
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.primary + '08',
                  gap: 12,
                })}
              >
                <PrayerCategoryIcon
                  category={cat.key}
                  size={32}
                  active={isSelected}
                  primaryColor={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 14,
                    flex: 1,
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  }}
                >
                  {label}
                </Text>
                {isSelected && <Check size={15} color={colors.primary} />}
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ── My Petition Section ────────────────────────────────────────────────────────
function MyPetitionSection() {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const queryClient = useQueryClient();
  const addPoints = useAppStore((s) => s.addPoints);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['user-prayer-requests', user?.id],
    queryFn: () => gamificationApi.getUserPrayerRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const activePetition = useMemo(() => {
    return requestsData?.requests?.[0] ?? null;
  }, [requestsData]);

  const submitMutation = useMutation({
    mutationFn: () =>
      gamificationApi.submitPrayerRequest(user!.id, selectedCategory!, 'daily'),
    onSuccess: (data) => {
      if (data.pointsAwarded > 0) addPoints(data.pointsAwarded);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['user-prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-community'] });
      setSelectedCategory(null);
    },
  });

  const activeCat = activePetition
    ? PRAYER_CATEGORIES.find((c) => c.key === activePetition.categoryKey)
    : null;
  const activeCatLabel = activeCat
    ? language === 'es'
      ? activeCat.labelEs
      : activeCat.labelEn
    : '';

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: 20, marginBottom: 14 }}>
      <View
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.primary + '22',
          shadowColor: colors.primary,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        {/* Card header strip */}
        <LinearGradient
          colors={[colors.primary + '18', colors.primary + '06']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingVertical: 14,
            gap: 12,
          }}
        >
          <MyPetitionHeaderIcon size={38} primaryColor={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
                color: colors.primary,
                fontWeight: '600',
                marginBottom: 1,
              }}
            >
              {language === 'es' ? 'Mi petición' : 'My petition'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 17 }}>
              {language === 'es' ? 'Activa por 48 horas' : 'Active for 48 hours'}
            </Text>
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 16, gap: 14 }}>
          {/* Active petition chip */}
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : activePetition ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: colors.primary + '0D',
                borderWidth: 1,
                borderColor: colors.primary + '22',
                gap: 12,
              }}
            >
              <PrayerCategoryIcon
                category={activePetition.categoryKey}
                size={36}
                active
                primaryColor={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 }}>
                  {activeCatLabel}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Clock size={11} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {formatExpiry(activePetition.expiresAt, language)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
              {language === 'es'
                ? 'Elige una categoría para elevar tu petición a la comunidad.'
                : 'Choose a category to lift your petition to the community.'}
            </Text>
          )}

          {/* Selector */}
          <CategoryDropdown selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

          {/* Submit button */}
          <Pressable
            onPress={() => {
              if (!selectedCategory || !user?.id) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              submitMutation.mutate();
            }}
            disabled={!selectedCategory || submitMutation.isPending}
            style={({ pressed }) => ({
              overflow: 'hidden',
              borderRadius: 14,
              opacity: !selectedCategory ? 0.45 : pressed ? 0.88 : 1,
            })}
          >
            <LinearGradient
              colors={
                selectedCategory
                  ? [colors.primary, colors.primary + 'CC']
                  : [colors.primary + '50', colors.primary + '30']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 15,
                alignItems: 'center',
              }}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '700', color: selectedCategory ? '#fff' : colors.textMuted, letterSpacing: 0.3 }}>
                  {activePetition
                    ? language === 'es'
                      ? 'Cambiar mi petición'
                      : 'Change my petition'
                    : language === 'es'
                    ? 'Guardar petición'
                    : 'Save petition'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {activePetition && (
            <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 15 }}>
              {language === 'es'
                ? 'Guardar una nueva petición reemplazará la actual.'
                : 'Saving a new petition will replace the current one.'}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── "Ya oré hoy" Button ──────────────────────────────────────────────────────
function PrayedTodayButton() {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const queryClient = useQueryClient();
  const addPoints = useAppStore((s) => s.addPoints);

  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.35]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.85, 1.12]) }],
  }));

  const { data: prayedData } = useQuery({
    queryKey: ['prayed-for-community', user?.id],
    queryFn: () => gamificationApi.checkPrayedForCommunity(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const prayedMutation = useMutation({
    mutationFn: () => gamificationApi.prayedForCommunity(user!.id),
    onSuccess: (data) => {
      if (data.pointsAwarded > 0) addPoints(data.pointsAwarded);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['prayed-for-community'] });
    },
  });

  const hasPrayed = prayedData?.prayedToday ?? false;

  const handlePress = () => {
    if (hasPrayed || !user?.id) return;
    scale.value = withSequence(withSpring(0.94), withSpring(1));
    glow.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 400 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    prayedMutation.mutate();
  };

  return (
    <Animated.View entering={FadeInUp.delay(80).duration(400)} style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
        {/* Glow layer */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: 26,
              backgroundColor: colors.primary,
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />
        <Pressable
          onPress={handlePress}
          disabled={hasPrayed || prayedMutation.isPending}
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          {hasPrayed ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 17,
                backgroundColor: colors.primary + '12',
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: colors.primary + '30',
                gap: 9,
              }}
            >
              <Check size={19} color={colors.primary} strokeWidth={2.5} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
                {language === 'es' ? 'Oré por la comunidad hoy' : 'Prayed for community today'}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.secondary ?? colors.primary + 'BB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 18,
                gap: 10,
              }}
            >
              {prayedMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 20 }}>🙏</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
                    {language === 'es' ? 'Ya oré hoy' : 'I prayed today'}
                  </Text>
                </>
              )}
            </LinearGradient>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Types for SectionList ──────────────────────────────────────────────────────
interface CommunitySection {
  categoryKey: string;
  count: number;
  barWidth: number;
  data: PrayerRequestDisplay[];
}

// ── Single community user row ──────────────────────────────────────────────────
function CommunityUserRow({
  item,
  index,
}: {
  item: PrayerRequestDisplay;
  index: number;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const showProfile = item.displayNameOptIn && !!item.nickname;

  if (!showProfile) {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 20).duration(180)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginHorizontal: 20,
          marginBottom: 4,
          borderRadius: 12,
          backgroundColor: colors.background,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.textMuted + '14',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>🙏</Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textMuted, fontStyle: 'italic', flex: 1 }}>
          {language === 'es' ? 'Un hermano/a' : 'A brother/sister'}
        </Text>
      </Animated.View>
    );
  }

  const avatarEmoji = getAvatarEmoji(item.avatarId ?? 'avatar_dove');
  const frameColor = item.frameId ? AVATAR_FRAMES[item.frameId]?.color : null;
  const titleData = item.titleId ? SPIRITUAL_TITLES[item.titleId] : null;
  const titleLabel = titleData
    ? language === 'es'
      ? titleData.nameEs
      : titleData.name
    : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 20).duration(180)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginHorizontal: 20,
        marginBottom: 4,
        borderRadius: 12,
        backgroundColor: colors.background,
        gap: 12,
      }}
    >
      {/* Avatar with frame */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: frameColor ? 2.5 : 0,
          borderColor: frameColor ?? 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        }}
      >
        <IllustratedAvatar avatarId={item.avatarId ?? 'avatar_dove'} size={38} emoji={avatarEmoji} />
      </View>

      {/* Name + title */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{item.nickname}</Text>
        {titleLabel && (
          <View
            style={{
              backgroundColor: colors.primary + '18',
              borderRadius: 6,
              paddingHorizontal: 7,
              paddingVertical: 2,
              alignSelf: 'flex-start',
              marginTop: 3,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '500' }}>{titleLabel}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ── Category section header ────────────────────────────────────────────────────
function CommunitySectionHeader({
  section,
}: {
  section: CommunitySection;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const cat = PRAYER_CATEGORIES.find((c) => c.key === section.categoryKey);
  const label = cat ? (language === 'es' ? cat.labelEs : cat.labelEn) : section.categoryKey;
  const count = section.count;
  const personLabel =
    count === 1
      ? language === 'es'
        ? '1 persona'
        : '1 person'
      : language === 'es'
      ? `${count} personas`
      : `${count} people`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        gap: 11,
      }}
    >
      <PrayerCategoryIcon
        category={section.categoryKey}
        size={36}
        active
        primaryColor={colors.primary}
      />
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {/* Bar */}
      <View
        style={{
          width: 48,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.primary + '22',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${section.barWidth}%` as any,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.primary,
          }}
        />
      </View>
      {/* Pill */}
      <View
        style={{
          backgroundColor: colors.primary + '18',
          borderRadius: 20,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>{personLabel}</Text>
      </View>
    </View>
  );
}

// ── Community open list (SectionList) ──────────────────────────────────────────
function CommunityOpenList() {
  const colors = useThemeColors();
  const language = useLanguage();

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['prayer-summary'],
    queryFn: () => gamificationApi.getPrayerSummary(),
    staleTime: 60000,
  });

  const { data: communityData } = useQuery({
    queryKey: ['prayer-community'],
    queryFn: () => gamificationApi.getCommunityPrayerRequests(200),
    staleTime: 60000,
  });

  const total = summaryData?.total ?? 0;
  const communityRequests: PrayerRequestDisplay[] = communityData?.requests ?? [];

  // Build sorted sections with useMemo
  const sections: CommunitySection[] = useMemo(() => {
    const summaryEntries = Object.entries(summaryData?.summary ?? {}).sort(
      (a, b) => b[1] - a[1]
    );
    const maxCount = summaryEntries[0]?.[1] ?? 1;

    return summaryEntries.map(([catKey, count]) => {
      const catRequests = communityRequests
        .filter((r) => r.categoryKey === catKey)
        .sort((a, b) => {
          const aOpt = a.displayNameOptIn && !!a.nickname;
          const bOpt = b.displayNameOptIn && !!b.nickname;
          if (aOpt && !bOpt) return -1;
          if (!aOpt && bOpt) return 1;
          if (aOpt && bOpt) {
            return (a.nickname ?? '').localeCompare(b.nickname ?? '');
          }
          return 0;
        });

      return {
        categoryKey: catKey,
        count,
        barWidth: (count / maxCount) * 100,
        data: catRequests,
      };
    });
  }, [summaryData, communityRequests]);

  if (summaryLoading) {
    return (
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          padding: 24,
          borderRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + '15',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(160).duration(400)}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.primary + '18',
        shadowColor: colors.primary,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
        backgroundColor: colors.surface,
      }}
    >
      {/* Card header */}
      <LinearGradient
        colors={[colors.primary + '18', colors.primary + '06']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <CommunityPrayerHeaderIcon size={38} primaryColor={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              color: colors.primary,
              fontWeight: '600',
              marginBottom: 1,
            }}
          >
            {language === 'es' ? 'La comunidad ora por' : 'The community prays for'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            {total > 0
              ? language === 'es'
                ? `${total} ${total === 1 ? 'petición activa' : 'peticiones activas'}`
                : `${total} active ${total === 1 ? 'petition' : 'petitions'}`
              : language === 'es'
              ? 'Sin peticiones activas'
              : 'No active petitions'}
          </Text>
        </View>
      </LinearGradient>

      {/* Empty state */}
      {sections.length === 0 ? (
        <View style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 28 }}>🤲</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
            {language === 'es'
              ? 'Sé el primero en elevar una petición hoy.'
              : 'Be the first to lift a petition today.'}
          </Text>
        </View>
      ) : (
        <>
          {sections.map((section) => (
            <View key={section.categoryKey}>
              <CommunitySectionHeader section={section} />
              {section.data.length === 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    marginHorizontal: 20,
                    marginBottom: 4,
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>🙏</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic', flex: 1, lineHeight: 18 }}>
                    {language === 'es'
                      ? 'Aún nadie ha levantado esta petición. Sé el primero en hacerlo.'
                      : 'No one has lifted this petition yet. Be the first.'}
                  </Text>
                </View>
              ) : (
                section.data.map((item, index) => (
                  <CommunityUserRow key={item.id} item={item} index={index} />
                ))
              )}
            </View>
          ))}

          {/* Privacy footer */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginTop: 14,
              marginBottom: 16,
              marginHorizontal: 20,
              gap: 7,
            }}
          >
            <Lock size={11} color={colors.textMuted} style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17, flex: 1 }}>
              {language === 'es'
                ? 'Nombres solo aparecen si la persona lo permite.'
                : 'Names only appear if the person allows it.'}
            </Text>
          </View>
        </>
      )}
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PrayerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-prayer-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['prayer-community'] }),
      queryClient.invalidateQueries({ queryKey: ['prayed-for-community'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 18,
          paddingTop: insets.top + 14,
        }}
      >
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
          {language === 'es' ? 'Oración' : 'Prayer'}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 3, lineHeight: 19 }}>
          {language === 'es'
            ? 'Elevamos juntos nuestras peticiones'
            : 'We lift our petitions together'}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
        }}
      >
        {/* ScrollView wrapping everything */}
        <Animated.ScrollView
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
          <MyPetitionSection />
          <PrayedTodayButton />
          <CommunityOpenList />
        </Animated.ScrollView>
      </View>
    </View>
  );
}
