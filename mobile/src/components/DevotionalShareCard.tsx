// DevotionalShareCard — single, fixed-dimension share card
// 1080×1350 (4:5 portrait) — optimal for WhatsApp, Instagram, iMessage
// Rules:
//   - Fixed width + height, never auto-sizes
//   - All text blocks have explicit numberOfLines + lineHeight
//   - No adjustsFontSizeToFit (causes unpredictable layout)
//   - Verse: max 4 lines, ellipsizeMode tail
//   - Thought: max 3 lines, ellipsizeMode tail
//   - Reference: 1 line
//   - Branding: footer, always visible

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

// Extract first sentence from reflection for the "thought" block
function extractThought(reflection: string): string {
  const firstSentence = reflection.split(/(?<=[.!?])\s/)[0]?.trim() ?? '';
  return firstSentence;
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
    const thought = extractThought(reflection);

    // All layout values scale proportionally from the canonical CARD_WIDTH
    const scale = displayWidth / CARD_WIDTH;
    const displayHeight = Math.round(CARD_HEIGHT * scale);

    const s = (v: number) => Math.max(1, Math.round(v * scale));

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

        {/* Gradient overlay — heavier at bottom for text readability */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.15)',
            'rgba(0,0,0,0.30)',
            'rgba(0,0,0,0.72)',
            'rgba(0,0,0,0.92)',
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={{ position: 'absolute', width: displayWidth, height: displayHeight }}
        />

        {/* Content container — fixed padding, no flex grow tricks */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: s(72),
            paddingBottom: s(72),
          }}
        >
          {/* Verse block — max 4 lines */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderRadius: s(20),
              borderLeftWidth: s(5),
              borderLeftColor: 'rgba(255,255,255,0.75)',
              paddingHorizontal: s(44),
              paddingVertical: s(40),
              marginBottom: s(36),
            }}
          >
            {/* Verse text — strictly 4 lines max */}
            <Text
              numberOfLines={4}
              ellipsizeMode="tail"
              style={{
                color: '#FFFFFF',
                fontSize: s(48),
                fontStyle: 'italic',
                lineHeight: s(64),
                fontWeight: '400',
                marginBottom: s(20),
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: s(2) },
                textShadowRadius: s(6),
              }}
            >
              "{verse}"
            </Text>

            {/* Reference — always 1 line */}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: s(36),
                fontWeight: '600',
                lineHeight: s(44),
              }}
            >
              — {bibleRef}
            </Text>
          </View>

          {/* Thought block — max 3 lines */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: s(16),
              paddingHorizontal: s(36),
              paddingVertical: s(28),
              marginBottom: s(40),
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: s(26),
                fontWeight: '700',
                lineHeight: s(32),
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: s(10),
              }}
            >
              {language === 'es' ? 'Reflexión' : 'Reflection'}
            </Text>
            <Text
              numberOfLines={3}
              ellipsizeMode="tail"
              style={{
                color: 'rgba(255,255,255,0.92)',
                fontSize: s(36),
                fontWeight: '400',
                lineHeight: s(50),
              }}
            >
              {thought}
            </Text>
          </View>

          {/* Branding footer — fixed, always visible */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              numberOfLines={1}
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: s(28),
                fontWeight: '700',
                letterSpacing: 1.5,
              }}
            >
              {branding.appName}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: s(24),
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
