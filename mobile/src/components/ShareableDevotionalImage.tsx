// Shareable Devotional Image Component
// Renders a full devotional as a shareable image

import React, { forwardRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Star, Heart, Check } from 'lucide-react-native';
import type { Devotional } from '@/lib/types';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - 40; // Padding on sides

interface ShareableDevotionalImageProps {
  devotional: Devotional;
  language: 'en' | 'es';
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  translations: {
    bible_verse: string;
    reflection: string;
    story: string;
    biblical_character: string;
    application: string;
    prayer: string;
  };
}

// Bible book translations
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  'Genesis': 'Génesis',
  'Exodus': 'Éxodo',
  'Leviticus': 'Levítico',
  'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josué',
  'Judges': 'Jueces',
  'Ruth': 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas',
  '2 Chronicles': '2 Crónicas',
  'Ezra': 'Esdras',
  'Nehemiah': 'Nehemías',
  'Esther': 'Ester',
  'Job': 'Job',
  'Psalm': 'Salmo',
  'Psalms': 'Salmos',
  'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastés',
  'Song of Solomon': 'Cantares',
  'Song of Songs': 'Cantares',
  'Isaiah': 'Isaías',
  'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones',
  'Ezekiel': 'Ezequiel',
  'Daniel': 'Daniel',
  'Hosea': 'Oseas',
  'Joel': 'Joel',
  'Amos': 'Amós',
  'Obadiah': 'Abdías',
  'Jonah': 'Jonás',
  'Micah': 'Miqueas',
  'Nahum': 'Nahúm',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sofonías',
  'Haggai': 'Hageo',
  'Zechariah': 'Zacarías',
  'Malachi': 'Malaquías',
  'Matthew': 'Mateo',
  'Mark': 'Marcos',
  'Luke': 'Lucas',
  'John': 'Juan',
  'Acts': 'Hechos',
  'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  'Galatians': 'Gálatas',
  'Ephesians': 'Efesios',
  'Philippians': 'Filipenses',
  'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  'Titus': 'Tito',
  'Philemon': 'Filemón',
  'Hebrews': 'Hebreos',
  'James': 'Santiago',
  '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro',
  '1 John': '1 Juan',
  '2 John': '2 Juan',
  '3 John': '3 Juan',
  'Jude': 'Judas',
  'Revelation': 'Apocalipsis',
};

function translateBibleReference(reference: string): string {
  let result = reference;
  const sortedEntries = Object.entries(BIBLE_BOOK_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [english, spanish] of sortedEntries) {
    if (result.includes(english)) {
      result = result.replace(english, spanish);
      break;
    }
  }
  return result;
}

interface ContentSectionProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  colors: ShareableDevotionalImageProps['colors'];
}

function ContentSection({ title, content, icon, colors }: ContentSectionProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          {icon}
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.primary,
          }}
        >
          {title}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            lineHeight: 22,
            color: colors.text,
          }}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}

export const ShareableDevotionalImage = forwardRef<View, ShareableDevotionalImageProps>(
  ({ devotional, language, colors, translations }, ref) => {
    const title = language === 'es' ? devotional.titleEs : devotional.title;
    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
    const story = language === 'es' ? devotional.storyEs : devotional.story;
    const character = language === 'es' ? devotional.biblicalCharacterEs : devotional.biblicalCharacter;
    const application = language === 'es' ? devotional.applicationEs : devotional.application;
    const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;
    const bibleRef = language === 'es'
      ? (devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference))
      : devotional.bibleReference;

    const formatDate = (dateStr: string) => {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return (
      <View
        ref={ref}
        style={{
          width: IMAGE_WIDTH,
          backgroundColor: colors.background,
          borderRadius: 20,
          overflow: 'hidden',
        }}
        collapsable={false}
      >
        {/* Hero Image */}
        <View style={{ height: 200, width: '100%' }}>
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Title overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
                fontWeight: '500',
                marginBottom: 6,
              }}
            >
              {formatDate(devotional.date)}
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '700',
              }}
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Bible Verse Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <BookOpen size={18} color={colors.primary} />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: '600',
                  color: colors.primary,
                  fontSize: 14,
                }}
              >
                {translations.bible_verse}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 18,
                fontStyle: 'italic',
                lineHeight: 28,
                color: colors.text,
                marginBottom: 10,
              }}
            >
              "{verse}"
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: colors.textMuted,
              }}
            >
              — {bibleRef}
            </Text>
          </View>

          {/* Sections */}
          <ContentSection
            title={translations.reflection}
            content={reflection}
            icon={<Star size={14} color={colors.primary} />}
            colors={colors}
          />

          <ContentSection
            title={translations.story}
            content={story}
            icon={<BookOpen size={14} color={colors.secondary} />}
            colors={colors}
          />

          <ContentSection
            title={translations.biblical_character}
            content={character}
            icon={<Star size={14} color={colors.accent} />}
            colors={colors}
          />

          <ContentSection
            title={translations.application}
            content={application}
            icon={<Check size={14} color={colors.primary} />}
            colors={colors}
          />

          <ContentSection
            title={translations.prayer}
            content={prayer}
            icon={<Heart size={14} color={colors.secondary} />}
            colors={colors}
          />

          {/* App branding */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 16,
              paddingBottom: 8,
              borderTopWidth: 1,
              borderTopColor: colors.textMuted + '20',
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                fontWeight: '500',
              }}
            >
              Daily Light
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.textMuted + '80',
                marginTop: 2,
              }}
            >
              {language === 'es' ? 'Tu devocional diario' : 'Your daily devotional'}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

ShareableDevotionalImage.displayName = 'ShareableDevotionalImage';
