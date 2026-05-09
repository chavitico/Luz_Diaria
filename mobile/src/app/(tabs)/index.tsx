// Home Screen - Daily Devotional Display with continuous format and audio controls

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LuzDiariaIconWhite } from '@/components/LuzDiariaIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import {
  BookOpen,
  Heart,
  ChevronDown,
  ChevronUp,
  Check,
  Flame,
  Star,
  Trophy,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Share2,
  Mail,
  X,
} from 'lucide-react-native';
import { ShareSheet } from '@/components/ShareSheet';
import { BibleReferenceText } from '@/components/BibleReferenceText';
import { firestoreService, getTodayDate } from '@/lib/firestore';
import { markDevotionalCompletedToday } from '@/lib/notifications';
import {
  useThemeColors,
  useLanguage,
  useUser,
  useUserFavorites,
  useUserSettings,
  useAppStore,
  getContrastText,
} from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { COMPLETION_REQUIREMENTS, POINTS } from '@/lib/types';
import type { Devotional, DailyActions } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useScaledFont } from '@/lib/textScale';
import { useMusicPlayer, MUSIC_TRACKS } from '@/components/BackgroundMusicProvider';
import { PointsToast, usePointsToast } from '@/components/PointsToast';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';

const { width, height } = Dimensions.get('window');
const IS_TABLET = width >= 768;

// Tablet-responsive scaling helpers
const ts = (mobile: number) => IS_TABLET ? mobile * 1.25 : mobile;  // title scale +25%
const ss = (mobile: number) => IS_TABLET ? mobile * 1.20 : mobile;  // subtitle scale +20%
const bs = (mobile: number) => IS_TABLET ? mobile * 1.15 : mobile;  // body scale +15%
const ps = (mobile: number) => IS_TABLET ? mobile * 0.75 : mobile;  // padding/margin reduce -25%

// Confetti colors
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

// Daily action limits
const DAILY_LIMITS = {
  SHARE_MAX: 2,
};

// Import TTS utilities
import {
  addTTSPausesForNumberedPoints,
  sanitizeForTTS,
  preprocessNumbersForTTS,
} from '@/lib/tts-voices';
import { pickBestVoice, type PickedVoice } from '@/lib/voice-picker';
import { trackTTSUsed, useTabTimeTracking } from '@/lib/metrics';
import { VoiceFallbackBanner } from '@/components/VoiceFallbackBanner';
import { VoiceSetupModal, VOICE_SETUP_SHOWN_KEY } from '@/components/VoiceSetupModal';
import { CommentsSection } from '@/components/CommentsSection';
import { markCommentLikesSeen } from '@/lib/use-notification-badges';
import { translateBibleReference, normalizeBibleRefForTTS, formatBibleReferenceForSpeech } from '@/lib/tts-utils';
import { isDailyActionAvailable, isDailyActionDone } from '@/lib/daily-actions';

import ConfettiPiece from '@/components/devotional/ConfettiPiece';
import ConfettiCelebration from '@/components/devotional/ConfettiCelebration';
import AchievementPopup from '@/components/devotional/AchievementPopup';
import ContentSection from '@/components/devotional/ContentSection';
import PrayerConfirmButton from '@/components/devotional/PrayerConfirmButton';
import DailyEngagementBanner from '@/components/devotional/DailyEngagementBanner';

// Daily Prayer of the Day Section (from community requests)
function DailyPrayerSection({
  colors,
  language,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const t = TRANSLATIONS[language];

  const { data: dailyPrayer, isLoading } = useQuery({
    queryKey: ['daily-prayer-today'],
    queryFn: () => gamificationApi.getTodayDailyPrayer(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: colors.surface }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!dailyPrayer) {
    return null;
  }

  const title = language === 'es' ? dailyPrayer.titleEs : dailyPrayer.title;
  const prayerText = language === 'es' ? dailyPrayer.prayerTextEs : dailyPrayer.prayerText;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      className="mt-6 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.primary + '08',
        borderWidth: 1,
        borderColor: colors.primary + '20',
      }}
    >
      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        <Heart size={18} color={colors.primary} />
        <Text className="text-base font-semibold ml-2" style={{ color: colors.primary }}>
          {t.prayer_of_the_day}
        </Text>
        {dailyPrayer.totalRequests > 0 && (
          <View
            className="ml-auto px-2 py-1 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {dailyPrayer.totalRequests} {language === 'es' ? 'peticiones' : 'requests'}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
          {title}
        </Text>
        <Text
          className="text-base leading-7"
          style={{ color: colors.text, fontStyle: 'italic' }}
        >
          {prayerText}
        </Text>
      </View>
    </Animated.View>
  );
}

// Pastoral Closure — shown after the devotional is completed
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
      {/* Divider line */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 40, height: 1, backgroundColor: colors.primary + '40' }} />
      </View>

      {/* Closing message */}
      <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <Text style={{ fontSize: sFont(18), marginBottom: 12 }}>🕊️</Text>
        <Text
          style={{
            fontSize: sFont(16),
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
          }}
        >
          {language === 'es'
            ? 'Gracias por apartar este tiempo.'
            : 'Thank you for setting aside this time.'}
        </Text>
        <Text
          style={{
            fontSize: sFont(14),
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 21,
            fontStyle: 'italic',
          }}
        >
          {language === 'es'
            ? 'Dios honra un corazón que le busca.'
            : 'God honors a heart that seeks Him.'}
        </Text>
      </View>
    </Animated.View>
  );
}

// Spiritual intro text — fades as user scrolls down
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
    transform: [
      { translateY: interpolate(scrollY.value, [0, 80], [0, -8], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View
      style={[{ alignItems: 'center', paddingTop: 22, paddingBottom: 12, paddingHorizontal: 8 }, animatedStyle]}
      pointerEvents="none"
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: sFont(12),
          color: colors.textMuted,
          textAlign: 'center',
          letterSpacing: 0.4,
        }}
      >
        {language === 'es'
          ? 'Respira. Este momento es para Dios y para ti.'
          : 'Breathe. This moment is for God and for you.'}
      </Text>
    </Animated.View>
  );
}

// Audio Controls Component — simplified: only Play/Pause TTS and Play/Pause Music
// Voices removed; speed fixed at 0.90x. Music track selector kept.
function AudioControls({
  colors,
  language,
  onMusicToggle,
  onMusicVolumeChange,
  musicEnabled,
  musicVolume,
  currentTrack,
  onTrackChange,
  onTTSPlay,
  onTTSPause,
  isTTSPlaying,
  musicIsLoading,
}: {
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
  onMusicToggle: () => void;
  onMusicVolumeChange: (value: number) => void;
  musicEnabled: boolean;
  musicVolume: number;
  currentTrack: string;
  onTrackChange: (trackId: string) => void;
  onTTSPlay: () => void;
  onTTSPause: () => void;
  isTTSPlaying: boolean;
  musicIsLoading: boolean;
}) {
  const [showMusicSettings, setShowMusicSettings] = useState(false);

  return (
    <View className="mb-6">
      <View
        className="flex-row items-center justify-between px-4 py-3 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Left: TTS Play/Pause */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={isTTSPlaying ? onTTSPause : onTTSPlay}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            {isTTSPlaying ? (
              <Pause size={20} color={colors.primaryText} fill={colors.primaryText} />
            ) : (
              <Play size={20} color={colors.primaryText} fill={colors.primaryText} />
            )}
          </Pressable>
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Narración' : 'Narration'}
          </Text>
        </View>

        {/* Right: Music Play/Pause + Music settings gear */}
        <View className="flex-row items-center gap-2">
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {language === 'es' ? 'Música' : 'Music'}
          </Text>
          <Pressable
            onPress={() => {
              if (musicIsLoading) return;
              onMusicToggle();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: musicEnabled ? colors.primary : colors.textMuted + '30', opacity: musicIsLoading ? 0.6 : 1 }}
          >
            {musicIsLoading ? (
              <ActivityIndicator size="small" color={musicEnabled ? colors.primaryText : colors.textMuted} />
            ) : musicEnabled ? (
              <Volume2 size={20} color={colors.primaryText} />
            ) : (
              <VolumeX size={20} color={colors.textMuted} />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              setShowMusicSettings((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: showMusicSettings ? colors.primary + '30' : colors.textMuted + '20',
              borderWidth: 1,
              borderColor: showMusicSettings ? colors.primary + '60' : colors.textMuted + '30',
            }}
          >
            <Music size={16} color={showMusicSettings ? colors.primary : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Music Settings Panel — track picker only */}
      {showMusicSettings && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mt-3 p-4 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            {language === 'es' ? 'Pista de Música' : 'Music Track'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {MUSIC_TRACKS.map((track) => (
              <Pressable
                key={track.id}
                onPress={() => {
                  onTrackChange(track.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: currentTrack === track.id ? colors.primary : colors.textMuted + '20',
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: currentTrack === track.id ? colors.primaryText : colors.text }}
                >
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

// Collapsible content for overflow
function CollapsibleContent({
  children,
  colors,
  language,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const maxCollapsedHeight = height * 0.6;
  const needsCollapse = contentHeight > maxCollapsedHeight;

  return (
    <View>
      <View
        style={{
          maxHeight: isExpanded ? undefined : maxCollapsedHeight,
          overflow: isExpanded ? 'visible' : 'hidden',
        }}
        onLayout={(e) => {
          if (contentHeight === 0) {
            setContentHeight(e.nativeEvent.layout.height);
          }
        }}
      >
        {children}
      </View>

      {needsCollapse && (
        <>
          {!isExpanded && (
            <LinearGradient
              colors={['transparent', colors.background]}
              style={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                right: 0,
                height: 80,
              }}
            />
          )}
          <Pressable
            onPress={() => {
              setIsExpanded(!isExpanded);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-row items-center justify-center py-3 mt-2 rounded-xl"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={18} color={colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>
                  {language === 'es' ? 'Ver menos' : 'Show less'}
                </Text>
              </>
            ) : (
              <>
                <ChevronDown size={18} color={colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>
                  {language === 'es' ? 'Ver mas' : 'Show more'}
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Screen is hidden (href: null). If somehow focused, navigate to the new devotional.
  // useFocusEffect (not useEffect) so it only fires when this screen is actually visible —
  // not when pre-mounted as a background tab, which avoids triggering a double splash.
  useFocusEffect(
    useCallback(() => {
      router.navigate({ pathname: '/(tabs)/hoy-nuevo' });
    }, [router])
  );

  const colors = useThemeColors();
  const language = useLanguage();
  const { sFont } = useScaledFont();
  const t = TRANSLATIONS[language];
  const user = useUser();
  const favorites = useUserFavorites();
  const settings = useUserSettings();

  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const addPoints = useAppStore((s) => s.addPoints);
  const updateUser = useAppStore((s) => s.updateUser);
  const incrementStreak = useAppStore((s) => s.incrementStreak);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const queryClient = useQueryClient();

  // Background music from provider
  const musicPlayer = useMusicPlayer();

  // Points toast
  const { currentToast, showToast, hideToast } = usePointsToast();

  // Hidden timer for internal tracking (not shown to user)
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showCompletionThankYou, setShowCompletionThankYou] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useTabTimeTracking('devotional', user?.id);

  // Clear comment-likes badge when user visits this tab
  const currentCommentLikesCount = useAppStore((s) => s.notificationBadges.recentCommentLikesCount);
  const setNotificationBadges = useAppStore((s) => s.setNotificationBadges);
  const currentBadges = useAppStore((s) => s.notificationBadges);
  useFocusEffect(
    useCallback(() => {
      if (currentCommentLikesCount > 0) {
        markCommentLikesSeen(currentCommentLikesCount).catch(() => {});
        setNotificationBadges({ ...currentBadges, recentCommentLikesCount: 0 });
      }
    }, [currentCommentLikesCount, currentBadges, setNotificationBadges])
  );

  // Scroll tracking for intro text fade
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  // Ref for passing to CommentsSection so it can scroll input into view on focus
  const homeScrollRef = useRef<Animated.ScrollView>(null);

  // TTS state — speed fixed at 0.90x, no user-facing slider
  const TTS_FIXED_SPEED = 0.9;
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [ttsSpeed, setTTSSpeed] = useState(TTS_FIXED_SPEED);
  const [ttsVolume, setTTSVolume] = useState(settings.ttsVolume ?? 1.0);
  const [showVoiceFallbackBanner, setShowVoiceFallbackBanner] = useState(false);
  const [voiceFallbackReason, setVoiceFallbackReason] = useState<'missing_preferred' | 'eloquence' | 'fallback'>('fallback');
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const pickedVoiceRef = useRef<PickedVoice | null>(null);
  const isTTSPlayingRef = useRef(false);
  const currentSectionIndexRef = useRef(-1);
  const ttsSpeedRef = useRef(TTS_FIXED_SPEED);
  const ttsVolumeRef = useRef(settings.ttsVolume ?? 1.0);
  const ttsVoiceRef = useRef('default');
  const currentSectionsRef = useRef<{ key: string; text: string }[]>([]);
  const ttsCompletedTodayRef = useRef(false);
  const speechJobIdRef = useRef(0);
  const lastSpeakAttemptRef = useRef(0);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: devotionalData, isLoading } = useQuery({
    queryKey: ['todayDevotional'],
    queryFn: () => firestoreService.getTodayDevotional(),
    retry: 1,
  });

  const devotional = devotionalData?.devotional ?? null;
  const isOffline = devotionalData?.offline ?? false;
  const isFromCache = devotionalData?.fromCache ?? false;
  const offlineCachedDate = devotionalData?.cachedDate;

  const today = getTodayDate();
  const isFavorite = favorites.includes(today);

  // Daily actions state derived from user
  const dailyActions = user?.dailyActions ?? {};
  const isPrayerDone = isDailyActionDone(dailyActions.prayerDate, dailyActions.prayerDone, today);
  const isTTSDone = isDailyActionDone(dailyActions.ttsDate, dailyActions.ttsDone, today);
  const shareStatus = isDailyActionAvailable(dailyActions.shareDate, dailyActions.shareCount, DAILY_LIMITS.SHARE_MAX, today);

  // Initialize completion state based on whether user already completed today's devotional
  // Also resets to false when the date changes (e.g., app left open overnight)
  useEffect(() => {
    setIsCompleted(user?.lastActiveDate === today);
  }, [user?.lastActiveDate, today]);

  // Initialize TTS completion tracking
  useEffect(() => {
    ttsCompletedTodayRef.current = isTTSDone;
  }, [isTTSDone]);

  // Sync TTS volume with settings
  useEffect(() => {
    setTTSVolume(settings.ttsVolume ?? 1.0);
    ttsVolumeRef.current = settings.ttsVolume ?? 1.0;
  }, [settings.ttsVolume]);

  // Pick best voice on mount (cached in AsyncStorage)
  useEffect(() => {
    const langCode = language === 'es' ? 'es' : 'en';
    pickBestVoice(langCode).then(async (picked) => {
      pickedVoiceRef.current = picked;

      // Show small banner for non-critical guidance
      if (picked.isEloquence) {
        setVoiceFallbackReason('eloquence');
        setShowVoiceFallbackBanner(true);
      } else if (!picked.preferredVoiceFound && langCode === 'es') {
        setVoiceFallbackReason('missing_preferred');
        setShowVoiceFallbackBanner(true);
      } else if (picked.isFallback) {
        setVoiceFallbackReason('fallback');
        setShowVoiceFallbackBanner(true);
      }

      // Show one-time modal when voice quality is poor (needsUserAction)
      if (picked.needsUserAction) {
        try {
          const alreadyShown = await AsyncStorage.getItem(VOICE_SETUP_SHOWN_KEY);
          if (!alreadyShown) {
            // Small delay so it doesn't pop up while the screen is still loading
            setTimeout(() => setShowVoiceSetupModal(true), 1500);
          }
        } catch (_) {}
      }
    });
  }, [language]);

  // Time tracking — pauses when app goes to background to avoid phantom completions
  useEffect(() => {
    const startTimer = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
    };
    const stopTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    startTimer();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') startTimer();
      else stopTimer();
    });

    return () => {
      stopTimer();
      sub.remove();
    };
  }, []);

  // Auto-complete when 3 minutes have passed
  useEffect(() => {
    if (
      !isCompleted &&
      timeSpent >= COMPLETION_REQUIREMENTS.MIN_TIME_SECONDS
    ) {
      handleComplete();
    }
  }, [timeSpent, isCompleted]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Stop TTS when screen loses focus (tab switch, navigation away, etc.)
  useFocusEffect(
    useCallback(() => {
      return () => {
        speechJobIdRef.current += 1; // invalidate any active job
        isTTSPlayingRef.current = false;
        Speech.stop();
        setIsTTSPlaying(false);
        setCurrentSectionIndex(-1);
      };
    }, [])
  );

  // Handle TTS completion - award points when TTS finishes the last section (prayer)
  const handleTTSComplete = useCallback(async () => {
    if (!user || ttsCompletedTodayRef.current) return;

    ttsCompletedTodayRef.current = true;

    // Update daily actions
    updateUser({
      dailyActions: {
        ...dailyActions,
        ttsDate: today,
        ttsDone: true,
      },
    });

    // Award points via API
    try {
      const result = await gamificationApi.awardPoints(user.id, 'tts_complete');
      if (result.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Audio escuchado' : 'Audio listened', detail: '' });
        showToast(
          result.pointsAwarded,
          language === 'es' ? 'puntos (Audio)' : 'points (Audio)'
        );
      }
    } catch (error) {
      console.error('[TTS] Failed to award points:', error);
      // Still award points locally as fallback
      addPoints(POINTS.TTS_COMPLETE);
      addLedgerEntry({ delta: POINTS.TTS_COMPLETE, kind: 'devotional', title: language === 'es' ? 'Audio escuchado' : 'Audio listened', detail: '' });
      showToast(
        POINTS.TTS_COMPLETE,
        language === 'es' ? 'puntos (Audio)' : 'points (Audio)'
      );
    }
  }, [user, dailyActions, today, updateUser, addPoints, showToast, language]);

  const handleComplete = useCallback(async () => {
    if (isCompleted) return;

    setIsCompleted(true);

    // Persist engagement date for notification smart-skip
    markDevotionalCompletedToday().catch(() => {});

    // Show "thank you" micro-feedback briefly, then switch to badge
    setShowCompletionThankYou(true);
    setTimeout(() => setShowCompletionThankYou(false), 4500);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPoints(POINTS.COMPLETE_DEVOTIONAL);
    addLedgerEntry({
      delta: POINTS.COMPLETE_DEVOTIONAL,
      kind: 'devotional',
      title: language === 'es' ? 'Devocional completado' : 'Devotional completed',
      detail: '',
    });

    if (user) {
      const lastActive = user.lastActiveDate;

      // Calculate yesterday using the same robust method as getTodayDate (Costa Rica timezone)
      const getYesterdayDate = (): string => {
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Costa_Rica',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          const todayFormatted = formatter.format(now);
          // Parse today and subtract 1 day
          const [y, m, d] = todayFormatted.split('-').map(Number);
          const yesterday = new Date(Date.UTC(y, m - 1, d - 1));
          const yy = yesterday.getUTCFullYear();
          const mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(yesterday.getUTCDate()).padStart(2, '0');
          return `${yy}-${mm}-${dd}`;
        } catch {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      };
      const yesterdayStr = getYesterdayDate();

      let newStreakCurrent = user.streakCurrent;
      let newStreakBest = user.streakBest;

      console.log('[Streak] Checking streak:', { lastActive, yesterdayStr, today, currentStreak: user.streakCurrent });

      if (lastActive === yesterdayStr) {
        // User was active yesterday - increment streak
        newStreakCurrent = user.streakCurrent + 1;
        newStreakBest = Math.max(newStreakCurrent, user.streakBest);
        incrementStreak();
        console.log('[Streak] Incrementing streak to:', newStreakCurrent);
      } else if (lastActive === today) {
        // User already completed today - keep current streak, don't re-count
        console.log('[Streak] Already active today, keeping streak:', newStreakCurrent);
      } else {
        // User missed a day or first time - reset to 1
        newStreakCurrent = 1;
        updateUser({ streakCurrent: 1 });
        console.log('[Streak] Resetting streak to 1 (lastActive was:', lastActive, ')');
      }

      // Only increment the devotionals counter once per calendar day
      const alreadyCountedToday = lastActive === today;
      const newDevotionalsCompleted = alreadyCountedToday
        ? user.devotionalsCompleted
        : user.devotionalsCompleted + 1;

      updateUser({
        devotionalsCompleted: newDevotionalsCompleted,
        lastActiveDate: today,
      });

      // Sync user data to backend for community display
      // Pass completedDevotionalDate only on fresh completion — backend records it and derives count
      try {
        await gamificationApi.syncUser(user.id, {
          streakCurrent: newStreakCurrent,
          streakBest: newStreakBest,
          devotionalsCompleted: newDevotionalsCompleted,
          lastActiveAt: new Date().toISOString(),
          ...(alreadyCountedToday ? {} : { completedDevotionalDate: today }),
        });
      } catch (error) {
        console.error('[Gamification] Failed to sync user data:', error);
      }

      // Award streak milestone bonus points (7-day = +200, 30-day = +600)
      const STREAK_BONUS_MILESTONES: Record<number, number> = { 7: 200, 30: 600 };
      const streakMilestonePoints = STREAK_BONUS_MILESTONES[newStreakCurrent];
      if (!alreadyCountedToday && streakMilestonePoints && lastActive === yesterdayStr) {
        try {
          const bonusResult = await gamificationApi.awardPoints(user.id, 'streak_bonus', { streakDays: newStreakCurrent });
          if (bonusResult.success && bonusResult.pointsAwarded > 0) {
            addPoints(bonusResult.pointsAwarded);
            addLedgerEntry({
              delta: bonusResult.pointsAwarded,
              kind: 'devotional',
              title: language === 'es' ? `Racha de ${newStreakCurrent} días` : `${newStreakCurrent}-day streak`,
              detail: '',
            });
            console.log(`[Streak] Milestone bonus awarded: ${bonusResult.pointsAwarded} pts for ${newStreakCurrent}-day streak`);
          }
        } catch (error) {
          console.error('[Gamification] Failed to award streak milestone bonus:', error);
        }
      }

      // Update challenge progress only on a fresh completion (not a re-open)
      if (!alreadyCountedToday) {
        try {
          await gamificationApi.updateChallengeProgress(user.id, 'devotional_complete');
        } catch (error) {
          console.error('[Gamification] Failed to update challenge progress:', error);
        }
      }
    }

  }, [isCompleted, user, today, addPoints, incrementStreak, updateUser]);

  // Novedades unread badge — true if news unread OR there's a pending admin drop
  const hasPendingGiftBadge = useAppStore((s) => s.notificationBadges.hasPendingGift);
  const [hasUnreadNews, setHasUnreadNews] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('@novedades_last_opened').then((val) => {
      if (!val) { setHasUnreadNews(true); return; }
      setHasUnreadNews(new Date(val) < new Date('2026-04-27T12:00:00Z'));
    }).catch(() => setHasUnreadNews(true));
  }, []);
  const showNoveddadesBadge = hasUnreadNews || hasPendingGiftBadge;

  // Open share modal
  const handleOpenShareModal = useCallback(() => {
    if (!devotional) return;
    setShowShareModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [devotional]);

  // Handle share completion
  const handleShareComplete = useCallback(async () => {
    if (!user) return;

    // Check if share limit reached
    if (!shareStatus.available) {
      showToast(
        0,
        language === 'es' ? 'Limite diario alcanzado' : 'Daily limit reached',
        'warning'
      );
      return;
    }

    // Update daily actions and total shares count
    const newShareCount = (dailyActions.shareDate === today ? (dailyActions.shareCount ?? 0) : 0) + 1;
    updateUser({
      totalShares: (user.totalShares ?? 0) + 1,
      dailyActions: {
        ...dailyActions,
        shareDate: today,
        shareCount: newShareCount,
      },
    });

    // Award points via API
    try {
      const pointsResult = await gamificationApi.awardPoints(user.id, 'share');
      if (pointsResult.success) {
        addPoints(pointsResult.pointsAwarded);
        addLedgerEntry({ delta: pointsResult.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
        showToast(
          pointsResult.pointsAwarded,
          language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
        );
      }
      await gamificationApi.updateChallengeProgress(user.id, 'share');
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', user.id] });
    } catch (error) {
      console.error('[Share] Failed to award points:', error);
      addPoints(POINTS.SHARE_DEVOTIONAL);
      addLedgerEntry({ delta: POINTS.SHARE_DEVOTIONAL, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
      showToast(
        POINTS.SHARE_DEVOTIONAL,
        language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
      );
    }
  }, [user, language, shareStatus, dailyActions, today, updateUser, addPoints, showToast, queryClient]);

  // Handle prayer confirmation
  const handlePrayerConfirm = useCallback(async () => {
    if (!user || isPrayerDone) return;

    // Update daily actions
    updateUser({
      dailyActions: {
        ...dailyActions,
        prayerDate: today,
        prayerDone: true,
      },
    });

    // Award points via API
    try {
      const result = await gamificationApi.awardPoints(user.id, 'prayer');
      if (result.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Oración confirmada' : 'Prayer confirmed', detail: '' });
        showToast(
          result.pointsAwarded,
          language === 'es' ? 'puntos (Oracion)' : 'points (Prayer)'
        );
      }
      // Update challenge progress
      await gamificationApi.updateChallengeProgress(user.id, 'prayer');
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', user.id] });
    } catch (error) {
      console.error('[Prayer] Failed to award points:', error);
      // Still award points locally as fallback
      addPoints(POINTS.PRAYER_CONFIRM);
      addLedgerEntry({ delta: POINTS.PRAYER_CONFIRM, kind: 'devotional', title: language === 'es' ? 'Oración confirmada' : 'Prayer confirmed', detail: '' });
      showToast(
        POINTS.PRAYER_CONFIRM,
        language === 'es' ? 'puntos (Oracion)' : 'points (Prayer)'
      );
    }
  }, [user, isPrayerDone, dailyActions, today, updateUser, addPoints, showToast, language, queryClient]);

  // TTS functions
  const buildDevotionalText = useCallback(() => {
    if (!devotional) return [];

    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
    const story = language === 'es' ? devotional.storyEs : devotional.story;
    const character = language === 'es' ? devotional.biblicalCharacterEs : devotional.biblicalCharacter;
    const application = language === 'es' ? devotional.applicationEs : devotional.application;
    const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;
    const bibleRef = language === 'es' ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)) : devotional.bibleReference;

    const formattedReference = formatBibleReferenceForSpeech(bibleRef, language);

    // Apply Bible reference normalization to ALL sections for proper TTS pronunciation
    // Sanitize garbage text from cross-reference annotations, then add pauses
    return [
      { key: 'verse', text: preprocessNumbersForTTS(sanitizeForTTS(`${verse}. ${formattedReference}`)) },
      { key: 'reflection', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(reflection), language))) },
      { key: 'story', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(story), language))) },
      { key: 'character', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(character), language))) },
      { key: 'application', text: preprocessNumbersForTTS(addTTSPausesForNumberedPoints(normalizeBibleRefForTTS(sanitizeForTTS(application), language))) },
      { key: 'prayer', text: preprocessNumbersForTTS(normalizeBibleRefForTTS(sanitizeForTTS(prayer), language)) },
    ];
  }, [devotional, language]);

  // Get the best voice identifier from the pre-picked voice
  const getVoiceIdentifier = useCallback((): { id: string | undefined; lang: string } => {
    const picked = pickedVoiceRef.current;
    // Always use the picked voice/language if we have one, even if it's a fallback.
    // isFallback = true just means "no great voice was found", but we still pass the
    // best available identifier rather than nothing (which risks device default = wrong lang).
    if (!picked || !picked.voiceIdentifier) {
      return { id: undefined, lang: language === 'es' ? 'es-MX' : 'en-US' };
    }
    return { id: picked.voiceIdentifier, lang: picked.language };
  }, [language]);

  const speakSection = useCallback(async (index: number, sections: { key: string; text: string }[], jobId: number) => {
    // Guard: abort if this job was superseded
    if (jobId !== speechJobIdRef.current) return;
    // Guard: abort if TTS was stopped
    if (!isTTSPlayingRef.current) return;

    if (index >= sections.length) {
      // TTS completed all sections - award points for completion
      if (jobId !== speechJobIdRef.current) return;
      handleTTSComplete();

      setIsTTSPlaying(false);
      isTTSPlayingRef.current = false;
      setCurrentSectionIndex(-1);
      currentSectionIndexRef.current = -1;
      currentSectionsRef.current = [];
      return;
    }

    setCurrentSectionIndex(index);
    currentSectionIndexRef.current = index;
    currentSectionsRef.current = sections;
    const section = sections[index];

    // Pastoral TTS parameters — slightly slower rate and warmer pitch for a natural devotional feel
    const DEVOTIONAL_RATE = 0.88;
    const DEVOTIONAL_PITCH = 0.95;

    const { id: voiceId, lang: voiceLang } = getVoiceIdentifier();

    // Inter-section pause: 300ms gap between sections feels more natural (like a breath).
    // We guard the jobId in the timeout so a stopped session doesn't continue.
    const advanceToNext = () => {
      setTimeout(() => {
        if (jobId === speechJobIdRef.current && isTTSPlayingRef.current) {
          speakSection(index + 1, sections, jobId);
        }
      }, 300);
    };

    const speechOptions: Speech.SpeechOptions = {
      language: voiceLang,
      rate: DEVOTIONAL_RATE,
      pitch: DEVOTIONAL_PITCH,
      volume: ttsVolumeRef.current,
      onDone: advanceToNext,
      onError: advanceToNext,
    };

    // Only add voice if we have a valid identifier
    if (voiceId) {
      speechOptions.voice = voiceId;
    }

    if (__DEV__) {
      console.log(
        `[TTS] Section ${index + 1}/${sections.length}: "${section.key}"` +
        ` | voice: ${voiceId ?? 'system'} | lang: ${voiceLang}` +
        ` | rate: ${DEVOTIONAL_RATE} | pitch: ${DEVOTIONAL_PITCH}`
      );
    }

    Speech.speak(section.text, speechOptions);
  }, [language, getVoiceIdentifier, handleTTSComplete]);

  const handleTTSPlay = useCallback(async () => {
    if (isTTSPlaying) return;

    // 500ms debounce guard
    const now = Date.now();
    if (now - lastSpeakAttemptRef.current < 500) return;
    lastSpeakAttemptRef.current = now;

    const sections = buildDevotionalText();
    if (sections.length === 0) return;

    // Stop any active speech before starting new job
    await Speech.stop();

    // Increment job ID to invalidate any stale callbacks
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;

    setIsTTSPlaying(true);
    isTTSPlayingRef.current = true;
    currentSectionsRef.current = sections;
    trackTTSUsed(user?.id, 'devotional');
    speakSection(0, sections, jobId);
  }, [isTTSPlaying, buildDevotionalText, speakSection, user?.id]);

  const handleTTSPause = useCallback(async () => {
    speechJobIdRef.current += 1; // invalidate active job
    isTTSPlayingRef.current = false;
    await Speech.stop();
    setIsTTSPlaying(false);
  }, []);

  const handleTTSStop = useCallback(async () => {
    speechJobIdRef.current += 1; // invalidate active job
    isTTSPlayingRef.current = false;
    currentSectionIndexRef.current = -1;
    currentSectionsRef.current = [];
    await Speech.stop();
    setIsTTSPlaying(false);
    setCurrentSectionIndex(-1);
  }, []);

  const handleTTSJumpToSection = useCallback(async (index: number) => {
    console.log(`[TTS][jump] index.tsx jump to section=${index}`);
    const sections = buildDevotionalText();
    if (sections.length === 0 || index < 0 || index >= sections.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isTTSPlayingRef.current = false;
    await Speech.stop();
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    setIsTTSPlaying(true);
    isTTSPlayingRef.current = true;
    currentSectionsRef.current = sections;
    speakSection(index, sections, jobId);
  }, [buildDevotionalText, speakSection]);

  // Restart current section with new settings (speed/volume/voice change while playing)
  const restartCurrentSection = useCallback(async () => {
    if (!isTTSPlayingRef.current || currentSectionIndexRef.current < 0) return;

    const sections = currentSectionsRef.current;
    const currentIndex = currentSectionIndexRef.current;

    if (sections.length === 0 || currentIndex >= sections.length) return;

    // Stop current speech, create new job, restart with new settings
    await Speech.stop();
    speechJobIdRef.current += 1;
    const jobId = speechJobIdRef.current;
    speakSection(currentIndex, sections, jobId);
  }, [speakSection]);

  const toggleFavorite = () => {
    console.log('[Favorite] Toggle pressed, today:', today, 'isFavorite:', isFavorite, 'user:', !!user, 'favorites:', favorites);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFavorite) {
      removeFavorite(today);
      console.log('[Favorite] Removed from favorites');
    } else {
      if (!favorites.includes(today)) {
        addPoints(POINTS.FAVORITE_DEVOTIONAL);
      }
      addFavorite(today);
      console.log('[Favorite] Added to favorites');
    }
  };

  const handleMusicToggle = () => {
    musicPlayer.togglePlayback();
  };

  const handleMusicVolumeChange = (value: number) => {
    musicPlayer.setVolume(value);
  };

  const handleTrackChange = async (trackId: string) => {
    await musicPlayer.setTrack(trackId);
  };

  const handleTTSSpeedChange = useCallback((value: number) => {
    setTTSSpeed(value);
    ttsSpeedRef.current = value;
    updateSettings({ ttsSpeed: value });
    // Restart current section with new speed if playing
    if (isTTSPlayingRef.current) {
      restartCurrentSection();
    }
  }, [updateSettings, restartCurrentSection]);

  const handleTTSVolumeChange = useCallback((value: number) => {
    setTTSVolume(value);
    ttsVolumeRef.current = value;
    updateSettings({ ttsVolume: value });
    // Restart current section with new volume if playing
    if (isTTSPlayingRef.current) {
      restartCurrentSection();
    }
  }, [updateSettings, restartCurrentSection]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!devotional) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background, padding: 32 }}
      >
        <Text style={{ fontSize: sFont(40), marginBottom: 16 }}>📵</Text>
        <Text style={{ fontSize: sFont(17), fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          {language === 'es' ? 'Sin conexión' : 'No connection'}
        </Text>
        <Text style={{ fontSize: sFont(14), color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
          {language === 'es'
            ? 'Conéctate a internet para descargar el devocional de hoy.'
            : 'Connect to the internet to download today\'s devotional.'}
        </Text>
      </View>
    );
  }

  const title = language === 'es' ? devotional.titleEs : devotional.title;
  const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
  const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
  const story = language === 'es' ? devotional.storyEs : devotional.story;
  const character = language === 'es' ? devotional.biblicalCharacterEs : devotional.biblicalCharacter;
  const application = language === 'es' ? devotional.applicationEs : devotional.application;
  const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Points Toast */}
      <PointsToast
        message={currentToast}
        onHide={hideToast}
        primaryColor={colors.primary}
      />

      {/* Cache / offline state banner — 3 states */}
      {(() => {
        // State 1: cached today — positive confirmation, no alarm
        if (isFromCache && (!offlineCachedDate || offlineCachedDate === getTodayDate())) {
          return (
            <View style={{
              backgroundColor: '#16A34A',
              paddingVertical: 5,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
                {language === 'es'
                  ? 'Devocional de hoy listo  •  Disponible sin conexion'
                  : 'Today\'s devotional ready  •  Available offline'}
              </Text>
            </View>
          );
        }
        // State 2: offline, fallback to a different date
        if (isFromCache && offlineCachedDate && offlineCachedDate !== getTodayDate()) {
          return (
            <View style={{
              backgroundColor: '#D97706',
              paddingVertical: 5,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
                {language === 'es'
                  ? `Mostrando devocional guardado  •  Disponible sin conexion  •  ${offlineCachedDate}`
                  : `Showing saved devotional  •  Available offline  •  ${offlineCachedDate}`}
              </Text>
            </View>
          );
        }
        // State 3: truly offline, no usable cache
        if (isOffline && !isFromCache) {
          return (
            <View style={{
              backgroundColor: '#DC2626',
              paddingVertical: 5,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>
                {language === 'es'
                  ? 'Sin conexion — conectate para descargar el devocional'
                  : 'No connection — connect to download today\'s devotional'}
              </Text>
            </View>
          );
        }
        return null;
      })()}

      {/* ConfettiCelebration removed — kept completion badge only */}
      <AchievementPopup
        visible={showAchievement}
        points={POINTS.COMPLETE_DEVOTIONAL}
        colors={colors}
        language={language}
      />

      {/* One-time modal shown when device has poor voice quality */}
      <VoiceSetupModal
        visible={showVoiceSetupModal}
        language={language}
        voiceName={pickedVoiceRef.current?.name}
        colors={colors}
        onDismiss={async () => {
          setShowVoiceSetupModal(false);
          try {
            await AsyncStorage.setItem(VOICE_SETUP_SHOWN_KEY, '1');
          } catch (_) {}
        }}
      />

      <Animated.ScrollView
        ref={homeScrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
      >
        {/* Hero Image */}
        <View style={{ height: height * 0.4 }}>
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
          />

          {/* Header overlay */}
          <View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
            style={{ paddingTop: insets.top + 10 }}
          >
            {/* Streak fire — top-left, always visible */}
            {user && user.streakCurrent > 0 ? (
              <View className="flex-row items-center bg-orange-500/90 px-3 py-2 rounded-full">
                <Flame size={14} color="#FFFFFF" />
                <Text className="text-white font-bold ml-1" style={{ fontSize: sFont(13) }}>
                  {user.streakCurrent}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {/* Logo centrado — identidad sutil */}
            <LuzDiariaIconWhite size={44} />

            {/* Right actions: Novedades + Share */}
            <View className="flex-row items-center" style={{ gap: 8 }}>
              {/* Novedades bell */}
              <Pressable
                onPress={() => {
                  setHasUnreadNews(false);
                  router.push('/novedades');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.20)',
                }}
              >
                <Mail size={20} color="#FFFFFF" />
                {showNoveddadesBadge && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 7,
                      right: 7,
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: '#EF4444',
                      borderWidth: 1.5,
                      borderColor: 'rgba(0,0,0,0.4)',
                    }}
                  />
                )}
              </Pressable>
              {/* Share Button */}
              <Pressable
                onPress={handleOpenShareModal}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.20)',
                }}
              >
                <Share2 size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Title overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wider">
              {t.todays_devotional}
            </Text>
            <Text className="text-white/60 text-xs font-medium mb-2 capitalize">
              {new Date(today + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text className="text-white text-3xl font-bold">{title}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 -mt-4">
          {/* Spiritual intro text — fades as user scrolls */}
          <SpiritualIntro scrollY={scrollY} colors={colors} language={language} />

          {/* Daily engagement micro-feedback */}
          <DailyEngagementBanner
            isCompleted={isCompleted}
            showCompletionThankYou={showCompletionThankYou}
            colors={colors}
            language={language}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />

          {/* Audio Controls */}
          <AudioControls
            colors={colors}
            language={language}
            onMusicToggle={handleMusicToggle}
            onMusicVolumeChange={handleMusicVolumeChange}
            musicEnabled={musicPlayer.isPlaying}
            musicVolume={musicPlayer.volume}
            currentTrack={musicPlayer.currentTrack}
            onTrackChange={handleTrackChange}
            onTTSPlay={handleTTSPlay}
            onTTSPause={handleTTSPause}
            isTTSPlaying={isTTSPlaying}
            musicIsLoading={musicPlayer.isLoading}
          />

          {/* Voice fallback banner — shown when Paulina/Monica not installed or Eloquence forced */}
          <VoiceFallbackBanner
            visible={showVoiceFallbackBanner}
            reason={voiceFallbackReason}
            language={language}
            colors={colors}
            onDismiss={() => setShowVoiceFallbackBanner(false)}
          />

          {/* Collapsible content wrapper */}
          <CollapsibleContent colors={colors} language={language}>
            {/* Bible Verse Card */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              className="rounded-3xl p-6 mb-6"
              style={{
                backgroundColor: currentSectionIndex === 0 ? colors.primary + '15' : colors.surface,
                borderWidth: currentSectionIndex === 0 ? 2 : 0,
                borderColor: currentSectionIndex === 0 ? colors.primary : 'transparent',
              }}
            >
              <View className="flex-row items-center mb-4">
                <TouchableOpacity
                  onPress={() => {
                    console.log('[TTS][icon] index.tsx verse icon tap');
                    handleTTSJumpToSection(0);
                  }}
                  activeOpacity={0.5}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary + '25',
                    marginRight: 8,
                  }}
                >
                  <BookOpen size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text
                  className="font-semibold"
                  style={{ color: colors.primary }}
                >
                  {t.bible_verse}
                </Text>
              </View>
              <Text
                className="text-xl italic leading-8 mb-3"
                style={{ color: colors.text }}
                onPress={() => handleTTSJumpToSection(0)}
                suppressHighlighting={true}
              >
                {verse}
              </Text>
              <Text
                className="text-sm font-medium"
                style={{ color: colors.textMuted }}
                onPress={() => handleTTSJumpToSection(0)}
                suppressHighlighting={true}
              >
                - {language === 'es' ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)) : devotional.bibleReference}
              </Text>
            </Animated.View>

            {/* All sections displayed continuously */}
            <ContentSection
              title={t.reflection}
              content={reflection}
              icon={<Star size={16} color={colors.primary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 1}
              sectionIndex={1}
              onPress={() => handleTTSJumpToSection(1)}
            />

            <ContentSection
              title={t.story}
              content={story}
              icon={<BookOpen size={16} color={colors.secondary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 2}
              sectionIndex={2}
              onPress={() => handleTTSJumpToSection(2)}
            />

            <ContentSection
              title={t.biblical_character}
              content={character}
              icon={<Star size={16} color={colors.accent} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 3}
              sectionIndex={3}
              onPress={() => handleTTSJumpToSection(3)}
            />

            <ContentSection
              title={t.application}
              content={application}
              icon={<Check size={16} color={colors.primary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 4}
              sectionIndex={4}
              onPress={() => handleTTSJumpToSection(4)}
            />

            <ContentSection
              title={t.prayer}
              content={prayer}
              icon={<Heart size={16} color={colors.secondary} />}
              colors={colors}
              isHighlighted={currentSectionIndex === 5}
              sectionIndex={5}
              onPress={() => handleTTSJumpToSection(5)}
            />

            {/* Prayer Confirmation Button */}
            <PrayerConfirmButton
              colors={colors}
              language={language}
              isPrayerDone={isPrayerDone}
              onConfirm={handlePrayerConfirm}
            />

            {/* Daily Prayer of the Day */}
            <DailyPrayerSection
              colors={colors}
              language={language}
            />

            {/* Pastoral Closure — only visible after completion */}
            {isCompleted && (
              <PastoralClosure
                colors={colors}
                language={language}
              />
            )}

            {/* Comments — always visible */}
            <CommentsSection devotionalDate={today} scrollViewRef={homeScrollRef} />
          </CollapsibleContent>
        </View>
      </Animated.ScrollView>

      {/* Share Sheet */}
      <ShareSheet
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        devotional={devotional}
        language={language}
        colors={colors}
        onShareComplete={handleShareComplete}
        showDate={true}
      />
    </View>
    </KeyboardAvoidingView>
  );
}
