// Testimonios Feed Screen - Full scrollable feed with likes

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Heart,
  MessageSquareHeart,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS, AVATAR_FRAMES } from '@/lib/constants';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

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
  likeCount: number;
  likedByMe: boolean;
  user: TestimonyUser;
}

interface MyTestimony {
  id: string;
  text: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// ─── AvatarWithFrame ──────────────────────────────────────────────────────────

function AvatarWithFrame({
  avatarId,
  frameId,
  size = 44,
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
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: frameColor ? 2.5 : 2,
        borderColor: frameColor || colors.primary + '30',
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
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

// ─── HeartButton ─────────────────────────────────────────────────────────────

function HeartButton({
  testimonyId,
  likeCount,
  likedByMe,
  userId,
  onOptimisticUpdate,
}: {
  testimonyId: string;
  likeCount: number;
  likedByMe: boolean;
  userId: string | undefined;
  onOptimisticUpdate: (id: string, liked: boolean, count: number) => void;
}) {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/testimonies/${testimonyId}/like`, {
        method: 'POST',
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error('Failed to like');
      return res.json() as Promise<{ liked: boolean; likeCount: number }>;
    },
    onMutate: () => {
      // Optimistic update
      const newLiked = !likedByMe;
      const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
      onOptimisticUpdate(testimonyId, newLiked, newCount);
    },
  });

  const handlePress = () => {
    if (!userId || likeMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(1.45, { damping: 5, stiffness: 400 }),
      withSpring(0.85, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 250 })
    );
    likeMutation.mutate();
  };

  return (
    <Pressable onPress={handlePress} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 2 }}>
      <Animated.View style={animStyle}>
        <Heart
          size={18}
          color={likedByMe ? '#EC4899' : colors.textMuted}
          fill={likedByMe ? '#EC4899' : 'none'}
          strokeWidth={likedByMe ? 0 : 2}
        />
      </Animated.View>
      <Text style={{ fontSize: sFont(13), color: likedByMe ? '#EC4899' : colors.textMuted, fontWeight: likedByMe ? '600' : '400' }}>
        {likeCount > 0 ? likeCount : ''}
      </Text>
    </Pressable>
  );
}

// ─── TestimonyCard ────────────────────────────────────────────────────────────

function TestimonyCard({
  testimony,
  index,
  userId,
  onOptimisticUpdate,
}: {
  testimony: Testimony;
  index: number;
  userId: string | undefined;
  onOptimisticUpdate: (id: string, liked: boolean, count: number) => void;
}) {
  const colors = useThemeColors();
  const { sFont } = useScaledFont();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350)}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.textMuted + '15',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ padding: 16 }}>
        {/* Author row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AvatarWithFrame
            avatarId={testimony.user.avatarId}
            frameId={testimony.user.frameId}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text }}>
              {testimony.user.nickname}
            </Text>
            <Text style={{ fontSize: sFont(11), color: colors.textMuted, marginTop: 1 }}>
              {formatRelativeDate(testimony.reviewedAt ?? testimony.createdAt)}
            </Text>
          </View>
        </View>

        {/* Testimony text */}
        <Text
          style={{
            fontSize: sFont(14),
            color: colors.text,
            lineHeight: 22,
            fontStyle: 'italic',
            marginBottom: 14,
          }}
        >
          "{testimony.text}"
        </Text>

        {/* Bottom row: like button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.textMuted + '12', paddingTop: 10 }}>
          <HeartButton
            testimonyId={testimony.id}
            likeCount={testimony.likeCount}
            likedByMe={testimony.likedByMe}
            userId={userId}
            onOptimisticUpdate={onOptimisticUpdate}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
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

  const hasApproved = myTestimony?.status === 'APPROVED';
  const hasPending = myTestimony?.status === 'PENDING';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={onClose}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 16,
              paddingTop: 24,
              paddingHorizontal: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40', alignSelf: 'center', marginBottom: 20 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF620', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <MessageSquareHeart size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: sFont(17), fontWeight: '700', color: colors.text }}>Compartir testimonio</Text>
                <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>Lo que Dios ha hecho en tu vida</Text>
              </View>
              <Pressable onPress={onClose} style={{ padding: 4 }}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {hasApproved ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, backgroundColor: '#10B98115', marginBottom: 16 }}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={{ fontSize: sFont(14), color: '#10B981', flex: 1, fontWeight: '500' }}>
                  Tu testimonio ya está publicado.
                </Text>
              </View>
            ) : hasPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, backgroundColor: '#F59E0B15', marginBottom: 16 }}>
                <Clock size={20} color="#F59E0B" />
                <Text style={{ fontSize: sFont(14), color: '#F59E0B', flex: 1, fontWeight: '500' }}>
                  Tu testimonio está en revisión.
                </Text>
              </View>
            ) : myTestimony?.status === 'REJECTED' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, backgroundColor: '#EF444415', marginBottom: 16 }}>
                <XCircle size={20} color="#EF4444" />
                <Text style={{ fontSize: sFont(14), color: '#EF4444', flex: 1, fontWeight: '500' }}>
                  Tu testimonio fue rechazado. Puedes enviar uno nuevo.
                </Text>
              </View>
            ) : null}

            {!hasApproved && (
              <>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Cuenta lo que Dios ha hecho en tu vida..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={500}
                  style={{
                    minHeight: 120,
                    maxHeight: 200,
                    fontSize: sFont(14),
                    color: colors.text,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isValid ? '#8B5CF640' : colors.textMuted + '25',
                    backgroundColor: colors.background,
                    padding: 14,
                    textAlignVertical: 'top',
                    marginBottom: 8,
                  }}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontSize: sFont(12), color: charCount < 20 ? '#EF4444' : colors.textMuted }}>
                    {charCount < 20 ? `Mínimo ${20 - charCount} caracteres más` : ''}
                  </Text>
                  <Text style={{ fontSize: sFont(12), color: charCount > 450 ? '#F59E0B' : colors.textMuted }}>
                    {charCount}/500
                  </Text>
                </View>

                {submitMutation.isError && (
                  <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#EF444415', marginBottom: 12 }}>
                    <Text style={{ fontSize: sFont(13), color: '#EF4444', textAlign: 'center' }}>
                      {(submitMutation.error as Error)?.message ?? 'Error al enviar'}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid || submitMutation.isPending}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: isValid ? '#8B5CF6' : colors.textMuted + '30',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {submitMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Send size={16} color={isValid ? '#FFF' : colors.textMuted} />
                      <Text style={{ fontSize: sFont(15), fontWeight: '700', color: isValid ? '#FFF' : colors.textMuted }}>
                        Enviar testimonio
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TestimoniosFeedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { sFont } = useScaledFont();
  const user = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userId = user?.id;

  const [showShareModal, setShowShareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Optimistic like state: { [testimonyId]: { liked: boolean; count: number } }
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { liked: boolean; count: number }>>({});

  const { data, isLoading, refetch } = useQuery<{ testimonies: Testimony[]; total: number }>({
    queryKey: ['testimonies-feed', userId],
    queryFn: async () => {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/testimonies/approved?limit=50`, {
        headers: userId ? { 'x-user-id': userId } : {},
      });
      if (!res.ok) return { testimonies: [], total: 0 };
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const { data: myTestimonyData } = useQuery<{ testimony: MyTestimony | null }>({
    queryKey: ['my-testimony', userId],
    queryFn: async () => {
      if (!userId) return { testimony: null };
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/testimonies/mine`, {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) return { testimony: null };
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setOptimisticLikes({});
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleOptimisticUpdate = useCallback((id: string, liked: boolean, count: number) => {
    setOptimisticLikes(prev => ({ ...prev, [id]: { liked, count } }));
  }, []);

  const testimonies = (data?.testimonies ?? []).map(t => ({
    ...t,
    likedByMe: optimisticLikes[t.id] !== undefined ? optimisticLikes[t.id].liked : t.likedByMe,
    likeCount: optimisticLikes[t.id] !== undefined ? optimisticLikes[t.id].count : t.likeCount,
  }));

  const renderItem = useCallback(({ item, index }: { item: Testimony; index: number }) => (
    <TestimonyCard
      testimony={item}
      index={index}
      userId={userId}
      onOptimisticUpdate={handleOptimisticUpdate}
    />
  ), [userId, handleOptimisticUpdate]);

  const keyExtractor = useCallback((item: Testimony) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.textMuted + '18',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.background,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(10), fontWeight: '600', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Comunidad
            </Text>
            <Text style={{ fontSize: sFont(18), fontWeight: '800', color: colors.text, marginTop: -1 }}>
              Testimonios
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowShareModal(true);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#8B5CF6',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MessageSquareHeart size={15} color="#FFF" />
            <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#FFF' }}>Compartir</Text>
          </Pressable>
        </View>
      </View>

      {/* Feed */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : testimonies.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <LinearGradient
            colors={['#8B5CF618', '#EC489918']}
            style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
          >
            <MessageSquareHeart size={32} color="#8B5CF6" />
          </LinearGradient>
          <Text style={{ fontSize: sFont(18), fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
            Sin testimonios aún
          </Text>
          <Text style={{ fontSize: sFont(14), color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
            Sé el primero en compartir lo que Dios ha hecho en tu vida.
          </Text>
        </View>
      ) : (
        <FlatList
          data={testimonies}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Submit Modal */}
      <TestimonySubmitModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        userId={userId}
        myTestimony={myTestimonyData?.testimony}
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ['my-testimony', userId] });
          queryClient.invalidateQueries({ queryKey: ['testimonies-feed', userId] });
        }}
      />
    </View>
  );
}
