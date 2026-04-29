import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Gift,
  Globe,
  Mail,
  MessageSquare,
  Repeat2,
  Send,
  ShoppingBag,
  Shield,
  Sparkles,
  Star,
  Languages,
  X,
} from 'lucide-react-native';
import { useUser, useAppStore, useLanguage } from '@/lib/store';
import { gamificationApi } from '@/lib/gamification-api';
import { useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const NOVEDADES_STORAGE_KEY = '@novedades_last_opened';
export const LATEST_NEWS_DATE = '2026-04-29';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  date: string;
  category: 'feature' | 'update' | 'info';
  categoryLabel: string;
  categoryLabelEn: string;
  emoji: string;
  accentColor: string;
  accentBg: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
}

interface UserDrop {
  userGiftId: string;
  giftDropId: string;
  title: string;
  message: string;
  rewardType: 'CHEST' | 'THEME' | 'TITLE' | 'AVATAR' | 'ITEM';
  rewardId: string;
  rewardItemNameEs?: string | null;
  rewardItemNameEn?: string | null;
  status: 'PENDING' | 'CLAIMED' | 'DISMISSED';
  createdAt: string;
}

interface TicketEvent {
  id: string;
  actor: 'USER' | 'ADMIN' | 'SYSTEM';
  type: string;
  message: string;
  createdAt: string;
}

interface FeedbackTicket {
  id: string;
  incidentNumber: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  latestEvent: { actor: string; message: string; createdAt: string } | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'bible-studies-2026-04',
    date: '2026-04-29',
    category: 'feature',
    categoryLabel: 'Estudios Bíblicos',
    categoryLabelEn: 'Bible Studies',
    emoji: '📚',
    accentColor: '#1D4ED8',
    accentBg: '#EFF6FF',
    title: 'Estudios Bíblicos Profundos',
    titleEn: 'Deep Bible Studies',
    summary: 'Estudios temáticos guiados con diccionario bíblico Strong integrado. Más profundidad, más contexto.',
    summaryEn: 'Guided thematic studies with integrated Strong dictionary. More depth, more context.',
  },
  {
    id: 'heroes-album-2026-04',
    date: '2026-04-27',
    category: 'feature',
    categoryLabel: 'Nueva Colección',
    categoryLabelEn: 'New Collection',
    emoji: '⚔️',
    accentColor: '#D4AF37',
    accentBg: '#FFFBF0',
    title: 'Álbum: Héroes de la Fe',
    titleEn: 'Album: Heroes of Faith',
    summary: '26 cromos del Antiguo Testamento — 3 cartas por sobre, carta oculta al completar.',
    summaryEn: '26 Old Testament cards — 3 cards per pack, hidden card for completing the album.',
  },
  {
    id: 'strong-module-2026-04',
    date: '2026-04-27',
    category: 'feature',
    categoryLabel: 'Módulo Bíblico',
    categoryLabelEn: 'Bible Module',
    emoji: '📖',
    accentColor: '#8B5CF6',
    accentBg: '#F5F3FF',
    title: 'Strong en la Biblia',
    titleEn: 'Strong in the Bible',
    summary: 'Activa el switch en el lector y toca cualquier palabra para ver su raíz original en hebreo o griego.',
    summaryEn: 'Enable the switch in the reader and tap any word to see its original Hebrew or Greek root.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, lang = 'es'): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Bible Studies Content ────────────────────────────────────────────────────

const STUDY_EXAMPLES = [
  {
    studyId: 'i_am_before_abraham_001',
    image: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=300&h=200&fit=crop&q=80',
    titleEs: 'YO SOY: Antes que Abraham',
    titleEn: 'I AM: Before Abraham',
    refEs: 'Juan 8:58',
    refEn: 'John 8:58',
    accentColor: '#D97706',
  },
  {
    studyId: 'logos_creation_001',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=200&fit=crop&q=80',
    titleEs: 'En el Principio era el Verbo',
    titleEn: 'In the Beginning was the Word',
    refEs: 'Juan 1:1',
    refEn: 'John 1:1',
    accentColor: '#059669',
  },
  {
    studyId: 'good_shepherd_001',
    image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=300&h=200&fit=crop&q=80',
    titleEs: 'El Buen Pastor',
    titleEn: 'The Good Shepherd',
    refEs: 'Juan 10 · Sal 23',
    refEn: 'John 10 · Ps 23',
    accentColor: '#7C3AED',
  },
  {
    studyId: 'born_again_001',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop&q=80',
    titleEs: 'Nacer de Nuevo',
    titleEn: 'Born Again',
    refEs: 'Juan 3:16',
    refEn: 'John 3:16',
    accentColor: '#DB2777',
  },
];

function BibleStudiesContent({ language, onNavigate }: { language: string; onNavigate: () => void }) {
  const es = language === 'es';
  const studyRouter = useRouter();
  return (
    <View style={{ gap: 16 }}>
      {/* Intro */}
      <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>
        {es
          ? <>Los <Text style={{ color: '#1D4ED8', fontWeight: '700' }}>Estudios Bíblicos</Text> son recorridos temáticos guiados que van más allá del devocional diario — con contexto histórico, análisis de palabras originales y referencias cruzadas integradas.</>
          : <><Text style={{ color: '#1D4ED8', fontWeight: '700' }}>Bible Studies</Text> are guided thematic journeys that go beyond the daily devotional — featuring historical context, original word analysis, and integrated cross-references.</>
        }
      </Text>

      {/* 4 study thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
      >
        {STUDY_EXAMPLES.map((study) => (
          <Pressable
            key={study.titleEn}
            onPress={() => studyRouter.push({ pathname: '/study-reader', params: { id: study.studyId } } as any)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, alignItems: 'center', gap: 6 })}
          >
            <View
              style={{
                width: 90,
                height: 120,
                borderRadius: 12,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: study.accentColor + '60',
                shadowColor: study.accentColor,
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Image source={{ uri: study.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              {/* Overlay gradient */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, justifyContent: 'flex-end', padding: 6 }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }} numberOfLines={1}>
                  {es ? study.refEs : study.refEn}
                </Text>
              </LinearGradient>
            </View>
            <Text style={{ color: '#1D4ED8', fontSize: 10, fontWeight: '700', textAlign: 'center', maxWidth: 90 }} numberOfLines={2}>
              {es ? study.titleEs : study.titleEn}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Feature highlights */}
      <View style={{ gap: 10 }}>
        {[
          {
            icon: '📖',
            titleEs: 'Diccionario Strong integrado',
            titleEn: 'Integrated Strong Dictionary',
            descEs: 'Toca cualquier palabra para ver su raíz hebrea o griega con definición completa.',
            descEn: 'Tap any word to see its Hebrew or Greek root with full definition.',
            color: '#7C3AED',
          },
          {
            icon: '🗺️',
            titleEs: 'Contexto histórico',
            titleEn: 'Historical Context',
            descEs: 'Cada estudio incluye trasfondo cultural y geográfico del pasaje.',
            descEn: 'Each study includes cultural and geographical background of the passage.',
            color: '#059669',
          },
          {
            icon: '🔗',
            titleEs: 'Referencias cruzadas',
            titleEn: 'Cross References',
            descEs: 'Versículos relacionados en toda la Biblia conectados al tema del estudio.',
            descEn: 'Related verses throughout the Bible connected to the study theme.',
            color: '#D97706',
          },
        ].map((feat) => (
          <View
            key={feat.titleEn}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: feat.color + '08',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: feat.color + '20',
            }}
          >
            <Text style={{ fontSize: 18 }}>{feat.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: feat.color, fontWeight: '700', fontSize: 13 }}>
                {es ? feat.titleEs : feat.titleEn}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 2 }}>
                {es ? feat.descEs : feat.descEn}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Pressable
        onPress={onNavigate}
        style={({ pressed }) => ({
          backgroundColor: '#1D4ED8',
          borderRadius: 12,
          paddingVertical: 13,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <BookOpen size={16} color="#fff" strokeWidth={2.5} />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
          {es ? 'Explorar estudios' : 'Explore studies'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Heroes Content ───────────────────────────────────────────────────────────

const HERO_CARDS = [
  { url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/oNP9k7H5SQY.png', nameEs: 'David vs Goliat', nameEn: 'David vs Goliath', rarityEs: 'épica', rarityEn: 'epic', rarityColor: '#C084FC' },
  { url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/aSDhQl5W0gY.png', nameEs: 'Ester', nameEn: 'Esther', rarityEs: 'legendaria', rarityEn: 'legendary', rarityColor: '#D4AF37' },
  { url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/rI6GXsz5EfU.png', nameEs: 'Elías — Fuego', nameEn: 'Elijah — Fire', rarityEs: 'rara', rarityEn: 'rare', rarityColor: '#38BDF8' },
  { url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/kUMWcp6SXHw.png', nameEs: 'Jesús ✦ Oculta', nameEn: 'Jesus ✦ Hidden', rarityEs: 'secreta', rarityEn: 'secret', rarityColor: '#FDE68A' },
];

function HeroesContent({ language }: { language: string }) {
  const es = language === 'es';
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>
        {es
          ? <>La colección <Text style={{ color: '#B8860B', fontWeight: '700' }}>Héroes de la Fe</Text> trae <Text style={{ color: '#111827', fontWeight: '600' }}>26 cromos</Text> de personajes y eventos del Antiguo Testamento: Noé, Abraham, Moisés, Débora, David, Elías, Daniel, Ester y muchos más.</>
          : <>The <Text style={{ color: '#B8860B', fontWeight: '700' }}>Heroes of Faith</Text> collection brings <Text style={{ color: '#111827', fontWeight: '600' }}>26 cards</Text> featuring characters and events from the Old Testament: Noah, Abraham, Moses, Deborah, David, Elijah, Daniel, Esther and many more.</>
        }
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
        {HERO_CARDS.map((card) => (
          <View key={card.url} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 80, height: 120, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: card.rarityColor, shadowColor: card.rarityColor, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 }}>
              <Image source={{ uri: card.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <Text style={{ color: card.rarityColor, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
              {(es ? card.rarityEs : card.rarityEn).toUpperCase()}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 10, textAlign: 'center', maxWidth: 80 }}>
              {es ? card.nameEs : card.nameEn}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { icon: '⚔️', label: es ? '25 cartas' : '25 cards', sub: es ? 'en el álbum' : 'in the album' },
          { icon: '✦', label: es ? '1 oculta' : '1 hidden', sub: es ? 'al completar' : 'on completion' },
          { icon: '📦', label: es ? '3 por sobre' : '3 per pack', sub: '1,000 pts' },
        ].map((stat) => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)' }}>
            <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
            <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '700', marginTop: 4 }}>{stat.label}</Text>
            <Text style={{ color: '#6B7280', fontSize: 10 }}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      <LinearGradient colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)']} style={{ borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} color="#D4AF37" />
          <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
            {es ? 'CARTA SECRETA' : 'SECRET CARD'}
          </Text>
        </View>
        <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20 }}>
          {es
            ? <>Completa las <Text style={{ color: '#1F2937', fontWeight: '700' }}>25 cartas</Text> del álbum para desbloquear a <Text style={{ color: '#B8860B', fontWeight: '700' }}>Jesús — Autor y Consumador de la Fe</Text> (Hebreos 12:2), una carta legendaria dorada única.</>
            : <>Complete all <Text style={{ color: '#1F2937', fontWeight: '700' }}>25 cards</Text> in the album to unlock <Text style={{ color: '#B8860B', fontWeight: '700' }}>Jesus — Author and Finisher of our Faith</Text> (Hebrews 12:2), a unique golden legendary card.</>
          }
        </Text>
      </LinearGradient>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 14 }}>
        <Repeat2 size={18} color="#34D399" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#34D399', fontWeight: '700', fontSize: 13 }}>
            {es ? 'Canjes entre jugadores' : 'Player trades'}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 4 }}>
            {es
              ? <>¿Tienes duplicados? Puedes enviar y recibir <Text style={{ color: '#374151', fontWeight: '600' }}>hasta 2 canjes por día</Text> con otros jugadores desde la sección de Cromos Bíblicos.</>
              : <>Have duplicates? You can send and receive <Text style={{ color: '#374151', fontWeight: '600' }}>up to 2 trades per day</Text> with other players from the Biblical Cards section.</>
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Strong Content ───────────────────────────────────────────────────────────

const SAMPLE_VERSES = [
  { ref: 'Génesis 1:1', word: 'Dios' },
  { ref: 'Génesis 1:2', word: 'Dios' },
  { ref: 'Génesis 1:3', word: 'Dios' },
  { ref: 'Génesis 1:4', word: 'Dios' },
  { ref: 'Génesis 1:6', word: 'Dios' },
  { ref: 'Génesis 1:7', word: 'Dios' },
  { ref: 'Génesis 1:9', word: 'Dios' },
  { ref: 'Génesis 1:10', word: 'Dios' },
  { ref: 'Génesis 1:11', word: 'Dios' },
  { ref: 'Génesis 1:12', word: 'Dios' },
];

function AppearancesSection({ language }: { language: string }) {
  const [open, setOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const es = language === 'es';

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext({ duration: 280, create: { type: 'easeInEaseOut', property: 'opacity' }, update: { type: 'spring', springDamping: 0.85 } });
    Animated.timing(rotateAnim, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: true }).start();
    setOpen((v) => !v);
  }, [open, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={{ gap: 4 }}>
      <Pressable onPress={toggle} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: '#5B21B6', fontWeight: '800', fontSize: 16 }}>2,602</Text>
        </View>
        <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 11, letterSpacing: 0.5, flex: 1 }}>
          {es ? 'APARICIONES' : 'OCCURRENCES'}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={14} color="#7C3AED" />
        </Animated.View>
      </Pressable>
      <Text style={{ color: '#6B7280', fontSize: 12 }}>
        {es ? 'Toca para ver los versículos' : 'Tap to see the verses'}
      </Text>
      {open && (
        <View style={{ marginTop: 6, gap: 4 }}>
          {SAMPLE_VERSES.map((v) => (
            <View key={v.ref} style={{ backgroundColor: '#F5F3FF', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: '#5B21B6', fontWeight: '700', fontSize: 13 }}>{v.ref}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{v.word}</Text>
              </View>
              <ChevronRight size={14} color="#7C3AED" />
            </View>
          ))}
          <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            {es ? 'Mostrando 10 de 2,602 · En la app verás todas' : 'Showing 10 of 2,602 · See all in the app'}
          </Text>
        </View>
      )}
    </View>
  );
}

function StrongContent({ language }: { language: string }) {
  const es = language === 'es';
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>
        {es
          ? <>El módulo <Text style={{ color: '#7C3AED', fontWeight: '700' }}>Strong</Text> te permite estudiar el significado original de cada palabra bíblica en hebreo (Antiguo Testamento) o griego (Nuevo Testamento).</>
          : <>The <Text style={{ color: '#7C3AED', fontWeight: '700' }}>Strong</Text> module lets you study the original meaning of every biblical word in Hebrew (Old Testament) or Greek (New Testament).</>
        }
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)' }}>
        <Languages size={18} color="#A78BFA" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 13 }}>
            {es ? 'Cómo activarlo' : 'How to enable it'}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 4 }}>
            {es
              ? <>Abre cualquier capítulo en la <Text style={{ color: '#374151', fontWeight: '600' }}>Biblia</Text> y activa el <Text style={{ color: '#374151', fontWeight: '600' }}>switch "Strong"</Text> que aparece en la parte superior. Las palabras con número Strong quedarán subrayadas y en negrita.</>
              : <>Open any chapter in the <Text style={{ color: '#374151', fontWeight: '600' }}>Bible</Text> and enable the <Text style={{ color: '#374151', fontWeight: '600' }}>"Strong" switch</Text> at the top. Words with a Strong number will be underlined and bold.</>
            }
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#FDE8E8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#9B1C1C', fontWeight: '700', fontSize: 12 }}>H430</Text>
          </View>
          <View style={{ backgroundColor: '#FCE7F3', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#9D174D', fontWeight: '700', fontSize: 12 }}>{es ? 'HEBREO' : 'HEBREW'}</Text>
          </View>
        </View>
        <View>
          <Text style={{ fontSize: 28, color: '#7F1D1D', textAlign: 'right', fontWeight: '300', letterSpacing: 2 }}>אֱלֹהִים</Text>
          <Text style={{ fontSize: 15, color: '#9B1C1C', fontStyle: 'italic', marginTop: 2 }}>{'\'ělôhîym'}</Text>
          <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '700', marginTop: 4 }}>
            {es ? 'Dios (Elohim), divinidad, seres poderosos' : 'God (Elohim), deity, powerful beings'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: es ? 'IDIOMA' : 'LANGUAGE', value: es ? 'Hebreo' : 'Hebrew' },
            { label: es ? 'CATEGORÍA' : 'CATEGORY', value: es ? 'Sustantivo' : 'Noun' },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>{item.label}</Text>
              <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{item.value}</Text>
            </View>
          ))}
        </View>
        <AppearancesSection language={language} />
        <View>
          <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 11, letterSpacing: 0.5, marginBottom: 4 }}>
            {es ? 'DEFINICIÓN' : 'DEFINITION'}
          </Text>
          <Text style={{ color: '#374151', fontSize: 13, lineHeight: 19 }}>
            {es
              ? 'Plural de H433; dioses en el sentido ordinario; especialmente usado del Dios supremo; a veces aplicado por deferencia a magistrados y como superlativo.'
              : 'Plural of H433; gods in the ordinary sense; especially used of the supreme God; sometimes applied by way of deference to magistrates and as a superlative.'
            }
          </Text>
        </View>
      </View>

      <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
        {es ? 'Toca cualquier cita para ir directamente al versículo en la Biblia' : 'Tap any reference to go directly to the verse in the Bible'}
      </Text>
    </View>
  );
}

// ─── Drop Card ────────────────────────────────────────────────────────────────

const REWARD_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string; labelEn: string }> = {
  CHEST:  { color: '#F59E0B', bg: '#FFFBF0', icon: '📦', label: 'Cofre especial',   labelEn: 'Special Chest' },
  THEME:  { color: '#8B5CF6', bg: '#F5F3FF', icon: '🎨', label: 'Tema exclusivo',   labelEn: 'Exclusive Theme' },
  TITLE:  { color: '#0EA5E9', bg: '#F0F9FF', icon: '🏷️', label: 'Título especial',  labelEn: 'Special Title' },
  AVATAR: { color: '#EC4899', bg: '#FDF2F8', icon: '👤', label: 'Avatar exclusivo', labelEn: 'Exclusive Avatar' },
  ITEM:   { color: '#10B981', bg: '#F0FDF4', icon: '⭐', label: 'Ítem premium',     labelEn: 'Premium Item' },
};

function DropNewsCard({
  drop,
  language,
  onClaim,
  onGoToStore,
}: {
  drop: UserDrop;
  language: string;
  onClaim: (drop: UserDrop) => Promise<void>;
  onGoToStore: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(drop.status !== 'PENDING');
  const [translatedMessage, setTranslatedMessage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext({ duration: 300, create: { type: 'easeInEaseOut', property: 'opacity' }, update: { type: 'spring', springDamping: 0.8 } });
    Animated.timing(rotateAnim, { toValue: expanded ? 0 : 1, duration: 250, useNativeDriver: true }).start();
    setExpanded((v) => !v);
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const cfg = REWARD_CONFIG[drop.rewardType] ?? REWARD_CONFIG.CHEST;
  const accentColor = cfg.color;
  const itemName = language === 'es' ? (drop.rewardItemNameEs ?? (language === 'es' ? cfg.label : cfg.labelEn)) : (drop.rewardItemNameEn ?? cfg.labelEn);
  const es = language === 'es';

  const handleTranslate = async () => {
    if (translatedMessage && !showTranslated) { setShowTranslated(true); return; }
    if (showTranslated) { setShowTranslated(false); return; }
    setIsTranslating(true);
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: drop.message, targetLanguage: language }),
      }, 20_000);
      if (res.ok) {
        const json = await res.json() as { translatedText?: string };
        if (json.translatedText) { setTranslatedMessage(json.translatedText); setShowTranslated(true); }
      }
    } catch {
      // silently fail
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await onClaim(drop);
      setClaimed(true);
    } finally {
      setClaiming(false);
    }
  };

  const displayedMessage = showTranslated && translatedMessage ? translatedMessage : drop.message;
  const translateLabel = es ? (showTranslated ? 'Ver original' : 'Traducir') : (showTranslated ? 'Show original' : 'Translate');

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${accentColor}30`, backgroundColor: cfg.bg, marginBottom: 12 }}>
      <View style={{ height: 3, backgroundColor: accentColor, opacity: 0.7 }} />

      <Pressable onPress={toggle} style={({ pressed }) => ({ padding: 16, opacity: pressed ? 0.85 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${accentColor}20`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
            </View>
            <View style={{ backgroundColor: `${accentColor}20`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${accentColor}40` }}>
              <Text style={{ color: accentColor, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>DROP</Text>
            </View>
            {!claimed && (
              <View style={{ backgroundColor: '#EF4444', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                  {es ? 'NUEVO' : 'NEW'}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(drop.createdAt.split('T')[0], language)}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>{drop.title}</Text>
            {!expanded && (
              <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19 }} numberOfLines={2}>{drop.message}</Text>
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate }], marginTop: 2 }}>
            <ChevronDown size={18} color={accentColor} />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          <View style={{ height: 1, backgroundColor: `${accentColor}20`, marginBottom: 16 }} />

          {/* Full message */}
          <View style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: accentColor, marginBottom: 8 }}>
            <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
              "{displayedMessage}"
            </Text>
          </View>

          {/* Translate button */}
          <Pressable
            onPress={handleTranslate}
            disabled={isTranslating}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              backgroundColor: accentColor + '12',
              borderWidth: 1,
              borderColor: accentColor + '30',
              marginBottom: 16,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {isTranslating
              ? <ActivityIndicator size="small" color={accentColor} />
              : <Globe size={13} color={accentColor} />
            }
            <Text style={{ fontSize: 12, fontWeight: '600', color: accentColor }}>
              {isTranslating ? (es ? 'Traduciendo…' : 'Translating…') : translateLabel}
            </Text>
          </Pressable>

          {/* Item being gifted */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${accentColor}10`, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: `${accentColor}25`, marginBottom: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${accentColor}20`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>
                {es ? 'ÍTEM REGALADO' : 'GIFTED ITEM'}
              </Text>
              <Text style={{ color: '#111827', fontSize: 15, fontWeight: '800', marginTop: 2 }}>{itemName}</Text>
              <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600', marginTop: 1 }}>
                {es ? cfg.label : cfg.labelEn}
              </Text>
            </View>
            {claimed && (
              <View style={{ backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BBF7D0' }}>
                <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '700' }}>
                  {es ? 'Recibido' : 'Claimed'}
                </Text>
              </View>
            )}
          </View>

          <View style={{ gap: 10 }}>
            {!claimed ? (
              <Pressable
                onPress={handleClaim}
                disabled={claiming}
                style={({ pressed }) => ({ backgroundColor: claiming ? `${accentColor}80` : accentColor, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}
              >
                {claiming ? <ActivityIndicator size="small" color="#fff" /> : <Gift size={16} color="#fff" strokeWidth={2.5} />}
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                  {claiming ? (es ? 'Reclamando…' : 'Claiming…') : (es ? 'Reclamar ahora' : 'Claim now')}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onGoToStore}
              style={({ pressed }) => ({ backgroundColor: claimed ? accentColor : 'rgba(0,0,0,0.05)', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: claimed ? 0 : 1, borderColor: 'rgba(0,0,0,0.1)', opacity: pressed ? 0.8 : 1 })}
            >
              <ShoppingBag size={16} color={claimed ? '#fff' : accentColor} strokeWidth={2.5} />
              <Text style={{ color: claimed ? '#fff' : accentColor, fontWeight: '700', fontSize: 14 }}>
                {es ? 'Ver en tienda / Equipar' : 'View in Store / Equip'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────

function NewsCard({ item, language }: { item: NewsItem; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext({ duration: 300, create: { type: 'easeInEaseOut', property: 'opacity' }, update: { type: 'spring', springDamping: 0.8 } });
    Animated.timing(rotateAnim, { toValue: expanded ? 0 : 1, duration: 250, useNativeDriver: true }).start();
    setExpanded((v) => !v);
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const es = language === 'es';
  const title = es ? item.title : item.titleEn;
  const summary = es ? item.summary : item.summaryEn;
  const categoryLabel = es ? item.categoryLabel : item.categoryLabelEn;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: `${item.accentColor}30`, backgroundColor: item.accentBg, marginBottom: 12 }}>
      <View style={{ height: 3, backgroundColor: item.accentColor, opacity: 0.7 }} />

      <Pressable onPress={toggle} style={({ pressed }) => ({ padding: 16, opacity: pressed ? 0.85 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${item.accentColor}20`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
            </View>
            <View style={{ backgroundColor: `${item.accentColor}20`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${item.accentColor}40` }}>
              <Text style={{ color: item.accentColor, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                {categoryLabel.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(item.date, language)}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
            {!expanded && (
              <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19 }}>{summary}</Text>
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate }], marginTop: 2 }}>
            <ChevronDown size={18} color={item.accentColor} />
          </Animated.View>
        </View>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          <View style={{ height: 1, backgroundColor: `${item.accentColor}20`, marginBottom: 16 }} />
          {item.id.startsWith('bible-studies') ? (
            <BibleStudiesContent language={language} onNavigate={() => router.push('/(tabs)/bible')} />
          ) : item.id.startsWith('heroes') ? (
            <HeroesContent language={language} />
          ) : (
            <StrongContent language={language} />
          )}
        </View>
      )}
    </View>
  );
}

// ─── Conversation Modal ────────────────────────────────────────────────────────

function ConversationModal({
  ticketId,
  incidentNumber,
  status,
  onClose,
  userId,
}: {
  ticketId: string;
  incidentNumber: string | null;
  status: string;
  onClose: () => void;
  userId: string;
}) {
  const insets = useSafeAreaInsets();
  const language = useLanguage();
  const es = language === 'es';
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(status);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/support/ticket/${ticketId}`, { headers: { 'X-User-Id': userId } });
      const data = await r.json() as { ticket?: { events?: TicketEvent[]; status?: string } };
      if (data.ticket?.events) {
        setEvents(data.ticket.events);
        if (data.ticket.status) setTicketStatus(data.ticket.status);
      }
    } catch {}
    setLoading(false);
  }, [ticketId, userId]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${BACKEND_URL}/api/support/ticket/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ message: reply.trim() }),
      });
      setReply('');
      await load();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setSending(false);
  };

  const actorColor = (actor: string) =>
    actor === 'ADMIN' ? '#7C3AED' : actor === 'SYSTEM' ? '#0EA5E9' : '#374151';
  const actorLabel = (actor: string) =>
    actor === 'ADMIN' ? (es ? 'Equipo' : 'Team') : actor === 'SYSTEM' ? (es ? 'Sistema' : 'System') : (es ? 'Tú' : 'You');

  const canReply = ticketStatus === 'waiting_user' || ticketStatus === 'needs_human';

  const statusLabel = ticketStatus === 'waiting_user' ? (es ? 'Responder' : 'Reply')
    : ticketStatus === 'needs_human' ? (es ? 'En revisión' : 'Under review')
    : ticketStatus === 'closed' ? (es ? 'Cerrado' : 'Closed')
    : ticketStatus;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8F9FA' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onClose} style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <X size={18} color="#374151" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800' }}>
                {es ? 'Tu comentario' : 'Your feedback'}
              </Text>
              {incidentNumber && <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 1 }}>{incidentNumber}</Text>}
            </View>
            <View style={{
              backgroundColor: ticketStatus === 'waiting_user' ? '#FEF3C7' : ticketStatus === 'needs_human' ? '#EFF6FF' : ticketStatus === 'closed' ? '#F0FDF4' : '#F3F4F6',
              borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: ticketStatus === 'waiting_user' ? '#D97706' : ticketStatus === 'needs_human' ? '#2563EB' : ticketStatus === 'closed' ? '#16A34A' : '#6B7280' }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
          {loading && <View style={{ alignItems: 'center', paddingVertical: 40 }}><ActivityIndicator color="#7C3AED" /></View>}
          {!loading && events.map((ev, i) => (
            <View key={ev.id} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: actorColor(ev.actor) + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: actorColor(ev.actor) + '40' }}>
                  {ev.actor === 'ADMIN' ? <Shield size={13} color={actorColor(ev.actor)} /> : ev.actor === 'SYSTEM' ? <Sparkles size={13} color={actorColor(ev.actor)} /> : <MessageSquare size={13} color={actorColor(ev.actor)} />}
                </View>
                {i < events.length - 1 && <View style={{ width: 1.5, flex: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginTop: 4 }} />}
              </View>
              <View style={{ flex: 1, backgroundColor: ev.actor === 'ADMIN' ? '#F5F3FF' : ev.actor === 'SYSTEM' ? '#F0F9FF' : '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: ev.actor === 'ADMIN' ? 'rgba(124,58,237,0.12)' : ev.actor === 'SYSTEM' ? 'rgba(14,165,233,0.12)' : 'rgba(0,0,0,0.07)', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: actorColor(ev.actor), marginBottom: 4, letterSpacing: 0.4 }}>
                  {actorLabel(ev.actor).toUpperCase()}
                </Text>
                <Text style={{ color: '#374151', fontSize: 13, lineHeight: 19 }}>{ev.message}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 6 }}>
                  {new Date(ev.createdAt).toLocaleString(es ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {!loading && events.length === 0 && (
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>
              {es ? 'Sin mensajes aún' : 'No messages yet'}
            </Text>
          )}
        </ScrollView>

        {canReply && (
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
              <TextInput
                style={{ flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}
                value={reply}
                onChangeText={setReply}
                placeholder={es ? 'Escribe tu respuesta...' : 'Write your reply...'}
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <Pressable onPress={sendReply} disabled={!reply.trim() || sending} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: !reply.trim() ? 0.22 : pressed ? 0.72 : 1 })}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: '#7C3AED' }} />
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
              </Pressable>
            </View>
          </View>
        )}
        {ticketStatus === 'closed' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 12, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              {es ? 'Este hilo está cerrado' : 'This thread is closed'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Feedback Form ─────────────────────────────────────────────────────────────

function FeedbackForm({ userId }: { userId: string }) {
  const language = useLanguage();
  const es = language === 'es';
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [incidentNumber, setIncidentNumber] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showConv, setShowConv] = useState(false);

  const submit = async () => {
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const r = await fetch(`${BACKEND_URL}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'feedback', clientClaim: { title: title.trim(), comment: comment.trim() } }),
      });
      const data = await r.json() as { success?: boolean; ticket?: { id?: string; incidentNumber?: string } };
      if (data.success && data.ticket) {
        setTicketId(data.ticket.id ?? null);
        setIncidentNumber(data.ticket.incidentNumber ?? null);
        setSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#BBF7D0' }}>
          <CheckCircle size={26} color="#16A34A" />
        </View>
        <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
          {es ? '¡Gracias por tu comentario!' : 'Thank you for your feedback!'}
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
          {es ? 'Recibimos tu mensaje y recibirás respuesta pronto.' : 'We received your message and will reply soon.'}
        </Text>
        {incidentNumber && <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '600' }}>{incidentNumber}</Text>}
        {ticketId && (
          <Pressable onPress={() => setShowConv(true)} style={({ pressed }) => ({ marginTop: 4, backgroundColor: '#F5F3FF', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 13 }}>
              {es ? 'Ver conversación' : 'View conversation'}
            </Text>
          </Pressable>
        )}
        {showConv && ticketId && (
          <ConversationModal ticketId={ticketId} incidentNumber={incidentNumber} status="needs_human" onClose={() => setShowConv(false)} userId={userId} />
        )}
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)', marginTop: 8, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' }}>
          <MessageSquare size={18} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#111827', fontSize: 15, fontWeight: '800' }}>
            {es ? 'Enviar comentarios' : 'Send feedback'}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
            {es ? 'Sugerencias o ideas para el equipo' : 'Suggestions or ideas for the team'}
          </Text>
        </View>
      </View>

      <TextInput
        style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}
        value={title}
        onChangeText={setTitle}
        placeholder={es ? 'Título (opcional)' : 'Title (optional)'}
        placeholderTextColor="#9CA3AF"
        maxLength={100}
      />

      <TextInput
        style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', minHeight: 100, textAlignVertical: 'top' }}
        value={comment}
        onChangeText={setComment}
        placeholder={es ? 'Cuéntanos tu sugerencia, idea o comentario...' : 'Tell us your suggestion, idea or comment...'}
        placeholderTextColor="#9CA3AF"
        multiline
        maxLength={1000}
      />

      <Pressable onPress={submit} disabled={!comment.trim() || submitting} style={({ pressed }) => ({ borderRadius: 12, paddingVertical: 13, alignItems: 'center', overflow: 'hidden', opacity: !comment.trim() ? 0.22 : pressed ? 0.8 : 1, flexDirection: 'row', justifyContent: 'center', gap: 8 })}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#7C3AED' }} />
        {submitting
          ? <ActivityIndicator size="small" color="#fff" />
          : <><Send size={15} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{es ? 'Enviar' : 'Submit'}</Text></>
        }
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#BBF7D0' }}>
        <Text style={{ fontSize: 13 }}>💡</Text>
        <Text style={{ color: '#166534', fontSize: 12, lineHeight: 17, flex: 1 }}>
          {es
            ? <>La respuesta del equipo llegará a <Text style={{ fontWeight: '800' }}>Ajustes → Soporte</Text>. Verás un punto rojo en el tab de Ajustes cuando haya respuesta.</>
            : <>The team's response will appear in <Text style={{ fontWeight: '800' }}>Settings → Support</Text>. You'll see a red dot on the Settings tab when there's a reply.</>
          }
        </Text>
      </View>
    </View>
  );
}

// ─── Pending Feedback Banner ────────────────────────────────────────────────────

function PendingFeedbackBanner({ tickets, userId, onDismiss }: { tickets: FeedbackTicket[]; userId: string; onDismiss: () => void }) {
  const language = useLanguage();
  const es = language === 'es';
  const [openTicket, setOpenTicket] = useState<FeedbackTicket | null>(null);

  if (tickets.length === 0) return null;
  const pendingTickets = tickets.filter(t => t.status === 'waiting_user');
  if (pendingTickets.length === 0) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpenTicket(pendingTickets[0])}
        style={({ pressed }) => ({ backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FDE68A', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FEF9C3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FDE047' }}>
          <Mail size={18} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '800' }}>
            {pendingTickets.length === 1
              ? (es ? 'El equipo te respondió' : 'The team replied to you')
              : (es ? `${pendingTickets.length} respuestas del equipo` : `${pendingTickets.length} replies from the team`)}
          </Text>
          <Text style={{ color: '#B45309', fontSize: 12, marginTop: 1 }}>
            {es ? 'Toca para ver la respuesta y continuar la conversación' : 'Tap to see the reply and continue the conversation'}
          </Text>
        </View>
        <ChevronRight size={16} color="#D97706" />
      </Pressable>

      {openTicket && (
        <ConversationModal ticketId={openTicket.id} incidentNumber={openTicket.incidentNumber} status={openTicket.status} onClose={() => { setOpenTicket(null); onDismiss(); }} userId={userId} />
      )}
    </>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function NovederadesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();
  const language = useLanguage();
  const es = language === 'es';
  const queryClient = useQueryClient();
  const addNewGiftItem = useAppStore((s) => s.addNewGiftItem);
  const [pendingTickets, setPendingTickets] = useState<FeedbackTicket[]>([]);
  const [userDrops, setUserDrops] = useState<UserDrop[]>([]);

  useEffect(() => {
    AsyncStorage.setItem(NOVEDADES_STORAGE_KEY, new Date().toISOString()).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${BACKEND_URL}/api/support/tickets/${user.id}`)
      .then(r => r.json())
      .then((data: { tickets?: FeedbackTicket[] }) => {
        const fb = (data.tickets ?? []).filter(t => t.type === 'feedback' && (t.status === 'waiting_user' || t.status === 'needs_human' || t.status === 'open'));
        setPendingTickets(fb);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${BACKEND_URL}/api/gifts/user-drops?userId=${user.id}`)
      .then(r => r.json())
      .then((data: { gifts?: UserDrop[] }) => { setUserDrops(data.gifts ?? []); })
      .catch(() => {});
  }, [user?.id]);

  const refreshTickets = useCallback(() => {
    if (!user?.id) return;
    fetch(`${BACKEND_URL}/api/support/tickets/${user.id}`)
      .then(r => r.json())
      .then((data: { tickets?: FeedbackTicket[] }) => {
        const fb = (data.tickets ?? []).filter(t => t.type === 'feedback' && t.status === 'waiting_user');
        setPendingTickets(fb);
      })
      .catch(() => {});
  }, [user?.id]);

  const handleClaimDrop = useCallback(async (drop: UserDrop) => {
    if (!user?.id) return;
    await gamificationApi.claimGift(user.id, drop.giftDropId);
    if (drop.rewardId) addNewGiftItem(drop.rewardId);
    queryClient.invalidateQueries({ queryKey: ['allStoreItems'] });
    queryClient.invalidateQueries({ queryKey: ['backendUser'] });
    fetch(`${BACKEND_URL}/api/gifts/user-drops?userId=${user.id}`)
      .then(r => r.json())
      .then((data: { gifts?: UserDrop[] }) => setUserDrops(data.gifts ?? []))
      .catch(() => {});
  }, [user?.id, addNewGiftItem, queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <View>
            <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
              {es ? 'Novedades' : "What's New"}
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
              {es ? 'Últimas actualizaciones de la app' : 'Latest app updates'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Star size={12} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              {es ? 'ABRIL 2026' : 'APRIL 2026'}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          </View>

          {userDrops.length > 0 && userDrops.map((drop) => (
            <DropNewsCard key={drop.userGiftId} drop={drop} language={language} onClaim={handleClaimDrop} onGoToStore={() => router.push('/(tabs)/store')} />
          ))}

          {NEWS_ITEMS.map((item) => (
            <NewsCard key={item.id} item={item} language={language} />
          ))}

          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
            <BookOpen size={16} color="#9CA3AF" />
            <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
              {es ? 'Más novedades aparecerán aquí con cada actualización' : 'More updates will appear here with each release'}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginBottom: 16 }} />

          {user?.id ? (
            <>
              <PendingFeedbackBanner tickets={pendingTickets} userId={user.id} onDismiss={refreshTickets} />
              <FeedbackForm userId={user.id} />
            </>
          ) : (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }}>
              <MessageSquare size={20} color="#9CA3AF" />
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                {es ? 'Inicia sesión para enviar comentarios' : 'Sign in to send feedback'}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
