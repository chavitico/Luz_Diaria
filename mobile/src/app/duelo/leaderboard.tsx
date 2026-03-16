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
import { SPIRITUAL_TITLES, DEFAULT_AVATARS, AVATAR_FRAMES } from '@/lib/constants';

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

// Resolve avatar emoji from DEFAULT_AVATARS
function getAvatarEmoji(avatarId: string): string {
  return DEFAULT_AVATARS.find(a => a.id === avatarId)?.emoji ?? '😊';
}

// ─── Podium (top 3) ────────────────────────────────────────────────────────────

const PODIUM_CONFIG = {
  1: {
    height: 110,
    avatarSize: 62,
    badgeSize: 30,
    gradientColors: ['#FFD700', '#B8860B'] as [string, string],
    borderColor: 'rgba(255,215,0,0.6)',
    cardBg: 'rgba(255,215,0,0.12)',
    cardBorder: 'rgba(255,215,0,0.3)',
    platformColor: 'rgba(255,215,0,0.22)',
    rankColor: '#FFD700',
    order: 2,   // center
  },
  2: {
    height: 80,
    avatarSize: 52,
    badgeSize: 26,
    gradientColors: ['#D0D0D0', '#808080'] as [string, string],
    borderColor: 'rgba(192,192,192,0.5)',
    cardBg: 'rgba(192,192,192,0.08)',
    cardBorder: 'rgba(192,192,192,0.22)',
    platformColor: 'rgba(192,192,192,0.15)',
    rankColor: '#C0C0C0',
    order: 1,   // left
  },
  3: {
    height: 60,
    avatarSize: 48,
    badgeSize: 24,
    gradientColors: ['#CD7F32', '#8B4513'] as [string, string],
    borderColor: 'rgba(205,127,50,0.5)',
    cardBg: 'rgba(205,127,50,0.08)',
    cardBorder: 'rgba(205,127,50,0.22)',
    platformColor: 'rgba(205,127,50,0.15)',
    rankColor: '#CD7F32',
    order: 3,   // right
  },
};

function PodiumCard({
  entry,
  isCurrentUser,
  delay,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  delay: number;
}) {
  const cfg = PODIUM_CONFIG[entry.rank as 1 | 2 | 3];
  const emoji = getAvatarEmoji(entry.avatarId);
  const titleLabel = entry.titleId ? (SPIRITUAL_TITLES[entry.titleId]?.nameEs ?? null) : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(450)}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {/* Card: avatar + name + rating */}
      <View style={{
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
        paddingTop: 14,
        paddingBottom: 10,
        borderRadius: 20,
        backgroundColor: isCurrentUser ? 'rgba(99,179,237,0.14)' : cfg.cardBg,
        borderWidth: 1.5,
        borderColor: isCurrentUser ? 'rgba(99,179,237,0.45)' : cfg.cardBorder,
        width: '100%',
        marginBottom: 0,
      }}>
        {/* Rank badge */}
        <View style={{
          width: cfg.badgeSize, height: cfg.badgeSize, borderRadius: cfg.badgeSize / 2,
          overflow: 'hidden',
          borderWidth: 1.5, borderColor: cfg.borderColor,
          marginBottom: 2,
        }}>
          <LinearGradient
            colors={cfg.gradientColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {entry.rank === 1 ? (
              <Crown size={cfg.badgeSize * 0.5} color="#fff" />
            ) : entry.rank === 2 ? (
              <Trophy size={cfg.badgeSize * 0.45} color="#fff" />
            ) : (
              <Star size={cfg.badgeSize * 0.45} color="#fff" />
            )}
          </LinearGradient>
        </View>

        {/* Avatar */}
        <View style={{
          width: cfg.avatarSize + 6,
          height: cfg.avatarSize + 6,
          borderRadius: (cfg.avatarSize + 6) / 2,
          borderWidth: 2.5,
          borderColor: isCurrentUser ? '#63B3ED' : cfg.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          <IllustratedAvatar
            avatarId={entry.avatarId || 'avatar_dove'}
            emoji={emoji}
            size={cfg.avatarSize}
          />
        </View>

        {/* Name */}
        <Text
          style={{
            fontSize: entry.rank === 1 ? 13 : 12,
            fontWeight: '800',
            color: isCurrentUser ? '#63B3ED' : (entry.rank === 1 ? '#FFFFFF' : 'rgba(255,255,255,0.85)'),
            letterSpacing: -0.2,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {entry.nickname}
          {isCurrentUser ? ' ★' : ''}
        </Text>

        {/* Title or wins */}
        {titleLabel ? (
          <Text style={{ fontSize: 9, color: cfg.rankColor, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 }} numberOfLines={1}>
            {titleLabel}
          </Text>
        ) : (
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600', textAlign: 'center' }}>
            {entry.duelWins}V
          </Text>
        )}

        {/* Rating */}
        <View style={{
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: 10,
          paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{
            fontSize: entry.rank === 1 ? 16 : 13,
            fontWeight: '900',
            color: isCurrentUser ? '#63B3ED' : cfg.rankColor,
            letterSpacing: -0.5,
          }}>
            {entry.duelRating}
          </Text>
        </View>

        {/* Streak if active */}
        {entry.duelWinStreak > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Flame size={10} color="#F6AD55" />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#F6AD55' }}>
              ×{entry.duelWinStreak}
            </Text>
          </View>
        )}
      </View>

      {/* Podium platform block */}
      <View style={{
        width: '100%',
        height: cfg.height,
        backgroundColor: cfg.platformColor,
        borderTopWidth: 1.5,
        borderTopColor: cfg.cardBorder,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 8,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: cfg.rankColor, opacity: 0.5 }}>
          {entry.rank}
        </Text>
      </View>
    </Animated.View>
  );
}

function Podium({
  top3,
  currentUserId,
}: {
  top3: LeaderboardEntry[];
  currentUserId?: string;
}) {
  // Arrange: 2nd | 1st | 3rd
  const sorted = [
    top3.find(e => e.rank === 2),
    top3.find(e => e.rank === 1),
    top3.find(e => e.rank === 3),
  ].filter(Boolean) as LeaderboardEntry[];

  if (sorted.length === 0) return null;

  return (
    <Animated.View
      entering={FadeIn.delay(150).duration(500)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        paddingHorizontal: 16,
        marginBottom: 16,
      }}
    >
      {sorted.map((entry, i) => (
        <PodiumCard
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
          delay={i * 80}
        />
      ))}
    </Animated.View>
  );
}

// ─── Regular row (rank 4+) ─────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  const emoji = getAvatarEmoji(entry.avatarId);
  const titleLabel = entry.titleId ? (SPIRITUAL_TITLES[entry.titleId]?.nameEs ?? null) : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 35).duration(320)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 11,
          marginHorizontal: 16,
          marginBottom: 6,
          borderRadius: 16,
          backgroundColor: isCurrentUser ? 'rgba(99,179,237,0.09)' : 'rgba(255,255,255,0.03)',
          borderWidth: 1,
          borderColor: isCurrentUser ? 'rgba(99,179,237,0.28)' : 'rgba(255,255,255,0.06)',
          gap: 10,
        }}
      >
        {/* Rank number */}
        <View style={{ width: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.35)' }}>
            {entry.rank}
          </Text>
        </View>

        {/* Avatar */}
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          borderWidth: 1.5,
          borderColor: isCurrentUser ? 'rgba(99,179,237,0.4)' : 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}>
          <IllustratedAvatar avatarId={entry.avatarId || 'avatar_dove'} emoji={emoji} size={36} />
        </View>

        {/* Name + title */}
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text
              style={{
                fontSize: 14, fontWeight: '700',
                color: isCurrentUser ? '#63B3ED' : '#FFFFFF',
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {entry.nickname}
            </Text>
            {isCurrentUser && (
              <View style={{
                backgroundColor: 'rgba(99,179,237,0.18)',
                borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1,
              }}>
                <Text style={{ fontSize: 8, color: '#63B3ED', fontWeight: '800', letterSpacing: 0.5 }}>TÚ</Text>
              </View>
            )}
          </View>
          {titleLabel ? (
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: '600' }} numberOfLines={1}>
              {titleLabel}
            </Text>
          ) : (
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: '600' }}>
              {entry.duelWins} victorias
            </Text>
          )}
        </View>

        {/* Rating + streak */}
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#63B3ED', letterSpacing: -0.5 }}>
            {entry.duelRating}
          </Text>
          {entry.duelWinStreak > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Flame size={9} color="#F6AD55" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#F6AD55' }}>×{entry.duelWinStreak}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

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
    staleTime: 60_000,
  });

  const leaderboard = data?.leaderboard ?? [];
  const top3 = leaderboard.filter(e => e.rank <= 3);
  const rest = leaderboard.filter(e => e.rank > 3);

  // Check if current user is visible
  const currentUserVisible = leaderboard.some(e => e.userId === user?.id);

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <LeaderboardRow
      entry={item}
      isCurrentUser={item.userId === user?.id}
      index={index}
    />
  ), [user?.id]);

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.userId, []);

  const ColumnHeader = () => (
    <View style={{
      flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 8, alignItems: 'center',
    }}>
      <Text style={{ width: 28, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>#</Text>
      <View style={{ width: 40, marginLeft: 10 }} />
      <Text style={{ flex: 1, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 10 }}>
        Jugador
      </Text>
      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Rating
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
      {isError ? (
        <>
          <Text style={{ fontSize: 32 }}>⚔️</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'center' }}>
            No se pudo cargar el ranking
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{ marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(99,179,237,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(99,179,237,0.2)' }}
          >
            <Text style={{ color: '#63B3ED', fontWeight: '700', fontSize: 14 }}>Reintentar</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 32 }}>⚔️</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'center' }}>
            Sé el primero en el ranking
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
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
        {/* Subtle grid lines */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.025 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * 52, height: 1, backgroundColor: '#63B3ED' }} />
          ))}
        </View>

        {/* Top glow */}
        <View style={{
          position: 'absolute', top: -60, left: '50%', marginLeft: -110,
          width: 220, height: 220, borderRadius: 110,
          backgroundColor: 'rgba(99,179,237,0.04)',
        }} />

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 16,
          flexDirection: 'row', alignItems: 'center',
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
              style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}
            >
              Duelo de Sabiduría
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(150).duration(400)}
              style={{ fontSize: 19, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 }}
            >
              Ranking de Duelistas
            </Animated.Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* Global badge */}
        <Animated.View
          entering={ZoomIn.delay(200).duration(400)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: 'rgba(99,179,237,0.1)',
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
            borderWidth: 1, borderColor: 'rgba(99,179,237,0.2)',
          }}>
            <Trophy size={12} color="#63B3ED" />
            <Text style={{ fontSize: 12, color: '#63B3ED', fontWeight: '700', letterSpacing: 0.4 }}>Global</Text>
          </View>
          {!isLoading && data && (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
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
        ) : leaderboard.length === 0 ? (
          <ListEmpty />
        ) : (
          <FlatList
            data={rest}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={
              <>
                {/* Podium top 3 */}
                {top3.length > 0 && (
                  <Podium top3={top3} currentUserId={user?.id} />
                )}
                {/* Separator */}
                {rest.length > 0 && (
                  <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  </View>
                )}
                {/* Column headers for rest */}
                {rest.length > 0 && <ColumnHeader />}
              </>
            }
            ListEmptyComponent={
              top3.length === 0 ? <ListEmpty /> : null
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={() => refetch()}
                tintColor="rgba(99,179,237,0.5)"
              />
            }
          />
        )}

        {/* "Not in top 100" footer */}
        {!isLoading && !currentUserVisible && user?.id && leaderboard.length > 0 && (
          <View style={{
            paddingHorizontal: 16, paddingBottom: insets.bottom + 12,
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: 'rgba(99,179,237,0.07)',
              borderRadius: 14, padding: 13, marginTop: 10,
              borderWidth: 1, borderColor: 'rgba(99,179,237,0.18)',
            }}>
              <Trophy size={15} color="rgba(99,179,237,0.6)" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600', flex: 1 }}>
                Aún no estás en el top 100
              </Text>
              <Text style={{ fontSize: 12, color: '#63B3ED', fontWeight: '700' }}>¡Sigue dueleando!</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
