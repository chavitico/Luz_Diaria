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
  Mail,
  MessageSquare,
  Repeat2,
  Send,
  Shield,
  Sparkles,
  Star,
  Languages,
  X,
} from 'lucide-react-native';
import { useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const NOVEDADES_STORAGE_KEY = '@novedades_last_opened';
export const LATEST_NEWS_DATE = '2026-04-27';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  date: string;
  category: 'feature' | 'update' | 'info';
  categoryLabel: string;
  emoji: string;
  accentColor: string;
  accentBg: string;
  title: string;
  summary: string;
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
    id: 'heroes-album-2026-04',
    date: '2026-04-27',
    category: 'feature',
    categoryLabel: 'Nueva Colección',
    emoji: '⚔️',
    accentColor: '#D4AF37',
    accentBg: '#FFFBF0',
    title: 'Álbum: Héroes de la Fe',
    summary: '26 cromos del Antiguo Testamento — 3 cartas por sobre, carta oculta al completar.',
  },
  {
    id: 'strong-module-2026-04',
    date: '2026-04-27',
    category: 'feature',
    categoryLabel: 'Módulo Bíblico',
    emoji: '📖',
    accentColor: '#8B5CF6',
    accentBg: '#F5F3FF',
    title: 'Strong en la Biblia',
    summary: 'Activa el switch en el lector y toca cualquier palabra para ver su raíz original en hebreo o griego.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Heroes Content ───────────────────────────────────────────────────────────

const HERO_CARDS = [
  {
    url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/oNP9k7H5SQY.png',
    name: 'David vs Goliat',
    rarity: 'épica',
    rarityColor: '#C084FC',
  },
  {
    url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/aSDhQl5W0gY.png',
    name: 'Ester',
    rarity: 'legendaria',
    rarityColor: '#D4AF37',
  },
  {
    url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/rI6GXsz5EfU.png',
    name: 'Elías — Fuego',
    rarity: 'rara',
    rarityColor: '#38BDF8',
  },
  {
    url: 'https://staticfiles.net/s992MiD9pVwEokaNoJW62wGwzPsyGoEAhsBB93ylqQY/d/kUMWcp6SXHw.png',
    name: 'Jesús ✦ Oculta',
    rarity: 'secreta',
    rarityColor: '#FDE68A',
  },
];

function HeroesContent() {
  return (
    <View style={{ gap: 16 }}>
      {/* Intro */}
      <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>
        La colección <Text style={{ color: '#B8860B', fontWeight: '700' }}>Héroes de la Fe</Text> trae{' '}
        <Text style={{ color: '#111827', fontWeight: '600' }}>26 cromos</Text> de personajes y eventos del Antiguo
        Testamento: Noé, Abraham, Moisés, Débora, David, Elías, Daniel, Ester y muchos más.
      </Text>

      {/* Card thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
      >
        {HERO_CARDS.map((card) => (
          <View key={card.url} style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 80,
                height: 120,
                borderRadius: 10,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: card.rarityColor,
                shadowColor: card.rarityColor,
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Image source={{ uri: card.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <Text style={{ color: card.rarityColor, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
              {card.rarity.toUpperCase()}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 10, textAlign: 'center', maxWidth: 80 }}>
              {card.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { icon: '⚔️', label: '25 cartas', sub: 'en el álbum' },
          { icon: '✦', label: '1 oculta', sub: 'al completar' },
          { icon: '📦', label: '3 por sobre', sub: '1,000 pts' },
        ].map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              backgroundColor: 'rgba(212,175,55,0.08)',
              borderRadius: 10,
              padding: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(212,175,55,0.20)',
            }}
          >
            <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
            <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '700', marginTop: 4 }}>{stat.label}</Text>
            <Text style={{ color: '#6B7280', fontSize: 10 }}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      {/* Hidden card teaser */}
      <LinearGradient
        colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)']}
        style={{ borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} color="#D4AF37" />
          <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
            CARTA SECRETA
          </Text>
        </View>
        <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20 }}>
          Completa las <Text style={{ color: '#1F2937', fontWeight: '700' }}>25 cartas</Text> del álbum para
          desbloquear a{' '}
          <Text style={{ color: '#B8860B', fontWeight: '700' }}>Jesús — Autor y Consumador de la Fe</Text>{' '}
          (Hebreos 12:2), una carta legendaria dorada única.
        </Text>
      </LinearGradient>

      {/* Trades */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Repeat2 size={18} color="#34D399" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#34D399', fontWeight: '700', fontSize: 13 }}>Canjes entre jugadores</Text>
          <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 4 }}>
            ¿Tienes duplicados? Puedes enviar y recibir{' '}
            <Text style={{ color: '#374151', fontWeight: '600' }}>hasta 2 canjes por día</Text> con otros
            jugadores desde la sección de Cromos Bíblicos.
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

function AppearancesSection() {
  const [open, setOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.85 },
    });
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  }, [open, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={{ gap: 4 }}>
      {/* Tappable count badge */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: '#5B21B6', fontWeight: '800', fontSize: 16 }}>2,602</Text>
        </View>
        <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 11, letterSpacing: 0.5, flex: 1 }}>
          APARICIONES
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={14} color="#7C3AED" />
        </Animated.View>
      </Pressable>
      <Text style={{ color: '#6B7280', fontSize: 12 }}>Toca para ver los versículos</Text>

      {/* Expanded list */}
      {open && (
        <View style={{ marginTop: 6, gap: 4 }}>
          {SAMPLE_VERSES.map((v) => (
            <View
              key={v.ref}
              style={{
                backgroundColor: '#F5F3FF',
                borderRadius: 8,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ color: '#5B21B6', fontWeight: '700', fontSize: 13 }}>{v.ref}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{v.word}</Text>
              </View>
              <ChevronRight size={14} color="#7C3AED" />
            </View>
          ))}
          <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            Mostrando 10 de 2,602 · En la app verás todas
          </Text>
        </View>
      )}
    </View>
  );
}

function StrongContent() {
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>
        El módulo <Text style={{ color: '#7C3AED', fontWeight: '700' }}>Strong</Text> te permite estudiar el
        significado original de cada palabra bíblica en hebreo (Antiguo Testamento) o griego (Nuevo Testamento).
      </Text>

      {/* Activation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: 'rgba(139,92,246,0.08)',
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.20)',
        }}
      >
        <Languages size={18} color="#A78BFA" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 13 }}>Cómo activarlo</Text>
          <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 4 }}>
            Abre cualquier capítulo en la{' '}
            <Text style={{ color: '#374151', fontWeight: '600' }}>Biblia</Text> y activa el{' '}
            <Text style={{ color: '#374151', fontWeight: '600' }}>switch "Strong"</Text> que aparece en la
            parte superior, junto al buscador. Las palabras con número Strong quedarán subrayadas y en negrita.
          </Text>
        </View>
      </View>

      {/* Mock Strong card */}
      <View style={{ backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, gap: 12 }}>
        {/* Tags */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#FDE8E8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#9B1C1C', fontWeight: '700', fontSize: 12 }}>H430</Text>
          </View>
          <View style={{ backgroundColor: '#FCE7F3', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#9D174D', fontWeight: '700', fontSize: 12 }}>HEBREO</Text>
          </View>
        </View>

        {/* Hebrew + transliteration */}
        <View>
          <Text style={{ fontSize: 28, color: '#7F1D1D', textAlign: 'right', fontWeight: '300', letterSpacing: 2 }}>
            אֱלֹהִים
          </Text>
          <Text style={{ fontSize: 15, color: '#9B1C1C', fontStyle: 'italic', marginTop: 2 }}>
            {'\'ělôhîym'}
          </Text>
          <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '700', marginTop: 4 }}>
            Dios (Elohim), divinidad, seres poderosos
          </Text>
        </View>

        {/* Info grid */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'IDIOMA', value: 'Hebreo' },
            { label: 'CATEGORÍA', value: 'Sustantivo' },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                {item.label}
              </Text>
              <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Appearances — tappable */}
        <AppearancesSection />

        {/* Definition */}
        <View>
          <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 11, letterSpacing: 0.5, marginBottom: 4 }}>
            DEFINICIÓN
          </Text>
          <Text style={{ color: '#374151', fontSize: 13, lineHeight: 19 }}>
            Plural de H433; dioses en el sentido ordinario; especialmente usado del Dios supremo; a veces
            aplicado por deferencia a magistrados y como superlativo.
          </Text>
        </View>
      </View>

      <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
        Toca cualquier cita para ir directamente al versículo en la Biblia
      </Text>
    </View>
  );
}

// ─── Expandable Item ──────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.8 },
    });
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setExpanded((v) => !v);
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: `${item.accentColor}30`,
        backgroundColor: item.accentBg,
        marginBottom: 12,
      }}
    >
      {/* Accent bar */}
      <View style={{ height: 3, backgroundColor: item.accentColor, opacity: 0.7 }} />

      {/* Header row */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => ({
          padding: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {/* Top row: emoji + category + date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: `${item.accentColor}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
            </View>
            <View
              style={{
                backgroundColor: `${item.accentColor}20`,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: `${item.accentColor}40`,
              }}
            >
              <Text style={{ color: item.accentColor, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                {item.categoryLabel.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(item.date)}</Text>
        </View>

        {/* Title + summary */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>
              {item.title}
            </Text>
            {!expanded && (
              <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19 }}>
                {item.summary}
              </Text>
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate }], marginTop: 2 }}>
            <ChevronDown size={18} color={item.accentColor} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          <View
            style={{
              height: 1,
              backgroundColor: `${item.accentColor}20`,
              marginBottom: 16,
            }}
          />
          {item.id.startsWith('heroes') ? <HeroesContent /> : <StrongContent />}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(status);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/support/ticket/${ticketId}`, {
        headers: { 'X-User-Id': userId },
      });
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
    actor === 'ADMIN' ? 'Equipo' : actor === 'SYSTEM' ? 'Sistema' : 'Tú';

  const canReply = ticketStatus === 'waiting_user' || ticketStatus === 'needs_human';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F8F9FA' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 14,
            paddingHorizontal: 20,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: 'rgba(0,0,0,0.06)',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <X size={18} color="#374151" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800' }}>
                Tu comentario
              </Text>
              {incidentNumber && (
                <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 1 }}>{incidentNumber}</Text>
              )}
            </View>
            <View
              style={{
                backgroundColor:
                  ticketStatus === 'waiting_user' ? '#FEF3C7'
                  : ticketStatus === 'needs_human' ? '#EFF6FF'
                  : ticketStatus === 'closed' ? '#F0FDF4'
                  : '#F3F4F6',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color:
                    ticketStatus === 'waiting_user' ? '#D97706'
                    : ticketStatus === 'needs_human' ? '#2563EB'
                    : ticketStatus === 'closed' ? '#16A34A'
                    : '#6B7280',
                }}
              >
                {ticketStatus === 'waiting_user' ? 'Responder'
                  : ticketStatus === 'needs_human' ? 'En revisión'
                  : ticketStatus === 'closed' ? 'Cerrado'
                  : ticketStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Events timeline */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color="#7C3AED" />
            </View>
          )}
          {!loading && events.map((ev, i) => (
            <View key={ev.id} style={{ flexDirection: 'row', gap: 10 }}>
              {/* Actor dot */}
              <View style={{ alignItems: 'center', width: 28 }}>
                <View
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: actorColor(ev.actor) + '18',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: actorColor(ev.actor) + '40',
                  }}
                >
                  {ev.actor === 'ADMIN' ? (
                    <Shield size={13} color={actorColor(ev.actor)} />
                  ) : ev.actor === 'SYSTEM' ? (
                    <Sparkles size={13} color={actorColor(ev.actor)} />
                  ) : (
                    <MessageSquare size={13} color={actorColor(ev.actor)} />
                  )}
                </View>
                {i < events.length - 1 && (
                  <View style={{ width: 1.5, flex: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginTop: 4 }} />
                )}
              </View>
              {/* Bubble */}
              <View
                style={{
                  flex: 1,
                  backgroundColor:
                    ev.actor === 'ADMIN' ? '#F5F3FF'
                    : ev.actor === 'SYSTEM' ? '#F0F9FF'
                    : '#FFFFFF',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor:
                    ev.actor === 'ADMIN' ? 'rgba(124,58,237,0.12)'
                    : ev.actor === 'SYSTEM' ? 'rgba(14,165,233,0.12)'
                    : 'rgba(0,0,0,0.07)',
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11, fontWeight: '700',
                    color: actorColor(ev.actor),
                    marginBottom: 4,
                    letterSpacing: 0.4,
                  }}
                >
                  {actorLabel(ev.actor).toUpperCase()}
                </Text>
                <Text style={{ color: '#374151', fontSize: 13, lineHeight: 19 }}>
                  {ev.message}
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 6 }}>
                  {new Date(ev.createdAt).toLocaleString('es-ES', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
          {!loading && events.length === 0 && (
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 40 }}>
              Sin mensajes aún
            </Text>
          )}
        </ScrollView>

        {/* Reply box (only if can reply) */}
        {canReply && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 12,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  minHeight: 44, maxHeight: 120,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingHorizontal: 14, paddingVertical: 10,
                  fontSize: 14, color: '#111827',
                  borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
                }}
                value={reply}
                onChangeText={setReply}
                placeholder="Escribe tu respuesta..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <Pressable
                onPress={sendReply}
                disabled={!reply.trim() || sending}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: reply.trim() ? '#7C3AED' : '#E5E7EB',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Send size={18} color={reply.trim() ? '#fff' : '#9CA3AF'} />
                }
              </Pressable>
            </View>
          </View>
        )}
        {ticketStatus === 'closed' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 12, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Este hilo está cerrado</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Feedback Form ─────────────────────────────────────────────────────────────

function FeedbackForm({ userId }: { userId: string }) {
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
        body: JSON.stringify({
          userId,
          type: 'feedback',
          clientClaim: { title: title.trim(), comment: comment.trim() },
        }),
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
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(124,58,237,0.15)',
          alignItems: 'center',
          gap: 10,
          marginTop: 8,
        }}
      >
        <View
          style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: '#F0FDF4',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: '#BBF7D0',
          }}
        >
          <CheckCircle size={26} color="#16A34A" />
        </View>
        <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
          ¡Gracias por tu comentario!
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
          Recibimos tu mensaje y recibirás respuesta pronto.
        </Text>
        {incidentNumber && (
          <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '600' }}>{incidentNumber}</Text>
        )}
        {ticketId && (
          <Pressable
            onPress={() => setShowConv(true)}
            style={({ pressed }) => ({
              marginTop: 4,
              backgroundColor: '#F5F3FF',
              borderRadius: 10,
              paddingHorizontal: 16, paddingVertical: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 13 }}>
              Ver conversación
            </Text>
          </Pressable>
        )}
        {showConv && ticketId && (
          <ConversationModal
            ticketId={ticketId}
            incidentNumber={incidentNumber}
            status="needs_human"
            onClose={() => setShowConv(false)}
            userId={userId}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(124,58,237,0.15)',
        marginTop: 8,
        gap: 12,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: '#F5F3FF',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
          }}
        >
          <MessageSquare size={18} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#111827', fontSize: 15, fontWeight: '800' }}>
            Enviar comentarios
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
            Sugerencias o ideas para el equipo
          </Text>
        </View>
      </View>

      {/* Title input */}
      <TextInput
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 10,
          fontSize: 14, color: '#111827',
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
        }}
        value={title}
        onChangeText={setTitle}
        placeholder="Título (opcional)"
        placeholderTextColor="#9CA3AF"
        maxLength={100}
      />

      {/* Comment input */}
      <TextInput
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 10,
          fontSize: 14, color: '#111827',
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          minHeight: 100,
          textAlignVertical: 'top',
        }}
        value={comment}
        onChangeText={setComment}
        placeholder="Cuéntanos tu sugerencia, idea o comentario..."
        placeholderTextColor="#9CA3AF"
        multiline
        maxLength={1000}
      />

      {/* Submit */}
      <Pressable
        onPress={submit}
        disabled={!comment.trim() || submitting}
        style={({ pressed }) => ({
          backgroundColor: comment.trim() ? '#7C3AED' : '#E5E7EB',
          borderRadius: 12,
          paddingVertical: 13,
          alignItems: 'center',
          opacity: pressed ? 0.8 : 1,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        })}
      >
        {submitting
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <Send size={15} color={comment.trim() ? '#fff' : '#9CA3AF'} />
              <Text style={{ color: comment.trim() ? '#fff' : '#9CA3AF', fontWeight: '700', fontSize: 14 }}>
                Enviar
              </Text>
            </>
        }
      </Pressable>
    </View>
  );
}

// ─── Pending Feedback Banner ────────────────────────────────────────────────────

function PendingFeedbackBanner({
  tickets,
  userId,
  onDismiss,
}: {
  tickets: FeedbackTicket[];
  userId: string;
  onDismiss: () => void;
}) {
  const [openTicket, setOpenTicket] = useState<FeedbackTicket | null>(null);

  if (tickets.length === 0) return null;

  const pendingTickets = tickets.filter(t => t.status === 'waiting_user');
  if (pendingTickets.length === 0) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpenTicket(pendingTickets[0])}
        style={({ pressed }) => ({
          backgroundColor: '#FEF3C7',
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: '#FDE68A',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: '#FEF9C3',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#FDE047',
          }}
        >
          <Mail size={18} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '800' }}>
            {pendingTickets.length === 1
              ? 'El equipo te respondió'
              : `${pendingTickets.length} respuestas del equipo`}
          </Text>
          <Text style={{ color: '#B45309', fontSize: 12, marginTop: 1 }}>
            Toca para ver la respuesta y continuar la conversación
          </Text>
        </View>
        <ChevronRight size={16} color="#D97706" />
      </Pressable>

      {openTicket && (
        <ConversationModal
          ticketId={openTicket.id}
          incidentNumber={openTicket.incidentNumber}
          status={openTicket.status}
          onClose={() => { setOpenTicket(null); onDismiss(); }}
          userId={userId}
        />
      )}
    </>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function NovederadesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUser();
  const [pendingTickets, setPendingTickets] = useState<FeedbackTicket[]>([]);

  useEffect(() => {
    AsyncStorage.setItem(NOVEDADES_STORAGE_KEY, new Date().toISOString()).catch(() => {});
  }, []);

  // Load pending feedback tickets
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

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        {/* Back + title row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(0,0,0,0.07)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ArrowLeft size={20} color="#374151" />
          </Pressable>
          <View>
            <Text style={{ color: '#111827', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
              Novedades
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
              Últimas actualizaciones de la app
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pending responses banner */}
          {user?.id && (
            <PendingFeedbackBanner
              tickets={pendingTickets}
              userId={user.id}
              onDismiss={refreshTickets}
            />
          )}

          {/* Section label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Star size={12} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              ABRIL 2026
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          </View>

          {NEWS_ITEMS.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
            <BookOpen size={16} color="#9CA3AF" />
            <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
              Más novedades aparecerán aquí con cada actualización
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginBottom: 16 }} />

          {/* Feedback form — anchored at bottom */}
          {user?.id
            ? <FeedbackForm userId={user.id} />
            : (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }}>
                <MessageSquare size={20} color="#9CA3AF" />
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                  Inicia sesión para enviar comentarios
                </Text>
              </View>
            )
          }
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
