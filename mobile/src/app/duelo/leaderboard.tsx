// Duelo de Sabiduría — Leaderboard Screen
// Shows top duelists sorted by rating. Global ranking only.

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { ChevronLeft, Trophy, Crown, Flame, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/lib/store';
import { IllustratedAvatar } from '@/components/IllustratedAvatar';
import { SPIRITUAL_TITLES } from '@/lib/constants';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarId: string;
  titleId: string | null;
  duelRating: number;
  duelWins: number;
  duelLosses: number;
  duelWinStreak: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
}

// Medal colors for top 3
const RANK_COLORS = {
  1: { bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.35)', text: '#FFD700', glow: 'rgba(255,215,0,0.08)' },
  2: { bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', text: '#C0C0C0', glow: 'rgba(192,192,192,0.05)' },
  3: { bg: 'rgba(205,127,50,0.1)', border: 'rgba(205,127,50,0.3)', text: '#CD7F32', glow: 'rgba(205,127,50,0.05)' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <View style={{
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Crown size={14} color="#FFD700" />
      </View>
    );
  }
  if (rank === 2) {
    return (
      <View style={{
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(192,192,192,0.15)',
        borderWidth: 1.5, borderColor: 'rgba(192,192,192,0.4)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Trophy size={14} color="#C0C0C0" />
      </View>
    );
  }
  if (rank === 3) {
    return (
      <View style={{
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(205,127,50,0.15)',
        borderWidth: 1.5, borderColor: 'rgba(205,127,50,0.4)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Star size={14} color="#CD7F32" />
      </View>
    );
  }
  return (
    <View style={{
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.45)' }}>
        {rank}
      </Text>
    </View>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  const rank = entry.rank;
  const isTop3 = rank <= 3;
  const rankStyle = isTop3 ? RANK_COLORS[rank as keyof typeof RANK_COLORS] : null;
  const titleLabel = entry.titleId
    ? (SPIRITUAL_TITLES[entry.titleId]?.nameEs ?? null)
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: isTop3 ? 14 : 11,
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 18,
          backgroundColor: isCurrentUser
            ? 'rgba(99,179,237,0.1)'
            : isTop3
            ? rankStyle!.bg
            : 'rgba(255,255,255,0.03)',
          borderWidth: 1,
          borderColor: isCurrentUser
            ? 'rgba(99,179,237,0.3)'
            : isTop3
            ? rankStyle!.border
            : 'rgba(255,255,255,0.06)',
          gap: 12,
        }}
      >
        {/* Rank badge */}
        <RankBadge rank={rank} />

        {/* Avatar */}
        <View
          style={{
            width: isTop3 ? 48 : 42,
            height: isTop3 ? 48 : 42,
            borderRadius: isTop3 ? 24 : 21,
            borderWidth: isTop3 ? 2 : 1.5,
            borderColor: isCurrentUser
              ? 'rgba(99,179,237,0.5)'
              : isTop3
              ? rankStyle!.border
              : 'rgba(255,255,255,0.12)',
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IllustratedAvatar
            avatarId={entry.avatarId || 'avatar_dove'}
            size={isTop3 ? 44 : 38}
          />
        </View>

        {/* Name + title */}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontSize: isTop3 ? 15 : 14,
                fontWeight: isTop3 ? '800' : '700',
                color: isCurrentUser
                  ? '#63B3ED'
                  : isTop3
                  ? rankStyle!.text
                  : '#FFFFFF',
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {entry.nickname}
            </Text>
            {isCurrentUser && (
              <View style={{
                backgroundColor: 'rgba(99,179,237,0.2)',
                borderRadius: 6,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}>
                <Text style={{ fontSize: 9, color: '#63B3ED', fontWeight: '800', letterSpacing: 0.5 }}>
                  TÚ
                </Text>
              </View>
            )}
          </View>
          {titleLabel ? (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600' }} numberOfLines={1}>
              {titleLabel}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Trophy size={9} color="rgba(104,211,145,0.5)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>
                {entry.duelWins} victorias
              </Text>
            </View>
          )}
        </View>

        {/* Rating + streak */}
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text
            style={{
              fontSize: isTop3 ? 18 : 16,
              fontWeight: '900',
              color: isTop3 ? rankStyle!.text : '#63B3ED',
              letterSpacing: -0.5,
            }}
          >
            {entry.duelRating}
          </Text>
          {entry.duelWinStreak > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Flame size={10} color="#F6AD55" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#F6AD55' }}>
                ×{entry.duelWinStreak}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function DueloLeaderboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUser();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<LeaderboardResponse>({
    queryKey: ['duel-leaderboard'],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/duel/leaderboard?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    staleTime: 60_000, // 1 minute cache
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const leaderboard = data?.leaderboard ?? [];

  // Find current user's position if not in top 100
  const currentUserEntry = leaderboard.find(e => e.userId === user?.id);

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <LeaderboardRow
      entry={item}
      isCurrentUser={item.userId === user?.id}
      index={index}
    />
  ), [user?.id]);

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.userId, []);

  const ListHeader = () => (
    <>
      {/* Column headers */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 28,
        paddingBottom: 10,
        alignItems: 'center',
        gap: 12,
      }}>
        <Text style={{ width: 32, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          #
        </Text>
        <View style={{ width: 42 }} />
        <Text style={{ flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 12 }}>
          Jugador
        </Text>
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Rating
        </Text>
      </View>
    </>
  );

  const ListEmpty = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
      {isError ? (
        <>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚔️</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'center' }}>
            No se pudo cargar el ranking
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(99,179,237,0.15)', borderRadius: 12 }}
          >
            <Text style={{ color: '#63B3ED', fontWeight: '700', fontSize: 14 }}>Reintentar</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>⚔️</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'center' }}>
            Sé el primero en el ranking
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'center' }}>
            ¡Completa tu primer duelo!
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#060a12' }}>
      <LinearGradient
        colors={['#060a12', '#0a1020', '#060a12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Background texture */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={{
              position: 'absolute', left: 0, right: 0,
              top: i * 52, height: 1, backgroundColor: '#63B3ED',
            }} />
          ))}
        </View>

        {/* Top glow */}
        <View style={{
          position: 'absolute', top: -60, left: '50%', marginLeft: -100,
          width: 200, height: 200, borderRadius: 100,
          backgroundColor: 'rgba(99,179,237,0.05)',
        }} />

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.07)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Animated.Text
              entering={FadeIn.delay(100).duration(400)}
              style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}
            >
              Duelo de Sabiduría
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(150).duration(400)}
              style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 }}
            >
              Ranking de Duelistas
            </Animated.Text>
          </View>

          {/* Spacer */}
          <View style={{ width: 38 }} />
        </View>

        {/* Global badge + count */}
        <Animated.View
          entering={ZoomIn.delay(200).duration(400)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(99,179,237,0.1)',
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
            borderWidth: 1, borderColor: 'rgba(99,179,237,0.2)',
          }}>
            <Trophy size={13} color="#63B3ED" />
            <Text style={{ fontSize: 13, color: '#63B3ED', fontWeight: '700', letterSpacing: 0.3 }}>
              Global
            </Text>
          </View>
          {!isLoading && data && (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>
                {data.total} jugadores
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Loading */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color="rgba(99,179,237,0.5)" />
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
              Cargando ranking...
            </Text>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={leaderboard.length > 0 ? ListHeader : null}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 24,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={handleRefresh}
                tintColor="rgba(99,179,237,0.5)"
              />
            }
          />
        )}

        {/* Current user position (if not in visible list) */}
        {!isLoading && !currentUserEntry && user?.id && leaderboard.length > 0 && (
          <View style={{
            paddingHorizontal: 16, paddingBottom: insets.bottom + 12,
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: 'rgba(99,179,237,0.08)',
              borderRadius: 16, padding: 14, marginTop: 10,
              borderWidth: 1, borderColor: 'rgba(99,179,237,0.2)',
            }}>
              <Trophy size={16} color="#63B3ED" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600', flex: 1 }}>
                Tú aún no estás en el top 100
              </Text>
              <Text style={{ fontSize: 12, color: '#63B3ED', fontWeight: '700' }}>
                ¡Sigue dueleando!
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
