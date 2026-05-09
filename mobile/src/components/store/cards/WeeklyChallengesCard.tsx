import React from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Gift, Info, Check, X, Coins, Swords } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import type { useThemeColors } from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';

function WeeklyChallengesCard({
  colors,
  language,
  userId,
  onAllComplete,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  userId: string;
  onAllComplete: (complete: boolean) => void;
}) {
  const t = TRANSLATIONS[language];
  const queryClient = useQueryClient();
  const updateUser = useAppStore((s) => s.updateUser);
  const [selectedChallenge, setSelectedChallenge] = React.useState<{
    title: string;
    description: string;
    type: string;
  } | null>(null);

  // Use round-aware endpoint: returns the user's current active round of challenges
  const { data: activeRound, isLoading: challengesLoading } = useQuery({
    queryKey: ['weeklyChallenges', userId],
    queryFn: () => gamificationApi.getActiveRoundChallenges(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const challenges = activeRound?.challenges ?? [];
  const activeWeekId = activeRound?.weekId;
  const roundNumber = activeRound?.roundNumber ?? 1;

  const { data: progressData = [], isLoading: progressLoading } = useQuery({
    queryKey: ['challengeProgress', userId, activeWeekId],
    queryFn: () => gamificationApi.getChallengeProgress(userId, activeWeekId),
    enabled: !!userId && !!activeWeekId,
    staleTime: 30 * 1000,
    retry: 1,
  });

  // All challenges in the current round are visible (max 3)
  const visibleChallenges = challenges.slice(0, 3);

  // Check if all visible challenges are complete + claimed
  React.useEffect(() => {
    if (visibleChallenges.length > 0 && progressData.length > 0) {
      const allComplete = visibleChallenges.every(c => {
        const progress = progressData.find(p => p.challengeId === c.id);
        return progress?.completed && progress?.claimed;
      });
      onAllComplete(allComplete);
    } else if (!challengesLoading && challenges.length === 0) {
      // No challenges loaded — don't change state
    }
  }, [visibleChallenges, progressData, onAllComplete, challengesLoading, challenges.length]);

  const claimMutation = useMutation({
    mutationFn: ({ challengeId }: { challengeId: string }) =>
      gamificationApi.claimChallengeReward(userId, challengeId),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', userId] });
      if (data.pointsAwarded) {
        updateUser({ points: (useAppStore.getState().user?.points || 0) + data.pointsAwarded });
        addLedgerEntry({
          delta: data.pointsAwarded,
          kind: 'challenge',
          title: language === 'es' ? 'Desafío completado' : 'Challenge completed',
          detail: '',
        });
      }
    },
  });

  const getChallengeTypeHint = (type: string, lang: 'en' | 'es') => {
    if (lang === 'es') {
      switch (type) {
        case 'prayer': return 'Toca el botón "Ya oré" en la pantalla principal para registrar tu oración diaria.';
        case 'share': return 'Toca el botón de compartir en el devocional y envíalo por WhatsApp u otras apps.';
        case 'devotional_complete': return 'Lee el devocional completo del día en la pantalla principal.';
        case 'duel_play': return 'Juega duelos bíblicos desde la sección de Duelo de Sabiduría. Cuentan tanto las victorias como las derrotas.';
        case 'duel_win': return 'Demuestra tu conocimiento bíblico y gana duelos en la sección de Duelo de Sabiduría.';
        case 'duel_win_streak': return 'Gana duelos consecutivos sin perder. Si pierdes uno, el contador se reinicia.';
        default: return '';
      }
    } else {
      switch (type) {
        case 'prayer': return 'Tap the "I prayed" button on the main screen to register your daily prayer.';
        case 'share': return 'Tap the share button on the devotional and send it via WhatsApp or other apps.';
        case 'devotional_complete': return 'Read the full daily devotional on the main screen.';
        case 'duel_play': return 'Play biblical duels in the Duelo de Sabiduría section. Both wins and losses count.';
        case 'duel_win': return 'Demonstrate your biblical knowledge and win duels in the Duelo de Sabiduría section.';
        case 'duel_win_streak': return 'Win duels consecutively without losing. If you lose one, the counter resets.';
        default: return '';
      }
    }
  };

  if (!challengesLoading && challenges.length === 0) return null;

  // Show skeleton while loading
  if (challengesLoading || progressLoading) {
    return (
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{ marginHorizontal: 20, marginBottom: 16 }}
      >
        <View style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(249,115,22,0.20)',
          backgroundColor: '#120D05',
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 90,
        }}>
          <ActivityIndicator size="small" color="#F97316" />
        </View>
      </Animated.View>
    );
  }

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
        }}
      >
        {/* Compact card — reduced shadow/border prominence */}
        <View style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(249,115,22,0.20)',
          overflow: 'hidden',
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.38 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(18,13,5,0.88)', 'rgba(18,13,5,0.72)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* Subtle inner glow */}
          <LinearGradient
            colors={['#F9731610', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Compact content */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            {/* Header row — smaller */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#F9731620',
                borderWidth: 1,
                borderColor: '#F9731630',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <Gift size={16} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 }}>
                  {t.weekly_challenges}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: '500', marginTop: 1 }}>
                  {roundNumber > 1
                    ? (language === 'es' ? `Ronda ${roundNumber} · Nuevas misiones` : `Round ${roundNumber} · New missions`)
                    : (language === 'es' ? 'Completa y reclama recompensas' : 'Complete and claim rewards')}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

            {visibleChallenges.map((challenge, index) => {
              const progress = progressData.find(p => p.challengeId === challenge.id);
              const currentCount = progress?.currentCount || 0;
              const progressPercent = Math.min((currentCount / challenge.goalCount) * 100, 100);
              const isComplete = progress?.completed || false;
              const isClaimed = progress?.claimed || false;
              const title = language === 'es' ? challenge.titleEs : challenge.titleEn;
              const description = language === 'es' ? challenge.descriptionEs : challenge.descriptionEn;

              return (
                <View key={challenge.id} style={index > 0 ? { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' } : {}}>
                  {/* Title row — compact */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallenge({ title, description, type: challenge.type });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 5 }}
                    >
                      {challenge.type.startsWith('duel_') && (
                        <Swords size={11} color="#F6AD55" style={{ flexShrink: 0 }} />
                      )}
                      <Text
                        style={{ fontSize: 12, fontWeight: '600', color: challenge.type.startsWith('duel_') ? '#F6AD55' : 'rgba(255,255,255,0.85)', flex: 1 }}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      <Info size={11} color="rgba(255,255,255,0.25)" />
                    </Pressable>
                    <View style={{
                      backgroundColor: isComplete ? '#22C55E20' : 'rgba(255,255,255,0.07)',
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isComplete ? '#22C55E' : 'rgba(255,255,255,0.45)' }}>
                        {currentCount}/{challenge.goalCount}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar — thinner */}
                  <View style={{ height: 4, borderRadius: 99, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 5 }}>
                    <LinearGradient
                      colors={isComplete ? ['#22C55E', '#16A34A'] : [colors.primary, colors.primary + 'AA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 99 }}
                    />
                  </View>

                  {/* Bottom row: points + action — compact */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Coins size={11} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                        +{challenge.rewardPoints}
                      </Text>
                    </View>

                    {isComplete && !isClaimed && (
                      <Pressable
                        onPress={() => claimMutation.mutate({ challengeId: challenge.id })}
                        disabled={claimMutation.isPending}
                        style={{
                          backgroundColor: '#22C55E',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                        }}
                      >
                        {claimMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                            {t.claim_reward}
                          </Text>
                        )}
                      </Pressable>
                    )}

                    {isClaimed && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E12', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 3 }}>
                        <Check size={10} color="#22C55E" strokeWidth={3} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#22C55E' }}>
                          {t.reward_claimed}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Challenge Description Modal */}
      <Modal
        visible={!!selectedChallenge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedChallenge(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setSelectedChallenge(null)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 360,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-4">
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: '#F97316' + '20' }}
              >
                <Gift size={22} color="#F97316" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                  {selectedChallenge?.title}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {language === 'es' ? 'Desafío semanal' : 'Weekly challenge'}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedChallenge(null)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.textMuted + '18' }}
              >
                <X size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Description */}
            <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.background }}>
              <Text className="text-sm leading-5" style={{ color: colors.text }}>
                {selectedChallenge?.description}
              </Text>
            </View>

            {/* How to complete */}
            <View className="p-3 rounded-xl" style={{ backgroundColor: colors.primary + '12' }}>
              <Text className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
                {language === 'es' ? '¿Cómo completarlo?' : 'How to complete it?'}
              </Text>
              <Text className="text-xs leading-5" style={{ color: colors.text }}>
                {selectedChallenge ? getChallengeTypeHint(selectedChallenge.type, language) : ''}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default WeeklyChallengesCard;
