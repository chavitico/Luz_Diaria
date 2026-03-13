// Community Screen - Card-based layout with stats, members, prayer, and testimonies

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
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
  HandHeart,
  MessageSquareHeart,
  ChevronRight,
  X,
  Send,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import logger from '@/lib/logger';
import { useScaledFont } from '@/lib/textScale';
import { TRANSLATIONS, DEFAULT_AVATARS, AVATAR_FRAMES, SPIRITUAL_TITLES } from '@/lib/constants';
import { gamificationApi, CommunityMember } from '@/lib/gamification-api';
import { fetchWithTimeout } from '@/lib/fetch';
import { getCountryByCode } from '@/components/CountryPicker';
import { BadgeChip } from '@/components/BadgeChip';
import { BadgeInfoModal } from '@/components/BadgeInfoModal';
import { CommunityGiftFlowModal } from '@/components/CommunityGiftFlowModal';
import { TradeFlowModal } from '@/components/TradeFlowModal';
import { TradeInboxModal } from '@/components/TradeInboxModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestimonyUser {
  id: string;
  nickname: string;
  avatarId: string;
  frameId: string | null;
  titleId: string | null;
}

interface Testimony {
  id: string;
  text: string;
  createdAt: string;
  reviewedAt: string | null;
  user: TestimonyUser;
}

interface MyTestimony {
  id: string;
  text: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ─── Helper functions ─────────────────────────────────────────────────────────

function isActiveToday(member: CommunityMember): boolean {
  if (!member.lastActiveAt) return false;
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = new Date(member.lastActiveAt).toISOString().slice(0, 10);
  return lastActive === today || member.streakCurrent > 0;
}

function fmtCompact(n: number, language: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(n);
}

function getSortTier(m: CommunityMember, currentUserId: string | undefined, today: string): number {
  if (m.isAdmin) return 0;
  if (m.id === currentUserId) return 1;
  const lastActive = m.lastActiveAt
    ? new Date(m.lastActiveAt).toISOString().slice(0, 10)
    : null;
  const activeToday = lastActive === today || m.streakCurrent > 0;
  return activeToday ? 2 : 3;
}

// ─── AvatarWithFrame ──────────────────────────────────────────────────────────

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

// ─── PrayerIconButton ─────────────────────────────────────────────────────────

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

// ─── MemberCard ───────────────────────────────────────────────────────────────

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

        {/* Name + title */}
        <View style={{ flex: 1, minWidth: 0 }}>
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

        {/* Right: badge + points + trade */}
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

// ─── FullCommunityModal ───────────────────────────────────────────────────────

function FullCommunityModal({
  visible,
  onClose,
  members,
  isLoading,
  isRefreshing,
  onRefresh,
  currentUserId,
  getSupportState,
  onBadgePress,
  onGiftPress,
  onTradePress,
}: {
  visible: boolean;
  onClose: () => void;
  members: CommunityMember[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  currentUserId: string | undefined;
  getSupportState: (memberId: string, serverCount: number) => { count: number; supported: boolean };
  onBadgePress: (badgeId: string) => void;
  onGiftPress: (member: CommunityMember) => void;
  onTradePress: (member: CommunityMember) => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { sFont } = useScaledFont();

  const renderItem = useCallback(
    ({ item, index }: { item: CommunityMember; index: number }) => {
      const { count } = getSupportState(item.id, item.supportCount ?? 0);
      const memberWithCount = { ...item, supportCount: count };
      return (
        <MemberCard
          member={memberWithCount}
          isCurrentUser={item.id === currentUserId}
          index={index}
          onBadgePress={onBadgePress}
          onGiftPress={onGiftPress}
          onTradePress={onTradePress}
        />
      );
    },
    [currentUserId, getSupportState, onBadgePress, onGiftPress, onTradePress]
  );

  const keyExtractor = useCallback((item: CommunityMember) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Modal header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 12,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: colors.textMuted + '20',
          }}
        >
          <Text style={{ fontSize: sFont(20), fontWeight: '700', color: colors.text }}>
            Comunidad Activa
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.textMuted + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={colors.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <Users size={40} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
                  No hay miembros en la comunidad aun.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

// ─── TestimonySubmitModal ─────────────────────────────────────────────────────

function TestimonySubmitModal({
  visible,
  onClose,
  userId,
  myTestimony,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  myTestimony: MyTestimony | null | undefined;
  onSubmitted: () => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { sFont } = useScaledFont();
  const [text, setText] = useState<string>('');

  const charCount = text.length;
  const isValid = charCount >= 20 && charCount <= 500;

  const submitMutation = useMutation({
    mutationFn: async (testimonyText: string) => {
      if (!userId) throw new Error('No user');
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/testimonies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ text: testimonyText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Error al enviar');
      }
      return res.json();
    },
    onSuccess: () => {
      setText('');
      onSubmitted();
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!isValid || submitMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitMutation.mutate(text);
  };

  const hasExisting = !!myTestimony;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingBottom: 12,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: colors.textMuted + '20',
            }}
          >
            <Text style={{ fontSize: sFont(20), fontWeight: '700', color: colors.text }}>
              Tu Testimonio
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.textMuted + '18',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Show existing testimony status if present */}
            {hasExisting && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  backgroundColor:
                    myTestimony!.status === 'APPROVED'
                      ? '#10B98112'
                      : myTestimony!.status === 'REJECTED'
                      ? '#EF444412'
                      : colors.primary + '10',
                  borderColor:
                    myTestimony!.status === 'APPROVED'
                      ? '#10B98130'
                      : myTestimony!.status === 'REJECTED'
                      ? '#EF444430'
                      : colors.primary + '30',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {myTestimony!.status === 'APPROVED' ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : myTestimony!.status === 'REJECTED' ? (
                    <XCircle size={16} color="#EF4444" />
                  ) : (
                    <Clock size={16} color={colors.primary} />
                  )}
                  <Text
                    style={{
                      fontSize: sFont(13),
                      fontWeight: '700',
                      color:
                        myTestimony!.status === 'APPROVED'
                          ? '#10B981'
                          : myTestimony!.status === 'REJECTED'
                          ? '#EF4444'
                          : colors.primary,
                    }}
                  >
                    {myTestimony!.status === 'APPROVED'
                      ? 'Aprobado'
                      : myTestimony!.status === 'REJECTED'
                      ? 'No aprobado'
                      : 'En revision...'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: sFont(13),
                    color: colors.text,
                    lineHeight: 20,
                  }}
                  numberOfLines={4}
                >
                  {myTestimony!.text}
                </Text>
              </Animated.View>
            )}

            {/* Only show submit form if no existing testimony (or rejected) */}
            {(!hasExisting || myTestimony?.status === 'REJECTED') && (
              <>
                <Text
                  style={{
                    fontSize: sFont(14),
                    color: colors.textMuted,
                    marginBottom: 12,
                    lineHeight: 20,
                  }}
                >
                  Comparte como Dios ha obrado en tu vida. Tu testimonio puede inspirar a otros en la comunidad.
                </Text>

                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isValid
                      ? colors.primary + '50'
                      : charCount > 0
                      ? colors.textMuted + '40'
                      : colors.textMuted + '25',
                    backgroundColor: colors.surface,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Comparte como Dios ha obrado en tu vida..."
                    placeholderTextColor={colors.textMuted + '80'}
                    multiline
                    numberOfLines={6}
                    maxLength={500}
                    style={{
                      fontSize: sFont(15),
                      color: colors.text,
                      minHeight: 120,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Char counter */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: sFont(12), color: charCount < 20 ? '#F59E0B' : colors.textMuted }}>
                    {charCount < 20 ? `Minimo 20 caracteres (${20 - charCount} restantes)` : ''}
                  </Text>
                  <Text
                    style={{
                      fontSize: sFont(12),
                      color: charCount > 480 ? '#EF4444' : colors.textMuted,
                      fontWeight: '600',
                    }}
                  >
                    {charCount}/500
                  </Text>
                </View>

                {/* Error */}
                {submitMutation.isError && (
                  <Text style={{ color: '#EF4444', fontSize: sFont(13), marginBottom: 12, textAlign: 'center' }}>
                    {(submitMutation.error as Error)?.message ?? 'Error al enviar. Intenta de nuevo.'}
                  </Text>
                )}

                {/* Submit button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid || submitMutation.isPending}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    backgroundColor: isValid ? colors.primary : colors.textMuted + '30',
                    opacity: submitMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {submitMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <>
                      <Send size={16} color={isValid ? colors.primaryText : colors.textMuted} />
                      <Text
                        style={{
                          fontSize: sFont(15),
                          fontWeight: '700',
                          color: isValid ? colors.primaryText : colors.textMuted,
                        }}
                      >
                        Enviar
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Card 1: Caminamos Juntos (stats) ─────────────────────────────────────────

function StatsCard({ language }: { language: string }) {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['communityStats'],
    queryFn: () => gamificationApi.getCommunityStats(),
    staleTime: 60_000,
    refetchOnMount: true,
    retry: 1,
  });

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
      value: statsLoading ? '—' : fmtCompact(stats?.registeredUsers ?? 0, language),
      accent: '#34D399',
      bg: '#34D39912',
      border: '#34D39930',
    },
    {
      icon: '📖',
      label: language === 'es' ? 'Devocionales' : 'Devotionals',
      value: statsLoading ? '—' : fmtCompact(stats?.devotionalsCompletedTotal ?? 0, language),
      accent: '#FBBF24',
      bg: '#FBBF2412',
      border: '#FBBF2430',
    },
    {
      icon: '✨',
      label: language === 'es' ? 'Pts ganados' : 'Pts earned',
      value: statsLoading ? '—' : fmtCompact(stats?.pointsEarnedTotal ?? 0, language),
      accent: '#F97316',
      bg: '#F9731612',
      border: '#F9731630',
    },
    {
      icon: '🛍️',
      label: language === 'es' ? 'Pts gastados' : 'Pts spent',
      value: statsLoading ? '—' : fmtCompact(stats?.pointsSpentTotal ?? 0, language),
      accent: '#A78BFA',
      bg: '#A78BFA12',
      border: '#A78BFA30',
    },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <LinearGradient
        colors={[colors.primary + '18', colors.background, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: colors.primary + '20',
        }}
      >
        {/* Card title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text, lineHeight: 18 }}>
              Caminamos Juntos
            </Text>
            <Text style={{ fontSize: sFont(11), color: colors.textMuted, lineHeight: 15 }}>
              Dios obra en Su pueblo
            </Text>
          </View>
        </View>

        {/* Compact horizontal metrics row */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {cardDefs.map((card, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: card.bg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: card.border,
                paddingVertical: 8,
                paddingHorizontal: 6,
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 18 }}>{card.icon}</Text>
              {statsLoading ? (
                <View
                  style={{
                    height: 16,
                    width: 32,
                    borderRadius: 4,
                    backgroundColor: card.accent + '25',
                  }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: sFont(14),
                    fontWeight: '800',
                    color: card.accent,
                    letterSpacing: -0.3,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {card.value}
                </Text>
              )}
              <Text
                style={{ fontSize: sFont(9), color: colors.textMuted, fontWeight: '500', textAlign: 'center' }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {card.label}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Card 2: Comunidad Activa (top 3 + modal button) ─────────────────────────

function ComunidadActivaCard({
  members,
  isLoading,
  currentUserId,
  onVerComunidad,
  onBadgePress,
  onGiftPress,
  onTradePress,
}: {
  members: CommunityMember[];
  isLoading: boolean;
  currentUserId: string | undefined;
  onVerComunidad: () => void;
  onBadgePress: (badgeId: string) => void;
  onGiftPress: (member: CommunityMember) => void;
  onTradePress: (member: CommunityMember) => void;
}) {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();

  const top3 = members.slice(0, 3);

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.textMuted + '18',
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#34D39920',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={17} color="#34D399" />
            </View>
            <View>
              <Text style={{ fontSize: sFont(16), fontWeight: '700', color: colors.text }}>
                Comunidad Activa
              </Text>
              <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
                {members.length > 0 ? `${members.length} miembros` : 'Cargando...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Members list */}
        {isLoading ? (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : top3.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: colors.textMuted, fontSize: sFont(13) }}>
              No hay miembros aun.
            </Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 4 }}>
            {top3.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
                index={index}
                onBadgePress={onBadgePress}
                onGiftPress={onGiftPress}
                onTradePress={onTradePress}
              />
            ))}
          </View>
        )}

        {/* Ver comunidad button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onVerComunidad();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginHorizontal: 16,
            marginBottom: 16,
            marginTop: 4,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.primary + '12',
            borderWidth: 1,
            borderColor: colors.primary + '30',
          }}
        >
          <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.primary }}>
            Ver comunidad
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Card 3: Oraciones ────────────────────────────────────────────────────────

function OracionesCard() {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <LinearGradient
        colors={['#F59E0B18', '#EF444418', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: '#F59E0B25',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#F59E0B20',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HandHeart size={22} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(16), fontWeight: '700', color: colors.text, marginBottom: 4 }}>
              Oraciones
            </Text>
            <Text style={{ fontSize: sFont(13), color: colors.textMuted, lineHeight: 19 }}>
              Comparte tus peticiones de oracion y ora por los demas. Unidos en fe, nuestras oraciones tienen poder.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.navigate('/prayer' as Parameters<typeof router.navigate>[0]);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: '#F59E0B',
          }}
        >
          <HandHeart size={16} color="#FFF" />
          <Text style={{ fontSize: sFont(14), fontWeight: '700', color: '#FFF' }}>
            Ir a oracion
          </Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Card 4: Testimonios ──────────────────────────────────────────────────────

function TestimoniosCard({
  userId,
  onSharePress,
  onViewAll,
}: {
  userId: string | undefined;
  onSharePress: () => void;
  onViewAll: () => void;
}) {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();

  const { data: testimonies, isLoading } = useQuery<Testimony[]>({
    queryKey: ['testimonies-approved', userId],
    queryFn: async () => {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/testimonies/approved`, {
        headers: userId ? { 'x-user-id': userId } : {},
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json as { testimonies?: Testimony[] }).testimonies ?? [];
    },
    staleTime: 120_000,
    retry: 1,
  });

  const displayTestimonies = (testimonies ?? []).slice(0, 3);

  return (
    <Animated.View entering={FadeInDown.delay(320).duration(400)} style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <LinearGradient
        colors={['#8B5CF618', '#EC489918', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: '#8B5CF625',
        }}
      >
        {/* Card header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#8B5CF620',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquareHeart size={17} color="#8B5CF6" />
          </View>
          <View>
            <Text style={{ fontSize: sFont(16), fontWeight: '700', color: colors.text }}>
              Testimonios
            </Text>
            <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
              Lo que Dios ha hecho
            </Text>
          </View>
        </View>

        {/* Testimonies list */}
        {isLoading ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : displayTestimonies.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Text style={{ color: colors.textMuted, fontSize: sFont(13), textAlign: 'center' }}>
              Se el primero en compartir.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 14 }}>
            {displayTestimonies.map((testimony) => (
              <View
                key={testimony.id}
                style={{
                  borderRadius: 14,
                  padding: 14,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.textMuted + '18',
                }}
              >
                {/* Author row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AvatarWithFrame
                    avatarId={testimony.user.avatarId}
                    frameId={testimony.user.frameId}
                    size={28}
                  />
                  <Text style={{ fontSize: sFont(13), fontWeight: '600', color: colors.text }}>
                    {testimony.user.nickname}
                  </Text>
                </View>
                {/* Testimony text */}
                <Text
                  style={{
                    fontSize: sFont(13),
                    color: colors.text,
                    lineHeight: 19,
                    fontStyle: 'italic',
                  }}
                  numberOfLines={4}
                >
                  "{testimony.text}"
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* View all button */}
        {(testimonies ?? []).length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewAll();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: sFont(13), fontWeight: '600', color: colors.primary }}>
              Ver todos los testimonios
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </Pressable>
        )}

        {/* Share button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSharePress();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.primary,
          }}
        >
          <MessageSquareHeart size={16} color={colors.primaryText} />
          <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.primaryText }}>
            Compartir testimonio
          </Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const user = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = TRANSLATIONS[language];

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const syncedRef = useRef<boolean>(false);
  const lastResumeRef = useRef<number>(0);

  // Modal visibility
  const [showCommunityModal, setShowCommunityModal] = useState<boolean>(false);
  const [showTestimonyModal, setShowTestimonyModal] = useState<boolean>(false);

  // Gift / Trade / Badge modals
  const [giftTarget, setGiftTarget] = useState<CommunityMember | null>(null);
  const [showGiftFlow, setShowGiftFlow] = useState<boolean>(false);
  const [tradeTarget, setTradeTarget] = useState<CommunityMember | null>(null);
  const [showTradeFlow, setShowTradeFlow] = useState<boolean>(false);
  const [showTradeInbox, setShowTradeInbox] = useState<boolean>(false);
  const [badgeModalId, setBadgeModalId] = useState<string | null>(null);

  // Optimistic support state
  const [localSupport, setLocalSupport] = useState<Record<string, { count: number; supported: boolean }>>({});

  // Trades polling
  const { data: tradesData } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: () => gamificationApi.getTrades(user!.id),
    enabled: !!user?.id,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  // Track which pending trade IDs have been "seen" by opening the inbox
  const [seenTradeIds, setSeenTradeIds] = useState<Set<string>>(new Set());

  const pendingIncomingTrades = (tradesData?.trades ?? []).filter(
    (tr) => tr.toUserId === user?.id && tr.status === 'pending'
  );
  // Badge shows trades that exist AND haven't been seen yet
  const unseenPendingCount = pendingIncomingTrades.filter(
    (tr) => !seenTradeIds.has(tr.id)
  ).length;

  // My testimony
  const { data: myTestimony, refetch: refetchMyTestimony } = useQuery<MyTestimony | null>({
    queryKey: ['my-testimony', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/testimonies/mine`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const json = await res.json();
      return (json as { testimony?: MyTestimony }).testimony ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    retry: 1,
  });

  // Network monitoring
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const wasOffline = isOffline;
      const nowOffline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(nowOffline);
      if (wasOffline && !nowOffline) {
        queryClient.invalidateQueries({ queryKey: ['community-members'] });
      }
    });
    return () => unsub();
  }, [isOffline, queryClient]);

  // Sync current user
  const syncCurrentUser = useCallback(async () => {
    if (!user?.id) return;
    try {
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

      const updateUser = useAppStore.getState().updateUser;

      if (backendUser.nickname && backendUser.nickname !== user.nickname) {
        if (__DEV__) console.log(`[Sync] Nickname corrected: "${user.nickname}" -> "${backendUser.nickname}"`);
        updateUser({ nickname: backendUser.nickname });
      }

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
        titleId: user.titleId ?? null,
        frameId: user.frameId ?? null,
        avatarId: user.avatar,
        ...(backendUser.nickname ? { nickname: backendUser.nickname } : {}),
      });

      const updates: Record<string, unknown> = {};
      if (syncedUser.points > user.points) updates.points = syncedUser.points;
      if (syncedUser.streakCurrent > user.streakCurrent) updates.streakCurrent = syncedUser.streakCurrent;
      if (syncedUser.streakBest > user.streakBest) updates.streakBest = syncedUser.streakBest;
      if (syncedUser.devotionalsCompleted > user.devotionalsCompleted) updates.devotionalsCompleted = syncedUser.devotionalsCompleted;
      if (syncedUser.totalTimeSeconds > user.totalTime) updates.totalTime = syncedUser.totalTimeSeconds;
      if (syncedUser.role && syncedUser.role !== user.role) updates.role = syncedUser.role as 'USER' | 'MODERATOR' | 'OWNER';
      if (syncedUser.nickname && syncedUser.nickname !== user.nickname) updates.nickname = syncedUser.nickname;

      if (Object.keys(updates).length > 0) {
        updateUser(updates);
      }

      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    } catch (error) {
      console.error('[Community] Failed to sync user:', error);
    }
  }, [user?.id, user?.points, user?.streakCurrent, user?.devotionalsCompleted, queryClient]);

  // Initial sync once per mount
  useEffect(() => {
    if (!syncedRef.current) {
      syncedRef.current = true;
      syncCurrentUser();
    }
  }, [syncCurrentUser]);

  // App resume pipeline
  const onAppResume = useCallback(async () => {
    const now = Date.now();
    if (now - lastResumeRef.current < 10_000) {
      logger.debug('[Community] onAppResume skipped — cooldown');
      return;
    }
    lastResumeRef.current = now;
    logger.debug('[Community] onAppResume: starting recovery');
    setRefreshing(true);
    setLocalSupport({});
    try {
      await syncCurrentUser();
      await queryClient.invalidateQueries({ queryKey: ['community-members'] });
      await queryClient.invalidateQueries({ queryKey: ['community-support-status'] });
      await queryClient.invalidateQueries({ queryKey: ['testimonies-approved'] });
    } catch (err) {
      logger.warn('[Community] onAppResume error', err);
    } finally {
      setRefreshing(false);
    }
  }, [syncCurrentUser, queryClient]);

  const onAppResumeRef = useRef(onAppResume);
  useEffect(() => { onAppResumeRef.current = onAppResume; }, [onAppResume]);

  const resumeTick = useAppStore((s) => s.resumeTick);
  useEffect(() => {
    if (resumeTick === 0) return;
    logger.debug('[Community] resumeTick — triggering recovery');
    onAppResumeRef.current();
  }, [resumeTick]);

  // Focus effect: invalidate community members
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    }, [queryClient])
  );

  // Fetch community members
  const {
    data,
    isLoading: membersLoading,
    isFetching: membersFetching,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['community-members'],
    queryFn: async () => {
      const result = await gamificationApi.getCommunityMembers(50, 0);
      return result;
    },
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 1,
  });

  const members = data?.members ?? [];

  // Stuck-loading guard
  useEffect(() => {
    if (!membersLoading) return;
    const timer = setTimeout(() => {
      if (__DEV__) console.warn('[Community] isLoading stuck >20s — forcing refetch');
      refetchMembers();
    }, 20_000);
    return () => clearTimeout(timer);
  }, [membersLoading, refetchMembers]);

  // Support status
  const memberIds = members.map((m) => m.id);
  const { data: supportStatusData } = useQuery({
    queryKey: ['community-support-status', user?.id, memberIds],
    queryFn: async () => {
      if (!user?.id || !memberIds.length) return { status: {}, dateId: '' };
      return gamificationApi.getSupportStatus(user.id, memberIds);
    },
    enabled: !!user?.id && memberIds.length > 0,
    staleTime: 60_000,
    retry: 1,
  });

  const getSupportState = useCallback(
    (memberId: string, serverCount: number): { count: number; supported: boolean } => {
      const local = localSupport[memberId];
      if (local !== undefined) return local;
      const serverSupported = supportStatusData?.status?.[memberId] ?? false;
      return { count: serverCount, supported: serverSupported };
    },
    [localSupport, supportStatusData]
  );

  const { mutate: mutateSendSupport, isPending: isSupportPending } = useMutation({
    mutationFn: ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) =>
      gamificationApi.sendSupport(fromUserId, toUserId),
    onSuccess: (result, variables) => {
      setLocalSupport((prev) => ({
        ...prev,
        [variables.toUserId]: { count: result.supportCount, supported: true },
      }));
    },
  });

  const handleSupport = useCallback(
    (memberId: string) => {
      if (!user?.id || isSupportPending) return;
      const current = getSupportState(memberId, members.find((m) => m.id === memberId)?.supportCount ?? 0);
      if (current.supported) return;
      setLocalSupport((prev) => ({
        ...prev,
        [memberId]: { count: current.count + 1, supported: true },
      }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mutateSendSupport({ fromUserId: user.id, toUserId: memberId });
    },
    [user?.id, isSupportPending, getSupportState, members, mutateSendSupport]
  );

  // Sorted members (admin first, current user second, active today, then rest)
  const sortedMembers = React.useMemo(() => {
    if (!members.length) return members;
    const today = new Date().toISOString().slice(0, 10);
    return [...members].sort((a, b) => {
      const tierDiff = getSortTier(a, user?.id, today) - getSortTier(b, user?.id, today);
      if (tierDiff !== 0) return tierDiff;
      return b.devotionalsCompleted - a.devotionalsCompleted;
    });
  }, [members, user?.id]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    lastResumeRef.current = 0;
    await onAppResume();
  }, [onAppResume]);

  const handleBadgePress = useCallback((badgeId: string) => {
    setBadgeModalId(badgeId);
  }, []);

  const handleGiftPress = useCallback((member: CommunityMember) => {
    setGiftTarget(member);
    setShowGiftFlow(true);
  }, []);

  const handleTradePress = useCallback((member: CommunityMember) => {
    setTradeTarget(member);
    setShowTradeFlow(true);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top header bar */}
      <View style={{ paddingTop: insets.top + 16, paddingBottom: 12, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: sFont(30), fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            {t.community_title}
          </Text>
          {/* Trade inbox button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Mark all current pending incoming trades as seen — clears the badge
              setSeenTradeIds(prev => {
                const next = new Set(prev);
                pendingIncomingTrades.forEach(tr => next.add(tr.id));
                return next;
              });
              setShowTradeInbox(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 12,
              backgroundColor: unseenPendingCount > 0 ? colors.primary + '15' : colors.surface,
              borderWidth: 1,
              borderColor: unseenPendingCount > 0 ? colors.primary + '50' : colors.textMuted + '25',
            }}
          >
            <View style={{ position: 'relative' }}>
              <Inbox size={15} color={colors.primary} />
              {unseenPendingCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFF' }}>
                    {unseenPendingCount > 9 ? '9+' : String(unseenPendingCount)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.primary }}>
              {language === 'es' ? 'Trueques' : 'Trades'}
            </Text>
          </Pressable>
        </View>

        {/* Offline banner */}
        {isOffline && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
            <WifiOff size={13} color={colors.textMuted} />
            <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
              Sin conexion. Actualizaremos cuando regreses a internet.
            </Text>
          </View>
        )}
      </View>

      {/* Scrollable card layout */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Card 1: Caminamos Juntos */}
        <StatsCard language={language} />

        {/* Card 2: Comunidad Activa */}
        <ComunidadActivaCard
          members={sortedMembers}
          isLoading={membersLoading && !refreshing}
          currentUserId={user?.id}
          onVerComunidad={() => setShowCommunityModal(true)}
          onBadgePress={handleBadgePress}
          onGiftPress={handleGiftPress}
          onTradePress={handleTradePress}
        />

        {/* Card 3: Oraciones */}
        <OracionesCard />

        {/* Card 4: Testimonios */}
        <TestimoniosCard
          userId={user?.id}
          onSharePress={() => setShowTestimonyModal(true)}
          onViewAll={() => router.push('/community/testimonios-feed')}
        />
      </ScrollView>

      {/* Full community modal */}
      <FullCommunityModal
        visible={showCommunityModal}
        onClose={() => setShowCommunityModal(false)}
        members={sortedMembers}
        isLoading={membersLoading && !refreshing}
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        currentUserId={user?.id}
        getSupportState={getSupportState}
        onBadgePress={handleBadgePress}
        onGiftPress={handleGiftPress}
        onTradePress={handleTradePress}
      />

      {/* Testimony submit modal */}
      <TestimonySubmitModal
        visible={showTestimonyModal}
        onClose={() => setShowTestimonyModal(false)}
        userId={user?.id}
        myTestimony={myTestimony}
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ['my-testimony', user?.id] });
          refetchMyTestimony();
        }}
      />

      {/* Badge info modal */}
      <BadgeInfoModal
        badgeId={badgeModalId}
        visible={!!badgeModalId}
        variant="community"
        onClose={() => setBadgeModalId(null)}
      />

      {/* Gift flow modal */}
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
