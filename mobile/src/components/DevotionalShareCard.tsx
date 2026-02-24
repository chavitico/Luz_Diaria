// DevotionalShareCard — single, fixed-dimension share card
// 1080×1350 (4:5 portrait) — optimal for WhatsApp, Instagram, iMessage
// Rules:
//   - Fixed width + height, never auto-sizes
//   - All text blocks have explicit numberOfLines + lineHeight
//   - No adjustsFontSizeToFit (causes unpredictable layout)
//   - Verse: max 4 lines, ellipsizeMode tail (verse is always short)
//   - Thought: NO numberOfLines — text is pre-trimmed to fit exactly, no ellipsis ever
//   - Reference: 1 line
//   - Branding: footer, integrated close to reflection

import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
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

/**
 * Estimate rendered line count for a text at a given font size inside a container width.
 * Uses average character width ≈ 0.55 × fontSize for typical Latin text.
 * Returns estimated number of lines.
 */
function estimateLineCount(text: string, fontSize: number, containerWidth: number): number {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.floor(containerWidth / avgCharWidth);
  if (charsPerLine <= 0) return text.length;
  let lines = 0;
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    lines += Math.max(1, Math.ceil(para.length / charsPerLine));
  }
  return lines;
}

/**
 * Build a closed reflection paragraph that fits within maxLines rendered lines.
 * Adds sentences one by one. Stops before a sentence that would overflow.
 * NEVER appends "…" — the last included sentence always ends the paragraph cleanly.
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
  // If not even one sentence fits, take the first sentence regardless (short verse refs, etc.)
  if (!result && sentences.length > 0) {
    result = sentences[0];
  }
  return result || reflection;
}

interface DevotionalShareCardProps {
  devotional: Devotional;
  language: 'en' | 'es';
  /** Display size — PREVIEW_WIDTH for preview, CARD_WIDTH for capture. Default: PREVIEW_WIDTH */
  displayWidth?: number;
  branding?: AppBranding;
}

export const DevotionalShareCard = forwardRef<View, DevotionalShareCardProps>(
  ({ devotional, language, displayWidth = PREVIEW_WIDTH, branding: brandingProp }, ref) => {
    const liveBranding = useBranding();
    const branding = brandingProp ?? liveBranding;

    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const bibleRef =
      language === 'es'
        ? devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)
        : devotional.bibleReference;
    const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;

    // All layout values scale proportionally from the canonical CARD_WIDTH
    const scale = displayWidth / CARD_WIDTH;
    const displayHeight = Math.round(CARD_HEIGHT * scale);
    const s = (v: number) => Math.max(1, Math.round(v * scale));

    // Reflection text metrics (canonical scale)
    const reflectionFontSize = s(32);
    // Inner text width: displayWidth - 2×paddingHorizontal(68) - 2×innerPaddingH(8)
    const reflectionContainerWidth = displayWidth - s(68) * 2 - s(8) * 2;
    const MAX_REFLECTION_LINES = 5;

    // Pre-trim to closed paragraph — zero ellipsis, zero overflow
    const thought = buildClosedParagraph(
      reflection,
      reflectionFontSize,
      reflectionContainerWidth,
      MAX_REFLECTION_LINES
    );

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

        {/* Gradient overlay */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.05)',
            'rgba(0,0,0,0.25)',
            'rgba(0,0,0,0.68)',
            'rgba(0,0,0,0.92)',
          ]}
          locations={[0, 0.30, 0.60, 1]}
          style={{ position: 'absolute', width: displayWidth, height: displayHeight }}
        />

        {/* Content container */}
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
          {/* Verse block — anchor visual */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderRadius: s(18),
              borderLeftWidth: s(5),
              borderLeftColor: 'rgba(255,255,255,0.80)',
              paddingHorizontal: s(44),
              paddingVertical: s(30),
              marginBottom: s(20),
            }}
          >
            {/* Verse text — 4 lines max (verses are always short) */}
            <Text
              numberOfLines={4}
              ellipsizeMode="tail"
              style={{
                color: '#FFFFFF',
                fontSize: s(50),
                fontStyle: 'italic',
                lineHeight: s(66),
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

          {/* Reflection block — NO numberOfLines, text is pre-trimmed to never overflow */}
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
            {/* No numberOfLines — the closed paragraph is already the right length */}
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
