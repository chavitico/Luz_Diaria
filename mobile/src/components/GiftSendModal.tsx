// GiftSendModal — lets a user send a store item as a gift to another user
// Flow: search → select → write message → confirm → send

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Gift, X, Search, User as UserIcon, Check, ChevronRight, Coins } from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { ActionButton } from '@/components/ui/ActionButton';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserResult {
  id: string;
  nickname: string;
  avatarId: string;
  frameId: string | null;
  titleId: string | null;
}

export interface GiftSendItem {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
  rarity: string;
  emoji?: string;
}

interface GiftSendModalProps {
  visible: boolean;
  onClose: () => void;
  item: GiftSendItem | null;
}

type Step = 'search' | 'confirm';

// ─── Avatar emoji map (same as store) ─────────────────────────────────────────
const AVATAR_EMOJI_MAP: Record<string, string> = {
  avatar_dove: '🕊️', avatar_cross: '✝️', avatar_fish: '🐟',
  avatar_star: '⭐', avatar_flame: '🕯️', avatar_leaf: '🌿',
  avatar_sun: '☀️', avatar_moon: '🌙',
};

function AvatarChip({ avatarId }: { avatarId: string }) {
  return (
    <View style={{
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: '#F3F4F6',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 18 }}>{AVATAR_EMOJI_MAP[avatarId] ?? '👤'}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GiftSendModal({ visible, onClose, item }: GiftSendModalProps) {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const es = language === 'es';

  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Shimmer animation for success
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep('search');
        setQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setMessage('');
        setSending(false);
        setError(null);
        setSuccess(false);
      }, 300);
    }
  }, [visible]);

  // Success animation
  useEffect(() => {
    if (success) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ),
      ]).start();
    }
  }, [success]);

  // Live user search
  const doSearch = useCallback(async (q: string) => {
    if (!user?.id || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetchWithTimeout(
        `${BACKEND_URL}/api/store/gift/search-users?q=${encodeURIComponent(q)}`,
        { headers: { 'X-User-Id': user.id } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users ?? []);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }, [user?.id]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => doSearch(text), 300);
  };

  const handleSelectUser = (u: UserResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUser(u);
    setError(null);
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!user?.id || !selectedUser || !item) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/store/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUserId: user.id,
          receiverUserId: selectedUser.id,
          itemId: item.id,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, string> = {
          INSUFFICIENT_POINTS: es ? 'No tienes suficientes puntos' : 'Not enough points',
          DAILY_LIMIT_REACHED: es ? 'Alcanzaste el límite diario de 3 regalos' : 'Daily limit of 3 gifts reached',
          WEEKLY_LIMIT_REACHED: es ? 'Alcanzaste el límite semanal de 20 regalos' : 'Weekly limit of 20 gifts reached',
          ITEM_NOT_GIFTABLE: es ? 'Este artículo no se puede regalar' : 'This item cannot be gifted',
          RECEIVER_NOT_FOUND: es ? 'Usuario no encontrado' : 'User not found',
          CANNOT_GIFT_SELF: es ? 'No puedes regalarte a ti mismo' : 'You cannot gift yourself',
        };
        setError(errMap[data.error] ?? (es ? 'Ocurrió un error. Inténtalo de nuevo.' : 'An error occurred. Try again.'));
        setSending(false);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      setError(es ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Try again.');
      setSending(false);
    }
  };

  if (!item) return null;

  const itemName = es ? item.nameEs : item.nameEn;
  const rarityColors: Record<string, string> = {
    common: '#9CA3AF', rare: '#3B82F6', epic: '#A855F7', legendary: '#D4A017',
  };
  const rarityColor = rarityColors[item.rarity] ?? rarityColors.common;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end' }}
          onPress={step === 'search' ? onClose : undefined}
        >
          <BlurView intensity={40} tint="dark" style={{ ...StyleSheet.absoluteFillObject }} />

          <Animated.View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 8,
              paddingBottom: insets.bottom + 24,
              maxHeight: '88%',
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#F59E0B20',
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Gift size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                  {es ? 'Enviar regalo' : 'Send a gift'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                  {itemName} · <Text style={{ color: rarityColor, fontWeight: '700' }}>
                    {item.price.toLocaleString()} pts
                  </Text>
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* SUCCESS STATE */}
            {success ? (
              <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 8, paddingBottom: 16, gap: 16 }}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Animated.View style={{
                    width: 96, height: 96, borderRadius: 48,
                    backgroundColor: '#F59E0B',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
                  }}>
                    <Text style={{ fontSize: 44 }}>🎁</Text>
                  </Animated.View>
                </Animated.View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
                  {es ? '¡Regalo enviado!' : 'Gift sent!'}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
                  {es
                    ? `Enviaste "${itemName}" a @${selectedUser?.nickname}`
                    : `You sent "${itemName}" to @${selectedUser?.nickname}`}
                </Text>
                <ActionButton
                  label={es ? 'Cerrar' : 'Close'}
                  variant="secondary"
                  onPress={onClose}
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : step === 'search' ? (
              // ── SEARCH STEP ──
              <View style={{ flex: 0 }}>
                {/* Search input */}
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: colors.background,
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
                    borderWidth: 1, borderColor: colors.textMuted + '25',
                  }}>
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                      value={query}
                      onChangeText={handleQueryChange}
                      placeholder={es ? 'Buscar por nombre de usuario…' : 'Search by username…'}
                      placeholderTextColor={colors.textMuted + '80'}
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{ flex: 1, color: colors.text, fontSize: 15 }}
                    />
                    {searching && <ActivityIndicator size="small" color={colors.primary} />}
                  </View>
                </View>

                {/* Results */}
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 280 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                >
                  {query.length >= 2 && !searching && searchResults.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                      <UserIcon size={36} color={colors.textMuted + '60'} />
                      <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 10, textAlign: 'center' }}>
                        {es ? 'No se encontraron usuarios' : 'No users found'}
                      </Text>
                    </View>
                  )}
                  {searchResults.map((u) => (
                    <Pressable
                      key={u.id}
                      onPress={() => handleSelectUser(u)}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center',
                        paddingVertical: 12, paddingHorizontal: 14,
                        backgroundColor: pressed ? colors.primary + '10' : colors.background,
                        borderRadius: 14, marginBottom: 6,
                        borderWidth: 1, borderColor: colors.textMuted + '20',
                      })}
                    >
                      <AvatarChip avatarId={u.avatarId} />
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 12 }}>
                        @{u.nickname}
                      </Text>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </Pressable>
                  ))}
                  {query.length < 2 && (
                    <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>
                      {es ? 'Escribe al menos 2 caracteres' : 'Type at least 2 characters'}
                    </Text>
                  )}
                </ScrollView>
              </View>
            ) : (
              // ── CONFIRM STEP ──
              <View style={{ paddingHorizontal: 20, gap: 16 }}>
                {/* Recipient chip */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: colors.background, borderRadius: 16,
                  padding: 14, borderWidth: 1, borderColor: colors.primary + '30',
                }}>
                  <AvatarChip avatarId={selectedUser!.avatarId} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 1 }}>
                      {es ? 'Para' : 'To'}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                      @{selectedUser!.nickname}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => { setSelectedUser(null); setStep('search'); setError(null); }}
                    hitSlop={10}
                  >
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                      {es ? 'Cambiar' : 'Change'}
                    </Text>
                  </Pressable>
                </View>

                {/* Message */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                    {es ? 'Mensaje (opcional)' : 'Message (optional)'}
                  </Text>
                  <TextInput
                    value={message}
                    onChangeText={(t) => setMessage(t.slice(0, 120))}
                    placeholder={es ? '¡Espero que te guste este regalo! 🙏' : 'Hope you enjoy this gift! 🙏'}
                    placeholderTextColor={colors.textMuted + '70'}
                    multiline
                    numberOfLines={3}
                    maxLength={120}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 14, padding: 14,
                      color: colors.text, fontSize: 14, lineHeight: 20,
                      minHeight: 76, textAlignVertical: 'top',
                      borderWidth: 1, borderColor: colors.textMuted + '25',
                    }}
                  />
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 }}>
                    {message.length}/120
                  </Text>
                </View>

                {/* Cost summary */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: rarityColor + '10', borderRadius: 14,
                  paddingHorizontal: 16, paddingVertical: 12,
                  borderWidth: 1, borderColor: rarityColor + '30',
                }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: rarityColor, marginBottom: 2 }}>
                      {es ? 'ARTÍCULO' : 'ITEM'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                      {itemName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 2 }}>
                      {es ? 'COSTO' : 'COST'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Coins size={14} color="#F59E0B" />
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#F59E0B' }}>
                        {item.price.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Error */}
                {error && (
                  <View style={{
                    backgroundColor: '#EF444415', borderRadius: 12,
                    padding: 12, borderWidth: 1, borderColor: '#EF444440',
                  }}>
                    <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600', textAlign: 'center' }}>
                      {error}
                    </Text>
                  </View>
                )}

                <ActionButton
                  label={sending ? (es ? 'Enviando…' : 'Sending…') : (es ? `Regalar a @${selectedUser!.nickname}` : `Gift to @${selectedUser!.nickname}`)}
                  icon={(color, size) => <Gift size={size} color={color} />}
                  fillColor="#F59E0B"
                  loading={sending}
                  disabled={sending}
                  onPress={handleSend}
                />
              </View>
            )}
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

