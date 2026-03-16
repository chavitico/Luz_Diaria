// Duelo de Sabiduría — Lobby Screen
// Joins the matchmaking queue, polls for a human opponent for up to 7 s,
// then falls back to a bot match automatically.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { X, Swords } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/lib/store';
import { fetchWithTimeout } from '@/lib/fetch';
import { getRandomDuelQuestions } from '@/lib/duel-questions';
import { getDuelUsedQuestionIds } from '@/lib/duel-anti-repeat';
import { getRandomBotName } from '@/lib/duel-bot-names';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const HUMAN_SEARCH_TIMEOUT_MS = 7000; // 7 s before falling back to bot
const POLL_INTERVAL_MS = 1000;

type LobbyPhase = 'searching' | 'found_human' | 'found_bot' | 'starting';

export default function DueloLobby() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUser();

  const [phase, setPhase] = useState<LobbyPhase>('searching');
  const [dotCount, setDotCount] = useState(1);
  const [opponentName, setOpponentName] = useState('');

  const cancelled = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNavigatedRef = useRef(false);
  const questionIdsRef = useRef<string[]>([]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.6);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.4);
  const swordsRotate = useSharedValue(0);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const swordsStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swordsRotate.value}deg` }],
  }));

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (dotIntervalRef.current) clearInterval(dotIntervalRef.current);
  }, []);

  // ── Navigate to game ────────────────────────────────────────────────────────
  const navigateToGame = useCallback(
    (params: {
      matchId: string;
      opponentName: string;
      isBotMatch: string;
      isHumanMatch: string;
      questionIds: string;
      playerNumber?: string;
      opponentId?: string;
      userRating: string;
      rewardedDuelsLeft: string;
    }) => {
      if (hasNavigatedRef.current || cancelled.current) return;
      hasNavigatedRef.current = true;
      stopAll();
      router.replace({
        pathname: '/duelo/game',
        params,
      } as any);
    },
    [router, stopAll]
  );

  // ── Bot fallback ─────────────────────────────────────────────────────────────
  const startBotMatch = useCallback(async () => {
    if (cancelled.current || hasNavigatedRef.current) return;

    // Pick a random biblical bot name once — stays fixed for this match
    const botName = getRandomBotName();

    setPhase('found_bot');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    let resolvedMatchId = 'local';
    let userRating = 1000;
    let rewardedDuelsLeft = 10;

    if (user?.id) {
      try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/duel/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            isBotMatch: true,
            questionIds: questionIdsRef.current,
          }),
        });
        if (res.ok) {
          const data = await res.json() as {
            matchId: string;
            userRating?: number;
            rewardedDuelsLeft?: number;
          };
          resolvedMatchId = data.matchId;
          userRating = data.userRating ?? 1000;
          rewardedDuelsLeft = data.rewardedDuelsLeft ?? 10;
        }
      } catch {
        // silent
      }
    }

    setTimeout(() => {
      setPhase('starting');
      setTimeout(() => {
        navigateToGame({
          matchId: resolvedMatchId,
          opponentName: botName,
          isBotMatch: '1',
          isHumanMatch: '0',
          questionIds: JSON.stringify(questionIdsRef.current),
          playerNumber: '1',
          userRating: String(userRating),
          rewardedDuelsLeft: String(rewardedDuelsLeft),
        });
      }, 800);
    }, 1800);
  }, [user, navigateToGame]);

  // ── Leave queue ──────────────────────────────────────────────────────────────
  const leaveQueue = useCallback(async () => {
    if (!user?.id) return;
    try {
      await fetchWithTimeout(`${BACKEND_URL}/api/duel/queue/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch {
      // idempotent
    }
  }, [user]);

  // ── Poll queue status ────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (!user?.id) return;
    pollIntervalRef.current = setInterval(async () => {
      if (cancelled.current || hasNavigatedRef.current) return;
      try {
        const res = await fetchWithTimeout(
          `${BACKEND_URL}/api/duel/queue/status/${user.id}`,
          { method: 'GET' }
        );
        if (!res.ok) return;
        const data = await res.json() as {
          status: string;
          matchId?: string;
          opponentName?: string;
          opponentId?: string;
          questionIds?: string[];
          playerNumber?: number;
          userRating?: number;
          rewardedDuelsLeft?: number;
        };

        if (data.status === 'matched' && data.matchId) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

          const rivalName = data.opponentName ?? 'Rival';
          setOpponentName(rivalName);
          setPhase('found_human');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          setTimeout(() => {
            setPhase('starting');
            setTimeout(() => {
              navigateToGame({
                matchId: data.matchId!,
                opponentName: rivalName,
                isBotMatch: '0',
                isHumanMatch: '1',
                questionIds: JSON.stringify(data.questionIds ?? questionIdsRef.current),
                playerNumber: String(data.playerNumber ?? 1),
                opponentId: data.opponentId ?? '',
                userRating: String(data.userRating ?? 1000),
                rewardedDuelsLeft: String(data.rewardedDuelsLeft ?? 10),
              });
            }, 800);
          }, 1500);
        }
      } catch {
        // silent — retry next tick
      }
    }, POLL_INTERVAL_MS);
  }, [user, navigateToGame]);

  // ── Main init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Start animations
    ring1Scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, false
    );
    ring1Opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 1000 }), withTiming(0.6, { duration: 1000 })),
      -1, false
    );
    ring2Scale.value = withRepeat(
      withDelay(500, withSequence(withTiming(1.6, { duration: 1200 }), withTiming(1, { duration: 1200 }))),
      -1, false
    );
    ring2Opacity.value = withRepeat(
      withDelay(500, withSequence(withTiming(0, { duration: 1200 }), withTiming(0.4, { duration: 1200 }))),
      -1, false
    );
    swordsRotate.value = withRepeat(
      withSequence(withTiming(8, { duration: 600 }), withTiming(-8, { duration: 600 })),
      -1, true
    );

    dotIntervalRef.current = setInterval(() => {
      setDotCount((c) => (c % 3) + 1);
    }, 500);

    // Generate questions + join queue async
    const init = async () => {
      if (cancelled.current) return;

      // Generate questions with anti-repetition
      const usedIds = await getDuelUsedQuestionIds();
      const questions = getRandomDuelQuestions(10, usedIds);
      questionIdsRef.current = questions.map((q) => q.id);

      if (cancelled.current || !user?.id) {
        // No user — fall back to bot immediately after timeout
        searchTimerRef.current = setTimeout(() => startBotMatch(), HUMAN_SEARCH_TIMEOUT_MS);
        return;
      }

      // Join the queue
      try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/duel/queue/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, questionIds: questionIdsRef.current }),
        });
        if (res.ok) {
          const data = await res.json() as {
            status: string;
            matchId?: string;
            opponentName?: string;
            opponentId?: string;
            questionIds?: string[];
            playerNumber?: number;
            userRating?: number;
            rewardedDuelsLeft?: number;
          };

          if (data.status === 'matched' && data.matchId) {
            // Instant match!
            const rivalName = data.opponentName ?? 'Rival';
            setOpponentName(rivalName);
            setPhase('found_human');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
              setPhase('starting');
              setTimeout(() => {
                navigateToGame({
                  matchId: data.matchId!,
                  opponentName: rivalName,
                  isBotMatch: '0',
                  isHumanMatch: '1',
                  questionIds: JSON.stringify(data.questionIds ?? questionIdsRef.current),
                  playerNumber: String(data.playerNumber ?? 1),
                  opponentId: data.opponentId ?? '',
                  userRating: String(data.userRating ?? 1000),
                  rewardedDuelsLeft: String(data.rewardedDuelsLeft ?? 10),
                });
              }, 800);
            }, 1500);
            return;
          }
        }
      } catch {
        // queue join failed — will fall back to bot after timeout
      }

      if (cancelled.current) return;

      // Start polling + set timeout for bot fallback
      startPolling();
      searchTimerRef.current = setTimeout(async () => {
        if (cancelled.current || hasNavigatedRef.current) return;
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        await leaveQueue();
        startBotMatch();
      }, HUMAN_SEARCH_TIMEOUT_MS);
    };

    init();

    return () => {
      cancelled.current = true;
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async () => {
    cancelled.current = true;
    stopAll();
    await leaveQueue();
    router.back();
  };

  const dots = '.'.repeat(dotCount);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0a0a1a', '#0d1a2e', '#0a0f1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Close button */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
          <Pressable
            onPress={handleCancel}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {/* Main content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>

          {/* Pulsing rings + icon */}
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
            <Animated.View
              style={[ring2Style, {
                position: 'absolute', width: 160, height: 160, borderRadius: 80,
                borderWidth: 1.5, borderColor: 'rgba(99,179,237,0.35)',
              }]}
            />
            <Animated.View
              style={[ring1Style, {
                position: 'absolute', width: 120, height: 120, borderRadius: 60,
                borderWidth: 2, borderColor: 'rgba(99,179,237,0.5)',
              }]}
            />
            <View
              style={{
                width: 88, height: 88, borderRadius: 44,
                backgroundColor: 'rgba(99,179,237,0.12)',
                borderWidth: 2, borderColor: 'rgba(99,179,237,0.35)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Animated.View style={swordsStyle}>
                <Swords size={40} color="#63B3ED" />
              </Animated.View>
            </View>
          </View>

          {/* Title */}
          <Animated.Text
            entering={FadeInDown.delay(200).duration(500)}
            style={{
              fontSize: 28, fontWeight: '800', color: '#FFFFFF',
              textAlign: 'center', letterSpacing: -0.5, marginBottom: 12,
            }}
          >
            Duelo de Sabiduría
          </Animated.Text>

          {/* Status text */}
          {phase === 'searching' && (
            <Animated.Text
              entering={FadeIn.duration(400)}
              style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 8 }}
            >
              Buscando rival{dots}
            </Animated.Text>
          )}

          {phase === 'found_human' && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#68D391', textAlign: 'center', marginBottom: 6 }}>
                ¡Rival encontrado!
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontWeight: '600' }}>
                {opponentName}
              </Text>
            </Animated.View>
          )}

          {phase === 'found_bot' && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 6 }}>
                No se encontró rival
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#F6AD55', textAlign: 'center' }}>
                Entrando contra Juanito Bot
              </Text>
            </Animated.View>
          )}

          {phase === 'starting' && (
            <Animated.Text
              entering={FadeIn.duration(300)}
              style={{ fontSize: 22, fontWeight: '800', color: '#F6E05E', textAlign: 'center', letterSpacing: 2 }}
            >
              ¡Que comience!
            </Animated.Text>
          )}

          {/* Tip */}
          {phase === 'searching' && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(500)}
              style={{
                marginTop: 48,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 14, padding: 16,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20 }}>
                Responde preguntas bíblicas más{'\n'}rápido que tu rival para ganar
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Cancel button */}
        {phase === 'searching' && (
          <Animated.View
            entering={FadeInDown.delay(1000).duration(500)}
            style={{ paddingBottom: insets.bottom + 32, paddingHorizontal: 32 }}
          >
            <Pressable
              onPress={handleCancel}
              style={{
                paddingVertical: 14, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                Cancelar búsqueda
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}
