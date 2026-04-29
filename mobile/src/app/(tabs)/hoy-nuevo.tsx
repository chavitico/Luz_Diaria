// New devotional format — powered by develop4God/devocionales-json
// Experimental tab: compare with current HOY before replacing

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Share2, BookOpen, Heart, Flame, Play, Pause, Volume2 } from 'lucide-react-native';
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
  type RepoDevocional,
  type ParaMeditar,
} from '@/lib/repo-devocional';
import { TRANSLATIONS } from '@/lib/constants';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 280;
const TTS_RATE = 0.88;
const TTS_PITCH = 0.95;

// ─── Daily Prayer Section (peticiones) ──────────────────────────────────────
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
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }
  if (!dailyPrayer) return null;

  const title = language === 'es' ? dailyPrayer.titleEs : dailyPrayer.title;
  const prayerText = language === 'es' ? dailyPrayer.prayerTextEs : dailyPrayer.prayerText;

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      style={{
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.primary + '08',
        borderWidth: 1,
        borderColor: colors.primary + '20',
      }}
    >
      <View style={{
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.primary + '15',
      }}>
        <Heart size={18} color={colors.primary} />
        <Text style={{ fontSize: 15, fontWeight: '600', marginLeft: 8, color: colors.primary, flex: 1 }}>
          {t.prayer_of_the_day}
        </Text>
        {dailyPrayer.totalRequests > 0 && (
          <View style={{ backgroundColor: colors.primary + '20', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
              {dailyPrayer.totalRequests} {language === 'es' ? 'peticiones' : 'requests'}
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 16 }}>
        {title ? (
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 }}>{title}</Text>
        ) : null}
        <Text style={{ fontSize: 14, lineHeight: 22, color: colors.text, opacity: 0.85, fontStyle: 'italic' }}>
          {prayerText}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────
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
  const today = getTodayDate();
  const { currentToast, showToast, hideToast } = usePointsToast();
  const addPoints = useAppStore((s) => s.addPoints);

  const devocional = SAMPLE_DEVOCIONAL;
  const { reference, version, text: verseText } = parseVersiculo(devocional.versiculo);
  const mappedDevotional = repoToDevotional(devocional, REPO_DEFAULT_IMAGE);

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
        addLedgerEntry({ delta: result.pointsAwarded, kind: 'devotional', title: language === 'es' ? 'Devocional compartido' : 'Devotional shared', detail: '' });
        showToast(result.pointsAwarded, language === 'es' ? 'puntos (Compartir)' : 'points (Share)');
      }
    } catch {}
  };

  // ── TTS ──
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const isTTSPlayingRef = useRef(false);
  const currentSectionIndexRef = useRef(-1);
  const speechJobIdRef = useRef(0);
  const voiceIdRef = useRef<string | undefined>(undefined);
  const ttsInitRef = useRef(false);

  // Pick voice once on mount
  useEffect(() => {
    if (ttsInitRef.current) return;
    ttsInitRef.current = true;
    pickBestVoice(language).then((picked) => {
      voiceIdRef.current = picked?.voiceIdentifier;
    }).catch(() => {});
  }, [language]);

  // Build TTS sections from repo format
  const buildTTSSections = useCallback((): { key: string; text: string }[] => {
    const sections: { key: string; text: string }[] = [];
    // Verse
    sections.push({
      key: 'verse',
      text: preprocessNumbersForTTS(sanitizeForTTS(`${verseText}. ${reference}`)),
    });
    // Reflexión
    sections.push({
      key: 'reflexion',
      text: preprocessNumbersForTTS(sanitizeForTTS(devocional.reflexion)),
    });
    // Para meditar - each verse as its own section
    devocional.para_meditar.forEach((v, i) => {
      sections.push({
        key: `meditar_${i}`,
        text: preprocessNumbersForTTS(sanitizeForTTS(`${v.cita}. ${v.texto}`)),
      });
    });
    // Oración
    sections.push({
      key: 'oracion',
      text: preprocessNumbersForTTS(sanitizeForTTS(devocional.oracion)),
    });
    return sections;
  }, [verseText, reference, devocional]);

  const speakSection = useCallback((index: number, sections: { key: string; text: string }[], jobId: number) => {
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
      // Stop
      speechJobIdRef.current += 1;
      isTTSPlayingRef.current = false;
      await Speech.stop();
      setIsTTSPlaying(false);
      setCurrentSectionIndex(-1);
      currentSectionIndexRef.current = -1;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Play
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

  // Stop TTS when leaving tab
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

  // ── Sections TTS mapping ──
  // verse=0, reflexion=1, meditar_0=2, meditar_1=3, meditar_2=4, oracion=5(+nMeditar-1)
  const nMeditar = devocional.para_meditar.length;
  const oracionSectionIndex = 2 + nMeditar;

  // ── Date format matching current HOY ──
  const formattedDate = new Date(devocional.date + 'T12:00:00').toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PointsToast message={currentToast} onHide={hideToast} primaryColor={colors.primary} />

      <ScrollView
        ref={scrollRef}
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
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Top row: version badge + share */}
          <View style={{
            position: 'absolute',
            top: insets.top + 10,
            left: 20,
            right: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.28)',
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
                {version}
              </Text>
            </View>
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

          {/* Bottom: date */}
          <View style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
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
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>

          {/* Verse Card */}
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
            {isTTSPlaying ? (
              <Pause size={18} color={colors.primary} />
            ) : (
              <Play size={18} color={colors.primary} />
            )}
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
            title="Reflexión"
            isHighlighted={currentSectionIndex === 1}
            onPress={() => handleTTSJumpTo(1)}
            colors={colors}
          >
            <Text style={{
              color: colors.text, fontSize: 15, lineHeight: 25,
              fontWeight: '400', opacity: 0.88,
            }}>
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
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Para Meditar</Text>
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
                      color: '#f43f5e', fontSize: 13, fontWeight: '700',
                      marginBottom: 8, letterSpacing: 0.3,
                    }}>
                      {v.cita}
                    </Text>
                    <Text style={{
                      color: colors.text, fontSize: 14, lineHeight: 22,
                      fontStyle: 'italic', opacity: 0.85,
                    }}>
                      "{v.texto}"
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Oración */}
          <SectionCard
            icon={<Flame size={16} color={colors.primary} />}
            iconColor={colors.primary}
            title={language === 'es' ? 'Oración' : 'Prayer'}
            isHighlighted={currentSectionIndex === oracionSectionIndex}
            onPress={() => handleTTSJumpTo(oracionSectionIndex)}
            colors={colors}
          >
            <Text style={{
              color: colors.text, fontSize: 15, lineHeight: 25,
              fontStyle: 'italic', opacity: 0.9,
            }}>
              {devocional.oracion}
            </Text>
          </SectionCard>

          {/* Daily Prayer of the Day (peticiones) */}
          <DailyPrayerSection colors={colors} language={language} />

          {/* Tags */}
          {devocional.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 8 }}>
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

          {/* Comments Section */}
          <CommentsSection devotionalDate={today} scrollViewRef={scrollRef as any} />
        </View>
      </ScrollView>

      {/* Share Sheet */}
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
