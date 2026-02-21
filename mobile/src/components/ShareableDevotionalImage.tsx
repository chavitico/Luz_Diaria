// Shareable Devotional Image Component — Paginated 1080x1350 pages
// Page 1: cover + verse
// Pages 2+: remaining sections (reflection, story, character, application, prayer)

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Star, Heart, Check, User } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import type { Devotional } from '@/lib/types';

// Fixed page dimensions — WhatsApp-friendly portrait ratio
export const PAGE_WIDTH = 1080;
export const PAGE_HEIGHT = 1350;
export const CAPTURE_SCALE = 1; // Already full resolution

// Bible book translations
const BIBLE_BOOK_TRANSLATIONS: Record<string, string> = {
  Genesis: 'Génesis', Exodus: 'Éxodo', Leviticus: 'Levítico', Numbers: 'Números',
  Deuteronomy: 'Deuteronomio', Joshua: 'Josué', Judges: 'Jueces', Ruth: 'Rut',
  '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel', '1 Kings': '1 Reyes', '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas', '2 Chronicles': '2 Crónicas', Ezra: 'Esdras',
  Nehemiah: 'Nehemías', Esther: 'Ester', Job: 'Job', Psalm: 'Salmo', Psalms: 'Salmos',
  Proverbs: 'Proverbios', Ecclesiastes: 'Eclesiastés', 'Song of Solomon': 'Cantares',
  'Song of Songs': 'Cantares', Isaiah: 'Isaías', Jeremiah: 'Jeremías',
  Lamentations: 'Lamentaciones', Ezekiel: 'Ezequiel', Daniel: 'Daniel', Hosea: 'Oseas',
  Joel: 'Joel', Amos: 'Amós', Obadiah: 'Abdías', Jonah: 'Jonás', Micah: 'Miqueas',
  Nahum: 'Nahúm', Habakkuk: 'Habacuc', Zephaniah: 'Sofonías', Haggai: 'Hageo',
  Zechariah: 'Zacarías', Malachi: 'Malaquías', Matthew: 'Mateo', Mark: 'Marcos',
  Luke: 'Lucas', John: 'Juan', Acts: 'Hechos', Romans: 'Romanos',
  '1 Corinthians': '1 Corintios', '2 Corinthians': '2 Corintios', Galatians: 'Gálatas',
  Ephesians: 'Efesios', Philippians: 'Filipenses', Colossians: 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses', '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo', '2 Timothy': '2 Timoteo', Titus: 'Tito', Philemon: 'Filemón',
  Hebrews: 'Hebreos', James: 'Santiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro',
  '1 John': '1 Juan', '2 John': '2 Juan', '3 John': '3 Juan', Jude: 'Judas',
  Revelation: 'Apocalipsis',
};

function translateBibleReference(reference: string): string {
  let result = reference;
  const sortedEntries = Object.entries(BIBLE_BOOK_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [english, spanish] of sortedEntries) {
    if (result.includes(english)) { result = result.replace(english, spanish); break; }
  }
  return result;
}

// ─── Page Background ────────────────────────────────────────────────────────

function PageBackground({ imageUrl }: { imageUrl: string }) {
  return (
    <>
      <Image
        source={{ uri: imageUrl }}
        style={{ position: 'absolute', width: PAGE_WIDTH, height: PAGE_HEIGHT }}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', width: PAGE_WIDTH, height: PAGE_HEIGHT }}
      />
    </>
  );
}

// ─── Page Footer ────────────────────────────────────────────────────────────

function PageFooter({ pageNum, totalPages, language }: { pageNum: number; totalPages: number; language: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 28, fontWeight: '700', letterSpacing: 2 }}>
        {language === 'es' ? 'LUZ DIARIA' : 'DAILY LIGHT'}
      </Text>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700' }}>
          {pageNum}/{totalPages}
        </Text>
      </View>
    </View>
  );
}

// ─── Section Block (used on pages 2+) ───────────────────────────────────────

function SectionBlock({
  label,
  content,
  accentColor,
  icon,
}: {
  label: string;
  content: string;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderRadius: 24,
      padding: 44,
      borderLeftWidth: 6,
      borderLeftColor: accentColor,
      marginBottom: 32,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: accentColor + '30',
          alignItems: 'center', justifyContent: 'center', marginRight: 16,
        }}>
          {icon}
        </View>
        <Text style={{ color: accentColor, fontSize: 28, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 34, lineHeight: 50, fontWeight: '400' }} adjustsFontSizeToFit minimumFontScale={0.7}>
        {content}
      </Text>
    </View>
  );
}

// ─── Page 1: Cover + Verse ───────────────────────────────────────────────────

interface Page1Props {
  imageUrl: string;
  title: string;
  date: string;
  verse: string;
  bibleRef: string;
  language: string;
  pageNum: number;
  totalPages: number;
}

function Page1({ imageUrl, title, date, verse, bibleRef, language, pageNum, totalPages }: Page1Props) {
  const formatDate = (d: string) => {
    const obj = new Date(d + 'T12:00:00');
    return obj.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  };

  return (
    <View style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, backgroundColor: '#000', overflow: 'hidden' }} collapsable={false}>
      <PageBackground imageUrl={imageUrl} />
      <View style={{ flex: 1, padding: 60, justifyContent: 'space-between' }}>
        {/* Top: date + title */}
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 28, fontWeight: '500', marginBottom: 16 }}>
            {formatDate(date)}
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 72, fontWeight: '800', lineHeight: 86, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.6}>
            {title}
          </Text>
        </View>

        {/* Middle: verse */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.13)',
          borderRadius: 28, padding: 48,
          borderLeftWidth: 6, borderLeftColor: '#FFD700',
        }}>
          <BookOpen size={44} color="#FFD700" style={{ marginBottom: 20 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 40, fontStyle: 'italic', lineHeight: 58, marginBottom: 24 }} adjustsFontSizeToFit minimumFontScale={0.65} numberOfLines={7}>
            "{verse}"
          </Text>
          <Text style={{ color: '#FFD700', fontSize: 32, fontWeight: '700' }}>
            — {bibleRef}
          </Text>
        </View>

        {/* Footer */}
        <PageFooter pageNum={pageNum} totalPages={totalPages} language={language} />
      </View>
    </View>
  );
}

// ─── Page 2+: Sections ───────────────────────────────────────────────────────

interface SectionsPageProps {
  imageUrl: string;
  title: string;
  sections: { label: string; content: string; accentColor: string; icon: React.ReactNode }[];
  language: string;
  pageNum: number;
  totalPages: number;
}

function SectionsPage({ imageUrl, title, sections, language, pageNum, totalPages }: SectionsPageProps) {
  return (
    <View style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, backgroundColor: '#000', overflow: 'hidden' }} collapsable={false}>
      <PageBackground imageUrl={imageUrl} />
      <View style={{ flex: 1, padding: 60, justifyContent: 'space-between' }}>
        {/* Top: small title */}
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 30, fontWeight: '600', marginBottom: 20 }} numberOfLines={1}>
          {title}
        </Text>

        {/* Sections */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {sections.map((s, i) => (
            <SectionBlock key={i} label={s.label} content={s.content} accentColor={s.accentColor} icon={s.icon} />
          ))}
        </View>

        {/* Footer */}
        <PageFooter pageNum={pageNum} totalPages={totalPages} language={language} />
      </View>
    </View>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export interface ShareableDevotionalImageRef {
  captureAll: () => Promise<string[]>;
}

export interface ShareableDevotionalImageProps {
  devotional: Devotional;
  language: 'en' | 'es';
  colors: {
    background: string; surface: string; text: string;
    textMuted: string; primary: string; secondary: string; accent: string;
  };
  translations: {
    bible_verse: string; reflection: string; story: string;
    biblical_character: string; application: string; prayer: string;
  };
  previewMode?: boolean;
}

// Trim text to a max character count, ending at a word boundary
function safeTrim(text: string, max: number): string {
  if (!text || text.length <= max) return text ?? '';
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export const ShareableDevotionalImage = forwardRef<ShareableDevotionalImageRef, ShareableDevotionalImageProps>(
  ({ devotional, language, translations, previewMode = false }, ref) => {
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

    // Group sections into pages: 2 sections per page max
    const allSections: { label: string; content: string; accentColor: string; icon: React.ReactNode }[] = [
      { label: translations.reflection, content: safeTrim(reflection, 320), accentColor: '#FFD700', icon: <Star size={28} color="#FFD700" /> },
      { label: translations.story, content: safeTrim(story, 320), accentColor: '#4ECDC4', icon: <BookOpen size={28} color="#4ECDC4" /> },
      { label: translations.biblical_character, content: safeTrim(character, 320), accentColor: '#A78BFA', icon: <User size={28} color="#A78BFA" /> },
      { label: translations.application, content: safeTrim(application, 300), accentColor: '#34D399', icon: <Check size={28} color="#34D399" /> },
      { label: translations.prayer, content: safeTrim(prayer, 240), accentColor: '#FB923C', icon: <Heart size={28} color="#FB923C" /> },
    ];

    // Page 1 = cover+verse. Then 2 sections per page.
    const sectionPages: typeof allSections[] = [];
    for (let i = 0; i < allSections.length; i += 2) {
      sectionPages.push(allSections.slice(i, i + 2));
    }
    const totalPages = 1 + sectionPages.length;

    // Refs for each page
    const page1Ref = useRef<View>(null);
    const pageRefs = useRef<(View | null)[]>([]);

    useImperativeHandle(ref, () => ({
      captureAll: async () => {
        const uris: string[] = [];
        // Capture page 1
        if (page1Ref.current) {
          const uri = await captureRef(page1Ref, { format: 'png', quality: 1, result: 'tmpfile', width: PAGE_WIDTH, height: PAGE_HEIGHT });
          uris.push(uri);
        }
        // Capture section pages
        for (let i = 0; i < pageRefs.current.length; i++) {
          const r = pageRefs.current[i];
          if (r) {
            const uri = await captureRef(r, { format: 'png', quality: 1, result: 'tmpfile', width: PAGE_WIDTH, height: PAGE_HEIGHT });
            uris.push(uri);
          }
        }
        return uris;
      },
    }));

    const PREVIEW_W = 160;
    const PREVIEW_H = 200;
    const previewScale = PREVIEW_W / PAGE_WIDTH;

    if (previewMode) {
      return (
        <View style={{ flexDirection: 'row' }}>
          {/* Page 1 preview */}
          <View style={{ width: PREVIEW_W, height: PREVIEW_H, overflow: 'hidden', marginRight: 8, borderRadius: 8 }}>
            <View style={{ transform: [{ scale: previewScale }], transformOrigin: 'top left' as any }}>
              <Page1
                imageUrl={devotional.imageUrl}
                title={title}
                date={devotional.date}
                verse={verse}
                bibleRef={bibleRef}
                language={language}
                pageNum={1}
                totalPages={totalPages}
              />
            </View>
          </View>
          {/* Section pages previews */}
          {sectionPages.slice(0, 2).map((sections, i) => (
            <View key={i} style={{ width: PREVIEW_W, height: PREVIEW_H, overflow: 'hidden', marginRight: 8, borderRadius: 8 }}>
              <View style={{ transform: [{ scale: previewScale }], transformOrigin: 'top left' as any }}>
                <SectionsPage
                  imageUrl={devotional.imageUrl}
                  title={title}
                  sections={sections}
                  language={language}
                  pageNum={i + 2}
                  totalPages={totalPages}
                />
              </View>
            </View>
          ))}
          {totalPages > 3 && (
            <View style={{ width: PREVIEW_W, height: PREVIEW_H, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>+{totalPages - 3}</Text>
            </View>
          )}
        </View>
      );
    }

    // Offscreen full-size render for capture
    return (
      <View style={{ position: 'absolute', opacity: 0, left: -9999 }}>
        <View ref={page1Ref} collapsable={false}>
          <Page1
            imageUrl={devotional.imageUrl}
            title={title}
            date={devotional.date}
            verse={verse}
            bibleRef={bibleRef}
            language={language}
            pageNum={1}
            totalPages={totalPages}
          />
        </View>
        {sectionPages.map((sections, i) => (
          <View
            key={i}
            ref={(r) => { pageRefs.current[i] = r; }}
            collapsable={false}
          >
            <SectionsPage
              imageUrl={devotional.imageUrl}
              title={title}
              sections={sections}
              language={language}
              pageNum={i + 2}
              totalPages={totalPages}
            />
          </View>
        ))}
      </View>
    );
  }
);

ShareableDevotionalImage.displayName = 'ShareableDevotionalImage';
