// DevotionalShareCard — single, fixed-dimension share card
// 1080×1350 (4:5 portrait) — optimal for WhatsApp, Instagram, iMessage
// Rules:
//   - Fixed width + height, never auto-sizes
//   - Verse: NEVER truncated — font shrinks then padding expands to fit
//   - Reflection: best spiritual sentence selected, max ~160 chars, no ellipsis
//   - Date shown only when showDate=true (today's devotional from home screen)
//   - Reference: 1 line
//   - Branding: footer

import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LuzDiariaIconWhite } from '@/components/LuzDiariaIcon';
import { LinearGradient } from 'expo-linear-gradient';
import type { Devotional } from '@/lib/types';
import { useBranding, DEFAULT_BRANDING, type AppBranding } from '@/lib/branding-service';

// Canonical capture dimensions (4:5 portrait)
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
// Preview size (maintains 4:5 ratio)
export const PREVIEW_WIDTH = 300;
export const PREVIEW_HEIGHT = 375;

// Bible book translations for Spanish
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  Genesis: 'Génesis', Exodus: 'Éxodo', Leviticus: 'Levítico',
  Numbers: 'Números', Deuteronomy: 'Deuteronomio', Joshua: 'Josué',
  Judges: 'Jueces', Ruth: 'Rut', '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes', '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas', '2 Chronicles': '2 Crónicas',
  Ezra: 'Esdras', Nehemiah: 'Nehemías', Esther: 'Ester', Job: 'Job',
  Psalm: 'Salmo', Psalms: 'Salmos', Proverbs: 'Proverbios',
  Ecclesiastes: 'Eclesiastés', 'Song of Solomon': 'Cantares', 'Song of Songs': 'Cantares',
  Isaiah: 'Isaías', Jeremiah: 'Jeremías', Lamentations: 'Lamentaciones',
  Ezekiel: 'Ezequiel', Daniel: 'Daniel', Hosea: 'Oseas', Joel: 'Joel',
  Amos: 'Amós', Obadiah: 'Abdías', Jonah: 'Jonás', Micah: 'Miqueas',
  Nahum: 'Nahúm', Habakkuk: 'Habacuc', Zephaniah: 'Sofonías',
  Haggai: 'Hageo', Zechariah: 'Zacarías', Malachi: 'Malaquías',
  Matthew: 'Mateo', Mark: 'Marcos', Luke: 'Lucas', John: 'Juan',
  Acts: 'Hechos', Romans: 'Romanos',
  '1 Corinthians': '1 Corintios', '2 Corinthians': '2 Corintios',
  Galatians: 'Gálatas', Ephesians: 'Efesios', Philippians: 'Filipenses',
  Colossians: 'Colosenses', '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses', '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo', Titus: 'Tito', Philemon: 'Filemón',
  Hebrews: 'Hebreos', James: 'Santiago', '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro', '1 John': '1 Juan', '2 John': '2 Juan',
  '3 John': '3 Juan', Jude: 'Judas', Revelation: 'Apocalipsis',
};

function translateBibleReference(reference: string): string {
  const sortedEntries = Object.entries(BIBLE_BOOK_TRANSLATIONS).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [english, spanish] of sortedEntries) {
    if (reference.includes(english)) {
      return reference.replace(english, spanish);
    }
  }
  return reference;
}

// ─── Verse sizing ────────────────────────────────────────────────────────────
// Estimate rendered line count for text at a given font size inside a container.
// avg char width ≈ 0.52 × fontSize for typical Latin italic text.
function estimateLineCount(text: string, fontSize: number, containerWidth: number): number {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.floor(containerWidth / avgCharWidth);
  if (charsPerLine <= 0) return text.length;
  let lines = 0;
  for (const para of text.split('\n')) {
    lines += Math.max(1, Math.ceil(para.length / charsPerLine));
  }
  return lines;
}

/**
 * Compute the verse font size so the full verse always fits.
 * Rules:
 *  - Start at baseFontSize (canonical 50px scaled)
 *  - If verse > 180 chars: apply an immediate -8% reduction
 *  - Then step down by 3px at a time until the estimated line count ≤ maxLines
 *  - Hard floor: minFontSize
 * Returns { fontSize, extraPaddingV } — extraPaddingV adds vertical room if still
 * needed after font reduction.
 */
function computeVerseFontSize(
  verse: string,
  baseFontSize: number,
  containerWidth: number,
  lineHeight: number,
  maxLines: number,
  minFontSize: number
): { fontSize: number; extraPaddingV: number } {
  // Apply immediate reduction for long verses (> 180 chars)
  let fontSize = verse.length > 180
    ? Math.round(baseFontSize * 0.92)
    : baseFontSize;

  // Step down until it fits or we hit the floor
  while (fontSize > minFontSize) {
    const lines = estimateLineCount(verse, fontSize, containerWidth);
    if (lines <= maxLines) break;
    fontSize -= 3;
  }

  // If after hitting the floor the verse still overflows, compute extra padding
  // needed (we allow the block to grow rather than cut the text).
  const lines = estimateLineCount(verse, fontSize, containerWidth);
  const extraLines = Math.max(0, lines - maxLines);
  const extraPaddingV = extraLines > 0 ? Math.round(extraLines * lineHeight) : 0;

  return { fontSize: Math.max(minFontSize, fontSize), extraPaddingV };
}

// ─── Inspirational reflection selector ───────────────────────────────────────
// Score a sentence based on spiritual/inspirational keyword density.
const SPIRITUAL_KEYWORDS_ES = [
  'dios', 'señor', 'esperanza', 'paz', 'consuelo', 'fe', 'amor',
  'confianza', 'promesa', 'descanso', 'misericordia', 'gracia',
  'fuerza', 'fortaleza', 'salvación', 'luz', 'vida', 'cielo',
  'corazón', 'eterno', 'bendición', 'perdón', 'gozo', 'alegría',
  'protección', 'guía', 'camino', 'verdad', 'fiel', 'poder',
];
const SPIRITUAL_KEYWORDS_EN = [
  'god', 'lord', 'hope', 'peace', 'comfort', 'faith', 'love',
  'trust', 'promise', 'rest', 'mercy', 'grace', 'strength',
  'salvation', 'light', 'life', 'heaven', 'heart', 'eternal',
  'blessing', 'forgiveness', 'joy', 'protection', 'guide',
  'truth', 'faithful', 'power', 'holy', 'spirit',
];

function scoreSentence(sentence: string, language: 'en' | 'es'): number {
  const lower = sentence.toLowerCase();
  const keywords = language === 'es' ? SPIRITUAL_KEYWORDS_ES : SPIRITUAL_KEYWORDS_EN;
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

/**
 * Select the most inspirational sentence from a reflection text.
 * Splits by sentence boundary, scores each, picks highest.
 * Tie-break: shortest sentence. Fallback: first sentence.
 * Max output length: 160 chars, truncated at clean sentence boundary.
 */
function selectInspirationSentence(reflection: string, language: 'en' | 'es'): string {
  const MAX_CHARS = 160;
  const sentences = reflection
    .split(/(?<=[.!?¿¡])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // skip very short fragments

  if (sentences.length === 0) return reflection.slice(0, MAX_CHARS);

  // Score all sentences
  const scored = sentences.map(s => ({ s, score: scoreSentence(s, language) }));
  const maxScore = Math.max(...scored.map(x => x.score));

  // Among tied top scorers pick the shortest
  const topSentences = scored.filter(x => x.score === maxScore);
  const best = topSentences.sort((a, b) => a.s.length - b.s.length)[0]?.s ?? sentences[0];

  // If over max length, trim to last complete sentence under the limit
  if (best.length <= MAX_CHARS) return best;

  // Fallback: try first sentence that fits under limit
  const firstFit = sentences.find(s => s.length <= MAX_CHARS);
  return firstFit ?? best.slice(0, MAX_CHARS - 1).replace(/\s+\S*$/, '') + '.';
}

/**
 * Build a closed paragraph for the reflection display.
 * Adds sentences one by one up to maxLines, never appends ellipsis.
 */
function buildClosedParagraph(
  reflection: string,
  fontSize: number,
  containerWidth: number,
  maxLines: number
): string {
  const sentences = reflection.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  let result = '';
  for (const sentence of sentences) {
    const candidate = result ? result + ' ' + sentence : sentence;
    const lines = estimateLineCount(candidate, fontSize, containerWidth);
    if (lines > maxLines) break;
    result = candidate;
  }
  if (!result && sentences.length > 0) result = sentences[0];
  return result || reflection;
}

// ─── Date formatting ──────────────────────────────────────────────────────────
function formatDevotionalDate(dateStr: string, language: 'en' | 'es'): string {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day);
  return date.toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
interface DevotionalShareCardProps {
  devotional: Devotional;
  language: 'en' | 'es';
  /** Display size — PREVIEW_WIDTH for preview, CARD_WIDTH for capture. Default: PREVIEW_WIDTH */
  displayWidth?: number;
  branding?: AppBranding;
  /**
   * When true, shows the devotional date on the card.
   * Pass true only for today's devotional (home screen).
   * Pass false / omit for library shares.
   */
  showDate?: boolean;
}

export const DevotionalShareCard = forwardRef<View, DevotionalShareCardProps>(
  ({ devotional, language, displayWidth = PREVIEW_WIDTH, branding: brandingProp, showDate = false }, ref) => {
    const liveBranding = useBranding();
    const branding = brandingProp ?? liveBranding;

    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const bibleRef =
      language === 'es'
        ? devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)
        : devotional.bibleReference;
    const reflectionRaw = language === 'es' ? devotional.reflectionEs : devotional.reflection;

    // All layout values scale proportionally from the canonical CARD_WIDTH
    const scale = displayWidth / CARD_WIDTH;
    const displayHeight = Math.round(CARD_HEIGHT * scale);
    const s = (v: number) => Math.max(1, Math.round(v * scale));

    // ── Verse sizing ─────────────────────────────────────────────────────────
    // Container inner width: displayWidth - paddingH(68)*2 - innerPaddingH(44)*2
    const verseContainerWidth = displayWidth - s(68) * 2 - s(44) * 2;
    const BASE_VERSE_FONT = s(50);
    const VERSE_LINE_HEIGHT = s(66);
    const MAX_VERSE_LINES = 6; // comfortable max before we start extending
    const MIN_VERSE_FONT = s(32);

    const { fontSize: verseFontSize, extraPaddingV } = computeVerseFontSize(
      verse,
      BASE_VERSE_FONT,
      verseContainerWidth,
      VERSE_LINE_HEIGHT,
      MAX_VERSE_LINES,
      MIN_VERSE_FONT
    );

    // Extra vertical padding for long verses so the block never clips
    const versePaddingV = s(30) + extraPaddingV;

    // ── Reflection selection ──────────────────────────────────────────────────
    // 1. Pick the most inspirational sentence
    const inspirationalSentence = selectInspirationSentence(reflectionRaw, language);
    // 2. Trim to closed paragraph (~2 lines, max 160 chars already guaranteed)
    const reflectionFontSize = s(32);
    const reflectionContainerWidth = displayWidth - s(68) * 2 - s(8) * 2;
    const MAX_REFLECTION_LINES = 3;
    const thought = buildClosedParagraph(
      inspirationalSentence,
      reflectionFontSize,
      reflectionContainerWidth,
      MAX_REFLECTION_LINES
    );

    // ── Date label ────────────────────────────────────────────────────────────
    const dateLabel = showDate && devotional.date
      ? formatDevotionalDate(devotional.date, language)
      : null;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: displayWidth,
          height: displayHeight,
          backgroundColor: '#0a0a0a',
          overflow: 'hidden',
          borderRadius: s(28),
        }}
      >
        {/* Background image */}
        <Image
          source={{ uri: devotional.imageUrl }}
          style={{ position: 'absolute', width: displayWidth, height: displayHeight }}
          contentFit="cover"
        />

        {/* Gradient overlay — deeper at bottom for legibility */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.05)',
            'rgba(0,0,0,0.20)',
            'rgba(0,0,0,0.65)',
            'rgba(0,0,0,0.93)',
          ]}
          locations={[0, 0.28, 0.58, 1]}
          style={{ position: 'absolute', width: displayWidth, height: displayHeight }}
        />

        {/* Date — top right, only for today's devotional */}
        {dateLabel && (
          <View
            style={{
              position: 'absolute',
              top: s(36),
              right: s(48),
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: s(99),
              paddingHorizontal: s(24),
              paddingVertical: s(10),
              borderWidth: s(1),
              borderColor: 'rgba(255,255,255,0.22)',
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.80)',
                fontSize: s(22),
                fontWeight: '500',
                letterSpacing: 0.5,
                textTransform: 'capitalize',
              }}
            >
              {dateLabel}
            </Text>
          </View>
        )}

        {/* Content container — pinned to bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: s(68),
            paddingBottom: s(60),
          }}
        >
          {/* Verse block */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderRadius: s(18),
              borderLeftWidth: s(5),
              borderLeftColor: 'rgba(255,255,255,0.80)',
              paddingHorizontal: s(44),
              paddingVertical: versePaddingV,
              marginBottom: s(20),
            }}
          >
            {/* Verse text — no numberOfLines, no ellipsis, font adapts to length */}
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: verseFontSize,
                fontStyle: 'italic',
                lineHeight: Math.round(verseFontSize * 1.32),
                fontWeight: '400',
                marginBottom: s(16),
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: s(2) },
                textShadowRadius: s(8),
              }}
            >
              "{verse}"
            </Text>

            {/* Reference — 1 line */}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: s(34),
                fontWeight: '600',
                lineHeight: s(42),
              }}
            >
              — {bibleRef}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              height: s(1),
              backgroundColor: 'rgba(255,255,255,0.12)',
              marginHorizontal: s(8),
              marginBottom: s(20),
            }}
          />

          {/* Reflection block — best inspirational sentence, pre-trimmed, no ellipsis */}
          <View
            style={{
              paddingHorizontal: s(8),
              marginBottom: s(28),
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.50)',
                fontSize: s(22),
                fontWeight: '700',
                lineHeight: s(28),
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: s(12),
              }}
            >
              {language === 'es' ? 'Reflexión' : 'Reflection'}
            </Text>
            {/* No numberOfLines — closed paragraph is pre-trimmed to exact fit */}
            <Text
              style={{
                color: 'rgba(255,255,255,0.90)',
                fontSize: reflectionFontSize,
                fontWeight: '400',
                lineHeight: s(46),
              }}
            >
              {thought}
            </Text>
          </View>

          {/* Footer rule + branding */}
          <View
            style={{
              height: s(1),
              backgroundColor: 'rgba(255,255,255,0.10)',
              marginHorizontal: s(8),
              marginBottom: s(18),
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(14) }}>
              <LuzDiariaIconWhite size={s(52)} />
              <Text
                numberOfLines={1}
                style={{
                  color: 'rgba(255,255,255,0.80)',
                  fontSize: s(26),
                  fontWeight: '700',
                  letterSpacing: 1.5,
                }}
              >
                {branding.appName}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: 'rgba(255,255,255,0.40)',
                fontSize: s(22),
                fontStyle: 'italic',
              }}
            >
              {language === 'es' ? branding.taglineEs : branding.taglineEn}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

DevotionalShareCard.displayName = 'DevotionalShareCard';
