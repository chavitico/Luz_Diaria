// New devotional format — powered by develop4God/devocionales-json

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Share2,
  BookOpen,
  Heart,
  Flame,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Mail,
  Check,
  ArrowLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShareSheet } from '@/components/ShareSheet';
import { CommentsSection } from '@/components/CommentsSection';
import { PointsToast, usePointsToast } from '@/components/PointsToast';
import { useMusicPlayer, MUSIC_TRACKS } from '@/components/BackgroundMusicProvider';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useUserFavorites,
  useAppStore,
} from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';
import { getTodayDate, firestoreService } from '@/lib/firestore';
import { pickBestVoice } from '@/lib/voice-picker';
import { sanitizeForTTS, preprocessNumbersForTTS } from '@/lib/tts-voices';
import { useScaledFont } from '@/lib/textScale';
import {
  SAMPLE_DEVOCIONAL,
  SAMPLE_DEVOCIONAL_EN,
  REPO_DEFAULT_IMAGE,
  REPO_DEVOCIONALS,
  repoToDevotional,
  parseVersiculo,
  type ParaMeditar,
  type RepoDevocional,
} from '@/lib/repo-devocional';
import type { Devotional } from '@/lib/types';
import { POINTS } from '@/lib/types';
import { PRAYER_CATEGORIES } from '@/lib/constants';
import { markDevotionalCompletedToday } from '@/lib/notifications';

const { width } = Dimensions.get('window');

/** Convert a backend-generated Devotional (DB format) to the RepoDevocional format that hoy-nuevo uses */
function backendToRepoDevocional(d: Devotional, date: string, lang: 'en' | 'es'): RepoDevocional {
  const ref = lang === 'es' ? (d.bibleReferenceEs || d.bibleReference) : d.bibleReference;
  const verse = lang === 'es' ? (d.bibleVerseEs || d.bibleVerse) : d.bibleVerse;
  const storyField = lang === 'es' ? (d.storyEs || d.story) : d.story;
  const tag = lang === 'es' ? (d.topicEs || d.topic) : d.topic;

  // New-format: story field contains JSON array [{cita, texto}, ...]
  // Old-format: story field contains prose text
  let para_meditar: ParaMeditar[] = [];
  const isNewFormat = storyField?.trimStart().startsWith('[');
  if (isNewFormat) {
    try {
      para_meditar = JSON.parse(storyField) as ParaMeditar[];
    } catch {
      para_meditar = [];
    }
  } else {
    // Old format fallback: wrap prose fields as pseudo-citations
    if (storyField) para_meditar.push({ cita: lang === 'es' ? 'Reflexión de vida' : 'Life Reflection', texto: storyField });
    const biblical = lang === 'es' ? (d.biblicalCharacterEs || d.biblicalCharacter) : d.biblicalCharacter;
    if (biblical) para_meditar.push({ cita: lang === 'es' ? 'Perspectiva bíblica' : 'Biblical Perspective', texto: biblical });
  }

  const version = isNewFormat ? (lang === 'es' ? 'RVR1960' : 'KJV') : 'RVR1960';

  return {
    id: date,
    date,
    language: lang,
    version,
    versiculo: `${ref} ${version}: "${verse}"`,
    reflexion: lang === 'es' ? (d.reflectionEs || d.reflection) : d.reflection,
    para_meditar,
    oracion: lang === 'es' ? (d.prayerEs || d.prayer) : d.prayer,
    tags: tag ? [tag] : [],
  };
}
function PrayerConfirmButton({
  colors,
  language,
  isPrayerDone,
  onConfirm,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isPrayerDone: boolean;
  onConfirm: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (isPrayerDone) return;
    scale.value = withSequence(withSpring(0.95, { damping: 10 }), withSpring(1, { damping: 8 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, { marginTop: 16 }]}>
      <Pressable
        onPress={handlePress}
        disabled={isPrayerDone}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16,
          backgroundColor: isPrayerDone ? '#22C55E' : colors.primary,
          opacity: isPrayerDone ? 0.9 : 1,
        }}
      >
        {isPrayerDone ? (
          <>
            <Check size={22} color="#FFFFFF" strokeWidth={3} />
            <Text style={{ marginLeft: 12, fontWeight: 'bold', fontSize: 16, color: '#FFFFFF' }}>
              {language === 'es' ? 'Completado' : 'Completed'}
            </Text>
          </>
        ) : (
          <>
            <Heart size={22} color={colors.primaryText} />
            <Text style={{ marginLeft: 12, fontWeight: 'bold', fontSize: 16, color: colors.primaryText }}>
              {language === 'es' ? 'Hoy hice esta oración' : 'I prayed today'}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const HERO_HEIGHT = 280;
const TTS_RATE = 0.88;
const TTS_PITCH = 0.95;
const MIN_TIME_SECONDS = 120;

function getYesterdayDate(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayFormatted = formatter.format(now);
    const [y, m, d] = todayFormatted.split('-').map(Number);
    const yesterday = new Date(Date.UTC(y!, m! - 1, d! - 1));
    const yy = yesterday.getUTCFullYear();
    const mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  } catch {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// ─── Notification dot ────────────────────────────────────────────────────────
function NotifDot() {
  return (
    <View style={{
      position: 'absolute', top: -2, right: -2,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: '#EF4444',
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
    }} />
  );
}

// ─── Spiritual Intro ─────────────────────────────────────────────────────────
function SpiritualIntro({
  scrollY,
  colors,
  language,
}: {
  scrollY: ReturnType<typeof useSharedValue<number>>;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const { sFont } = useScaledFont();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -8], Extrapolation.CLAMP) }],
  }));
  return (
    <Animated.View
      style={[{ alignItems: 'center', paddingTop: 20, paddingBottom: 8, paddingHorizontal: 8 }, animatedStyle]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: sFont(12), color: colors.textMuted, textAlign: 'center', letterSpacing: 0.4 }}>
        {language === 'es'
          ? 'Respira. Este momento es para Dios y para ti.'
          : 'Breathe. This moment is for God and for you.'}
      </Text>
    </Animated.View>
  );
}

// ─── Daily Engagement Banner ─────────────────────────────────────────────────
function DailyEngagementBanner({
  isCompleted,
  showThankYou,
  colors,
  language,
  isFavorite,
  onToggleFavorite,
}: {
  isCompleted: boolean;
  showThankYou: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { sFont } = useScaledFont();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    ty.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 120 }));
  }, [isCompleted, showThankYou]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  if (showThankYou) {
    return (
      <Animated.View style={[animStyle, {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12,
        borderRadius: 14, backgroundColor: colors.primary + '18', gap: 8,
      }]}>
        <Text style={{ fontSize: sFont(16) }}>🙏</Text>
        <Text style={{ fontSize: sFont(14), color: colors.primary, fontWeight: '500', flexShrink: 1 }}>
          {language === 'es'
            ? 'Gracias por apartar este momento con Dios'
            : 'Thank you for setting aside this moment with God'}
        </Text>
      </Animated.View>
    );
  }

  if (isCompleted) {
    return (
      <Animated.View style={[animStyle, {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 8, paddingHorizontal: 14, marginBottom: 12,
        borderRadius: 20, alignSelf: 'flex-start',
        backgroundColor: 'rgba(34,197,94,0.12)', gap: 6,
      }]}>
        <Check size={13} color="rgb(34,197,94)" strokeWidth={2.5} />
        <Text style={{ fontSize: sFont(13), color: 'rgb(34,197,94)', fontWeight: '500' }}>
          {language === 'es' ? 'Devocional de hoy completado' : "Today's devotional completed"}
        </Text>
        <Pressable
          onPress={onToggleFavorite}
          style={{ marginLeft: 4, padding: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={15}
            color={isFavorite ? '#EF4444' : 'rgba(34,197,94,0.7)'}
            fill={isFavorite ? '#EF4444' : 'transparent'}
          />
        </Pressable>
      </Animated.View>
    );
  }

  return null;
}

// ─── Pastoral Closure ────────────────────────────────────────────────────────
function PastoralClosure({
  colors,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const { sFont } = useScaledFont();
  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500)}
      style={{ marginTop: 28, marginBottom: 8 }}
    >
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 40, height: 1, backgroundColor: colors.primary + '40' }} />
      </View>
      <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <Text style={{ fontSize: sFont(18), marginBottom: 12 }}>🕊️</Text>
        <Text style={{
          fontSize: sFont(16), fontWeight: '600', color: colors.text,
          textAlign: 'center', lineHeight: sFont(24), marginBottom: 8,
        }}>
          {language === 'es' ? 'Gracias por apartar este tiempo.' : 'Thank you for setting aside this time.'}
        </Text>
        <Text style={{
          fontSize: sFont(14), color: colors.textMuted,
          textAlign: 'center', lineHeight: sFont(21), fontStyle: 'italic',
        }}>
          {language === 'es' ? 'Dios honra un corazón que le busca.' : 'God honors a heart that seeks Him.'}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  icon,
  iconColor,
  title,
  children,
  isHighlighted,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  isHighlighted: boolean;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const { sFont } = useScaledFont();
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: 20,
        borderRadius: 16,
        borderWidth: isHighlighted ? 2 : 1,
        borderColor: isHighlighted ? iconColor : colors.textMuted + '22',
        backgroundColor: isHighlighted ? iconColor + '08' : colors.surface,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          backgroundColor: iconColor + '18',
          borderRadius: 8, width: 32, height: 32,
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          {icon}
        </View>
        <Text style={{ color: colors.text, fontSize: sFont(16), fontWeight: '700' }}>{title}</Text>
      </View>
      {children}
    </Pressable>
  );
}

// ─── Audio Controls ───────────────────────────────────────────────────────────
function AudioControls({
  colors,
  language,
  isTTSPlaying,
  onTTSToggle,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  isTTSPlaying: boolean;
  onTTSToggle: () => void;
}) {
  const { sFont } = useScaledFont();
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const musicPlayer = useMusicPlayer();

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 16, backgroundColor: colors.surface,
      }}>
        {/* TTS */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={onTTSToggle}
            style={{
              width: 48, height: 48, borderRadius: 24,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.primary,
            }}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            {isTTSPlaying
              ? <Pause size={20} color="#fff" fill="#fff" />
              : <Play size={20} color="#fff" fill="#fff" />}
          </Pressable>
          <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
            {language === 'es' ? 'Narración' : 'Narration'}
          </Text>
        </View>

        {/* Music */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
            {language === 'es' ? 'Música' : 'Music'}
          </Text>
          <Pressable
            onPress={() => {
              musicPlayer.togglePlayback();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              width: 48, height: 48, borderRadius: 24,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: musicPlayer.isPlaying ? colors.primary : colors.textMuted + '30',
            }}
          >
            {musicPlayer.isPlaying
              ? <Volume2 size={20} color="#fff" />
              : <VolumeX size={20} color={colors.textMuted} />}
          </Pressable>
          <Pressable
            onPress={() => {
              setShowMusicSettings((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              width: 36, height: 36, borderRadius: 18,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: showMusicSettings ? colors.primary + '30' : colors.textMuted + '20',
              borderWidth: 1,
              borderColor: showMusicSettings ? colors.primary + '60' : colors.textMuted + '30',
            }}
          >
            <Music size={16} color={showMusicSettings ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {showMusicSettings && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={{ marginTop: 10, padding: 14, borderRadius: 14, backgroundColor: colors.surface }}
        >
          <Text style={{ fontSize: sFont(13), fontWeight: '600', marginBottom: 10, color: colors.text }}>
            {language === 'es' ? 'Pista de Música' : 'Music Track'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {MUSIC_TRACKS.map((track) => (
              <Pressable
                key={track.id}
                onPress={() => {
                  musicPlayer.setTrack(track.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: musicPlayer.currentTrack === track.id
                    ? colors.primary : colors.textMuted + '20',
                }}
              >
                <Text style={{
                  fontSize: sFont(13), fontWeight: '500',
                  color: musicPlayer.currentTrack === track.id ? '#fff' : colors.text,
                }}>
                  {language === 'es' ? track.nameEs : track.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HoyNuevoScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const favorites = useUserFavorites();
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = getTodayDate();
  const { date: dateParam, fromLibrary } = useLocalSearchParams<{ date?: string; fromLibrary?: string }>();
  // viewDate: the devotional being read. Empty string means "reset to today" (set by tab press).
  const viewDate = (dateParam && dateParam.length > 0) ? dateParam : today;
  const isRepoDate = Boolean(REPO_DEVOCIONALS[viewDate]);
  const isToday = viewDate === today;
  const openedFromLibrary = fromLibrary === '1';

  // Fetch from backend for dates not in the static repo
  const { data: backendDev } = useQuery({
    queryKey: ['devotional', viewDate],
    queryFn: () => firestoreService.getDevotional(viewDate),
    enabled: !isRepoDate,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
  const { currentToast, showToast, hideToast } = usePointsToast();
  const queryClient = useQueryClient();
  const addPoints = useAppStore((s) => s.addPoints);
  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const incrementStreak = useAppStore((s) => s.incrementStreak);
  const updateUser = useAppStore((s) => s.updateUser);
  const hasPendingGiftBadge = useAppStore((s) => s.notificationBadges.hasPendingGift);

  // Select content based on language and viewDate
  const repoEntry = REPO_DEVOCIONALS[viewDate] ?? { es: SAMPLE_DEVOCIONAL, en: SAMPLE_DEVOCIONAL_EN, imageUrl: REPO_DEFAULT_IMAGE };
  const heroImageUrl = isRepoDate ? repoEntry.imageUrl : (backendDev?.imageUrl ?? REPO_DEFAULT_IMAGE);
  const devocional = isRepoDate
    ? (language === 'es' ? repoEntry.es : repoEntry.en)
    : (backendDev ? backendToRepoDevocional(backendDev, viewDate, language) : (language === 'es' ? SAMPLE_DEVOCIONAL : SAMPLE_DEVOCIONAL_EN));
  const { reference, version, text: verseText } = parseVersiculo(devocional.versiculo);
  const mappedDevotional = { ...repoToDevotional(devocional, heroImageUrl), date: viewDate };
  const autoTitle = devocional.tags[0] ?? 'Devocional';

  const formattedDate = new Date(viewDate + 'T12:00:00').toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  // ── Prayer petition lines from summary ──
  const { data: prayerSummary } = useQuery({
    queryKey: ['prayer-summary'],
    queryFn: () => gamificationApi.getPrayerSummary(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const petitionAddendum = (() => {
    if (!prayerSummary || prayerSummary.total === 0) return '';
    const activeCats = PRAYER_CATEGORIES.filter(
      (cat) => (prayerSummary.summary[cat.key] ?? 0) > 0
    );
    if (activeCats.length === 0) return '';
    const header = language === 'es'
      ? '\n\nSeñor, también oramos por nuestros hermanos que hoy piden:'
      : '\n\nLord, we also pray for our brothers and sisters who ask today:';
    const lines = activeCats.map((cat) => {
      const count = prayerSummary.summary[cat.key]!;
      const label = language === 'es' ? cat.labelEs : cat.labelEn;
      const countLabel = count === 1
        ? (language === 'es' ? '1 persona' : '1 person')
        : `${count} ${language === 'es' ? 'personas' : 'people'}`;
      return language === 'es'
        ? `— Por ${label.toLowerCase()} (${countLabel})`
        : `— For ${label.toLowerCase()} (${countLabel})`;
    });
    return `${header}\n${lines.join('\n')}`;
  })();

  const fullPrayerText = devocional.oracion + petitionAddendum;

  // ── Favorites ──
  const isFavorite = favorites.includes(viewDate);
  const handleToggleFavorite = useCallback(() => {
    if (isFavorite) {
      removeFavorite(viewDate);
    } else {
      if (!favorites.includes(viewDate)) addPoints(POINTS.FAVORITE_DEVOTIONAL);
      addFavorite(viewDate);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isFavorite, viewDate, addFavorite, removeFavorite, favorites, addPoints]);

  // ── Share ──
  const [shareVisible, setShareVisible] = useState(false);

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareVisible(true);
  };

  const SHARE_MAX = 2;
  const dailyActions = user?.dailyActions ?? {};
  const shareCount = dailyActions.shareDate === today ? (dailyActions.shareCount ?? 0) : 0;

  // ── Prayer confirmation ──
  const isPrayerDone = dailyActions.prayerDate === today && (dailyActions.prayerDone ?? false);

  const handlePrayerConfirm = useCallback(async () => {
    if (!user || isPrayerDone || !isToday) return;
    updateUser({ dailyActions: { ...dailyActions, prayerDate: today, prayerDone: true } });
    try {
      const result = await gamificationApi.awardPoints(user.id, 'prayer');
      if (result.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Oración confirmada' : 'Prayer confirmed', detail: '' });
        showToast(result.pointsAwarded, language === 'es' ? 'puntos (Oración)' : 'points (Prayer)');
      }
      await gamificationApi.updateChallengeProgress(user.id, 'prayer');
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', user.id] });
    } catch {
      addPoints(POINTS.PRAYER_CONFIRM);
      addLedgerEntry({ delta: POINTS.PRAYER_CONFIRM, kind: 'devotional', title: language === 'es' ? 'Oración confirmada' : 'Prayer confirmed', detail: '' });
      showToast(POINTS.PRAYER_CONFIRM, language === 'es' ? 'puntos (Oración)' : 'points (Prayer)');
    }
  }, [user, isPrayerDone, isToday, dailyActions, today, updateUser, addPoints, showToast, language, queryClient]);
  const canShare = shareCount < SHARE_MAX;

  const handleShareComplete = async () => {
    if (!user) return;
    if (isToday && !canShare) {
      showToast(0, language === 'es' ? 'Limite diario alcanzado' : 'Daily limit reached', 'warning');
      return;
    }
    const newShareCount = shareCount + 1;
    if (isToday) {
      updateUser({
        totalShares: (user.totalShares ?? 0) + 1,
        dailyActions: { ...dailyActions, shareDate: today, shareCount: newShareCount },
      });
    }
    try {
      if (isToday) {
        const result = await gamificationApi.awardPoints(user.id, 'share');
        if (result?.success && result.pointsAwarded > 0) {
          addPoints(result.pointsAwarded);
          addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
          showToast(result.pointsAwarded, language === 'es' ? 'puntos (Compartir)' : 'points (Share)');
        }
        await gamificationApi.updateChallengeProgress(user.id, 'share');
        queryClient.invalidateQueries({ queryKey: ['challengeProgress', user.id] });
      }
    } catch {}
  };

  // ── Novedades badge ──
  const [hasUnreadNews, setHasUnreadNews] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('@novedades_last_opened').then((val) => {
      if (!val) { setHasUnreadNews(true); return; }
      setHasUnreadNews(new Date(val) < new Date('2026-04-27T12:00:00Z'));
    }).catch(() => setHasUnreadNews(true));
  }, []);
  const showNovedadesBadge = hasUnreadNews || hasPendingGiftBadge;

  // ── Completion timer — idempotent: won't double-count if HOY already ran today ──
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionThankYou, setShowCompletionThankYou] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCompletedRef = useRef(false);
  const ttsCompletedTodayRef = useRef(false);

  // Reset per-date state when navigating to a different devotional, then restore if today is done
  useEffect(() => {
    const done = isToday && user?.lastActiveDate === today;
    setIsCompleted(done);
    isCompletedRef.current = done;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]); // intentionally only on date change — avoids spurious resets on user updates

  const handleCompleteRef = useRef<(() => Promise<void>) | undefined>(undefined);
  handleCompleteRef.current = async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsCompleted(true);
    setShowCompletionThankYou(true);
    setTimeout(() => setShowCompletionThankYou(false), 4000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isToday) markDevotionalCompletedToday().catch(() => {});

    if (!user || !isToday) return;

    // Award points (backend is idempotent per action type per day)
    try {
      const result = await gamificationApi.awardPoints(user.id, 'devotional_complete');
      if (result?.success && result.pointsAwarded > 0) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({
          delta: result.pointsAwarded,
          kind: 'devotional',
          title: language === 'es' ? 'Devocional completado' : 'Devotional completed',
          detail: '',
        });
        showToast(result.pointsAwarded, language === 'es' ? 'puntos (Devocional)' : 'points (Devotional)');
      }
    } catch {}

    // Streak + devotionalsCompleted — same logic as HOY, shares the same lastActiveDate key
    const lastActive = user.lastActiveDate;
    const alreadyCountedToday = lastActive === today;
    const yesterdayStr = getYesterdayDate();

    let newStreakCurrent = user.streakCurrent;
    let newStreakBest = user.streakBest;

    if (!alreadyCountedToday) {
      if (lastActive === yesterdayStr) {
        newStreakCurrent = user.streakCurrent + 1;
        newStreakBest = Math.max(newStreakCurrent, user.streakBest);
        incrementStreak();
      } else {
        newStreakCurrent = 1;
        updateUser({ streakCurrent: 1 });
      }
    }

    const newDevotionalsCompleted = alreadyCountedToday
      ? user.devotionalsCompleted
      : user.devotionalsCompleted + 1;

    updateUser({ devotionalsCompleted: newDevotionalsCompleted, lastActiveDate: today });

    try {
      await gamificationApi.syncUser(user.id, {
        streakCurrent: newStreakCurrent,
        streakBest: newStreakBest,
        devotionalsCompleted: newDevotionalsCompleted,
        lastActiveAt: new Date().toISOString(),
        ...(alreadyCountedToday ? {} : { completedDevotionalDate: today }),
      });
    } catch {}

    // Streak milestone bonuses (7-day = +200, 30-day = +600)
    const STREAK_MILESTONES: Record<number, number> = { 7: 200, 30: 600 };
    const milestonePoints = STREAK_MILESTONES[newStreakCurrent];
    if (!alreadyCountedToday && milestonePoints && lastActive === yesterdayStr) {
      try {
        const bonus = await gamificationApi.awardPoints(user.id, 'streak_bonus', { streakDays: newStreakCurrent });
        if (bonus.success && bonus.pointsAwarded > 0) {
          addPoints(bonus.pointsAwarded);
          addLedgerEntry({
            delta: bonus.pointsAwarded,
            kind: 'devotional',
            title: language === 'es' ? `Racha de ${newStreakCurrent} días` : `${newStreakCurrent}-day streak`,
            detail: '',
          });
        }
      } catch {}
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setTimeSpent((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!isCompleted && timeSpent >= MIN_TIME_SECONDS) {
      handleCompleteRef.current?.();
    }
  }, [timeSpent, isCompleted]);

  // ── Scroll tracking ──
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const scrollRef = useRef<Animated.ScrollView>(null);

  // ── TTS ──
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const isTTSPlayingRef = useRef(false);
  const currentSectionIndexRef = useRef(-1);
  const speechJobIdRef = useRef(0);
  const pickedVoiceRef = useRef<Awaited<ReturnType<typeof pickBestVoice>> | undefined>(undefined);

  useEffect(() => {
    const langCode = language === 'es' ? 'es' : 'en';
    pickBestVoice(langCode).then((picked) => {
      pickedVoiceRef.current = picked;
    }).catch(() => {});
  }, [language]);

  const nMeditar = devocional.para_meditar.length;
  const oracionSectionIndex = 2 + nMeditar;

  const buildTTSSections = useCallback((): { key: string; text: string }[] => {
    const sections: { key: string; text: string }[] = [];
    sections.push({ key: 'verse', text: preprocessNumbersForTTS(sanitizeForTTS(`${verseText}. ${reference}`)) });
    sections.push({ key: 'reflexion', text: preprocessNumbersForTTS(sanitizeForTTS(devocional.reflexion)) });
    devocional.para_meditar.forEach((v, i) => {
      sections.push({ key: `meditar_${i}`, text: preprocessNumbersForTTS(sanitizeForTTS(`${v.cita}. ${v.texto}`)) });
    });
    sections.push({ key: 'oracion', text: preprocessNumbersForTTS(sanitizeForTTS(fullPrayerText)) });
    return sections;
  }, [verseText, reference, devocional, fullPrayerText]);

  const speakSection = useCallback((
    index: number,
    sections: { key: string; text: string }[],
    jobId: number,
  ) => {
    if (jobId !== speechJobIdRef.current) return;
    if (!isTTSPlayingRef.current) return;
    if (index >= sections.length) {
      setIsTTSPlaying(false);
      isTTSPlayingRef.current = false;
      setCurrentSectionIndex(-1);
      currentSectionIndexRef.current = -1;
      // Award TTS complete points (once per day, only for today's devotional)
      if (user && isToday && !ttsCompletedTodayRef.current) {
        ttsCompletedTodayRef.current = true;
        const da = user.dailyActions ?? {};
        updateUser({ dailyActions: { ...da, ttsDate: today, ttsDone: true } });
        gamificationApi.awardPoints(user.id, 'tts_complete').then((r) => {
          if (r.success && r.pointsAwarded > 0) {
            addPoints(r.pointsAwarded);
            addLedgerEntry({ delta: r.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Audio escuchado' : 'Audio listened', detail: '' });
            showToast(r.pointsAwarded, language === 'es' ? 'puntos (Audio)' : 'points (Audio)');
          }
        }).catch(() => {});
      }
      return;
    }
    setCurrentSectionIndex(index);
    currentSectionIndexRef.current = index;
    const advance = () => {
      setTimeout(() => {
        if (jobId === speechJobIdRef.current && isTTSPlayingRef.current) speakSection(index + 1, sections, jobId);
      }, 300);
    };
    const picked = pickedVoiceRef.current;
    const opts: Speech.SpeechOptions = {
      language: picked?.language ?? (language === 'es' ? 'es-MX' : 'en-US'),
      rate: TTS_RATE, pitch: TTS_PITCH, onDone: advance, onError: advance,
    };
    if (picked?.voiceIdentifier) opts.voice = picked.voiceIdentifier;
    Speech.speak(sections[index].text, opts);
  }, [language]);

  const handleTTSToggle = useCallback(async () => {
    if (isTTSPlaying) {
      speechJobIdRef.current += 1;
      isTTSPlayingRef.current = false;
      await Speech.stop();
      setIsTTSPlaying(false);
      setCurrentSectionIndex(-1);
      currentSectionIndexRef.current = -1;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      const sections = buildTTSSections();
      if (sections.length === 0) return;
      await Speech.stop();
      speechJobIdRef.current += 1;
      const jobId = speechJobIdRef.current;
      isTTSPlayingRef.current = true;
      setIsTTSPlaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      speakSection(0, sections, jobId);
    }
  }, [isTTSPlaying, buildTTSSections, speakSection]);

  const handleTTSJumpTo = useCallback(async (index: number) => {
    if (!isTTSPlaying) return;
    const sections = buildTTSSections();
    await Speech.stop();
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    isTTSPlayingRef.current = true;
    speakSection(index, sections, jobId);
    Haptics.selectionAsync();
  }, [isTTSPlaying, buildTTSSections, speakSection]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        speechJobIdRef.current += 1;
        isTTSPlayingRef.current = false;
        Speech.stop();
        setIsTTSPlaying(false);
        setCurrentSectionIndex(-1);
        currentSectionIndexRef.current = -1;
      };
    }, [])
  );

  useEffect(() => { return () => { Speech.stop(); }; }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PointsToast message={currentToast} onHide={hideToast} primaryColor={colors.primary} />

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* ── Hero ── */}
        <View style={{ height: HERO_HEIGHT }}>
          <Image
            source={{ uri: heroImageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Top row: streak/back + novedades + share */}
          <View style={{
            position: 'absolute', top: insets.top + 10, left: 20, right: 20,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {isToday && !openedFromLibrary ? (
              user && user.streakCurrent > 0 ? (
                <View style={{
                  backgroundColor: 'rgba(249,115,22,0.90)', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 6,
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                }}>
                  <Flame size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                    {user.streakCurrent}
                  </Text>
                </View>
              ) : <View />
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.navigate('/(tabs)/library');
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22,
                  width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
                }}
              >
                <ArrowLeft size={18} color="#fff" />
              </Pressable>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {isToday && (
                <Pressable
                  onPress={() => {
                    setHasUnreadNews(false);
                    router.push('/novedades');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22,
                    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
                  }}
                >
                  <Mail size={18} color="#fff" />
                  {showNovedadesBadge && <NotifDot />}
                </Pressable>
              )}

              <Pressable
                onPress={handleShare}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22,
                  width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
                }}
              >
                <Share2 size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Bottom: label + title + date */}
          <View style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
            <Text style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700',
              letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
            }}>
              {isToday
                ? (language === 'es' ? 'Devocional de Hoy' : "Today's Devotional")
                : (language === 'es' ? 'Devocional' : 'Devotional')}
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28, marginBottom: 6 }}>
              {autoTitle}
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500',
              textTransform: 'capitalize',
            }}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <SpiritualIntro scrollY={scrollY} colors={colors} language={language} />

          <DailyEngagementBanner
            isCompleted={isCompleted}
            showThankYou={showCompletionThankYou}
            colors={colors}
            language={language}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Verse */}
          <SectionCard
            icon={<Volume2 size={16} color={colors.primary} />}
            iconColor={colors.primary}
            title={reference}
            isHighlighted={currentSectionIndex === 0}
            onPress={() => handleTTSJumpTo(0)}
            colors={colors}
          >
            <Text style={{
              color: colors.text, fontSize: sFont(17), lineHeight: sFont(27),
              fontStyle: 'italic', fontWeight: '400',
            }}>
              "{verseText}"
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
              <View style={{ backgroundColor: colors.primary + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: colors.primary, fontSize: sFont(11), fontWeight: '700' }}>{version}</Text>
              </View>
            </View>
          </SectionCard>

          {/* TTS + Music */}
          <AudioControls
            colors={colors}
            language={language}
            isTTSPlaying={isTTSPlaying}
            onTTSToggle={handleTTSToggle}
          />

          {/* Reflexión */}
          <SectionCard
            icon={<BookOpen size={16} color={colors.primary} />}
            iconColor={colors.primary}
            title={language === 'es' ? 'Reflexión' : 'Reflection'}
            isHighlighted={currentSectionIndex === 1}
            onPress={() => handleTTSJumpTo(1)}
            colors={colors}
          >
            <Text style={{ color: colors.text, fontSize: sFont(15), lineHeight: sFont(25), fontWeight: '400', opacity: 0.88 }}>
              {devocional.reflexion}
            </Text>
          </SectionCard>

          {/* Para Meditar */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                backgroundColor: '#f43f5e18', borderRadius: 8,
                width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 10,
              }}>
                <Heart size={16} color="#f43f5e" />
              </View>
              <Text style={{ color: colors.text, fontSize: sFont(16), fontWeight: '700' }}>
                {language === 'es' ? 'Para Meditar' : 'For Reflection'}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
              style={{ flexGrow: 0 }}
            >
              {devocional.para_meditar.map((v, i) => {
                const sectionIdx = 2 + i;
                const highlighted = currentSectionIndex === sectionIdx;
                return (
                  <Pressable
                    key={i}
                    onPress={() => handleTTSJumpTo(sectionIdx)}
                    style={{
                      width: width * 0.72,
                      backgroundColor: highlighted ? '#f43f5e08' : colors.surface,
                      borderRadius: 14, padding: 16, marginRight: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: highlighted ? '#f43f5e' : '#f43f5e60',
                      borderWidth: highlighted ? 1.5 : 0,
                      borderColor: highlighted ? '#f43f5e' : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
                    }}
                  >
                    <Text style={{
                      color: '#f43f5e', fontSize: sFont(13), fontWeight: '700',
                      marginBottom: 8, letterSpacing: 0.3,
                    }}>
                      {v.cita}
                    </Text>
                    <Text style={{
                      color: colors.text, fontSize: sFont(14), lineHeight: sFont(22),
                      fontStyle: 'italic', opacity: 0.85,
                    }}>
                      "{v.texto}"
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Oración with petitions */}
          <SectionCard
            icon={<Flame size={16} color={colors.primary} />}
            iconColor={colors.primary}
            title={language === 'es' ? 'Oración' : 'Prayer'}
            isHighlighted={currentSectionIndex === oracionSectionIndex}
            onPress={() => handleTTSJumpTo(oracionSectionIndex)}
            colors={colors}
          >
            <Text style={{ color: colors.text, fontSize: sFont(15), lineHeight: sFont(25), fontStyle: 'italic', opacity: 0.9 }}>
              {fullPrayerText}
            </Text>
            {prayerSummary && prayerSummary.total > 0 && (
              <View style={{
                marginTop: 12, paddingTop: 10,
                borderTopWidth: 1, borderTopColor: colors.primary + '20',
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
                <Heart size={12} color={colors.primary} />
                <Text style={{ fontSize: sFont(12), color: colors.textMuted }}>
                  {prayerSummary.total}{' '}
                  {language === 'es' ? 'peticiones incluidas' : 'prayer requests included'}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* Prayer confirmation button — only for today's devotional */}
          {isToday && (
            <PrayerConfirmButton
              colors={colors}
              language={language}
              isPrayerDone={isPrayerDone}
              onConfirm={handlePrayerConfirm}
            />
          )}

          {/* Tags */}
          {devocional.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 }}>
              {devocional.tags.map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: colors.primary + '12', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}
                >
                  <Text style={{ fontSize: sFont(12), fontWeight: '600', color: colors.primary }}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {isCompleted && <PastoralClosure colors={colors} language={language} />}

          <CommentsSection devotionalDate={dateParam ?? today} scrollViewRef={scrollRef as any} />
        </View>
      </Animated.ScrollView>

      <ShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        devotional={mappedDevotional}
        language={language}
        colors={colors}
        onShareComplete={handleShareComplete}
        showDate={isToday}
      />
    </View>
  );
}
