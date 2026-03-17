// Duelo de Sabiduría — Game Screen
// Supports both bot matches and real human vs human matches via backend round sync.

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { Check, X, Clock, Swords, Trophy, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser, useAppStore } from '@/lib/store';
import { preloadDuelSounds, unloadDuelSounds, playSound, setSfxEnabled } from '@/lib/audio';
import { addLedgerEntry } from '@/lib/points-ledger';
import { fetchWithTimeout } from '@/lib/fetch';
import { addDuelUsedQuestions } from '@/lib/duel-anti-repeat';
import { getRandomDuelQuestions, getDuelQuestionsByIds, type DuelQuestion } from '@/lib/duel-questions';
import { useQueryClient } from '@tanstack/react-query';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const QUESTION_TIMER_SECONDS = 30;
const ROUND_POLL_INTERVAL_MS = 800;
const HEARTBEAT_INTERVAL_MS = 5000;

/** Bot accuracy and speed per rating tier */
function getBotParams(rating: number): { correctProb: number; minDelay: number; maxDelay: number } {
  if (rating < 900)  return { correctProb: 0.50, minDelay: 2000, maxDelay: 6000 };
  if (rating < 1100) return { correctProb: 0.65, minDelay: 3000, maxDelay: 8000 };
  if (rating < 1300) return { correctProb: 0.75, minDelay: 2500, maxDelay: 7000 };
  return                    { correctProb: 0.85, minDelay: 1500, maxDelay: 5000 };
}

type AnswerState = 'unanswered' | 'answered';
type DuelOutcome = 'player_wins' | 'bot_wins' | null;
type GamePhase = 'question' | 'reveal' | 'finished';

interface QuestionResult {
  questionId: string;
  playerAnswerIndex: number | null;
  botAnswerIndex: number | null;
  correctIndex: number;
  playerCorrect: boolean;
  botCorrect: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─── AnswerCard ────────────────────────────────────────────────────────────────
type AnswerCardState = 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed';

const AnswerCard = memo(function AnswerCard({
  index,
  option,
  state,
  showBotDot,
  botCorrect,
  disabled,
  onPress,
}: {
  index: number;
  option: string;
  state: AnswerCardState;
  showBotDot: boolean;
  botCorrect: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSequence(
        withTiming(0.96, { duration: 80 }),
        withSpring(1.02, { damping: 10, stiffness: 320 }),
        withSpring(1.0, { damping: 16, stiffness: 280 })
      );
    }
  };

  const cardBg =
    state === 'correct'  ? 'rgba(104,211,145,0.13)' :
    state === 'wrong'    ? 'rgba(252,129,129,0.11)'  :
    state === 'selected' ? 'rgba(99,179,237,0.11)'   :
    'rgba(255,255,255,0.045)';

  const cardBorder =
    state === 'correct'  ? 'rgba(104,211,145,0.55)' :
    state === 'wrong'    ? 'rgba(252,129,129,0.5)'   :
    state === 'selected' ? 'rgba(99,179,237,0.5)'    :
    state === 'dimmed'   ? 'rgba(255,255,255,0.05)'  :
    'rgba(255,255,255,0.1)';

  const textColor =
    state === 'correct'  ? '#68D391' :
    state === 'wrong'    ? '#FC8181' :
    state === 'selected' ? '#93C5FD' :
    state === 'dimmed'   ? 'rgba(255,255,255,0.28)' :
    'rgba(255,255,255,0.92)';

  const badgeBg =
    state === 'correct'  ? 'rgba(104,211,145,0.22)' :
    state === 'wrong'    ? 'rgba(252,129,129,0.22)'  :
    state === 'selected' ? 'rgba(99,179,237,0.22)'   :
    state === 'dimmed'   ? 'rgba(255,255,255,0.04)'  :
    'rgba(255,255,255,0.09)';

  const badgeBorder =
    state === 'correct'  ? 'rgba(104,211,145,0.45)' :
    state === 'wrong'    ? 'rgba(252,129,129,0.4)'   :
    state === 'selected' ? 'rgba(99,179,237,0.4)'    :
    'rgba(255,255,255,0.08)';

  const badgeTextColor =
    state === 'correct'  ? '#68D391' :
    state === 'wrong'    ? '#FC8181' :
    state === 'selected' ? '#93C5FD' :
    state === 'dimmed'   ? 'rgba(255,255,255,0.2)'  :
    'rgba(255,255,255,0.7)';

  const BadgeContent = () => {
    if (state === 'correct') return <Check size={16} color="#68D391" strokeWidth={2.5} />;
    if (state === 'wrong')   return <X     size={16} color="#FC8181" strokeWidth={2.5} />;
    return (
      <Text style={{ fontSize: 13, fontWeight: '800', color: badgeTextColor, letterSpacing: 0.2 }}>
        {OPTION_LABELS[index]}
      </Text>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55).duration(260)}
      style={[cardStyle, { opacity: state === 'dimmed' ? 0.45 : 1 }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        disabled={disabled}
        style={{
          backgroundColor: cardBg,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: cardBorder,
          paddingVertical: 17,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          shadowColor: state === 'correct' ? '#68D391' : state === 'wrong' ? '#FC8181' : '#63B3ED',
          shadowOffset: { width: 0, height: state !== 'default' && state !== 'dimmed' ? 4 : 2 },
          shadowOpacity: state !== 'default' && state !== 'dimmed' ? 0.18 : 0.06,
          shadowRadius: 10,
        }}
      >
        <View
          style={{
            width: 36, height: 36, borderRadius: 11,
            backgroundColor: badgeBg, borderWidth: 1, borderColor: badgeBorder,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <BadgeContent />
        </View>

        <Text
          style={{
            flex: 1, fontSize: 15,
            fontWeight: state === 'default' || state === 'dimmed' ? '500' : '700',
            color: textColor, lineHeight: 22,
          }}
        >
          {option}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {(state === 'selected' || state === 'correct' || state === 'wrong') && (
            <View
              style={{
                width: 9, height: 9, borderRadius: 5,
                backgroundColor: state === 'correct' ? '#68D391' : state === 'wrong' ? '#FC8181' : '#63B3ED',
              }}
            />
          )}
          {showBotDot && (
            <View
              style={{
                width: 9, height: 9, borderRadius: 5,
                backgroundColor: botCorrect ? '#68D391' : '#FC8181',
                opacity: 0.8,
              }}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});


export default function DueloGame() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    matchId: string;
    opponentName: string;
    isBotMatch: string;
    isHumanMatch: string;
    questionIds: string;
    playerNumber: string;
    opponentId: string;
    userRating: string;
    rewardedDuelsLeft: string;
  }>();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const updateUser = useAppStore(s => s.updateUser);
  const sfxEnabled = useAppStore(s => s.user?.settings?.sfxEnabled ?? true);
  const queryClient = useQueryClient();

  const matchId = params.matchId ?? 'local';
  const opponentName = params.opponentName ?? 'Juanito Bot';
  const isHumanMatch = params.isHumanMatch === '1';
  const playerNumber = parseInt(params.playerNumber ?? '1', 10);
  const userRating = parseInt(params.userRating ?? '1000', 10);
  const botParams = getBotParams(userRating);

  // Parse question IDs from params
  const questionIdsParam = (() => {
    try {
      return params.questionIds ? (JSON.parse(params.questionIds) as string[]) : [];
    } catch {
      return [] as string[];
    }
  })();

  // Game state
  const [questions] = useState<DuelQuestion[]>(() => {
    if (questionIdsParam.length > 0) {
      const byIds = getDuelQuestionsByIds(questionIdsParam);
      if (byIds.length > 0) return byIds;
    }
    return getRandomDuelQuestions(10);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('question');
  const [playerAnswer, setPlayerAnswer] = useState<number | null>(null);
  const [botAnswer, setBotAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [duelOutcome, setDuelOutcome] = useState<DuelOutcome>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [capReached, setCapReached] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<{ titleEs: string; rewardPoints: number }[]>([]);

  // Stable refs for closures
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<GamePhase>('question');
  const playerAnswerRef = useRef<number | null>(null);
  const botAnswerRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const playerScoreRef = useRef(0);
  const botScoreRef = useRef(0);
  const resultsRef = useRef<QuestionResult[]>([]);
  const humanAnswerSubmittedRef = useRef(false); // prevent duplicate submissions

  // Keep refs in sync with state
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { playerScoreRef.current = playerScore; }, [playerScore]);
  useEffect(() => { botScoreRef.current = botScore; }, [botScore]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  // ── Audio: preload on mount, unload on exit ───────────────────────────────────
  useEffect(() => {
    preloadDuelSounds();
    return () => { unloadDuelSounds(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Audio: keep sfx toggle in sync with settings ─────────────────────────────
  useEffect(() => { setSfxEnabled(sfxEnabled); }, [sfxEnabled]);

  // Timer animation
  const timerProgress = useSharedValue(1);
  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%` as any,
    backgroundColor: timerProgress.value > 0.4 ? '#68D391' : timerProgress.value > 0.2 ? '#F6E05E' : '#FC8181',
  }));

  const currentQuestion = questions[currentIndex];

  const stopRoundPoll = useCallback(() => {
    if (roundPollRef.current) {
      clearInterval(roundPollRef.current);
      roundPollRef.current = null;
    }
  }, []);

  const endDuel = useCallback(async (outcome: DuelOutcome, pScore: number, bScore: number, allResults: QuestionResult[]) => {
    setPhase('finished');
    phaseRef.current = 'finished';
    setDuelOutcome(outcome);

    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (roundPollRef.current) clearInterval(roundPollRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    Haptics.notificationAsync(
      outcome === 'player_wins'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    playSound(outcome === 'player_wins' ? 'win' : 'lose');

    const pts = outcome === 'player_wins' ? 40 : 10;
    setPointsAwarded(pts);

    // Track used question IDs for anti-repetition
    addDuelUsedQuestions(questions.map(q => q.id)).catch(() => {});

    // Award points on backend
    if (user?.id && matchId !== 'local') {
      setRewardLoading(true);
      try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/duel/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            userId: user.id,
            outcome: outcome === 'player_wins' ? 'win' : 'loss',
            player1Score: pScore,
            player2Score: bScore,
          }),
        });
        if (res.ok) {
          const data = await res.json() as {
            pointsAwarded: number;
            newTotal: number;
            capReached?: boolean;
            completedMissions?: { titleEs: string; rewardPoints: number }[];
          };
          setPointsAwarded(data.pointsAwarded);
          setCapReached(data.capReached ?? false);
          updateUser({ points: data.newTotal });
          if (data.completedMissions && data.completedMissions.length > 0) {
            setCompletedMissions(data.completedMissions);
            // Invalidate weekly challenge progress cache so the store card refreshes
            queryClient.invalidateQueries({ queryKey: ['challengeProgress'] });
          }
        } else {
          updateUser({ points: (user.points ?? 0) + pts });
        }
      } catch {
        updateUser({ points: (user.points ?? 0) + pts });
      } finally {
        setRewardLoading(false);
      }
    } else if (user?.id) {
      updateUser({ points: (user.points ?? 0) + pts });
    }

    addLedgerEntry({
      kind: 'challenge',
      delta: pts,
      title: outcome === 'player_wins' ? '¡Duelo ganado!' : 'Duelo completado',
      detail: `Duelo de Sabiduría — ${pScore} vs ${bScore}`,
    });

    // Invalidate duel ranking so the pregame screen shows fresh stats next visit
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['duel-ranking', user.id] });
    }
  }, [matchId, questions, user?.id, user?.points, updateUser, queryClient]);

  const evaluateAnswers = useCallback((pAns: number | null, bAns: number | null, question: DuelQuestion, pScore: number, bScore: number, prevResults: QuestionResult[]) => {
    const playerCorrect = pAns !== null && pAns !== -1 && pAns === question.correctIndex;
    const botCorrect = bAns !== null && bAns !== -1 && bAns === question.correctIndex;

    // Play answer result sound (only when player actually answered, not timed out)
    if (pAns !== null && pAns !== -1) {
      playSound(playerCorrect ? 'correct' : 'wrong');
    }

    const result: QuestionResult = {
      questionId: question.id,
      playerAnswerIndex: pAns,
      botAnswerIndex: bAns,
      correctIndex: question.correctIndex,
      playerCorrect,
      botCorrect,
    };

    const newResults = [...prevResults, result];
    let newPScore = pScore;
    let newBScore = bScore;

    if (playerCorrect) newPScore += 1;
    if (botCorrect) newBScore += 1;

    if (playerCorrect && !botCorrect) {
      setResults(newResults);
      setPlayerScore(newPScore);
      setBotScore(newBScore);
      revealTimerRef.current = setTimeout(() => {
        endDuel('player_wins', newPScore, newBScore, newResults);
      }, 1500);
      return;
    }
    if (botCorrect && !playerCorrect) {
      setResults(newResults);
      setPlayerScore(newPScore);
      setBotScore(newBScore);
      revealTimerRef.current = setTimeout(() => {
        endDuel('bot_wins', newPScore, newBScore, newResults);
      }, 1500);
      return;
    }

    // Both correct or both wrong → next question
    setResults(newResults);
    setPlayerScore(newPScore);
    setBotScore(newBScore);

    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx >= questions.length) {
      endDuel(newPScore >= newBScore ? 'player_wins' : 'bot_wins', newPScore, newBScore, newResults);
      return;
    }

    revealTimerRef.current = setTimeout(() => {
      setCurrentIndex(nextIdx);
      setPhase('question');
      phaseRef.current = 'question';
      setPlayerAnswer(null);
      setBotAnswer(null);
      playerAnswerRef.current = null;
      botAnswerRef.current = null;
      humanAnswerSubmittedRef.current = false;
      setTimeLeft(QUESTION_TIMER_SECONDS);
      timerProgress.value = 1;
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, endDuel]);

  // ── Human match: submit round answer to backend ──────────────────────────────
  const submitHumanAnswer = useCallback(async (answerIndex: number, correct: boolean) => {
    if (!user?.id || matchId === 'local') return;
    try {
      await fetchWithTimeout(`${BACKEND_URL}/api/duel/round-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          userId: user.id,
          questionIndex: currentIndexRef.current,
          answerIndex,
          isCorrect: correct,
        }),
      });
    } catch {
      // silent
    }
  }, [matchId, user?.id]);

  // ── Human match: poll for round result after answer is submitted ─────────────
  const startRoundPolling = useCallback(() => {
    stopRoundPoll();
    roundPollRef.current = setInterval(async () => {
      if (phaseRef.current !== 'question') {
        stopRoundPoll();
        return;
      }
      try {
        const idx = currentIndexRef.current;
        const res = await fetchWithTimeout(
          `${BACKEND_URL}/api/duel/round-result/${matchId}/${idx}`,
          { method: 'GET' }
        );
        if (!res.ok) return;
        const data = await res.json() as {
          status: string;
          player1Answer: number;
          player2Answer: number;
          player1Correct: boolean;
          player2Correct: boolean;
          roundWinner: string;
        };

        if (data.status === 'resolved') {
          stopRoundPoll();
          if (phaseRef.current !== 'question') return;

          // Map to local player/opponent perspective
          const myAnswer = playerNumber === 1 ? data.player1Answer : data.player2Answer;
          const oppAnswer = playerNumber === 1 ? data.player2Answer : data.player1Answer;

          // Ensure player answer state is set (handles case where answer came from poll)
          if (playerAnswerRef.current === null) {
            playerAnswerRef.current = myAnswer;
            setPlayerAnswer(myAnswer);
          }

          botAnswerRef.current = oppAnswer;
          setBotAnswer(oppAnswer);

          setPhase('reveal');
          phaseRef.current = 'reveal';
          if (timerRef.current) clearInterval(timerRef.current);

          const q = questions[idx];
          evaluateAnswers(
            myAnswer, oppAnswer, q,
            playerScoreRef.current, botScoreRef.current, resultsRef.current
          );
        }
      } catch {
        // retry next tick
      }
    }, ROUND_POLL_INTERVAL_MS);
  }, [matchId, playerNumber, stopRoundPoll, evaluateAnswers, questions]);

  // ── Human match: heartbeat for disconnect detection ──────────────────────────
  const startHeartbeat = useCallback(() => {
    if (!isHumanMatch || !user?.id || matchId === 'local') return;
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(async () => {
      if (phaseRef.current === 'finished') {
        clearInterval(heartbeatRef.current!);
        return;
      }
      try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/duel/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, userId: user.id }),
        });
        if (res.ok) {
          const data = await res.json() as { opponentConnected: boolean; matchStatus: string };
          if (!data.opponentConnected && (phaseRef.current as string) !== 'finished') {
            clearInterval(heartbeatRef.current!);
            setOpponentDisconnected(true);
            endDuel('player_wins', playerScoreRef.current, botScoreRef.current, resultsRef.current);
          }
        }
      } catch {
        // silent
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [isHumanMatch, matchId, user?.id, endDuel]);

  // Bot answer scheduling (bot matches only)
  const scheduleBotAnswer = useCallback((question: DuelQuestion) => {
    const isCorrect = Math.random() < botParams.correctProb;
    const delay = botParams.minDelay + Math.random() * (botParams.maxDelay - botParams.minDelay);

    botTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== 'question') return;

      let chosenIndex: number;
      if (isCorrect) {
        chosenIndex = question.correctIndex;
      } else {
        const wrong = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
        chosenIndex = wrong[Math.floor(Math.random() * wrong.length)];
      }

      botAnswerRef.current = chosenIndex;
      setBotAnswer(chosenIndex);

      if (playerAnswerRef.current !== null) {
        setPhase('reveal');
        phaseRef.current = 'reveal';
        if (timerRef.current) clearInterval(timerRef.current);
        evaluateAnswers(
          playerAnswerRef.current, chosenIndex, question,
          playerScoreRef.current, botScoreRef.current, resultsRef.current
        );
      }
    }, delay);
  }, [botParams, evaluateAnswers]);

  // ── Countdown ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let n = 3;
    setCountdown(n);
    playSound('tick');
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(null);
        if (isHumanMatch) startHeartbeat();
      } else {
        setCountdown(n);
        playSound('tick');
      }
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Question timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'question') return;
    if (countdown !== null) return;
    timerProgress.value = withTiming(0, { duration: QUESTION_TIMER_SECONDS * 1000 });

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        // Tick on last 5 seconds of question timer
        if (next > 0 && next <= 5) playSound('tick');
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          if (phaseRef.current !== 'question') return 0;

          if (isHumanMatch) {
            // Submit timeout answer, keep polling for opponent
            if (!humanAnswerSubmittedRef.current) {
              humanAnswerSubmittedRef.current = true;
              playerAnswerRef.current = -1;
              setPlayerAnswer(-1);
              submitHumanAnswer(-1, false);
              startRoundPolling();
            }
          } else {
            // Bot mode: evaluate immediately
            setPhase('reveal');
            phaseRef.current = 'reveal';
            if (botTimerRef.current) clearTimeout(botTimerRef.current);
            evaluateAnswers(
              playerAnswerRef.current, botAnswerRef.current, currentQuestion,
              playerScoreRef.current, botScoreRef.current, resultsRef.current
            );
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    if (!isHumanMatch) {
      scheduleBotAnswer(currentQuestion);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase, countdown]);

  // ── Handle player answer tap ─────────────────────────────────────────────────
  const handleAnswer = (index: number) => {
    if (phase !== 'question' || playerAnswerRef.current !== null || countdown !== null) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSound('tap');
    playerAnswerRef.current = index;
    setPlayerAnswer(index);

    if (isHumanMatch) {
      if (!humanAnswerSubmittedRef.current) {
        humanAnswerSubmittedRef.current = true;
        const correct = index === currentQuestion.correctIndex;
        submitHumanAnswer(index, correct);
        startRoundPolling();
      }
    } else {
      // Bot mode: if bot already answered, evaluate now
      if (botAnswerRef.current !== null) {
        setPhase('reveal');
        phaseRef.current = 'reveal';
        if (timerRef.current) clearInterval(timerRef.current);
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
        evaluateAnswers(
          index, botAnswerRef.current, currentQuestion,
          playerScoreRef.current, botScoreRef.current, resultsRef.current
        );
      }
      // Otherwise wait for bot timer
    }
  };

  if (!currentQuestion) return null;

  // ── FINISHED SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'finished') {
    const won = duelOutcome === 'player_wins';
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={won ? ['#0a1f0e', '#0d2918', '#0a1a0e'] : ['#1a0a0a', '#291010', '#1a0a0a']}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}
        >
          <Animated.View entering={ZoomIn.duration(500)} style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: won ? 'rgba(104,211,145,0.15)' : 'rgba(252,129,129,0.15)',
                borderWidth: 2,
                borderColor: won ? 'rgba(104,211,145,0.4)' : 'rgba(252,129,129,0.4)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 24,
              }}
            >
              {won ? <Trophy size={48} color="#68D391" /> : <Star size={48} color="#FC8181" />}
            </View>

            <Text
              style={{
                fontSize: 34, fontWeight: '900',
                color: won ? '#68D391' : '#FC8181',
                textAlign: 'center', letterSpacing: -0.5, marginBottom: 8,
              }}
            >
              {won ? '¡Victoria!' : '¡Buen intento!'}
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              {opponentDisconnected
                ? `${opponentName} se desconectó`
                : won
                ? `Ganaste contra ${opponentName}`
                : `${opponentName} fue más rápido`}
            </Text>
          </Animated.View>

          {/* Score */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 20,
              marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 20, padding: 20,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%',
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: '600' }}>
                {user?.nickname ?? 'Tú'}
              </Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: '#FFFFFF' }}>{playerScore}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Swords size={20} color="rgba(255,255,255,0.3)" />
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: '600' }}>
                {opponentName}
              </Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: '#FFFFFF' }}>{botScore}</Text>
            </View>
          </Animated.View>

          {/* Points */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            style={{
              backgroundColor: capReached ? 'rgba(255,255,255,0.05)' : won ? 'rgba(104,211,145,0.1)' : 'rgba(246,224,94,0.1)',
              borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
              borderWidth: 1,
              borderColor: capReached ? 'rgba(255,255,255,0.1)' : won ? 'rgba(104,211,145,0.25)' : 'rgba(246,224,94,0.25)',
              marginBottom: 40, alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
              {rewardLoading ? 'Guardando recompensa...' : capReached ? 'Límite diario alcanzado' : 'Puntos ganados'}
            </Text>
            {capReached ? (
              <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Sin puntos — ya completaste{'\n'}10 duelos recompensados hoy
              </Text>
            ) : (
              <Text style={{ fontSize: 28, fontWeight: '900', color: won ? '#68D391' : '#F6E05E' }}>
                +{pointsAwarded} Sabiduría
              </Text>
            )}
          </Animated.View>

          {/* Completed missions banner */}
          {completedMissions.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(400)}
              style={{ width: '100%', marginBottom: 16, gap: 8 }}
            >
              {completedMissions.map((m, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: 'rgba(246,173,85,0.12)',
                    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16,
                    borderWidth: 1, borderColor: 'rgba(246,173,85,0.3)',
                  }}
                >
                  <Swords size={18} color="#F6AD55" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>
                      Misión completada
                    </Text>
                    <Text style={{ fontSize: 14, color: '#F6AD55', fontWeight: '700' }}>
                      {m.titleEs}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#F6AD55' }}>
                    +{m.rewardPoints}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(700).duration(400)} style={{ width: '100%', gap: 12 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace('/duelo/lobby' as any);
              }}
              style={{ backgroundColor: '#63B3ED', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#000000' }}>Jugar de nuevo</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
                router.back();
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 16,
                alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>Volver al inicio</Text>
            </Pressable>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // ── GAME SCREEN ───────────────────────────────────────────────────────────────
  const lastResult = results[results.length - 1];
  const waitingForOpponent = isHumanMatch && playerAnswer !== null && botAnswer === null && phase === 'question';

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#07070f', '#0d1220', '#070d18']}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <View
                style={{
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
                  backgroundColor: playerAnswer !== null ? 'rgba(104,211,145,0.12)' : 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: playerAnswer !== null ? 'rgba(104,211,145,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>
                  {user?.nickname ?? 'Tú'}
                </Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF' }}>{playerScore}</Text>
            </View>

            <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
              <Swords size={18} color="rgba(255,255,255,0.3)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                P{currentIndex + 1}/{questions.length}
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <View
                style={{
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
                  backgroundColor: botAnswer !== null ? 'rgba(252,129,129,0.12)' : 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: botAnswer !== null ? 'rgba(252,129,129,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>
                  {opponentName}
                </Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF' }}>{botScore}</Text>
            </View>
          </View>

          {/* Timer bar */}
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View style={[{ height: 4, borderRadius: 2 }, timerStyle]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={11} color="rgba(255,255,255,0.35)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>{timeLeft}s</Text>
            </View>
          </View>
        </View>

        {/* Question + answers */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={`q-${currentIndex}`}
            entering={FadeInDown.duration(300)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 22,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16, minHeight: 120, justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 19, fontWeight: '700', color: '#FFFFFF', lineHeight: 27, textAlign: 'center' }}>
              {currentQuestion.questionEs}
            </Text>
          </Animated.View>

          <View style={{ gap: 11 }}>
            {currentQuestion.options.map((option, index) => {
              const isPlayerChoice = playerAnswer === index;
              const isBotChoice    = botAnswer === index;
              const isCorrect      = index === currentQuestion.correctIndex;
              const showReveal     = phase === 'reveal';
              const anyAnswered    = playerAnswer !== null;

              let cardState: AnswerCardState;
              if (showReveal) {
                if (isCorrect)        cardState = 'correct';
                else if (isPlayerChoice) cardState = 'wrong';
                else                  cardState = 'dimmed';
              } else if (isPlayerChoice) {
                cardState = 'selected';
              } else if (anyAnswered) {
                cardState = 'dimmed';
              } else {
                cardState = 'default';
              }

              return (
                <AnswerCard
                  key={index}
                  index={index}
                  option={option}
                  state={cardState}
                  showBotDot={isBotChoice && showReveal}
                  botCorrect={isCorrect}
                  disabled={phase !== 'question' || anyAnswered}
                  onPress={() => handleAnswer(index)}
                />
              );
            })}
          </View>

          {/* Reveal status */}
          {phase === 'reveal' && lastResult && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                marginTop: 20, padding: 14, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                {lastResult.playerCorrect && lastResult.botCorrect
                  ? 'Ambos acertaron — siguiente pregunta...'
                  : !lastResult.playerCorrect && !lastResult.botCorrect
                  ? 'Ninguno acertó — siguiente pregunta...'
                  : lastResult.playerCorrect && !lastResult.botCorrect
                  ? '¡Correcto! Ganaste este round'
                  : '¡Incorrecto! El rival acertó'}
              </Text>
            </Animated.View>
          )}

          {/* Waiting for opponent (human match) */}
          {waitingForOpponent && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                marginTop: 20, padding: 14, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Esperando a {opponentName}...
              </Text>
            </Animated.View>
          )}

          {/* Waiting for bot (bot match) */}
          {!isHumanMatch && phase === 'question' && playerAnswer !== null && botAnswer === null && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                marginTop: 20, padding: 14, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Esperando a {opponentName}...
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* 3-2-1 Countdown overlay */}
        {countdown !== null && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(7,7,15,0.88)',
            }}
          >
            <Animated.Text
              key={countdown}
              entering={ZoomIn.duration(250)}
              style={{
                fontSize: 96, fontWeight: '900',
                color: countdown === 1 ? '#68D391' : '#FFFFFF',
                letterSpacing: -4,
                textShadowColor: countdown === 1 ? 'rgba(104,211,145,0.6)' : 'rgba(99,179,237,0.4)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 24,
              }}
            >
              {countdown}
            </Animated.Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 12, fontWeight: '600', letterSpacing: 1 }}>
              PREPÁRATE
            </Text>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}
