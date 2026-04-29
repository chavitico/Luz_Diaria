// study-reader.tsx — Full-screen paginated biblical study reader
// Pages: 1 = key verse, 2..N = study cards
// Navigation: tap "Siguiente" / "Anterior" or swipe

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ArrowLeft, ChevronRight, ChevronLeft, Volume2, Square, CheckCircle2 } from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';
import { sanitizeForTTS, preprocessNumbersForTTS } from '@/lib/tts-voices';
import { useScaledFont } from '@/lib/textScale';
import { STUDIES_CATALOG } from '@/lib/studies/catalog';
import type { Study, StudyCard } from '@/lib/studies/types';

const { width: SCREEN_W } = Dimensions.get('window');

const ACCENT = '#16A34A'; // green accent matching the images

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatContent(text: string): string {
  return text.replace(/\\n/g, '\n');
}

// ─── Key Verse Page (Page 1) ──────────────────────────────────────────────────

function KeyVersePage({ study, colors, sFont }: { study: Study; colors: ReturnType<typeof useThemeColors>; sFont: (n: number) => number }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 40 }}
    >
      {/* Verse card */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: ACCENT + '25',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {/* VERSÍCULO CLAVE chip */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 18,
        }}>
          <View style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: ACCENT,
          }} />
          <Text style={{
            fontSize: 10,
            fontWeight: '800',
            color: ACCENT,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
            Versículo Clave
          </Text>
        </View>

        {/* Verse text */}
        <Text style={{
          fontSize: sFont(22),
          fontWeight: '600',
          color: colors.text,
          lineHeight: sFont(34),
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          marginBottom: 20,
        }}>
          "{study.key_verse.text}"
        </Text>

        {/* Reference */}
        <View>
          <Text style={{ fontSize: sFont(16), fontWeight: '800', color: ACCENT }}>
            {study.key_verse.reference.toUpperCase()}
          </Text>
          <Text style={{ fontSize: sFont(12), color: colors.textMuted, marginTop: 2 }}>
            {study.version}
          </Text>
        </View>
      </View>

      {/* Scripture passage */}
      {study.scripture_passage.verses.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{
            fontSize: sFont(11),
            fontWeight: '700',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
          }}>
            Pasaje: {study.scripture_passage.reference}
          </Text>
          {study.scripture_passage.verses.map((v) => (
            <View key={v.number} style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 12,
            }}>
              <Text style={{
                fontSize: sFont(12),
                fontWeight: '700',
                color: ACCENT,
                minWidth: 20,
                marginTop: 2,
              }}>
                {v.number}
              </Text>
              <Text style={{
                flex: 1,
                fontSize: sFont(15),
                color: colors.text,
                lineHeight: sFont(24),
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              }}>
                {v.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Card Page (Pages 2+) ─────────────────────────────────────────────────────

function CardPage({ card, colors, sFont }: { card: StudyCard; colors: ReturnType<typeof useThemeColors>; sFont: (n: number) => number }) {
  const isDiscovery = card.type === 'discovery_activation';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 40 }}
    >
      {/* Icon + title + subtitle */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: sFont(36), marginBottom: 12 }}>{card.icon}</Text>
        <Text style={{
          fontSize: sFont(22),
          fontWeight: '800',
          color: colors.text,
          lineHeight: sFont(28),
          letterSpacing: -0.3,
          marginBottom: 6,
        }}>
          {card.title}
        </Text>
        {card.subtitle && (
          <Text style={{
            fontSize: sFont(14),
            color: ACCENT,
            fontWeight: '600',
            lineHeight: sFont(20),
          }}>
            {card.subtitle}
          </Text>
        )}
      </View>

      {/* Main content */}
      {card.content && (
        <Text style={{
          fontSize: sFont(15),
          color: colors.text,
          lineHeight: sFont(26),
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          marginBottom: 20,
          whiteSpace: 'pre-wrap',
        } as any}>
          {formatContent(card.content)}
        </Text>
      )}

      {/* Greek words section */}
      {card.greek_words && card.greek_words.length > 0 && (
        <View style={{ marginBottom: 20, gap: 12 }}>
          {card.greek_words.map((gw, i) => (
            <View key={i} style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: '#0369A1' + '25',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <Text style={{
                  fontSize: sFont(16),
                  fontWeight: '800',
                  color: '#0369A1',
                }}>
                  {gw.word}
                </Text>
                <Text style={{
                  fontSize: sFont(18),
                  color: '#0369A1',
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                }}>
                  {gw.transliteration}
                </Text>
                <View style={{
                  backgroundColor: '#0369A1' + '18',
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#0369A1' }}>
                    {gw.strong}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: sFont(14), color: colors.text, marginBottom: 6 }}>
                {gw.meaning}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.textMuted, fontStyle: 'italic', lineHeight: sFont(20) }}>
                {gw.revelation}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Scripture connections */}
      {card.scripture_connections && card.scripture_connections.length > 0 && (
        <View style={{ marginBottom: 20, gap: 8 }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
          }}>
            Referencias
          </Text>
          {card.scripture_connections.map((sc, i) => (
            <View key={i} style={{
              backgroundColor: ACCENT + '10',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderLeftWidth: 3,
              borderLeftColor: ACCENT,
            }}>
              <Text style={{ fontSize: sFont(13), fontWeight: '700', color: ACCENT, marginBottom: 2 }}>
                {sc.reference}
              </Text>
              <Text style={{ fontSize: sFont(13), color: colors.text }}>{sc.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Discovery questions */}
      {isDiscovery && card.discovery_questions && (
        <View style={{ gap: 14, marginBottom: 20 }}>
          {card.discovery_questions.map((q, i) => (
            <View key={i} style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.textMuted + '20',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '800',
                color: ACCENT,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
              }}>
                {q.category}
              </Text>
              <Text style={{
                fontSize: sFont(15),
                color: colors.text,
                lineHeight: sFont(24),
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              }}>
                {q.question}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Prayer */}
      {isDiscovery && card.prayer && (
        <View style={{
          backgroundColor: ACCENT + '0D',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: ACCENT + '30',
          marginBottom: 8,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '800',
            color: ACCENT,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
          }}>
            🙏 {card.prayer.title}
          </Text>
          <Text style={{
            fontSize: sFont(15),
            color: colors.text,
            lineHeight: sFont(26),
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          }}>
            {formatContent(card.prayer.content)}
          </Text>
        </View>
      )}

      {/* Revelation key */}
      {card.revelation_key && (
        <View style={{
          backgroundColor: ACCENT + '12',
          borderRadius: 14,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: ACCENT,
          marginTop: 8,
        }}>
          <Text style={{
            fontSize: sFont(14),
            fontWeight: '700',
            color: colors.text,
            lineHeight: sFont(22),
            fontStyle: 'italic',
          }}>
            ✨ {card.revelation_key}
          </Text>
        </View>
      )}

      {/* Identity statement */}
      {card.identity_statement && (
        <View style={{
          backgroundColor: '#7C3AED' + '12',
          borderRadius: 14,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#7C3AED',
          marginTop: 12,
        }}>
          <Text style={{
            fontSize: sFont(14),
            fontWeight: '700',
            color: colors.text,
            lineHeight: sFont(22),
          }}>
            {card.identity_statement}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main Reader ──────────────────────────────────────────────────────────────

export default function StudyReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();

  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const ttsJobRef = useRef(0);

  const entry = STUDIES_CATALOG.find((s) => s.id === id);
  const study: Study | null = entry ? entry.dataFile() : null;

  const [page, setPage] = useState(0); // 0 = key verse, 1..N = cards
  const [isCompleted, setIsCompleted] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  // Load completion status from storage on mount
  useEffect(() => {
    if (!study) return;
    AsyncStorage.getItem(`study_complete:${study.id}`).then((val) => {
      if (val) setIsCompleted(true);
    });
  }, [study?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const scrollRef = useRef<ScrollView>(null);

  const totalPages = study ? 1 + study.cards.length : 1;

  // ─── TTS ────────────────────────────────────────────────────────────────────

  const buildPageText = useCallback((): string => {
    if (!study) return '';
    if (page === 0) {
      const verses = study.scripture_passage.verses.map((v) => `${v.number}. ${v.text}`).join(' ');
      return preprocessNumbersForTTS(sanitizeForTTS(
        `${study.key_verse.text}. ${study.key_verse.reference}. ${verses}`
      ));
    }
    const card = study.cards[page - 1];
    const parts: string[] = [card.title];
    if (card.subtitle) parts.push(card.subtitle);
    if (card.content) parts.push(card.content.replace(/\\n/g, ' '));
    card.greek_words?.forEach((gw) => {
      parts.push(`${gw.word}: ${gw.meaning}. ${gw.revelation}`);
    });
    card.scripture_connections?.forEach((sc) => {
      parts.push(`${sc.reference}. ${sc.text}`);
    });
    if (card.revelation_key) parts.push(card.revelation_key);
    if (card.identity_statement) parts.push(card.identity_statement);
    card.discovery_questions?.forEach((q) => parts.push(q.question));
    if (card.prayer) parts.push(`${card.prayer.title}. ${card.prayer.content.replace(/\\n/g, ' ')}`);
    return preprocessNumbersForTTS(sanitizeForTTS(parts.join('. ')));
  }, [study, page]);

  const stopTTS = useCallback(() => {
    ttsJobRef.current += 1;
    Speech.stop();
    setIsTTSPlaying(false);
  }, []);

  const handleTTSTap = useCallback(async () => {
    if (isTTSPlaying) {
      stopTTS();
      return;
    }
    const text = buildPageText();
    if (!text) return;
    ttsJobRef.current += 1;
    const jobId = ttsJobRef.current;
    setIsTTSPlaying(true);
    await Speech.stop();
    Speech.speak(text, {
      language: 'es-MX',
      rate: 0.88,
      pitch: 0.95,
      onDone: () => { if (ttsJobRef.current === jobId) setIsTTSPlaying(false); },
      onError: () => { if (ttsJobRef.current === jobId) setIsTTSPlaying(false); },
    });
  }, [isTTSPlaying, buildPageText, stopTTS]);

  // Stop TTS when page changes or component unmounts
  useEffect(() => { stopTTS(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { Speech.stop(); }, []);

  // ────────────────────────────────────────────────────────────────────────────

  const checkAndAwardCompletion = useCallback(async () => {
    if (!study || !user || !entry) return;
    const storageKey = `study_complete:${study.id}`;
    const alreadyDone = await AsyncStorage.getItem(storageKey);
    if (alreadyDone) return;

    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    const requiredSeconds = entry.estimated_reading_minutes * 60 * 0.9;
    if (elapsedSeconds >= requiredSeconds) {
      await AsyncStorage.setItem(storageKey, '1');
      await gamificationApi.awardPoints(user.id, 'study_complete');
      await addLedgerEntry({ kind: 'mission', delta: 300, title: 'Estudio Bíblico completado', detail: entry.title });
      setIsCompleted(true);
    }
  }, [study, user, entry]);

  const showNextPage = useCallback((nextPage: number, offset: number) => {
    setPage(nextPage);
    translateX.value = offset;
    translateX.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [opacity, translateX]);

  const animateTo = useCallback((nextPage: number, direction: 'forward' | 'back') => {
    const offset = direction === 'forward' ? -30 : 30;
    opacity.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(showNextPage)(nextPage, offset);
    });
  }, [opacity, showNextPage]);

  const goNext = useCallback(() => {
    if (!study || page >= totalPages - 1) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    const nextPage = page + 1;
    animateTo(nextPage, 'forward');
    if (nextPage === totalPages - 1) {
      checkAndAwardCompletion();
    }
  }, [study, page, totalPages, animateTo, checkAndAwardCompletion]);

  const goPrev = useCallback(() => {
    if (page <= 0) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    animateTo(page - 1, 'back');
  }, [page, animateTo]);

  const pageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  if (!study) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Estudio no encontrado</Text>
      </View>
    );
  }

  const isLastPage = page === totalPages - 1;
  const isFirstPage = page === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 16,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: colors.textMuted + '20',
      }}>
        {/* Back to list */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingRight: 8,
          })}
        >
          <ArrowLeft size={16} color={ACCENT} strokeWidth={2.5} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>
            Estudios Bíblicos
          </Text>
        </Pressable>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* TTS button */}
        <Pressable
          onPress={handleTTSTap}
          hitSlop={12}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isTTSPlaying ? ACCENT + '20' : colors.surface,
            borderWidth: 1,
            borderColor: isTTSPlaying ? ACCENT + '60' : colors.textMuted + '25',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          })}
        >
          {isTTSPlaying
            ? <Square size={14} color={ACCENT} strokeWidth={2.5} fill={ACCENT} />
            : <Volume2 size={15} color={colors.textMuted} strokeWidth={2.5} />
          }
        </Pressable>

        {/* Page counter */}
        <Text style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.textMuted,
        }}>
          {page + 1}/{totalPages}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{
        height: 2,
        backgroundColor: colors.textMuted + '20',
      }}>
        <View style={{
          height: 2,
          backgroundColor: ACCENT,
          width: `${((page + 1) / totalPages) * 100}%`,
        }} />
      </View>

      {/* Study title + green left bar */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <View style={{
          width: 4,
          height: '100%',
          backgroundColor: ACCENT,
          borderRadius: 2,
          alignSelf: 'stretch',
        }} />
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            fontWeight: '800',
            color: colors.text,
            lineHeight: 20,
          }}>
            {study.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
            {study.subtitle}
          </Text>
        </View>
      </View>

      {/* Thin divider */}
      <View style={{ height: 0.5, backgroundColor: colors.textMuted + '18', marginHorizontal: 16 }} />

      {/* Page content with swipe gesture */}
      <GestureDetector gesture={Gesture.Pan()
        .activeOffsetX([-28, 28])
        .failOffsetY([-12, 12])
        .onEnd((e) => {
          if (e.translationX < -50) runOnJS(goNext)();
          else if (e.translationX > 50) runOnJS(goPrev)();
        })
      }>
        <Animated.View style={[{ flex: 1 }, pageStyle]}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {page === 0 ? (
              <KeyVersePage study={study} colors={colors} sFont={sFont} />
            ) : (
              <CardPage card={study.cards[page - 1]} colors={colors} sFont={sFont} />
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Bottom nav bar */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom + 12,
        paddingTop: 12,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderTopWidth: 0.5,
        borderTopColor: colors.textMuted + '20',
      }}>
        {/* Prev — hidden on first page */}
        {!isFirstPage ? (
          <Pressable
            onPress={goPrev}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.textMuted + '25',
            })}
          >
            <ChevronLeft size={16} color={colors.textMuted} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>
              Anterior
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 100 }} />
        )}

        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? ACCENT : colors.textMuted + '40',
              }}
            />
          ))}
        </View>

        {/* Next — hidden on last page; show Completado badge instead */}
        {!isLastPage ? (
          <Pressable
            onPress={goNext}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.textMuted + '25',
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>
              Siguiente
            </Text>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={2.5} />
          </Pressable>
        ) : isCompleted ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 22,
            backgroundColor: ACCENT + '15',
            borderWidth: 1,
            borderColor: ACCENT + '40',
          }}>
            <CheckCircle2 size={14} color={ACCENT} strokeWidth={2.5} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>
              Completado
            </Text>
          </View>
        ) : (
          <View style={{ width: 100 }} />
        )}
      </View>

    </View>
  );
}
