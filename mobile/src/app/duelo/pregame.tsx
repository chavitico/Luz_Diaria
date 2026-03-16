// Duelo de Sabiduría — Pre-game screen
// Shows player identity card + duel stats before matchmaking starts.
// Matchmaking only begins after pressing "Buscar oponente".

import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { ChevronLeft, Swords, Trophy, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAppStore, useUser } from '@/lib/store';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';
import { SPIRITUAL_TITLES } from '@/lib/constants';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

interface DuelRanking {
  duelRating: number;
  duelWins: number;
  duelLosses: number;
  duelWinStreak: number;
  duelBestStreak: number;
  rewardedDuelsLeft: number;
  globalRank: number;
}

export default function DueloPregame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const equippedTitle = useAppStore(s => s.equippedTitle);

  // Resolve title label in Spanish
  const titleLabel = equippedTitle
    ? (SPIRITUAL_TITLES[equippedTitle]?.nameEs ?? null)
    : null;

  // Fetch duel ranking from backend (light, cached 30s)
  const { data: ranking, isLoading: rankingLoading } = useQuery<DuelRanking>({
    queryKey: ['duel-ranking', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      const res = await fetch(`${BACKEND_URL}/api/duel/ranking/${user.id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // VS glow pulse
  const vsGlow = useSharedValue(0.5);
  const vsScale = useSharedValue(1);
  useEffect(() => {
    vsGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.4, { duration: 1200 })),
      -1,
      false
    );
    vsScale.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      false
    );
  }, []);
  const vsGlowStyle = useAnimatedStyle(() => ({
    opacity: vsGlow.value,
  }));
  const vsTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vsScale.value }],
  }));

  // Button press scale
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/duelo/lobby' as any);
  };

  const duelRating = ranking?.duelRating ?? 1000;
  const duelWins = ranking?.duelWins ?? 0;
  const duelWinStreak = ranking?.duelWinStreak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#060a12' }}>
      <LinearGradient
        colors={['#060a12', '#0a1020', '#060a12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Subtle cross-hatch background texture */}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.03,
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: i * 52,
                height: 1,
                backgroundColor: '#63B3ED',
              }}
            />
          ))}
        </View>

        {/* Decorative top glow */}
        <View
          style={{
            position: 'absolute',
            top: -80,
            left: '50%',
            marginLeft: -120,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: 'rgba(99,179,237,0.06)',
          }}
        />

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.07)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>
              Duelo de Sabiduría
            </Text>
          </View>
          {/* Spacer to center the title */}
          <View style={{ width: 38 }} />
        </View>

        {/* Main content */}
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 0 }}>

          {/* Subtitle */}
          <Animated.Text
            entering={FadeIn.delay(100).duration(500)}
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.38)',
              textAlign: 'center',
              marginBottom: 28,
              fontWeight: '500',
              lineHeight: 20,
            }}
          >
            Prepárate para poner a prueba{'\n'}tu conocimiento bíblico
          </Animated.Text>

          {/* Player card */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ marginBottom: 24 }}>
            <View
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(99,179,237,0.2)',
              }}
            >
              <LinearGradient
                colors={['rgba(99,179,237,0.1)', 'rgba(99,179,237,0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24 }}
              >
                {/* Avatar + identity */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                  {/* Avatar with frame glow */}
                  <View style={{ position: 'relative' }}>
                    <View
                      style={{
                        width: 74,
                        height: 74,
                        borderRadius: 37,
                        borderWidth: 2.5,
                        borderColor: 'rgba(99,179,237,0.5)',
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(99,179,237,0.08)',
                      }}
                    >
                      <IllustratedAvatar
                        avatarId={user?.avatar ?? 'avatar_dove'}
                        size={68}
                      />
                    </View>
                    {/* Online dot */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#68D391',
                        borderWidth: 2,
                        borderColor: '#060a12',
                      }}
                    />
                  </View>

                  {/* Name + title */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '900',
                        color: '#FFFFFF',
                        letterSpacing: -0.4,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {user?.nickname ?? 'Jugador'}
                    </Text>
                    {titleLabel ? (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: 'rgba(99,179,237,0.15)',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderWidth: 1,
                          borderColor: 'rgba(99,179,237,0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#63B3ED', fontWeight: '700', letterSpacing: 0.3 }}>
                          {titleLabel}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                        Listo para el duelo
                      </Text>
                    )}
                  </View>

                  {/* Swords icon */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(99,179,237,0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(99,179,237,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Swords size={20} color="#63B3ED" />
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

                {/* Duel stats row */}
                {rankingLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color="rgba(99,179,237,0.5)" />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {/* Rating */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: 12,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                        Rating
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#63B3ED', letterSpacing: -0.5 }}>
                        {duelRating}
                      </Text>
                    </View>

                    {/* Wins */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(104,211,145,0.05)',
                        borderRadius: 14,
                        padding: 12,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(104,211,145,0.12)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Trophy size={10} color="rgba(104,211,145,0.6)" />
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Victorias
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#68D391', letterSpacing: -0.5 }}>
                        {duelWins}
                      </Text>
                    </View>

                    {/* Win streak */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: duelWinStreak > 0 ? 'rgba(246,173,85,0.06)' : 'rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: 12,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: duelWinStreak > 0 ? 'rgba(246,173,85,0.2)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Flame size={10} color={duelWinStreak > 0 ? '#F6AD55' : 'rgba(255,255,255,0.35)'} />
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Racha
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '900',
                          color: duelWinStreak > 0 ? '#F6AD55' : 'rgba(255,255,255,0.3)',
                          letterSpacing: -0.5,
                        }}
                      >
                        {duelWinStreak}
                      </Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>
          </Animated.View>

          {/* VS section */}
          <Animated.View
            entering={ZoomIn.delay(300).duration(500)}
            style={{ alignItems: 'center', marginBottom: 24 }}
          >
            {/* Glow ring */}
            <Animated.View
              style={[
                vsGlowStyle,
                {
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(99,179,237,0.12)',
                },
              ]}
            />
            <Animated.Text
              style={[
                vsTextStyle,
                {
                  fontSize: 42,
                  fontWeight: '900',
                  color: 'rgba(255,255,255,0.9)',
                  letterSpacing: 4,
                },
              ]}
            >
              VS
            </Animated.Text>
          </Animated.View>

          {/* Opponent placeholder card */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                borderStyle: 'dashed',
                padding: 20,
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.02)',
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>⚔️</Text>
              </View>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>
                Oponente por encontrar
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom actions */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
        >
          {/* Primary CTA */}
          <Animated.View style={btnStyle}>
            <Pressable
              onPress={handleSearch}
              onPressIn={() => { btnScale.value = withSpring(0.97); }}
              onPressOut={() => { btnScale.value = withSpring(1); }}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#4299E1', '#2B6CB0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 17,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Swords size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
                  Buscar oponente
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Back */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              paddingVertical: 14,
              alignItems: 'center',
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
              Volver
            </Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
