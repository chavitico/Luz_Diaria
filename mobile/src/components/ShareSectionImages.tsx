// Share Section Images Component
// Generates 5 separate images for each devotional section

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { BookOpen, Star, Heart, Check, Sparkles } from 'lucide-react-native';
import type { Devotional } from '@/lib/types';
import { useBranding } from '@/lib/branding-service';

// Section image dimensions (portrait format for stories)
export const SECTION_IMAGE_SIZE = { width: 1080, height: 1350 };
export const SECTION_PREVIEW_SIZE = { width: 160, height: 200 };

// Bible book translations
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

interface ShareSectionImagesProps {
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
  previewMode?: boolean;
}

export interface ShareSectionImagesRef {
  captureAll: () => Promise<string[]>;
}

interface SectionCardProps {
  imageUrl: string;
  title: string;
  sectionTitle: string;
  content: string;
  icon: React.ReactNode;
  pageNumber: number;
  totalPages: number;
  language: 'en' | 'es';
  size: { width: number; height: number };
  accentColor?: string;
  appName: string;
}

function SectionCard({
  imageUrl,
  title,
  sectionTitle,
  content,
  icon,
  pageNumber,
  totalPages,
  size,
  accentColor = '#FFD700',
  appName,
}: SectionCardProps) {
  const scale = size.width / SECTION_IMAGE_SIZE.width;
  const fontSize = (base: number) => Math.round(base * scale);
  const spacing = (base: number) => Math.round(base * scale);

  return (
    <View
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
      collapsable={false}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUrl }}
        style={{
          position: 'absolute',
          width: size.width,
          height: size.height,
        }}
        contentFit="cover"
      />

      {/* Dark Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.4, 1]}
        style={{
          position: 'absolute',
          width: size.width,
          height: size.height,
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
          padding: spacing(60),
          justifyContent: 'space-between',
        }}
      >
        {/* Top: Page indicator + Title */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing(24),
            }}
          >
            <View
              style={{
                backgroundColor: accentColor,
                paddingHorizontal: spacing(20),
                paddingVertical: spacing(8),
                borderRadius: spacing(20),
              }}
            >
              <Text
                style={{
                  color: '#000',
                  fontSize: fontSize(24),
                  fontWeight: '700',
                }}
              >
                {pageNumber}/{totalPages}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: fontSize(48),
              fontWeight: '800',
              lineHeight: fontSize(58),
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        {/* Middle: Section content — flex:1, text scales to fill */}
        <View style={{ flex: 1, justifyContent: 'center', marginVertical: spacing(24) }}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: spacing(28),
              padding: spacing(40),
              borderLeftWidth: spacing(6),
              borderLeftColor: accentColor,
            }}
          >
            {/* Section header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing(24),
              }}
            >
              <View
                style={{
                  width: spacing(48),
                  height: spacing(48),
                  borderRadius: spacing(24),
                  backgroundColor: accentColor + '30',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing(16),
                }}
              >
                {icon}
              </View>
              <Text
                style={{
                  color: accentColor,
                  fontSize: fontSize(32),
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {sectionTitle}
              </Text>
            </View>

            {/* Content — no truncation, scales to fit */}
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize(36),
                lineHeight: fontSize(52),
                fontWeight: '400',
                flex: 1,
              }}
              adjustsFontSizeToFit
              minimumFontScale={0.45}
            >
              {content}
            </Text>
          </View>
        </View>

        {/* Bottom: Branding — small, centered */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: fontSize(26),
              fontWeight: '700',
              letterSpacing: 2,
            }}
          >
            {appName}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Cover card (first image)
interface CoverCardProps {
  imageUrl: string;
  title: string;
  date: string;
  language: 'en' | 'es';
  size: { width: number; height: number };
  appName: string;
  tagline: string;
}

function CoverCard({ imageUrl, title, date, language, size, appName, tagline }: CoverCardProps) {
  const scale = size.width / SECTION_IMAGE_SIZE.width;
  const fontSize = (base: number) => Math.round(base * scale);
  const spacing = (base: number) => Math.round(base * scale);

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr + 'T12:00:00');
    return dateObj.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
      collapsable={false}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUrl }}
        style={{
          position: 'absolute',
          width: size.width,
          height: size.height,
        }}
        contentFit="cover"
      />

      {/* Dark Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.5, 1]}
        style={{
          position: 'absolute',
          width: size.width,
          height: size.height,
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
          padding: spacing(60),
          justifyContent: 'space-between',
        }}
      >
        {/* Top: Badge */}
        <View style={{ alignItems: 'flex-start' }}>
          <View
            style={{
              backgroundColor: '#FFD700',
              paddingHorizontal: spacing(24),
              paddingVertical: spacing(12),
              borderRadius: spacing(24),
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Sparkles size={fontSize(28)} color="#000" />
            <Text
              style={{
                color: '#000',
                fontSize: fontSize(28),
                fontWeight: '700',
                marginLeft: spacing(10),
              }}
            >
              {language === 'es' ? 'DEVOCIONAL' : 'DEVOTIONAL'}
            </Text>
          </View>
        </View>

        {/* Center: Title */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: fontSize(32),
              fontWeight: '500',
              marginBottom: spacing(20),
              textAlign: 'center',
            }}
          >
            {formatDate(date)}
          </Text>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: fontSize(72),
              fontWeight: '800',
              lineHeight: fontSize(88),
              textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 3 },
              textShadowRadius: 12,
            }}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            numberOfLines={4}
          >
            {title}
          </Text>
        </View>

        {/* Bottom: Branding */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: fontSize(40),
              fontWeight: '800',
              letterSpacing: 3,
            }}
          >
            {appName}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: fontSize(26),
              marginTop: spacing(10),
            }}
          >
            {tagline}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Verse card (second image)
interface VerseCardProps {
  imageUrl: string;
  title: string;
  verse: string;
  reference: string;
  language: 'en' | 'es';
  size: { width: number; height: number };
  appName: string;
}

function VerseCard({ imageUrl, title, verse, reference, language, size, appName }: VerseCardProps) {
  const scale = size.width / SECTION_IMAGE_SIZE.width;
  const fontSize = (base: number) => Math.round(base * scale);
  const spacing = (base: number) => Math.round(base * scale);

  return (
    <View
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
      collapsable={false}
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUrl }}
        style={{
          position: 'absolute',
          width: size.width,
          height: size.height,
        }}
        contentFit="cover"
      />

      {/* Dark Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.4, 1]}
        style={{
          position: 'absolute',
          width: size.width,
          height: size.height,
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
          padding: spacing(60),
          justifyContent: 'space-between',
        }}
      >
        {/* Top: Page indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: '#FFD700',
              paddingHorizontal: spacing(20),
              paddingVertical: spacing(8),
              borderRadius: spacing(20),
            }}
          >
            <Text style={{ color: '#000', fontSize: fontSize(24), fontWeight: '700' }}>
              2/5
            </Text>
          </View>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: fontSize(28),
              fontWeight: '600',
              marginLeft: spacing(16),
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {language === 'es' ? 'Versículo' : 'Verse'}
          </Text>
        </View>

        {/* Center: Verse — flex:1 so text scales to fill */}
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: spacing(28),
            padding: spacing(48),
            borderLeftWidth: spacing(6),
            borderLeftColor: '#FFD700',
            marginVertical: spacing(32),
            justifyContent: 'center',
          }}
        >
          <BookOpen size={fontSize(48)} color="#FFD700" style={{ marginBottom: spacing(24) }} />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: fontSize(44),
              fontStyle: 'italic',
              lineHeight: fontSize(64),
              marginBottom: spacing(32),
              flex: 1,
            }}
            adjustsFontSizeToFit
            minimumFontScale={0.45}
          >
            "{verse}"
          </Text>
          <Text
            style={{
              color: '#FFD700',
              fontSize: fontSize(36),
              fontWeight: '700',
            }}
          >
            — {reference}
          </Text>
        </View>

        {/* Bottom: Branding */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: fontSize(26),
              fontWeight: '700',
              letterSpacing: 2,
            }}
          >
            {appName}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const ShareSectionImages = forwardRef<ShareSectionImagesRef, ShareSectionImagesProps>(
  ({ devotional, language, colors, translations, previewMode = false }, ref) => {
    const branding = useBranding();
    const appName = branding.appName;
    const coverRef = useRef<View>(null);
    const verseRef = useRef<View>(null);
    const reflectionRef = useRef<View>(null);
    const storyRef = useRef<View>(null);
    const applicationRef = useRef<View>(null);

    const title = language === 'es' ? devotional.titleEs : devotional.title;
    const verse = language === 'es' ? devotional.bibleVerseEs : devotional.bibleVerse;
    const reflection = language === 'es' ? devotional.reflectionEs : devotional.reflection;
    const story = language === 'es' ? devotional.storyEs : devotional.story;
    const application = language === 'es' ? devotional.applicationEs : devotional.application;
    const prayer = language === 'es' ? devotional.prayerEs : devotional.prayer;
    const bibleRef = language === 'es'
      ? devotional.bibleReferenceEs || translateBibleReference(devotional.bibleReference)
      : devotional.bibleReference;

    const displaySize = previewMode ? SECTION_PREVIEW_SIZE : SECTION_IMAGE_SIZE;

    useImperativeHandle(ref, () => ({
      captureAll: async () => {
        const refs = [coverRef, verseRef, reflectionRef, storyRef, applicationRef];
        const uris: string[] = [];

        for (const cardRef of refs) {
          if (cardRef.current) {
            const uri = await captureRef(cardRef, {
              format: 'png',
              quality: 1,
              result: 'tmpfile',
              width: SECTION_IMAGE_SIZE.width,
              height: SECTION_IMAGE_SIZE.height,
            });
            uris.push(uri);
          }
        }

        return uris;
      },
    }));

    // Combine application and prayer for the last card — no truncation
    const applicationAndPrayer = `${application ?? ''}\n\n${language === 'es' ? 'Oración' : 'Prayer'}: ${prayer ?? ''}`;

    if (previewMode) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          <View style={{ marginRight: 8 }}>
            <ViewShot ref={coverRef as any}>
              <CoverCard
                imageUrl={devotional.imageUrl}
                title={title}
                date={devotional.date}
                language={language}
                size={displaySize}
                appName={appName}
                tagline={language === 'es' ? branding.taglineEs : branding.taglineEn}
              />
            </ViewShot>
          </View>

          <View style={{ marginRight: 8 }}>
            <ViewShot ref={verseRef as any}>
              <VerseCard
                imageUrl={devotional.imageUrl}
                title={title}
                verse={verse}
                reference={bibleRef}
                language={language}
                size={displaySize}
                appName={appName}
              />
            </ViewShot>
          </View>

          <View style={{ marginRight: 8 }}>
            <ViewShot ref={reflectionRef as any}>
              <SectionCard
                imageUrl={devotional.imageUrl}
                title={title}
                sectionTitle={translations.reflection}
                content={reflection ?? ''}
                icon={<Star size={displaySize.width * 0.12} color="#FFD700" />}
                pageNumber={3}
                totalPages={5}
                language={language}
                size={displaySize}
                accentColor="#FFD700"
                appName={appName}
              />
            </ViewShot>
          </View>

          <View style={{ marginRight: 8 }}>
            <ViewShot ref={storyRef as any}>
              <SectionCard
                imageUrl={devotional.imageUrl}
                title={title}
                sectionTitle={translations.story}
                content={story ?? ''}
                icon={<BookOpen size={displaySize.width * 0.12} color="#4ECDC4" />}
                pageNumber={4}
                totalPages={5}
                language={language}
                size={displaySize}
                accentColor="#4ECDC4"
                appName={appName}
              />
            </ViewShot>
          </View>

          <View>
            <ViewShot ref={applicationRef as any}>
              <SectionCard
                imageUrl={devotional.imageUrl}
                title={title}
                sectionTitle={language === 'es' ? 'Aplicación y Oración' : 'Application & Prayer'}
                content={applicationAndPrayer}
                icon={<Heart size={displaySize.width * 0.12} color="#FF6B6B" />}
                pageNumber={5}
                totalPages={5}
                language={language}
                size={displaySize}
                accentColor="#FF6B6B"
                appName={appName}
              />
            </ViewShot>
          </View>
        </ScrollView>
      );
    }

    // Full-size offscreen render for capture
    return (
      <View style={{ position: 'absolute', opacity: 0, left: -9999 }}>
        <ViewShot ref={coverRef as any}>
          <CoverCard
            imageUrl={devotional.imageUrl}
            title={title}
            date={devotional.date}
            language={language}
            size={SECTION_IMAGE_SIZE}
            appName={appName}
            tagline={language === 'es' ? branding.taglineEs : branding.taglineEn}
          />
        </ViewShot>

        <ViewShot ref={verseRef as any}>
          <VerseCard
            imageUrl={devotional.imageUrl}
            title={title}
            verse={verse}
            reference={bibleRef}
            language={language}
            size={SECTION_IMAGE_SIZE}
            appName={appName}
          />
        </ViewShot>

        <ViewShot ref={reflectionRef as any}>
          <SectionCard
            imageUrl={devotional.imageUrl}
            title={title}
            sectionTitle={translations.reflection}
            content={reflection ?? ''}
            icon={<Star size={48} color="#FFD700" />}
            pageNumber={3}
            totalPages={5}
            language={language}
            size={SECTION_IMAGE_SIZE}
            accentColor="#FFD700"
            appName={appName}
          />
        </ViewShot>

        <ViewShot ref={storyRef as any}>
          <SectionCard
            imageUrl={devotional.imageUrl}
            title={title}
            sectionTitle={translations.story}
            content={story ?? ''}
            icon={<BookOpen size={48} color="#4ECDC4" />}
            pageNumber={4}
            totalPages={5}
            language={language}
            size={SECTION_IMAGE_SIZE}
            accentColor="#4ECDC4"
            appName={appName}
          />
        </ViewShot>

        <ViewShot ref={applicationRef as any}>
          <SectionCard
            imageUrl={devotional.imageUrl}
            title={title}
            sectionTitle={language === 'es' ? 'Aplicación y Oración' : 'Application & Prayer'}
            content={applicationAndPrayer}
            icon={<Heart size={48} color="#FF6B6B" />}
            pageNumber={5}
            totalPages={5}
            language={language}
            size={SECTION_IMAGE_SIZE}
            accentColor="#FF6B6B"
            appName={appName}
          />
        </ViewShot>
      </View>
    );
  }
);

ShareSectionImages.displayName = 'ShareSectionImages';
