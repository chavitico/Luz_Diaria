// Admin Dashboard — full-screen admin panel
// Triggered via secret 5-tap on version number in Settings

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  ChevronLeft,
  Crown,
  Shield,
  Palette,
  Database,
  Gift,
  Ticket,
  Users,
  Tag,
  MessageSquareHeart,
  Flame,
  BookOpen,
  Clock,
  Swords,
  Bot,
  Star,
  Coins,
  Package,
  Camera,
  Wifi,
  RefreshCw,
  TrendingUp,
  Activity,
  BarChart3,
  Volume2,
  Layers,
} from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';
import { useAdminRole } from '@/hooks/useAdminRole';
import { fetchWithTimeout } from '@/lib/fetch';
import {
  getCachedDates,
  getLastPrefetchTime,
  prefetchDevotionals,
  getCRToday,
} from '@/lib/devotional-cache';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ── Types ──────────────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

interface AdminStats {
  nuevosUsuarios: number;
  totalUsers: number;
  visitas: number;
  visitasUnicas: number;
  tiempoAppSeconds: number;
  devocionales: number;
  duelosPersona: number;
  duelosBot: number;
  estudios: number;
  puntosAsignados: number;
  puntosConsumidos: number;
  sobresTotal: number;
  sobresGratis: number;
  ttsUsers: number;
}

interface TabMetricItem {
  screen: string;
  users: number;
  totalSeconds: number;
}

interface OnlineUser {
  id: string;
  nickname: string;
  role: string;
  countryCode: string | null;
  lastSeenAt: string;
}

// ── Period filter config ───────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
  { key: 'all', label: 'Siempre' },
];

// ── Tab display config ─────────────────────────────────────────────────────────

const TAB_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  devotional:   { label: 'Devocional Hoy',    emoji: '📖', color: '#F59E0B' },
  bible:        { label: 'Biblia',             emoji: '✝️',  color: '#3B82F6' },
  studies:      { label: 'Estudios',           emoji: '🎓', color: '#10B981' },
  library:      { label: 'Biblioteca',         emoji: '📚', color: '#8B5CF6' },
  community:    { label: 'Comunidad',          emoji: '🤝', color: '#EC4899' },
  prayer:       { label: 'Oración',            emoji: '🙏', color: '#6366F1' },
  store:        { label: 'Tienda (otros)',      emoji: '🛒', color: '#F97316' },
  store_album:  { label: 'Tienda · Álbum Cromos', emoji: '🃏', color: '#FB923C' },
  store_trivia: { label: 'Tienda · Trivia Bíblica', emoji: '⚡', color: '#FBBF24' },
  settings:     { label: 'Ajustes',            emoji: '⚙️',  color: '#6B7280' },
};

// ── Module definitions ─────────────────────────────────────────────────────────

function useModules(pendingTickets: number, pendingTestimonies: number, isOwner: boolean, isModerator: boolean) {
  const all = [
    { id: 'branding', icon: Palette, label: 'Branding', color: '#F59E0B', route: '/admin/branding', ownerOnly: true },
    { id: 'backup', icon: Database, label: 'Backups', color: '#3B82F6', route: '/admin/backup', ownerOnly: true },
    { id: 'gifts', icon: Gift, label: 'Drops', color: '#8B5CF6', route: '/admin/gifts', ownerOnly: true },
    { id: 'support', icon: Ticket, label: 'Soporte', color: '#10B981', route: '/admin/support', ownerOnly: false, badge: pendingTickets },
    { id: 'users', icon: Users, label: 'Usuarios', color: '#6366F1', route: '/admin/moderators', ownerOnly: true },
    { id: 'promo', icon: Tag, label: 'Códigos', color: '#F97316', route: '/admin/promo-codes', ownerOnly: true },
    { id: 'testimonies', icon: MessageSquareHeart, label: 'Testimonios', color: '#EC4899', route: '/admin/testimonies', ownerOnly: false, badge: pendingTestimonies },
  ];
  return all.filter((m) => {
    if (isOwner) return true;
    if (isModerator) return !m.ownerOnly;
    return false;
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatBigNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function countryFlag(code: string): string {
  return code.toUpperCase().split('').map((c) => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('');
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PeriodPill({
  item, selected, onPress, colors,
}: {
  item: typeof PERIODS[0];
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: selected ? colors.primary : colors.surface,
        marginRight: 8,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? '#FFF' : colors.textMuted }}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function MetricCard({
  icon: Icon, label, value, subLabel, color, loading, colors,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  subLabel?: string;
  color: string;
  loading: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={{
      flex: 1,
      borderRadius: 16,
      backgroundColor: color + '12',
      borderWidth: 1,
      borderColor: color + '22',
      padding: 14,
      minHeight: 96,
      justifyContent: 'space-between',
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: color + '25',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      }}>
        <Icon size={16} color={color} />
      </View>
      {loading
        ? <ActivityIndicator size="small" color={color} style={{ alignSelf: 'flex-start' }} />
        : (
          <>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
              {value}
            </Text>
            {subLabel && (
              <Text style={{ fontSize: 10, fontWeight: '600', color, letterSpacing: 0.2 }}>
                {subLabel}
              </Text>
            )}
          </>
        )}
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, lineHeight: 15 }}>
        {label}
      </Text>
    </View>
  );
}

function ModuleCard({
  module, badge, onPress, colors,
}: {
  module: ReturnType<typeof useModules>[0];
  badge?: number;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const Icon = module.icon;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? module.color + '15' : colors.surface,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: pressed ? module.color + '40' : 'transparent',
      })}
    >
      <View style={{ position: 'relative' }}>
        <View style={{
          width: 44, height: 44, borderRadius: 14,
          backgroundColor: module.color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={module.color} />
        </View>
        {(badge ?? 0) > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            backgroundColor: '#EF4444',
            alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 4,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFF' }}>
              {badge! > 99 ? '99+' : String(badge)}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
        {module.label}
      </Text>
    </Pressable>
  );
}

function OnlineUserChip({ u, colors }: { u: OnlineUser; colors: ReturnType<typeof useThemeColors> }) {
  const roleColor = u.role === 'OWNER' ? '#F59E0B' : u.role === 'MODERATOR' ? '#3B82F6' : colors.textMuted;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.surface, borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 6, marginRight: 8,
    }}>
      <View style={{
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E',
      }} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{u.nickname}</Text>
      {u.countryCode && (
        <Text style={{ fontSize: 11 }}>{countryFlag(u.countryCode)}</Text>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const colors = useThemeColors();
  const user = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [active, setActive] = useState(false);
  const { role, checking, isOwner, isModerator, isAdmin, pendingTickets, pendingTestimonies, reload } = useAdminRole(active);

  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Owner tools state
  const [generatingSnapshots, setGeneratingSnapshots] = useState(false);
  const [devCacheExpanded, setDevCacheExpanded] = useState(false);
  const [featureUsageExpanded, setFeatureUsageExpanded] = useState(false);
  const [tabMetrics, setTabMetrics] = useState<TabMetricItem[]>([]);
  const [tabMetricsLoading, setTabMetricsLoading] = useState(false);
  const [cachedDates, setCachedDates] = useState<string[]>([]);
  const [lastPrefetch, setLastPrefetch] = useState<number | null>(null);
  const [forcePrefetching, setForcePrefetching] = useState(false);

  const modules = useModules(pendingTickets, pendingTestimonies, isOwner, isModerator);

  // Activate role checking when screen is focused
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, [])
  );

  // Load stats when period changes or role is confirmed
  const loadStats = useCallback(async () => {
    if (!user?.id || !isOwner) return;
    setStatsLoading(true);
    try {
      const res = await fetchWithTimeout(
        `${BACKEND_URL}/api/admin/stats?period=${period}`,
        { headers: { 'X-User-Id': user.id } }
      );
      if (res.ok) {
        const data = await res.json() as { stats: AdminStats; onlineUsers: OnlineUser[] };
        setStats(data.stats);
        setOnlineUsers(data.onlineUsers ?? []);
      }
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id, isOwner, period]);

  useEffect(() => {
    if (isOwner) loadStats();
  }, [isOwner, period, loadStats]);

  const loadDevCacheInfo = useCallback(async () => {
    const [dates, ts] = await Promise.all([getCachedDates(), getLastPrefetchTime()]);
    setCachedDates(dates);
    setLastPrefetch(ts);
  }, []);

  const loadTabMetrics = useCallback(async () => {
    if (!user?.id || !isOwner) return;
    setTabMetricsLoading(true);
    try {
      const res = await fetchWithTimeout(
        `${BACKEND_URL}/api/admin/stats/tabs?period=${period}`,
        { headers: { 'X-User-Id': user.id } }
      );
      if (res.ok) {
        const data = await res.json() as { items: TabMetricItem[] };
        setTabMetrics(data.items ?? []);
      }
    } catch {
      // silent
    } finally {
      setTabMetricsLoading(false);
    }
  }, [user?.id, isOwner, period]);

  useEffect(() => {
    if (isOwner && devCacheExpanded) loadDevCacheInfo();
  }, [isOwner, devCacheExpanded, loadDevCacheInfo]);

  useEffect(() => {
    if (isOwner && featureUsageExpanded) loadTabMetrics();
  }, [isOwner, featureUsageExpanded, period, loadTabMetrics]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    reload();
    await Promise.all([
      loadStats(),
      featureUsageExpanded ? loadTabMetrics() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [reload, loadStats, loadTabMetrics, featureUsageExpanded]);

  const handleNavigate = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as Parameters<typeof router.push>[0]);
  }, [router]);

  const roleLabel = isOwner ? 'Owner' : 'Moderador';
  const roleColor = isOwner ? '#F59E0B' : '#10B981';
  const RoleIcon = isOwner ? Crown : Shield;

  // ── Loading / No Access ──────────────────────────────────────────────────────

  if (checking && !isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Verificando acceso…</Text>
      </View>
    );
  }

  if (!checking && !isAdmin && role !== null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🔒</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Sin acceso</Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
          Tu cuenta no tiene permisos de administrador.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main Dashboard ───────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.textMuted + '15',
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
            Admin Dashboard
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <RoleIcon size={11} color={roleColor} />
            <Text style={{ fontSize: 11, color: roleColor, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {checking && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Period Filter ── */}
        {isOwner && (
          <Animated.View entering={FadeInDown.duration(200).delay(50)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14 }}
              style={{ flexGrow: 0 }}
            >
              {PERIODS.map((p) => (
                <PeriodPill
                  key={p.key}
                  item={p}
                  selected={period === p.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPeriod(p.key);
                  }}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Metrics Grid (OWNER only) ── */}
        {isOwner && (
          <Animated.View entering={FadeInDown.duration(250).delay(80)} style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
              <BarChart3 size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Métricas
              </Text>
            </View>

            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <MetricCard
                icon={Users} label="Usuarios registrados"
                value={stats ? formatBigNumber(stats.totalUsers) : '—'}
                subLabel={stats ? `+${stats.nuevosUsuarios} nuevos` : undefined}
                color="#6366F1" loading={statsLoading} colors={colors}
              />
              <MetricCard
                icon={Activity} label="Visitas / Sesiones"
                value={stats ? formatBigNumber(stats.visitas) : '—'}
                subLabel={stats ? `${stats.visitasUnicas} usuarios únicos` : undefined}
                color="#10B981" loading={statsLoading} colors={colors}
              />
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <MetricCard
                icon={Clock} label="Tiempo en app"
                value={stats ? formatSeconds(stats.tiempoAppSeconds) : '—'}
                color="#8B5CF6" loading={statsLoading} colors={colors}
              />
              <MetricCard
                icon={BookOpen} label="Devocionales completados"
                value={stats ? formatBigNumber(stats.devocionales) : '—'}
                color="#F59E0B" loading={statsLoading} colors={colors}
              />
            </View>

            {/* Row 3 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <MetricCard
                icon={Swords} label="Duelos vs persona"
                value={stats ? formatBigNumber(stats.duelosPersona) : '—'}
                color="#EF4444" loading={statsLoading} colors={colors}
              />
              <MetricCard
                icon={Bot} label="Duelos vs bot"
                value={stats ? formatBigNumber(stats.duelosBot) : '—'}
                color="#F97316" loading={statsLoading} colors={colors}
              />
            </View>

            {/* Row 4 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <MetricCard
                icon={Star} label="Estudios completados"
                value={stats ? formatBigNumber(stats.estudios) : '—'}
                color="#06B6D4" loading={statsLoading} colors={colors}
              />
              <MetricCard
                icon={Package} label="Sobres abiertos"
                value={stats ? formatBigNumber(stats.sobresTotal) : '—'}
                subLabel={stats ? `${stats.sobresGratis} gratis` : undefined}
                color="#EC4899" loading={statsLoading} colors={colors}
              />
            </View>

            {/* Row 5 */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <MetricCard
                icon={TrendingUp} label="Puntos asignados"
                value={stats ? formatBigNumber(stats.puntosAsignados) : '—'}
                color="#22C55E" loading={statsLoading} colors={colors}
              />
              <MetricCard
                icon={Coins} label="Puntos consumidos"
                value={stats ? formatBigNumber(stats.puntosConsumidos) : '—'}
                color="#F43F5E" loading={statsLoading} colors={colors}
              />
            </View>

            {/* Row 6: TTS usage */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
              <MetricCard
                icon={Volume2} label="Usaron TTS (audio)"
                value={stats ? formatBigNumber(stats.ttsUsers) : '—'}
                subLabel={stats && stats.visitasUnicas > 0
                  ? `${Math.round((stats.ttsUsers / stats.visitasUnicas) * 100)}% de visitantes únicos`
                  : undefined}
                color="#06B6D4" loading={statsLoading} colors={colors}
              />
              <View style={{ flex: 1 }} />
            </View>
          </Animated.View>
        )}

        {/* ── Online Users ── */}
        <Animated.View entering={FadeInDown.duration(250).delay(120)} style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              En línea ahora
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              ({onlineUsers.length})
            </Text>
          </View>
          {onlineUsers.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, fontStyle: 'italic' }}>
              Nadie conectado en este momento
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              style={{ flexGrow: 0 }}
            >
              {onlineUsers.map((u) => (
                <OnlineUserChip key={u.id} u={u} colors={colors} />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Modules Grid ── */}
        <Animated.View entering={FadeInDown.duration(250).delay(150)} style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Módulos
            </Text>
          </View>

          {/* Chunk into rows of 3 */}
          {Array.from({ length: Math.ceil(modules.length / 3) }).map((_, rowIdx) => {
            const row = modules.slice(rowIdx * 3, rowIdx * 3 + 3);
            return (
              <View key={rowIdx} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                {row.map((m) => (
                  <ModuleCard
                    key={m.id}
                    module={m}
                    badge={m.badge}
                    onPress={() => handleNavigate(m.route)}
                    colors={colors}
                  />
                ))}
                {/* Fill empty slots */}
                {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={{ flex: 1 }} />
                ))}
              </View>
            );
          })}
        </Animated.View>

        {/* ── Uso de funciones ── */}
        {isOwner && (
          <Animated.View entering={FadeInDown.duration(250).delay(180)} style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
              <Layers size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Uso de funciones
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFeatureUsageExpanded((p) => !p);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 14, paddingHorizontal: 16,
                borderRadius: 16,
                marginBottom: featureUsageExpanded ? 0 : 0,
                backgroundColor: pressed ? '#6366F115' : colors.surface,
                borderBottomLeftRadius: featureUsageExpanded ? 0 : 16,
                borderBottomRightRadius: featureUsageExpanded ? 0 : 16,
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F120', marginRight: 12 }}>
                <BarChart3 size={20} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Tiempo por sección</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {featureUsageExpanded ? 'Toca para ocultar' : 'Toca para ver el detalle'}
                </Text>
              </View>
              {tabMetricsLoading && <ActivityIndicator size="small" color="#6366F1" />}
            </Pressable>

            {featureUsageExpanded && (
              <View style={{
                backgroundColor: colors.surface, borderRadius: 16, marginBottom: 0,
                borderTopLeftRadius: 0, borderTopRightRadius: 0,
                paddingHorizontal: 16, paddingVertical: 14, gap: 12,
              }}>
                {tabMetrics.length === 0 && !tabMetricsLoading ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 }}>
                    Sin datos para este período
                  </Text>
                ) : (() => {
                  const maxUsers = Math.max(...tabMetrics.map(t => t.users), 1);
                  return tabMetrics.map((item) => {
                    const cfg = TAB_CONFIG[item.screen] ?? { label: item.screen, emoji: '📱', color: '#6B7280' };
                    const barPct = (item.users / maxUsers) * 100;
                    const mins = Math.round(item.totalSeconds / 60);
                    return (
                      <View key={item.screen}>
                        {/* Label row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                            {cfg.emoji} {cfg.label}
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.color }}>
                            {item.users} {item.users === 1 ? 'persona' : 'personas'} · {mins < 1 ? '<1' : mins} min
                          </Text>
                        </View>
                        {/* Bar */}
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.textMuted + '20' }}>
                          <View style={{
                            height: 6, borderRadius: 3,
                            backgroundColor: cfg.color,
                            width: `${barPct}%`,
                          }} />
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── Owner Tools ── */}
        {isOwner && (
          <Animated.View entering={FadeInDown.duration(250).delay(200)} style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Herramientas Owner
              </Text>
            </View>

            {/* Generate Snapshots */}
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setGeneratingSnapshots(true);
                try {
                  const res = await fetchWithTimeout(`${BACKEND_URL}/api/admin/snapshots/generate`, {
                    method: 'POST',
                    headers: { 'X-User-Id': user?.id ?? '' },
                  });
                  const data = await res.json() as { success: boolean; date?: string; processed?: number; created?: number; errors?: number };
                  if (data.success) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Snapshots generados', `Fecha: ${data.date}\nProcesados: ${data.processed}\nCreados: ${data.created}\nErrores: ${data.errors}`);
                  } else {
                    Alert.alert('Error', 'No se pudieron generar snapshots');
                  }
                } catch (e) {
                  Alert.alert('Error', String(e));
                } finally {
                  setGeneratingSnapshots(false);
                }
              }}
              disabled={generatingSnapshots}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 14, paddingHorizontal: 16,
                borderRadius: 16, marginBottom: 10,
                backgroundColor: pressed ? '#0EA5E915' : colors.surface,
                opacity: generatingSnapshots ? 0.6 : 1,
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0EA5E920', marginRight: 12 }}>
                {generatingSnapshots ? <ActivityIndicator size="small" color="#0EA5E9" /> : <Camera size={20} color="#0EA5E9" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Generar Snapshots</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Forzar snapshot de todos los usuarios</Text>
              </View>
            </Pressable>

            {/* DevCache */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDevCacheExpanded((p) => !p);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 14, paddingHorizontal: 16,
                borderRadius: 16,
                marginBottom: devCacheExpanded ? 0 : 10,
                backgroundColor: pressed ? '#10B98115' : colors.surface,
                borderBottomLeftRadius: devCacheExpanded ? 0 : 16,
                borderBottomRightRadius: devCacheExpanded ? 0 : 16,
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B98120', marginRight: 12 }}>
                <Wifi size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>DevCache</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{cachedDates.length} fechas cacheadas</Text>
              </View>
            </Pressable>

            {devCacheExpanded && (
              <View style={{
                backgroundColor: colors.surface, borderRadius: 16, marginBottom: 10,
                borderTopLeftRadius: 0, borderTopRightRadius: 0,
                paddingHorizontal: 16, paddingVertical: 14, gap: 8,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.textMuted + '20' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Último prefetch</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                    {lastPrefetch ? new Date(lastPrefetch).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Hoy CR</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>{getCRToday()}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>
                  Fechas ({cachedDates.length})
                </Text>
                {cachedDates.length === 0
                  ? <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>Sin caché</Text>
                  : cachedDates.map((date) => {
                      const isToday = date === getCRToday();
                      return (
                        <View key={date} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isToday ? '#10B981' : colors.textMuted + '60' }} />
                          <Text style={{ fontSize: 12, color: isToday ? '#10B981' : colors.text, fontWeight: isToday ? '700' : '400' }}>
                            {date}{isToday ? ' ← hoy' : ''}
                          </Text>
                        </View>
                      );
                    })}
                <Pressable
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setForcePrefetching(true);
                    try {
                      const result = await prefetchDevotionals(true);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('Prefetch forzado', `Descargados: ${result.fetched}/${result.total}\nFechas: ${result.dates.join(', ')}`);
                      await loadDevCacheInfo();
                    } catch (e) {
                      Alert.alert('Error', String(e));
                    }
                    setForcePrefetching(false);
                  }}
                  disabled={forcePrefetching}
                  style={({ pressed }) => ({
                    marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 8, paddingVertical: 10, borderRadius: 12,
                    backgroundColor: pressed ? '#10B98130' : '#10B98118',
                    borderWidth: 1, borderColor: '#10B98140',
                    opacity: forcePrefetching ? 0.6 : 1,
                  })}
                >
                  {forcePrefetching ? <ActivityIndicator size="small" color="#10B981" /> : <RefreshCw size={14} color="#10B981" />}
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>
                    {forcePrefetching ? 'Descargando…' : 'Forzar prefetch ahora'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Challenges testing */}
            <View style={{
              padding: 14, borderRadius: 16, borderWidth: 1,
              borderColor: '#F9731630', backgroundColor: '#F9731608',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Desafíos (testing)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={async () => {
                    if (!user?.id) return;
                    try {
                      const res = await fetchWithTimeout(`${BACKEND_URL}/api/gamification/challenges/admin/force-complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      const data = await res.json() as { success?: boolean; challengesCompleted?: number; error?: string };
                      Alert.alert('Desafíos', data.success ? `${data.challengesCompleted} completados` : (data.error ?? 'Error'));
                    } catch (e) { Alert.alert('Error', String(e)); }
                  }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F9731618', borderWidth: 1, borderColor: '#F9731640' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316' }}>Completar todos</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!user?.id) return;
                    try {
                      const res = await fetchWithTimeout(`${BACKEND_URL}/api/gamification/challenges/admin/reset`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      const data = await res.json() as { success?: boolean; error?: string };
                      Alert.alert('Desafíos', data.success ? 'Progreso reseteado' : (data.error ?? 'Error'));
                    } catch (e) { Alert.alert('Error', String(e)); }
                  }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: '#EF444418', borderWidth: 1, borderColor: '#EF444440' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Resetear</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
