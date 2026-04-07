// Strong's Concordance — Search Screen
// Full-screen route accessible from the Bible tab's Strong Mode controls.
// Allows the user to search any Strong entry by ID, lemma, transliteration,
// or definition — independent of the Bible reader word links.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Search, X, FlaskConical } from 'lucide-react-native';

import { useThemeColors, useLanguage } from '@/lib/store';
import { strongRepository } from '@/lib/strong/repository';
import {
  loadStrongFavorites,
  toggleStrongFavorite,
} from '@/lib/strong/service';
import type { StrongEntry } from '@/lib/strong/types';
import { StrongSheet } from '@/components/StrongSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type LangFilter = 'all' | 'Hebrew' | 'Greek';

const LANG_LABELS: Record<LangFilter, string> = {
  all: 'Todos',
  Hebrew: 'Hebreo',
  Greek: 'Griego',
};

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({
  entry,
  colors,
  onPress,
}: {
  entry: StrongEntry;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const isHebrew = entry.language === 'Hebrew';
  const accentColor = isHebrew ? '#C47F2E' : '#4A7CBF';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: colors.textMuted + '18',
      })}
    >
      {/* Strong ID + language badge */}
      <View style={{ width: 76, marginRight: 12 }}>
        <Text style={{
          fontSize: 13, fontWeight: '700',
          color: accentColor,
          letterSpacing: 0.3,
        }}>
          {entry.id}
        </Text>
        <View style={{
          marginTop: 3,
          alignSelf: 'flex-start',
          paddingHorizontal: 5, paddingVertical: 1,
          borderRadius: 4,
          backgroundColor: accentColor + '18',
        }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: accentColor, letterSpacing: 0.5 }}>
            {isHebrew ? 'HEB' : 'GRI'}
          </Text>
        </View>
      </View>

      {/* Lemma + transliteration + definition */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
          <Text style={{
            fontSize: 16,
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            color: colors.text,
          }}>
            {entry.lemmaOriginal}
          </Text>
          <Text style={{
            fontSize: 12, fontStyle: 'italic',
            color: colors.textMuted,
          }}>
            {entry.transliteration}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 12, color: colors.textMuted,
            marginTop: 2, lineHeight: 17,
          }}
        >
          {entry.shortDefinition}
        </Text>
      </View>

      {/* Arrow */}
      <ArrowLeft
        size={14}
        color={colors.textMuted + '80'}
        style={{ transform: [{ rotate: '180deg' }], marginLeft: 8 }}
      />
    </Pressable>
  );
}

// ─── Empty / hint states ──────────────────────────────────────────────────────

function EmptyHint({ colors, hasQuery }: { colors: ReturnType<typeof useThemeColors>; hasQuery: boolean }) {
  if (hasQuery) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
        <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center' }}>
          Sin resultados
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted + 'AA', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }}>
          Prueba con otro término o ID{'\n'}(ej: H430, logos, amor)
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 50, paddingHorizontal: 32 }}>
      <FlaskConical size={40} color={colors.textMuted + '60'} strokeWidth={1.5} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16, textAlign: 'center' }}>
        Léxico Strong
      </Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
        Busca cualquier palabra del griego o hebreo bíblico por su número Strong, transliteración o significado.
      </Text>
      <View style={{ marginTop: 24, gap: 8, alignSelf: 'stretch' }}>
        {[
          { label: 'H430 — Elohim, Dios', color: '#C47F2E' },
          { label: 'G25 — agapaō, amar', color: '#4A7CBF' },
          { label: 'logos', color: '#4A7CBF' },
          { label: 'poner', color: '#C47F2E' },
        ].map(({ label, color }) => (
          <Text key={label} style={{
            fontSize: 12, color, textAlign: 'center',
            paddingVertical: 3, paddingHorizontal: 10,
            borderRadius: 8, backgroundColor: color + '12',
            alignSelf: 'center',
          }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StrongSearchScreen() {
  const colors = useThemeColors();
  const lang = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Search state ─────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState<LangFilter>('all');
  const [results, setResults] = useState<StrongEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // ── Sheet state ───────────────────────────────────────────────────────────
  const [sheetEntry, setSheetEntry] = useState<StrongEntry | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites on mount
  useEffect(() => {
    loadStrongFavorites().then(setFavorites);
  }, []);

  // ── Search logic ──────────────────────────────────────────────────────────

  const runSearch = useCallback((q: string, filter: LangFilter) => {
    if (!q.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    // requestAnimationFrame gives the UI a chance to show the spinner
    // before the synchronous block-loading begins
    requestAnimationFrame(() => {
      const language = filter === 'all' ? undefined : filter;
      const found = strongRepository.searchEntries(q, { limit: 50, language });
      setResults(found);
      setIsSearching(false);
    });
  }, []);

  // Debounce: 300 ms after last keystroke, or immediately on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      runSearch(query, langFilter);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, langFilter, runSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectEntry = useCallback((entry: StrongEntry) => {
    Haptics.selectionAsync();
    setSheetEntry(entry);
  }, []);

  const handleToggleFavorite = useCallback(async (strongId: string) => {
    const next = await toggleStrongFavorite(strongId, favorites);
    setFavorites(next);
    // Reflect favorite state on the currently displayed entry
    setSheetEntry(prev =>
      prev?.id === strongId ? { ...prev, isFavorite: next.has(strongId) } : prev
    );
  }, [favorites]);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.textMuted + '20',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
            Léxico Strong
          </Text>
          <FlaskConical size={18} color={colors.primary} strokeWidth={2} />
        </View>

        {/* Search input */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          marginTop: 12,
          paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 6,
          borderRadius: 12,
          backgroundColor: colors.textMuted + '14',
          borderWidth: 1,
          borderColor: colors.textMuted + '20',
        }}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por ID, palabra o significado…"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={{
              flex: 1, fontSize: 15,
              color: colors.text,
              padding: 0,
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={handleClearQuery} hitSlop={8}>
              <X size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Language filter chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {(['all', 'Hebrew', 'Greek'] as LangFilter[]).map(f => {
            const active = langFilter === f;
            const chipColor = f === 'Hebrew' ? '#C47F2E' : f === 'Greek' ? '#4A7CBF' : colors.primary;
            return (
              <Pressable
                key={f}
                onPress={() => setLangFilter(f)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  paddingHorizontal: 14, paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: active ? chipColor + '22' : colors.textMuted + '12',
                  borderWidth: 1,
                  borderColor: active ? chipColor + '55' : 'transparent',
                })}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: active ? chipColor : colors.textMuted,
                }}>
                  {LANG_LABELS[f]}
                </Text>
              </Pressable>
            );
          })}
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => (
            <ResultRow
              entry={item}
              colors={colors}
              onPress={() => handleSelectEntry(item)}
            />
          )}
          ListHeaderComponent={
            <Text style={{
              fontSize: 11, fontWeight: '600',
              color: colors.textMuted,
              paddingHorizontal: 18, paddingVertical: 10,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      ) : (
        <EmptyHint colors={colors} hasQuery={query.trim().length > 0 && !isSearching} />
      )}

      {/* ── StrongSheet ─────────────────────────────────────────────────── */}
      <StrongSheet
        visible={sheetEntry != null}
        entry={sheetEntry}
        isFavorite={sheetEntry != null && favorites.has(sheetEntry.id)}
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSheetEntry(null)}
        onNavigateToVerse={() => {
          // Navigation from search to Bible reader:
          // close sheet, go back to bible tab, then navigate to verse
          setSheetEntry(null);
          router.back();
        }}
        colors={colors}
        lang={lang}
      />
    </View>
  );
}
