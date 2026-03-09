/**
 * TradeFlowModal
 *
 * Multi-step modal for proposing a card trade with another user.
 *
 * Step 1 — "Tu oferta": pick one of MY duplicate cards
 * Step 2 — "Pides":     pick one of THEIR duplicate cards
 * Step 3 — Review:     confirm + send
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
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
import { CardThumb } from '@/components/CardThumb';

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

// ─── Context badge ────────────────────────────────────────────────────────────
// shown on each card chip to help the user make a good trade decision

function ContextBadge({
  label,
  positive,
  sFont,
}: {
  label: string;
  positive: boolean;
  sFont: (n: number) => number;
}) {
  return (
    <View style={{
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: positive ? '#22C55E18' : '#6B728018',
      borderWidth: 1,
      borderColor: positive ? '#22C55E40' : '#6B728030',
      alignSelf: 'flex-start',
      marginTop: 3,
    }}>
      <Text style={{ fontSize: sFont(10), fontWeight: '700', color: positive ? '#22C55E' : '#9CA3AF' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Card Chip ────────────────────────────────────────────────────────────────

function CardChip({
  cardId,
  duplicates,
  selected,
  onPress,
  contextLabel,
  contextPositive,
  colors,
  sFont,
}: {
  cardId: string;
  duplicates: number;
  selected: boolean;
  onPress: () => void;
  contextLabel?: string;
  contextPositive?: boolean;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
}) {
  const card = BIBLICAL_CARDS[cardId];
  if (!card) return null;
  const rarityColor = RARITY_BORDER[card.rarity] ?? '#6B7280';
  const borderColor = selected ? rarityColor : colors.textMuted + '25';
  const bg = selected ? rarityColor + '12' : colors.surface;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 14,
        borderWidth: selected ? 2 : 1,
        borderColor,
        backgroundColor: bg,
        marginBottom: 8,
        gap: 10,
      }}
    >
      {/* Thumbnail */}
      <CardThumb cardId={cardId} height={68} />

      {/* Card info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: sFont(13), fontWeight: '700', color: colors.text }} numberOfLines={2}>
          {card.nameEs}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: rarityColor }} />
          <Text style={{ fontSize: sFont(11), color: colors.textMuted }}>
            {RARITY_CONFIG[card.rarity]?.labelEs ?? card.rarity}
          </Text>
        </View>
        {contextLabel !== undefined && contextPositive !== undefined && (
          <ContextBadge label={contextLabel} positive={contextPositive} sFont={sFont} />
        )}
      </View>

      {/* Right side: duplicate badge + check */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{
          backgroundColor: rarityColor + '25',
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 3,
        }}>
          <Text style={{ fontSize: sFont(12), fontWeight: '800', color: rarityColor }}>
            ×{duplicates + 1}
          </Text>
        </View>
        {selected && <Check size={15} color={rarityColor} />}
      </View>
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

  const es = language === 'es';

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

  // Fetch THEIR tradable cards + full inventory (to detect ownership)
  const { data: theirCardsData, isLoading: loadingTheirs } = useQuery({
    queryKey: ['tradeableCards', recipient?.id],
    queryFn: () => gamificationApi.getUserTradeableCards(recipient!.id),
    enabled: !!recipient?.id && visible,
    staleTime: 30_000,
  });

  // Also fetch THEIR full card inventory (includes non-duplicate cards) for context
  const { data: theirAllCardsData } = useQuery({
    queryKey: ['allCards', recipient?.id],
    queryFn: () => gamificationApi.getUserTradeableCards(recipient!.id),
    enabled: !!recipient?.id && visible,
    staleTime: 30_000,
  });

  const myTradeable: TradableCard[] = (myCardsData?.cards ?? []).filter(c => c.duplicates > 0);
  const theirTradeable: TradableCard[] = (theirCardsData?.cards ?? []).filter(c => c.duplicates > 0);

  // Build ownership sets for context badges
  // Set of cardIds that THEY own (any count)
  const theirOwnedSet = useMemo(() => {
    const owned = theirAllCardsData?.cards ?? [];
    return new Set(owned.map(c => c.cardId));
  }, [theirAllCardsData]);

  // Set of cardIds that I own (any count)
  const myOwnedSet = useMemo(() => {
    const owned = myCardsData?.cards ?? [];
    return new Set(owned.map(c => c.cardId));
  }, [myCardsData]);

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
              {/* Legend */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                  <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>
                    {es ? 'Le falta' : 'They need it'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' }} />
                  <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>
                    {es ? 'Ya la tiene' : 'They have it'}
                  </Text>
                </View>
              </View>
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
                {myTradeable.map(c => {
                  const theyHaveIt = theirOwnedSet.has(c.cardId);
                  const ctxLabel = es
                    ? (theyHaveIt ? 'Ya la tiene' : 'Le falta')
                    : (theyHaveIt ? 'They have it' : 'They need it');
                  return (
                    <CardChip
                      key={c.cardId}
                      cardId={c.cardId}
                      duplicates={c.duplicates}
                      selected={myCard === c.cardId}
                      onPress={() => { Haptics.selectionAsync(); setMyCard(c.cardId); }}
                      contextLabel={ctxLabel}
                      contextPositive={!theyHaveIt}
                      colors={colors}
                      sFont={sFont}
                    />
                  );
                })}
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
              {/* Legend */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                  <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>
                    {es ? 'No la tienes' : 'You don\'t have it'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' }} />
                  <Text style={{ fontSize: sFont(10), color: colors.textMuted }}>
                    {es ? 'Ya la tienes' : 'You have it'}
                  </Text>
                </View>
              </View>
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
                {theirTradeable.map(c => {
                  const iHaveIt = myOwnedSet.has(c.cardId);
                  const ctxLabel = es
                    ? (iHaveIt ? 'Ya la tienes' : 'No la tienes')
                    : (iHaveIt ? 'You have it' : 'You don\'t have it');
                  return (
                    <CardChip
                      key={c.cardId}
                      cardId={c.cardId}
                      duplicates={c.duplicates}
                      selected={theirCard === c.cardId}
                      onPress={() => { Haptics.selectionAsync(); setTheirCard(c.cardId); }}
                      contextLabel={ctxLabel}
                      contextPositive={!iHaveIt}
                      colors={colors}
                      sFont={sFont}
                    />
                  );
                })}
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
              padding: 16,
              gap: 12,
            }}>
              {/* MY CARD → */}
              <View>
                <Text style={{ fontSize: sFont(11), fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  {es ? 'Ofreces' : 'You offer'}
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  padding: 10, borderRadius: 12,
                  backgroundColor: (RARITY_BORDER[myCardInfo.rarity] ?? colors.primary) + '10',
                  borderWidth: 1, borderColor: (RARITY_BORDER[myCardInfo.rarity] ?? colors.primary) + '35',
                }}>
                  <CardThumb cardId={myCard!} height={80} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text }}>{myCardInfo.nameEs}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: RARITY_BORDER[myCardInfo.rarity] ?? colors.primary }} />
                      <Text style={{ fontSize: sFont(11), color: colors.textMuted }}>{RARITY_CONFIG[myCardInfo.rarity]?.labelEs ?? myCardInfo.rarity}</Text>
                    </View>
                    {/* Context: does recipient need it? */}
                    {myCard && (
                      <View style={{
                        alignSelf: 'flex-start',
                        marginTop: 5,
                        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
                        backgroundColor: theirOwnedSet.has(myCard) ? '#6B728018' : '#22C55E18',
                        borderWidth: 1,
                        borderColor: theirOwnedSet.has(myCard) ? '#6B728030' : '#22C55E40',
                      }}>
                        <Text style={{ fontSize: sFont(10), fontWeight: '700', color: theirOwnedSet.has(myCard) ? '#9CA3AF' : '#22C55E' }}>
                          {es
                            ? (theirOwnedSet.has(myCard) ? 'Ya la tiene' : 'Le falta')
                            : (theirOwnedSet.has(myCard) ? 'They have it' : 'They need it')}
                        </Text>
                      </View>
                    )}
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
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  padding: 10, borderRadius: 12,
                  backgroundColor: (RARITY_BORDER[theirCardInfo.rarity] ?? colors.primary) + '10',
                  borderWidth: 1, borderColor: (RARITY_BORDER[theirCardInfo.rarity] ?? colors.primary) + '35',
                }}>
                  <CardThumb cardId={theirCard!} height={80} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text }}>{theirCardInfo.nameEs}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: RARITY_BORDER[theirCardInfo.rarity] ?? colors.primary }} />
                      <Text style={{ fontSize: sFont(11), color: colors.textMuted }}>{RARITY_CONFIG[theirCardInfo.rarity]?.labelEs ?? theirCardInfo.rarity}</Text>
                    </View>
                    {/* Context: do I already own it? */}
                    {theirCard && (
                      <View style={{
                        alignSelf: 'flex-start',
                        marginTop: 5,
                        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
                        backgroundColor: myOwnedSet.has(theirCard) ? '#6B728018' : '#22C55E18',
                        borderWidth: 1,
                        borderColor: myOwnedSet.has(theirCard) ? '#6B728030' : '#22C55E40',
                      }}>
                        <Text style={{ fontSize: sFont(10), fontWeight: '700', color: myOwnedSet.has(theirCard) ? '#9CA3AF' : '#22C55E' }}>
                          {es
                            ? (myOwnedSet.has(theirCard) ? 'Ya la tienes' : 'No la tienes')
                            : (myOwnedSet.has(theirCard) ? 'You have it' : 'You don\'t have it')}
                        </Text>
                      </View>
                    )}
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
