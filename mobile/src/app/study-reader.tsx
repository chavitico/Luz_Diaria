// study-reader.tsx — Full-screen paginated biblical study reader
// Pages: 0 = key verse, 1..N = study cards
// TTS: block-by-block reading, tap any block to start from there

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
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
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ArrowLeft, ChevronRight, ChevronLeft, Volume2, Square, CheckCircle2 } from 'lucide-react-native';
import BibleDisclaimerFooter from '@/components/BibleDisclaimerFooter';
import { useThemeColors, useUser, useLanguage } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';
import { addLedgerEntry } from '@/lib/points-ledger';
import {
  sanitizeForTTS,
  preprocessNumbersForTTS,
  normalizeBibleRefForTTS,
  applyBiblicalPronunciations,
  addTTSPausesForNumberedPoints,
  normalizeEmphasisCapsForTTS,
} from '@/lib/tts-voices';
import { trackTTSUsed } from '@/lib/metrics';
import { useScaledFont } from '@/lib/textScale';
import { STUDIES_CATALOG } from '@/lib/studies/catalog';
import type { Study, StudyCard } from '@/lib/studies/types';

const ACCENT = '#16A34A';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudyTTSBlock {
  id: string;
  text: string;
  pageIndex: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatContent(text: string): string {
  return text.replace(/\\n/g, '\n');
}

// ─── Block Wrapper ────────────────────────────────────────────────────────────
// Makes any content block tappable and highlights the one currently being read.

function TTSBlock({
  id,
  activeBlockId,
  onTap,
  children,
  style,
}: {
  id: string;
  activeBlockId: string | null;
  onTap: (id: string) => void;
  children: React.ReactNode;
  style?: object;
}) {
  const isActive = activeBlockId === id;
  return (
    <Pressable
      onPress={() => onTap(id)}
      style={({ pressed }) => [
        style,
        isActive && {
          backgroundColor: ACCENT + '0C',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: ACCENT + '40',
          padding: 2,
        },
        pressed && { opacity: 0.72 },
      ]}
    >
      {children}
    </Pressable>
  );
}

// ─── Key Verse Page (Page 0) ──────────────────────────────────────────────────

function KeyVersePage({
  study,
  colors,
  sFont,
  lang,
  activeBlockId,
  onBlockTap,
}: {
  study: Study;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
  lang: 'en' | 'es';
  activeBlockId: string | null;
  onBlockTap: (id: string) => void;
}) {
  return (
    <View style={{ padding: 24, paddingTop: 16, paddingBottom: 40 }}>
      {/* Key verse card */}
      <TTSBlock id="kv" activeBlockId={activeBlockId} onTap={onBlockTap}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT }} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Key Verse' : 'Versículo Clave'}
            </Text>
          </View>
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
          <View>
            <Text style={{ fontSize: sFont(16), fontWeight: '800', color: ACCENT }}>
              {study.key_verse.reference.toUpperCase()}
            </Text>
            <Text style={{ fontSize: sFont(12), color: colors.textMuted, marginTop: 2 }}>
              {study.version}
            </Text>
          </View>
        </View>
      </TTSBlock>

      {/* Scripture passage — each verse is its own tappable block */}
      {(study.scripture_passage?.verses?.length ?? 0) > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{
            fontSize: sFont(11), fontWeight: '700', color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
          }}>
            {lang === 'en' ? 'Passage: ' : 'Pasaje: '}{study.scripture_passage?.reference}
          </Text>
          {study.scripture_passage?.verses?.map((v) => (
            <TTSBlock
              key={v.number}
              id={`v:${v.number}`}
              activeBlockId={activeBlockId}
              onTap={onBlockTap}
              style={{ marginBottom: 8 }}
            >
              <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: sFont(12), fontWeight: '700', color: ACCENT, minWidth: 20, marginTop: 2 }}>
                  {v.number}
                </Text>
                <Text style={{
                  flex: 1, fontSize: sFont(15), color: colors.text,
                  lineHeight: sFont(24), fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                }}>
                  {v.text}
                </Text>
              </View>
            </TTSBlock>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Card Page (Pages 1+) ─────────────────────────────────────────────────────

function CardPage({
  card,
  cardIdx,
  colors,
  sFont,
  lang,
  activeBlockId,
  onBlockTap,
}: {
  card: StudyCard;
  cardIdx: number;
  colors: ReturnType<typeof useThemeColors>;
  sFont: (n: number) => number;
  lang: 'en' | 'es';
  activeBlockId: string | null;
  onBlockTap: (id: string) => void;
}) {
  const isDiscovery = card.type === 'discovery_activation';
  const cid = `c${cardIdx}`;

  return (
    <View style={{ padding: 24, paddingTop: 16, paddingBottom: 40 }}>
      {/* Title + subtitle + content — single tappable block */}
      <TTSBlock id={`${cid}:header`} activeBlockId={activeBlockId} onTap={onBlockTap} style={{ marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: sFont(36), marginBottom: 12 }}>{card.icon}</Text>
          <Text style={{
            fontSize: sFont(22), fontWeight: '800', color: colors.text,
            lineHeight: sFont(28), letterSpacing: -0.3, marginBottom: 6,
          }}>
            {card.title}
          </Text>
          {card.subtitle && (
            <Text style={{ fontSize: sFont(14), color: ACCENT, fontWeight: '600', lineHeight: sFont(20) }}>
              {card.subtitle}
            </Text>
          )}
          {card.content && (
            <Text style={{
              fontSize: sFont(15), color: colors.text, lineHeight: sFont(26),
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              marginTop: 12, whiteSpace: 'pre-wrap',
            } as any}>
              {formatContent(card.content)}
            </Text>
          )}
        </View>
      </TTSBlock>

      {/* Greek words — each word is its own tappable block */}
      {card.greek_words && card.greek_words.length > 0 && (
        <View style={{ marginBottom: 20, gap: 12 }}>
          {card.greek_words.map((gw, i) => (
            <TTSBlock key={i} id={`${cid}:gw:${i}`} activeBlockId={activeBlockId} onTap={onBlockTap}>
              <View style={{
                backgroundColor: colors.surface, borderRadius: 14, padding: 16,
                borderWidth: 1, borderColor: '#0369A1' + '25',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: sFont(16), fontWeight: '800', color: '#0369A1' }}>{gw.word}</Text>
                  <Text style={{ fontSize: sFont(18), color: '#0369A1', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                    {gw.transliteration}
                  </Text>
                  <View style={{ backgroundColor: '#0369A1' + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: sFont(11), fontWeight: '700', color: '#0369A1' }}>{gw.strong}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: sFont(14), color: colors.text, marginBottom: 6 }}>{gw.meaning}</Text>
                <Text style={{ fontSize: sFont(13), color: colors.textMuted, fontStyle: 'italic', lineHeight: sFont(20) }}>
                  {gw.revelation}
                </Text>
              </View>
            </TTSBlock>
          ))}
        </View>
      )}

      {/* Scripture connections — each reference is its own tappable block */}
      {card.scripture_connections && card.scripture_connections.length > 0 && (
        <View style={{ marginBottom: 20, gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            {lang === 'en' ? 'References' : 'Referencias'}
          </Text>
          {card.scripture_connections.map((sc, i) => (
            <TTSBlock key={i} id={`${cid}:sc:${i}`} activeBlockId={activeBlockId} onTap={onBlockTap}>
              <View style={{
                backgroundColor: ACCENT + '10', borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 10,
                borderLeftWidth: 3, borderLeftColor: ACCENT,
              }}>
                <Text style={{ fontSize: sFont(13), fontWeight: '700', color: ACCENT, marginBottom: 2 }}>{sc.reference}</Text>
                <Text style={{ fontSize: sFont(13), color: colors.text }}>{sc.text}</Text>
              </View>
            </TTSBlock>
          ))}
        </View>
      )}

      {/* Discovery questions — each question is its own tappable block */}
      {isDiscovery && card.discovery_questions && (
        <View style={{ gap: 14, marginBottom: 20 }}>
          {card.discovery_questions.map((q, i) => (
            <TTSBlock key={i} id={`${cid}:dq:${i}`} activeBlockId={activeBlockId} onTap={onBlockTap}>
              <View style={{
                backgroundColor: colors.surface, borderRadius: 14, padding: 16,
                borderWidth: 1, borderColor: colors.textMuted + '20',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  {q.category}
                </Text>
                <Text style={{
                  fontSize: sFont(15), color: colors.text, lineHeight: sFont(24),
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                }}>
                  {q.question}
                </Text>
              </View>
            </TTSBlock>
          ))}
        </View>
      )}

      {/* Prayer */}
      {isDiscovery && card.prayer && (
        <TTSBlock id={`${cid}:prayer`} activeBlockId={activeBlockId} onTap={onBlockTap} style={{ marginBottom: 8 }}>
          <View style={{
            backgroundColor: ACCENT + '0D', borderRadius: 16, padding: 20,
            borderWidth: 1, borderColor: ACCENT + '30',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              🙏 {card.prayer.title}
            </Text>
            <Text style={{
              fontSize: sFont(15), color: colors.text, lineHeight: sFont(26),
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            }}>
              {formatContent(card.prayer.content)}
            </Text>
          </View>
        </TTSBlock>
      )}

      {/* Revelation key */}
      {card.revelation_key && (
        <TTSBlock id={`${cid}:rk`} activeBlockId={activeBlockId} onTap={onBlockTap} style={{ marginTop: 8 }}>
          <View style={{
            backgroundColor: ACCENT + '12', borderRadius: 14, padding: 16,
            borderLeftWidth: 4, borderLeftColor: ACCENT,
          }}>
            <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text, lineHeight: sFont(22), fontStyle: 'italic' }}>
              ✨ {card.revelation_key}
            </Text>
          </View>
        </TTSBlock>
      )}

      {/* Identity statement */}
      {card.identity_statement && (
        <TTSBlock id={`${cid}:is`} activeBlockId={activeBlockId} onTap={onBlockTap} style={{ marginTop: 12 }}>
          <View style={{
            backgroundColor: '#7C3AED' + '12', borderRadius: 14, padding: 16,
            borderLeftWidth: 4, borderLeftColor: '#7C3AED',
          }}>
            <Text style={{ fontSize: sFont(14), fontWeight: '700', color: colors.text, lineHeight: sFont(22) }}>
              {card.identity_statement}
            </Text>
          </View>
        </TTSBlock>
      )}
    </View>
  );
}

// ─── Block Builder ────────────────────────────────────────────────────────────
// Converts a Study into a flat ordered array of TTS blocks across all pages.

function buildAllBlocks(
  study: Study,
  ttsProcess: (s: string) => string,
): StudyTTSBlock[] {
  const blocks: StudyTTSBlock[] = [];

  // Page 0: key verse card
  blocks.push({
    id: 'kv',
    text: ttsProcess(`${study.key_verse.text}. ${study.key_verse.reference}.`),
    pageIndex: 0,
  });

  // Page 0: each passage verse individually
  study.scripture_passage?.verses?.forEach((v) => {
    blocks.push({
      id: `v:${v.number}`,
      text: ttsProcess(`${v.number}. ${v.text}`),
      pageIndex: 0,
    });
  });

  // Pages 1+: study cards
  study.cards.forEach((card, cardIdx) => {
    const pageIndex = cardIdx + 1;
    const cid = `c${cardIdx}`;

    // Title + subtitle + content as one block
    const headerParts: string[] = [card.title];
    if (card.subtitle) headerParts.push(card.subtitle);
    if (card.content) headerParts.push(card.content.replace(/\\n/g, ' '));
    blocks.push({
      id: `${cid}:header`,
      text: ttsProcess(headerParts.join('. ')),
      pageIndex,
    });

    // Each greek word
    card.greek_words?.forEach((gw, i) => {
      blocks.push({
        id: `${cid}:gw:${i}`,
        text: ttsProcess(`${gw.word}: ${gw.meaning}. ${gw.revelation}`),
        pageIndex,
      });
    });

    // Each scripture connection
    card.scripture_connections?.forEach((sc, i) => {
      blocks.push({
        id: `${cid}:sc:${i}`,
        text: ttsProcess(`${sc.reference}. ${sc.text}`),
        pageIndex,
      });
    });

    // Each discovery question
    card.discovery_questions?.forEach((q, i) => {
      blocks.push({
        id: `${cid}:dq:${i}`,
        text: ttsProcess(q.question),
        pageIndex,
      });
    });

    // Prayer
    if (card.prayer) {
      blocks.push({
        id: `${cid}:prayer`,
        text: ttsProcess(`${card.prayer.title}. ${card.prayer.content.replace(/\\n/g, ' ')}`),
        pageIndex,
      });
    }

    // Revelation key
    if (card.revelation_key) {
      blocks.push({
        id: `${cid}:rk`,
        text: ttsProcess(card.revelation_key),
        pageIndex,
      });
    }

    // Identity statement
    if (card.identity_statement) {
      blocks.push({
        id: `${cid}:is`,
        text: ttsProcess(card.identity_statement),
        pageIndex,
      });
    }
  });

  return blocks;
}

// ─── Main Reader ──────────────────────────────────────────────────────────────

export default function StudyReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { sFont } = useScaledFont();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();

  const language = useLanguage();

  const entry = STUDIES_CATALOG.find((s) => s.id === id);
  const study: Study | null = entry
    ? (language === 'en' && entry.dataFileEn ? entry.dataFileEn() : entry.dataFile())
    : null;

  const [page, setPage] = useState(0); // 0 = key verse, 1..N = cards
  const pageRef = useRef(0);
  useEffect(() => { pageRef.current = page; }, [page]);

  const [isCompleted, setIsCompleted] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

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

  // ─── TTS State ──────────────────────────────────────────────────────────────

  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentTTSBlockId, setCurrentTTSBlockId] = useState<string | null>(null);
  const ttsJobRef = useRef(0);
  const isSpeakingRef = useRef(false);

  // ─── TTS Pipeline ──────────────────────────────────────────────────────────

  const ttsProcess = useCallback((raw: string): string => {
    return applyBiblicalPronunciations(
      preprocessNumbersForTTS(
        addTTSPausesForNumberedPoints(
          normalizeEmphasisCapsForTTS(
            normalizeBibleRefForTTS(
              sanitizeForTTS(raw),
              language
            )
          )
        )
      ),
      language
    );
  }, [language]);

  // Build flat block list once per study/language
  const allBlocks = useMemo(() => {
    if (!study) return [];
    return buildAllBlocks(study, ttsProcess);
  }, [study, ttsProcess]);

  const allBlocksRef = useRef<StudyTTSBlock[]>(allBlocks);
  useEffect(() => { allBlocksRef.current = allBlocks; }, [allBlocks]);

  // ─── Page Transitions ──────────────────────────────────────────────────────

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

  // ─── TTS Engine ────────────────────────────────────────────────────────────

  const stopTTS = useCallback(() => {
    ttsJobRef.current += 1;
    isSpeakingRef.current = false;
    Speech.stop();
    setIsTTSPlaying(false);
    setCurrentTTSBlockId(null);
  }, []);

  const speakBlockByIndex = useCallback((
    blockIdx: number,
    blocks: StudyTTSBlock[],
    jobId: number,
  ) => {
    if (blockIdx >= blocks.length || jobId !== ttsJobRef.current || !isSpeakingRef.current) {
      isSpeakingRef.current = false;
      setIsTTSPlaying(false);
      setCurrentTTSBlockId(null);
      return;
    }

    const block = blocks[blockIdx];

    // Skip empty blocks silently
    if (!block.text.trim()) {
      setTimeout(() => speakBlockByIndex(blockIdx + 1, blocks, jobId), 80);
      return;
    }

    setCurrentTTSBlockId(block.id);

    // Auto-advance page when TTS crosses into a new page
    if (pageRef.current !== block.pageIndex) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      const offset = block.pageIndex > pageRef.current ? -30 : 30;
      showNextPage(block.pageIndex, offset);
    }

    Speech.speak(block.text, {
      language: language === 'en' ? 'en-US' : 'es-MX',
      rate: 0.88,
      pitch: 0.95,
      onDone: () => {
        setTimeout(() => {
          if (jobId === ttsJobRef.current && isSpeakingRef.current) {
            speakBlockByIndex(blockIdx + 1, blocks, jobId);
          }
        }, 200);
      },
      onError: () => {
        setTimeout(() => {
          if (jobId === ttsJobRef.current && isSpeakingRef.current) {
            speakBlockByIndex(blockIdx + 1, blocks, jobId);
          }
        }, 200);
      },
    });
  }, [language, showNextPage]);

  const startTTSFromBlock = useCallback(async (blockId: string) => {
    const blocks = allBlocksRef.current;
    const blockIdx = blocks.findIndex((b) => b.id === blockId);
    if (blockIdx === -1) return;

    trackTTSUsed(user?.id, 'studies');

    ttsJobRef.current += 1;
    const jobId = ttsJobRef.current;
    isSpeakingRef.current = true;
    setIsTTSPlaying(true);

    await Speech.stop();
    speakBlockByIndex(blockIdx, blocks, jobId);
  }, [speakBlockByIndex, user?.id]);

  // Header TTS button: start from first block of current page, or stop
  const handleHeaderTTSTap = useCallback(() => {
    if (isTTSPlaying) {
      stopTTS();
      return;
    }
    const firstBlock = allBlocksRef.current.find((b) => b.pageIndex === pageRef.current);
    if (firstBlock) startTTSFromBlock(firstBlock.id);
  }, [isTTSPlaying, stopTTS, startTTSFromBlock]);

  // Stop TTS when screen loses focus (back navigation, tab switch, app background)
  useFocusEffect(
    useCallback(() => {
      return () => {
        ttsJobRef.current += 1;
        isSpeakingRef.current = false;
        Speech.stop();
        setIsTTSPlaying(false);
        setCurrentTTSBlockId(null);
      };
    }, [])
  );

  // ─── Completion ─────────────────────────────────────────────────────────────

  const checkAndAwardCompletion = useCallback(async () => {
    if (!study || !user || !entry) return;
    const storageKey = `study_complete:${study.id}`;
    const alreadyDone = await AsyncStorage.getItem(storageKey);
    if (alreadyDone) return;

    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    const requiredSeconds = entry.estimated_reading_minutes * 60 * 0.62;
    if (elapsedSeconds >= requiredSeconds) {
      await AsyncStorage.setItem(storageKey, '1');
      await gamificationApi.awardPoints(user.id, 'study_complete', { studyId: study.id });
      const completedTitle = language === 'en' ? (entry.title_en ?? entry.title) : entry.title;
      await addLedgerEntry({
        kind: 'mission',
        delta: 300,
        title: language === 'en' ? 'Biblical Study completed' : 'Estudio Bíblico completado',
        detail: completedTitle,
      });
      setIsCompleted(true);
    }
  }, [study, user, entry, language]);

  // ─── Manual Navigation (stops TTS) ─────────────────────────────────────────

  const goNext = useCallback(() => {
    if (!study || page >= totalPages - 1) return;
    stopTTS();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    const nextPage = page + 1;
    animateTo(nextPage, 'forward');
    if (nextPage === totalPages - 1) checkAndAwardCompletion();
  }, [study, page, totalPages, animateTo, checkAndAwardCompletion, stopTTS]);

  const goPrev = useCallback(() => {
    if (page <= 0) return;
    stopTTS();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    animateTo(page - 1, 'back');
  }, [page, animateTo, stopTTS]);

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
            {language === 'en' ? 'Biblical Studies' : 'Estudios Bíblicos'}
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {/* TTS button: plays from top of current page, or stops */}
        <Pressable
          onPress={handleHeaderTTSTap}
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

        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>
          {page + 1}/{totalPages}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ height: 2, backgroundColor: colors.textMuted + '20' }}>
        <View style={{ height: 2, backgroundColor: ACCENT, width: `${((page + 1) / totalPages) * 100}%` }} />
      </View>

      {/* Study title */}
      <View style={{
        flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14,
        paddingBottom: 10, alignItems: 'flex-start', gap: 10,
      }}>
        <View style={{ width: 4, height: '100%', backgroundColor: ACCENT, borderRadius: 2, alignSelf: 'stretch' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, lineHeight: 20 }}>
            {study.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
            {study.subtitle}
          </Text>
        </View>
      </View>

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
              <KeyVersePage
                study={study}
                colors={colors}
                sFont={sFont}
                lang={language}
                activeBlockId={currentTTSBlockId}
                onBlockTap={startTTSFromBlock}
              />
            ) : (
              <CardPage
                card={study.cards[page - 1]}
                cardIdx={page - 1}
                colors={colors}
                sFont={sFont}
                lang={language}
                activeBlockId={currentTTSBlockId}
                onBlockTap={startTTSFromBlock}
              />
            )}
            {isLastPage && (
              <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
                <BibleDisclaimerFooter topics={study.title} version={study.version} language={language} />
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Bottom nav bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: insets.bottom + 12, paddingTop: 12, paddingHorizontal: 24,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.background, borderTopWidth: 0.5,
        borderTopColor: colors.textMuted + '20',
      }}>
        {!isFirstPage ? (
          <Pressable
            onPress={goPrev}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.textMuted + '25',
            })}
          >
            <ChevronLeft size={16} color={colors.textMuted} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>
              {language === 'en' ? 'Back' : 'Anterior'}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 100 }} />
        )}

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View key={i} style={{
              width: i === page ? 20 : 6, height: 6, borderRadius: 3,
              backgroundColor: i === page ? ACCENT : colors.textMuted + '40',
            }} />
          ))}
        </View>

        {!isLastPage ? (
          <Pressable
            onPress={goNext}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.textMuted + '25',
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>
              {language === 'en' ? 'Next' : 'Siguiente'}
            </Text>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={2.5} />
          </Pressable>
        ) : isCompleted ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingVertical: 8, paddingHorizontal: 12, borderRadius: 22,
            backgroundColor: ACCENT + '15', borderWidth: 1, borderColor: ACCENT + '40',
          }}>
            <CheckCircle2 size={14} color={ACCENT} strokeWidth={2.5} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>
              {language === 'en' ? 'Completed' : 'Completado'}
            </Text>
          </View>
        ) : (
          <View style={{ width: 100 }} />
        )}
      </View>
    </View>
  );
}
