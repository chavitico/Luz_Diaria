// Support Screen — Multi-category issue reporter with live ticket history

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  LifeBuoy,
  Flame,
  BookOpen,
  Volume2,
  Bell,
  Gift,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  Send,
  Star,
  MessageCircle,
  Zap,
  User as UserIcon,
  Shield,
  Info,
  ShoppingBag,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser, useIsDarkMode } from '@/lib/store';
import { pickReadableTextColor } from '@/lib/contrast';
import { ActionButton } from '@/components/ui/ActionButton';
import { getNotificationSettings } from '@/lib/notifications';
import { pickBestVoice } from '@/lib/voice-picker';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

type Category =
  | 'streak_missing'
  | 'devotional_not_counted'
  | 'audio_tts'
  | 'notification'
  | 'reward_drop'
  | 'purchase_not_delivered';

type TicketStatus = 'open' | 'auto_fixed' | 'needs_human' | 'waiting_user' | 'closed';

interface TicketSummary {
  id: string;
  incidentNumber: string | null;
  type: string;
  status: TicketStatus;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  latestEvent: {
    actor: string;
    type: string;
    message: string;
    createdAt: string;
  } | null;
}

interface TicketEvent {
  id: string;
  actor: string;
  type: string;
  message: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  incidentNumber: string | null;
  type: string;
  status: TicketStatus;
  rating: number | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  events: TicketEvent[];
}

// ─── Category definitions ──────────────────────────────────────────────────────

interface CategoryDef {
  type: Category;
  renderIcon: (color: string) => React.ReactNode;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  color: string;
}

function useCategoryDefs(): CategoryDef[] {
  return [
    {
      type: 'streak_missing',
      renderIcon: (c) => <Flame size={20} color={c} />,
      titleEs: 'Perdí mi racha',
      titleEn: 'Lost my streak',
      subtitleEs: 'Completé el devocional pero mi racha se reinició',
      subtitleEn: 'I completed the devotional but my streak was reset',
      color: '#F97316',
    },
    {
      type: 'devotional_not_counted',
      renderIcon: (c) => <BookOpen size={20} color={c} />,
      titleEs: 'Devocional no contado',
      titleEn: 'Devotional not counted',
      subtitleEs: 'Leí el devocional pero no aparece como completado',
      subtitleEn: 'I read the devotional but it shows as incomplete',
      color: '#8B5CF6',
    },
    {
      type: 'audio_tts',
      renderIcon: (c) => <Volume2 size={20} color={c} />,
      titleEs: 'Problema de audio / TTS',
      titleEn: 'Audio / TTS issue',
      subtitleEs: 'Sin sonido, se repite, se corta o cambió la voz',
      subtitleEn: 'No sound, repeats, cuts off, or voice changed',
      color: '#0EA5E9',
    },
    {
      type: 'notification',
      renderIcon: (c) => <Bell size={20} color={c} />,
      titleEs: 'Problema con notificaciones',
      titleEn: 'Notification issue',
      subtitleEs: 'No recibo notificaciones, llegan tarde o duplicadas',
      subtitleEn: 'Not receiving, late, or duplicate notifications',
      color: '#EAB308',
    },
    {
      type: 'reward_drop',
      renderIcon: (c) => <Gift size={20} color={c} />,
      titleEs: 'Regalo / Cofre no recibido',
      titleEn: 'Gift / Drop not received',
      subtitleEs: 'No recibí el regalo o el cofre no abre',
      subtitleEn: "Didn't receive the gift or chest won't open",
      color: '#22C55E',
    },
    {
      type: 'purchase_not_delivered' as const,
      renderIcon: (c) => <ShoppingBag size={20} color={c} />,
      titleEs: 'Compra / Ítem no entregado',
      titleEn: 'Purchase / Item Not Delivered',
      subtitleEs: 'Te descontaron puntos pero no recibiste el ítem o bundle',
      subtitleEn: 'Points were deducted but you did not receive the item or bundle',
      color: '#EC4899',
    },
  ];
}

// ─── Sub-option selectors ──────────────────────────────────────────────────────

interface SubOption {
  value: string;
  labelEs: string;
  labelEn: string;
}

const AUDIO_ISSUES: SubOption[] = [
  { value: 'no_sound',      labelEs: 'Sin sonido',                labelEn: 'No sound' },
  { value: 'repeats',       labelEs: 'Se repite constantemente',  labelEn: 'Keeps repeating' },
  { value: 'cuts',          labelEs: 'Se corta o se interrumpe',  labelEn: 'Cuts off / interrupted' },
  { value: 'voice_changed', labelEs: 'Cambió la voz',             labelEn: 'Voice changed' },
  { value: 'voz_rara',      labelEs: 'Voz rara / robótica',       labelEn: 'Weird / robotic voice' },
];
const NOTIFICATION_ISSUES: SubOption[] = [
  { value: 'not_received', labelEs: 'No las recibo',          labelEn: 'Not receiving them' },
  { value: 'late',         labelEs: 'Llegan tarde',           labelEn: 'Arriving late' },
  { value: 'duplicate',    labelEs: 'Recibo duplicadas',      labelEn: 'Getting duplicates' },
];
const DROP_ISSUES: SubOption[] = [
  { value: 'not_received', labelEs: 'No recibí el regalo',    labelEn: "Didn't receive gift" },
  { value: 'open_failed',  labelEs: 'El cofre no abre',       labelEn: "Chest won't open" },
];

function SubOptionPicker({
  options, selected, onSelect, es, colors,
}: {
  options: SubOption[];
  selected: string | null;
  onSelect: (v: string) => void;
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={{ gap: 8, marginTop: 16 }}>
      <Text style={{
        fontSize: 12, fontWeight: '700', color: colors.textMuted,
        letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4,
      }}>
        {es ? '¿Qué ocurre?' : 'What happened?'}
      </Text>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(opt.value);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 13,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: selected === opt.value ? colors.primary + '15' : colors.surface,
            borderWidth: 1.5,
            borderColor: selected === opt.value ? colors.primary + '80' : 'transparent',
            opacity: pressed ? 0.8 : 1,
            gap: 12,
          })}
        >
          <View style={{
            width: 18, height: 18, borderRadius: 9,
            borderWidth: 2,
            borderColor: selected === opt.value ? colors.primary : colors.textMuted + '50',
            backgroundColor: selected === opt.value ? colors.primary : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {selected === opt.value && (
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primaryText }} />
            )}
          </View>
          <Text style={{
            fontSize: 14, fontWeight: selected === opt.value ? '700' : '500',
            color: selected === opt.value ? colors.primary : colors.text,
            flex: 1,
          }}>
            {es ? opt.labelEs : opt.labelEn}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0]!;
  }
}

function statusColor(status: TicketStatus): string {
  if (status === 'auto_fixed' || status === 'closed') return '#22C55E';
  if (status === 'needs_human') return '#F59E0B';
  if (status === 'waiting_user') return '#0EA5E9';
  return '#94A3B8';
}

function statusLabel(status: TicketStatus, es: boolean): string {
  if (status === 'auto_fixed') return es ? 'Resuelto' : 'Resolved';
  if (status === 'closed') return es ? 'Cerrado' : 'Closed';
  if (status === 'needs_human') return es ? 'En revisión' : 'Under review';
  if (status === 'waiting_user') return es ? 'Tu respuesta' : 'Reply needed';
  return es ? 'Pendiente' : 'Pending';
}

function timeAgo(iso: string, es: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return es ? `hace ${days}d` : `${days}d ago`;
  if (hrs > 0) return es ? `hace ${hrs}h` : `${hrs}h ago`;
  if (mins > 0) return es ? `hace ${mins}m` : `${mins}m ago`;
  return es ? 'ahora mismo' : 'just now';
}

function eventIcon(type: string, actor: string) {
  if (type === 'AUTO_FIX') return { icon: Zap, color: '#22C55E' };
  if (type === 'COMPENSATION') return { icon: Gift, color: '#F59E0B' };
  if (type === 'CLOSED' || type === 'RATING') return { icon: CheckCircle, color: '#22C55E' };
  if (type === 'REQUEST_INFO') return { icon: Info, color: '#0EA5E9' };
  if (actor === 'USER') return { icon: UserIcon, color: '#94A3B8' };
  if (actor === 'ADMIN') return { icon: Shield, color: '#8B5CF6' };
  return { icon: MessageCircle, color: '#0EA5E9' };
}

// ─── Ticket Detail Modal ───────────────────────────────────────────────────────

function TicketDetailModal({
  visible,
  ticketId,
  userId,
  onClose,
  onRated,
  es,
  colors,
}: {
  visible: boolean;
  ticketId: string | null;
  userId: string;
  onClose: () => void;
  onRated: () => void;
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchDetail = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/support/ticket/${ticketId}`, {
        headers: { 'X-User-Id': userId },
      });
      const data = await res.json() as { ticket?: TicketDetail };
      if (data.ticket) setDetail(data.ticket);
    } catch {}
    setLoading(false);
  }, [ticketId, userId]);

  useEffect(() => {
    if (visible && ticketId) {
      setDetail(null);
      setReplyText('');
      setRating(null);
      fetchDetail();
    }
  }, [visible, ticketId]);

  const sendReply = async () => {
    if (!replyText.trim() || !ticketId) return;
    setSending(true);
    try {
      await fetchWithTimeout(`${BACKEND_URL}/api/support/ticket/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: replyText.trim() }),
      });
      setReplyText('');
      await fetchDetail();
    } catch {}
    setSending(false);
  };

  const submitRating = async (r: number) => {
    if (!ticketId) return;
    setSubmittingRating(true);
    setRating(r);
    try {
      await fetchWithTimeout(`${BACKEND_URL}/api/support/ticket/${ticketId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rating: r }),
      });
      await fetchDetail();
      onRated();
    } catch {}
    setSubmittingRating(false);
  };

  const canReply = detail?.status === 'waiting_user' || detail?.status === 'needs_human';
  const canRate = detail?.status === 'auto_fixed' || (detail?.status === 'closed' && !detail.rating);
  const needsRating = detail
    && (detail.status === 'auto_fixed' || detail.status === 'closed')
    && !detail.rating;

  const typeLabel = (t: string) => {
    const map: Record<string, [string, string]> = {
      streak_missing: ['Racha', 'Streak'],
      devotional_not_counted: ['Devocional', 'Devotional'],
      audio_tts: ['Audio/Voz', 'Audio/TTS'],
      notification: ['Notificación', 'Notification'],
      reward_drop: ['Regalo', 'Gift'],
      purchase_not_delivered: ['Compra/Ítem', 'Purchase/Item'],
    };
    return map[t]?.[es ? 0 : 1] ?? t;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.textMuted + '18',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <X size={22} color={colors.textMuted} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {es ? 'Detalle del incidente' : 'Incident Detail'}
            </Text>
            {detail?.incidentNumber && (
              <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'monospace' }} numberOfLines={1}>
                {detail.incidentNumber}
              </Text>
            )}
          </View>
          {detail && (
            <View style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
              backgroundColor: statusColor(detail.status) + '20',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor(detail.status) }}>
                {statusLabel(detail.status, es).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {loading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {detail && !loading && (
            <>
              {/* Meta */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                <View>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                    {es ? 'Tipo' : 'Type'}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    {typeLabel(detail.type)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                    {es ? 'Creado' : 'Created'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text }}>
                    {new Date(detail.createdAt).toLocaleDateString(es ? 'es-CR' : 'en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {/* Timeline */}
              <Text style={{
                fontSize: 11, fontWeight: '700', color: colors.textMuted,
                letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
              }}>
                {es ? 'Historial' : 'Timeline'}
              </Text>

              <View style={{ gap: 0 }}>
                {detail.events.map((ev, idx) => {
                  const { icon: Icon, color } = eventIcon(ev.type, ev.actor);
                  const isLast = idx === detail.events.length - 1;
                  return (
                    <View key={ev.id} style={{ flexDirection: 'row', gap: 12, marginBottom: isLast ? 0 : 4 }}>
                      {/* Timeline line + dot */}
                      <View style={{ alignItems: 'center', width: 32 }}>
                        <View style={{
                          width: 32, height: 32, borderRadius: 16,
                          backgroundColor: color + '18',
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: color + '40',
                        }}>
                          <Icon size={14} color={color} />
                        </View>
                        {!isLast && (
                          <View style={{
                            width: 1.5, flex: 1, minHeight: 12,
                            backgroundColor: colors.textMuted + '25',
                            marginTop: 4,
                          }} />
                        )}
                      </View>

                      {/* Event content */}
                      <View style={{
                        flex: 1,
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: isLast ? 0 : 8,
                        borderWidth: 1,
                        borderColor: ev.type === 'CLOSED' || ev.type === 'RATING'
                          ? '#22C55E30'
                          : ev.actor === 'ADMIN'
                          ? '#8B5CF630'
                          : 'transparent',
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{
                            fontSize: 10, fontWeight: '700',
                            color: color,
                            letterSpacing: 0.8,
                            textTransform: 'uppercase',
                          }}>
                            {ev.actor === 'USER' ? (es ? 'Tú' : 'You')
                              : ev.actor === 'ADMIN' ? (es ? 'Equipo' : 'Team')
                              : (es ? 'Sistema' : 'System')}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>
                            {new Date(ev.createdAt).toLocaleTimeString(es ? 'es-CR' : 'en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <Text style={{
                          fontSize: 13, color: colors.text, lineHeight: 19,
                        }}>
                          {ev.message}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Rating prompt */}
              {needsRating && (
                <Animated.View entering={FadeInDown.duration(400)} style={{
                  marginTop: 20,
                  backgroundColor: '#22C55E10',
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#22C55E30',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' }}>
                    {es ? '¿Podemos cerrar este caso?' : 'Ready to close this case?'}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, textAlign: 'center', lineHeight: 18 }}>
                    {es ? 'Califícanos del 1 al 4 para ayudarnos a mejorar' : 'Rate us 1–4 to help us improve'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[1, 2, 3, 4].map(r => (
                      <Pressable
                        key={r}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          submitRating(r);
                        }}
                        disabled={submittingRating}
                        style={({ pressed }) => ({
                          width: 56, height: 56, borderRadius: 16,
                          backgroundColor: rating === r ? '#F59E0B' : colors.surface,
                          borderWidth: 2,
                          borderColor: rating === r ? '#F59E0B' : colors.textMuted + '30',
                          alignItems: 'center', justifyContent: 'center',
                          opacity: pressed ? 0.7 : submittingRating ? 0.5 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 22 }}>{'⭐'.repeat(r === 1 ? 1 : r === 2 ? 2 : r === 3 ? 3 : 4).slice(0, 2)}</Text>
                        <Text style={{
                          fontSize: 13, fontWeight: '800',
                          color: rating === r ? '#FFF' : colors.text,
                          marginTop: 1,
                        }}>{r}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Reply box — only when ticket needs user input or is in review */}
              {canReply && !detail.rating && (
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 20 }}>
                  {detail.status === 'waiting_user' && (
                    <View style={{
                      backgroundColor: '#0EA5E910',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#0EA5E930',
                      gap: 6,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0EA5E9' }}>
                        {es ? 'Necesitamos más información' : 'We need more info'}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.text, lineHeight: 17 }}>
                        {es
                          ? 'Si tienes evidencia adicional, también puedes enviarla a:'
                          : 'You can also email evidence to:'}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                        chaviticogames@gmail.com
                      </Text>
                    </View>
                  )}
                  <Text style={{
                    fontSize: 11, fontWeight: '700', color: colors.textMuted,
                    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    {es ? 'Tu respuesta' : 'Your reply'}
                  </Text>
                  <View style={{
                    flexDirection: 'row', gap: 10, alignItems: 'flex-end',
                  }}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder={es
                        ? 'Escribe aquí tu versión de iOS, modelo de iPhone u otra info...'
                        : 'Write your iOS version, iPhone model or other info here...'}
                      placeholderTextColor={colors.textMuted + '80'}
                      multiline
                      numberOfLines={3}
                      maxLength={1000}
                      style={{
                        flex: 1,
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13,
                        lineHeight: 19,
                        minHeight: 72,
                        borderWidth: 1,
                        borderColor: colors.textMuted + '25',
                        textAlignVertical: 'top',
                      }}
                    />
                    <Pressable
                      onPress={sendReply}
                      disabled={!replyText.trim() || sending}
                      style={({ pressed }) => ({
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: replyText.trim() ? colors.primary : colors.textMuted + '30',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      {sending
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Send size={18} color={replyText.trim() ? colors.primaryText : colors.textMuted} />}
                    </Pressable>
                  </View>
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Ticket List Item ──────────────────────────────────────────────────────────

function TicketListItem({
  ticket,
  categories,
  es,
  colors,
  onPress,
}: {
  ticket: TicketSummary;
  categories: CategoryDef[];
  es: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const sc = statusColor(ticket.status);
  const catDef = categories.find(c => c.type === ticket.type);
  const isActionNeeded = ticket.status === 'waiting_user';
  const isResolved = ticket.status === 'auto_fixed' || ticket.status === 'closed';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: sc,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: isActionNeeded ? 1 : 0,
        borderColor: isActionNeeded ? sc + '50' : 'transparent',
      })}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* Status icon */}
        {isResolved && !ticket.rating
          ? <CheckCircle size={14} color={sc} />
          : isActionNeeded
          ? <AlertCircle size={14} color={sc} />
          : ticket.status === 'needs_human'
          ? <Clock size={14} color={sc} />
          : <CheckCircle size={14} color={sc} />}

        <Text style={{ fontSize: 13, fontWeight: '700', color: sc }}>
          {statusLabel(ticket.status, es)}
        </Text>

        {/* Incident number */}
        {ticket.incidentNumber && (
          <Text style={{
            fontSize: 10, color: colors.textMuted, fontFamily: 'monospace',
            marginLeft: 'auto',
          }}>
            {ticket.incidentNumber}
          </Text>
        )}

        {/* Rating badge */}
        {ticket.rating && (
          <View style={{
            marginLeft: ticket.incidentNumber ? 6 : 'auto',
            backgroundColor: '#F59E0B20',
            borderRadius: 6,
            paddingHorizontal: 6, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>
              {'⭐'.repeat(ticket.rating)}
            </Text>
          </View>
        )}
      </View>

      {/* Category */}
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 4 }} numberOfLines={1}>
        {catDef ? (es ? catDef.titleEs : catDef.titleEn) : ticket.type}
      </Text>

      {/* Latest event preview */}
      {ticket.latestEvent && (
        <Text
          numberOfLines={2}
          style={{ fontSize: 12, color: colors.textMuted, lineHeight: 16 }}
        >
          {ticket.latestEvent.message}
        </Text>
      )}

      {/* Bottom row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
        <Text style={{ fontSize: 11, color: colors.textMuted + '80', flex: 1 }}>
          {timeAgo(ticket.updatedAt, es)}
        </Text>
        {isActionNeeded && (
          <View style={{
            backgroundColor: sc + '20', borderRadius: 6,
            paddingHorizontal: 6, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: sc }}>
              {es ? 'Responder' : 'Reply'}
            </Text>
          </View>
        )}
        <ChevronRight size={14} color={colors.textMuted + '60'} />
      </View>
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  const language = useLanguage();
  const user = useUser();
  const es = language === 'es';
  const categories = useCategoryDefs();

  const [step, setStep] = useState<'category' | 'detail'>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subIssue, setSubIssue] = useState<string | null>(null);
  const [purchaseItemText, setPurchaseItemText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tickets list
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Result modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; message: string; isSuccess: boolean; ticketId?: string } | null>(null);

  const userId = user?.id ?? '';

  const fetchTickets = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoadingTickets(true);
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/support/tickets/${userId}`);
      const data = await res.json() as { tickets?: TicketSummary[] };
      if (data.tickets) setTickets(data.tickets);
    } catch {}
    setLoadingTickets(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setSubIssue(null);
    setPurchaseItemText('');
    setStep('detail');
  };

  const getSubOptions = (cat: Category): SubOption[] => {
    if (cat === 'audio_tts') return AUDIO_ISSUES;
    if (cat === 'notification') return NOTIFICATION_ISSUES;
    if (cat === 'reward_drop') return DROP_ISSUES;
    return [];
  };

  const needsSubIssue = (cat: Category) =>
    cat === 'audio_tts' || cat === 'notification' || cat === 'reward_drop';

  const canSubmit = selectedCategory !== null
    && (!needsSubIssue(selectedCategory) || subIssue !== null)
    && (selectedCategory !== 'purchase_not_delivered' || purchaseItemText.trim().length > 0);

  const handleSubmit = useCallback(async () => {
    if (!selectedCategory || !userId || isSubmitting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      let clientClaim: Record<string, unknown> = {};
      if (selectedCategory === 'streak_missing') {
        clientClaim = { claimedStreak: user?.streakCurrent ?? 0 };
      } else if (selectedCategory === 'devotional_not_counted') {
        clientClaim = { date: getTodayDate(), issue: 'not_counted' };
      } else if (selectedCategory === 'audio_tts') {
        let ttsVoiceIdentifier = '';
        let ttsVoiceName = '';
        let ttsLanguage = '';
        let ttsPreferredVoiceFound = false;
        let ttsIsEloquence = false;
        let ttsNeedsUserAction = false;
        let ttsVoiceScore = 0;
        try {
          const langCode = (language === 'es' ? 'es' : 'en') as 'en' | 'es';
          const picked = await pickBestVoice(langCode);
          ttsVoiceIdentifier = picked.voiceIdentifier;
          ttsVoiceName = picked.name;
          ttsLanguage = picked.language;
          ttsPreferredVoiceFound = picked.preferredVoiceFound;
          ttsIsEloquence = picked.isEloquence;
          ttsNeedsUserAction = picked.needsUserAction;
          ttsVoiceScore = picked.score;
        } catch {}
        clientClaim = {
          issue: subIssue,
          os: Platform.OS,
          ttsVoiceIdentifier,
          ttsVoiceName,
          ttsLanguage,
          ttsPreferredVoiceFound,
          ttsIsEloquence,
          ttsNeedsUserAction,
          ttsVoiceScore,
        };
      } else if (selectedCategory === 'notification') {
        const notifSettings = await getNotificationSettings();
        clientClaim = {
          issue: subIssue,
          scheduledHour: notifSettings?.hour,
          enabled: notifSettings?.enabled,
        };
      } else if (selectedCategory === 'reward_drop') {
        clientClaim = { issue: subIssue };
      } else if (selectedCategory === 'purchase_not_delivered') {
        // Determine if the user typed a bundle ID or item ID
        // The text field accepts either a bundleId or a storeItemId
        const trimmed = purchaseItemText.trim();
        // Heuristic: if text starts with "bundle_" treat as bundleId, otherwise itemId
        if (trimmed.startsWith('bundle_')) {
          clientClaim = { purchaseBundleId: trimmed };
        } else {
          clientClaim = { purchaseItemId: trimmed };
        }
      }

      const trimmedPurchaseText = purchaseItemText.trim();
      const body: {
        userId: string;
        type: Category;
        claimedStreak: number;
        claimedDate: string;
        clientClaim: Record<string, unknown>;
        purchaseItemId?: string;
        purchaseBundleId?: string;
      } = {
        userId,
        type: selectedCategory,
        claimedStreak: user?.streakCurrent ?? 0,
        claimedDate: getTodayDate(),
        clientClaim,
      };

      // For purchase_not_delivered, also pass top-level fields for backend validation
      if (selectedCategory === 'purchase_not_delivered' && trimmedPurchaseText) {
        if (trimmedPurchaseText.startsWith('bundle_')) {
          body.purchaseBundleId = trimmedPurchaseText;
        } else {
          body.purchaseItemId = trimmedPurchaseText;
        }
      }

      const res = await fetchWithTimeout(`${BACKEND_URL}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json() as {
        success: boolean;
        error?: string;
        ticket?: {
          id: string;
          incidentNumber: string;
          status: string;
          resolutionNote: string | null;
          autoFixed: boolean;
        };
      };

      if (!data.success || !data.ticket) throw new Error(data.error ?? 'Error desconocido');

      const { ticket } = data;

      setModalData({
        isSuccess: ticket.autoFixed || ticket.status === 'auto_fixed',
        ticketId: ticket.id,
        title: ticket.autoFixed
          ? (es ? '¡Listo!' : 'Fixed!')
          : (es ? 'Recibido' : 'Received'),
        message: ticket.incidentNumber
          ? (es
              ? `Incidente ${ticket.incidentNumber} creado. Puedes ver el progreso en "Mis reportes".`
              : `Incident ${ticket.incidentNumber} created. Track progress in "My reports".`)
          : (es
              ? 'Tu reporte fue recibido. Puedes ver el estado en "Mis reportes".'
              : 'Your report was received. Check status in "My reports".'),
      });

      setModalVisible(true);
      setStep('category');
      setSelectedCategory(null);
      setSubIssue(null);
      setPurchaseItemText('');

      // Refresh tickets list
      await fetchTickets(true);
    } catch {
      setModalData({
        isSuccess: false,
        title: 'Error',
        message: es
          ? 'No pudimos enviar tu reporte. Intenta de nuevo más tarde.'
          : 'We could not send your report. Please try again later.',
      });
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategory, subIssue, user, userId, isSubmitting, es, language, fetchTickets]);

  const catDef = categories.find(c => c.type === selectedCategory);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.textMuted + '18',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <Pressable
          onPress={() => {
            if (step === 'detail') {
              setStep('category');
              setSubIssue(null);
            } else {
              router.back();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <LifeBuoy size={20} color={colors.primary} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
          {es ? 'Soporte' : 'Support'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTickets(); }}
            tintColor={colors.primary}
          />
        }
      >
        {step === 'category' ? (
          <>
            {/* Intro */}
            <Animated.View entering={FadeInDown.delay(40).duration(400)}>
              <View style={{
                backgroundColor: colors.primary + '12',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.primary + '25',
              }}>
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
                  {es
                    ? 'Selecciona la categoría que mejor describe tu problema. El sistema intentará resolverlo de forma automática cuando sea posible.'
                    : 'Select the category that best describes your issue. The system will try to resolve it automatically when possible.'}
                </Text>
              </View>
            </Animated.View>

            {/* Category Selector */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <Text style={{
                fontSize: 12, fontWeight: '700', color: colors.textMuted,
                letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14,
              }}>
                {es ? 'Categoría' : 'Category'}
              </Text>
              <View style={{ gap: 10 }}>
                {categories.map((cat, i) => (
                  <Animated.View key={cat.type} entering={FadeInDown.delay(100 + i * 40).duration(350)}>
                    <Pressable
                      onPress={() => handleSelectCategory(cat.type)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderRadius: 18,
                        backgroundColor: colors.surface,
                        opacity: pressed ? 0.85 : 1,
                        gap: 14,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 1,
                      })}
                    >
                      <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: cat.color + '18',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {cat.renderIcon(cat.color)}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 }} numberOfLines={1}>
                          {es ? cat.titleEs : cat.titleEn}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }} numberOfLines={2}>
                          {es ? cat.subtitleEs : cat.subtitleEn}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* My Tickets */}
            <Animated.View entering={FadeInDown.delay(320).duration(400)} style={{ marginTop: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                <Text style={{
                  fontSize: 12, fontWeight: '700', color: colors.textMuted,
                  letterSpacing: 1.2, textTransform: 'uppercase', flex: 1,
                }}>
                  {es ? 'Mis reportes' : 'My reports'}
                </Text>
                <Pressable
                  onPress={() => fetchTickets()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                    {es ? 'Actualizar' : 'Refresh'}
                  </Text>
                </Pressable>
              </View>

              {loadingTickets && (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
              )}

              {!loadingTickets && tickets.length === 0 && (
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 20,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
                    {es ? 'No tienes reportes aún.' : 'No reports yet.'}
                  </Text>
                </View>
              )}

              {!loadingTickets && tickets.length > 0 && (
                <View style={{ gap: 10 }}>
                  {tickets.map(ticket => (
                    <TicketListItem
                      key={ticket.id}
                      ticket={ticket}
                      categories={categories}
                      es={es}
                      colors={colors}
                      onPress={() => {
                        setSelectedTicketId(ticket.id);
                        setDetailVisible(true);
                      }}
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          </>
        ) : (
          /* Detail / Sub-issue step */
          <>
            {catDef && (
              <Animated.View entering={FadeIn.duration(300)}>
                {/* Category header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 24,
                  borderLeftWidth: 3.5,
                  borderLeftColor: catDef.color,
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: catDef.color + '18',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {catDef.renderIcon(catDef.color)}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }} numberOfLines={2}>
                      {es ? catDef.titleEs : catDef.titleEn}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                      {es ? catDef.subtitleEs : catDef.subtitleEn}
                    </Text>
                  </View>
                </View>

                {/* Sub-options if needed */}
                {needsSubIssue(selectedCategory!) && (
                  <SubOptionPicker
                    options={getSubOptions(selectedCategory!)}
                    selected={subIssue}
                    onSelect={setSubIssue}
                    es={es}
                    colors={colors}
                  />
                )}

                {/* Purchase item picker for purchase_not_delivered */}
                {selectedCategory === 'purchase_not_delivered' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{
                      fontSize: 12, fontWeight: '700', color: colors.textMuted,
                      letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10,
                    }}>
                      {es ? '¿Qué compraste?' : 'What did you purchase?'}
                    </Text>
                    <TextInput
                      value={purchaseItemText}
                      onChangeText={setPurchaseItemText}
                      placeholder={es
                        ? 'Escribe el nombre o ID del ítem / bundle...'
                        : 'Type the item name or ID / bundle ID...'}
                      placeholderTextColor={colors.textMuted + '70'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 14,
                        color: colors.text,
                        fontSize: 14,
                        borderWidth: 1.5,
                        borderColor: purchaseItemText.trim()
                          ? catDef.color + '70'
                          : colors.textMuted + '25',
                      }}
                    />
                    <View style={{
                      backgroundColor: catDef.color + '10',
                      borderRadius: 12,
                      padding: 12,
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: catDef.color + '25',
                    }}>
                      <Text style={{ fontSize: 12, color: colors.text, lineHeight: 18 }}>
                        {es
                          ? 'El sistema verificará si el ítem está en tu inventario. Si fue una compra válida y no fue entregado, lo agregaremos automáticamente.'
                          : 'The system will check if the item is in your inventory. If it was a valid purchase and not delivered, we will add it automatically.'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Info for streak/devotional — only show for non-purchase, non-suboption categories */}
                {!needsSubIssue(selectedCategory!) && selectedCategory !== 'purchase_not_delivered' && (
                  <View style={{
                    backgroundColor: catDef.color + '10',
                    borderRadius: 14,
                    padding: 16,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: catDef.color + '25',
                  }}>
                    <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
                      {selectedCategory === 'streak_missing'
                        ? (es
                            ? 'El sistema verificará tu racha usando el historial del servidor. Si la diferencia es pequeña, se corregirá de forma automática.'
                            : 'The system will verify your streak using server history. If the difference is small, it will be corrected automatically.')
                        : (es
                            ? 'El sistema verificará si el devocional de hoy fue registrado correctamente.'
                            : "The system will check if today's devotional was correctly registered.")
                      }
                    </Text>
                  </View>
                )}

                {/* Submit button */}
                {(() => {
                  const btnColor = catDef?.color ?? colors.primary;
                  const btnText = pickReadableTextColor(btnColor);
                  const isDisabled = !canSubmit || isSubmitting;
                  return (
                    <View style={{ marginTop: 28 }}>
                      <Pressable
                        onPress={isDisabled ? undefined : handleSubmit}
                        disabled={isDisabled}
                        style={({ pressed }) => ({
                          backgroundColor: isDisabled
                            ? (isDark ? '#4A4A4A' : '#BBBBBB')
                            : btnColor,
                          borderRadius: 18,
                          paddingVertical: 16,
                          paddingHorizontal: 24,
                          alignItems: 'center' as const,
                          justifyContent: 'center' as const,
                          opacity: pressed ? 0.85 : 1,
                          flexDirection: 'row' as const,
                          gap: 8,
                        })}
                      >
                        {isSubmitting && (
                          <ActivityIndicator size="small" color={isDark ? '#9A9A9A' : '#666666'} />
                        )}
                        <Text style={{
                          color: isDisabled
                            ? (isDark ? '#9A9A9A' : '#666666')
                            : btnText,
                          fontSize: 17,
                          fontWeight: '700',
                          letterSpacing: 0.2,
                        }}>
                          {es ? 'Enviar reporte' : 'Submit report'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })()}

                <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 16 }}>
                  {es
                    ? 'Tu reporte queda registrado y puedes ver el progreso en "Mis reportes".'
                    : 'Your report is saved and you can track progress in "My reports".'}
                </Text>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        visible={detailVisible}
        ticketId={selectedTicketId}
        userId={userId}
        onClose={() => {
          setDetailVisible(false);
          fetchTickets(true);
        }}
        onRated={() => {
          fetchTickets(true);
        }}
        es={es}
        colors={colors}
      />

      {/* Result Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 28,
              width: '100%',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <Pressable
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => ({
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: colors.textMuted + '20',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>

            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: modalData?.isSuccess ? '#22C55E18' : '#F59E0B18',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              {modalData?.isSuccess
                ? <CheckCircle size={28} color="#22C55E" />
                : <Clock size={28} color="#F59E0B" />}
            </View>

            <Text style={{
              fontSize: 18, fontWeight: '800', color: colors.text,
              marginBottom: 10, textAlign: 'center',
            }}>
              {modalData?.title}
            </Text>
            <Text style={{
              fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20,
              marginBottom: 20,
            }}>
              {modalData?.message}
            </Text>

            {modalData?.ticketId && (
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSelectedTicketId(modalData.ticketId!);
                  setDetailVisible(true);
                }}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary + '18',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  marginBottom: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {es ? 'Ver historial del incidente' : 'View incident timeline'}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => ({
                paddingVertical: 8, paddingHorizontal: 20,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '600' }}>
                {es ? 'Cerrar' : 'Close'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
