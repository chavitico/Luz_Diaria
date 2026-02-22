// Prayer Screen — simplified single-petition model
// One petition per user (48h), category-only community display

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
  Flame,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { TRANSLATIONS, PRAYER_CATEGORIES } from '@/lib/constants';
import { gamificationApi, PrayerRequestDisplay } from '@/lib/gamification-api';

// ── Category icons ─────────────────────────────────────────────────────────
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

// ── Format expiry as "48h" countdown or readable date ─────────────────────
function formatExpiry(expiresAt: string, language: 'en' | 'es'): string {
  const now = Date.now();
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return language === 'es' ? 'Expirada' : 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return language === 'es' ? `${hours}h restantes` : `${hours}h left`;
  return language === 'es' ? `${minutes}m restantes` : `${minutes}m left`;
}

// ── Category Dropdown ──────────────────────────────────────────────────────
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
    ? language === 'es' ? selectedCat.labelEs : selectedCat.labelEn
    : language === 'es' ? 'Selecciona una categoría' : 'Select a category';

  const IconComponent = selectedCategory ? (CATEGORY_ICONS[selectedCategory] ?? Heart) : Heart;

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
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.background,
          borderWidth: 1.5,
          borderColor: isOpen ? colors.primary : colors.primary + '25',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <IconComponent size={18} color={selectedCategory ? colors.primary : colors.textMuted} />
          <Text
            style={{
              fontSize: 15,
              marginLeft: 10,
              flex: 1,
              color: selectedCategory ? colors.text : colors.textMuted,
            }}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
        </View>
        <ChevronDown
          size={18}
          color={colors.textMuted}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(120)}
          style={{
            marginTop: 6,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.primary + '20',
          }}
        >
          {PRAYER_CATEGORIES.map((cat, index) => {
            const CatIcon = CATEGORY_ICONS[cat.key] ?? Heart;
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.primary + '08',
                }}
              >
                <CatIcon size={17} color={isSelected ? colors.primary : colors.textMuted} />
                <Text
                  style={{
                    fontSize: 15,
                    marginLeft: 10,
                    flex: 1,
                    color: isSelected ? colors.primary : colors.text,
                  }}
                >
                  {label}
                </Text>
                {isSelected && <Check size={16} color={colors.primary} />}
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ── My Petition Section ────────────────────────────────────────────────────
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
      if (data.pointsAwarded > 0) {
        addPoints(data.pointsAwarded);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['user-prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] });
      setSelectedCategory(null);
    },
  });

  const activeCat = activePetition
    ? PRAYER_CATEGORIES.find((c) => c.key === activePetition.categoryKey)
    : null;
  const activeCatLabel = activeCat
    ? (language === 'es' ? activeCat.labelEs : activeCat.labelEn)
    : '';
  const ActiveIcon = activePetition ? (CATEGORY_ICONS[activePetition.categoryKey] ?? Heart) : Heart;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <View
        style={{
          borderRadius: 20,
          padding: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary + '18',
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
          {language === 'es' ? 'Mi Petición' : 'My Petition'}
        </Text>

        {/* Active petition display */}
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 16 }} />
        ) : activePetition ? (
          <View
            style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 14,
              backgroundColor: colors.primary + '0C',
              borderWidth: 1,
              borderColor: colors.primary + '20',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <ActiveIcon size={18} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 10, flex: 1 }}>
                {activeCatLabel}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>
                {formatExpiry(activePetition.expiresAt, language)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 14, lineHeight: 18 }}>
            {language === 'es'
              ? 'Elige una categoría para elevar tu petición a la comunidad de oración.'
              : 'Choose a category to lift your petition to the prayer community.'}
          </Text>
        )}

        {/* Category selector */}
        <View style={{ marginBottom: 14 }}>
          <CategoryDropdown selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        </View>

        {/* Save button */}
        <Pressable
          onPress={() => {
            if (!selectedCategory || !user?.id) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            submitMutation.mutate();
          }}
          disabled={!selectedCategory || submitMutation.isPending}
          style={{
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: selectedCategory ? colors.primary : colors.primary + '30',
            opacity: submitMutation.isPending ? 0.7 : 1,
          }}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: '600', color: selectedCategory ? '#fff' : colors.textMuted }}>
              {activePetition
                ? (language === 'es' ? 'Actualizar petición' : 'Update petition')
                : (language === 'es' ? 'Guardar petición' : 'Save petition')}
            </Text>
          )}
        </Pressable>

        {activePetition && (
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 16 }}>
            {language === 'es'
              ? 'Guardar una nueva petición reemplazará la actual.'
              : 'Saving a new petition will replace the current one.'}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ── "Ya oré hoy" Button ────────────────────────────────────────────────────
function PrayedTodayButton() {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const queryClient = useQueryClient();
  const addPoints = useAppStore((s) => s.addPoints);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
    scale.value = withSequence(withSpring(0.93), withSpring(1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    prayedMutation.mutate();
  };

  return (
    <Animated.View entering={FadeInUp.delay(100).duration(400)} style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          disabled={hasPrayed || prayedMutation.isPending}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 18,
            borderRadius: 20,
            backgroundColor: hasPrayed ? colors.primary + '12' : colors.primary,
            borderWidth: hasPrayed ? 1 : 0,
            borderColor: colors.primary + '35',
          }}
        >
          {prayedMutation.isPending ? (
            <ActivityIndicator size="small" color={hasPrayed ? colors.primary : '#fff'} />
          ) : (
            <>
              {hasPrayed ? (
                <Check size={20} color={colors.primary} />
              ) : (
                <Flame size={20} color="#fff" />
              )}
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 8,
                  color: hasPrayed ? colors.primary : '#fff',
                }}
              >
                {hasPrayed
                  ? (language === 'es' ? 'Ya oré hoy' : 'Prayed today')
                  : (language === 'es' ? 'Ya oré hoy' : 'I prayed today')}
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Category Drilldown Sheet ───────────────────────────────────────────────
function CategoryDrilldownSheet({
  categoryKey,
  requests,
  onClose,
}: {
  categoryKey: string | null;
  requests: PrayerRequestDisplay[];
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const insets = useSafeAreaInsets();

  if (!categoryKey) return null;

  const cat = PRAYER_CATEGORIES.find((c) => c.key === categoryKey);
  const catLabel = cat ? (language === 'es' ? cat.labelEs : cat.labelEn) : categoryKey;
  const CatIcon = CATEGORY_ICONS[categoryKey] ?? Heart;

  const filtered = requests.filter((r) => r.categoryKey === categoryKey);

  return (
    <Modal
      visible={!!categoryKey}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
        onPress={onClose}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom + 24,
          paddingTop: 8,
          maxHeight: '70%',
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.primary + '15',
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <CatIcon size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
              {language === 'es' ? 'Peticiones por' : 'Petitions for'}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              {catLabel}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: colors.background,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* List */}
        <ScrollView
          style={{ paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>
              {language === 'es' ? 'Sin peticiones activas' : 'No active petitions'}
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map((req, index) => {
                const displayName = req.displayNameOptIn && req.nickname
                  ? req.nickname
                  : (language === 'es' ? 'Un hermano/a' : 'A brother/sister');
                const isAnon = !req.displayNameOptIn || !req.nickname;

                return (
                  <Animated.View
                    key={req.id}
                    entering={FadeInDown.delay(index * 30).duration(200)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      backgroundColor: colors.background,
                    }}
                  >
                    {/* Avatar placeholder */}
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: isAnon ? colors.textMuted + '20' : colors.primary + '18',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 16 }}>
                        {isAnon ? '🙏' : displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 15,
                      color: isAnon ? colors.textMuted : colors.text,
                      fontWeight: isAnon ? '400' : '500',
                      fontStyle: isAnon ? 'italic' : 'normal',
                      flex: 1,
                    }}>
                      {displayName}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Privacy footer */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginTop: 20,
            marginBottom: 4,
            paddingHorizontal: 4,
            gap: 8,
          }}>
            <Lock size={12} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17, flex: 1 }}>
              {language === 'es'
                ? 'Nombres solo aparecen si la persona lo permite.'
                : 'Names only appear if the person allows it.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Community Category Summary ─────────────────────────────────────────────
function CommunitySummary() {
  const colors = useThemeColors();
  const language = useLanguage();
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

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

  if (summaryLoading) {
    return (
      <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary + '15', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const entries = Object.entries(summaryData?.summary ?? {}).sort((a, b) => b[1] - a[1]);
  const total = summaryData?.total ?? 0;
  const communityRequests = communityData?.requests ?? [];

  return (
    <>
      <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ marginHorizontal: 20, marginBottom: 16 }}>
        <View
          style={{
            borderRadius: 20,
            padding: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.primary + '15',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Users size={17} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 8, flex: 1 }}>
              {language === 'es' ? 'La comunidad ora por' : 'Community is praying for'}
            </Text>
            {total > 0 && (
              <View style={{ backgroundColor: colors.primary + '15', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                  {total} {language === 'es' ? 'personas' : 'people'}
                </Text>
              </View>
            )}
          </View>

          {entries.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 12, lineHeight: 20 }}>
              {language === 'es'
                ? 'Sé el primero en elevar una petición hoy.'
                : 'Be the first to lift a petition today.'}
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {entries.map(([key, count], index) => {
                const cat = PRAYER_CATEGORIES.find((c) => c.key === key);
                const label = cat ? (language === 'es' ? cat.labelEs : cat.labelEn) : key;
                const CatIcon = CATEGORY_ICONS[key] ?? Heart;
                const barWidth = entries[0] ? (count / entries[0][1]) * 100 : 0;

                return (
                  <Animated.View
                    key={key}
                    entering={FadeInDown.delay(index * 40).duration(200)}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDrillCategory(key);
                      }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: pressed ? colors.primary + '08' : colors.background,
                      })}
                    >
                      <CatIcon size={16} color={colors.primary} />
                      <Text style={{ fontSize: 14, color: colors.text, marginLeft: 10, flex: 1 }} numberOfLines={1}>
                        {label}
                      </Text>
                      {/* Bar */}
                      <View style={{ width: 60, height: 4, borderRadius: 2, backgroundColor: colors.primary + '20', marginRight: 10 }}>
                        <View style={{ width: `${barWidth}%` as any, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, minWidth: 20, textAlign: 'right' }}>
                        {count}
                      </Text>
                      <ChevronRight size={14} color={colors.textMuted} style={{ marginLeft: 6 }} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>

      <CategoryDrilldownSheet
        categoryKey={drillCategory}
        requests={communityRequests}
        onClose={() => setDrillCategory(null)}
      />
    </>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
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
      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: insets.top + 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
          {language === 'es' ? 'Oración' : 'Prayer'}
        </Text>
        <Text style={{ fontSize: 15, color: colors.textMuted, marginTop: 4, lineHeight: 20 }}>
          {language === 'es'
            ? 'Elevamos juntos nuestras peticiones'
            : 'We lift our petitions together'}
        </Text>
      </View>

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
        <MyPetitionSection />
        <PrayedTodayButton />
        <CommunitySummary />
      </ScrollView>
    </View>
  );
}
