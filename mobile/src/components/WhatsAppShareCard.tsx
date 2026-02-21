// WhatsApp Share Card Component
// Optimized 1080x1080 square card for WhatsApp sharing

import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen } from 'lucide-react-native';
import type { Devotional } from '@/lib/types';
import { APP_BRANDING } from '@/lib/constants';

// WhatsApp optimized square dimensions
export const WHATSAPP_CARD_SIZE = 1080;
// Preview size for display (will be captured at full size)
export const PREVIEW_SIZE = 340;

// Bible book translations for Spanish
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  Genesis: 'Génesis',
  Exodus: 'Éxodo',
  Leviticus: 'Levítico',
  Numbers: 'Números',
  Deuteronomy: 'Deuteronomio',
  Joshua: 'Josué',
  Judges: 'Jueces',
  Ruth: 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas',
  '2 Chronicles': '2 Crónicas',
  Ezra: 'Esdras',
  Nehemiah: 'Nehemías',
  Esther: 'Ester',
  Job: 'Job',
  Psalm: 'Salmo',
  Psalms: 'Salmos',
  Proverbs: 'Proverbios',
  Ecclesiastes: 'Eclesiastés',
  'Song of Solomon': 'Cantares',
  'Song of Songs': 'Cantares',
  Isaiah: 'Isaías',
  Jeremiah: 'Jeremías',
  Lamentations: 'Lamentaciones',
  Ezekiel: 'Ezequiel',
  Daniel: 'Daniel',
  Hosea: 'Oseas',
  Joel: 'Joel',
  Amos: 'Amós',
  Obadiah: 'Abdías',
  Jonah: 'Jonás',
  Micah: 'Miqueas',
  Nahum: 'Nahúm',
  Habakkuk: 'Habacuc',
  Zephaniah: 'Sofonías',
  Haggai: 'Hageo',
  Zechariah: 'Zacarías',
  Malachi: 'Malaquías',
  Matthew: 'Mateo',
  Mark: 'Marcos',
  Luke: 'Lucas',
  John: 'Juan',
  Acts: 'Hechos',
  Romans: 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  Galatians: 'Gálatas',
  Ephesians: 'Efesios',
  Philippians: 'Filipenses',
  Colossians: 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  Titus: 'Tito',
  Philemon: 'Filemón',
  Hebrews: 'Hebreos',
  James: 'Santiago',
  '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro',
  '1 John': '1 Juan',
  '2 John': '2 Juan',
  '3 John': '3 Juan',
  Jude: 'Judas',
  Revelation: 'Apocalipsis',
};

function translateBibleReference(reference: string): string {
  let result = reference;
  const sortedEntries = Object.entries(BIBLE_BOOK_TRANSLATIONS).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [english, spanish] of sortedEntries) {
    if (result.includes(english)) {
      result = result.replace(english, spanish);
      break;
    }
  }
  return result;
}

// Extract a short "idea of the day" — first sentence only, no truncation
function extractIdeaOfDay(reflection: string): string {
  const firstSentence = reflection.split(/[.!?]/)[0]?.trim() ?? '';
  return firstSentence + (firstSentence.endsWith('.') ? '' : '.');
}

interface WhatsAppShareCardProps {
  devotional: Devotional;
  language: 'en' | 'es';
  size?: number; // Display size (default PREVIEW_SIZE)
}

export const WhatsAppShareCard = forwardRef<View, WhatsAppShareCardProps>(
  ({ devotional, language, size = PREVIEW_SIZE }, ref) => {
    const title = language === 'es' ? devotional.titleEs : devotional.title;
    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const bibleRef =
      language === 'es'
        ? devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)
        : devotional.bibleReference;
    const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
    const ideaOfDay = extractIdeaOfDay(reflection);

    // Scale factor for fonts based on display size
    const scale = size / WHATSAPP_CARD_SIZE;
    const fontSize = (base: number) => Math.round(base * scale);
    const spacing = (base: number) => Math.round(base * scale);

    return (
      <View
        ref={ref}
        style={{
          width: size,
          height: size,
          borderRadius: spacing(24),
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
        collapsable={false}
      >
        {/* Background Image */}
        <Image
          source={{ uri: devotional.imageUrl }}
          style={{
            position: 'absolute',
            width: size,
            height: size,
          }}
          contentFit="cover"
        />

        {/* Dark Gradient Overlay for readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.3, 1]}
          style={{
            position: 'absolute',
            width: size,
            height: size,
          }}
        />

        {/* Content */}
        <View
          style={{
            flex: 1,
            padding: spacing(80),
            justifyContent: 'space-between',
          }}
        >
          {/* Top: Title — scales to fit, no clipping */}
          <View style={{ flex: 0 }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize(72),
                fontWeight: '800',
                lineHeight: fontSize(84),
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              numberOfLines={3}
            >
              {title}
            </Text>
          </View>

          {/* Middle: Bible Verse — flex:1 so text scales to fill */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: spacing(24),
              padding: spacing(48),
              borderLeftWidth: spacing(6),
              borderLeftColor: 'rgba(255,255,255,0.8)',
              marginVertical: spacing(32),
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize(44),
                fontStyle: 'italic',
                lineHeight: fontSize(60),
                marginBottom: spacing(24),
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
                flex: 1,
              }}
              adjustsFontSizeToFit
              minimumFontScale={0.45}
            >
              "{verse}"
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookOpen size={fontSize(32)} color="rgba(255,255,255,0.9)" />
              <Text
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: fontSize(36),
                  fontWeight: '600',
                  marginLeft: spacing(12),
                }}
              >
                {bibleRef}
              </Text>
            </View>
          </View>

          {/* Bottom: Idea of the Day + Branding */}
          <View style={{ flex: 0 }}>
            {/* Idea of the Day */}
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: spacing(16),
                paddingHorizontal: spacing(32),
                paddingVertical: spacing(24),
                marginBottom: spacing(32),
              }}
            >
              <Text
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: fontSize(28),
                  fontWeight: '600',
                  marginBottom: spacing(8),
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {language === 'es' ? 'Idea del dia' : 'Thought of the day'}
              </Text>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: fontSize(36),
                  lineHeight: fontSize(48),
                  fontWeight: '500',
                }}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                numberOfLines={3}
              >
                {ideaOfDay}
              </Text>
            </View>

            {/* Branding — small, centered */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: fontSize(28),
                  fontWeight: '700',
                  letterSpacing: 2,
                }}
              >
                {APP_BRANDING.appName}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: fontSize(22),
                  marginTop: spacing(6),
                }}
              >
                {APP_BRANDING.tagline[language]}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

WhatsAppShareCard.displayName = 'WhatsAppShareCard';

// Generate plain text message for WhatsApp
export function generateWhatsAppText(
  devotional: Devotional,
  language: 'en' | 'es'
): string {
  const title = language === 'es' ? devotional.titleEs : devotional.title;
  const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
  const bibleRef =
    language === 'es'
      ? devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)
      : devotional.bibleReference;
  const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
  const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;

  // First line of prayer
  const shortPrayer = prayer.split(/[.!?]/)[0]?.trim() ?? '';

  const tagline = APP_BRANDING.tagline[language];
  const appName = APP_BRANDING.appName;

  return `*${title}*

${bibleRef}
"${verse}"

${reflection}

${shortPrayer}.

_${appName} - ${tagline}_`;
}
