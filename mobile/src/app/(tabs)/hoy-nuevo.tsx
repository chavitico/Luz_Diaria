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
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Share2,
  BookOpen,
  Heart,
  Flame,
  Play,
  Pause,
  Volume2,
  Mail,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useQuery } from '@tanstack/react-query';
import { ShareSheet } from '@/components/ShareSheet';
import { CommentsSection } from '@/components/CommentsSection';
import { PointsToast, usePointsToast } from '@/components/PointsToast';
import { useThemeColors, useLanguage, useUser, useAppStore } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';
import { getTodayDate } from '@/lib/firestore';
import { pickBestVoice } from '@/lib/voice-picker';
import { sanitizeForTTS, preprocessNumbersForTTS } from '@/lib/tts-voices';
import {
  SAMPLE_DEVOCIONAL,
  REPO_DEFAULT_IMAGE,
  repoToDevotional,
  parseVersiculo,
} from '@/lib/repo-devocional';
import { TRANSLATIONS } from '@/lib/constants';
import { markDevotionalCompletedToday } from '@/lib/notifications';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 280;
const TTS_RATE = 0.88;
const TTS_PITCH = 0.95;
const MIN_TIME_SECONDS = 90;

// ─── Notification dot ────────────────────────────────────────────────────────
function NotifDot() {
  return (
    <View style={{
      position: 'absolute',
      top: -2,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.9)',
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
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 80], [0, -8], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <Animated.View
      style={[{ alignItems: 'center', paddingTop: 20, paddingBottom: 8, paddingHorizontal: 8 }, animatedStyle]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', letterSpacing: 0.4 }}>
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
}: {
  isCompleted: boolean;
  showThankYou: boolean;
  colors: ReturnType<typeof useThemeColors>;
  language: 'en' | 'es';
}) {
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
        <Text style={{ fontSize: 16 }}>🙏</Text>
        <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500', flexShrink: 1 }}>
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
        <Text style={{ fontSize: 13, color: 'rgb(34,197,94)', fontWeight: '500' }}>
          {language === 'es' ? 'Devocional de hoy completado' : "Today's devotional completed"}
        </Text>
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
  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500)}
      style={{ marginTop: 28, marginBottom: 8 }}
    >
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 40, height: 1, backgroundColor: colors.primary + '40' }} />
      </View>
      <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>🕊️</Text>
        <Text style={{
          fontSize: 16, fontWeight: '600', color: colors.text,
          textAlign: 'center', lineHeight: 24, marginBottom: 8,
        }}>
          {language === 'es' ? 'Gracias por apartar este tiempo.' : 'Thank you for setting aside this time.'}
        </Text>
        <Text style={{
          fontSize: 14, color: colors.textMuted,
          textAlign: 'center', lineHeight: 21, fontStyle: 'italic',
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
          borderRadius: 8,
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}>
          {icon}
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      </View>
      {children}
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HoyNuevoScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = getTodayDate();
  const { currentToast, showToast, hideToast } = usePointsToast();
  const addPoints = useAppStore((s) => s.addPoints);
  const hasPendingGiftBadge = useAppStore((s) => s.notificationBadges.hasPendingGift);

  const devocional = SAMPLE_DEVOCIONAL;
  const { reference, version, text: verseText } = parseVersiculo(devocional.versiculo);
  const mappedDevotional = repoToDevotional(devocional, REPO_DEFAULT_IMAGE);
  const autoTitle = devocional.tags[0] ?? 'Devocional';

  const formattedDate = new Date(today + 'T12:00:00').toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  // ── Daily prayer (petitions appended to oracion) ──
  const { data: dailyPrayer } = useQuery({
    queryKey: ['daily-prayer-today'],
    queryFn: () => gamificationApi.getTodayDailyPrayer(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const fullPrayerText = (() => {
    if (!dailyPrayer) return devocional.oracion;
    const petitionText = language === 'es' ? dailyPrayer.prayerTextEs : dailyPrayer.prayerText;
    if (!petitionText) return devocional.oracion;
    return `${devocional.oracion}\n\n${petitionText}`;
  })();

  // ── Share ──
  const [shareVisible, setShareVisible] = useState(false);

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareVisible(true);
  };

  const handleShareComplete = async () => {
    if (!user) return;
    try {
      const result = await gamificationApi.awardPoints(user.id, 'share');
      if (result?.success) {
        addPoints(result.pointsAwarded);
        addLedgerEntry({
          delta: result.pointsAwarded,
          kind: 'devotional',
          title: language === 'es' ? 'Devocional compartido' : 'Devotional shared',
          detail: '',
        });
        showToast(result.pointsAwarded, language === 'es' ? 'puntos (Compartir)' : 'points (Share)');
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

  // ── Completion timer (90 seconds) ──
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionThankYou, setShowCompletionThankYou] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCompletedRef = useRef(false);

  const handleCompleteRef = useRef<(() => Promise<void>) | undefined>(undefined);
  handleCompleteRef.current = async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsCompleted(true);
    setShowCompletionThankYou(true);
    setTimeout(() => setShowCompletionThankYou(false), 4000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markDevotionalCompletedToday().catch(() => {});
    if (!user) return;
    try {
      const result = await gamificationApi.awardPoints(user.id, 'devotional_complete');
      if (result?.success) {
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

  // ── Scroll tracking (for SpiritualIntro fade) ──
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
  const voiceIdRef = useRef<string | undefined>(undefined);
  const ttsInitRef = useRef(false);

  useEffect(() => {
    if (ttsInitRef.current) return;
    ttsInitRef.current = true;
    pickBestVoice(language).then((picked) => {
      voiceIdRef.current = picked?.voiceIdentifier;
    }).catch(() => {});
  }, [language]);

  const nMeditar = devocional.para_meditar.length;
  const oracionSectionIndex = 2 + nMeditar;

  const buildTTSSections = useCallback((): { key: string; text: string }[] => {
    const sections: { key: string; text: string }[] = [];
    sections.push({
      key: 'verse',
      text: preprocessNumbersForTTS(sanitizeForTTS(`${verseText}. ${reference}`)),
    });
    sections.push({
      key: 'reflexion',
      text: preprocessNumbersForTTS(sanitizeForTTS(devocional.reflexion)),
    });
    devocional.para_meditar.forEach((v, i) => {
      sections.push({
        key: `meditar_${i}`,
        text: preprocessNumbersForTTS(sanitizeForTTS(`${v.cita}. ${v.texto}`)),
      });
    });
    sections.push({
      key: 'oracion',
      text: preprocessNumbersForTTS(sanitizeForTTS(fullPrayerText)),
    });
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
      return;
    }
    setCurrentSectionIndex(index);
    currentSectionIndexRef.current = index;
    const advance = () => {
      setTimeout(() => {
        if (jobId === speechJobIdRef.current && isTTSPlayingRef.current) {
          speakSection(index + 1, sections, jobId);
        }
      }, 300);
    };
    const opts: Speech.SpeechOptions = {
      language: language === 'es' ? 'es-MX' : 'en-US',
      rate: TTS_RATE,
      pitch: TTS_PITCH,
      onDone: advance,
      onError: advance,
    };
    if (voiceIdRef.current) opts.voice = voiceIdRef.current;
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

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

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
            source={{ uri: REPO_DEFAULT_IMAGE }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Top row: streak + novedades + share */}
          <View style={{
            position: 'absolute',
            top: insets.top + 10,
            left: 20,
            right: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Streak badge */}
            {user && user.streakCurrent > 0 ? (
              <View style={{
                backgroundColor: 'rgba(249,115,22,0.90)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}>
                <Flame size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  {user.streakCurrent}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {/* Right: novedades + share */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => {
                  setHasUnreadNews(false);
                  router.push('/novedades');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderRadius: 22,
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.28)',
                }}
              >
                <Mail size={18} color="#fff" />
                {showNovedadesBadge && <NotifDot />}
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderRadius: 22,
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.28)',
                }}
              >
                <Share2 size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Bottom: label + title + date */}
          <View style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
            <Text style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 3,
            }}>
              {language === 'es' ? 'Devocional de Hoy' : "Today's Devotional"}
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: '700',
              lineHeight: 28,
              marginBottom: 6,
            }}>
              {autoTitle}
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 13,
              fontWeight: '500',
              textTransform: 'capitalize',
            }}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 20 }}>
          {/* Fading intro text */}
          <SpiritualIntro scrollY={scrollY} colors={colors} language={language} />

          {/* Completion banner */}
          <DailyEngagementBanner
            isCompleted={isCompleted}
            showThankYou={showCompletionThankYou}
            colors={colors}
            language={language}
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
              color: colors.text,
              fontSize: 17,
              lineHeight: 27,
              fontStyle: 'italic',
              fontWeight: '400',
            }}>
              "{verseText}"
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: 10,
            }}>
              <View style={{
                backgroundColor: colors.primary + '18',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                  {version}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* TTS Control Bar */}
          <Pressable
            onPress={handleTTSToggle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary + '12',
              borderRadius: 14,
              paddingVertical: 11,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.primary + '25',
              gap: 8,
            }}
          >
            {isTTSPlaying
              ? <Pause size={18} color={colors.primary} />
              : <Play size={18} color={colors.primary} />}
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
              {isTTSPlaying
                ? (language === 'es' ? 'Detener lectura' : 'Stop reading')
                : (language === 'es' ? 'Escuchar devocional' : 'Listen to devotional')}
            </Text>
          </Pressable>

          {/* Reflexión */}
          <SectionCard
            icon={<BookOpen size={16} color={colors.primary} />}
            iconColor={colors.primary}
            title={language === 'es' ? 'Reflexión' : 'Reflection'}
            isHighlighted={currentSectionIndex === 1}
            onPress={() => handleTTSJumpTo(1)}
            colors={colors}
          >
            <Text style={{
              color: colors.text,
              fontSize: 15,
              lineHeight: 25,
              fontWeight: '400',
              opacity: 0.88,
            }}>
              {devocional.reflexion}
            </Text>
          </SectionCard>

          {/* Para Meditar */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                backgroundColor: '#f43f5e18',
                borderRadius: 8,
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <Heart size={16} color="#f43f5e" />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
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
                      borderRadius: 14,
                      padding: 16,
                      marginRight: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: highlighted ? '#f43f5e' : '#f43f5e60',
                      borderWidth: highlighted ? 1.5 : 0,
                      borderColor: highlighted ? '#f43f5e' : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <Text style={{
                      color: '#f43f5e',
                      fontSize: 13,
                      fontWeight: '700',
                      marginBottom: 8,
                      letterSpacing: 0.3,
                    }}>
                      {v.cita}
                    </Text>
                    <Text style={{
                      color: colors.text,
                      fontSize: 14,
                      lineHeight: 22,
                      fontStyle: 'italic',
                      opacity: 0.85,
                    }}>
                      "{v.texto}"
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Oración (with petitions appended) */}
          <SectionCard
            icon={<Flame size={16} color={colors.primary} />}
            iconColor={colors.primary}
            title={language === 'es' ? 'Oración' : 'Prayer'}
            isHighlighted={currentSectionIndex === oracionSectionIndex}
            onPress={() => handleTTSJumpTo(oracionSectionIndex)}
            colors={colors}
          >
            <Text style={{
              color: colors.text,
              fontSize: 15,
              lineHeight: 25,
              fontStyle: 'italic',
              opacity: 0.9,
            }}>
              {fullPrayerText}
            </Text>
            {dailyPrayer && dailyPrayer.totalRequests > 0 && (
              <View style={{
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.primary + '20',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
                <Heart size={12} color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {dailyPrayer.totalRequests}{' '}
                  {language === 'es' ? 'peticiones incluidas' : 'prayer requests included'}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* Tags */}
          {devocional.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 }}>
              {devocional.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    backgroundColor: colors.primary + '12',
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Pastoral closure after completion */}
          {isCompleted && <PastoralClosure colors={colors} language={language} />}

          {/* Comments */}
          <CommentsSection devotionalDate={today} scrollViewRef={scrollRef as any} />
        </View>
      </Animated.ScrollView>

      <ShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        devotional={mappedDevotional}
        language={language}
        colors={colors}
        onShareComplete={handleShareComplete}
        showDate
      />
    </View>
  );
}
