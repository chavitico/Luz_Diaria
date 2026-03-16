// Duelo de Sabiduría — Lobby Screen
// Searches for opponent for 5 seconds, then starts bot match

import React, { useEffect, useRef, useState } from 'react';
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
  FadeOut,
} from 'react-native-reanimated';
import { X, Swords } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors, useUser } from '@/lib/store';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';
const SEARCH_DURATION_MS = 5000;

type LobbyPhase = 'searching' | 'found' | 'starting';

export default function DueloLobby() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const user = useUser();

  const [phase, setPhase] = useState<LobbyPhase>('searching');
  const [dotCount, setDotCount] = useState(1);
  const [matchId, setMatchId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);

  // Pulsing ring animation
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

  useEffect(() => {
    // Pulsing rings
    ring1Scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 1000 }), withTiming(0.6, { duration: 1000 })),
      -1,
      false
    );
    ring2Scale.value = withRepeat(
      withDelay(500, withSequence(withTiming(1.6, { duration: 1200 }), withTiming(1, { duration: 1200 }))),
      -1,
      false
    );
    ring2Opacity.value = withRepeat(
      withDelay(500, withSequence(withTiming(0, { duration: 1200 }), withTiming(0.4, { duration: 1200 }))),
      -1,
      false
    );
    swordsRotate.value = withRepeat(
      withSequence(withTiming(8, { duration: 600 }), withTiming(-8, { duration: 600 })),
      -1,
      true
    );

    // Dot animation (1 → 2 → 3 → 1...)
    dotTimerRef.current = setInterval(() => {
      setDotCount((c) => (c % 3) + 1);
    }, 500);

    // After SEARCH_DURATION_MS, start bot match
    timerRef.current = setTimeout(async () => {
      if (cancelled.current) return;
      setPhase('found');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Create match on backend
      if (user?.id) {
        try {
          const res = await fetchWithTimeout(`${BACKEND_URL}/api/duel/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, isBotMatch: true }),
          });
          if (res.ok) {
            const data = await res.json() as { matchId: string };
            setMatchId(data.matchId);
          }
        } catch {
          // Silent — game continues without backend matchId
        }
      }

      setTimeout(() => {
        if (cancelled.current) return;
        setPhase('starting');
        setTimeout(() => {
          if (cancelled.current) return;
          router.replace({
            pathname: '/duelo/game',
            params: { matchId: matchId ?? 'local', opponentName: 'Juanito Bot', isBotMatch: '1' },
          } as any);
        }, 800);
      }, 1500);
    }, SEARCH_DURATION_MS);

    return () => {
      cancelled.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dotTimerRef.current) clearInterval(dotTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep matchId in ref so the navigate callback can access the latest value
  const matchIdRef = useRef(matchId);
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);

  const handleCancel = () => {
    cancelled.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dotTimerRef.current) clearInterval(dotTimerRef.current);
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
            {/* Outer ring */}
            <Animated.View
              style={[
                ring2Style,
                {
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  borderWidth: 1.5,
                  borderColor: 'rgba(99,179,237,0.35)',
                },
              ]}
            />
            {/* Inner ring */}
            <Animated.View
              style={[
                ring1Style,
                {
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 2,
                  borderColor: 'rgba(99,179,237,0.5)',
                },
              ]}
            />
            {/* Icon circle */}
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: 'rgba(99,179,237,0.12)',
                borderWidth: 2,
                borderColor: 'rgba(99,179,237,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
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
              fontSize: 28,
              fontWeight: '800',
              color: '#FFFFFF',
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            Duelo de Sabiduría
          </Animated.Text>

          {/* Status text */}
          {phase === 'searching' && (
            <Animated.Text
              entering={FadeIn.duration(400)}
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.55)',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Buscando un rival{dots}
            </Animated.Text>
          )}

          {phase === 'found' && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#68D391',
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                ¡Rival encontrado!
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.55)',
                  textAlign: 'center',
                }}
              >
                Juanito Bot
              </Text>
            </Animated.View>
          )}

          {phase === 'starting' && (
            <Animated.Text
              entering={FadeIn.duration(300)}
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#F6E05E',
                textAlign: 'center',
                letterSpacing: 2,
              }}
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
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.45)',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
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
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
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
