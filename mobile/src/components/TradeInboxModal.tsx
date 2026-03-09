/**
 * TradeInboxModal
 *
 * Shows the current user's trade activity:
 *  - Incoming pending trades (accept / reject) — with accept animation + success toast
 *  - Outgoing pending trades (cancel)
 *  - Recent history (accepted / rejected / cancelled)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  ArrowLeftRight,
  Check,
  XCircle,
  Clock,
  Inbox,
  Sparkles,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { gamificationApi, CardTrade } from '@/lib/gamification-api';
import { BIBLICAL_CARDS, RARITY_CONFIG } from '@/lib/biblical-cards';
import { CardThumb } from '@/components/CardThumb';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RARITY_COLOR: Record<string, string> = {
  common:    '#6B7280',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#F59E0B',
};

function rarityColor(cardId: string) {
  const card = BIBLICAL_CARDS[cardId];
  return card ? (RARITY_COLOR[card.rarity] ?? '#6B7280') : '#6B7280';
}

function cardName(cardId: string) {
  return BIBLICAL_CARDS[cardId]?.nameEs ?? cardId;
}

function rarityLabel(cardId: string) {
  const card = BIBLICAL_CARDS[cardId];
  return card ? (RARITY_CONFIG[card.rarity]?.labelEs ?? card.rarity) : '';
}

// ─── Success Toast ─────────────────────────────────────────────────────────────

interface ToastInfo {
  cardId: string;
  isNew: boolean;
  es: boolean;
}

function SuccessToast({
  info,
  colors,
  sFont,
}: {
  info: ToastInfo;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
}) {
  const name = cardName(info.cardId);
  const rc = rarityColor(info.cardId);

  return (
    <Animated.View
      entering={ZoomIn.duration(280).springify()}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 100,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      <LinearGradient
        colors={['#16A34A', '#15803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          gap: 12,
        }}
      >
        {/* Card thumb */}
        <View style={{ borderRadius: 8, overflow: 'hidden' }}>
          <CardThumb cardId={info.cardId} height={52} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: sFont(12), fontWeight: '800', color: '#DCFCE7', letterSpacing: 0.5 }}>
            {info.es
              ? (info.isNew ? '✨ Nueva carta obtenida' : '✨ Intercambio completado')
              : (info.isNew ? '✨ New card obtained' : '✨ Trade completed')}
          </Text>
          <Text style={{ fontSize: sFont(14), fontWeight: '900', color: '#FFF', marginTop: 1 }} numberOfLines={1}>
            {name}
          </Text>
          <View style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: '#FFF2',
          }}>
            <Text style={{ fontSize: sFont(10), fontWeight: '700', color: '#FFF' }}>
              {info.isNew
                ? (info.es ? 'Nueva' : 'New')
                : (info.es ? 'Duplicado +1' : 'Duplicate +1')}
            </Text>
          </View>
        </View>

        {/* Check */}
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: '#FFF3',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={18} color="#FFF" />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── TradeRow ─────────────────────────────────────────────────────────────────

type TradeRowAction = 'accept' | 'reject' | 'cancel' | null;

interface AcceptResult {
  isNew: boolean;
  receivedCardId: string;
}

function TradeRow({
  trade,
  myUserId,
  onAction,
  actionPending,
  justAccepted,
  acceptResult,
  colors,
  sFont,
  es,
}: {
  trade: CardTrade;
  myUserId: string;
  onAction: (action: TradeRowAction) => void;
  actionPending: boolean;
  justAccepted: boolean;
  acceptResult: AcceptResult | null;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
  es: boolean;
}) {
  const isIncoming = trade.toUserId === myUserId;
  const otherUser = isIncoming ? trade.fromUser : trade.toUser;

  // from my perspective
  const giveCardId    = isIncoming ? trade.requestedCardId : trade.offeredCardId;
  const receiveCardId = isIncoming ? trade.offeredCardId   : trade.requestedCardId;

  const isAccepted = trade.status === 'accepted';

  const statusColors: Record<CardTrade['status'], string> = {
    pending:   '#F59E0B',
    accepted:  '#22C55E',
    rejected:  '#F43F5E',
    cancelled: '#6B7280',
    failed:    '#EF4444',
  };
  const statusLabels: Record<CardTrade['status'], string> = {
    pending:   es ? 'Pendiente' : 'Pending',
    accepted:  es ? 'Aceptado'  : 'Accepted',
    rejected:  es ? 'Rechazado' : 'Rejected',
    cancelled: es ? 'Cancelado' : 'Cancelled',
    failed:    es ? 'Fallido'   : 'Failed',
  };

  const sc = statusColors[trade.status] ?? '#6B7280';

  // ── Animations ────────────────────────────────────────────────────────────
  // Arrow swap spin (plays on accept)
  const arrowRot = useSharedValue(0);
  // Receive panel glow opacity
  const receiveGlow = useSharedValue(0);
  // Receive panel scale pulse
  const receiveScale = useSharedValue(1);
  // Card glow border
  const cardBorderOpacity = useSharedValue(isAccepted ? 1 : 0);

  useEffect(() => {
    if (justAccepted) {
      // Arrow spins left-right
      arrowRot.value = withSequence(
        withTiming(-1, { duration: 120 }),
        withTiming(1, { duration: 120 }),
        withTiming(-0.5, { duration: 100 }),
        withTiming(0.5, { duration: 100 }),
        withTiming(0, { duration: 80 }),
      );
      // Receive panel glows then fades
      receiveGlow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(400, withTiming(0, { duration: 400 })),
      );
      // Receive panel scales up briefly
      receiveScale.value = withSequence(
        withDelay(100, withSpring(1.04, { damping: 6 })),
        withDelay(200, withSpring(1, { damping: 8 })),
      );
      cardBorderOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [justAccepted]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowRot.value * 6 }],
  }));
  const receiveGlowStyle = useAnimatedStyle(() => ({
    opacity: receiveGlow.value,
  }));
  const receiveScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: receiveScale.value }],
  }));

  // Border color for accepted cards
  const borderColor = isAccepted
    ? '#22C55E55'
    : colors.textMuted + '20';
  const bgColor = isAccepted
    ? '#22C55E08'
    : colors.surface;

  return (
    <View style={{
      borderRadius: 16,
      borderWidth: isAccepted ? 1.5 : 1,
      borderColor,
      backgroundColor: bgColor,
      padding: 14,
      marginBottom: 10,
      gap: 10,
    }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isIncoming
            ? <Inbox size={13} color={isAccepted ? '#22C55E' : colors.primary} />
            : <ArrowLeftRight size={13} color={colors.textMuted} />
          }
          <Text style={{ fontSize: sFont(12), fontWeight: '700', color: isIncoming ? (isAccepted ? '#22C55E' : colors.primary) : colors.textMuted }}>
            {isIncoming
              ? (es ? `De ${otherUser.nickname}` : `From ${otherUser.nickname}`)
              : (es ? `Para ${otherUser.nickname}` : `To ${otherUser.nickname}`)
            }
          </Text>
        </View>

        {/* Status chip — larger + bolder for accepted */}
        <View style={{
          paddingHorizontal: isAccepted ? 10 : 8,
          paddingVertical: isAccepted ? 4 : 3,
          borderRadius: 10,
          backgroundColor: sc + (isAccepted ? '25' : '18'),
          borderWidth: isAccepted ? 1 : 0,
          borderColor: isAccepted ? sc + '60' : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
          {isAccepted && <Check size={10} color={sc} />}
          <Text style={{ fontSize: sFont(isAccepted ? 12 : 11), fontWeight: '800', color: sc }}>
            {statusLabels[trade.status]}
          </Text>
        </View>
      </View>

      {/* Cards exchange line — thumbnail panels */}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
        {/* Give card */}
        <View style={{
          flex: 1, borderRadius: 12,
          backgroundColor: rarityColor(giveCardId) + '10',
          borderWidth: 1, borderColor: rarityColor(giveCardId) + '35',
          overflow: 'hidden',
        }}>
          <Text style={{ fontSize: sFont(9), fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 8, paddingHorizontal: 8, marginBottom: 6 }}>
            {es ? 'Das' : 'You give'}
          </Text>
          <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
            <CardThumb cardId={giveCardId} height={120} />
          </View>
          <View style={{ padding: 8, paddingTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rarityColor(giveCardId) }} />
              <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={2}>
                {cardName(giveCardId)}
              </Text>
            </View>
            <Text style={{ fontSize: sFont(9), color: colors.textMuted }}>
              {rarityLabel(giveCardId)}
            </Text>
          </View>
        </View>

        {/* Center arrow — animates on accept */}
        <Animated.View style={[{ alignSelf: 'center', paddingTop: 20 }, arrowStyle]}>
          <ArrowLeftRight size={14} color={justAccepted ? '#22C55E' : colors.textMuted} />
        </Animated.View>

        {/* Receive card — pulses + glows on accept */}
        <Animated.View style={[{ flex: 1 }, receiveScaleStyle]}>
          <View style={{
            flex: 1, borderRadius: 12,
            backgroundColor: rarityColor(receiveCardId) + (isAccepted ? '18' : '10'),
            borderWidth: isAccepted ? 1.5 : 1,
            borderColor: rarityColor(receiveCardId) + (isAccepted ? '60' : '35'),
            overflow: 'hidden',
          }}>
            <Text style={{ fontSize: sFont(9), fontWeight: '700', color: isAccepted ? rarityColor(receiveCardId) : colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 8, paddingHorizontal: 8, marginBottom: 6 }}>
              {es ? 'Recibes' : 'You get'}
            </Text>
            <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
              <CardThumb cardId={receiveCardId} height={120} />
            </View>
            <View style={{ padding: 8, paddingTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rarityColor(receiveCardId) }} />
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={2}>
                  {cardName(receiveCardId)}
                </Text>
              </View>
              <Text style={{ fontSize: sFont(9), color: colors.textMuted }}>
                {rarityLabel(receiveCardId)}
              </Text>
              {/* Nueva / Duplicado +1 chip */}
              {(isAccepted || justAccepted) && acceptResult && (
                <View style={{
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: acceptResult.isNew ? '#22C55E20' : '#6B728018',
                  borderWidth: 1,
                  borderColor: acceptResult.isNew ? '#22C55E50' : '#6B728030',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  {acceptResult.isNew && <Sparkles size={9} color="#22C55E" />}
                  <Text style={{ fontSize: sFont(9), fontWeight: '800', color: acceptResult.isNew ? '#22C55E' : '#9CA3AF' }}>
                    {acceptResult.isNew
                      ? (es ? 'Nueva' : 'New')
                      : (es ? 'Duplicado +1' : 'Duplicate +1')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Glow overlay — fades out after accept */}
          <Animated.View
            pointerEvents="none"
            style={[{
              position: 'absolute', inset: 0,
              borderRadius: 12,
              backgroundColor: '#22C55E15',
              borderWidth: 2,
              borderColor: '#22C55E80',
            }, receiveGlowStyle]}
          />
        </Animated.View>
      </View>

      {/* Action buttons — only for pending */}
      {trade.status === 'pending' && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          {isIncoming ? (
            <>
              {/* Accept */}
              <Pressable
                onPress={() => onAction('accept')}
                disabled={actionPending}
                style={{ flex: 1, opacity: actionPending ? 0.5 : 1 }}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}
                >
                  {actionPending
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <>
                      <Check size={14} color="#FFF" />
                      <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#FFF' }}>
                        {es ? 'Aceptar' : 'Accept'}
                      </Text>
                    </>
                  }
                </LinearGradient>
              </Pressable>
              {/* Reject */}
              <Pressable
                onPress={() => onAction('reject')}
                disabled={actionPending}
                style={{
                  flex: 1, borderRadius: 10, paddingVertical: 10,
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 5,
                  backgroundColor: '#F43F5E18',
                  borderWidth: 1, borderColor: '#F43F5E40',
                  opacity: actionPending ? 0.5 : 1,
                }}
              >
                <XCircle size={14} color="#F43F5E" />
                <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#F43F5E' }}>
                  {es ? 'Rechazar' : 'Reject'}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => onAction('cancel')}
              disabled={actionPending}
              style={{
                flex: 1, borderRadius: 10, paddingVertical: 10,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 5,
                backgroundColor: colors.textMuted + '12',
                borderWidth: 1, borderColor: colors.textMuted + '30',
                opacity: actionPending ? 0.5 : 1,
              }}
            >
              {actionPending
                ? <ActivityIndicator color={colors.textMuted} size="small" />
                : <>
                  <XCircle size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.textMuted }}>
                    {es ? 'Cancelar' : 'Cancel'}
                  </Text>
                </>
              }
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TradeInboxModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TradeInboxModal({ visible, onClose }: TradeInboxModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const { sFont } = useScaledFont();
  const queryClient = useQueryClient();

  const es = language === 'es';
  const [pendingTradeId, setPendingTradeId] = useState<string | null>(null);
  // tradeId → accept result, for showing animation + chip even after query refetch
  const [acceptResults, setAcceptResults] = useState<Record<string, AcceptResult>>({});
  // tradeId that just got accepted (for triggering animation)
  const [justAcceptedId, setJustAcceptedId] = useState<string | null>(null);
  // Toast
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((info: ToastInfo) => {
    setToast(info);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Fetch trades
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: () => gamificationApi.getTrades(user!.id),
    enabled: !!user?.id && visible,
    staleTime: 15_000,
  });

  const trades = data?.trades ?? [];
  const incoming = trades.filter(t => t.toUserId === user?.id && t.status === 'pending');
  const outgoing = trades.filter(t => t.fromUserId === user?.id && t.status === 'pending');
  // History: accepted shown first (most recent), then rest
  const history = trades
    .filter(t => t.status !== 'pending')
    .sort((a, b) => {
      if (a.status === 'accepted' && b.status !== 'accepted') return -1;
      if (b.status === 'accepted' && a.status !== 'accepted') return 1;
      return 0;
    });

  // Accept
  const { mutate: doAccept } = useMutation({
    mutationFn: (tradeId: string) => gamificationApi.acceptTrade(tradeId, user!.id),
    onSuccess: (result, tradeId) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingTradeId(null);

      // Find the trade to know the received card
      const trade = trades.find(t => t.id === tradeId);
      const receivedCardId = trade?.offeredCardId ?? '';
      const isNew = result.receivedNew ?? false;

      // Store accept result for chip/animation
      setAcceptResults(prev => ({ ...prev, [tradeId]: { isNew, receivedCardId } }));
      setJustAcceptedId(tradeId);

      // Show toast
      if (receivedCardId) {
        showToast({ cardId: receivedCardId, isNew, es });
      }

      // Clear "justAccepted" highlight after animation finishes
      setTimeout(() => setJustAcceptedId(null), 1200);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tradeableCards', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['userCards', user?.id] });
      void refetch();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPendingTradeId(null);
    },
  });

  // Reject
  const { mutate: doReject } = useMutation({
    mutationFn: (tradeId: string) => gamificationApi.rejectTrade(tradeId, user!.id),
    onSuccess: () => {
      Haptics.selectionAsync();
      setPendingTradeId(null);
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
      void refetch();
    },
    onError: () => { setPendingTradeId(null); },
  });

  // Cancel
  const { mutate: doCancel } = useMutation({
    mutationFn: (tradeId: string) => gamificationApi.cancelTrade(tradeId, user!.id),
    onSuccess: () => {
      Haptics.selectionAsync();
      setPendingTradeId(null);
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
      void refetch();
    },
    onError: () => { setPendingTradeId(null); },
  });

  const handleAction = useCallback((trade: CardTrade, action: TradeRowAction) => {
    if (!action) return;
    setPendingTradeId(trade.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action === 'accept') doAccept(trade.id);
    else if (action === 'reject') doReject(trade.id);
    else if (action === 'cancel') doCancel(trade.id);
  }, [doAccept, doReject, doCancel]);

  const pendingCount = incoming.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + 16,
          paddingBottom: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.textMuted + '20',
        }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Inbox size={20} color={colors.primary} />
            <Text style={{ fontSize: sFont(17), fontWeight: '800', color: colors.text }}>
              {es ? 'Mis intercambios' : 'My Trades'}
            </Text>
            {pendingCount > 0 && (
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 2,
                minWidth: 20,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: sFont(11), fontWeight: '800', color: '#FFF' }}>
                  {pendingCount}
                </Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Toast — floats over scroll content */}
        <View style={{ position: 'relative', zIndex: 50 }}>
          {toast && (
            <View style={{ position: 'absolute', top: 12, left: 0, right: 0, paddingHorizontal: 16, zIndex: 100 }}>
              <SuccessToast info={toast} colors={colors} sFont={sFont} />
            </View>
          )}
        </View>

        {/* Body */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : trades.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 12 }}>
            <ArrowLeftRight size={40} color={colors.textMuted + '60'} />
            <Text style={{ fontSize: sFont(15), color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
              {es
                ? 'No tienes intercambios activos.\nPropón uno desde el perfil de otro jugador.'
                : 'No trades yet.\nPropose one from another player\'s profile.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 24, paddingTop: toast ? 90 : 18 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={colors.primary}
              />
            }
          >
            {/* Incoming */}
            {incoming.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Inbox size={14} color={colors.primary} />
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.primary, letterSpacing: 0.5 }}>
                    {es ? 'Recibidas' : 'Incoming'}
                  </Text>
                  <View style={{ backgroundColor: colors.primary + '25', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: sFont(11), fontWeight: '800', color: colors.primary }}>
                      {incoming.length}
                    </Text>
                  </View>
                </View>
                {incoming.map(t => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    myUserId={user!.id}
                    onAction={(action) => handleAction(t, action)}
                    actionPending={pendingTradeId === t.id}
                    justAccepted={justAcceptedId === t.id}
                    acceptResult={acceptResults[t.id] ?? null}
                    colors={colors}
                    sFont={sFont}
                    es={es}
                  />
                ))}
              </>
            )}

            {/* Outgoing */}
            {outgoing.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: incoming.length > 0 ? 14 : 0, marginBottom: 10 }}>
                  <Clock size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 }}>
                    {es ? 'Enviadas' : 'Outgoing'}
                  </Text>
                </View>
                {outgoing.map(t => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    myUserId={user!.id}
                    onAction={(action) => handleAction(t, action)}
                    actionPending={pendingTradeId === t.id}
                    justAccepted={false}
                    acceptResult={null}
                    colors={colors}
                    sFont={sFont}
                    es={es}
                  />
                ))}
              </>
            )}

            {/* History */}
            {history.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: (incoming.length + outgoing.length) > 0 ? 14 : 0, marginBottom: 10 }}>
                  <Check size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 }}>
                    {es ? 'Historial' : 'History'}
                  </Text>
                </View>
                {history.slice(0, 20).map(t => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    myUserId={user!.id}
                    onAction={() => {}}
                    actionPending={false}
                    justAccepted={false}
                    acceptResult={acceptResults[t.id] ?? null}
                    colors={colors}
                    sFont={sFont}
                    es={es}
                  />
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
