// Admin Support Screen — Enhanced ticket viewer with systemSnapshot, botPreview, compensate action

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  LifeBuoy,
  Flame,
  BookOpen,
  Volume2,
  Bell,
  Gift,
  ChevronDown,
  ChevronUp,
  Copy,
  MessageSquare,
  Package,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BotPreview {
  summary: string;
  userMessageEs: string;
  userMessageEn?: string;
  action: 'auto_fixed' | 'needs_human' | 'info_only';
}

interface SystemSnapshot {
  nickname: string;
  avatarId?: string;
  country?: string;
  currentStreak?: number;
  lastSnapshotDate?: string;
  lastSnapshotStreak?: number;
  devotionalTodayExists?: boolean;
  devotionalLastClaimDate?: string | null;
  notificationsEnabled?: boolean;
  notificationsHour?: number;
  lastGiftDropId?: string | null;
  lastGiftDropAt?: string | null;
}

interface AdminTicket {
  id: string;
  userId: string;
  type: string;
  claimedStreak: number;
  claimedDate: string;
  clientClaim: Record<string, unknown>;
  status: 'open' | 'auto_fixed' | 'needs_human' | 'closed';
  resolutionNote: string | null;
  beforeState: string;
  afterState: string;
  botPreview: BotPreview;
  createdAt: string;
  systemSnapshot: SystemSnapshot;
}

type RewardType = 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';

interface StoreItemOption {
  id: string;
  type: string;
  nameEs: string;
  nameEn: string;
  rarity: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  streak_missing:         { icon: null, label: '🔥 Racha',          color: '#F97316' },
  devotional_not_counted: { icon: null, label: '📖 Devocional',      color: '#8B5CF6' },
  audio_tts:              { icon: null, label: '🔊 Audio/TTS',       color: '#0EA5E9' },
  notification:           { icon: null, label: '🔔 Notificación',    color: '#EAB308' },
  reward_drop:            { icon: null, label: '🎁 Regalo/Drop',     color: '#22C55E' },
};

const REWARD_TYPES: { value: RewardType; label: string; emoji: string }[] = [
  { value: 'CHEST',  label: 'Cofre',   emoji: '📦' },
  { value: 'THEME',  label: 'Tema',    emoji: '🎨' },
  { value: 'TITLE',  label: 'Título',  emoji: '🏷️' },
  { value: 'AVATAR', label: 'Avatar',  emoji: '👤' },
  { value: 'ITEM',   label: 'Item',    emoji: '⭐' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: AdminTicket['status']): string {
  if (status === 'auto_fixed' || status === 'closed') return '#22C55E';
  if (status === 'needs_human') return '#F59E0B';
  return '#94A3B8';
}

function StatusIcon({ status }: { status: AdminTicket['status'] }) {
  const c = statusColor(status);
  if (status === 'auto_fixed' || status === 'closed') return <CheckCircle size={12} color={c} />;
  if (status === 'needs_human') return <AlertCircle size={12} color={c} />;
  return <Clock size={12} color={c} />;
}

function statusLabel(status: AdminTicket['status'], es: boolean) {
  if (status === 'auto_fixed') return es ? 'Auto-corregido' : 'Auto-fixed';
  if (status === 'needs_human') return es ? 'Requiere revisión' : 'Needs review';
  if (status === 'closed') return es ? 'Cerrado' : 'Closed';
  return es ? 'Abierto' : 'Open';
}

// ─── Compensate Modal ──────────────────────────────────────────────────────────

interface CompensateModalProps {
  ticket: AdminTicket | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
}

function CompensateModal({ ticket, visible, onClose, onSuccess, userId, es, colors }: CompensateModalProps) {
  const [rewardType, setRewardType] = useState<RewardType>('CHEST');
  const [rewardId, setRewardId] = useState('random');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [storeItems, setStoreItems] = useState<StoreItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Pre-fill when ticket changes
  useEffect(() => {
    if (ticket) {
      const nick = ticket.systemSnapshot?.nickname ?? '';
      setTitle(es ? `Compensación para ${nick}` : `Compensation for ${nick}`);
      setMessage(es
        ? `Hola ${nick}, recibimos tu reporte y queremos compensarte por el inconveniente.`
        : `Hi ${nick}, we received your report and want to compensate you for the inconvenience.`);
    }
  }, [ticket, es]);

  // Load store items
  useEffect(() => {
    if (!visible) return;
    setLoadingItems(true);
    fetch(`${BACKEND_URL}/api/gifts/admin/store-items`, {
      headers: { 'X-User-Id': userId },
    })
      .then(r => r.json())
      .then((d: { items?: StoreItemOption[] }) => setStoreItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, [visible, userId]);

  const filteredItems = storeItems.filter(i => i.type === rewardType);

  const handleSend = async () => {
    if (!ticket || !title.trim() || !message.trim() || !rewardId.trim()) {
      Alert.alert(es ? 'Completa todos los campos' : 'Fill all fields');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/admin/compensate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          ticketId: ticket.id,
          targetUserId: ticket.userId,
          title: title.trim(),
          message: message.trim(),
          rewardType,
          rewardId: rewardId.trim(),
        }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(es ? 'Error' : 'Error', String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={onClose}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 40,
              gap: 16,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40' }} />
            </View>

            {/* Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: '#22C55E18',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Gift size={18} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                  {es ? 'Compensar con regalo' : 'Compensate with gift'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                  {ticket?.systemSnapshot?.nickname} · {ticket?.userId?.slice(0, 10)}…
                </Text>
              </View>
            </View>

            {/* Reward Type Pills */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {es ? 'Tipo de premio' : 'Reward type'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {REWARD_TYPES.map(rt => (
                    <Pressable
                      key={rt.value}
                      onPress={() => { setRewardType(rt.value); setRewardId('random'); }}
                      style={({ pressed }) => ({
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        backgroundColor: rewardType === rt.value ? colors.primary : colors.background,
                        borderWidth: 1.5,
                        borderColor: rewardType === rt.value ? colors.primary : colors.textMuted + '30',
                        opacity: pressed ? 0.8 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      })}
                    >
                      <Text>{rt.emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: rewardType === rt.value ? '#FFF' : colors.text }}>
                        {rt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Reward ID Picker */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {es ? 'Premio' : 'Reward'}
              </Text>
              {loadingItems ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : filteredItems.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {filteredItems.map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => setRewardId(item.id)}
                        style={({ pressed }) => ({
                          paddingVertical: 7,
                          paddingHorizontal: 12,
                          borderRadius: 14,
                          backgroundColor: rewardId === item.id ? colors.primary + '20' : colors.background,
                          borderWidth: 1.5,
                          borderColor: rewardId === item.id ? colors.primary : colors.textMuted + '25',
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: rewardId === item.id ? colors.primary : colors.text }}>
                          {item.nameEs}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <TextInput
                  value={rewardId}
                  onChangeText={setRewardId}
                  placeholder={es ? 'ID del premio (ej: random)' : 'Reward ID (e.g. random)'}
                  placeholderTextColor={colors.textMuted + '80'}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    padding: 12,
                    color: colors.text,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: colors.textMuted + '25',
                  }}
                />
              )}
            </View>

            {/* Title & Message */}
            <View style={{ gap: 10 }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={es ? 'Título del regalo' : 'Gift title'}
                placeholderTextColor={colors.textMuted + '80'}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.text,
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: colors.textMuted + '25',
                }}
              />
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={es ? 'Mensaje para el usuario' : 'Message for the user'}
                placeholderTextColor={colors.textMuted + '80'}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.text,
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: colors.textMuted + '25',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* Send Button */}
            <Pressable
              onPress={handleSend}
              disabled={sending}
              style={({ pressed }) => ({
                backgroundColor: '#22C55E',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: pressed || sending ? 0.75 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#22C55E',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              })}
            >
              {sending
                ? <ActivityIndicator size="small" color="#FFF" />
                : <>
                    <Gift size={18} color="#FFF" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>
                      {es ? 'Enviar regalo' : 'Send gift'}
                    </Text>
                  </>
              }
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Bot Preview Modal ─────────────────────────────────────────────────────────

function BotPreviewModal({
  preview,
  visible,
  onClose,
  es,
  colors,
}: {
  preview: BotPreview | null;
  visible: boolean;
  onClose: () => void;
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const message = preview?.userMessageEs ?? '';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#0EA5E918', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} color="#0EA5E9" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 }}>
              {es ? 'Respuesta sugerida' : 'Suggested response'}
            </Text>
          </View>

          {/* Summary badge */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 12,
            marginBottom: 14,
          }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>
              {preview?.summary}
            </Text>
          </View>

          {/* Message */}
          <View style={{
            backgroundColor: colors.primary + '10',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.primary + '25',
          }}>
            <Text style={{ fontSize: 13, color: colors.text, lineHeight: 20 }}>
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Copy size={15} color="#FFF" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
                {es ? 'Copiar' : 'Copy'}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                paddingVertical: 13,
                paddingHorizontal: 20,
                borderRadius: 14,
                backgroundColor: colors.textMuted + '18',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
                {es ? 'Cerrar' : 'Close'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Ticket Card ───────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  index,
  es,
  colors,
  onCompensate,
  onBotPreview,
  userId,
}: {
  ticket: AdminTicket;
  index: number;
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onCompensate: (t: AdminTicket) => void;
  onBotPreview: (t: AdminTicket) => void;
  userId: string;
}) {
  const [snapshotExpanded, setSnapshotExpanded] = useState(false);

  const typeInfo = TYPE_LABELS[ticket.type] ?? { label: ticket.type, color: '#94A3B8' };
  const sColor = statusColor(ticket.status);

  const handleCopyUid = async () => {
    await Clipboard.setStringAsync(ticket.userId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const ss = ticket.systemSnapshot;

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 25).duration(350)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 18,
        marginBottom: 12,
        borderLeftWidth: 3.5,
        borderLeftColor: sColor,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 16 }}>
        {/* Row 1: Nickname + type badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, flex: 1 }} numberOfLines={1}>
            {ss?.nickname ?? '—'}
          </Text>
          <View style={{
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 12,
            backgroundColor: typeInfo.color + '20',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: typeInfo.color }}>
              {typeInfo.label}
            </Text>
          </View>
        </View>

        {/* Row 2: UID + copy + date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>
            {ticket.userId.slice(0, 18)}…
          </Text>
          <Pressable
            onPress={handleCopyUid}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Copy size={12} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Row 3: Status + date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <StatusIcon status={ticket.status} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: sColor }}>
            {statusLabel(ticket.status, es)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4 }}>
            · {new Date(ticket.createdAt).toLocaleString(es ? 'es-CR' : 'en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Bot summary line */}
        {ticket.botPreview?.summary ? (
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            paddingVertical: 7,
            paddingHorizontal: 10,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }} numberOfLines={2}>
              {ticket.botPreview.summary}
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Bot preview */}
          <Pressable
            onPress={() => onBotPreview(ticket)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: '#0EA5E915',
              borderWidth: 1,
              borderColor: '#0EA5E930',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <MessageSquare size={13} color="#0EA5E9" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#0EA5E9' }}>
              {es ? 'Ver respuesta' : 'Bot response'}
            </Text>
          </Pressable>

          {/* Compensate — show for needs_human, auto_fixed, open (not closed) */}
          {ticket.status !== 'closed' && (
            <Pressable
              onPress={() => onCompensate(ticket)}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: '#22C55E15',
                borderWidth: 1,
                borderColor: '#22C55E30',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Gift size={13} color="#22C55E" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#22C55E' }}>
                {es ? 'Compensar' : 'Compensate'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* System Snapshot Toggle */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSnapshotExpanded(prev => !prev);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            paddingVertical: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Package size={13} color={colors.textMuted} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, flex: 1 }}>
            {es ? 'Estado técnico' : 'System snapshot'}
          </Text>
          {snapshotExpanded
            ? <ChevronUp size={14} color={colors.textMuted} />
            : <ChevronDown size={14} color={colors.textMuted} />
          }
        </Pressable>
      </View>

      {/* Snapshot panel */}
      {snapshotExpanded && ss && (
        <View style={{
          backgroundColor: colors.background,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 5,
          borderTopWidth: 1,
          borderTopColor: colors.textMuted + '15',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            System Snapshot
          </Text>

          <SnapshotRow label="Racha actual" value={ss.currentStreak !== undefined ? `🔥 ${ss.currentStreak}` : '—'} colors={colors} />
          <SnapshotRow label="Snapshot racha" value={ss.lastSnapshotStreak !== undefined ? `${ss.lastSnapshotStreak}` : '—'} colors={colors} />
          <SnapshotRow label="Snapshot fecha" value={ss.lastSnapshotDate ?? '—'} colors={colors} />
          <SnapshotRow label="Devocional hoy" value={ss.devotionalTodayExists ? '✅ Sí' : '❌ No'} colors={colors} />
          <SnapshotRow label="Último devocional" value={ss.devotionalLastClaimDate ?? '—'} colors={colors} />
          <SnapshotRow label="País" value={ss.country ?? '—'} colors={colors} />
          <SnapshotRow label="Notificaciones" value={ss.notificationsEnabled !== undefined ? (ss.notificationsEnabled ? `✅ ${ss.notificationsHour ?? '?'}:00` : '❌ Off') : '—'} colors={colors} />
          {ss.lastGiftDropId && (
            <SnapshotRow label="Último gift" value={ss.lastGiftDropId.slice(0, 12) + '…'} colors={colors} />
          )}
          {ticket.resolutionNote && (
            <View style={{
              marginTop: 8,
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.textMuted + '20',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                Resolution note
              </Text>
              <Text style={{ fontSize: 11, color: colors.text + 'CC', lineHeight: 17 }}>
                {ticket.resolutionNote}
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

function SnapshotRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, color: colors.textMuted, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'right', maxWidth: '55%' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AdminSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const userId = user?.id ?? '';
  const es = language === 'es';

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [compensateTicket, setCompensateTicket] = useState<AdminTicket | null>(null);
  const [compensateVisible, setCompensateVisible] = useState(false);

  const [botTicket, setBotTicket] = useState<AdminTicket | null>(null);
  const [botVisible, setBotVisible] = useState(false);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/admin/tickets?limit=50`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { tickets: AdminTicket[] };
      setTickets(data.tickets ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const counts = {
    total: tickets.length,
    auto_fixed: tickets.filter(t => t.status === 'auto_fixed').length,
    needs_human: tickets.filter(t => t.status === 'needs_human').length,
    open: tickets.filter(t => t.status === 'open').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 20,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.textMuted + '18',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <LifeBuoy size={20} color="#F59E0B" />
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 }}>
          {es ? 'Admin — Tickets' : 'Admin — Tickets'}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>
          {counts.total}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <AlertCircle size={40} color={colors.textMuted} />
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 16, textAlign: 'center', lineHeight: 20 }}>
            {error}
          </Text>
          <Pressable
            onPress={() => fetchTickets()}
            style={({ pressed }) => ({
              marginTop: 20, paddingVertical: 12, paddingHorizontal: 28,
              borderRadius: 12, backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
              {es ? 'Reintentar' : 'Retry'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchTickets(true)} tintColor={colors.primary} />
          }
        >
          {/* Summary chips */}
          <Animated.View
            entering={FadeInDown.delay(40).duration(350)}
            style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
          >
            {[
              { label: `${counts.auto_fixed} auto-fixed`,   color: '#22C55E' },
              { label: `${counts.needs_human} revisión`,    color: '#F59E0B' },
              { label: `${counts.open} open`,               color: '#94A3B8' },
              { label: `${counts.closed} closed`,           color: colors.textMuted },
            ].map(chip => (
              <View
                key={chip.label}
                style={{
                  paddingVertical: 5, paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: chip.color + '18',
                  borderWidth: 1, borderColor: chip.color + '40',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: chip.color }}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </Animated.View>

          {tickets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <CheckCircle size={40} color={colors.textMuted + '60'} />
              <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 16 }}>
                {es ? 'Sin tickets aún' : 'No tickets yet'}
              </Text>
            </View>
          ) : (
            tickets.map((ticket, i) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={i}
                es={es}
                colors={colors}
                userId={userId}
                onCompensate={(t) => {
                  setCompensateTicket(t);
                  setCompensateVisible(true);
                }}
                onBotPreview={(t) => {
                  setBotTicket(t);
                  setBotVisible(true);
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Compensate Modal */}
      <CompensateModal
        ticket={compensateTicket}
        visible={compensateVisible}
        onClose={() => setCompensateVisible(false)}
        onSuccess={() => fetchTickets()}
        userId={userId}
        es={es}
        colors={colors}
      />

      {/* Bot Preview Modal */}
      <BotPreviewModal
        preview={botTicket?.botPreview ?? null}
        visible={botVisible}
        onClose={() => setBotVisible(false)}
        es={es}
        colors={colors}
      />
    </View>
  );
}
