/**
 * TradeFlowModal
 *
 * Multi-step modal for proposing a card trade with another user.
 *
 * Step 1 — "Tu oferta": pick one of MY duplicate cards
 * Step 2 — "Pides":     pick one of THEIR duplicate cards
 * Step 3 — Review:     confirm + send
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  ChevronRight,
  ChevronLeft,
  ArrowLeftRight,
  Check,
} from 'lucide-react-native';
import { useThemeColors, useLanguage, useUser } from '@/lib/store';
import { useScaledFont } from '@/lib/textScale';
import { gamificationApi, CommunityMember } from '@/lib/gamification-api';
import { BIBLICAL_CARDS, RARITY_CONFIG } from '@/lib/biblical-cards';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradableCard {
  cardId: string;
  duplicates: number;
}

type Step = 'my_card' | 'their_card' | 'review' | 'success';

// ─── Rarity colours ───────────────────────────────────────────────────────────

const RARITY_BORDER: Record<string, string> = {
  common:    '#6B7280',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#F59E0B',
};

// ─── Card Thumbnail chip ──────────────────────────────────────────────────────

function CardChip({
  cardId,
  duplicates,
  selected,
  onPress,
  colors,
  sFont,
}: {
  cardId: string;
  duplicates: number;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
}) {
  const card = BIBLICAL_CARDS[cardId];
  if (!card) return null;
  const borderColor = selected
    ? (RARITY_BORDER[card.rarity] ?? '#F59E0B')
    : colors.textMuted + '30';
  const bg = selected ? (RARITY_BORDER[card.rarity] ?? '#F59E0B') + '18' : colors.surface;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: selected ? 2 : 1,
        borderColor,
        backgroundColor: bg,
        marginBottom: 8,
        gap: 10,
      }}
    >
      {/* Rarity dot */}
      <View style={{
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: RARITY_BORDER[card.rarity] ?? '#6B7280',
      }} />

      {/* Card name + rarity */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {card.nameEs}
        </Text>
        <Text style={{ fontSize: sFont(11), color: colors.textMuted, marginTop: 1 }}>
          {RARITY_CONFIG[card.rarity]?.labelEs ?? card.rarity}
        </Text>
      </View>

      {/* Duplicate count badge */}
      <View style={{
        backgroundColor: RARITY_BORDER[card.rarity] + '25',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}>
        <Text style={{ fontSize: sFont(12), fontWeight: '800', color: RARITY_BORDER[card.rarity] ?? colors.primary }}>
          ×{duplicates + 1}
        </Text>
      </View>

      {selected && <Check size={16} color={RARITY_BORDER[card.rarity] ?? colors.primary} />}
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TradeFlowModalProps {
  visible: boolean;
  recipient: CommunityMember | null;
  onClose: () => void;
}

export function TradeFlowModal({ visible, recipient, onClose }: TradeFlowModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const { sFont } = useScaledFont();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('my_card');
  const [myCard, setMyCard]     = useState<string | null>(null);
  const [theirCard, setTheirCard] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStep('my_card');
      setMyCard(null);
      setTheirCard(null);
    }
  }, [visible]);

  // Fetch MY tradable cards (owned + duplicates > 0)
  const { data: myCardsData, isLoading: loadingMine } = useQuery({
    queryKey: ['tradeableCards', user?.id],
    queryFn: () => gamificationApi.getUserTradeableCards(user!.id),
    enabled: !!user?.id && visible,
    staleTime: 30_000,
  });

  // Fetch THEIR tradable cards
  const { data: theirCardsData, isLoading: loadingTheirs } = useQuery({
    queryKey: ['tradeableCards', recipient?.id],
    queryFn: () => gamificationApi.getUserTradeableCards(recipient!.id),
    enabled: !!recipient?.id && visible,
    staleTime: 30_000,
  });

  const myTradeable: TradableCard[] = (myCardsData?.cards ?? []).filter(c => c.duplicates > 0);
  const theirTradeable: TradableCard[] = (theirCardsData?.cards ?? []).filter(c => c.duplicates > 0);

  // Create trade mutation
  const { mutate: tradeMutate, isPending: tradePending, isError: tradeIsError } = useMutation({
    mutationFn: () => gamificationApi.createTrade({
      fromUserId: user!.id,
      toUserId: recipient!.id,
      offeredCardId: myCard!,
      requestedCardId: theirCard!,
    }),
    onSuccess: (data) => {
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
        setStep('success');
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleSend = useCallback(() => {
    if (!myCard || !theirCard || tradePending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tradeMutate();
  }, [myCard, theirCard, tradePending, tradeMutate]);

  const myCardInfo    = myCard    ? BIBLICAL_CARDS[myCard]    : null;
  const theirCardInfo = theirCard ? BIBLICAL_CARDS[theirCard] : null;

  const es = language === 'es';

  // ── Render ──────────────────────────────────────────────────────────────────

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
          {step !== 'my_card' && step !== 'success' ? (
            <Pressable onPress={() => setStep(step === 'their_card' ? 'my_card' : 'their_card')} style={{ marginRight: 12, padding: 4 }}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: sFont(17), fontWeight: '800', color: colors.text }}>
              {step === 'success'
                ? (es ? '¡Propuesta enviada!' : 'Trade sent!')
                : (es ? 'Intercambiar carta' : 'Trade card')}
            </Text>
            {recipient && step !== 'success' && (
              <Text style={{ fontSize: sFont(12), color: colors.textMuted, marginTop: 1 }}>
                {es ? 'Con' : 'With'} {recipient.nickname}
              </Text>
            )}
          </View>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Step indicators */}
        {step !== 'success' && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, gap: 6 }}>
            {(['my_card', 'their_card', 'review'] as Step[]).map((s, i) => (
              <View key={s} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: (step === s || (step === 'review' && i < 3) || (step === 'their_card' && i < 1) ? colors.primary : colors.textMuted + '30') }} />
            ))}
          </View>
        )}

        {/* ── STEP 1: My card ── */}
        {step === 'my_card' && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}>
              <Text style={{ fontSize: sFont(16), fontWeight: '800', color: colors.text }}>
                {es ? 'Tu oferta' : 'Your offer'}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, marginTop: 3 }}>
                {es ? 'Elige una carta que tengas duplicada' : 'Choose a card you have a duplicate of'}
              </Text>
            </View>

            {loadingMine ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : myTradeable.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                <Text style={{ fontSize: sFont(15), color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
                  {es ? 'No tienes cartas duplicadas para intercambiar.\nAbre más sobres para conseguir duplicados.' : 'You have no duplicate cards to trade.\nOpen more packs to get duplicates.'}
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
                {myTradeable.map(c => (
                  <CardChip
                    key={c.cardId}
                    cardId={c.cardId}
                    duplicates={c.duplicates}
                    selected={myCard === c.cardId}
                    onPress={() => { Haptics.selectionAsync(); setMyCard(c.cardId); }}
                    colors={colors}
                    sFont={sFont}
                  />
                ))}
              </ScrollView>
            )}

            {/* CTA */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: insets.bottom + 16, backgroundColor: colors.background }}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('their_card'); }}
                disabled={!myCard}
                style={{ opacity: myCard ? 1 : 0.4 }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                >
                  <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#FFF' }}>
                    {es ? 'Siguiente' : 'Next'}
                  </Text>
                  <ChevronRight size={18} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── STEP 2: Their card ── */}
        {step === 'their_card' && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}>
              <Text style={{ fontSize: sFont(16), fontWeight: '800', color: colors.text }}>
                {es ? 'Pides' : 'You request'}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, marginTop: 3 }}>
                {es ? `Elige una carta duplicada de ${recipient?.nickname ?? ''}` : `Choose a duplicate card from ${recipient?.nickname ?? ''}`}
              </Text>
            </View>

            {loadingTheirs ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : theirTradeable.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                <Text style={{ fontSize: sFont(15), color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
                  {es ? `${recipient?.nickname ?? 'Este usuario'} no tiene cartas duplicadas disponibles.` : `${recipient?.nickname ?? 'This user'} has no duplicate cards available.`}
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
                {theirTradeable.map(c => (
                  <CardChip
                    key={c.cardId}
                    cardId={c.cardId}
                    duplicates={c.duplicates}
                    selected={theirCard === c.cardId}
                    onPress={() => { Haptics.selectionAsync(); setTheirCard(c.cardId); }}
                    colors={colors}
                    sFont={sFont}
                  />
                ))}
              </ScrollView>
            )}

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: insets.bottom + 16, backgroundColor: colors.background }}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('review'); }}
                disabled={!theirCard}
                style={{ opacity: theirCard ? 1 : 0.4 }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                >
                  <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#FFF' }}>
                    {es ? 'Revisar' : 'Review'}
                  </Text>
                  <ChevronRight size={18} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 'review' && myCardInfo && theirCardInfo && (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
            <Text style={{ fontSize: sFont(13), color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
              {es ? 'Revisa el intercambio antes de enviarlo.' : 'Review the trade before sending.'}
            </Text>

            {/* Trade preview card */}
            <View style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.textMuted + '25',
              backgroundColor: colors.surface,
              padding: 18,
              gap: 12,
            }}>
              {/* MY CARD → */}
              <View>
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  {es ? 'Ofreces' : 'You offer'}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 12, borderRadius: 12,
                  backgroundColor: (RARITY_BORDER[myCardInfo.rarity] ?? colors.primary) + '12',
                  borderWidth: 1, borderColor: (RARITY_BORDER[myCardInfo.rarity] ?? colors.primary) + '40',
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RARITY_BORDER[myCardInfo.rarity] ?? colors.primary }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text }}>{myCardInfo.nameEs}</Text>
                    <Text style={{ fontSize: sFont(11), color: colors.textMuted }}>{RARITY_CONFIG[myCardInfo.rarity]?.labelEs ?? myCardInfo.rarity}</Text>
                  </View>
                </View>
              </View>

              {/* Arrow */}
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: colors.primary + '15',
                  borderWidth: 1, borderColor: colors.primary + '30',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <ArrowLeftRight size={16} color={colors.primary} />
                </View>
              </View>

              {/* THEIR CARD ← */}
              <View>
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  {es ? 'Recibes' : 'You receive'}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 12, borderRadius: 12,
                  backgroundColor: (RARITY_BORDER[theirCardInfo.rarity] ?? colors.primary) + '12',
                  borderWidth: 1, borderColor: (RARITY_BORDER[theirCardInfo.rarity] ?? colors.primary) + '40',
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RARITY_BORDER[theirCardInfo.rarity] ?? colors.primary }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text }}>{theirCardInfo.nameEs}</Text>
                    <Text style={{ fontSize: sFont(11), color: colors.textMuted }}>{RARITY_CONFIG[theirCardInfo.rarity]?.labelEs ?? theirCardInfo.rarity}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Recipient note */}
            <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: colors.surface }}>
              <Text style={{ fontSize: sFont(12), color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
                {es
                  ? `${recipient?.nickname ?? ''} recibirá una notificación y podrá aceptar o rechazar.`
                  : `${recipient?.nickname ?? ''} will receive a notification and can accept or reject.`}
              </Text>
            </View>

            {/* Error */}
            {tradeIsError && (
              <View style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#F43F5E20' }}>
                <Text style={{ color: '#F43F5E', fontSize: sFont(13), textAlign: 'center' }}>
                  {es ? 'Error al enviar. Intenta de nuevo.' : 'Failed to send. Please try again.'}
                </Text>
              </View>
            )}

            {/* Send CTA */}
            <Pressable
              onPress={handleSend}
              disabled={tradePending}
              style={{ marginTop: 20, opacity: tradePending ? 0.6 : 1 }}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'CC']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {tradePending
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <>
                    <ArrowLeftRight size={17} color="#FFF" />
                    <Text style={{ fontSize: sFont(15), fontWeight: '800', color: '#FFF' }}>
                      {es ? 'Enviar propuesta' : 'Send proposal'}
                    </Text>
                  </>
                }
              </LinearGradient>
            </Pressable>
          </ScrollView>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: colors.primary + '20',
              borderWidth: 2, borderColor: colors.primary + '40',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowLeftRight size={32} color={colors.primary} />
            </View>
            <Text style={{ fontSize: sFont(20), fontWeight: '900', color: colors.text, textAlign: 'center' }}>
              {es ? '¡Propuesta enviada!' : 'Proposal sent!'}
            </Text>
            <Text style={{ fontSize: sFont(14), color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
              {es
                ? `${recipient?.nickname ?? ''} recibirá tu propuesta y podrá aceptarla o rechazarla.`
                : `${recipient?.nickname ?? ''} will receive your proposal and can accept or reject it.`}
            </Text>
            <Pressable
              onPress={onClose}
              style={{ marginTop: 8, paddingHorizontal: 32, paddingVertical: 13, borderRadius: 14, backgroundColor: colors.primary }}
            >
              <Text style={{ fontSize: sFont(15), fontWeight: '700', color: '#FFF' }}>
                {es ? 'Listo' : 'Done'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
