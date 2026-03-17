// BibleScreen — full Bible navigation: Books → Chapters → Verses
// Uses the bible_reader_core-inspired data model from src/lib/bible/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Search,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

import { useThemeColors, useLanguage } from '@/lib/store';
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS, getBookById } from '@/lib/bible/books';
import { fetchBibleChapter, getBibleVerse, validateBibleDataLoad } from '@/lib/bible/api';
import { pickBestVoice } from '@/lib/voice-picker';
import {
  sanitizeForTTS,
  preprocessNumbersForTTS,
  applyBiblicalPronunciations,
} from '@/lib/tts-voices';
import type { BibleBook, BibleChapterData, BibleNavView } from '@/lib/bible/types';

// ─── Book List ────────────────────────────────────────────────────────────────

function BookItem({
  book,
  onPress,
  colors,
  lang,
}: {
  book: BibleBook;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
}) {
  const name = lang === 'es' ? book.name : book.nameEn;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '30' }}
      >
        <View className="flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: colors.text }}
          >
            {name}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            {book.chapters} {book.chapters === 1 ? 'capítulo' : 'capítulos'}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ─── Chapter Grid ─────────────────────────────────────────────────────────────

function ChapterGrid({
  book,
  onSelect,
  colors,
  lang,
}: {
  book: BibleBook;
  onSelect: (chapter: number) => void;
  colors: ReturnType<typeof useThemeColors>;
  lang: string;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const bookName = lang === 'es' ? book.name : book.nameEn;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        className="w-full text-xs font-semibold uppercase mb-2"
        style={{ color: colors.textMuted, letterSpacing: 1.2 }}
      >
        {bookName}
      </Text>
      {chapters.map(ch => (
        <Pressable
          key={ch}
          onPress={() => onSelect(ch)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            className="items-center justify-center rounded-xl"
            style={{
              width: 52,
              height: 52,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.textMuted + '30',
            }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {ch}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Verse List ───────────────────────────────────────────────────────────────

function VerseRow({
  number,
  text,
  colors,
  isHighlighted,
}: {
  number: number;
  text: string;
  colors: ReturnType<typeof useThemeColors>;
  isHighlighted: boolean;
}) {
  return (
    <View
      className="flex-row px-5 py-2"
      style={isHighlighted ? { backgroundColor: colors.primary + '18' } : undefined}
    >
      <Text
        className="text-xs font-bold mr-3 mt-0.5 w-6 text-right"
        style={{ color: colors.primary }}
      >
        {number}
      </Text>
      <Text
        className="flex-1 text-base leading-7"
        style={{ color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BibleScreen() {
  const colors = useThemeColors();
  const language = useLanguage();
  const lang = (language as 'en' | 'es') || 'es';

  const [view, setView] = useState<BibleNavView>('books');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // TTS
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsJobRef = useRef(0);

  // Run validation on mount (logs Genesis 1:1)
  useEffect(() => {
    validateBibleDataLoad();
  }, []);

  // Filtered books
  const filteredBooks = searchQuery.trim()
    ? BIBLE_BOOKS.filter(b => {
        const q = searchQuery.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q);
      })
    : null;

  const handleSelectBook = useCallback((book: BibleBook) => {
    setSelectedBook(book);
    setView('chapters');
    setSearchQuery('');
    setShowSearch(false);
  }, []);

  const handleSelectChapter = useCallback(async (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    setView('verses');
    setLoading(true);
    setError(null);
    setChapterData(null);

    const result = await fetchBibleChapter(selectedBook.id, chapter, lang);
    if (result.success) {
      setChapterData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [selectedBook, lang]);

  const handleBack = useCallback(() => {
    // Stop TTS if playing
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
    if (view === 'verses') {
      setView('chapters');
      setChapterData(null);
      setSelectedChapter(null);
    } else if (view === 'chapters') {
      setView('books');
      setSelectedBook(null);
    }
  }, [view, isSpeaking]);

  // TTS — read the whole chapter
  const handleTTS = useCallback(async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (!chapterData?.verses.length) return;

    const jobId = ++ttsJobRef.current;
    setIsSpeaking(true);

    try {
      const picked = await pickBestVoice(lang);
      const fullText = chapterData.verses
        .map(v => `${v.number}. ${v.text}`)
        .join(' ');
      const processedText = applyBiblicalPronunciations(
        preprocessNumbersForTTS(sanitizeForTTS(fullText)),
        lang
      );

      Speech.speak(processedText, {
        language: lang === 'es' ? 'es-MX' : 'en-US',
        voice: picked.voiceIdentifier ?? undefined,
        rate: 0.9,
        onDone: () => {
          if (ttsJobRef.current === jobId) setIsSpeaking(false);
        },
        onStopped: () => {
          if (ttsJobRef.current === jobId) setIsSpeaking(false);
        },
        onError: () => {
          if (ttsJobRef.current === jobId) setIsSpeaking(false);
        },
      });
    } catch {
      setIsSpeaking(false);
    }
  }, [isSpeaking, chapterData, lang]);

  // Header title
  const headerTitle = (() => {
    if (view === 'books') return lang === 'es' ? 'Biblia' : 'Bible';
    if (view === 'chapters' && selectedBook) {
      return lang === 'es' ? selectedBook.name : selectedBook.nameEn;
    }
    if (view === 'verses' && selectedBook && selectedChapter) {
      const name = lang === 'es' ? selectedBook.name : selectedBook.nameEn;
      return `${name} ${selectedChapter}`;
    }
    return 'Biblia';
  })();

  const showBack = view !== 'books';

  // ── Book list content ──
  const renderBookList = () => {
    const booksToShow = filteredBooks ?? null;

    if (booksToShow !== null) {
      // Search results
      return (
        <Animated.View entering={FadeIn} className="flex-1">
          <FlatList
            data={booksToShow}
            keyExtractor={b => b.id}
            renderItem={({ item }) => (
              <BookItem book={item} onPress={() => handleSelectBook(item)} colors={colors} lang={lang} />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text style={{ color: colors.textMuted }}>Sin resultados</Text>
              </View>
            }
          />
        </Animated.View>
      );
    }

    // Full list grouped OT / NT
    return (
      <Animated.View entering={FadeIn} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Old Testament */}
          <View className="px-5 pt-4 pb-1">
            <Text
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              {lang === 'es' ? 'Antiguo Testamento' : 'Old Testament'}
              <Text style={{ color: colors.textMuted }}> · {OT_BOOKS.length}</Text>
            </Text>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.textMuted + '30' }}>
            {OT_BOOKS.map(book => (
              <BookItem key={book.id} book={book} onPress={() => handleSelectBook(book)} colors={colors} lang={lang} />
            ))}
          </View>

          {/* New Testament */}
          <View className="px-5 pt-5 pb-1">
            <Text
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              {lang === 'es' ? 'Nuevo Testamento' : 'New Testament'}
              <Text style={{ color: colors.textMuted }}> · {NT_BOOKS.length}</Text>
            </Text>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.textMuted + '30' }}>
            {NT_BOOKS.map(book => (
              <BookItem key={book.id} book={book} onPress={() => handleSelectBook(book)} colors={colors} lang={lang} />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View
          className="px-4 pb-3"
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors.textMuted + '30' }}
        >
          <View className="flex-row items-center justify-between mt-1">
            {/* Left: back or spacer */}
            {showBack ? (
              <Pressable
                onPress={handleBack}
                className="flex-row items-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                hitSlop={12}
              >
                <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
                <Text className="text-base font-medium ml-0.5" style={{ color: colors.primary }}>
                  {view === 'verses' && selectedBook
                    ? (lang === 'es' ? selectedBook.name : selectedBook.nameEn)
                    : (lang === 'es' ? 'Libros' : 'Books')}
                </Text>
              </Pressable>
            ) : (
              <View style={{ width: 60 }} />
            )}

            {/* Center: title */}
            <Text
              className="text-lg font-bold text-center flex-1"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {headerTitle}
            </Text>

            {/* Right: search or TTS */}
            <View className="flex-row items-center" style={{ width: 60, justifyContent: 'flex-end', gap: 8 }}>
              {view === 'books' && (
                <Pressable
                  onPress={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  hitSlop={12}
                >
                  {showSearch
                    ? <X size={20} color={colors.textMuted} />
                    : <Search size={20} color={colors.textMuted} />}
                </Pressable>
              )}
              {view === 'verses' && chapterData && (
                <Pressable
                  onPress={handleTTS}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  hitSlop={12}
                >
                  {isSpeaking
                    ? <VolumeX size={20} color={colors.primary} />
                    : <Volume2 size={20} color={colors.textMuted} />}
                </Pressable>
              )}
            </View>
          </View>

          {/* Search bar */}
          {showSearch && view === 'books' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} className="mt-3">
              <View
                className="flex-row items-center rounded-xl px-3 py-2.5"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.textMuted + '30' }}
              >
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  className="flex-1 ml-2 text-sm"
                  style={{ color: colors.text }}
                  placeholder={lang === 'es' ? 'Buscar libro...' : 'Search book...'}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  autoCorrect={false}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>

      {/* Content */}
      {view === 'books' && renderBookList()}

      {view === 'chapters' && selectedBook && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1">
          <ChapterGrid
            book={selectedBook}
            onSelect={handleSelectChapter}
            colors={colors}
            lang={lang}
          />
        </Animated.View>
      )}

      {view === 'verses' && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1">
          {loading && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-3 text-sm" style={{ color: colors.textMuted }}>
                {lang === 'es' ? 'Cargando capítulo...' : 'Loading chapter...'}
              </Text>
            </View>
          )}

          {error && !loading && (
            <View className="flex-1 items-center justify-center px-8">
              <BookOpen size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text className="text-base font-semibold mt-4 text-center" style={{ color: colors.text }}>
                {lang === 'es' ? 'No se pudo cargar' : 'Could not load'}
              </Text>
              <Text className="text-sm mt-1 text-center" style={{ color: colors.textMuted }}>
                {error}
              </Text>
              <Pressable
                onPress={() => selectedChapter && handleSelectChapter(selectedChapter)}
                className="mt-5 px-6 py-3 rounded-xl"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold text-sm">
                  {lang === 'es' ? 'Reintentar' : 'Retry'}
                </Text>
              </Pressable>
            </View>
          )}

          {chapterData && !loading && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
            >
              {chapterData.verses.map(verse => (
                <VerseRow
                  key={verse.number}
                  number={verse.number}
                  text={verse.text}
                  colors={colors}
                  isHighlighted={false}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </View>
  );
}
