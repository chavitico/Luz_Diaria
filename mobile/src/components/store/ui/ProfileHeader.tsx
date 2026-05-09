import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Coins, Lock, Key, BookOpen, Share2, Layers, Swords, ChevronRight as ChevronRightSm } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useScaledFont } from '@/lib/textScale';
import { AVATAR_FRAMES, DEFAULT_AVATARS, BADGES } from '@/lib/constants';
import { BadgeChip } from '@/components/BadgeChip';
import type { useThemeColors, useUser } from '@/lib/store';
import { DUEL_BACKEND_URL } from '@/lib/config';

function ProfileHeader({
  colors,
  user,
  points,
  language,
  hasRenameToken,
  onRenamePress,
  activeBadgeId,
  devotionalsCompleted,
  totalShares,
  cardsPercent,
  onBadgePress,
  onSharePress,
}: {
  colors: ReturnType<typeof useThemeColors>;
  user: ReturnType<typeof useUser>;
  points: number;
  language: 'en' | 'es';
  hasRenameToken: boolean;
  onRenamePress: () => void;
  activeBadgeId: string | null;
  devotionalsCompleted: number;
  totalShares: number;
  cardsPercent: number;
  onBadgePress: () => void;
  onSharePress: () => void;
}) {
  const { sFont } = useScaledFont();
  const router = useRouter();
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${DUEL_BACKEND_URL}/api/duel/ranking/${user.id}`)
      .then(r => r.json())
      .then((data: { globalRank?: number }) => { if (data.globalRank) setGlobalRank(data.globalRank); })
      .catch(() => {});
  }, [user?.id]);

  const frameColor = user?.frameId && AVATAR_FRAMES[user.frameId]
    ? AVATAR_FRAMES[user.frameId].color
    : colors.textMuted;

  const avatarData = DEFAULT_AVATARS.find(a => a.id === user?.avatar);
  const avatarEmoji = avatarData?.emoji || '🕊️';


  const statChipStyle = (borderColor: string) => ({
    flex: 1 as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor,
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 8,
      }}
    >
      {/* Outer glow border */}
      <LinearGradient
        colors={[colors.primary + '55', colors.primary + '11', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 1.5 }}
      >
        <LinearGradient
          colors={['#1C1008', '#120B04', '#0E0700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 23, overflow: 'hidden' }}
        >
          {/* Inner accent glow */}
          <LinearGradient
            colors={[colors.primary + '22', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <View style={{ padding: 20 }}>
            {/* Identity row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              {/* Avatar with elevated ring */}
              <View style={{ marginRight: 14 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: frameColor + '22',
                  shadowColor: frameColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                }}>
                  <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A0F05',
                    borderWidth: 2.5,
                    borderColor: frameColor,
                  }}>
                    <Text style={{ fontSize: sFont(34) }}>{avatarEmoji}</Text>
                  </View>
                </View>
              </View>

              {/* Name + Points + Streak + Badge */}
              <View style={{ flex: 1 }}>
                {/* Row 1: username + lock/key icon button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{
                    fontSize: sFont(20),
                    fontWeight: '800',
                    color: '#FFFFFF',
                    letterSpacing: -0.3,
                    flexShrink: 1,
                  }} numberOfLines={1}>
                    {user?.nickname || 'Pilgrim'}
                  </Text>
                  <Pressable
                    onPress={onRenamePress}
                    style={{
                      backgroundColor: hasRenameToken ? colors.primary + '20' : 'rgba(255,255,255,0.08)',
                      borderWidth: 1,
                      borderColor: hasRenameToken ? colors.primary + '40' : 'rgba(255,255,255,0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    {hasRenameToken
                      ? <Key size={14} color={colors.primary} />
                      : <Lock size={14} color="rgba(255,255,255,0.45)" />
                    }
                  </Pressable>
                </View>
                {/* Row 2: Points + Racha máxima */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Coins size={14} color={colors.primary} />
                    <Text style={{ fontSize: sFont(15), fontWeight: '700', color: colors.primary }}>
                      {points} pts
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F9731618' }}>
                    <Text style={{ fontSize: sFont(13) }}>🔥</Text>
                    <Text style={{ fontSize: sFont(13), fontWeight: '700', color: '#F97316' }}>
                      {user?.streakBest ?? 0} {language === 'es' ? 'días' : 'days'}
                    </Text>
                  </View>
                </View>
                {/* Badge — clickeable */}
                {activeBadgeId && (() => {
                  const badgeData = BADGES[activeBadgeId];
                  if (!badgeData) return null;
                  return (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBadgePress(); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginTop: 2,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        backgroundColor: badgeData.color + '12',
                        borderWidth: 1,
                        borderColor: badgeData.color + '30',
                      }}
                    >
                      <BadgeChip badgeId={activeBadgeId} variant="community" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: sFont(13), fontWeight: '700', color: badgeData.color, marginBottom: 2 }} numberOfLines={1}>
                          {language === 'es' ? badgeData.nameEs : badgeData.name}
                        </Text>
                        <Text style={{ fontSize: sFont(11), fontWeight: '400', color: 'rgba(255,255,255,0.55)', lineHeight: 15 }} numberOfLines={2} ellipsizeMode="tail">
                          {language === 'es' ? badgeData.profileCardEs : badgeData.description}
                        </Text>
                      </View>
                      <ChevronRightSm size={14} color="rgba(255,255,255,0.25)" style={{ marginTop: 2 }} />
                    </Pressable>
                  );
                })()}
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

            {/* Action stats row — 4 clickable chips */}
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {/* Devocionales completados → library */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/library'); }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#22C55E25', '#22C55E08']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={statChipStyle('#22C55E35')}
                >
                  <BookOpen size={14} color="#22C55E" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#22C55E', marginBottom: 3 }}>
                    {devotionalsCompleted}
                  </Text>
                  <Text style={{ fontSize: sFont(9), fontWeight: '500', color: '#22C55E99', textAlign: 'center', lineHeight: 12 }}>
                    {language === 'es' ? 'Devocionales\ncompletados' : 'Devotionals\ncompleted'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Compartidos → share action */}
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSharePress(); }} style={{ flex: 1 }}>
                <LinearGradient
                  colors={['#60A5FA25', '#60A5FA08']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={statChipStyle('#60A5FA35')}
                >
                  <Share2 size={14} color="#60A5FA" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#60A5FA', marginBottom: 3 }}>
                    {totalShares}
                  </Text>
                  <Text style={{ fontSize: sFont(9), fontWeight: '500', color: '#60A5FA99', textAlign: 'center', lineHeight: 12 }}>
                    {language === 'es' ? 'Compartidos' : 'Shared'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Colecciones → álbum */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/biblical-cards-album'); }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#F59E0B25', '#F59E0B08']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={statChipStyle('#F59E0B35')}
                >
                  <Layers size={14} color="#F59E0B" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#F59E0B', marginBottom: 3 }}>
                    {cardsPercent}%
                  </Text>
                  <Text style={{ fontSize: sFont(9), fontWeight: '500', color: '#F59E0B99', textAlign: 'center', lineHeight: 12 }}>
                    {language === 'es' ? 'Colecciones' : 'Collections'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Ranking trivia bíblica → leaderboard */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/duelo/leaderboard'); }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#A78BFA25', '#A78BFA08']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={statChipStyle('#A78BFA35')}
                >
                  <Swords size={14} color="#A78BFA" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: sFont(18), fontWeight: '800', color: '#A78BFA', marginBottom: 3 }}>
                    {globalRank != null ? `#${globalRank}` : '—'}
                  </Text>
                  <Text style={{ fontSize: sFont(9), fontWeight: '500', color: '#A78BFA99', textAlign: 'center', lineHeight: 12 }}>
                    {language === 'es' ? 'Ranking\ntrivia bíblica' : 'Biblical\ntrivia rank'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

export default ProfileHeader;
