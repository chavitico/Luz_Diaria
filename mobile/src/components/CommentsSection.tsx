import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Send, Heart, Trash2, MessageCircle } from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, getContrastText } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { DEFAULT_AVATARS, AVATAR_FRAMES } from '@/lib/constants';
import {
  getComments,
  postComment,
  likeComment,
  deleteComment,
  DevotionalComment,
} from '@/lib/comments-api';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function CommentAvatar({
  avatarId,
  frameId,
}: {
  avatarId: string;
  frameId?: string | null;
}) {
  const colors = useThemeColors();
  const avatar = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  const frameColor = frameId ? AVATAR_FRAMES[frameId]?.color : null;
  const emoji = avatar?.emoji ?? '🙏';
  const size = 36;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: frameColor ? 2 : 1.5,
        borderColor: frameColor || colors.primary + '30',
        backgroundColor: colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

// ─── Like Button ──────────────────────────────────────────────────────────────

function LikeButton({
  commentId,
  liked,
  count,
  userId,
  colors,
}: {
  commentId: string;
  liked: boolean;
  count: number;
  userId: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const queryClient = useQueryClient();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { mutate } = useMutation({
    mutationFn: () => likeComment(commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.3, { damping: 6 }, () => {
      scale.value = withSpring(1, { damping: 8 });
    });
    mutate();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={animStyle}>
        <Heart
          size={14}
          color={liked ? '#E04E6B' : colors.textMuted}
          fill={liked ? '#E04E6B' : 'transparent'}
        />
      </Animated.View>
      {count > 0 && (
        <Text
          style={{
            fontSize: 12,
            color: liked ? '#E04E6B' : colors.textMuted,
            fontWeight: liked ? '600' : '400',
          }}
        >
          {count}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Render @mention with highlight ──────────────────────────────────────────

function CommentText({
  text,
  colors,
  fontSize,
}: {
  text: string;
  colors: ReturnType<typeof useThemeColors>;
  fontSize: number;
}) {
  const parts = text.split(/(@\w+)/g);
  return (
    <Text style={{ fontSize, color: colors.text, lineHeight: fontSize * 1.5 }}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Text key={i} style={{ color: colors.primary, fontWeight: '600' }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

// ─── Single Comment Row ───────────────────────────────────────────────────────

function CommentRow({
  comment,
  currentUserId,
  userRole,
  colors,
  language,
  onDelete,
}: {
  comment: DevotionalComment;
  currentUserId: string;
  userRole: string;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onDelete: (id: string) => void;
}) {
  const { sFont } = useScaledFont();

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return language === 'es' ? 'ahora' : 'now';
    if (hrs < 1) return `${mins}m`;
    if (days < 1) return `${hrs}h`;
    return `${days}d`;
  };

  const isMod = userRole === 'MODERATOR' || userRole === 'OWNER';

  const handleDeletePress = () => {
    if (!isMod) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      language === 'es' ? '¿Eliminar comentario?' : 'Delete comment?',
      language === 'es' ? 'Esta acción no se puede deshacer.' : 'This action cannot be undone.',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Eliminar' : 'Delete',
          style: 'destructive',
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  };

  return (
    <Pressable
      onLongPress={isMod ? handleDeletePress : undefined}
      style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}
    >
      <CommentAvatar avatarId={comment.user.avatarId} frameId={comment.user.frameId} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.text }}>
            {comment.user.nickname}
          </Text>
          <Text style={{ fontSize: sFont(11), color: colors.textMuted }}>
            {timeAgo(comment.createdAt)}
          </Text>
          {isMod && (
            <Pressable
              onPress={handleDeletePress}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={{ marginLeft: 'auto' }}
            >
              <Trash2 size={12} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <CommentText text={comment.text} colors={colors} fontSize={sFont(13.5)} />
        <View style={{ marginTop: 6 }}>
          <LikeButton
            commentId={comment.id}
            liked={comment.likedByMe}
            count={comment.likeCount}
            userId={currentUserId}
            colors={colors}
          />
        </View>
      </View>
    </Pressable>
  );
}

// ─── CommentsSection (exported) ───────────────────────────────────────────────

export function CommentsSection({
  devotionalDate,
  scrollViewRef,
}: {
  devotionalDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollViewRef?: React.RefObject<any>;
}) {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const { sFont } = useScaledFont();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  const inputContainerRef = useRef<View>(null);
  const [draft, setDraft] = useState('');

  // Computed once — icon color that's always readable on the primary bg
  const sendIconColor = getContrastText(colors.primary);

  const userId = user?.id ?? '';

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', devotionalDate, userId],
    queryFn: () => getComments(devotionalDate, userId || undefined),
    staleTime: 30_000,
  });

  const { mutate: submitComment, isPending: isPosting } = useMutation({
    mutationFn: (text: string) => postComment(devotionalDate, text, userId),
    onSuccess: (newComment) => {
      if (!newComment) return;
      queryClient.setQueryData(
        ['comments', devotionalDate, userId],
        (old: DevotionalComment[] = []) => [...old, newComment]
      );
      setDraft('');
    },
  });

  const { mutate: removeComment } = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId, userId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(
        ['comments', devotionalDate, userId],
        (old: DevotionalComment[] = []) => old.filter((c) => c.id !== commentId)
      );
    },
  });

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    submitComment(text);
  }, [draft, userId, submitComment]);

  const handleDelete = useCallback(
    (id: string) => {
      removeComment(id);
    },
    [removeComment]
  );

  // When input is focused, scroll so the input row is visible above the keyboard
  const handleInputFocus = useCallback(() => {
    if (!scrollViewRef?.current || !inputContainerRef.current) return;
    // Small delay to let the keyboard start appearing
    setTimeout(() => {
      inputContainerRef.current?.measureLayout(
        // @ts-ignore — scrollView node handle
        scrollViewRef.current as unknown as number,
        (x, y, width, height) => {
          scrollViewRef.current?.scrollTo({ y: y + height + 20, animated: true });
        },
        () => {} // error cb
      );
    }, 150);
  }, [scrollViewRef]);

  if (!user) return null;

  const userAvatar = user.avatar ?? 'avatar_dove';
  const userRole = user.role ?? 'USER';

  return (
    <View style={{ marginTop: 32 }}>
      {/* Header — plain label, no interactive element */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          paddingHorizontal: 2,
        }}
      >
        <MessageCircle size={16} color={colors.primary} />
        <Text
          style={{
            fontSize: sFont(15),
            fontWeight: '700',
            color: colors.text,
            letterSpacing: 0.3,
          }}
        >
          {language === 'es' ? 'Comentarios' : 'Comments'}
        </Text>
        {comments.length > 0 && (
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: sFont(11), color: getContrastText(colors.primary), fontWeight: '700' }}>
              {comments.length}
            </Text>
          </View>
        )}
      </View>

      {/* Comment list */}
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
      ) : comments.length === 0 ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: sFont(13), color: colors.textMuted }}>
            {language === 'es' ? 'Sé el primero en comentar' : 'Be the first to comment'}
          </Text>
        </View>
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.primary + '15' }}>
          {comments.map((comment, idx) => (
            <View key={comment.id}>
              <CommentRow
                comment={comment}
                currentUserId={userId}
                userRole={userRole}
                colors={colors}
                language={language}
                onDelete={handleDelete}
              />
              {idx < comments.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.primary + '0C',
                    marginLeft: 46,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Input area */}
      <View
        ref={inputContainerRef}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: colors.primary + '15',
        }}
      >
        <CommentAvatar avatarId={userAvatar} frameId={user.frameId} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: colors.primary + '25',
            paddingHorizontal: 14,
            paddingVertical: 8,
            minHeight: 40,
            justifyContent: 'center',
          }}
        >
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            onFocus={handleInputFocus}
            placeholder={language === 'es' ? 'Escribe un comentario...' : 'Write a comment...'}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            style={{
              fontSize: sFont(13.5),
              color: colors.text,
              lineHeight: sFont(20),
            }}
          />
        </View>
        {/* Send button — always uses contrast-safe icon color against primary bg */}
        <Pressable
          onPress={handleSend}
          disabled={isPosting}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : draft.trim() ? 1 : 0.45,
          })}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color={sendIconColor} />
          ) : (
            <Send size={16} color={sendIconColor} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
