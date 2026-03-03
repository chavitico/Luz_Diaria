// Admin Users Screen — full user management table
// Replaces the old Moderators screen; accessible from Admin Hub

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import {
  X,
  Search,
  Shield,
  ShieldOff,
  Users,
  Copy,
  Check,
  Flame,
  BookOpen,
  Coins,
  Award,
  Wrench,
  Gift,
  Filter,
  ChevronDown,
  AlertTriangle,
  Clock,
  TriangleAlert,
  Crown,
} from 'lucide-react-native';
import { useThemeColors, useUser } from '@/lib/store';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BadgeInfo {
  id: string;
  nameEs: string;
  nameEn: string;
  unknown: boolean;
}

interface AdminUserRow {
  id: string;
  nickname: string;
  role: string;
  countryCode: string | null;
  streakCurrent: number;
  streakBest: number;
  devotionalsCompleted: number;
  completionsLast7Days: number;
  points: number;
  lastActiveAt: string | null;
  activeBadgeId: string | null;
  badges: BadgeInfo[];
  hasIssues: boolean;
  createdAt: string;
}

interface StoreItemSimple {
  id: string;
  nameEs: string;
  nameEn: string;
  type: string;
  rarity: string;
  pricePoints: number;
}

type RoleFilter = '' | 'USER' | 'MODERATOR' | 'OWNER';

// ─── Role chip ────────────────────────────────────────────────────────────────
function RoleChip({ role }: { role: string }) {
  const color =
    role === 'OWNER'     ? '#F59E0B' :
    role === 'MODERATOR' ? '#3B82F6' :
                           '#6B7280';
  const label =
    role === 'OWNER'     ? 'Owner' :
    role === 'MODERATOR' ? 'Mod' :
                           'User';
  return (
    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: color + '20' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

// ─── Compact user card ────────────────────────────────────────────────────────
function UserCard({
  user,
  isOwner,
  currentUserId,
  onToggleMod,
  onViewDetail,
  onCompensate,
  onFixBadges,
  togglingId,
  colors,
}: {
  user: AdminUserRow;
  isOwner: boolean;
  currentUserId: string;
  onToggleMod: (u: AdminUserRow) => void;
  onViewDetail: (u: AdminUserRow) => void;
  onCompensate: (u: AdminUserRow) => void;
  onFixBadges: (u: AdminUserRow) => void;
  togglingId: string | null;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const [copied, setCopied] = useState(false);
  const isSelf = user.id === currentUserId;
  const shortId = user.id.slice(-8);

  const handleCopy = () => {
    Clipboard.setString(user.id);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 1500);
  };

  const visibleBadges = user.badges.slice(0, 2);
  const extraBadges   = user.badges.length - 2;

  const lastActive = user.lastActiveAt
    ? (() => {
        const diff = Date.now() - new Date(user.lastActiveAt).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        return `Hace ${days}d`;
      })()
    : '—';

  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <View
        style={{
          marginHorizontal: 12,
          marginBottom: 8,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: user.hasIssues ? 1 : 0,
          borderColor: user.hasIssues ? '#F59E0B50' : 'transparent',
          overflow: 'hidden',
        }}
      >
        {/* Top row: nickname + role + uid */}
        <Pressable onPress={() => onViewDetail(user)} style={{ padding: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {/* Avatar emoji */}
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: user.role === 'OWNER' ? '#F59E0B18' : user.role === 'MODERATOR' ? '#3B82F618' : colors.background,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 18 }}>
                {user.role === 'OWNER' ? '👑' : user.role === 'MODERATOR' ? '🛡️' : '👤'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                  {user.nickname}
                </Text>
                {isSelf && (
                  <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500' }}>(tú)</Text>
                )}
                {user.hasIssues && (
                  <TriangleAlert size={13} color="#F59E0B" />
                )}
              </View>

              {/* UID row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>
                  …{shortId}
                </Text>
                <Pressable onPress={handleCopy} hitSlop={6}>
                  {copied
                    ? <Check size={11} color="#22C55E" />
                    : <Copy size={11} color={colors.textMuted + '90'} />}
                </Pressable>
              </View>
            </View>

            <RoleChip role={user.role} />
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Flame size={12} color="#F97316" />
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{user.streakCurrent}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <BookOpen size={12} color="#6366F1" />
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{user.devotionalsCompleted}</Text>
              {user.completionsLast7Days > 0 && (
                <Text style={{ fontSize: 10, color: '#22C55E' }}>(+{user.completionsLast7Days} 7d)</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Coins size={12} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>
                {user.points >= 1000 ? `${(user.points / 1000).toFixed(1)}k` : user.points}
              </Text>
            </View>
            {user.countryCode && (
              <Text style={{ fontSize: 12 }}>{countryFlag(user.countryCode)}</Text>
            )}
            <View style={{ flex: 1, alignItems: 'flex-end', flexDirection: 'row', gap: 3, justifyContent: 'flex-end' }}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{lastActive}</Text>
            </View>
          </View>

          {/* Badges */}
          {user.badges.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {visibleBadges.map(b => (
                <View key={b.id} style={{
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                  backgroundColor: b.unknown ? '#F59E0B18' : colors.background,
                  borderWidth: b.unknown ? 1 : 0,
                  borderColor: b.unknown ? '#F59E0B60' : 'transparent',
                }}>
                  <Text style={{ fontSize: 10, color: b.unknown ? '#F59E0B' : colors.textMuted, fontWeight: '500' }}>
                    {b.unknown ? `⚠ ${b.nameEs}` : b.nameEs}
                  </Text>
                </View>
              ))}
              {extraBadges > 0 && (
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.background }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>+{extraBadges}</Text>
                </View>
              )}
            </View>
          )}
        </Pressable>

        {/* Action bar */}
        <View style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: colors.background,
        }}>
          {/* Moderator toggle — OWNER only, non-self, non-owner target */}
          {isOwner && !isSelf && user.role !== 'OWNER' && (
            <Pressable
              onPress={() => onToggleMod(user)}
              disabled={togglingId === user.id}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 9,
                backgroundColor: pressed ? (user.role === 'MODERATOR' ? '#EF444410' : '#3B82F610') : 'transparent',
                borderRightWidth: 1, borderRightColor: colors.background,
              })}
            >
              {togglingId === user.id
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <>
                    {user.role === 'MODERATOR'
                      ? <ShieldOff size={14} color="#EF4444" />
                      : <Shield size={14} color="#3B82F6" />}
                    <Text style={{ fontSize: 11, fontWeight: '600', color: user.role === 'MODERATOR' ? '#EF4444' : '#3B82F6' }}>
                      {user.role === 'MODERATOR' ? 'Quitar Mod' : 'Hacer Mod'}
                    </Text>
                  </>}
            </Pressable>
          )}

          {/* Compensate — OWNER only */}
          {isOwner && (
            <Pressable
              onPress={() => onCompensate(user)}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 9,
                backgroundColor: pressed ? '#8B5CF610' : 'transparent',
                borderRightWidth: 1, borderRightColor: colors.background,
              })}
            >
              <Gift size={14} color="#8B5CF6" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#8B5CF6' }}>Compensar</Text>
            </Pressable>
          )}

          {/* Fix badges — OWNER only, only if has issues */}
          {isOwner && user.hasIssues && (
            <Pressable
              onPress={() => onFixBadges(user)}
              style={({ pressed }) => ({
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 4, paddingVertical: 9,
                backgroundColor: pressed ? '#F59E0B10' : 'transparent',
                borderRightWidth: 1, borderRightColor: colors.background,
              })}
            >
              <Wrench size={14} color="#F59E0B" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>Fix Badges</Text>
            </Pressable>
          )}

          {/* View detail — always visible */}
          <Pressable
            onPress={() => onViewDetail(user)}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 4, paddingVertical: 9,
              backgroundColor: pressed ? colors.primary + '10' : 'transparent',
            })}
          >
            <Users size={14} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>Ver</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Country flag helper ──────────────────────────────────────────────────────
function countryFlag(code: string): string {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('');
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminUsersScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const colors  = useThemeColors();
  const me      = useUser();
  const myId    = me?.id ?? '';
  const amOwner = me?.role === 'OWNER';

  // Data
  const [users,         setUsers]         = useState<AdminUserRow[]>([]);
  const [storeItems,    setStoreItems]    = useState<StoreItemSimple[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [loaded,        setLoaded]        = useState(false);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);

  // Filters
  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState<RoleFilter>('');
  const [activeOnly,    setActiveOnly]    = useState(false);
  const [issuesOnly,    setIssuesOnly]    = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);

  // Modals
  const [detailUser,    setDetailUser]    = useState<AdminUserRow | null>(null);
  const [compensateUser,setCompensateUser]= useState<AdminUserRow | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ user: AdminUserRow; target: 'USER' | 'MODERATOR' } | null>(null);

  // Compensate form
  const [compType,      setCompType]      = useState<'points' | 'item'>('points');
  const [compPoints,    setCompPoints]    = useState('');
  const [compItemId,    setCompItemId]    = useState('');
  const [compReason,    setCompReason]    = useState('');
  const [compLoading,   setCompLoading]   = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (q: string, opts?: {
    role?: RoleFilter; active?: boolean; issues?: boolean;
  }) => {
    if (!myId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim())              params.set('search',     q.trim());
      if (opts?.role)            params.set('role',       opts.role);
      if (opts?.active)          params.set('activeOnly', 'true');
      if (opts?.issues)          params.set('hasIssues',  'true');
      const qs = params.toString();
      const res = await fetch(`${BACKEND_URL}/api/admin/users${qs ? '?' + qs : ''}`, {
        headers: { 'X-User-Id': myId },
      });
      if (res.status === 403) {
        Alert.alert('Sin acceso', 'No tienes permisos para ver esta pantalla.');
        router.back();
        return;
      }
      const data = await res.json() as { users: AdminUserRow[] };
      setUsers(data.users ?? []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [myId, router]);

  const fetchStoreItems = useCallback(async () => {
    if (!myId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/store-items`, { headers: { 'X-User-Id': myId } });
      if (res.ok) {
        const data = await res.json() as { items: StoreItemSimple[] };
        setStoreItems(data.items ?? []);
      }
    } catch { /* non-critical */ }
  }, [myId]);

  useEffect(() => {
    fetchUsers('');
    fetchStoreItems();
  }, [fetchUsers, fetchStoreItems]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(text, { role: roleFilter, active: activeOnly, issues: issuesOnly }), 350);
  };

  const applyFilters = (r: RoleFilter, a: boolean, i: boolean) => {
    setRoleFilter(r); setActiveOnly(a); setIssuesOnly(i);
    fetchUsers(search, { role: r, active: a, issues: i });
    setShowFilters(false);
  };

  // ── Role toggle ────────────────────────────────────────────────────────────
  const handleToggleMod = (u: AdminUserRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = u.role === 'MODERATOR' ? 'USER' : 'MODERATOR';
    setConfirmToggle({ user: u, target });
  };

  const executeToggle = async () => {
    if (!confirmToggle) return;
    const { user, target } = confirmToggle;
    setConfirmToggle(null);
    setTogglingId(user.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
        body: JSON.stringify({ role: target }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        Alert.alert('Error', data.error ?? 'No se pudo cambiar el rol.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUsers(prev => prev.map(u2 => u2.id === user.id ? { ...u2, role: target } : u2));
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Fix badges ─────────────────────────────────────────────────────────────
  const handleFixBadges = async (u: AdminUserRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${u.id}/fix-badges`, {
        method: 'POST',
        headers: { 'X-User-Id': myId },
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) {
        Alert.alert('Error', data.error ?? 'Fix badges falló.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Fix Badges', data.message ?? 'Listo.');
      fetchUsers(search, { role: roleFilter, active: activeOnly, issues: issuesOnly });
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    }
  };

  // ── Compensate submit ──────────────────────────────────────────────────────
  const handleCompensateSubmit = async () => {
    if (!compensateUser) return;
    setCompLoading(true);
    try {
      const body: Record<string, unknown> = { type: compType, reason: compReason || undefined };
      if (compType === 'points') {
        const pts = parseInt(compPoints, 10);
        if (isNaN(pts) || pts < 1) {
          Alert.alert('Error', 'Ingresa una cantidad válida de puntos.');
          return;
        }
        body.points = pts;
      } else {
        if (!compItemId) {
          Alert.alert('Error', 'Selecciona un ítem.');
          return;
        }
        body.itemId = compItemId;
      }

      const res = await fetch(`${BACKEND_URL}/api/admin/users/${compensateUser.id}/compensate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': myId },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) {
        Alert.alert('Error', data.error ?? 'Compensación falló.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Compensación enviada', data.message ?? 'Listo.');
      setCompensateUser(null);
      setCompPoints(''); setCompItemId(''); setCompReason('');
      fetchUsers(search, { role: roleFilter, active: activeOnly, issues: issuesOnly });
    } catch {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setCompLoading(false);
    }
  };

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const activeFilterCount = [roleFilter !== '', activeOnly, issuesOnly].filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Header ── */}
      <View style={{
        paddingTop: insets.top + 12, paddingBottom: 10, paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.textMuted + '18',
        flexDirection: 'row', alignItems: 'center', gap: 10,
      }}>
        <View style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: '#3B82F618',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={20} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>
            Usuarios
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
            {loaded ? `${users.length} encontrados` : 'Cargando…'}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: colors.textMuted + '15',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={17} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* ── Search + filter bar ── */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', gap: 8 }}>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surface, borderRadius: 12,
          paddingHorizontal: 10, height: 40, gap: 6,
          borderWidth: 1, borderColor: colors.textMuted + '20',
        }}>
          <Search size={15} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Buscar nickname…"
            placeholderTextColor={colors.textMuted + '70'}
            style={{ flex: 1, fontSize: 14, color: colors.text }}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* Filter button */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFilters(true); }}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: activeFilterCount > 0 ? colors.primary : colors.surface,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: activeFilterCount > 0 ? colors.primary : colors.textMuted + '20',
          }}
        >
          <Filter size={16} color={activeFilterCount > 0 ? '#FFFFFF' : colors.textMuted} />
          {activeFilterCount > 0 && (
            <View style={{
              position: 'absolute', top: -3, right: -3,
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: '#EF4444',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {roleFilter !== '' && (
            <Pressable onPress={() => applyFilters('', activeOnly, issuesOnly)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>{roleFilter}</Text>
              <X size={10} color={colors.primary} />
            </Pressable>
          )}
          {activeOnly && (
            <Pressable onPress={() => applyFilters(roleFilter, false, issuesOnly)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#22C55E20' }}>
              <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '600' }}>Activos 7d</Text>
              <X size={10} color="#22C55E" />
            </Pressable>
          )}
          {issuesOnly && (
            <Pressable onPress={() => applyFilters(roleFilter, activeOnly, false)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F59E0B20' }}>
              <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>Con problemas</Text>
              <X size={10} color="#F59E0B" />
            </Pressable>
          )}
        </View>
      )}

      {/* ── List ── */}
      {!loaded ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : users.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Users size={48} color={colors.textMuted + '40'} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            {search || activeFilterCount > 0
              ? 'Sin resultados para estos filtros.'
              : 'No hay usuarios todavía.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              isOwner={amOwner}
              currentUserId={myId}
              onToggleMod={handleToggleMod}
              onViewDetail={setDetailUser}
              onCompensate={u => { setCompensateUser(u); setCompType('points'); setCompPoints(''); setCompItemId(''); setCompReason(''); }}
              onFixBadges={handleFixBadges}
              togglingId={togglingId}
              colors={colors}
            />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FILTER SHEET
      ════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showFilters} transparent animationType="none" onRequestClose={() => setShowFilters(false)}>
        <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowFilters(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(200)}
            exiting={SlideOutDown.duration(200)}
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '40', alignSelf: 'center', marginTop: 12, marginBottom: 20 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 }}>Filtros</Text>

            {/* Role filter */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Rol</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(['', 'USER', 'MODERATOR', 'OWNER'] as RoleFilter[]).map(r => (
                <Pressable
                  key={r}
                  onPress={() => setRoleFilter(r)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: roleFilter === r ? colors.primary : colors.surface,
                    borderWidth: 1, borderColor: roleFilter === r ? colors.primary : colors.textMuted + '25',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: roleFilter === r ? '#FFF' : colors.textMuted }}>
                    {r === '' ? 'Todos' : r}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Toggle filters */}
            <View style={{ gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Activos últimos 7 días', value: activeOnly, set: setActiveOnly, color: '#22C55E' },
                { label: 'Solo con problemas', value: issuesOnly, set: setIssuesOnly, color: '#F59E0B' },
              ].map(f => (
                <Pressable
                  key={f.label}
                  onPress={() => f.set(!f.value)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 12, borderRadius: 12, backgroundColor: colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{f.label}</Text>
                  <View style={{
                    width: 44, height: 24, borderRadius: 12,
                    backgroundColor: f.value ? f.color : colors.textMuted + '30',
                    justifyContent: 'center', paddingHorizontal: 2,
                    alignItems: f.value ? 'flex-end' : 'flex-start',
                  }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' }} />
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => applyFilters(roleFilter, activeOnly, issuesOnly)}
              style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>Aplicar filtros</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal visible={!!detailUser} transparent animationType="fade" onRequestClose={() => setDetailUser(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }} onPress={() => setDetailUser(null)}>
          {detailUser && (
            <Animated.View entering={FadeIn.duration(200)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{detailUser.nickname}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{detailUser.id}</Text>
                </View>
                <RoleChip role={detailUser.role} />
              </View>

              {[
                ['Racha actual', `${detailUser.streakCurrent} días`],
                ['Mejor racha', `${detailUser.streakBest} días`],
                ['Devocionales', `${detailUser.devotionalsCompleted} totales`],
                ['Últimos 7 días', `${detailUser.completionsLast7Days} devocionales`],
                ['Puntos', `${detailUser.points.toLocaleString()}`],
                ['País', detailUser.countryCode ?? '—'],
                ['Creado', new Date(detailUser.createdAt).toLocaleDateString('es')],
                ['Último activo', detailUser.lastActiveAt ? new Date(detailUser.lastActiveAt).toLocaleDateString('es') : '—'],
              ].map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.background }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{label}</Text>
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{value}</Text>
                </View>
              ))}

              {/* Badges */}
              {detailUser.badges.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Insignias</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {detailUser.badges.map(b => (
                      <View key={b.id} style={{
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                        backgroundColor: b.unknown ? '#F59E0B18' : colors.background,
                        borderWidth: b.unknown ? 1 : 0,
                        borderColor: '#F59E0B60',
                      }}>
                        <Text style={{ fontSize: 12, color: b.unknown ? '#F59E0B' : colors.text, fontWeight: '500' }}>
                          {b.unknown ? `⚠ ${b.nameEs}` : b.nameEs}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Pressable onPress={() => setDetailUser(null)} style={{ marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>Cerrar</Text>
              </Pressable>
            </Animated.View>
          )}
        </Pressable>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          COMPENSATE MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal visible={!!compensateUser} transparent animationType="fade" onRequestClose={() => setCompensateUser(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }} onPress={() => setCompensateUser(null)}>
          <Pressable onPress={e => e.stopPropagation()}>
            {compensateUser && (
              <Animated.View entering={FadeIn.duration(200)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
                  Compensar a {compensateUser.nickname}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
                  Concede puntos o un ítem de la tienda.
                </Text>

                {/* Type selector */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {(['points', 'item'] as const).map(t => (
                    <Pressable
                      key={t}
                      onPress={() => setCompType(t)}
                      style={{
                        flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                        backgroundColor: compType === t ? colors.primary : colors.background,
                        borderWidth: 1, borderColor: compType === t ? colors.primary : colors.textMuted + '25',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: compType === t ? '#FFF' : colors.textMuted }}>
                        {t === 'points' ? 'Puntos' : 'Ítem'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {compType === 'points' ? (
                  <TextInput
                    value={compPoints}
                    onChangeText={setCompPoints}
                    placeholder="Cantidad de puntos (ej: 500)"
                    placeholderTextColor={colors.textMuted + '70'}
                    keyboardType="number-pad"
                    style={{
                      backgroundColor: colors.background, borderRadius: 10, padding: 12,
                      fontSize: 15, color: colors.text, marginBottom: 12,
                    }}
                  />
                ) : (
                  <ScrollView style={{ maxHeight: 160, marginBottom: 12 }} nestedScrollEnabled>
                    {storeItems.map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => setCompItemId(item.id)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4,
                          backgroundColor: compItemId === item.id ? colors.primary + '18' : colors.background,
                          borderWidth: 1, borderColor: compItemId === item.id ? colors.primary + '50' : 'transparent',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{item.nameEs}</Text>
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>{item.type} · {item.rarity}</Text>
                        </View>
                        {compItemId === item.id && <Check size={14} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                <TextInput
                  value={compReason}
                  onChangeText={setCompReason}
                  placeholder="Razón (opcional)"
                  placeholderTextColor={colors.textMuted + '70'}
                  style={{
                    backgroundColor: colors.background, borderRadius: 10, padding: 12,
                    fontSize: 14, color: colors.text, marginBottom: 16,
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => setCompensateUser(null)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCompensateSubmit}
                    disabled={compLoading}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: compLoading ? colors.textMuted + '40' : '#8B5CF6', alignItems: 'center' }}
                  >
                    {compLoading
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={{ color: '#FFF', fontWeight: '700' }}>Enviar</Text>}
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          CONFIRM TOGGLE MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal visible={!!confirmToggle} transparent animationType="fade" onRequestClose={() => setConfirmToggle(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={() => setConfirmToggle(null)}>
          {confirmToggle && (
            <Animated.View entering={FadeIn.duration(200)} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
              <View style={{ alignItems: 'center', marginBottom: 14 }}>
                {confirmToggle.target === 'MODERATOR'
                  ? <Shield size={40} color="#3B82F6" />
                  : <ShieldOff size={40} color="#EF4444" />}
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                {confirmToggle.target === 'MODERATOR' ? 'Otorgar MODERATOR' : 'Revocar MODERATOR'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 20 }}>
                {confirmToggle.target === 'MODERATOR'
                  ? `¿Otorgar permisos de moderador a ${confirmToggle.user.nickname}?`
                  : `¿Revocar permisos de ${confirmToggle.user.nickname}? Volverá a ser usuario normal.`}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirmToggle(null)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={executeToggle} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: confirmToggle.target === 'MODERATOR' ? '#3B82F6' : '#EF4444', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{confirmToggle.target === 'MODERATOR' ? 'Otorgar' : 'Revocar'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </Modal>

    </View>
  );
}
