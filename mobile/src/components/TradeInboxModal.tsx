/**
 * TradeInboxModal
 *
 * Shows the current user's trade activity:
 *  - Incoming pending trades (accept / reject)
 *  - Outgoing pending trades (cancel)
 *  - Recent history (accepted / rejected / cancelled)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { gamificationApi, CardTrade } from '@/lib/gamification-api';
import { BIBLICAL_CARDS, RARITY_CONFIG } from '@/lib/biblical-cards';

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

// ─── TradeRow ─────────────────────────────────────────────────────────────────

type TradeRowAction = 'accept' | 'reject' | 'cancel' | null;

function TradeRow({
  trade,
  myUserId,
  onAction,
  actionPending,
  colors,
  sFont,
  es,
}: {
  trade: CardTrade;
  myUserId: string;
  onAction: (action: TradeRowAction) => void;
  actionPending: boolean;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
  es: boolean;
}) {
  const isIncoming = trade.toUserId === myUserId;
  const otherUser = isIncoming ? trade.fromUser : trade.toUser;

  // Card I'm giving vs receiving from my perspective
  const giveCardId    = isIncoming ? trade.requestedCardId : trade.offeredCardId;
  const receiveCardId = isIncoming ? trade.offeredCardId   : trade.requestedCardId;

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

  return (
    <View style={{
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.textMuted + '20',
      backgroundColor: colors.surface,
      padding: 14,
      marginBottom: 10,
      gap: 10,
    }}>
      {/* Header row: direction label + status badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isIncoming
            ? <Inbox size={13} color={colors.primary} />
            : <ArrowLeftRight size={13} color={colors.textMuted} />
          }
          <Text style={{ fontSize: sFont(12), fontWeight: '700', color: isIncoming ? colors.primary : colors.textMuted }}>
            {isIncoming
              ? (es ? `De ${otherUser.nickname}` : `From ${otherUser.nickname}`)
              : (es ? `Para ${otherUser.nickname}` : `To ${otherUser.nickname}`)
            }
          </Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: sc + '20' }}>
          <Text style={{ fontSize: sFont(11), fontWeight: '700', color: sc }}>
            {statusLabels[trade.status]}
          </Text>
        </View>
      </View>

      {/* Cards exchange line */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Give card */}
        <View style={{
          flex: 1, padding: 10, borderRadius: 10,
          backgroundColor: rarityColor(giveCardId) + '12',
          borderWidth: 1, borderColor: rarityColor(giveCardId) + '35',
        }}>
          <Text style={{ fontSize: sFont(10), color: colors.textMuted, marginBottom: 2 }}>
            {es ? 'Das' : 'You give'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: rarityColor(giveCardId) }} />
            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {cardName(giveCardId)}
            </Text>
          </View>
          <Text style={{ fontSize: sFont(10), color: colors.textMuted, marginTop: 1 }}>
            {rarityLabel(giveCardId)}
          </Text>
        </View>

        <ArrowLeftRight size={14} color={colors.textMuted} />

        {/* Receive card */}
        <View style={{
          flex: 1, padding: 10, borderRadius: 10,
          backgroundColor: rarityColor(receiveCardId) + '12',
          borderWidth: 1, borderColor: rarityColor(receiveCardId) + '35',
        }}>
          <Text style={{ fontSize: sFont(10), color: colors.textMuted, marginBottom: 2 }}>
            {es ? 'Recibes' : 'You get'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: rarityColor(receiveCardId) }} />
            <Text style={{ fontSize: sFont(12), fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {cardName(receiveCardId)}
            </Text>
          </View>
          <Text style={{ fontSize: sFont(10), color: colors.textMuted, marginTop: 1 }}>
            {rarityLabel(receiveCardId)}
          </Text>
        </View>
      </View>

      {/* Action buttons for pending trades */}
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
            /* Cancel outgoing */
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
  const history  = trades.filter(t => t.status !== 'pending');

  // Accept
  const { mutate: doAccept } = useMutation({
    mutationFn: (tradeId: string) => gamificationApi.acceptTrade(tradeId, user!.id),
    onSuccess: (_data, tradeId) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingTradeId(null);
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
    onSuccess: (_data, tradeId) => {
      Haptics.selectionAsync();
      setPendingTradeId(null);
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
      void refetch();
    },
    onError: () => {
      setPendingTradeId(null);
    },
  });

  // Cancel
  const { mutate: doCancel } = useMutation({
    mutationFn: (tradeId: string) => gamificationApi.cancelTrade(tradeId, user!.id),
    onSuccess: (_data, tradeId) => {
      Haptics.selectionAsync();
      setPendingTradeId(null);
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
      void refetch();
    },
    onError: () => {
      setPendingTradeId(null);
    },
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
            contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 24 }}
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
                  <View style={{
                    backgroundColor: colors.primary + '25',
                    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
                  }}>
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
